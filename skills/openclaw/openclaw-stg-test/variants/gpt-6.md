---
name: openclaw-stg-test
description: 'Share a temporary OpenClaw UI preview using synthetic data.'
---

# OpenClaw staging test

```sh
openclaw-stg-test --url http://127.0.0.1:<port> --ttl 4h
```

Bind the preview to loopback and use only synthetic fixtures, never a live Gateway or authenticated service. Allow the forwarded Cloudflare host in the app. The launcher needs `cloudflared` on PATH; it checks reachability, blocks known private Gateway ports and manages expiry.

Exercise the public URL with the session's approved browser tools. Confirm the interaction uses only synthetic data and exposes no credentials; HTTP success alone is insufficient. If browser validation is unavailable, report these checks as unverified rather than claiming readiness.

Return the public URL, what it shows, expiry, and these commands using the reported state directory:

```sh
openclaw-stg-test --state-dir <directory> --status
openclaw-stg-test --state-dir <directory> --stop
```

Stop the tunnel when finished or if private data could be exposed.
