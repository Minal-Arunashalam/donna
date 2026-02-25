#!/usr/bin/env python3
"""Donna — Autonomous Briefing Agent.

Reads Gmail newsletters, groups by topic, summarizes via Claude,
and delivers one consolidated digest email.
"""

import sys
import logging
import yaml
from dotenv import load_dotenv

from gmail_reader import fetch_newsletters
from parser import extract_text
from summarizer import synthesize_all
from email_sender import send_digest

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
    model = llm_config.get("model", "claude-sonnet-4-6")
    max_tokens = llm_config.get("max_tokens", 4000)

    #pull input settings — single label replaces the old per-topic label setup
    input_config = config.get("input", {})
    label = input_config.get("label", "Donna/Inputs")
    since_hours = input_config.get("since_hours", 24)
    recipients = config.get("recipients", [gmail_config["email"]])

    logger.info(f"Fetching from label: {label}, since {since_hours}h ago")
    #pass label as a single-item list to match fetch_newsletters' expected format
    raw_emails = fetch_newsletters(gmail_config, [{"label": label}], since_hours=since_hours)

    if not raw_emails:
        logger.warning("No emails found — nothing to send today")
        return True

    #convert html bodies to plain text and drop any emails that fail to parse
    newsletters = []
    for em in raw_emails:
        text = extract_text(em.html_body)
        if text:
            newsletters.append({"subject": em.subject, "sender": em.sender, "text": text})
        else:
            logger.warning(f"Could not extract text from: {em.subject}")

    if not newsletters:
        logger.warning("No parseable newsletter content")
        return True

    logger.info(f"Processing {len(newsletters)} newsletter(s)")
    #single claude call reads all newsletters and returns dynamically determined sections
    sections, sources = synthesize_all(newsletters, model=model, max_tokens=max_tokens)

    if not sections:
        logger.error("Synthesis returned no sections")
        return False

    logger.info(f"Sending digest with {len(sections)} section(s): {list(sections.keys())}")
    return send_digest(sections, recipients, sources=sources)


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
