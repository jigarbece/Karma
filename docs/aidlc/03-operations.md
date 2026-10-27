# AI-DLC · Phase 3 — Operations

## 1. Environments

| Env | URL | Data | Notes |
| --- | --- | --- | --- |
| Local | http://localhost:5173 | Demo (`localStorage`) or Supabase | `.env.local` is git-ignored |
| Production | https://karma-828u.vercel.app | Supabase project `qdkqsdaloamhbshtcqxi` | Vercel auto-deploys `main` |

Config matrix

| Setting | Where | Value |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Vercel env | public by design |
| `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` | `supabase secrets` | primary |
| `AI_FALLBACK_PROVIDER`, `AI_FALLBACK_API_KEY`, `AI_FALLBACK_MODEL` | `supabase secrets` | recommended second provider |
| `ALLOWED_ORIGIN` | `supabase secrets` | `https://karma-828u.vercel.app,http://localhost:5173` (drop localhost for prod-only) |
| `DAILY_ANALYSIS_LIMIT` | `supabase secrets` | default 10 |
| `TRANSCRIPT_KEY` | `supabase secrets` | 32-byte base64 key that encrypts saved messages; losing it makes old messages unreadable (the app never reads them anyway); never rotate without a plan |

## 2. Release process

1. Branch → PR → CI (`lint`, `typecheck`, `test`, `build`, `e2e`).
2. Merge to `main` → Vercel builds the frontend.
3. If `supabase/functions` or `_shared` changed: `npm run supabase:functions:deploy`.
4. If `supabase/migrations` changed: `npm run supabase:migrate` (additive migrations only; never edit an applied file).
5. Smoke test (below). Roll back the frontend with *Vercel → Deployments → Promote previous*; roll back a function by redeploying the previous commit.

## 3. Smoke test (after every release, 3 minutes)

- [ ] `/welcome`, `/auth`, `/privacy` return 200
- [ ] Google login completes and lands on onboarding or Home
- [ ] Talk → Analyse returns scored cards; Home ghadas update
- [ ] Crisis sentence returns the 14416 message and **no** new rows in `actions`
- [ ] Profile → Export downloads JSON; sign out works
- [ ] Network tab shows no call to any host except the app, Supabase, Google Fonts

## 4. Observability (no third-party trackers)

| Signal | Where | Alert threshold |
| --- | --- | --- |
| Function errors | Supabase → Edge Functions → analyze-day → Logs (`analyze-day failed`, `AI provider … failed`) | any burst of `AI provider error 4xx/5xx` |
| Fallback usage | log line `AI provider <x> failed` followed by a success | > 5 % of calls ⇒ primary degraded |
| Rate-limit hits | `analysis_log` rows per user per day | user at 10/day repeatedly ⇒ review limit |
| Auth issues | Supabase → Authentication → Logs | spikes of `redirect_uri_mismatch` or failed logins |
| Frontend | Vercel → Deployments / Logs; browser console | build failures |

Useful SQL (Supabase SQL Editor):

```sql
-- analyses per day, last 14 days
select local_date, count(*) from analysis_log group by 1 order by 1 desc limit 14;
-- model/provider mix
select ai_provider, ai_model, count(*) from entries group by 1,2 order by 3 desc;
-- feedback ("I disagree") to review rubric quality
select a.category, a.type, a.weight, f.comment from action_feedback f join actions a on a.id = f.action_id order by f.created_at desc limit 50;
```

## 5. Runbook

| Symptom | Likely cause | Action |
| --- | --- | --- |
| "Failed to send a request to the Edge Function" | CORS origin not allowed | `secrets set "ALLOWED_ORIGIN=<site>,<other>"`; check origin has no trailing slash |
| `AI provider error 404 … model … no longer available` | Model retired | `secrets set AI_MODEL=<current>`; add a fallback provider |
| `AI provider error 503 / 429` | Provider overload or quota | Retry is automatic; set `AI_FALLBACK_*`; check quota |
| `AI provider error 400/401/403` | Bad or revoked key | Create new key, `secrets set AI_API_KEY=…` (no redeploy needed) |
| `consent_required` | User skipped consent | Finish onboarding |
| `rate_limited` | 10/day reached | Expected; raise `DAILY_ANALYSIS_LIMIT` if intended |
| `ai_invalid_output` | Model returned non-JSON twice | Switch model/provider; inspect logs |
| Google `redirect_uri_mismatch` | Callback URI not registered | Add `https://<ref>.supabase.co/auth/v1/callback` under *Authorised redirect URIs* |
| Google "access blocked / testing" | App not published | Add test users or publish the consent screen |
| Signed in but no profile | Migration trigger missing | Re-run `20261026000000_init.sql`; app also self-heals by upserting a profile |
| Vercel site shows demo button / no auth | Env vars missing at build | Set `VITE_*` in Vercel, **Redeploy** |

Incident process: acknowledge → mitigate (switch provider/model, raise nothing, never paste secrets in chat) → communicate → fix → blameless note appended to §8.

## 6. Security and compliance operations

- **Secrets hygiene:** rotate any key that was shared in chat or screenshots (Gemini, Groq, Google OAuth client secret). Keys live only in Supabase secrets and the Vercel UI.
- **Data requests (DPDP):** export and delete are self-serve. For a manual erasure: Supabase → Authentication → Users → delete user (cascades all rows).
- **Retention:** user data stays until deleted; transcripts can be dropped per user via the "Keep my words" switch.
- **Before public launch:** publish the Google consent screen; replace `privacy@karma.example`; legal review of privacy and terms; scholar review of teachings; set production-only `ALLOWED_ORIGIN`.
- **Backups:** enable Supabase backups (paid) or schedule a periodic `pg_dump` if data becomes valuable.

## 7. Cost guardrails (free tiers)

| Resource | Limit to watch | Guardrail |
| --- | --- | --- |
| LLM | provider free quota | 10 analyses/user/day; fallback provider; short prompts |
| Supabase | 500 MB DB, 50 k MAU, 500 k function calls | no audio, text only, rate limit |
| Vercel | bandwidth on hobby plan | static PWA, immutable asset caching |

## 8. Backlog (prioritised by PO + CTO)

| # | Item | Value | Effort |
| --- | --- | --- | --- |
| 1 | Verify Lighthouse ≥ 90 on live URL and fix findings | Quality gate | S |
| 2 | Server-side reminders (Web Push via Supabase cron) | Retention | M |
| 3 | Weekly digest card + share image (no PII) | Growth | M |
| 4 | Pratikraman reminders on Jain festival days (Paryushan, Samvatsari) | Relevance | M |
| 5 | Admin-free quality loop: review "I disagree" feedback monthly, publish rubric v2 | Trust | S |
| 6 | Offline queue for entries, sync when online | Reliability | M |
| 7 | Tradition rubric packs (Jain ahimsa detail, Swaminarayan niyams) | Depth | L |
| 8 | Playwright run against staging with a real test account | Confidence | M |
| 9 | Error tracking without trackers (self-hosted or log drain) | Ops | M |

## 9. Retrospective (this cycle)

**Went well:** lint, typecheck and tests caught defects before release (stray BOM character, invalid list markup, tests leaking into the real Supabase config); clear ADRs.
**Hurt:** provider volatility (retired model, 503s) reached users; a generic error hid the cause; CORS only allowed one origin; secrets were pasted into chat.
**Changed:** fallback + retry, visible error codes, multi-origin CORS, runbook, key-hygiene rules.
**Next cycle goal:** make a returning user's second week delightful (reminders, digest) while keeping cost at zero.
