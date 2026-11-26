// One place for every AI call. Pick the provider in .env.local with AI_PROVIDER=gemini|anthropic|openai.
// Uses plain fetch, so no extra SDK is needed for any provider.

export class UserFacingError extends Error {}

const PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

const MODELS = {
  gemini: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  anthropic: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
  openai: process.env.OPENAI_MODEL || 'gpt-6-luna',
};
const MODEL = MODELS[PROVIDER];
export const AI_MODEL = `${PROVIDER}/${MODEL}`;

const TIMEOUT_MS = 50_000;

function extractJson(text) {
  const cleaned = String(text || '').replace(/```(?:json)?/gi, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  try {
    if (start === -1 || end <= start) throw new Error('no json');
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new UserFacingError('The AI returned an unreadable answer. Please try again.');
  }
}

function httpError(status, body) {
  console.error(`[AI:${PROVIDER}] HTTP ${status}:`, String(body).slice(0, 600));
  if (status === 401 || status === 403) {
    return new UserFacingError(`The ${PROVIDER} API key is missing, invalid, or not allowed to use this model. Check .env.local.`);
  }
  if (status === 404) return new UserFacingError(`The ${PROVIDER} model "${MODEL}" was not found. Check the model name in .env.local.`);
  if (status === 429) return new UserFacingError(`The ${PROVIDER} API rate limit or quota was reached. Wait a minute, or check your plan and billing.`);
  return new UserFacingError(`The ${PROVIDER} API returned an error (HTTP ${status}). Please try again.`);
}

async function post(url, headers, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) throw httpError(res.status, text);
    return JSON.parse(text);
  } catch (err) {
    if (err instanceof UserFacingError) throw err;
    if (err.name === 'AbortError') throw new UserFacingError('The AI took too long to answer. Please try again.');
    console.error(`[AI:${PROVIDER}] request failed:`, err);
    throw new UserFacingError('Could not reach the AI service. Please try again.');
  } finally {
    clearTimeout(timer);
  }
}

function requireKey(name) {
  const key = process.env[name];
  if (!key) throw new UserFacingError(`${name} is missing in .env.local (AI_PROVIDER is "${PROVIDER}").`);
  return key;
}

const providers = {
  async gemini(prompt, temperature) {
    const key = requireKey('GEMINI_API_KEY');
    const data = await post(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      { 'x-goog-api-key': key },
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature },
      }
    );
    return data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  },

  async anthropic(prompt) {
    const key = requireKey('ANTHROPIC_API_KEY');
    const data = await post(
      'https://api.anthropic.com/v1/messages',
      { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      {
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: `${prompt}\n\nReturn ONLY the JSON object. No explanation, no code fences.` }],
      }
    );
    return (data?.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  },

  // OpenAI Responses API (client.responses.create in the SDK). Plain fetch: no `npm i openai` needed.
  async openai(prompt) {
    const key = requireKey('OPENAI_API_KEY');
    const data = await post(
      'https://api.openai.com/v1/responses',
      { Authorization: `Bearer ${key}` },
      {
        model: MODEL,
        input: prompt,
        text: { format: { type: 'json_object' } }, // JSON mode (the prompt itself already asks for JSON)
        store: false, // don't keep customers' website content stored on OpenAI's side
      }
    );
    // `output_text` is an SDK-only helper; over raw HTTP we join the text parts ourselves.
    if (typeof data?.output_text === 'string' && data.output_text) return data.output_text;
    const parts = [];
    for (const item of data?.output || []) {
      if (item.type !== 'message') continue;
      for (const c of item.content || []) if (c.type === 'output_text') parts.push(c.text);
    }
    return parts.join('');
  },
};

export async function generateJson(prompt, { temperature = 0.3 } = {}) {
  const run = providers[PROVIDER];
  if (!run) throw new UserFacingError(`Unknown AI_PROVIDER "${PROVIDER}". Use gemini, anthropic or openai.`);
  return extractJson(await run(prompt, temperature));
}