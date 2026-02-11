import httpx
import logging
from .db import get_setting

logger = logging.getLogger(__name__)

async def send_slack_notification(message: str):
    webhook_url = get_setting("slack_webhook_url")
    if not webhook_url:
        return
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(webhook_url, json={"text": message})
            if resp.status_code >= 400:
                logger.error(f"Slack notification failed: {resp.text}")
    except Exception as e:
        logger.error(f"Error sending Slack notification: {e}")

async def check_for_spikes(report_id_db: int):
    """
    Check if a newly imported report represents a spike in failures.
    Called after save_report.
    """
    from .db import get_report_detail
    report = get_report_detail(report_id_db)
    if not report:
        return

    # Algorithm: If total failures > 10 and failure rate > 25%
    total = 0
    fail = 0
    for rec in report['records']:
        count = rec['count']
        total += count
        if rec['disposition'] and rec['disposition'] != 'none':
            fail += count
    
    if total > 10 and (fail / total) > 0.25:
        msg = (
            f"🚨 *DMARC Alert*: High failure rate detected!\n"
            f"*Domain*: {report['domain']}\n"
            f"*Org*: {report['org_name']}\n"
            f"*Failure Rate*: {(fail/total)*100:.1f}% ({fail}/{total} emails)\n"
            f"View details: <http://localhost:5173/reports/{report_id_db}>"
        )
        await send_slack_notification(msg)
