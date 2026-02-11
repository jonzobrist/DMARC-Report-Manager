import imaplib
import email
import logging
import os
from pathlib import Path
from typing import List
from .db import get_setting

logger = logging.getLogger(__name__)

# Re-use UPLOAD_DIR logic from api if possible, or just define here
UPLOAD_DIR = Path("backend/uploads")

def fetch_dmarc_reports() -> List[str]:
    """
    Connect to IMAP and download DMARC attachments.
    Returns a list of saved file names.
    """
    host = get_setting("imap_host")
    user = get_setting("imap_user")
    pwd = get_setting("imap_pass")
    port = get_setting("imap_port", 993)
    use_ssl = get_setting("imap_use_ssl", True)

    if not all([host, user, pwd]):
        logger.warning("IMAP settings incomplete.")
        return []

    saved_files = []
    try:
        if use_ssl:
            mail = imaplib.IMAP4_SSL(host, port)
        else:
            mail = imaplib.IMAP4(host, port)
        
        mail.login(user, pwd)
        mail.select("inbox")

        # Search for unread emails with "dmarc" in subject or attachments
        # We'll search for all and filter in python for better reliability
        status, messages = mail.search(None, 'UNSEEN')
        if status != "OK":
            return []

        for num in messages[0].split():
            status, data = mail.fetch(num, '(RFC822)')
            if status != "OK":
                continue
            
            raw_email = data[0][1]
            msg = email.message_from_bytes(raw_email)
            
            for part in msg.walk():
                if part.get_content_maintype() == 'multipart':
                    continue
                if part.get('Content-Disposition') is None:
                    continue
                
                filename = part.get_filename()
                if filename:
                    lower_fn = filename.lower()
                    if lower_fn.endswith(('.xml', '.zip', '.gz', '.xz')):
                        # Save the attachment
                        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
                        filepath = UPLOAD_DIR / filename
                        with open(filepath, 'wb') as f:
                            f.write(part.get_payload(decode=True))
                        saved_files.append(filename)
                        logger.info(f"Downloaded DMARC report from email: {filename}")

        mail.logout()
    except Exception as e:
        logger.error(f"Failed to fetch DMARC reports via IMAP: {e}")

    return saved_files
