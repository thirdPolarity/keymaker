# The math behind Keymaker

Keymaker generates passwords locally using the browser's `crypto.getRandomValues()` and unbiased rejection sampling. The code is public so its choices can be checked. It does not implement a new cipher, claim physical true randomness, or depend on keeping the algorithm secret.

## 1. The random source

Web Crypto specifies cryptographically strong output from a generator seeded with high-quality entropy, typically supplied by the operating system. The browser chooses the implementation; the specification sets no minimum information-theoretic entropy that this app can measure. Keymaker requires HTTPS or a trustworthy local context, and stops on source failure. It never falls back to `Math.random`, timestamps or mouse movements. [W3C Web Cryptography](https://www.w3.org/TR/webcrypto/#Crypto-method-getRandomValues)

As of 11 September 2026, NIST's current framework includes SP 800-90A deterministic generators, SP 800-90B entropy sources, and SP 800-90C constructions (final, September 2025). IR 8446, published January 2026, compares this framework with AIS 20/31. These are foundations for assessed random generators; using a browser API does **not** make Keymaker NIST-certified. [NIST publications](https://csrc.nist.gov/Projects/random-bit-generation/publications)

## 2. Equal chances for each choice

To choose among $n$ characters or words, draw a 32-bit unsigned value $X$, and set:

$$M=2^{32},\qquad T=\left\lfloor\frac{M}{n}\right\rfloor n.$$

Reject $X\ge T$. Otherwise return $X\bmod n$. There are exactly $T/n$ accepted inputs for every result, so:

$$P(\text{choice}=j\mid X<T)=\frac1n.$$

This removes the unequal extra residues that a plain modulo operation would create. [Libsodium documents the same uniform-selection requirement](https://libsodium.gitbook.io/doc/generating_random_data).

## 3. Character requirements, without insertion bias

Random mode draws every position independently from the selected alphabet, then rejects the **entire** candidate if any selected character type is missing. Every valid string therefore has the same conditional probability. Selecting more types is a compatibility option; composition rules do not inherently add strength at a fixed length and alphabet. [NIST password guidance](https://pages.nist.gov/800-63-4/sp800-63b.html)

For length $L$, disjoint category sizes $a_1,\ldots,a_k$, and $N=\sum_i a_i$, inclusion–exclusion gives the exact number of valid outputs:

$$V=\sum_{S\subseteq\{1,\ldots,k\}}(-1)^{|S|}\left(N-\sum_{i\in S}a_i\right)^L,\qquad H=\log_2 V.$$

With all types enabled and similar characters excluded, the sizes are **24 uppercase, 24 lowercase, 8 digits and 12 symbols**, so $N=68$.

## 4. Length gives measurable guessing resistance

For grouped characters, $H=L\log_2 31$; fixed hyphens add zero bits. For $w$ independently selected EFF words, $H=w\log_2 7776$. The bundled list is an exact, unique, prefix-free copy of EFF's long list. That property makes the selected word sequence recoverable even with an empty separator. The number and symbol options add $\log_2 90$ and $\log_2 12$ respectively; fixed formatting adds nothing. [EFF's wordlist design](https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases)

| Configuration | Calculated search-space bits |
| --- | ---: |
| Grouped, 16 characters (Dream/Horizon/Phosphor default) | 79.27 |
| Grouped, 20 characters (Studio default) | 99.08 |
| Random, 16 characters (Phosphor default) | 97.12 |
| Random, 20 characters (Studio/Dream/Horizon default) | 121.59 |
| Random, 24 characters, same settings | 146.01 |
| Six EFF words, no extras (all themes' default) | 77.55 |

These are exact combinatorial counts with rounded logarithms, **assuming independent, uniform cryptographic draws and known settings**. They are not measurements of the device's physical entropy or a guarantee of equivalent attack cost. For a uniform space of size $V$, $q$ distinct guesses succeed with probability $\min(q/V,1)$; expected exhaustive guesses are $(V+1)/2$. Real attack cost also depends on the receiving service's password hashing, rate limits and compromise state. We do not present speculative crack-time counters.

## 5. Why not stack more algorithms?

A deterministic transformation cannot manufacture information-theoretic entropy:

$$H(f(X))\le H(X).$$

Hashing the same random input repeatedly, mixing timestamps, or layering another generator does not establish a larger secret space. Combining independently assessed sources can be useful within a carefully designed random generator; this browser app cannot verify that independence or measure those sources. We retain the platform's cryptographic generator and make the sampling reviewable. More independent characters or words enlarge the password space directly.

## What is verified

`npm test` checks range boundaries, exact rejection behavior, source failure, insecure contexts and wordlist properties. `npm run verify:math` compares the formula above with an independent dynamic-programming count for 150 supported configurations. These checks verify our transformations, not the operating system's entropy source. Statistical tests cannot replace cryptographic analysis. [NIST SP 800-22](https://csrc.nist.gov/pubs/sp/800/22/r1/upd1/final)

Retries are bounded and fail closed: at most 128 draws per integer selection and 256 candidates per random password. Under the stated model, integer-cap exhaustion is below $2^{-128}$. The worst supported category acceptance is 0.4379473 at length 8, making candidate-cap exhaustion below $2^{-212}$. Conditioning on success still treats all valid outputs equally. These limits prevent endless rejection loops; they are not RNG health tests.

The browser, operating system, downloaded code and dependencies remain trusted. See [SECURITY.md](../SECURITY.md) for the threat boundary and limitations.
