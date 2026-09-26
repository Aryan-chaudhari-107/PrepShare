"""Pytest entry points for the script-based suites.

The scripts stay runnable exactly as before:

    python tests/dashboard_smoke.py
    python tests/security_audit.py

pytest adds discovery, a single command for CI (pytest tests/test_suites.py)
and proper failure reporting. Both suites hit the live API — the `live_api`
fixture (tests/conftest.py) skips them cleanly when uvicorn is not running.
"""

import sys
from pathlib import Path

# Explicit paths so this works under any pytest import mode (pytest 9 no
# longer puts the test dir on sys.path by default).
_HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(_HERE))  # for the suite modules themselves
sys.path.insert(0, str(_HERE.parent))  # Backend/ for app imports

import dashboard_smoke
import security_audit


def test_dashboard_smoke(live_api):
    """18-check dashboard suite: health, readiness, anon + signed aggregates."""
    dashboard_smoke.failures.clear()
    code = dashboard_smoke.main()
    assert code == 0, f"dashboard smoke suite failed: {dashboard_smoke.failures}"


def test_security_audit(live_api):
    """32-case security audit: auth, validation, rate limits, headers."""
    security_audit.results.clear()
    security_audit.run_audit()
    failed = [r for r in security_audit.results if not r["passed"]]
    assert not failed, f"security audit failures: {[r['case'] for r in failed]}"
    assert security_audit.results, "security audit ran no checks"
