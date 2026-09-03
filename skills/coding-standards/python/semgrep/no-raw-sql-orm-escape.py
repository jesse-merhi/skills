"""Fixtures for `semgrep --test --config semgrep/ semgrep/`.

Each annotation below marks the expected verdict for the line after it, and
semgrep fails the run if any of them is wrong. The `# noqa` markers keep ruff quiet
about SQL that is deliberately unsafe (S608) and deliberately written in an
older formatting style (UP031, UP032); they name each rule, as
no-broad-rule-disable requires.
"""

from django.db import connection, models  # type: ignore[import-not-found]
from sqlalchemy import text  # type: ignore[import-not-found]


class Order(models.Model):
    pass


def orm_raw_with_fstring(customer_id):
    # ruleid: no-raw-sql-orm-escape
    return Order.objects.raw(f"SELECT * FROM orders WHERE id = {customer_id}")  # noqa: S608


def orm_raw_with_percent(customer_id):
    # ruleid: no-raw-sql-orm-escape
    return Order.objects.raw("SELECT * FROM orders WHERE id = %s" % customer_id)  # noqa: S608, UP031


def orm_raw_with_format(customer_id):
    # ruleid: no-raw-sql-orm-escape
    return Order.objects.raw("SELECT * FROM orders WHERE id = {}".format(customer_id))  # noqa: S608, UP032


def sqlalchemy_text_with_fstring(session, customer_id):
    # ruleid: no-raw-sql-orm-escape
    return session.execute(text(f"SELECT * FROM orders WHERE id = {customer_id}"))  # noqa: S608


def cursor_execute_with_fstring(cursor, customer_id):
    # ruleid: no-raw-sql-orm-escape
    cursor.execute(f"SELECT * FROM orders WHERE id = {customer_id}")  # noqa: S608


def connection_execute_with_concatenation(where_clause):
    # ruleid: no-raw-sql-orm-escape
    return connection.execute("SELECT * FROM orders WHERE " + where_clause)  # noqa: S608


def cursor_executemany_with_format(cursor, table):
    # ruleid: no-raw-sql-orm-escape
    cursor.executemany("INSERT INTO {} VALUES (?)".format(table), [])  # noqa: S608, UP032


def cursor_execute_with_trailing_concatenation(cursor, where_clause):
    # ruleid: no-raw-sql-orm-escape
    cursor.execute(where_clause + " ORDER BY id")


def orm_raw_parameterised(customer_id):
    # ok: no-raw-sql-orm-escape
    return Order.objects.raw("SELECT * FROM orders WHERE id = %s", [customer_id])


def sqlalchemy_text_bound(session, customer_id):
    # ok: no-raw-sql-orm-escape
    statement = text("SELECT * FROM orders WHERE id = :customer_id")
    return session.execute(statement, {"customer_id": customer_id})


def cursor_execute_parameterised(cursor, customer_id):
    # ok: no-raw-sql-orm-escape
    cursor.execute("SELECT * FROM orders WHERE id = %s", [customer_id])


def sqlalchemy_text_inline_parameterised(session):
    # ok: no-raw-sql-orm-escape
    return session.execute(text("SELECT * FROM t WHERE id = :id"), {"id": 1})


def cursor_executemany_parameterised(cursor, rows):
    # ok: no-raw-sql-orm-escape
    cursor.executemany("INSERT INTO t (a) VALUES (?)", rows)


def orm_queryset(customer_id):
    # ok: no-raw-sql-orm-escape
    return Order.objects.filter(id=customer_id)


def cursor_execute_split_literal_parameterised(cursor, customer_id):
    # ok: no-raw-sql-orm-escape
    cursor.execute("SELECT * FROM orders " + "WHERE id = %s", [customer_id])  # noqa: S608


def unrelated_formatting(customer_id):
    # ok: no-raw-sql-orm-escape
    return f"customer {customer_id}"
