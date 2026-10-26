// Set ALLOWED_ORIGIN (e.g. https://karma.example.com) in function secrets for production.
export function corsHeaders(origin: string | null, allowed: string | undefined): Record<string, string> {
  const allow = allowed && allowed !== '*' ? allowed : origin ?? '*';
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
