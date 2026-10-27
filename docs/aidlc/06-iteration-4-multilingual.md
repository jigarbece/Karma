# AI-DLC · Iteration 4 — Everything in the selected language

## Inception (PO)

**Feedback:** "All the text should translate as per the language selected, the message as well."

**Problem found:** UI strings were translated, but what the AI wrote about an act was fixed in the language active when the user pressed Analyse. Switching language later left old text behind. The dharma principle names, descriptions and sources were English only, and a few labels were hard-coded.

**Decision:** one AI call returns every act in English, Gujarati and Hindi, and the UI picks the selected one; no second call and no machine translation at display time.

## Construction

- **Scoring pipeline:** each action carries `i18n: {en,gu,hi}: {summary, reason}` and the reflection carries `suggestion_i18n`. Validated with zod (all optional, so a model that omits a language does not fail), cleaned in `finalize` and stored as `actions.translations` (jsonb). Token limits raised to 6144.
- **Prompt rule:** reasons must be natural sentences and must not print principle ids (found in a live test: "Parusha_vani, hurtful speech…").
- **UI:** `ActionCard` shows `translations[lang]` and falls back to the original text for older rows. The dharma principle name, description and source come from `src/content/principleText.ts` (Gujarati and Hindi for all 24 principles); the About page lists them in the selected language. Suggestion text on Home follows the language too.
- **Hard-coded text removed:** skip link, brand name (Karma / કર્મ / कर्म), landing eyebrow, pot labels, document title.
- **Demo mode:** sample history and the keyword mock produce translations for all three languages.
- **Migration:** `20261027000100_translations.sql` adds `actions.translations`.

## Verified

- Live Groq call: four acts, each with en/gu/hi summary and reason, plus a translated suggestion.
- Browser: after analysing in English, switching to Gujarati and Hindi changed the revealed act text and the principle name and source; the tab title changed language.
- 63 unit and component tests; i18n key parity across en/gu/hi; every principle has Gujarati (Gujarati script) and Hindi (Devanagari) text.

## Limits

- Entries saved **before** this change have no translations and keep the language they were written in.
- Gujarati and Hindi text produced by the model can contain small grammar slips (seen in testing). The curated UI strings, principle names and sources were written by hand; have a native speaker review them before launch.
- The message the person typed is never shown back (iteration 2), so it needs no translation.
