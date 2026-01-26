import xmltodict
import gzip
import zipfile
import os

def parse_report(file_path):
    """
    Parses a DMARC report XML file (or .gz/.zip archive).
    Returns a dictionary with report metadata and records.
    """
    
    content = None
    
    # Handle different file types
    if str(file_path).endswith('.gz'):
        with gzip.open(file_path, 'rb') as f:
            content = f.read()
    elif str(file_path).endswith('.zip'):
        with zipfile.ZipFile(file_path, 'r') as z:
            # Assume first XML file in zip is the report
            for name in z.namelist():
                if name.endswith('.xml'):
                    with z.open(name) as f:
                        content = f.read()
                    break
    else:
        with open(file_path, 'rb') as f:
            content = f.read()
            
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
