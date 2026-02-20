#!/usr/bin/env python3
"""Donna — Autonomous Briefing Agent.

Reads Gmail newsletters, groups by topic, summarizes via Claude,
and delivers one email per topic via Gmail SMTP.
"""

import sys
import logging
import yaml
from dotenv import load_dotenv

from gmail_reader import fetch_newsletters
from parser import extract_text
from summarizer import summarize_topic
from email_sender import send_email

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

        # Collect newsletters for this topic
        newsletters = topic_config.get("newsletters", [])

        if not newsletters:
            logger.warning(f"No newsletters configured for {topic_name}")
            continue

        # Fetch emails
        emails = fetch_newsletters(gmail_config, newsletters)
        if not emails:
            logger.info(f"No newsletters found for {topic_name}, skipping")
            continue

        # Parse HTML to text
        newsletter_texts = []
        for em in emails:
            text = extract_text(em.html_body)
            if text:
                newsletter_texts.append({"text": text})

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

        # Send email to each recipient
        recipients = topic_config.get("recipients", [gmail_config["email"]])
        for recipient in recipients:
            success = send_email(recipient, summary, topic_name)
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
