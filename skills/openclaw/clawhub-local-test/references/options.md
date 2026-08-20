# Common options

Use a specific checkout:

```bash
clawhub-local-test --repo ~/repos/clawhub
```

Force a fresh production export:

```bash
clawhub-local-test --refresh
```

Reuse the latest cached snapshot:

```bash
clawhub-local-test --no-refresh
```

Include Convex file storage in the export when download/raw-file behavior is the
thing being tested. This can be slow and large:

```bash
clawhub-local-test --include-file-storage
```

Start on a specific web port:

```bash
clawhub-local-test --port 3017
```

Open a browser after startup:

```bash
clawhub-local-test --open
clawhub-local-test --open --browser "Google Chrome"
```

Skip import when the local DB is already in the desired state:

```bash
clawhub-local-test --skip-import
```

Skip publisher-abuse demo nominations:

```bash
clawhub-local-test --no-seed-abuse-fixtures
```

Use a shorter or longer lease:

```bash
clawhub-local-test --ttl 2h
clawhub-local-test --ttl 30m
```

Inspect or stop the managed instance:

```bash
clawhub-local-test --status
clawhub-local-test --stop
```
