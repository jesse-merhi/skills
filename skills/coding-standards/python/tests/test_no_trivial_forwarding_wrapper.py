from textwrap import dedent

import pytest

from standards_checks.finding import Finding
from standards_checks.no_trivial_forwarding_wrapper import check_source


def check(source: str) -> list[Finding]:
    return check_source(dedent(source), "module.py")


def test_reports_a_wrapper_that_forwards_every_parameter() -> None:
    source = """\
    def fetch(customer_id, cursor):
        return load(customer_id, cursor)
    """
    (finding,) = check(source)
    assert (finding.line, finding.col, finding.check_id) == (
        1,
        1,
        "no-trivial-forwarding-wrapper",
    )
    assert "`fetch` only forwards its parameters to `load`" in finding.message


def test_names_a_dotted_callee_in_the_message() -> None:
    source = """\
    def fetch(customer_id):
        return _client.orders.get(customer_id)
    """
    (finding,) = check(source)
    assert "`_client.orders.get`" in finding.message


def test_reports_a_nested_wrapper_at_its_own_column() -> None:
    source = """\
    def outer():
        def fetch(customer_id):
            return load(customer_id)

        return fetch
    """
    (finding,) = check(source)
    assert (finding.line, finding.col) == (2, 5)


@pytest.mark.parametrize(
    "source",
    [
        pytest.param(
            """\
            def fetch(customer_id, cursor):
                return load(cursor, customer_id)
            """,
            id="arguments-reordered",
        ),
        pytest.param(
            """\
            def fetch(customer_id):
                return load(customer_id, retries=3)
            """,
            id="keyword-argument-added",
        ),
        pytest.param(
            """\
            def fetch(customer_id):
                return load(customer_id.value)
            """,
            id="argument-transformed",
        ),
        pytest.param(
            """\
            @cache
            def fetch(customer_id):
                return load(customer_id)
            """,
            id="decorated",
        ),
        pytest.param(
            """\
            class Widget:
                def render(self):
                    return render_widget(self)
            """,
            id="bound-method",
        ),
        pytest.param(
            """\
            async def fetch(customer_id):
                return load(customer_id)
            """,
            id="async-function",
        ),
        pytest.param(
            """\
            def fetch(customer_id, retries=3):
                return load(customer_id, retries)
            """,
            id="parameter-default",
        ),
        pytest.param(
            """\
            def fetch(customer_id, *rest):
                return load(customer_id)
            """,
            id="star-args",
        ),
        pytest.param(
            """\
            def fetch(customer_id, **options):
                return load(customer_id)
            """,
            id="keyword-args",
        ),
        pytest.param(
            """\
            def fetch(customer_id):
                return fetch(customer_id)
            """,
            id="self-recursion",
        ),
        pytest.param(
            """\
            def now():
                return time.time()
            """,
            id="no-parameters-to-forward",
        ),
        pytest.param(
            """\
            __all__ = ["fetch"]


            def fetch(customer_id):
                return load(customer_id)
            """,
            id="listed-in-dunder-all",
        ),
        pytest.param(
            """\
            __all__ = []
            __all__ += ["fetch"]


            def fetch(customer_id):
                return load(customer_id)
            """,
            id="appended-to-dunder-all",
        ),
        pytest.param(
            """\
            def fetch(customer_id):
                log(customer_id)
                return load(customer_id)
            """,
            id="body-does-more",
        ),
        pytest.param(
            """\
            def fetch(customer_id):
                return load(customer_id) or DEFAULT
            """,
            id="return-is-not-a-bare-call",
        ),
        pytest.param(
            """\
            def fetch(customer_id):
                return handlers[0](customer_id)
            """,
            id="callee-is-not-a-name",
        ),
    ],
)
def test_allows_functions_that_are_not_bare_forwarders(source: str) -> None:
    assert check(source) == []


def test_reports_a_wrapper_the_export_list_leaves_out() -> None:
    source = """\
    __all__ = ["other"]


    def fetch(customer_id):
        return load(customer_id)
    """
    (finding,) = check(source)
    assert "`fetch` only forwards its parameters to `load`" in finding.message
