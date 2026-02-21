from bs4 import BeautifulSoup
import html2text
import logging

logger = logging.getLogger(__name__)

MAX_TEXT_LENGTH = 8000


def extract_text(html: str) -> str:
    """Convert HTML email content to clean readable text.

    Strips style, script, nav, and footer elements, then converts
    to markdown-style text and truncates to stay within LLM token budget.

    Args:
        html: Raw HTML string from email body.

    Returns:
        Clean text string, truncated to ~8000 chars.
    """
    if not html:
        return ""

    soup = BeautifulSoup(html, "lxml")

    # Remove non-content elements
    for tag in soup.find_all(["style", "script", "nav", "footer", "header"]):
        tag.decompose()

    # Remove common newsletter chrome by class/id patterns
    for attr in ["class", "id"]:
        for el in soup.find_all(attrs={attr: True}):
            if el.attrs is None:
                continue
            val = " ".join(el.get(attr, [])) if isinstance(el.get(attr), list) else str(el.get(attr, ""))
            val_lower = val.lower()
            if any(kw in val_lower for kw in ["footer", "unsubscribe", "social-links", "advertisement"]):
                el.decompose()

    cleaned_html = str(soup)

    converter = html2text.HTML2Text()
    converter.ignore_links = True
    converter.ignore_images = True
    converter.ignore_emphasis = False
    converter.body_width = 0  # No line wrapping

    text = converter.handle(cleaned_html)

    # Collapse excessive whitespace
    lines = [line.strip() for line in text.splitlines()]
    lines = [line for line in lines if line]
    text = "\n".join(lines)

    if len(text) > MAX_TEXT_LENGTH:
        text = text[:MAX_TEXT_LENGTH] + "\n[truncated]"

    return text
