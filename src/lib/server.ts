import type { Block, Brand, Message } from './types';

/* ==========================================================================
   The server, from the browser's side.

   Everything here degrades: if the server is not running, or has no key, or
   this brand is not switched on, `health` comes back disabled and the widget
   carries on with the scripted flow. The demo never breaks because of a
   missing key.
   ========================================================================== */

/* ==========================================================================
   Where the backend lives.

   One variable, VITE_API_URL, but it is reached two different ways.

   Deployed there is no proxy, so the browser calls the backend directly and
   the backend has to allow that origin.

   Under `vite dev` the same URL is handed to the proxy instead
   (vite.config.ts) and this stays empty, so every call is a same-origin
   `/api/…`. Calling the backend straight from localhost would need
   http://localhost:5173 in its CORS allowlist — which it should not have, and
   without it the browser drops the response and the widget quietly falls back
   to the scripted flow. Going through the proxy sidesteps CORS entirely and
   keeps the session cookie first-party.

   VITE_ is the right prefix here: this is a public URL, not a secret. The
   OpenRouter key stays on the backend and never reaches the browser.
   ========================================================================== */

const RAW = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');

/** Accepts a bare host too, e.g. "api.example.com". */
const HOSTED = RAW && !/^https?:\/\//i.test(RAW) ? `https://${RAW}` : RAW;

export const API_BASE = import.meta.env.DEV ? '' : HOSTED;

const url = (path: string) => `${API_BASE}${path}`;

/* Cross-origin, the browser will not send the saint_sid cookie unless asked.
   Same-origin needs nothing, and sending `include` there is harmless but we
   keep it exact. The backend must answer with an explicit
   Access-Control-Allow-Origin (never "*") plus allow-credentials. */
const withCookies: RequestInit = API_BASE ? { credentials: 'include' } : {};

export interface Health {
  ai: boolean;
  model: string | null;
  brands: string[];
}

const OFFLINE: Health = { ai: false, model: null, brands: [] };

export async function getHealth(): Promise<Health> {
  try {
    const res = await fetch(url('/api/health'), {
      ...withCookies,
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return OFFLINE;
    const json = await res.json();
    return { ai: Boolean(json.ai), model: json.model ?? null, brands: json.brands ?? [] };
  } catch {
    return OFFLINE;
  }
}

export const aiHandles = (health: Health, brandId: string) =>
  health.ai && health.brands.includes(brandId);

/** Only what the server needs — and only what the owner has switched on. */
export function brandContext(brand: Brand) {
  return {
    id: brand.id,
    vertical: brand.vertical,
    name: brand.name,
    legal: brand.legal,
    currency: brand.currency,
    address: brand.address,
    district: brand.district,
    phone: brand.phone,
    human: brand.assistant.human,
    humanRole: brand.assistant.humanRole,
    /* The "about" page copy. Send it so the model can answer about the room,
       the studio, the way you work — the things that page claims. */
    story: brand.story,
    categories: brand.categories,
    catalog: brand.catalog.map((i) => ({
      id: i.id,
      name: i.name,
      categoryId: i.categoryId,
      price: i.price,
      duration: i.duration,
      description: i.description,
      tags: i.tags,
      available: i.available,
    })),
    people: brand.people,
    hours: brand.hours,
    faq: brand.faq.map((f) => ({
      q: f.q,
      a: f.a,
      source: f.source,
      category: f.category,
      status: f.status,
    })),
  };
}

/** The transcript, flattened to the plain turns a model expects. */
export function toHistory(messages: Message[], limit = 16) {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'bot')
    .map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.blocks
        .filter((b): b is Extract<Block, { kind: 'text' }> => b.kind === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim(),
    }))
    .filter((m) => m.content)
    .slice(-limit);
}

export type ChatEvent =
  | { type: 'delta'; text: string }
  | { type: 'replace'; text: string }
  | { type: 'blocks'; blocks: Block[] }
  | { type: 'tool'; name: string }
  | { type: 'handoff'; reason: string }
  | { type: 'error'; message: string }
  | { type: 'done'; handoff?: boolean; failed?: boolean; guarded?: string };

export class ChatUnavailable extends Error {}

/**
 * Streams one turn. Throws ChatUnavailable if the server declined, which the
 * caller should treat as "fall back to the scripted flow".
 */
export async function streamChat(
  body: { brand: ReturnType<typeof brandContext>; messages: ReturnType<typeof toHistory> },
  onEvent: (e: ChatEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url('/api/chat'), {
      ...withCookies,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    throw new ChatUnavailable('server unreachable');
  }

  if (!res.ok || !res.body) {
    throw new ChatUnavailable(`server said ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload) continue;
      try {
        onEvent(JSON.parse(payload) as ChatEvent);
      } catch {
        /* half a frame — the next chunk completes it */
      }
    }
  }
}
