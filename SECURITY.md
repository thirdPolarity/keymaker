# Security and privacy

Keymaker is a password **generator**. It has no vault, account system or password database.

- Generation runs in the browser using Web Crypto and unbiased sampling. All four designs use the same generator.
- Generated values are held in page memory. Appearance preferences may be stored locally; passwords are not deliberately persisted.
- Copy writes the displayed value to the system clipboard. Clipboard history, sync and other applications are outside Keymaker's control.
- Loading the site requests its static files. The host can receive ordinary request metadata. The app does not send generated passwords, run analytics, or request remote randomness.
- A hosted copy requires trust in its delivered code. Reading GitHub alone does not prove a different site's deployed files match it. You can inspect and build the source yourself and run it locally.
- The app does not protect against a compromised browser, malicious extension, operating system, server, dependency or same-origin script/service worker. A path such as `/keymaker/` is not a separate security origin. High-assurance hosting should use a dedicated origin.
- Browser memory is garbage-collected; this app cannot promise secure erasure. Displayed text, screenshots and clipboard contents can reveal passwords.

The equations in [docs/RANDOMNESS.md](docs/RANDOMNESS.md) describe output-space size under explicit cryptographic assumptions. They do not certify physical entropy, a browser implementation or a deployment, and they are not a professional external security audit.

## Reporting a problem

Report a reproducible issue against this repository. Never include a live password, access token or other secret in an issue. Security-sensitive details should use GitHub's private vulnerability reporting when available.

## Running and hosting

Use a current browser and HTTPS, or a trustworthy local development context such as localhost. If the random source fails, Keymaker retains existing values or shows an unavailable state; it never substitutes a weaker random generator. Existing displayed values are not proof that subsequent generation succeeded.

Serve immutable reviewed build assets. Avoid third-party scripts and injected analytics. Use a restrictive Content Security Policy, `nosniff`, a no-referrer policy, and protect the hosting and repository accounts. The supplied deployment instructions and headers cover the static app; a host must actually apply them. Never put provider credentials in the client bundle.
