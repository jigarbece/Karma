// deno-lint-ignore-file no-explicit-any
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'zod';
import { corsHeaders, json } from '../_shared/cors.ts';
import { decryptText, isEncrypted } from '../_shared/crypto.ts';

declare const Deno: { env: { get(name: string): string | undefined }; serve(h: (req: Request) => Response | Promise<Response>): void };

// Admin user management. Only emails in public.admins may call it. `list` and `detail` return counts and points only;
// `entries` returns the decrypted diary text and acts.
const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }),
  z.object({ action: z.literal('detail'), id: z.string().uuid() }),
  z.object({ action: z.literal('entries'), id: z.string().uuid() }),
  z.object({ action: z.literal('block'), id: z.string().uuid() }),
  z.object({ action: z.literal('unblock'), id: z.string().uuid() }),
  z.object({ action: z.literal('delete'), id: z.string().uuid() }),
]);

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get('origin'), Deno.env.get('ALLOWED_ORIGIN'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors);

  try {
    const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: me, error: meErr } = await caller.auth.getUser();
    if (meErr || !me.user?.email) return json({ error: 'unauthorized' }, 401, cors);

    // the service role lives only inside the function runtime
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: admins } = await admin.from('admins').select('email');
    const adminEmails = new Set((admins ?? []).map((a: any) => String(a.email).toLowerCase()));
    if (!adminEmails.has(me.user.email.toLowerCase())) return json({ error: 'not_admin' }, 403, cors);

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: 'bad_request' }, 400, cors);
    const body = parsed.data;

    if (body.action === 'list') {
      const users: any[] = [];
      for (let page = 1; page <= 20; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw error;
        users.push(...data.users);
        if (data.users.length < 200) break;
      }
      const { data: profiles } = await admin.from('profiles').select('id, name, language, onboarding_done');
      // counts and dates only: never the text, the acts' wording or their points
      const { data: entries } = await admin.from('entries').select('user_id, created_at').limit(100000);
      const { data: acts } = await admin.from('actions').select('user_id, type').limit(200000);
      const profileOf = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      const now = Date.now();
      const weekAgo = now - 7 * 86400000;
      const entryCount = new Map<string, number>();
      const week = new Map<string, number>();
      const last = new Map<string, string>();
      for (const e of entries ?? []) {
        entryCount.set(e.user_id, (entryCount.get(e.user_id) ?? 0) + 1);
        if (new Date(e.created_at).getTime() > weekAgo) week.set(e.user_id, (week.get(e.user_id) ?? 0) + 1);
        if (!last.has(e.user_id) || e.created_at > last.get(e.user_id)!) last.set(e.user_id, e.created_at);
      }
      const punya = new Map<string, number>();
      const paap = new Map<string, number>();
      for (const a of acts ?? []) {
        const m = a.type === 'punya' ? punya : a.type === 'paap' ? paap : null;
        if (m) m.set(a.user_id, (m.get(a.user_id) ?? 0) + 1);
      }
      return json({
        users: users
          .map((u) => ({
            id: u.id,
            email: u.email ?? '',
            name: profileOf.get(u.id)?.name ?? '',
            language: profileOf.get(u.id)?.language ?? '',
            onboarded: Boolean(profileOf.get(u.id)?.onboarding_done),
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at ?? null,
            blocked: Boolean(u.banned_until && new Date(u.banned_until).getTime() > now),
            admin: adminEmails.has(String(u.email ?? '').toLowerCase()),
            days_analysed: entryCount.get(u.id) ?? 0,
            analysed_7d: week.get(u.id) ?? 0,
            last_analysed_at: last.get(u.id) ?? null,
            punya_acts: punya.get(u.id) ?? 0,
            paap_acts: paap.get(u.id) ?? 0,
          }))
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
      }, 200, cors);
    }

    if (body.action === 'detail') {
      const { data: t, error: tErr } = await admin.auth.admin.getUserById(body.id);
      if (tErr || !t.user) return json({ error: 'not_found' }, 404, cors);
      const { data: prof } = await admin.from('profiles').select('name, language, onboarding_done').eq('id', body.id).maybeSingle();
      // Aggregated per day, type, category and mode: points and counts only. The wording of acts, their reasons and the
      // diary text are never selected into the response.
      const { data: rows } = await admin.from('actions').select('*').eq('user_id', body.id).limit(20000);
      const groups = new Map<string, any>();
      for (const r of rows ?? []) {
        const mode = r.mode ?? 'done';
        const key = `${r.entry_date}|${r.type}|${r.category}|${mode}`;
        const g = groups.get(key) ?? { date: r.entry_date, type: r.type, category: r.category, mode, points: 0, count: 0 };
        g.points += Number(r.weight) || 0;
        g.count += 1;
        groups.set(key, g);
      }
      const { count: days } = await admin.from('entries').select('id', { count: 'exact', head: true }).eq('user_id', body.id);
      return json({
        user: {
          id: t.user.id, email: t.user.email ?? '', name: prof?.name ?? '', language: prof?.language ?? '', onboarded: Boolean(prof?.onboarding_done),
          created_at: t.user.created_at, last_sign_in_at: t.user.last_sign_in_at ?? null,
          blocked: Boolean((t.user as any).banned_until && new Date((t.user as any).banned_until).getTime() > Date.now()),
          admin: adminEmails.has(String(t.user.email ?? '').toLowerCase()), days_analysed: days ?? 0,
        },
        groups: [...groups.values()],
      }, 200, cors);
    }

    if (body.action === 'entries') {
      // The owner (super admin) reads a user's entries: the decrypted message and every scored act.
      const { data: entries, error: eErr } = await admin.from('entries').select('*').eq('user_id', body.id).order('created_at', { ascending: false }).limit(200);
      if (eErr) throw eErr;
      const { data: acts, error: aErr } = await admin.from('actions').select('*').eq('user_id', body.id).limit(5000);
      if (aErr) throw aErr;
      const key = Deno.env.get('TRANSCRIPT_KEY');
      const out = [];
      for (const e of entries ?? []) {
        let message: string | null = null;
        if (e.transcript) {
          try { message = key && isEncrypted(e.transcript) ? await decryptText(e.transcript, key) : e.transcript; } catch { message = null; }
        }
        out.push({
          id: e.id, date: e.entry_date, created_at: e.created_at, language: e.language, message,
          acts: (acts ?? []).filter((a: any) => a.entry_id === e.id).map((a: any) => ({
            id: a.id, type: a.type, mode: a.mode ?? 'done', category: a.category, points: a.weight, principle: a.basis ?? '',
            summary: a.summary, reason: a.reason ?? '', translations: a.translations ?? {},
          })),
        });
      }
      return json({ entries: out }, 200, cors);
    }

    // block / unblock / delete: never on yourself or on another admin
    if (body.id === me.user.id) return json({ error: 'cannot_manage_self' }, 400, cors);
    const { data: target, error: tErr } = await admin.auth.admin.getUserById(body.id);
    if (tErr || !target.user) return json({ error: 'not_found' }, 404, cors);
    if (adminEmails.has(String(target.user.email ?? '').toLowerCase())) return json({ error: 'cannot_manage_admin' }, 400, cors);

    if (body.action === 'delete') {
      const { error } = await admin.auth.admin.deleteUser(body.id); // all rows go with it (ON DELETE CASCADE)
      if (error) throw error;
    } else {
      const { error } = await admin.auth.admin.updateUserById(body.id, { ban_duration: body.action === 'block' ? '876000h' : 'none' });
      if (error) throw error;
    }
    console.log(`admin ${me.user.id} did ${body.action} on ${body.id}`);
    return json({ ok: true }, 200, cors);
  } catch (e) {
    console.error('admin-users failed', e instanceof Error ? e.message : e);
    return json({ error: 'internal_error' }, 500, cors);
  }
});
