// ALLOWED_ORIGIN accepts one origin or a comma-separated list, e.g.
//   https://karma.example.com,http://localhost:5173
// Leave it unset (or "*") only for quick local experiments.
export function corsHeaders(origin: string | null, allowed: string | undefined): Record<string, string> {
  const list = (allowed ?? '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
  let allow: string;
  if (list.length === 0 || list.includes('*')) allow = origin ?? '*';
  else if (origin && list.includes(origin)) allow = origin;
  else allow = list[0];
  return {
    'access-control-allow-origin': allow,
    'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
    vary: 'origin',
  };
}

export function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'content-type': 'application/json' } });
}
