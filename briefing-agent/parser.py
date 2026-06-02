from bs4 import BeautifulSoup
import html2text
import logging

logger = logging.getLogger(__name__)

#per-email character limit — 10 newsletters × 15k chars fits well within claude's 200k context window
MAX_TEXT_LENGTH = 15000


def extract_text(html: str) -> str:
    """Convert HTML email content to clean readable text.

    Strips style, script, nav, and footer elements, then converts
    to markdown-style text and truncates to stay within LLM token budget.

    Args:
        html: Raw HTML string from email body.

    Returns:
        Clean text string, truncated to ~15000 chars.
    """
    if not html:
        return ""

    soup = BeautifulSoup(html, "lxml")

    #strip chrome that adds noise without content value
    for tag in soup.find_all(["style", "script", "nav", "footer", "header"]):
        tag.decompose()

    #remove common newsletter boilerplate elements by class/id keyword
    for attr in ["class", "id"]:
        for el in soup.find_all(attrs={attr: True}):
            if el.attrs is None:
                continue
            val = " ".join(el.get(attr, [])) if isinstance(el.get(attr), list) else str(el.get(attr, ""))
            val_lower = val.lower()
            if any(kw in val_lower for kw in ["footer", "unsubscribe", "social-links", "advertisement"]):
                el.decompose()

    cleaned_html = str(soup)

    #convert to plain text — links and images aren't useful for the llm
    converter = html2text.HTML2Text()
    converter.ignore_links = True
    converter.ignore_images = True
    converter.ignore_emphasis = False
    converter.body_width = 0  #no line wrapping so text stays intact

    text = converter.handle(cleaned_html)

    #collapse blank lines that html2text tends to produce
    lines = [line.strip() for line in text.splitlines()]
    lines = [line for line in lines if line]
    text = "\n".join(lines)

    #hard truncate to stay within per-email budget
    if len(text) > MAX_TEXT_LENGTH:
        text = text[:MAX_TEXT_LENGTH] + "\n[truncated]"

    return text
