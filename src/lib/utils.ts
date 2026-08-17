import type { Message } from './types';

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ');

/* --- Platform --------------------------------------------------------------
   One thing in the UI genuinely cares: the modifier key we print. ⌘ is not a
   key on a Windows keyboard, and in Segoe UI it is a glyph most users read as
   a decorative knot. userAgentData is the non-deprecated read; platform is
   the fallback for the browsers that never shipped it. */

const uaPlatform = (): string => {
  if (typeof navigator === 'undefined') return '';
  const hinted = (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform;
  return hinted || navigator.platform || navigator.userAgent || '';
};

export const isMac = /mac/i.test(uaPlatform());

export const MOD_KEY = isMac ? '⌘' : 'Ctrl';

/** The same shortcut printed as one label. ⌘ needs no space; Ctrl does. */
export const MOD_HINT = `${MOD_KEY}${isMac ? '' : ' '}K`;

let seq = 0;
export const uid = (p = 'm') => `${p}-${Date.now().toString(36)}-${seq++}`;

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const nf = new Intl.NumberFormat('en-GB');

export const money = (n: number, currency = '£') =>
  `${currency}${Number.isInteger(n) ? nf.format(n) : n.toFixed(2)}`;

export const clockTime = (at: number) =>
  new Date(at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

/* --- Dates ---------------------------------------------------------------- */

export const iso = (d: Date) => {
  const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return t.toISOString().slice(0, 10);
};

export function nextDays(count: number, closedOn: number[] = []): Date[] {
  const out: Date[] = [];
  const cursor = new Date();
  while (out.length < count) {
    if (!closedOn.includes(cursor.getDay())) out.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export const dayShort = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short' });
export const monthShort = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short' });

export function prettyDate(isoDate: string) {
  const today = iso(new Date());
  const tomorrow = iso(new Date(Date.now() + 864e5));
  if (isoDate === today) return 'Today';
  if (isoDate === tomorrow) return 'Tomorrow';
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/* --- Deterministic pseudo-randomness -------------------------------------- */

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const SLOT_TIMES = [
  '09:00',
  '09:45',
  '10:30',
  '11:15',
  '12:00',
  '13:30',
  '14:15',
  '15:00',
  '15:45',
  '16:30',
  '17:15',
  '18:00',
  '19:00',
  '20:00',
];

const EMPTY: ReadonlySet<string> = new Set();

/**
 * Stable availability so the demo never shuffles between renders.
 * `booked` is what this session has already taken — the same overlay the
 * backend applies, so the grid and the diary agree.
 */
export function slotsFor(key: string, date: string, booked: ReadonlySet<string> = EMPTY) {
  const seed = hash(key + date);
  return SLOT_TIMES.map((time, i) => ({
    time,
    taken: booked.has(time) || (((seed >> i) & 1) === 1 && i % 4 !== 0),
  }));
}

export const freeCount = (key: string, date: string, booked: ReadonlySet<string> = EMPTY) =>
  slotsFor(key, date, booked).filter((s) => !s.taken).length;

/**
 * Every slot taken by a booking in this transcript. The `slots` block carries
 * no rows by design, so the widget works this out from what it already holds.
 */
export function bookedSlots(
  messages: Message[],
  key: string,
  date: string,
  brandId: string,
): Set<string> {
  const out = new Set<string>();
  for (const m of messages) {
    for (const b of m.blocks) {
      if (b.kind !== 'bookingTicket') continue;
      const { personId, date: on, slot } = b.booking;
      if ((personId || brandId) === key && on === date) out.add(slot);
    }
  }
  return out;
}
