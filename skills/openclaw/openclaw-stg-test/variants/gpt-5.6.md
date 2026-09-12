---
name: openclaw-stg-test
description: 'Share a temporary OpenClaw UI preview using synthetic data.'
---

# OpenClaw staging test

```sh
openclaw-stg-test --url http://127.0.0.1:<port> --ttl 4h
```

Use a preview bound to loopback and backed entirely by synthetic fixtures, not a live Gateway or authenticated service. Allow the forwarded Cloudflare host in the app. The launcher needs `cloudflared` on PATH; it checks HTTP reachability, blocks known private Gateway ports, and manages expiry.

Use the session's existing approved browser tools to exercise the public URL and confirm the delivered interaction uses only synthetic data and exposes no credentials. HTTP success does not establish that. If browser validation is unavailable, report the interaction and exposure checks as unverified rather than claiming readiness.

Return the public URL, what it shows, expiry, and these commands using the reported state directory:

```sh
openclaw-stg-test --state-dir <directory> --status
openclaw-stg-test --state-dir <directory> --stop
```

Stop the tunnel when finished or if private data could be exposed.
