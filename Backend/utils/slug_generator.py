"""TODO: slug generation for interview_posts.slug and companies.slug (unique, URL-safe)."""

import re
import secrets


def generate_slug(title: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    suffix = secrets.token_hex(3)  # 6 random hex characters
    return f"{base}-{suffix}"