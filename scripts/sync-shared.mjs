// Copies the tag index of src/content/teachings.json into the Edge Function shared folder.
// Single source of truth: src/content/teachings.json. Run via `npm run sync:shared`.
import { readFileSync, writeFileSync } from 'node:fs';

const teachings = JSON.parse(readFileSync('src/content/teachings.json', 'utf8'));
const index = teachings.map(({ id, traditions, categories }) => ({ id, traditions, categories }));
writeFileSync('supabase/functions/_shared/teachings.index.json', `${JSON.stringify(index, null, 2)}\n`);
console.log(`teachings.index.json: ${index.length} entries`);
