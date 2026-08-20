# Preview contract

The public origin must be a loopback HTTP server that owns the UI and all data
visible through it. Use browser-side mocks or static fixtures only.

## Safety attestation

Serve `/.well-known/openclaw-stg-test.json` from the exact origin passed to the
helper:

```json
{
  "schemaVersion": 1,
  "publicPreview": true,
  "origin": "http://127.0.0.1:5197",
  "dataSource": "browser-mock",
  "containsCredentials": false
}
```

`dataSource` must be `browser-mock` or `static-fixture`. The helper validates
the local document before starting `cloudflared` and validates it again through
the public URL before reporting success.

## Vite middleware

Keep the staging Vite config and scenario under
`.artifacts/openclaw-stg-test/<scenario>/`. Add this plugin beside the mock
Gateway plugin, substituting the leased loopback port:

```ts
import type { Plugin } from "vite";

const previewOrigin = "http://127.0.0.1:5197";

const publicPreviewAttestation: Plugin = {
  name: "openclaw-stg-test-attestation",
  configureServer(server) {
    server.middlewares.use(
      "/.well-known/openclaw-stg-test.json",
      (_request, response) => {
        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json");
        response.end(
          JSON.stringify({
            schemaVersion: 1,
            publicPreview: true,
            origin: previewOrigin,
            dataSource: "browser-mock",
            containsCredentials: false,
          }),
        );
      },
    );
  },
};
```

Bind Vite to `127.0.0.1`, use `strictPort: true`, and allow the forwarded
Cloudflare host. Do not bind the preview itself to a LAN or wildcard address.

## Scenario requirements

- Derive protocol fixtures from the checkout's existing Control UI E2E mock
  Gateway when it can express the behavior.
- Keep fixture messages, identities, repository names, URLs, and tokens
  synthetic.
- Intercept the Control UI bootstrap config and WebSocket in the browser. A
  mock server that later connects to a live Gateway is not a browser mock.
- Exercise the scenario locally before starting the tunnel and again through
  the public URL after it starts.
- Keep staging files untracked. If a reusable fixture belongs in the product,
  review it as product test code in the product PR instead.
