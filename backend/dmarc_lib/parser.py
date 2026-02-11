import xmltodict
import gzip
import zipfile
import os
import lzma

MAX_REPORT_BYTES = int(os.environ.get("DMARC_MAX_REPORT_BYTES", str(20 * 1024 * 1024)))

def _read_with_limit(stream, max_bytes: int) -> bytes:
    chunks = []
    total = 0
    while True:
        chunk = stream.read(1024 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise ValueError("Report exceeds maximum allowed size")
        chunks.append(chunk)
    return b"".join(chunks)

def parse_report(file_path, max_bytes: int = MAX_REPORT_BYTES):
    """
    Parses a DMARC report XML file (or .gz/.zip archive).
    Returns a dictionary with report metadata and records.
    """
    
    content = None
    
    # Handle different file types
    file_path_str = str(file_path)
    if file_path_str.endswith(".gz"):
        with gzip.open(file_path, "rb") as f:
            content = _read_with_limit(f, max_bytes)
    elif file_path_str.endswith(".xz"):
        with lzma.open(file_path, "rb") as f:
            content = _read_with_limit(f, max_bytes)
    elif file_path_str.endswith(".zip"):
        with zipfile.ZipFile(file_path, "r") as z:
            # Assume first XML file in zip is the report
            xml_name = None
            for name in z.namelist():
                if name.endswith(".xml"):
                    xml_name = name
                    break
            if not xml_name:
                raise ValueError("No XML file found in zip archive")
            info = z.getinfo(xml_name)
            if info.file_size > max_bytes:
                raise ValueError("Report exceeds maximum allowed size")
            with z.open(xml_name) as f:
                content = _read_with_limit(f, max_bytes)
    else:
        if os.path.getsize(file_path_str) > max_bytes:
            raise ValueError("Report exceeds maximum allowed size")
        with open(file_path, "rb") as f:
            content = _read_with_limit(f, max_bytes)
            
    if not content:
        raise ValueError("Could not read content from file")

    data = xmltodict.parse(content)
    
    # Navigate the structure (depending on XML variance, this might need robustness)
    # Generic DMARC XML structure: feedback > report_metadata, policy_published, record[]
    
    feedback = data.get('feedback', {})
    report_metadata = feedback.get('report_metadata', {})
    policy_published = feedback.get('policy_published', {})
    records_raw = feedback.get('record', [])
    
    # xmltodict returns a dict if single child, list if multiple. Normalize to list.
    if isinstance(records_raw, dict):
        records = [records_raw]
    else:
        records = records_raw
        
    parsed_data = {
        'metadata': {
            'org_name': report_metadata.get('org_name'),
            'email': report_metadata.get('email'),
            'report_id': report_metadata.get('report_id'),
            'date_range_begin': report_metadata.get('date_range', {}).get('begin'),
            'date_range_end': report_metadata.get('date_range', {}).get('end'),
        },
        'policy': {
            'domain': policy_published.get('domain'),
            'p': policy_published.get('p'),
            'sp': policy_published.get('sp'),
            'pct': policy_published.get('pct'),
        },
        'records': []
    }
    
    for rec in records:
        row = rec.get('row', {})
        policy_eval = row.get('policy_evaluated', {})
        
        parsed_data['records'].append({
            'source_ip': row.get('source_ip'),
            'count': int(row.get('count', 0)),
            'disposition': policy_eval.get('disposition'),
            'dkim': policy_eval.get('dkim'),
            'spf': policy_eval.get('spf'),
            # You could add other authentication results here if needed
        })
        
    return parsed_data
