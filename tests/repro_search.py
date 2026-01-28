import httpx

def test_search():
    base_url = "http://localhost:8000/api/reports"
    
    # 1. Get all reports to find a valid search term
    r = httpx.get(base_url)
    data = r.json()
    if not data['items']:
        print("No reports found to test search.")
        return
        
    sample = data['items'][0]
    org = sample['org_name']
    report_id = sample['report_id']
    domain = sample['domain']
    
    print(f"Testing search for Org: {org}")
    r = httpx.get(f"{base_url}?search={org}")
    print(f"Status: {r.status_code}")
    try:
        print(f"Result count: {len(r.json()['items'])}")
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        print(f"Response: {r.text}")
    
    print(f"Testing search for ID: {report_id}")
    r = httpx.get(f"{base_url}?search={report_id}")
    print(f"Status: {r.status_code}")
    try:
        print(f"Result count: {len(r.json()['items'])}")
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        print(f"Response: {r.text}")


    print(f"Testing search for Domain (partial): {domain[:5]}")
    r = httpx.get(f"{base_url}?search={domain[:5]}")
    print(f"Result count (expected 0 if domain search not supported): {len(r.json()['items'])}")

if __name__ == "__main__":
    test_search()
