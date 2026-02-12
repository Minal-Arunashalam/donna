import imaplib
import email
from email.header import decode_header
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging
import os

logger = logging.getLogger(__name__)


@dataclass
class Email:
    subject: str
    sender: str
    html_body: str


def _decode_header_value(value: str) -> str:
    """Decode an email header value that may be encoded."""
    parts = decode_header(value)
    decoded = []
    for part, charset in parts:
        if isinstance(part, bytes):
            decoded.append(part.decode(charset or "utf-8", errors="replace"))
        else:
            decoded.append(part)
    return "".join(decoded)


def _extract_html_body(msg: email.message.Message) -> str:
    """Extract HTML body from a MIME message, falling back to plain text."""
    if msg.is_multipart():
        html_parts = []
        text_parts = []
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type == "text/html":
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    html_parts.append(payload.decode(charset, errors="replace"))
            elif content_type == "text/plain":
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    text_parts.append(payload.decode(charset, errors="replace"))
        if html_parts:
            return html_parts[0]
        if text_parts:
            return text_parts[0]
        return ""
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            return payload.decode(charset, errors="replace")
        return ""


def fetch_newsletters(
    gmail_config: dict,
    sender_addresses: list[str],
    since_hours: int = 24,
) -> list[Email]:
    """Fetch emails from specified senders within the last since_hours.

    Args:
        gmail_config: Dict with 'email' and 'imap_server' keys.
        sender_addresses: List of sender email addresses to search for.
        since_hours: How far back to search (default 24 hours).

    Returns:
        List of Email objects with subject, sender, and html_body.
    """
    app_password = os.environ.get("GMAIL_APP_PASSWORD", "")
    if not app_password:
        logger.error("GMAIL_APP_PASSWORD not set in environment")
        return []

    emails = []
    since_date = (datetime.now() - timedelta(hours=since_hours)).strftime("%d-%b-%Y")

    try:
        mail = imaplib.IMAP4_SSL(gmail_config["imap_server"])
        mail.login(gmail_config["email"], app_password)
        mail.select("INBOX", readonly=True)

        for sender in sender_addresses:
            search_criteria = f'(FROM "{sender}" SINCE {since_date})'
            logger.info(f"Searching: {search_criteria}")

            status, message_ids = mail.search(None, search_criteria)
            if status != "OK" or not message_ids[0]:
                logger.info(f"No emails found from {sender}")
                continue

            for msg_id in message_ids[0].split():
                status, msg_data = mail.fetch(msg_id, "(RFC822)")
                if status != "OK":
                    logger.warning(f"Failed to fetch message {msg_id}")
                    continue

                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)

                subject = _decode_header_value(msg.get("Subject", ""))
                from_addr = _decode_header_value(msg.get("From", ""))
                html_body = _extract_html_body(msg)

                if html_body:
                    emails.append(Email(
                        subject=subject,
                        sender=from_addr,
                        html_body=html_body,
                    ))
                    logger.info(f"Fetched: {subject} from {from_addr}")
                else:
                    logger.warning(f"No body found for: {subject}")

        mail.logout()

    except imaplib.IMAP4.error as e:
        logger.error(f"IMAP error: {e}")
    except Exception as e:
        logger.error(f"Error fetching emails: {e}")

    return emails
