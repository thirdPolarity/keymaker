# Hosting Keymaker

Build with `npm ci && npm run verify`. The standard `dist/` build expects the site root; serve its `index.html` for `/studio`, `/dream`, `/horizon`, `/phosphor` and `/obsidian`.

For the portfolio's nested URL, `npm run build:portfolio` creates `dist-portfolio/`. Copy its contents to the host's `/keymaker/` directory. Theme directories already contain their HTML entrypoints. The root is Studio, and all theme links stay inside the app.

Use HTTPS, reviewed immutable build assets, and no injected analytics. Configure these response headers for the app's HTML and assets (Netlify `_headers` format shown):

```text
/keymaker/*
  Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Cache-Control: public, max-age=0, must-revalidate
```

For a dedicated root deployment, change the path to `/*`. The inline-style allowance supports React style properties; scripts remain restricted to the same origin. Configure HSTS at the host after verifying its HTTPS policy. Confirm the actual response headers after deployment; configuration files alone do not prove they are enforced.

A `/keymaker/` path shares an origin with its parent site. CSP does not isolate it from an already compromised same-origin service worker or server. Use a dedicated origin when that isolation is required. See [SECURITY.md](../SECURITY.md).

## Optional GitHub checks

`github-checks.yml.example` is a read-only-permission workflow template for `npm run verify` and the nested build. Copy it to `.github/workflows/checks.yml` using a GitHub identity allowed to manage workflows. The publishing credential used for this release has no workflow-write permission, so the template is included without enabling Actions. The documented checks also run locally.
