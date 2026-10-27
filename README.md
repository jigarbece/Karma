# Karma

> See your karma. Grow every day.

Karma is a mobile-first PWA for spiritual self-reflection. You tell it about your day (voice or text, in Gujarati, Hindi or English), an AI identifies your actions as **Punya** (merit) or **Paap** (a growth area), scores them with a published rubric, and shows the result as two filling **ghadas** plus charts. It draws on the Bhagavad Gita and Jain values.

- **Frontend:** React 18, Vite, TypeScript, Tailwind, React Router, Recharts, Framer Motion, `vite-plugin-pwa`
- **Backend:** Supabase (Auth, Postgres + RLS, Edge Functions)
- **AI:** provider-switchable Edge Function (`gemini` | `groq` | `anthropic` | `openai`); the key never reaches the browser
- **Panchang:** `astronomy-engine`, Lahiri ayanamsa, amanta Gujarati months, computed on the device
- **Hosting:** Vercel. **CI:** GitHub Actions. **Tests:** Vitest + React Testing Library + Playwright

## Hero image

The Home hero uses an illustrated sunrise scene. To use a photo instead, add a licensed image at `public/hero.jpg` (about 1600×700, subject on the right). It is layered automatically; delete it to return to the illustration.

## Product and engineering docs (AI-DLC)

- [Inception: vision, personas, stories, risks](docs/aidlc/01-inception.md)
- [Construction: architecture, ADRs, design system, threat model, tests](docs/aidlc/02-construction.md)
- [Operations: release, observability, runbook, backlog, retrospective](docs/aidlc/03-operations.md)
- [Iteration 2: simplify and score by Hindu dharma](docs/aidlc/04-iteration-2-simplify.md)
- [Iteration 3: masked acts, glossy ghadas, shloka and panchang](docs/aidlc/05-iteration-3-privacy-and-ghada.md)

## Try it in 30 seconds (no backend)

```bash
npm install
npm run dev
```

With no Supabase variables set, Karma runs in **demo mode**: data stays in `localStorage`, 30 days of sample history are generated, and a keyword-based mock analyser stands in for the AI. Click **Try the demo** on the landing page.

### Run everything locally with real AI (no Supabase function needed)

Add these to the git-ignored `.env.local` (note: no `VITE_` prefix, so the key is never bundled into the browser):

```
AI_PROVIDER=groq
AI_MODEL=openai/gpt-oss-120b
AI_API_KEY=your-key
# optional second provider if the first fails
# AI_FALLBACK_PROVIDER=gemini
# AI_FALLBACK_API_KEY=your-key
```

Run `npm run dev`, click **Try the demo**, and **Analyse** goes through the dev-only endpoint `/dev-api/analyze` (`vite.dev-ai.ts`), which runs the same scoring pipeline as the `analyze-day` Edge Function. Data stays in `localStorage`. With no AI keys, the keyword mock is used instead. This endpoint exists only in the dev server, never in a production build.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | Typecheck + production build into `dist/` |
| `npm test` | Vitest unit and component tests |
| `npm run e2e` | Playwright, 3 key flows against the built app (demo mode) |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc` |
| `npm run sync:shared` | Regenerates `supabase/functions/_shared/teachings.index.json` from `src/content/teachings.json` (a unit test fails if they drift) |
| `npm run supabase:migrate` | `supabase db push` |
| `npm run supabase:functions:deploy` | Syncs shared data, then deploys `analyze-day` and `delete-account` |
| `npm run seed` | Local/dev only: demo user + 30 days of data (refuses non-local URLs) |

## Deploy, step by step

### 1. Create the Supabase project
1. Go to <https://supabase.com/dashboard> and create a project (free tier). Choose a region near your users (for India, Mumbai `ap-south-1`).
2. In **Project Settings → API** copy the **Project URL** and the **anon public** key. These are the only two values the browser needs.
3. Install the CLI (`npm i -g supabase` or `scoop install supabase`) and log in yourself: `supabase login`.
4. Link the project: `supabase link --project-ref YOUR-PROJECT-REF`.

### 2. Run migrations
```bash
npm run supabase:migrate
```
This applies `supabase/migrations/20261026000000_init.sql` (tables, indexes, the `daily_summary` view, Row Level Security policies, and the trigger that creates a profile when someone signs up). Every table has RLS on, scoped to `auth.uid()`.

### 3. Set Edge Function secrets
Create `supabase/.env.secrets` (it is git-ignored; see `.env.example` for the names):
```
AI_PROVIDER=gemini
AI_API_KEY=your-provider-key
AI_MODEL=
DAILY_ANALYSIS_LIMIT=10
ALLOWED_ORIGIN=https://your-domain
```
Then:
```bash
supabase secrets set --env-file supabase/.env.secrets
npm run supabase:functions:deploy
```
Get a free Gemini key at <https://aistudio.google.com/apikey>. To switch provider, change `AI_PROVIDER`, `AI_API_KEY` and (optionally) `AI_MODEL` and redeploy secrets; no code change.

### 4. Enable Google sign-in
1. In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → OAuth consent screen**: set up an External app named Karma, add your support email.
2. **Credentials → Create credentials → OAuth client ID → Web application**.
   - **Authorised JavaScript origins:** `https://your-domain` and `http://localhost:5173`
   - **Authorised redirect URIs:** `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
3. Copy the Client ID and Client secret into Supabase **Authentication → Providers → Google**, and enable it.
4. In Supabase **Authentication → URL Configuration** set **Site URL** to `https://your-domain` and add these **Redirect URLs**: `https://your-domain`, `https://your-domain/auth?mode=reset`, `http://localhost:5173`.
5. Under **Authentication → Providers → Email** keep **Confirm email** on (email verification) and set minimum password length to 8.

### 5. Deploy the frontend to Vercel
1. Log in yourself: `npx vercel login`, then `npx vercel link` in this folder (or import the GitHub repo at <https://vercel.com/new>).
2. Add environment variables (Production and Preview): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (and optionally `VITE_GHADA_DAILY_CAP`, `VITE_DAILY_ANALYSIS_LIMIT`).
3. Deploy: `npx vercel --prod`. `vercel.json` already contains the SPA rewrite and security headers (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy).
4. **Custom domain:** Vercel project → **Settings → Domains → Add**, then create the DNS record Vercel shows (A/CNAME). Update `ALLOWED_ORIGIN`, the Supabase Site URL/redirects and the Google OAuth origins to the new domain.

### 6. Test checklist
- [ ] Landing page loads; language switch works (ગુજરાતી / हिंदी / English)
- [ ] Sign up with email → verification mail arrives → link signs you in → onboarding appears
- [ ] Google sign-in works (after step 4)
- [ ] Onboarding saves profile; consent is required to finish
- [ ] Home shows greeting, today's date and the Gujarati tithi line
- [ ] Talk: typing a day and pressing **Analyse** returns action cards and the ghadas animate
- [ ] A self-harm sentence returns the supportive message with **14416**, with nothing scored
- [ ] 11th analysis in a day shows the friendly limit message (default limit 10)
- [ ] "Keep my words" off → entry text is gone after analysis, actions remain
- [ ] **Insights** and **Pratikraman** show data; Pratikraman saves a reflection and shows the completion screen
- [ ] **Profile → Export** downloads JSON and CSV
- [ ] **Profile → Delete** removes the account (user disappears from Supabase **Authentication → Users**, rows gone)
- [ ] Two different accounts cannot see each other's data (RLS)
- [ ] Install as an app on a phone; mic permission prompt appears only when you tap the mic
- [ ] Lighthouse mobile ≥ 90 on Performance, Accessibility, Best Practices and SEO

## How scoring works

- Rubric: `supabase/functions/_shared/rubric.v2.json` (versioned; stored on every entry). Hindu dharma principles (Gita, Mahabharata, Upanishads, Puranas, Manusmriti 6.92), each with an indicative range inside 1-50 points. The AI picks the exact points per act from intention, effort, who benefited and severity; the server keeps it inside the principle's range and stores the principle with the act. Neutral routine is not scored.
- The Edge Function calls the model at **temperature 0**, validates the reply with **zod**, retries once on invalid output, then post-processes deterministically (clamps weights, drops neutral items, applies the Jain `ahimsa_food` +1).
- The reflection teaching is chosen **only** from `src/content/teachings.json` (47 short paraphrases with sources). If the model returns an unknown id, a deterministic fallback is used. The model can never invent a verse.
- Crisis language (self-harm, suicide, abuse, intent to harm others) is caught before the provider is called; nothing is scored and Tele-MANAS 14416 is shown.
- Ghada: full at 100 points per day (configurable), week ×7, month ×30, lifetime on a log scale.

## Privacy

Saved messages are encrypted at rest with AES-256-GCM (key in the `TRANSCRIPT_KEY` function secret) and are never shown back in the app; History shows a masked notice and only the scored acts. The text is still sent to the AI provider in plain form to be scored, and in transit it is protected by TLS. No audio is ever stored (voice is converted to text by your browser's speech service). No analytics, trackers or ads. Users can export (JSON/CSV) and delete everything. Replace the placeholder contact address `privacy@karma.example` in `src/content/legal.ts` and `src/i18n/*.json`, and have the policy reviewed by a lawyer before launch; it is written for India's DPDP Act but is not legal advice.

## Known limitations

- The daily reminder is a browser notification that fires while the app/PWA is open; it is not a server push.
- Panchang uses a linear Lahiri ayanamsa approximation and does not mark *adhik* months. Tithi is taken at local sunrise for Ahmedabad.
- Voice depends on the browser's Web Speech API (best in Chrome/Edge/Android); text always works.
- The `AI_MODEL` defaults are suggestions and providers retire models (Google retired `gemini-2.5-flash` for new users); if analysis returns `AI provider error 404 ... model`, run `npx supabase secrets set AI_MODEL=<current model>`.
