"""
Re-exports settings, get_db, and security functions so other layers can do
`from _01_core import settings, get_db` instead of drilling into submodules.

Fill in the imports below once config.py / database.py / security.py have
real content.
"""

from _01_core.config import settings
from _01_core.database import Base, engine, get_db
from _01_core.dependencies import get_current_user, get_current_user_optional
from _01_core.logger import logger
from _01_core.rate_limiter import limiter
from _01_core.security import (
    create_access_token,
    hash_password,
    verify_access_token,
    verify_password,
)
