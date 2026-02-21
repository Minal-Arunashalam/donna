import os
import smtplib
import logging
from datetime import datetime
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

TOPIC_EMOJIS = {
    "Markets": "\U0001f4ca",
    "Tech": "\U0001f4bb",
    "AI": "\U0001f916",
    "Crypto": "\U0001f4b0",
    "Geopolitics": "\U0001f30d",
    "Politics": "\U0001f5f3",
    "Business": "\U0001f4bc",
}


def _send_via_smtp(msg: MIMEText, sender: str, app_password: str, to: str) -> bool:
    for attempt in range(2):  # 1 initial + 1 retry
        try:
            with smtplib.SMTP("smtp.gmail.com", 587) as server:
                server.starttls()
                server.login(sender, app_password)
                server.send_message(msg)
            logger.info(f"Email sent to {to} | Subject: {msg['Subject']}")
            return True
        except smtplib.SMTPException as e:
            logger.warning(f"SMTP error (attempt {attempt + 1}): {e}")
            if attempt == 0:
                logger.info("Retrying email send...")
                continue
            logger.error(f"Email delivery failed to {to} after retry: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending email to {to}: {e}")
            return False
    return False


def send_email(to: str, body: str, topic_name: str = "") -> bool:
    """Send a briefing email via Gmail SMTP.

    Args:
        to: Recipient email address.
        body: Email body text.
        topic_name: Topic name used in the subject line and header.

    Returns:
        True if sent successfully, False otherwise.
    """
    app_password = os.environ.get("GMAIL_APP_PASSWORD", "")
    sender = os.environ.get("GMAIL_SENDER", "")

    if not all([app_password, sender]):
        logger.error("Gmail SMTP credentials not fully configured in environment")
        return False

    emoji = TOPIC_EMOJIS.get(topic_name, "\U0001f4cb")
    subject = f"{emoji} {topic_name} briefing"

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to

    return _send_via_smtp(msg, sender, app_password, to)


def send_digest(sections: dict[str, str], recipients: list[str]) -> bool:
    """Send a single consolidated digest email with all topic sections.

    Args:
        sections: Mapping of topic name → bullet summary.
        recipients: List of recipient email addresses.

    Returns:
        True if all sends succeeded, False if any failed.
    """
    app_password = os.environ.get("GMAIL_APP_PASSWORD", "")
    sender = os.environ.get("GMAIL_SENDER", "")

    if not all([app_password, sender]):
        logger.error("Gmail SMTP credentials not fully configured in environment")
        return False

    date_str = datetime.now().strftime("%b %-d")
    subject = f"\u2600\ufe0f Donna \u2014 {date_str}"

    body_parts = []
    for topic_name, summary in sections.items():
        emoji = TOPIC_EMOJIS.get(topic_name, "\U0001f4cb")
        header = f"\u2500\u2500 {emoji} {topic_name.upper()} \u2500\u2500"
        body_parts.append(f"{header}\n{summary}")

    body = "\n\n".join(body_parts)

    all_success = True
    for to in recipients:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = to
        if not _send_via_smtp(msg, sender, app_password, to):
            all_success = False

    return all_success
