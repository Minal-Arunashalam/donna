import re
import anthropic
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

#legacy system prompt used by the per-topic summarize_topic() function
SYSTEM_PROMPT = """You are a briefing analyst producing a daily intelligence briefing for an executive.

For each topic, write 4-6 bullets. Each bullet should be 1-2 sentences: substantive,
specific, and decision-relevant. Include concrete numbers and implications where available.

Format: • [Key development with specifics and so-what]

Rules:
- Lead with the most important story
- Include numbers, names, and stakes when available
- No fluff, filler, greetings, or meta-commentary
- Use • as the bullet character, one per line"""

#system prompt for the new single-call synthesis approach
#instructs claude to determine sections dynamically from actual content rather than fixed topics
SYNTHESIS_SYSTEM_PROMPT = """You are Donna, an elite executive briefing analyst. Read all newsletters below and produce a single comprehensive daily briefing.

TASK:
1. Read all newsletters provided.
2. Identify the natural thematic sections that emerge from today's content. Common sections include Markets, Private Equity, Tech & AI, Politics, Geopolitics, Health, Energy, Real Estate — but use whatever sections the actual content warrants. Do not force a fixed list; create only sections with meaningful content.
3. For each section, write 4-6 bullets.

BULLET REQUIREMENTS:
- Each bullet must be 1-3 sentences. Lead with the key fact, add essential context only.
- Include all relevant numbers, company names, people, dates, and dollar figures.
- When using industry jargon (e.g. "basis points," "LBO," "yield curve," "CRISPR," "quantitative tightening"), briefly explain it in plain terms parenthetically, e.g. "the yield curve inverted (meaning short-term borrowing costs now exceed long-term ones, a classic recession warning sign)."
- Lead each bullet with the most important fact, then explain context and implications.
- Explain the "so what" — why does this matter?
- Do not repeat the same story across multiple sections.
- Use • as the bullet character.

OUTPUT FORMAT — critical for parsing:
Respond with ONLY the following structure, no preamble, no closing remarks:

## Section Name
Sources: Newsletter Name A, Newsletter Name B
• Bullet one text here, including explanation and context.
• Bullet two text here.

## Another Section Name
Sources: Newsletter Name A
• Bullet one text here.

Rules:
- Section headers must use exactly ## followed by a space and the section name.
- The Sources line must immediately follow the section header, using the sender's display name (not email address), comma-separated.
- Each bullet must start with • on its own line.
- No nested bullets, no horizontal rules, no extra commentary.
- Keep your total response under 14,000 characters. Budget section count and bullet length accordingly — finish every section you start."""


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


def _build_user_message(newsletters: list[dict]) -> str:
    #format date in a readable way so claude knows what day it's writing the briefing for
    date_str = datetime.now().strftime("%A, %B %-d, %Y")
    blocks = []
    for i, nl in enumerate(newsletters):
        #label each newsletter so claude can attribute stories to their source
        blocks.append(
            f"--- NEWSLETTER {i + 1} ---\n"
            f"Subject: {nl['subject']}\n"
            f"From: {nl['sender']}\n\n"
            f"{nl['text']}"
        )
    return (
        f"Today's date: {date_str}\n\n"
        f"You have received {len(newsletters)} newsletter(s).\n\n"
        + "\n\n".join(blocks)
        + "\n\nNow produce the briefing."
    )


def _parse_sections(raw: str) -> tuple[dict[str, str], dict[str, str]]:
    #find all ## section headers and split the raw text into per-section chunks
    sections = {}
    sources = {}
    pattern = re.compile(r'^##\s+(.+)$', re.MULTILINE)
    matches = list(pattern.finditer(raw))
    for i, match in enumerate(matches):
        section_name = match.group(1).strip()
        start = match.end()
        #each section ends where the next ## header begins
        end = matches[i + 1].start() if i + 1 < len(matches) else len(raw)
        body = raw[start:end].strip()
        bullet_lines = []
        source_line = ""
        for line in body.splitlines():
            line = line.strip()
            #extract the Sources: line if claude included it
            if line.lower().startswith("sources:"):
                source_line = line[len("sources:"):].strip()
            elif line.startswith("•") or line.startswith("- ") or line.startswith("* "):
                # normalize all bullet styles to • for downstream rendering
                normalized = "• " + line.lstrip("•-* ").lstrip()
                bullet_lines.append(normalized)
        if bullet_lines:
            sections[section_name] = "\n".join(bullet_lines)
            if source_line:
                sources[section_name] = source_line
    return sections, sources


def synthesize_all(
    newsletters: list[dict],
    model: str = "claude-sonnet-4-5-20250929",
    max_tokens: int = 4000,
) -> tuple[dict[str, str], dict[str, str]]:
    """Synthesize all newsletters into a dynamic multi-section briefing.

    Args:
        newsletters: List of dicts with 'subject', 'sender', and 'text' keys.
        model: Claude model ID to use.
        max_tokens: Maximum tokens for the response.

    Returns:
        Tuple of (sections, sources) where both map section name → string.
    """
    if not newsletters:
        return {}, {}
    user_message = _build_user_message(newsletters)
    try:
        client = anthropic.Anthropic()
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=SYNTHESIS_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        raw = response.content[0].text.strip()
        logger.info(f"Raw synthesis: {len(raw)} chars")
        sections, sources = _parse_sections(raw)
        logger.info(f"Parsed {len(sections)} section(s): {list(sections.keys())}")
        if not sections:
            logger.warning(f"Parse found 0 sections. First 600 chars of raw:\n{raw[:600]}")
        return sections, sources
    except anthropic.APIError as e:
        logger.error(f"Claude API error during synthesis: {e}")
        return {}, {}
    except Exception as e:
        logger.error(f"Synthesis failed: {e}")
        return {}, {}
