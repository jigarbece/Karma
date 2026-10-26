// LLM provider adapter. Selected with AI_PROVIDER = gemini | groq | anthropic | openai.
// The API key only ever lives in Edge Function secrets and never reaches the browser.

export type Provider = 'gemini' | 'groq' | 'anthropic' | 'openai';

export const DEFAULT_MODELS: Record<Provider, string> = {
  gemini: 'gemini-3.8-flash',
  groq: 'llama-3.3-70b-versatile',
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

type Fetch = typeof fetch;

async function post(f: Fetch, url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  const res = await f(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`AI provider error ${res.status}: ${detail}`);
  }
  return res.json();
}

/** Returns the raw text of the model's reply. Temperature is always 0. */
export async function callModel(cfg: AiConfig, system: string, user: string, f: Fetch = fetch): Promise<string> {
  switch (cfg.provider) {
    case 'gemini': {
      const data = (await post(
        f,
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
      const data = (await post(f, url, { authorization: `Bearer ${cfg.apiKey}` }, {
        model: cfg.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      })) as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content ?? '';
    }
    case 'anthropic': {
      const data = (await post(f, 'https://api.anthropic.com/v1/messages', { 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01' }, {
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
