"""The single result type every check reports."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Finding:
    """One violation, located the way ruff locates one: 1-based line and column."""

    check_id: str
    line: int
    col: int
    message: str

    def format(self, path: str) -> str:
        return f"{path}:{self.line}:{self.col}: {self.check_id} {self.message}"
