# AI-DLC · Phase 2 — Construction

## 1. Architecture

```
Browser (React PWA, Vercel CDN)
  │  Supabase JS (anon key, user JWT)            ┌───────────────────────────┐
  ├──────────── Auth (Google / email) ──────────▶│ Supabase Auth             │
  ├──────────── REST + RLS ─────────────────────▶│ Postgres (RLS on all)     │
  └──────────── functions.invoke ───────────────▶│ Edge Function analyze-day │──▶ LLM primary ─┐
                                                 │   consent · limit · safety│──▶ LLM fallback ┘ (temp 0)
                                                 │   zod · post-process · save
                                                 └───────────────────────────┘
Edge Function delete-account (service role) ─▶ auth.admin.deleteUser ─▶ ON DELETE CASCADE
```

Units of work (each independently testable): **UoW-1** domain maths (`ghada.ts`, `panchang.ts`) · **UoW-2** data layer (`repo.ts`, local + Supabase) · **UoW-3** scoring service (`_shared/analysis.ts`, `providers.ts`) · **UoW-4** UI shell + design system · **UoW-5** pages · **UoW-6** infra (migrations, CI, Vercel).

## 2. Domain model

`profile 1─* entry 1─* action 1─* feedback`, `action 1─0..1 pratikraman`, `profile 1─* reflection(date)`. Score sign comes from `type`; `weight` is a positive magnitude 1–5. Ghada fill = `points / (50 × days)`; lifetime is logarithmic. `daily_summary` is a `security_invoker` view so RLS still applies.

## 3. Architecture Decision Records

| ADR | Decision | Why | Trade-off |
| --- | --- | --- | --- |
| 001 | **Server-side AI via Edge Function**, never in the browser | Key secrecy, rate limit, safety gate | Cold starts; need function logs |
| 002 | **Persist inside the function** (entry, actions, reflection) | Rate limit cannot be bypassed by skipping the save | Client trusts server result |
| 003 | **Rubric as versioned JSON** (`rubric.v1.json`), version stored per entry | Explainable, auditable, re-scorable | Rubric changes need a new version |
| 004 | **Teachings only from a curated file**; model returns an id from an allow-list | The LLM must never invent verses | Limited variety (47 items) |
| 005 | **Deterministic post-processing** (clamp, drop neutral, Jain ahimsa +1) | Reproducible scores, less prompt reliance | More server code |
| 006 | **Pre-LLM crisis gate** + model flag | Self-harm text never leaves our server unscored | Regex can miss phrasing → model flag as 2nd net |
| 007 | **Provider adapter + fallback chain + retry/backoff** (added this cycle) | Gemini model retired and returned 503 in production | Two keys to manage |
| 008 | **Demo mode with local repo** when Supabase env is absent | Zero-setup trials, hermetic tests | Keyword mock is not the real AI |
| 009 | **Computed Panchang on device** (`astronomy-engine`) | No API, offline, DPDP-friendly | Linear ayanamsa; no adhik māsa |
| 010 | **Design: "sacred night" hero surfaces on an ivory day canvas** | Devotional, modern, high contrast for gold on indigo | Two tone systems (`day`/`night`) in components |
| 011 | **Lazy-load charts**; Recharts only on Insights and Home chart chunk | Lighthouse performance | Small skeleton flash |

## 4. Design system (this cycle)

- **Principles:** calm · devotional · modern · never shaming. Gold = Punya, indigo = growth; always paired with an icon and a word.
- **Tokens:** CSS variables (`--night`, `--night-2`, `--cream`, `--gold-light`, `--lavender`, …) drive Tailwind colours; light and dark themes redefine them.
- **Type:** Cormorant Garamond (Latin display), Tiro Gujarati / Tiro Devanagari (display in gu/hi), Hind Vadodara + Noto Sans Devanagari (UI).
- **Surfaces:** `.panel-night` (hero, gradient + turning mandala), `.panel-saffron` (call-to-action), `.card` (soft glass), `.gold-rule` and a lotus divider as ornament.
- **Motion:** page fade-rise, wave and sparkles in the ghada, halo on the mic; all disabled by `prefers-reduced-motion`.
- **Navigation:** floating night pill on phones; dark temple sidebar with a faint mandala on desktop.
- **A11y:** contrast ≥ 4.5:1 (gold-light on night ≈ 10:1), 44–48 px targets, `aria-pressed` toggles, skip link, labelled charts.

### Design iteration 2 (reference-led "Karma Ghada" layout)

- **Shell:** sticky top bar (lotus mark, wordmark and tagline, search, language, bell with reminder status, avatar menu with Profile and Sign out) over a light sidebar: Home, Talk / Log Day, Insights, Gita Wisdom, Jain Teachings, Pratikraman, Goals & Sankalp, Awards, Journal, plus a daily teaching card. Phones keep the floating pill bar; the sidebar pages are reachable from an Explore grid on Home.
- **Home:** sunrise hero (illustrated riverside temple, peacock feather, flute; optional licensed photo at `public/hero.jpg`) holding greeting, tithi, range toggle, the two ornate ghadas, exact-number cards and the Net Karma card; then the mic panel with waveform, Quick Actions, Today's Reflection, Karma Journey chart and Daily Insight.
- **Ghada:** brass and blackened kalash with embossed lotus petals; a glass medallion on the belly shows the live level and percent, and the mouth glows when it holds liquid.
- **New pages (data-driven, no new tables):** Wisdom (search and theme filters over the curated teachings), Goals & Sankalp (goal picker, weekly progress, Pratikraman commitments), Awards (badges computed from the user's own data), Journal (all entries by day).
- **Tokens added:** `--good` (growth green for positive net, always paired with an arrow), `--sand` (active nav), `--hero-ink`, `--scrim`.

## 5. Threat model (STRIDE, abridged)

| Threat | Vector | Control |
| --- | --- | --- |
| Spoofing | Calling `analyze-day` as someone else | `verify_jwt`, `auth.getUser()` in function |
| Tampering | Editing another user's rows | RLS `user_id = auth.uid()` on every table; WITH CHECK on inserts |
| Repudiation | Disputed score | Rubric version, provider, model stored on each entry |
| Information disclosure | Keys in bundle or logs | Only anon key in browser; secrets in function env; errors scrubbed of key patterns |
| Denial of service / cost | Spamming the LLM | 10/day per user, consent gate, message length cap 4 000 |
| Elevation | Prompt injection in diary text | Delimited data block, schema validation, id allow-list, no tool use |
| CORS abuse | Foreign origins calling functions | Allow-list of origins with tests |
| Content safety | Crisis or abuse text | Pre-LLM gate, helpline UI, nothing stored |

Residual risks: leaked pasted keys (rotate), open Google OAuth app in "Testing" (publish when ready), no WAF (Vercel/Supabase defaults only).

## 6. Test strategy and evidence

| Level | Tooling | What is covered | Count |
| --- | --- | --- | --- |
| Unit | Vitest | ghada maths, panchang (known tithis), schema, post-processing, safety regexes, provider adapters, **retry**, **fallback**, CORS | 44 total incl. below |
| Content | Vitest | 40+ teachings with sources and 3 languages, index in sync, i18n key and placeholder parity | included |
| Component / app | RTL | landing, Home, Talk analysis, safety path, delete confirmation | included |
| E2E | Playwright | demo → Home, talk + disagree, Pratikraman + delete | 3 flows |
| Static | ESLint, `tsc` | strict TS, hooks rules | CI |
| Manual / ops | See `03-operations.md` | live AI, Google login, Lighthouse | checklist |

Definition of done: lint + typecheck + unit + e2e green, build succeeds, docs updated, ADR added for any structural decision, no secret in diff.

## 7. Construction log (this cycle)

1. Added AI **fallback provider** (`AI_FALLBACK_*`) and exponential retry on 429/5xx.
2. Surfaced real error codes to the UI (`internal_error: AI provider error 404 …`).
3. Multi-origin CORS allow-list.
4. Lazy-loaded the Home chart; first-run empty states; streak chip.
5. Full visual redesign (system in §4).
6. Test hardening: hermetic env, longer async timeouts for lazy routes.
