# Deployment checklist: https://karma.jigarpandya.info

Project values used below
- Live site: `https://karma.jigarpandya.info` (old Vercel address: `https://karma-828u.vercel.app`)
- Supabase project ref: `qdkqsdaloamhbshtcqxi`
- Repo: `https://github.com/jigarbece/Karma`

## 0. Why login "comes back to localhost"

The app asks Supabase to return the user to `window.location.origin`. Supabase only honours that address if it is in the **Redirect URLs** allow-list; otherwise it falls back to the **Site URL**, which is still `http://localhost:5173`. Fix: step 1.

## 1. Supabase → Authentication → URL Configuration (fixes the localhost redirect)

| Field | Value |
| --- | --- |
| Site URL | `https://karma.jigarpandya.info` |
| Redirect URLs (add all) | `https://karma.jigarpandya.info` · `https://karma.jigarpandya.info/**` · `https://karma.jigarpandya.info/auth?mode=reset` · `https://karma-828u.vercel.app/**` · `http://localhost:5173/**` · `http://localhost:5174/**` |

Save. Test in a private window right away (no redeploy needed).

## 2. Google Cloud → your OAuth client

- **Authorised JavaScript origins:** `https://karma.jigarpandya.info`, `https://karma-828u.vercel.app`, `http://localhost:5173`
- **Authorised redirect URIs:** unchanged: `https://qdkqsdaloamhbshtcqxi.supabase.co/auth/v1/callback`
- **Google Auth Platform → Branding:** add `jigarpandya.info` under *Authorised domains*; app home page `https://karma.jigarpandya.info`; privacy policy `https://karma.jigarpandya.info/privacy`; terms `https://karma.jigarpandya.info/terms`.
- **Audience:** click **Publish app** so people other than test users can sign in.
- Reset the client secret (it was shared in chat) and paste the new one in Supabase → Authentication → Providers → Google.

## 3. Database: run once in Supabase → SQL Editor

```sql
alter table public.actions drop constraint if exists actions_weight_check;
alter table public.actions add constraint actions_weight_check check (weight between 0 and 100);
alter table public.actions add column if not exists basis text not null default '';
alter table public.actions add column if not exists translations jsonb not null default '{}'::jsonb;
notify pgrst, 'reload schema';
```

## 4. Edge Function secrets (terminal, in the project folder)

```bash
npx supabase login
npx supabase link --project-ref qdkqsdaloamhbshtcqxi
npx supabase secrets set AI_PROVIDER=groq AI_MODEL=openai/gpt-oss-120b AI_API_KEY=<new Groq key>
npx supabase secrets set TRANSCRIPT_KEY=<output of: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
npx supabase secrets set "ALLOWED_ORIGIN=https://karma.jigarpandya.info,https://karma-828u.vercel.app,http://localhost:5173"
# optional fallback provider
npx supabase secrets set AI_FALLBACK_PROVIDER=gemini AI_FALLBACK_API_KEY=<Gemini key> AI_FALLBACK_MODEL=gemini-3.8-flash
```

Keep a copy of `TRANSCRIPT_KEY` in a password manager. If it is unset, the function saves no message text at all.

## 5. Deploy the functions

```bash
npm run supabase:functions:deploy
```

## 6. Push the code (Vercel builds from `main`)

```bash
gh auth login        # once; browser login
gh auth setup-git
git push -u origin main
```

## 7. Vercel

- **Settings → Domains:** `karma.jigarpandya.info` shows *Valid Configuration* (DNS: CNAME to the target Vercel shows; already resolving).
- **Settings → Environment Variables (Production):** `VITE_SUPABASE_URL=https://qdkqsdaloamhbshtcqxi.supabase.co` and `VITE_SUPABASE_ANON_KEY=<publishable key>`. Do **not** set `VITE_ALLOW_DEMO`. After changing variables, **Redeploy**.
- Optional: redirect `karma-828u.vercel.app` to the custom domain (Domains → Edit → Redirect).

## 8. Smoke test on the live site (private window)

- [ ] `https://karma.jigarpandya.info/welcome` loads, language switch works
- [ ] **Continue with Google** returns to `karma.jigarpandya.info` (not localhost) and lands on onboarding
- [ ] Onboarding saves; Home shows the two pots, message box first
- [ ] Analyse returns scored acts; Insights charts appear; the acts stay masked until the eye is tapped
- [ ] Switching Gujarati / Hindi changes act text, principle names and the shloka script
- [ ] Table Editor: `entries.transcript` starts with `enc:v1:`; `actions.translations` has en/gu/hi
- [ ] Sign out works; Profile → Export downloads; Delete removes the account
- [ ] A crisis sentence shows the 14416 message and writes no rows

## 9. Hygiene before sharing the link

- Rotate every key pasted in chat: Groq, Gemini, Google client secret.
- Replace `privacy@karma.example` in `src/content/legal.ts` and `src/i18n/*.json` with a real address.
- Scholar review of `rubric.v2.json` ranges and the shloka text; lawyer review of the privacy policy and terms.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Login returns to localhost | Redirect URL not allow-listed, Site URL still localhost | Step 1 |
| `redirect_uri_mismatch` | Supabase callback missing in Google client | Step 2 (redirect URI) |
| "Access blocked: app not verified" | Google app still in *Testing* | Publish app, or add test users |
| "Failed to send a request to the Edge Function" | `ALLOWED_ORIGIN` lacks the domain | Step 4 |
| `save_failed: Could not find the 'basis' / 'translations' column` | SQL not applied | Step 3 |
| `AI provider error 404 … model` | Model retired | `secrets set AI_MODEL=<current>` |
| Site shows old design | Vercel still on an old build | Step 6, then check Deployments |
