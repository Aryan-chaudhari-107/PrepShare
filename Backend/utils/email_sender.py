"""Email sender utility for OTP delivery and notification dispatch."""

import smtplib
from email.mime.text import MIMEText

from _01_core import logger, settings


def send_otp_email(to_email: str, otp_code: str):
    """Send verification OTP via configured SMTP service with development fallback."""
    subject = "Your PrepShare verification code"
    body = (
        f"Your verification code is: {otp_code}\n\n"
        f"This code will expire in 10 minutes.\n"
        f"If you did not request this code, you can safely ignore this email."
    )

    message = MIMEText(body)
    from_addr = settings.SMTP_USERNAME or "no-reply@prepshare.com"
    message["Subject"] = subject
    message["From"] = from_addr
    message["To"] = to_email

    if settings.SMTP_HOST and settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5) as server:
                server.starttls()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.sendmail(from_addr, to_email, message.as_string())
                logger.info(f"OTP email successfully dispatched via SMTP to {to_email}")
                return
        except Exception as e:
            logger.warning(
                f"SMTP delivery to {to_email} encountered an issue: {e}. "
                f"Falling back to development log."
            )

    logger.info(f"[DEV/LOCAL OTP DISPATCH] To: {to_email} | Code: {otp_code}")

