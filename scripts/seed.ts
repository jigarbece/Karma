/**
 * DEV / LOCAL ONLY. Creates a demo user with 30 days of sample data.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed
 *
 * Refuses to run against a URL that is not localhost unless SEED_ALLOW_REMOTE=true.
 * The service role key is read from the environment only; never put it in a .env that Vite serves.
 */
import { createClient } from '@supabase/supabase-js';
import { sampleHistory } from '../src/lib/sample';
import { localDate } from '../src/lib/ghada';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
if (!/localhost|127\.0\.0\.1/.test(url) && process.env.SEED_ALLOW_REMOTE !== 'true') {
  throw new Error('Refusing to seed a non-local project. Set SEED_ALLOW_REMOTE=true if you really mean it.');
}

const email = process.env.DEMO_EMAIL ?? 'demo@karma.local';
const password = process.env.DEMO_PASSWORD ?? `demo-${Math.random().toString(36).slice(2, 10)}A1`;
const admin = createClient(url, key, { auth: { persistSession: false } });

const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
let userId = created?.user?.id;
if (error) {
  const { data: list } = await admin.auth.admin.listUsers();
  userId = list?.users.find((u) => u.email === email)?.id;
  if (!userId) throw error;
  await admin.auth.admin.updateUserById(userId, { password });
}
if (!userId) throw new Error('no user id');

await admin.from('profiles').upsert({
  id: userId, name: 'Demo', language: 'en', tradition: 'hindu_gita', greeting: 'jsk', goals: ['more_seva', 'less_anger'],
  consent_at: new Date().toISOString(), onboarding_done: true,
});
await admin.from('entries').delete().eq('user_id', userId);

const today = localDate(new Date(), 'Asia/Kolkata');
const byDate = new Map<string, string>();
for (const s of sampleHistory(today)) {
  let entryId = byDate.get(s.date);
  if (!entryId) {
    const { data: e, error: ee } = await admin.from('entries').insert({ user_id: userId, entry_date: s.date, language: 'en', rubric_version: 'v1', ai_provider: 'seed' }).select('id').single();
    if (ee) throw ee;
    entryId = e.id as string;
    byDate.set(s.date, entryId);
  }
  const { error: ae } = await admin.from('actions').insert({
    user_id: userId, entry_id: entryId, entry_date: s.date, summary: s.summary, type: s.type, category: s.category,
    weight: s.weight, reason: s.reason, intention_note: '',
  });
  if (ae) throw ae;
}
console.log(`Seeded ${byDate.size} days for ${email}. Password: ${password}`);
