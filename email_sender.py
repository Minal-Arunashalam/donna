import os
import smtplib
import logging
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

TOPIC_EMOJIS = {
    "Markets": "\U0001f4ca",
    "Tech": "\U0001f4bb",
    "AI": "\U0001f916",
    "Crypto": "\U0001f4b0",
    "Geopolitics": "\U0001f30d",
}


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

    for attempt in range(2):  # 1 initial + 1 retry
        try:
            with smtplib.SMTP("smtp.gmail.com", 587) as server:
                server.starttls()
                server.login(sender, app_password)
                server.send_message(msg)
            logger.info(f"Email sent to {to} | Subject: {subject}")
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
