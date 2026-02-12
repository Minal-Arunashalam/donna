import os
import logging
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

logger = logging.getLogger(__name__)

TOPIC_EMOJIS = {
    "Markets": "\U0001f4ca",
    "Tech": "\U0001f4bb",
    "AI": "\U0001f916",
    "Crypto": "\U0001f4b0",
    "Geopolitics": "\U0001f30d",
}


def send_sms(to: str, body: str, topic_name: str = "") -> bool:
    """Send an SMS via Twilio.

    Args:
        to: Recipient phone number (E.164 format).
        body: SMS body text.
        topic_name: Topic name for the header line.

    Returns:
        True if sent successfully, False otherwise.
    """
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "")
    from_number = os.environ.get("TWILIO_FROM_NUMBER", "")

    if not all([account_sid, auth_token, from_number]):
        logger.error("Twilio credentials not fully configured in environment")
        return False

    # Prepend topic header
    emoji = TOPIC_EMOJIS.get(topic_name, "\U0001f4cb")
    header = f"{emoji} {topic_name.upper()}"
    full_body = f"{header}\n\n{body}"

    client = Client(account_sid, auth_token)

    for attempt in range(2):  # 1 initial + 1 retry
        try:
            message = client.messages.create(
                body=full_body,
                from_=from_number,
                to=to,
            )
            logger.info(f"SMS sent to {to} | SID: {message.sid}")
            return True
        except TwilioRestException as e:
            logger.warning(f"Twilio error (attempt {attempt + 1}): {e}")
            if attempt == 0:
                logger.info("Retrying SMS send...")
                continue
            logger.error(f"SMS delivery failed to {to} after retry: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending SMS to {to}: {e}")
            return False

    return False
