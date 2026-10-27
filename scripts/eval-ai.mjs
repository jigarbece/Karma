/**
 * Evaluates the real scoring pipeline (the same code the Edge Function runs) against gold cases in eval/cases.json.
 * It calls the AI provider configured in .env.local (AI_PROVIDER / AI_API_KEY ...), so it spends a few requests.
 *
 *   npm run eval:ai                 all cases
 *   npm run eval:ai -- gu- thought  only cases whose id contains one of these words
 *
 * Checks per case: every expected item is found (right sign, right mode: did it vs only thought it vs intends vs held back),
 * nothing forbidden appears, "nothing to score" cases return nothing. Then the pairs: a deed must outscore a thought or plan.
 * Exits with 1 when the pass rate is below 85%.
 */
import { readFileSync } from 'node:fs';
import { runAnalysis } from '../supabase/functions/_shared/pipeline.ts';
import { readAiConfigs } from '../supabase/functions/_shared/providers.ts';

const env = { ...process.env };
try {
  for (const line of readFileSync('.env.local', 'utf8').replace(/^﻿/, '').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i > 0 && !line.trim().startsWith('#')) env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim();
  }
} catch { /* no .env.local: rely on the environment */ }

const rubric = JSON.parse(readFileSync('supabase/functions/_shared/rubric.v3.json', 'utf8'));
const index = JSON.parse(readFileSync('supabase/functions/_shared/teachings.index.json', 'utf8'));
const { cases, pairs } = JSON.parse(readFileSync('eval/cases.json', 'utf8'));
const configs = readAiConfigs((n) => env[n]);

const filters = process.argv.slice(2);
const selected = cases.filter((c) => filters.length === 0 || filters.some((f) => c.id.includes(f)));

const matches = (a, want) =>
  (!want.type || a.type === want.type) &&
  (!want.modes || want.modes.includes(a.mode)) &&
  (!want.principles || want.principles.includes(a.basis)) &&
  (want.maxPoints === undefined || a.weight <= want.maxPoints);
// for "forbid", maxPoints makes no sense: match on type and mode only
const forbidden = (a, want) => (!want.type || a.type === want.type) && (!want.modes || want.modes.includes(a.mode));

const totals = new Map();
let passed = 0;
const failures = [];
console.log(`Evaluating ${selected.length} case(s) with ${configs[0].provider}/${configs[0].model}\n`);

for (const c of selected) {
  const started = Date.now();
  let actions = [];
  let problem = '';
  try {
    const out = await runAnalysis({ transcript: c.text, ctx: { language: c.lang, tradition: 'hindu_gita', goals: [] }, rubric, index, configs, seed: c.id });
    if (out.safety) problem = 'unexpected safety flag';
    else actions = out.final.actions;
  } catch (e) {
    problem = `error: ${String(e.message).replace(/gsk_[\w-]+|AIza[\w-]+|AQ\.[\w.-]+|sk-[\w-]+/g, '[key]').slice(0, 160)}`;
  }
  totals.set(c.id, actions.reduce((s, a) => s + a.weight, 0));

  const issues = [];
  if (problem) issues.push(problem);
  if (c.none && actions.length > 0) issues.push(`expected nothing, got ${actions.length} item(s)`);
  for (const want of c.expect ?? []) {
    if (!actions.some((a) => matches(a, want))) issues.push(`missing: ${JSON.stringify(want)}`);
  }
  for (const no of c.forbid ?? []) {
    const hit = actions.find((a) => forbidden(a, no));
    if (hit) issues.push(`forbidden ${JSON.stringify(no)} but got ${hit.type}/${hit.mode}/${hit.basis}`);
  }
  const ok = issues.length === 0;
  if (ok) passed++;
  else failures.push(c.id);
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.id}  (${secs}s)`);
  for (const a of actions) console.log(`        ${a.type === 'punya' ? '+' : '-'}${String(a.weight).padStart(2)}  ${a.mode.padEnd(9)} ${a.basis.padEnd(18)} ${a.summary.slice(0, 70)}`);
  for (const i of issues) console.log(`        ! ${i}`);
  // the free Groq tier allows ~8000 tokens a minute and a call uses ~3000, so pace the cases (EVAL_PACE_MS=0 on a paid key)
  await new Promise((r) => setTimeout(r, Number(env.EVAL_PACE_MS ?? 21000)));
}

console.log('');
let pairPass = 0;
let pairTotal = 0;
for (const p of pairs) {
  if (!totals.has(p.more) || !totals.has(p.less)) continue;
  pairTotal++;
  const ok = totals.get(p.more) > totals.get(p.less);
  if (ok) pairPass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  pair  ${p.more} (${totals.get(p.more)}) > ${p.less} (${totals.get(p.less)})  ${p.why}`);
}

const rate = selected.length ? passed / selected.length : 1;
console.log(`\nCases: ${passed}/${selected.length} passed (${Math.round(rate * 100)}%).  Pairs: ${pairPass}/${pairTotal}.`);
if (failures.length) console.log(`Failed: ${failures.join(', ')}`);
process.exit(rate >= 0.85 && pairPass === pairTotal ? 0 : 1);
