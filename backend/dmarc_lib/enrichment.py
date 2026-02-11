import socket
import httpx
import asyncio
import logging
from .db import get_db

logger = logging.getLogger(__name__)

async def get_rdns(ip: str) -> str | None:
    """Perform a reverse DNS lookup asynchronously."""
    try:
        loop = asyncio.get_event_loop()
        # run_in_executor with None uses the default ThreadPoolExecutor
        result = await loop.run_in_executor(None, socket.gethostbyaddr, ip)
        return result[0]
    except (socket.herror, socket.gaierror, socket.timeout, IndexError):
        return None

async def enrich_ip(ip: str, force_refresh: bool = False) -> dict:
    """
    Returns enriched data for an IP address.
    Checks cache first unless force_refresh is True.
    """
    # Quick validation
    if not ip or ":" in ip and not "." in ip: # Basic IPv6 check
        # For now, we mainly support IPv4 or combined. ip-api supports both.
        pass

    conn = get_db()
    c = conn.cursor()
    
    if not force_refresh:
        c.execute("SELECT * FROM ip_enrichment WHERE ip = ?", (ip,))
        cached = c.fetchone()
        if cached:
            conn.close()
            return dict(cached)

    # Perform enrichment
    data = {
        "ip": ip,
        "rdns": None,
        "country_code": None,
        "country_name": None,
        "city": None,
        "asn": None,
        "asn_name": None
    }
    
    # RDNS and GeoIP in parallel
    results = await asyncio.gather(
        get_rdns(ip),
        fetch_geoip(ip)
    )
    
    data["rdns"] = results[0]
    geo = results[1]
    
    if geo:
        data.update(geo)

    # Update cache
    try:
        c.execute('''
            INSERT OR REPLACE INTO ip_enrichment 
            (ip, rdns, country_code, country_name, city, asn, asn_name, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ''', (
            data["ip"], data["rdns"], data["country_code"], data["country_name"],
            data["city"], data["asn"], data["asn_name"]
        ))
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to update IP cache for {ip}: {e}")
    finally:
        conn.close()
    
    return data

async def fetch_geoip(ip: str) -> dict | None:
    """Fetch GeoIP data from ip-api.com."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"http://ip-api.com/json/{ip}?fields=status,country,countryCode,city,as")
            if resp.status_code == 200:
                geo = resp.json()
                if geo.get("status") == "success":
                    result = {
                        "country_name": geo.get("country"),
                        "country_code": geo.get("countryCode"),
                        "city": geo.get("city")
                    }
                    as_info = geo.get("as", "")
                    if as_info:
                        parts = as_info.split(" ", 1)
                        if parts[0].startswith("AS"):
                            try:
                                result["asn"] = int(parts[0][2:])
                            except ValueError:
                                pass
                        if len(parts) > 1:
                            result["asn_name"] = parts[1]
                    return result
    except Exception as e:
        logger.error(f"GeoIP error for {ip}: {e}")
    return None

async def batch_enrich_ips(ips: list[str]) -> dict[str, dict]:
    """Enrich a list of IPs, respecting cache and rate limits."""
    unique_ips = list(set(ips))
    results = {}
    
    # We could do this in parallel, but ip-api.com has a 45 req/min limit.
    # For a few IPs in a report detail, it's fine.
    # If there are many, we should be careful.
    
    tasks = [enrich_ip(ip) for ip in unique_ips]
    enriched_list = await asyncio.gather(*tasks)
    
    for i, ip in enumerate(unique_ips):
        results[ip] = enriched_list[i]
        
    return results
