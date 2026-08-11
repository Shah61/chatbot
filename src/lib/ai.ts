import type { Brand, CatalogItem } from './types';
import { brandContext } from './server';
import { sleep } from './utils';

/* ==========================================================================
   Saint Copy — the client half.

   Every word comes from the model on the server. There is no local
   generator: with no key the buttons say so rather than faking it.
   ========================================================================== */

export type Tone = 'warm' | 'precise' | 'playful';

export const TONES: { id: Tone; name: string; note: string }[] = [
  { id: 'warm', name: 'Warm', note: 'Human, unhurried' },
  { id: 'precise', name: 'Precise', note: 'Plain and factual' },
  { id: 'playful', name: 'Playful', note: 'Light, a little cheeky' },
];

export type Refinement = 'shorten' | 'expand' | 'formal';

export const REFINEMENTS: { id: Refinement; label: string }[] = [
  { id: 'shorten', label: 'Make it shorter' },
  { id: 'expand', label: 'Add detail' },
  { id: 'formal', label: 'More formal' },
];

export class CopyUnavailable extends Error {}

const itemPayload = (item: CatalogItem, brand: Brand) => ({
  name: item.name,
  categoryName: brand.categories.find((c) => c.id === item.categoryId)?.name ?? '',
  price: item.price,
  duration: item.duration ?? '',
  tags: item.tags,
});

async function post(body: unknown) {
  let res: Response;
  try {
    res = await fetch('/api/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new CopyUnavailable('The server is not running — start it with npm run dev.');
  }

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new CopyUnavailable(
      detail?.message ?? 'Saint could not write that just now. Try again in a moment.',
    );
  }
  return res.json();
}

/** Three ranked variants. `nonce` pushes the model somewhere new each time. */
export async function draftDescriptions(
  item: CatalogItem,
  brand: Brand,
  tone: Tone,
  nonce = 0,
): Promise<string[]> {
  const json = await post({
    brand: brandContext(brand),
    item: itemPayload(item, brand),
    tone,
    nonce,
  });
  const variants: string[] = Array.isArray(json.variants) ? json.variants : [];
  if (!variants.length) throw new CopyUnavailable('The model returned nothing usable.');
  return variants;
}

export async function refine(
  text: string,
  how: Refinement,
  item: CatalogItem,
  brand: Brand,
): Promise<string> {
  const json = await post({
    brand: brandContext(brand),
    item: itemPayload(item, brand),
    mode: 'refine',
    refinement: how,
    text,
  });
  if (!json.text) throw new CopyUnavailable('The model returned nothing usable.');
  return String(json.text);
}

/** Types a string out character by character, so a draft lands like writing. */
export async function typeOut(text: string, onTick: (partial: string) => void, ms = 9) {
  for (let i = 1; i <= text.length; i++) {
    onTick(text.slice(0, i));
    if (i % 2 === 0) await sleep(ms);
  }
}

/* --- Quality checks shown beside the editor -------------------------------- */

export function copyChecks(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return [
    { label: 'Length', ok: words >= 8 && words <= 42, note: `${words} words` },
    {
      label: 'Reads aloud',
      ok: !/\b(utilise|leverage|synergy|premium quality|elevate|indulge)\b/i.test(text),
      note: 'no filler',
    },
    { label: 'No claims', ok: !/\b(cure|guarantee|best in|100%)\b/i.test(text), note: 'compliant' },
  ];
}
