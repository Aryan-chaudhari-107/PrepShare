"""Cross-cutting helpers used across every numbered layer. Not a build "step"."""

from utils.datetime_utils import utc_now
from utils.email_sender import send_otp_email
from utils.otp_generator import generate_otp
from utils.slug_generator import generate_slug

__all__ = ["generate_otp", "generate_slug", "send_otp_email", "utc_now"]