"""Shared pytest fixtures for the PrepShare backend test suites."""

import pytest
import requests

API_BASE = "http://127.0.0.1:8000"


@pytest.fixture(scope="session")
def live_api():
    """Skip the script suites when the API isn't running.

    Both suites are integration tests — they exercise the real server over
    HTTP. Running plain `pytest` without uvicorn up should skip them with a
    clear message instead of failing with connection errors.
    """
    try:
        response = requests.get(f"{API_BASE}/health", timeout=3)
        if response.status_code == 200:
            yield API_BASE
            return
    except requests.RequestException:
        pass
    pytest.skip(
        "API not reachable on 127.0.0.1:8000 — start uvicorn "
        "(python -m uvicorn main:app) to run the integration suites"
    )
