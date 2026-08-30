"""TODO: numeric OTP generation + hashing for password_reset_otps."""


import random


def generate_otp(length: int = 6) -> str:
    """Generates a random numeric OTP, e.g. '483920'."""
    return "".join(random.choices("0123456789", k=length))