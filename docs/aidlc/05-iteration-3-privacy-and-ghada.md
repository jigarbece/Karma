# AI-DLC · Iteration 3 — Masked acts, glossy ghadas, shloka and panchang

## Inception (PO)

**Feedback:** "Showing things like 'Spoke harsh words to my wife' directly should not happen; mask it on Home and History. Use the ghada design from the provided HTML. Make the page look amazing with Bhagavad Gita shlokas or images."

**Decisions**
1. **Private by default on screen.** What a person did (summary, reason) is never printed by default. We also hide the category and the dharma principle while masked, because "Paruṣa-vāṇī" or "Anger" would give the act away. What stays visible: the points, and Punya or Growth area, so the pots still make sense.
2. **A deliberate reveal.** A "Show" button reveals one act (summary, reason, category, principle with source) and hides it again after 8 seconds or on "Hide". This keeps the app useful (users can check a score and use "I disagree") without exposing acts to a passer-by.
3. **Ghada design is taken from `karma_ghada_ultra_glossy_contrast_demo.html`:** same geometry, gradients, brass and blackened-steel metals, glass shell, engraved bands, lotus engraving, specular highlights, rippling surface, bubbles and sparkles; live fill from y=390 to y=138; card layout with kicker, title, pot, score, caption; net bar. Score colours follow the demo (green for Punya, deep red for Paap), always with sign, label and percent.
4. **Shloka of the day** (8 Gita verses in Devanagari, transliteration and a short meaning in en/gu/hi) on a deep indigo and gold panel with an Om chakra and a peacock feather; also on the landing page.
5. **Astrologer's touch:** a Panchang strip with vara and its graha, tithi, nakshatra with pada and Chandra rashi, plus one line of traditional guidance for the weekday's graha. Computed on the device for Ahmedabad (Lahiri ayanamsa) with `astronomy-engine`; verified against Sharad Purnima 2026 (Ashwini, Mesha, Monday, Aaso Sud 15).

## Construction

- `ActionCard` holds the mask state; `data-testid="masked-act"` / `act-text` / `basis` make the behaviour testable.
- `Ghada.tsx` is a faithful React port with a look table for the gold and dark variants and unique SVG ids per instance; liquid, surface and band animate with Framer Motion (instant under reduced motion; CSS pulses are disabled by the global reduced-motion rule).
- `src/lib/astro.ts` (nakshatra, rashi, vara, `panchangFor`), `src/content/shlokas.ts`, `ShlokaCard`, `SacredArt`, `PanchangStrip`.

**Honest limits**
- Only the *message* is encrypted at rest (iteration 2). The short AI-written act summaries are stored as plain text in the database and are hidden on screen, not encrypted. If acts must also be unreadable in the database, encrypt `actions.summary`, `reason` and `intention_note` with the same `TRANSCRIPT_KEY` and add a decrypt endpoint for the Show button.
- Shloka text was written from the standard Gita text and must be proof-read by a scholar before public launch. Panchang values and weekday guidance are traditional, for guidance only, and not a replacement for a printed panchang or a personal astrological consultation.

## Tests

61 unit and component tests (masking by default, reveal and re-hide, History masked, panchang for a known date, shloka present) and 3 Playwright flows.
