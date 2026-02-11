import pytest
from pathlib import Path
from backend.dmarc_lib.parser import parse_report
import gzip
import zipfile
import io

@pytest.fixture
def sample_xml():
    return """<?xml version="1.0" encoding="UTF-8" ?>
<feedback>
  <report_metadata>
    <org_name>Google Inc.</org_name>
    <email>noreply-dmarc-support@google.com</email>
    <report_id>123456789</report_id>
    <date_range>
      <begin>1704067200</begin>
      <end>1704153599</end>
    </date_range>
  </report_metadata>
  <policy_published>
    <domain>example.com</domain>
    <adkim>r</adkim>
    <aspf>r</aspf>
    <p>quarantine</p>
    <sp>quarantine</sp>
    <pct>100</pct>
  </policy_published>
  <record>
    <row>
      <source_ip>1.2.3.4</source_ip>
      <count>10</count>
      <policy_evaluated>
        <disposition>none</disposition>
        <dkim>pass</dkim>
        <spf>pass</spf>
      </policy_evaluated>
    </row>
    <identifiers>
      <header_from>example.com</header_from>
    </identifiers>
    <auth_results>
      <dkim>
        <domain>example.com</domain>
        <result>pass</result>
        <selector>s1</selector>
      </dkim>
      <spf>
        <domain>example.com</domain>
        <scope>mfrom</scope>
        <result>pass</result>
      </spf>
    </auth_results>
  </record>
</feedback>
"""

def test_parse_plain_xml(tmp_path, sample_xml):
    p = tmp_path / "report.xml"
    p.write_text(sample_xml)
    data = parse_report(p)
    
    assert data['metadata']['org_name'] == "Google Inc."
    assert data['metadata']['report_id'] == "123456789"
    assert data['policy']['domain'] == "example.com"
    assert len(data['records']) == 1
    assert data['records'][0]['source_ip'] == "1.2.3.4"
    assert data['records'][0]['count'] == 10

def test_parse_gz_xml(tmp_path, sample_xml):
    p = tmp_path / "report.xml.gz"
    with gzip.open(p, "wb") as f:
        f.write(sample_xml.encode("utf-8"))
    
    data = parse_report(p)
    assert data['metadata']['org_name'] == "Google Inc."

def test_parse_zip_xml(tmp_path, sample_xml):
    p = tmp_path / "report.zip"
    with zipfile.ZipFile(p, "w") as z:
        z.writestr("inner.xml", sample_xml)
    
    data = parse_report(p)
    assert data['metadata']['org_name'] == "Google Inc."

def test_parse_malformed_xml(tmp_path):
    p = tmp_path / "bad.xml"
    p.write_text("<feedback><bad")
    with pytest.raises(Exception):
        parse_report(p)

def test_parse_oversized_report(tmp_path):
    p = tmp_path / "big.xml"
    p.write_text("this is more than 10 bytes")
    # Content is 26 bytes, max is 10
    with pytest.raises(ValueError, match="Report exceeds maximum allowed size"):
        parse_report(p, max_bytes=10)
