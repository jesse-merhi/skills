"""Comments carry meaning, not decoration.

A line comment whose whole body is a run of ``-`` or ``=`` is a divider drawn in
code. It survives refactors, drifts out of place, and says nothing a plain
section comment does not say better.

No ruff rule inspects comment text for decoration, so this is a custom check.
It reads the token stream rather than the AST because the AST drops comments.
"""

import io
import tokenize

from standards_checks.finding import Finding

CHECK_ID = "no-banner-comments"
BANNER_CHARACTERS = frozenset("-=")
MINIMUM_BANNER_LENGTH = 10


def _is_banner(body: str) -> bool:
    return len(body) >= MINIMUM_BANNER_LENGTH and set(body) <= BANNER_CHARACTERS


def check_source(source: str, filename: str) -> list[Finding]:
    """Report every comment that is only a run of banner characters."""
    findings: list[Finding] = []
    tokens = tokenize.generate_tokens(io.StringIO(source).readline)
    for token in tokens:
        if token.type is not tokenize.COMMENT:
            continue
        body = token.string.lstrip("#").strip()
        if not _is_banner(body):
            continue
        line, col = token.start
        findings.append(
            Finding(
                check_id=CHECK_ID,
                line=line,
                col=col + 1,
                message=(
                    "decorative banner comment; write a plain section comment "
                    "that says what the section is"
                ),
            )
        )
    return findings
