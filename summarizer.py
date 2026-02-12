import anthropic
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a briefing analyst producing SMS summaries for a busy executive.

Rules:
- Output EXACTLY 5-7 bullet points, no more, no less.
- Each bullet follows this format: [Domain]: [Change] → [Implication]
- Each bullet must be ≤60 characters.
- Total output must be ≤480 characters.
- Focus on decision-relevant signals only — skip fluff, ads, and filler.
- No greetings, sign-offs, or meta-commentary. Just bullets.
- Use • as the bullet character.
- One bullet per line."""


def summarize_topic(
    topic_name: str,
    newsletter_texts: list[dict],
    model: str = "claude-haiku-4-5-20251001",
    max_bullets: int = 7,
) -> str:
    """Summarize newsletter texts for a topic into SMS-ready bullets.

    Args:
        topic_name: Name of the topic (e.g., "Markets").
        newsletter_texts: List of dicts with 'name' and 'text' keys.
        model: Claude model ID to use.
        max_bullets: Maximum number of bullets (used in prompt).

    Returns:
        Formatted string of bullet points ready for SMS.
    """
    if not newsletter_texts:
        return ""

    # Build the user message with all newsletter content
    parts = []
    for nl in newsletter_texts:
        parts.append(f"--- {nl['name']} ---\n{nl['text']}")
    combined = "\n\n".join(parts)

    user_message = (
        f"Topic: {topic_name}\n\n"
        f"Summarize the following newsletters into 5-{max_bullets} bullets.\n\n"
        f"{combined}"
    )

    try:
        client = anthropic.Anthropic()
        response = client.messages.create(
            model=model,
            max_tokens=300,
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
