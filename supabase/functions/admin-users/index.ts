// deno-lint-ignore-file no-explicit-any
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'zod';
import { corsHeaders, json } from '../_shared/cors.ts';

declare const Deno: { env: { get(name: string): string | undefined }; serve(h: (req: Request) => Response | Promise<Response>): void };

// Admin user management. Only emails in public.admins may call it. It never returns diary text, acts or points:
// the app promises every user that their entries are private to their own account.
const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }),
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
      const { data: entries } = await admin.from('entries').select('user_id').limit(100000);
      const profileOf = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      const entryCount = new Map<string, number>();
      for (const e of entries ?? []) entryCount.set(e.user_id, (entryCount.get(e.user_id) ?? 0) + 1);
      const now = Date.now();
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
          }))
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
      }, 200, cors);
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
