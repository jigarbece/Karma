# AI-DLC · Iteration 2 — Simplify and score by dharma

## Inception (PO + CTO)

**Feedback from the product owner:** "Too messy. Keep it simple: the user says daily things and a pot shows filled with Paap or Punya, calculated by AI based on Hindu dharma, with different points for each task, based on the Puranas."

**Decision:** cut the product to its core loop and make the score meaningful.

| Keep | Cut (removed from the app) | Change |
| --- | --- | --- |
| Say your day (voice or text) | Sunrise hero, quick actions, daily insight, charts | One screen: pots, input, today's acts |
| Two pots with exact points | Insights, Pratikraman, Goals, Awards, Gita/Jain pages, search, bell | Navigation = Home, History, Profile |
| Safety path, consent, export, delete | Tradition and goals questions in onboarding | Onboarding = name, language, greeting, consent |
| Per-act reason and "I disagree" | Fixed small weights (1-5) | **Graded 1-50 per act, by dharma principle** |

**Success criteria:** a first-time user understands the screen in 5 seconds; two different acts in one entry never get the same points by default; every score names the principle it was weighed against.

## Construction

**ADR-012 Rubric v2, "Hindu dharma".** `supabase/functions/_shared/rubric.v2.json` defines 24 principles (12 Punya, 12 Paap) with indicative point ranges, e.g. annadāna 10-45, mātṛ-pitṛ seva 10-45, paropakāra 5-40, satya 5-40, kṣamā 4-35, bhakti 3-30, hiṁsā 15-50, steya 8-45, krodha 3-35, paruṣa-vāṇī 2-30. Sources are cited only at the level we can stand behind: Vyasa's verse on the Puranas (paropakāraḥ puṇyāya, pāpāya parapīḍanam), Manusmriti 6.92 (ten marks of dharma), Bhagavad Gita 9.27, 16.21, 17.15, 17.20, 3.35, 18.46, Taittiriya Upanishad 1.11, Mahabharata (Anushasana Parva). Where the tradition is broad (go-seva), the source says so instead of inventing a verse.

**ADR-013 The model chooses the exact number; code enforces the range.** The prompt gives the principle ranges and the factors that move a score inside the range: intention (bhāva), sacrifice and effort, number and vulnerability of beings helped or harmed, consistency, severity and reversibility, amends. The server then clamps each score to its principle's range (or 1-50 when the principle is unknown or of the wrong type) and stores the principle id in `actions.basis`. Models never output verse numbers; the app maps the id to a label and source.

**ADR-014 Pot capacity.** A pot fills at 100 points per day (was 50), because one act can now be worth up to 50. Week ×7, month ×30, lifetime on a log scale. Configurable with `VITE_GHADA_DAILY_CAP`.

**Data migration:** `20261027000000_dharma_points.sql` widens the `weight` check to 0-100 and adds `basis`. Old rows (weights 1-5) remain valid.

**Verified with the real provider (Groq `openai/gpt-oss-120b`):** one entry returned annadāna 38, mother's care 34, helping a neighbour 19, morning prayers 12, harsh speech to a brother 14, a small lie 9, each with its principle.

**Tests:** 50 unit and component tests (range clamping, wrong-type principle ignored, rejects > 50, prompt contains the principles, rubric sanity, simple-navigation test, per-act points and principle shown) and 3 Playwright flows.

## Operations

- Apply the migration, then redeploy: `npm run supabase:functions:deploy` (the function now imports `rubric.v2.json`). Until both are done, the cloud function keeps scoring with the old rubric and inserts would fail the new `basis` column.
- Watch `action_feedback` ("I disagree") monthly. If users or scholars consistently disagree with a principle's range, publish rubric v3 rather than editing v2.
- **Review needed:** ranges are our own mapping of dharmic weight, not a scholarly consensus. Ask a Sanatana dharma scholar to review `rubric.v2.json` (principles, ranges and sources) before public launch, and keep the in-app note that scores are guidance, not a religious ruling.

## Retrospective

Too many features hid the one thing users came for. Removing five pages cut code and decisions; making the score principle-based and graded made the single remaining screen worth looking at.
