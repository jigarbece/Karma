# AI-DLC · Phase 1 — Inception

*Roles in this review: Product Owner (PO), CTO, Senior Developer (Dev). Human approval gates are marked ✅.*

## 1. Vision and problem

**Karma** helps people who follow Gita / Jain / Swaminarayan values notice the moral shape of their day. They tell the app what they did; an AI names the deliberate actions as **Punya** (merit) or **Paap** (growth area), scores them with a published rubric, and shows two filling *ghadas*, charts and a short teaching from scripture.

Problem today: self-reflection practices (Pratikraman, evening review, diary) are habitual but unstructured and hard to sustain. People have no gentle feedback loop, and generic wellness apps feel secular and judgemental.

**North-star outcome:** a user returns on 5 of 7 days for a 2-minute reflection and reports feeling *more aware and kinder*, not *judged*.

## 2. Personas

| Persona | Context | Needs | Risk to avoid |
| --- | --- | --- | --- |
| **Hansaben, 58, Ahmedabad** (Jain) | Gujarati-first, phone only, does Pratikraman | Large readable Gujarati text, voice input, *Michchhami Dukkadam* flow, ahimsa-aware scoring | Tiny text, English-only UI, shame framing |
| **Kunal, 29, Surat** (Hindu / Gita) | Commutes, English + Gujarati mixed speech | Quick voice entry, streaks, charts, goals (less anger) | Slow AI, lost entries |
| **Swami-follower family** | Shared evening ritual | Swaminarayan greetings and Shikshapatri teachings | Wrong tradition content |
| **Operator (you)** | Runs it on free tiers | Low cost, safe AI usage, easy deploy, DPDP-ready | Surprise bills, data leaks |

## 3. Scope (MoSCoW)

**Must (shipped):** landing, Google + email auth, onboarding with consent, Talk (voice/text → analysis), scored action cards, two ghadas, Home with real tithi, Insights, Pratikraman, Settings (export / delete / theme / reminder), gu/hi/en, PWA, RLS, rate limit, safety path, CI.

**Should (this cycle):** AI provider **fallback** (primary overload must not block the user), lazy-loaded charts for performance, first-run empty states, a **spiritual visual redesign**, streak on Home.

**Could (backlog):** push reminders (server), weekly digest, share-card image, shared family ghada, tradition-specific rubric packs, offline queue for entries.

**Won't (now):** social feed, gamified leaderboards (conflicts with non-judgemental values), paid tiers, analytics trackers.

## 4. Epics and user stories with acceptance criteria

**E1 Reflect**
- *As a user I can speak or type my day and get scored actions in my language.*
  AC: result in ≤ 10 s p95; temperature 0; unknown teaching id never shown; neutral routine not scored; ≥ 1 retry on provider 429/5xx.
- *As a user I can disagree with a score.* AC: feedback stored; score unchanged.
- *As a user in distress I am never scored and I see Tele-MANAS 14416.* AC: crisis text never reaches the provider.

**E2 See**
- *I see two ghadas with exact numbers, range toggle, net with trend.* AC: not colour-only; reduced-motion respected.
- *I see weekly trend, strengths, growth areas, goals, streak.* AC: empty states explain what to do next.

**E3 Grow**
- *In Pratikraman I reflect on each Paap and commit to a step; Jain users see Michchhami Dukkadam.* AC: Paap is never erased; completion screen is gentle.

**E4 Trust**
- *I can export and delete everything.* AC: delete requires typed confirmation; cascades all rows and the auth user.
- *Consent is required before any AI processing.* AC: function returns 403 without `consent_at`.

**E5 Feel**
- *The app feels calm, devotional and modern on phone and desktop.* AC: WCAG AA, 44 px targets, one coherent design language, light and dark.

## 5. Non-functional requirements

| Area | Target |
| --- | --- |
| Performance | Lighthouse mobile ≥ 90; initial JS ≤ 200 kB gz excluding lazy chunks |
| Reliability | AI success ≥ 99 % with fallback; no data loss on failure (text kept in box) |
| Security | RLS on all tables; secrets only in function env; CSP; prompt-injection hardening |
| Privacy | DPDP-ready: consent, minimisation, export, erasure, no audio, no trackers |
| Accessibility | WCAG 2.2 AA; screen-reader labels; keyboard complete |
| Cost | Free tiers only; per-user cap of 10 analyses/day |

## 6. Risks and mitigations (CTO view)

| # | Risk | Likelihood / Impact | Mitigation |
| --- | --- | --- | --- |
| R1 | LLM provider outage or model retirement (already happened: Gemini 2.5 retired, 503 spikes) | High / High | Retry with backoff, **fallback provider**, model configurable by secret, surfaced error codes |
| R2 | AI mis-scores or sounds judgemental | Med / High | Published rubric v1, temperature 0, schema validation, disagree link, encouraging prompt rules |
| R3 | Crisis content mishandled | Low / Critical | Pre-LLM regex gate, model flag, helpline UI, no storage |
| R4 | Prompt injection via diary text | Med / Med | Data-delimiting, output schema, id allow-list, server-side post-processing |
| R5 | Secret leakage (keys pasted in chat/logs) | Med / High | Keys only in Supabase secrets, error messages scrubbed, rotate exposed keys |
| R6 | CORS / origin misconfiguration | Med / Med | Multi-origin allow-list with tests |
| R7 | Religious content errors | Low / High | Curated paraphrases with sources, no generated verses, review by a scholar before launch |
| R8 | DPDP non-compliance | Med / High | Consent, export, delete, retention switch; lawyer review of policy |

## 7. Success metrics

Activation (first analysis within 24 h of sign-up) ≥ 60 %; D7 retention ≥ 35 %; analyses per active day ≈ 1.5; AI error rate < 1 %; p95 analysis latency < 10 s; support tickets about shaming = 0.

## 8. Inception outcome ✅

Approved scope for this cycle: **Should** items above, plus documentation of Construction and Operations. Mob-elaboration decisions are recorded as ADRs in `02-construction.md`.
