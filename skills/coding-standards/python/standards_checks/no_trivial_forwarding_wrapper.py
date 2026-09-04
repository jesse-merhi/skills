"""A wrapper that only forwards adds a name without adding meaning.

``def fetch(a, b): return _client.get(a, b)`` gives a reader a second name to
learn and a second place to look, and gives the call site nothing. Inline it
unless the name marks a real concept, a boundary, or a test seam.

The check deliberately reports only the unambiguous shape: a plain function
whose entire body forwards every positional parameter, in order, to one call.
Anything that could carry meaning on its own is skipped:

* decorated functions (the decorator is the point),
* methods bound to ``self``/``cls`` (the wrapper may satisfy an interface),
* ``async`` functions, which are a different node and are never visited (a
  generator cannot take this shape at all: a one-statement ``return`` body
  holds no ``yield``),
* defaults, ``*args``, ``**kwargs``, keyword-only parameters (the signature
  adapts rather than forwards),
* functions taking no parameters, which forward nothing and are usually a
  factory or an accessor,
* module-level functions named in ``__all__``, the Python analogue of the
  exported functions the ESLint rule skips by default: an explicit export is a
  published name, and inlining it would break the callers,
* a callee reached through a call or a subscript (``client().fetch``,
  ``handlers[0].fetch``): acquiring the receiver is work the wrapper does,
* self-recursion, which is a bug rather than a wrapper.

No ruff rule models this, so it is a custom AST check.
"""

import ast

from standards_checks.finding import Finding

CHECK_ID = "no-trivial-forwarding-wrapper"
BOUND_FIRST_PARAMETERS = frozenset({"self", "cls"})
EXPORT_LIST = "__all__"


def _callee_name(func: ast.expr) -> str | None:
    if isinstance(func, ast.Name):
        return func.id
    if isinstance(func, ast.Attribute):
        prefix = _callee_name(func.value)
        return f"{prefix}.{func.attr}" if prefix else None
    return None


def _forwards_parameters_verbatim(node: ast.FunctionDef, call: ast.Call) -> bool:
    if call.keywords:
        return False
    parameters = [*node.args.posonlyargs, *node.args.args]
    if not parameters or len(call.args) != len(parameters):
        return False
    return all(
        isinstance(argument, ast.Name) and argument.id == parameter.arg
        for argument, parameter in zip(call.args, parameters, strict=True)
    )


def _has_adapting_signature(node: ast.FunctionDef) -> bool:
    arguments = node.args
    return bool(
        arguments.defaults
        or arguments.kw_defaults
        or arguments.kwonlyargs
        or arguments.vararg
        or arguments.kwarg
    )


def _is_bound_method(node: ast.FunctionDef) -> bool:
    parameters = [*node.args.posonlyargs, *node.args.args]
    return bool(parameters) and parameters[0].arg in BOUND_FIRST_PARAMETERS


def _exported_names(module: ast.Module) -> frozenset[str]:
    names: set[str] = set()
    for statement in module.body:
        if isinstance(statement, ast.Assign):
            targets: list[ast.expr] = list(statement.targets)
        elif isinstance(statement, ast.AnnAssign | ast.AugAssign):
            targets = [statement.target]
        else:
            continue
        if not any(
            isinstance(target, ast.Name) and target.id == EXPORT_LIST
            for target in targets
        ):
            continue
        if isinstance(statement.value, ast.List | ast.Tuple):
            names.update(
                element.value
                for element in statement.value.elts
                if isinstance(element, ast.Constant) and isinstance(element.value, str)
            )
    return frozenset(names)


def _forwarded_call(node: ast.FunctionDef) -> ast.Call | None:
    if len(node.body) != 1:
        return None
    statement = node.body[0]
    if not isinstance(statement, ast.Return) or not isinstance(
        statement.value, ast.Call
    ):
        return None
    return statement.value


def check_source(source: str, filename: str) -> list[Finding]:
    """Report every function whose whole body forwards its parameters onward."""
    findings: list[Finding] = []
    module = ast.parse(source)
    exported = _exported_names(module)
    for node in ast.walk(module):
        if not isinstance(node, ast.FunctionDef):
            continue
        if (
            node.decorator_list
            or _has_adapting_signature(node)
            or _is_bound_method(node)
            or (node in module.body and node.name in exported)
        ):
            continue
        call = _forwarded_call(node)
        if call is None or not _forwards_parameters_verbatim(node, call):
            continue
        callee = _callee_name(call.func)
        if callee is None or callee == node.name:
            continue
        findings.append(
            Finding(
                check_id=CHECK_ID,
                line=node.lineno,
                col=node.col_offset + 1,
                message=(
                    f"`{node.name}` only forwards its parameters to `{callee}`; "
                    "inline it unless the name marks a concept, boundary, or "
                    "test seam"
                ),
            )
        )
    return findings
