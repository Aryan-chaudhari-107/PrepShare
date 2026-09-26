import logging
import os
from logging.handlers import RotatingFileHandler

LOG_DIR = "logs"

logger = logging.getLogger("app")
logger.setLevel(logging.INFO)

formatter = logging.Formatter(
    "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)

# Console always logs (Vercel captures stdout).
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# File logging is best-effort: serverless filesystems (Vercel) are read-only,
# so a failed file handler must not crash the app at import time.
try:
    os.makedirs(LOG_DIR, exist_ok=True)

    # writes to logs/app.log, auto-rotates at 5MB, keeps 3 old backups
    file_handler = RotatingFileHandler(
        os.path.join(LOG_DIR, "app.log"), maxBytes=5_000_000, backupCount=3
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
except OSError:
    # Read-only filesystem: console-only logging.
    pass
