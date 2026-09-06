---
name: openclaw-stg-test
description: 'Share a temporary OpenClaw UI preview using synthetic data.'
---

# OpenClaw staging test

```sh
openclaw-stg-test --url http://127.0.0.1:<port> --ttl 4h
```

Use a preview bound to loopback and backed entirely by synthetic fixtures, not a live Gateway or authenticated service. Allow the forwarded Cloudflare host. The launcher needs `cloudflared` on PATH; it checks HTTP reachability, blocks known private Gateway ports, and manages expiry.

Check that the shared interaction uses only synthetic data and exposes no credentials. HTTP success does not establish that. Use the session's existing approved browser tools when needed.

Return the public URL, what it shows, expiry, and these commands using the reported state directory:

```sh
openclaw-stg-test --state-dir <directory> --status
openclaw-stg-test --state-dir <directory> --stop
```

Stop the tunnel when finished or if private data could be exposed.
