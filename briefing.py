#!/usr/bin/env python3
"""Donna — Autonomous Briefing Agent.

Reads Gmail newsletters, groups by topic, summarizes via Claude,
and delivers one SMS per topic via Twilio.
"""

import sys
import logging
import yaml
from dotenv import load_dotenv

from gmail_reader import fetch_newsletters
from parser import extract_text
from summarizer import summarize_topic
from sms_sender import send_sms

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("briefing")


def load_config(path: str = "config.yaml") -> dict:
    with open(path) as f:
        return yaml.safe_load(f)


def run():
    load_dotenv()
    config = load_config()

    gmail_config = config["gmail"]
    llm_config = config.get("llm", {})
    model = llm_config.get("model", "claude-haiku-4-5-20251001")
    max_bullets = llm_config.get("max_bullets", 7)

    topics = config.get("topics", {})
    if not topics:
        logger.warning("No topics configured")
        return True

    all_success = True

    for topic_name, topic_config in topics.items():
        logger.info(f"Processing topic: {topic_name}")

        # Collect sender addresses for this topic
        newsletters = topic_config.get("newsletters", [])
        sender_addresses = [nl["sender"] for nl in newsletters]
        sender_to_name = {nl["sender"]: nl["name"] for nl in newsletters}

        if not sender_addresses:
            logger.warning(f"No newsletters configured for {topic_name}")
            continue

        # Fetch emails
        emails = fetch_newsletters(gmail_config, sender_addresses)
        if not emails:
            logger.info(f"No newsletters found for {topic_name}, skipping")
            continue

        # Parse HTML to text
        newsletter_texts = []
        for em in emails:
            text = extract_text(em.html_body)
            if text:
                # Match sender to newsletter name
                name = "Unknown"
                for addr, nl_name in sender_to_name.items():
                    if addr.lower() in em.sender.lower():
                        name = nl_name
                        break
                newsletter_texts.append({"name": name, "text": text})

        if not newsletter_texts:
            logger.info(f"No parseable content for {topic_name}, skipping")
            continue

        # Summarize
        logger.info(f"Summarizing {len(newsletter_texts)} newsletter(s) for {topic_name}")
        summary = summarize_topic(topic_name, newsletter_texts, model, max_bullets)
        if not summary:
            logger.error(f"Summarization returned empty for {topic_name}")
            all_success = False
            continue

        # Send SMS to each recipient
        recipients = topic_config.get("recipients", [])
        for recipient in recipients:
            success = send_sms(recipient, summary, topic_name)
            if not success:
                all_success = False

    return all_success


def main():
    logger.info("Donna briefing agent starting")
    try:
        success = run()
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)

    if success:
        logger.info("Briefing complete")
        sys.exit(0)
    else:
        logger.warning("Briefing completed with errors")
        sys.exit(1)


if __name__ == "__main__":
    main()
