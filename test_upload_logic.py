import tempfile
import sys
import os
from pathlib import Path

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from backend.dmarc_lib.parser import parse_report
from backend.dmarc_lib.db import save_report, init_db

def test_upload_logic():
    init_db()
    xml_content = """<?xml version="1.0" encoding="UTF-8"?>
<feedback>
  <report_metadata>
    <org_name>Test Org</org_name>
    <email>ops@example.com</email>
    <report_id>upload-logic-test</report_id>
    <date_range>
      <begin>1700000000</begin>
      <end>1700003600</end>
    </date_range>
  </report_metadata>
  <policy_published>
    <domain>example.com</domain>
    <p>none</p>
    <sp>none</sp>
    <pct>100</pct>
  </policy_published>
  <record>
    <row>
      <source_ip>1.2.3.4</source_ip>
      <count>1</count>
      <policy_evaluated>
        <disposition>none</disposition>
        <dkim>pass</dkim>
        <spf>pass</spf>
      </policy_evaluated>
    </row>
  </record>
</feedback>
"""

    with tempfile.TemporaryDirectory() as temp_dir:
        dest = Path(temp_dir) / "upload-logic-test.xml"
        dest.write_text(xml_content, encoding="utf-8")

        feedback = parse_report(dest)
        report_id = save_report(feedback)
        assert report_id is not None
