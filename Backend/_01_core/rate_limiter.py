"""Rate limiter configuration with trusted reverse proxy support."""

import ipaddress

from fastapi import Request
from slowapi import Limiter


def get_real_client_ip(request: Request) -> str:
    """Extract real client IP safely.

    If the immediate connection comes from a loopback address or private network
    and an X-Forwarded-For header is present, use the original client IP.
    Otherwise, fallback to request.client.host to prevent spoofing from direct clients.
    """
    if not request.client or not request.client.host:
        return "127.0.0.1"

    direct_ip = request.client.host

    is_trusted_proxy = False
    try:
        ip_obj = ipaddress.ip_address(direct_ip)
        is_trusted_proxy = ip_obj.is_loopback or ip_obj.is_private
    except ValueError:
        is_trusted_proxy = False

    forwarded_for = request.headers.get("x-forwarded-for")
    if is_trusted_proxy and forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
        if client_ip:
            return client_ip

    return direct_ip


# headers_enabled: every rate-limited response advertises X-RateLimit-Limit /
# -Remaining / -Reset (and Retry-After on 429) so clients can back off
# intelligently instead of guessing their quota.
limiter = Limiter(key_func=get_real_client_ip, headers_enabled=True)

