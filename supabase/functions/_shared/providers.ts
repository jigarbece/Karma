// LLM provider adapter. Selected with AI_PROVIDER = gemini | groq | anthropic | openai.
// The API key only ever lives in Edge Function secrets and never reaches the browser.

export type Provider = 'gemini' | 'groq' | 'anthropic' | 'openai';

export const DEFAULT_MODELS: Record<Provider, string> = {
  gemini: 'gemini-3.8-flash',
  groq: 'openai/gpt-oss-120b',
  anthropic: 'claude-haiku-5-5',
  openai: 'gpt-4o-mini',
};

export interface AiConfig {
  provider: Provider;
  model: string;
  apiKey: string;
}

export function readAiConfig(get: (name: string) => string | undefined): AiConfig {
  const provider = (get('AI_PROVIDER') ?? 'gemini').toLowerCase() as Provider;
  if (!(provider in DEFAULT_MODELS)) throw new Error(`Unsupported AI_PROVIDER "${provider}"`);
  const apiKey = get('AI_API_KEY');
  if (!apiKey) throw new Error('AI_API_KEY is not set');
  return { provider, model: get('AI_MODEL') || DEFAULT_MODELS[provider], apiKey };
}

/**
 * Primary config from AI_*, optional fallback from AI_FALLBACK_PROVIDER / AI_FALLBACK_API_KEY / AI_FALLBACK_MODEL.
 * The fallback is used only when the primary fails (overload, retired model, quota).
 */
export function readAiConfigs(get: (name: string) => string | undefined): AiConfig[] {
  const configs = [readAiConfig(get)];
  const fbProvider = get('AI_FALLBACK_PROVIDER')?.toLowerCase() as Provider | undefined;
  const fbKey = get('AI_FALLBACK_API_KEY');
  if (fbProvider && fbKey) {
    if (!(fbProvider in DEFAULT_MODELS)) throw new Error(`Unsupported AI_FALLBACK_PROVIDER "${fbProvider}"`);
    configs.push({ provider: fbProvider, model: get('AI_FALLBACK_MODEL') || DEFAULT_MODELS[fbProvider], apiKey: fbKey });
  }
  return configs;
}

type Fetch = typeof fetch;

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

/** POST with up to 2 retries (0.8s, 1.6s) for temporary provider overload. */
async function post(f: Fetch, url: string, headers: Record<string, string>, body: unknown, retryDelayMs = 800): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    const res = await f(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
    if (res.ok) return res.json();
    if (RETRYABLE.has(res.status) && attempt < 2) {
      await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)));
      continue;
    }
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`AI provider error ${res.status}: ${detail}`);
  }
}

/** Tries each config in order; returns the first reply and which config produced it. Throws the last error. */
export async function callWithFallback(
  configs: AiConfig[], system: string, user: string, f: Fetch = fetch, retryDelayMs = 800,
): Promise<{ text: string; cfg: AiConfig }> {
  let lastErr: unknown = new Error('no AI provider configured');
  for (const cfg of configs) {
    try {
      return { text: await callModel(cfg, system, user, f, retryDelayMs), cfg };
    } catch (e) {
      lastErr = e;
      console.error(`AI provider ${cfg.provider}/${cfg.model} failed`, e instanceof Error ? e.message.slice(0, 200) : e);
    }
  }
  throw lastErr;
}

/** Returns the raw text of the model's reply. Temperature is always 0. */
export async function callModel(cfg: AiConfig, system: string, user: string, f: Fetch = fetch, retryDelayMs = 800): Promise<string> {
  const send = (url: string, headers: Record<string, string>, body: unknown) => post(f, url, headers, body, retryDelayMs);
  switch (cfg.provider) {
    case 'gemini': {
      const data = (await send(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`,
        { 'x-goog-api-key': cfg.apiKey },
        {
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { temperature: 0, responseMimeType: 'application/json', maxOutputTokens: 2048 },
        },
      )) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    }
    case 'groq':
    case 'openai': {
      const url = cfg.provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
      const data = (await send(url, { authorization: `Bearer ${cfg.apiKey}` }, {
        model: cfg.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      })) as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content ?? '';
    }
    case 'anthropic': {
      const data = (await send('https://api.anthropic.com/v1/messages', { 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01' }, {
        model: cfg.model,
        max_tokens: 2048,
        temperature: 0,
        system,
        messages: [{ role: 'user', content: user }],
      })) as { content?: Array<{ type: string; text?: string }> };
      return data.content?.filter((c) => c.type === 'text').map((c) => c.text ?? '').join('') ?? '';
    }
  }
}

