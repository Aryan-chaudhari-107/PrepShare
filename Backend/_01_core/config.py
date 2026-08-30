"""
TODO: load .env into a settings object (DATABASE_URL, SECRET_KEY, ALGORITHM,
ACCESS_TOKEN_EXPIRE_MINUTES). Typically pydantic-settings' BaseSettings.
"""

"""
Step 2: 
Why this order matters config.py, will fail immediately if the package aren't installed
or the .env values aren't realso it's worth confirming this works before writing code, not after.
You get validation for free — if SECRET_KEY is missing or ACCESS_TOKEN_EXPIRE_MINUTES isn't actually
 a number, your app fails loudly at startup instead of mysteriously crashing later when someone logs in.
"""

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL : str
    SECRET_KEY : str
    ALGORITHM : str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USERNAME: str
    SMTP_PASSWORD: str

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    class Config: # tells pydantic where to look for the file.
        env_file = ".env"


settings = Settings()