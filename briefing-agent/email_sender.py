import html
import os
import re
import smtplib
import logging
from datetime import datetime
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

#maps section names to emojis for the email header — unknown sections fall back to 📋
TOPIC_EMOJIS = {
    #existing
    "Markets": "\U0001f4ca",
    "Tech": "\U0001f4bb",
    "AI": "\U0001f916",
    "Crypto": "\U0001f4b0",
    "Geopolitics": "\U0001f30d",
    "Politics": "\U0001f5f3",
    "Business": "\U0001f4bc",
    #new expected sections from dynamic synthesis
    "Tech & AI": "\U0001f916",
    "Private Equity": "\U0001f4b8",
    "Energy": "\u26a1",
    "Health": "\U0001f3e5",
    "Real Estate": "\U0001f3e0",
    "Defense": "\U0001f6e1",
    "Economy": "\U0001f4c9",
    "Finance": "\U0001f4b3",
    "International": "\U0001f310",
    "Media": "\U0001f4f0",
    "Retail": "\U0001f6d2",
}


def _send_via_smtp(msg: MIMEText, sender: str, app_password: str, to: str) -> bool:
    for attempt in range(2):  #1 initial + 1 retry
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


def send_digest(sections: dict[str, str], recipients: list[str], sources: dict[str, str] | None = None) -> bool:
    """Send a single consolidated digest email with all topic sections.

    Args:
        sections: Mapping of topic name → bullet summary.
        recipients: List of recipient email addresses.
        sources: Optional mapping of topic name → source attribution string.

    Returns:
        True if all sends succeeded, False if any failed.
    """
    app_password = os.environ.get("GMAIL_APP_PASSWORD", "")
    sender = os.environ.get("GMAIL_SENDER", "")

    if not all([app_password, sender]):
        logger.error("Gmail SMTP credentials not fully configured in environment")
        return False

    date_str = datetime.now().strftime("%b %-d")
    subject = f"\u2600\ufe0f Morning Briefing \u2014 {date_str}"

    sources = sources or {}
    #build one html block per section — each gets a header and a bullet list
    html_parts = []
    for topic_name, summary in sections.items():
        emoji = TOPIC_EMOJIS.get(topic_name, "\U0001f4cb")
        header = f'<h3 style="color: #555; font-size: 13px; letter-spacing: 0.08em; margin: 28px 0 4px; text-transform: uppercase;">{emoji} {topic_name}</h3>'
        #render source attribution as small muted text below the section header
        source_html = ""
        if topic_name in sources:
            escaped_sources = html.escape(sources[topic_name])
            source_html = f'<p style="color: #999; font-size: 11px; margin: 0 0 8px; font-style: italic;">via {escaped_sources}</p>'
        items = []
        for line in summary.split("\n"):
            if line.startswith("•"):
                line = line[1:].strip()
                #convert **bold** markdown to html bold tags
                line = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', line)
                #escape html in non-bold segments to prevent injection
                parts = re.split(r'(<b>.*?</b>)', line)
                escaped = "".join(
                    p if p.startswith("<b>") else html.escape(p)
                    for p in parts
                )
                items.append(f'  <li style="margin-bottom: 10px;">{escaped}</li>')
        if items:
            ul = '<ul style="padding-left: 20px; margin: 0 0 8px;">\n' + "\n".join(items) + "\n</ul>"
            html_parts.append(header + "\n" + source_html + "\n" + ul)

    html_body = (
        '<html><body style="font-family: sans-serif; max-width: 620px; margin: 0 auto;'
        ' color: #1a1a1a; font-size: 15px; line-height: 1.5;">\n\n'
        + "\n\n".join(html_parts)
        + "\n\n</body></html>"
    )

    #send to each recipient independently so one failure doesn't block others
    all_success = True
    for to in recipients:
        msg = MIMEText(html_body, "html")
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = to
        if not _send_via_smtp(msg, sender, app_password, to):
            all_success = False

    return all_success
