"""Shared domain errors.

`NotFoundError` subclasses `ValueError` on purpose: every existing
`except ValueError -> 400` handler keeps working untouched, while
handlers that want correct REST semantics catch `NotFoundError`
first and answer 404 ("this resource does not exist") instead of
400 ("your request was malformed") — which is what the API contract
promises for missing posts/comments/records.
"""


class NotFoundError(ValueError):
    """A referenced resource does not exist (or was already deleted)."""
