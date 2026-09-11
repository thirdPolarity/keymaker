# Keymaker

A password generator with the feel of a small retro console. Choose grouped characters, a configurable random string, or an EFF-word passphrase; generate and copy. Four interfaces share the same cryptographic core: **Studio, Dream, Horizon and Phosphor**.

[Use Keymaker](https://reydoes.com/keymaker/) · [Dedicated site](https://keymaker.reydoes.com/) · [The math](docs/RANDOMNESS.md) · [Security boundaries](SECURITY.md)

Quick addresses on reydoes.com (forwarding to the dedicated app origin): `/keymaker`, `/keys`, `/password`, and `/passwords`. The dedicated site also opens each design at `/studio`, `/dream`, `/horizon`, or `/phosphor`.

Studio opens in SNES with the Obsidian finish. Dream and Horizon open in SNES light mode; Phosphor has its own fixed palette. Each design remembers your appearance choices for later visits.

## Why I built it

I wanted a password tool I could use privately, understand, and enjoy looking at. The visual starting point was Sega Dreamcast aesthetics, the Super Nintendo era, and the futuristic interfaces I have always wished would come back into style. Phosphor draws on the pixel art and custom graphics I enjoyed across DeviantArt and early gaming forums. It grew into four different interpretations of the same small task.

The visual side can be playful. The generation should be inspectable: browser Web Crypto, unbiased selection, an established word list, and equations anyone can check. There is no account or vault. Generated passwords are held in page memory and are not sent to a server. Copy uses the system clipboard; appearance preferences are the only data the app persists.

## Run locally

Node.js 24 or newer and npm:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4349/`. The server binds to this computer. Routes: `/studio`, `/dream`, `/horizon`, `/phosphor`; `/` also opens Studio.

```sh
npm run verify
npm run preview
```

`verify` runs unit tests, an independent exact math checker, lint, TypeScript and the production build. The preview serves `dist/` on the same local port; stop the development server first.

## The randomness, briefly

Every choice uses `crypto.getRandomValues()`. Rejection sampling removes modulo bias. Random mode redraws a whole candidate when it misses a selected character type, keeping all valid outputs equally likely. Memorable mode draws independently from EFF's 7,776-word long list.

At default settings, a 20-character random password has a calculated search space of **121.59 bits**, and six words have **77.55 bits**, assuming independent uniform cryptographic draws. These are combinatorial calculations, not measurements of physical entropy or a security certification. See the [equations, assumptions and primary sources](docs/RANDOMNESS.md).

## Browser checks

With the app running and [uv](https://docs.astral.sh/uv/) installed:

```sh
uv run --with playwright python -m playwright install chromium webkit
uv run --with playwright python tests/security-browser-qa.py
uv run --with playwright python tests/browser-qa.py
uv run --with playwright python tests/dream-browser-qa.py
uv run --with playwright python tests/dream-cube-qa.py
uv run --with playwright python tests/horizon-browser-qa.py
uv run --with playwright python tests/phosphor-browser-qa.py
WEBKIT=1 uv run --with playwright python tests/phosphor-browser-qa.py
```

Tests save reports and captures under ignored `artifacts/`. Optional accessibility scripts in `tests/*a11y.mjs` use the test dependencies and a Playwright Chromium installation. Install it with `npx playwright-core install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.

## Hosting

For a root deployment, run `npm run build` and configure the static host to serve `index.html` for the theme routes. For the portfolio path, run `npm run build:portfolio` and copy the contents of `dist-portfolio/` to the host's `/keymaker/` directory. It includes static entrypoints for every theme, and links and assets stay under `/keymaker/`.

Use HTTPS. Apply the headers in [docs/HOSTING.md](docs/HOSTING.md); a separate origin provides a stronger isolation boundary than a path within another site. No API keys, database or backend are required.

## Source map

- `src/generator.ts`: random selection and the three generation modes.
- `src/words.json`: EFF long wordlist, in its original order.
- `src/App.tsx`, `src/dream/`, `src/horizon/`, `src/phosphor/`: the interfaces.
- `scripts/verify-math.mjs`: independent inclusion–exclusion and dynamic-programming count checks.
- `scripts/build-phosphor-font.mjs`: square-cell font geometry and native font builder.

## License and attribution

Original code and project-authored assets are offered under [MIT](LICENSE). Third-party components retain their own licenses.

Passphrase words: [EFF's long wordlist](https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt), created by Joseph Bonneau for the Electronic Frontier Foundation, converted to JSON without changing the words. See [attribution and verification](THIRD_PARTY/EFF-WORDLIST.md).

Manrope, Orbitron and IBM Plex Mono: SIL Open Font License. Lucide icons: ISC. Their license files are in `THIRD_PARTY/`. React, Vite and other dependencies retain their upstream licenses. [Asset provenance](ASSET-PROVENANCE.md) documents the AI-assisted visuals and Phosphor typography.
