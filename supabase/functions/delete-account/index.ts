import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

declare const Deno: { env: { get(name: string): string | undefined }; serve(h: (req: Request) => Response | Promise<Response>): void };

// Deletes the signed-in user. All rows are removed by ON DELETE CASCADE foreign keys.
Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get('origin'), Deno.env.get('ALLOWED_ORIGIN'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors);

  const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data, error } = await caller.auth.getUser();
  if (error || !data.user) return json({ error: 'unauthorized' }, 401, cors);

  // Service role is only available inside the function runtime, never in the browser.
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error: delErr } = await admin.auth.admin.deleteUser(data.user.id);
  if (delErr) return json({ error: 'delete_failed' }, 500, cors);
  return json({ ok: true }, 200, cors);
});
