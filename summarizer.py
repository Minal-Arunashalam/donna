import anthropic
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a briefing analyst producing a daily intelligence briefing for an executive.

For each topic, write 4-6 bullets. Each bullet should be 1-2 sentences: substantive,
specific, and decision-relevant. Include concrete numbers and implications where available.

Format: • [Key development with specifics and so-what]

Rules:
- Lead with the most important story
- Include numbers, names, and stakes when available
- No fluff, filler, greetings, or meta-commentary
- Use • as the bullet character, one per line"""


def summarize_topic(
    topic_name: str,
    newsletter_texts: list[dict],
    model: str = "claude-sonnet-4-6",
    max_bullets: int = 7,
    subjects: list[str] | None = None,
) -> str:
    """Summarize newsletter texts for a topic into briefing bullets.

    Args:
        topic_name: Name of the topic (e.g., "Markets").
        newsletter_texts: List of dicts with 'text' keys.
        model: Claude model ID to use.
        max_bullets: Maximum number of bullets (unused, kept for compatibility).
        subjects: List of email subject lines for headline context.

    Returns:
        Formatted string of bullet points.
    """
    if not newsletter_texts:
        return ""

    combined = "\n\n".join(nl["text"] for nl in newsletter_texts)
    subjects = subjects or []

    headlines_section = ""
    if subjects:
        headlines_section = (
            f"\nNewsletter headlines today:\n"
            + "\n".join(subjects)
            + "\n"
        )

    user_message = (
        f"Topic: {topic_name}\n"
        f"{headlines_section}"
        f"\nContent:\n{combined}\n\n"
        f"Write 4-6 substantive bullets covering the key developments."
    )

    try:
        client = anthropic.Anthropic()
        response = client.messages.create(
            model=model,
            max_tokens=600,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        summary = response.content[0].text.strip()
        logger.info(f"Summary for {topic_name}: {len(summary)} chars")
        return summary

    except anthropic.APIError as e:
        logger.error(f"Claude API error for topic {topic_name}: {e}")
        return ""
    except Exception as e:
        logger.error(f"Summarization failed for {topic_name}: {e}")
        return ""
