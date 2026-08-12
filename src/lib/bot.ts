import type {
  Action,
  Block,
  BotState,
  Brand,
  CartLine,
  Fulfilment,
  Message,
  QuickReply,
} from './types';
import { hash, money, prettyDate, slotsFor, uid } from './utils';

/* ==========================================================================
   The flow engine.

   It is deliberately deterministic: every branch is inspectable, which is
   what you want behind a booking or a payment. Swap `reply` for a model call
   and keep the block vocabulary — the UI renders against that contract.
   ========================================================================== */

export const initialState: BotState = { step: 'idle', draft: {} };

export interface Ctx {
  state: BotState;
  brand: Brand;
  cart: CartLine[];
}

export interface Reply {
  messages: Message[];
  state: BotState;
  /** Locks the most recent card of this kind, whichever route answered it. */
  resolve?: { kind: Block['kind']; value: string };
  clearCart?: boolean;
  /** Ask the live layer to fetch a real person. */
  handoff?: boolean;
  /** Nothing matched — the caller may try the model instead. */
  fallback?: boolean;
}

const bot = (blocks: Block[]): Message => ({
  id: uid('b'),
  role: 'bot',
  at: Date.now(),
  blocks,
});

const system = (text: string, icon: Message['systemIcon']): Message => ({
  id: uid('s'),
  role: 'system',
  at: Date.now(),
  systemIcon: icon,
  blocks: [{ kind: 'text', text }],
});

/* --- Quick replies --------------------------------------------------------- */

export function homeReplies(brand: Brand): QuickReply[] {
  const out: QuickReply[] = [];
  if (brand.skills.order)
    out.push({
      label: brand.vertical === 'restaurant' ? 'Order for delivery' : 'Shop products',
      action: { id: 'order' },
    });
  if (brand.skills.reserve) out.push({ label: 'Book a table', action: { id: 'reserve' } });
  if (brand.skills.appointment)
    out.push({
      label: brand.vertical === 'clinic' ? 'Book an appointment' : 'Book a chair',
      action: { id: 'appointment' },
    });
  out.push({ label: 'Opening hours', action: { id: 'hours' } });
  out.push({ label: 'Where are you?', action: { id: 'location' } });
  return out;
}

export function greeting(brand: Brand): Message[] {
  return [
    bot([
      { kind: 'text', text: brand.assistant.greeting },
      { kind: 'text', text: brand.assistant.offer },
      { kind: 'quickReplies', options: homeReplies(brand) },
    ]),
  ];
}

/* --- Intent detection ------------------------------------------------------ */

const INTENT_WORDS: { id: Action['id']; words: string[] }[] = [
  { id: 'order', words: ['order', 'delivery', 'deliver', 'takeaway', 'collect', 'buy', 'shop', 'send me', '食'] },
  { id: 'reserve', words: ['table', 'reservation', 'reserve', 'dinner for', 'book a table'] },
  { id: 'appointment', words: ['appointment', 'book', 'slot', 'availab', 'schedul', 'chair', 'see a', 'consultation'] },
  { id: 'hours', words: ['hour', 'open', 'close', 'late', 'sunday', 'monday', 'today open'] },
  { id: 'location', words: ['where', 'address', 'park', 'direction', 'find you', 'located', 'tube', 'access'] },
  { id: 'pricing', words: ['price', 'cost', 'how much', 'fee', 'charge', 'menu', 'list'] },
  { id: 'human', words: ['human', 'person', 'someone', 'staff', 'manager', 'speak to', 'talk to', 'real person'] },
  { id: 'track', words: ['track', 'where is my', 'how long', 'eta', 'status'] },
];

function detectIntent(text: string): Action['id'] | null {
  const t = text.toLowerCase();
  let best: { id: Action['id']; score: number } | null = null;
  for (const intent of INTENT_WORDS) {
    const score = intent.words.reduce((n, w) => (t.includes(w) ? n + w.length : n), 0);
    if (score > 0 && (!best || score > best.score)) best = { id: intent.id, score };
  }
  return best?.id ?? null;
}

/** Word-overlap match against the knowledge base — good enough to feel real. */
function matchFaq(text: string, brand: Brand) {
  const words = text.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  if (!words.length) return null;
  let best: { id: string; score: number } | null = null;
  for (const f of brand.faq) {
    if (f.status === 'draft') continue;
    const hay = `${f.q} ${f.a} ${f.category}`.toLowerCase();
    const score = words.reduce((n, w) => (hay.includes(w) ? n + 1 : n), 0);
    if (!best || score > best.score) best = { id: f.id, score };
  }
  return best && best.score >= 2 ? brand.faq.find((f) => f.id === best!.id)! : null;
}

function parseDate(text: string, days: Date[]) {
  const t = text.toLowerCase();
  if (t.includes('today')) return days[0];
  if (t.includes('tomorrow')) return days[1] ?? days[0];
  const names = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < names.length; i++) {
    if (t.includes(names[i])) return days.find((d) => d.getDay() === i) ?? null;
  }
  return null;
}

function parseTime(text: string, offered: string[]) {
  const m = text.toLowerCase().replace(/\s/g, '').match(/(\d{1,2})[:.h]?(\d{2})?(am|pm)?/);
  if (!m) return null;
  let hour = +m[1];
  const mins = m[2] ? +m[2] : 0;
  if (m[3] === 'pm' && hour < 12) hour += 12;
  if (!m[3] && hour < 9) hour += 12;
  const target = hour * 60 + mins;
  let best: { slot: string; diff: number } | null = null;
  for (const slot of offered) {
    const [h, mm] = slot.split(':').map(Number);
    const diff = Math.abs(h * 60 + mm - target);
    if (!best || diff < best.diff) best = { slot, diff };
  }
  return best && best.diff <= 50 ? best.slot : null;
}

/* --- Helpers ---------------------------------------------------------------- */

const orderCategories = (brand: Brand) =>
  brand.vertical === 'salon' ? ['retail'] : brand.categories.map((c) => c.id);

const bookCategories = (brand: Brand) =>
  brand.categories.filter((c) => c.id !== 'retail').map((c) => c.id);

const itemsIn = (brand: Brand, categoryId: string) =>
  brand.catalog.filter((i) => i.categoryId === categoryId && i.available);

const peopleFor = (brand: Brand, categoryId?: string) =>
  categoryId ? brand.people.filter((p) => p.focus.includes(categoryId)) : brand.people;

export const cartTotal = (lines: CartLine[], brand: Brand) =>
  lines.reduce(
    (n, l) => n + (brand.catalog.find((i) => i.id === l.itemId)?.price ?? 0) * l.qty,
    0,
  );

const askCategories = (lead: string): Message[] => [
  bot([{ kind: 'text', text: lead }, { kind: 'categories' }]),
];

const askDates = (lead: string, personId?: string): Message[] => [
  bot([{ kind: 'text', text: lead }, { kind: 'dates', personId }]),
];

function askSlots(brand: Brand, date: string, personId?: string): Message[] {
  const key = personId ?? brand.id;
  const free = slotsFor(key, date).filter((s) => !s.taken).length;
  return [
    bot([
      {
        kind: 'text',
        text: `${prettyDate(date)} — ${free} ${free === 1 ? 'time is' : 'times are'} free.`,
      },
      { kind: 'slots', personId, date },
    ]),
  ];
}

/* --- The engine ------------------------------------------------------------- */

export function reply(action: Action, ctx: Ctx): Reply {
  const { brand, cart } = ctx;
  const state = ctx.state;
  const draft = { ...state.draft };
  const same = (extra: Partial<BotState> = {}) => ({ ...state, ...extra, draft });

  switch (action.id) {
    /* ---------------- free text ---------------- */
    case 'freetext': {
      const text = action.text;

      if (state.step === 'date') {
        const days = openDays(brand);
        const d = parseDate(text, days);
        if (d) return reply({ id: 'pick_date', value: isoOf(d) }, ctx);
      }
      if (state.step === 'slot' && draft.date) {
        const offered = slotsFor(draft.personId ?? brand.id, draft.date)
          .filter((s) => !s.taken)
          .map((s) => s.time);
        const slot = parseTime(text, offered);
        if (slot) return reply({ id: 'pick_slot', value: slot }, ctx);
      }
      if (state.step === 'party') {
        const n = text.match(/\b([1-9]|1[0-2])\b/);
        if (n) return reply({ id: 'pick_party', value: +n[1] }, ctx);
      }

      const item = brand.catalog.find(
        (i) => i.available && text.toLowerCase().includes(i.name.split(/[ ,&]/)[0].toLowerCase()),
      );
      if (item && item.name.split(/[ ,&]/)[0].length > 4) {
        return reply({ id: 'pick_item', value: item.id }, ctx);
      }

      const faq = matchFaq(text, brand);
      const intent = detectIntent(text);
      if (faq && !intent) return reply({ id: 'faq', value: faq.id }, ctx);
      if (intent) return reply({ id: intent } as Action, ctx);
      if (faq) return reply({ id: 'faq', value: faq.id }, ctx);

      return {
        state,
        fallback: true,
        messages: [
          bot([
            {
              kind: 'text',
              text: "I would rather be certain than guess at that one. Here is what I know well — or I can fetch a colleague.",
            },
            {
              kind: 'quickReplies',
              options: [
                ...homeReplies(brand),
                { label: `Talk to ${brand.assistant.human.split(' ')[0]}`, action: { id: 'human' } },
              ],
            },
          ]),
        ],
      };
    }

    /* ---------------- ordering ---------------- */
    case 'order':
    case 'menu': {
      draft.intent = 'order';
      const cats = orderCategories(brand);
      if (cats.length === 1) {
        return {
          state: same({ step: 'browse' }),
          messages: [
            bot([
              { kind: 'text', text: 'Everything on the shelf, with same-day delivery across the Klang Valley.' },
              { kind: 'catalog', ids: itemsIn(brand, cats[0]).map((i) => i.id), mode: 'add' },
            ]),
          ],
        };
      }
      return {
        state: same({ step: 'category' }),
        messages: askCategories(
          'Happily. Where shall we start — or tell me what you fancy and I will find it.',
        ),
      };
    }

    case 'pick_category': {
      draft.categoryId = action.value;
      const cat = brand.categories.find((c) => c.id === action.value)!;
      const items = itemsIn(brand, action.value);
      const booking = draft.intent === 'appointment';
      return {
        state: same({ step: 'browse' }),
        resolve: { kind: 'categories', value: action.value },
        messages: [
          bot([
            { kind: 'text', text: `${cat.name} — ${cat.note.toLowerCase()}.` },
            { kind: 'catalog', ids: items.map((i) => i.id), mode: booking ? 'select' : 'add' },
            ...(booking
              ? []
              : ([{ kind: 'quickReplies', options: [{ label: 'Something else', action: { id: 'order' } }] }] as Block[])),
          ]),
        ],
      };
    }

    case 'pick_item': {
      const item = brand.catalog.find((i) => i.id === action.value)!;
      draft.itemId = action.value;
      draft.categoryId = item.categoryId;

      /* An appointment-style item leads into people and times. */
      if (draft.intent === 'appointment' || (!brand.skills.order && brand.skills.appointment)) {
        draft.intent = 'appointment';
        const people = peopleFor(brand, item.categoryId);
        if (people.length === 0) {
          return {
            state: same({ step: 'date' }),
            resolve: { kind: 'catalog', value: action.value },
            messages: askDates(`${item.name}. Which day suits you?`),
          };
        }
        if (people.length === 1) {
          draft.personId = people[0].id;
          return {
            state: same({ step: 'date' }),
            resolve: { kind: 'catalog', value: action.value },
            messages: askDates(
              `${item.name} with ${people[0].title} ${people[0].name}. Which day suits you?`,
              people[0].id,
            ),
          };
        }
        return {
          state: same({ step: 'person' }),
          resolve: { kind: 'catalog', value: action.value },
          messages: [
            bot([
              {
                kind: 'text',
                text: `${item.name} — ${item.duration ?? ''}${item.duration ? ', ' : ''}${money(
                  item.price,
                  brand.currency,
                )}. Who would you like?`,
              },
              { kind: 'people', ids: people.map((p) => p.id) },
            ]),
          ],
        };
      }

      /* Otherwise it just goes in the basket. */
      return {
        state: same({ step: 'browse' }),
        messages: [
          bot([
            {
              kind: 'text',
              text: `${item.name} added — ${money(item.price, brand.currency)}. Anything else, or shall we check out?`,
            },
            {
              kind: 'quickReplies',
              options: [
                { label: 'Keep looking', action: { id: 'order' } },
                { label: 'Check out', action: { id: 'checkout' } },
              ],
            },
          ]),
        ],
      };
    }

    case 'checkout': {
      if (!cart.length) {
        return {
          state,
          messages: [
            bot([
              { kind: 'text', text: 'Your basket is empty — let me show you the good things.' },
              { kind: 'quickReplies', options: [{ label: 'Show me', action: { id: 'order' } }] },
            ]),
          ],
        };
      }
      const total = cartTotal(cart, brand);
      if (brand.vertical === 'restaurant') {
        return {
          state: same({ step: 'fulfilment' }),
          messages: [
            bot([
              {
                kind: 'text',
                text: `That comes to ${money(total, brand.currency)}. Delivery or collection?`,
              },
              { kind: 'fulfilment' },
            ]),
          ],
        };
      }
      draft.fulfilment = 'delivery';
      return {
        state: same({ step: 'details' }),
        messages: [
          bot([
            {
              kind: 'text',
              text: `${money(total, brand.currency)}, and free delivery over ${money(150, brand.currency)}. Where is it going?`,
            },
            { kind: 'contactForm', wants: 'address' },
          ]),
        ],
      };
    }

    case 'pick_fulfilment': {
      draft.fulfilment = action.value as Fulfilment;
      return {
        state: same({ step: 'details' }),
        resolve: { kind: 'fulfilment', value: action.value },
        messages: [
          bot([
            {
              kind: 'text',
              text:
                action.value === 'delivery'
                  ? 'About thirty minutes at the moment. Where are we bringing it?'
                  : 'Ready in about twenty minutes. Who is collecting?',
            },
            { kind: 'contactForm', wants: action.value === 'delivery' ? 'address' : 'phone' },
          ]),
        ],
      };
    }

    /* ---------------- reservations ---------------- */
    case 'reserve': {
      draft.intent = 'reserve';
      return {
        state: same({ step: 'party' }),
        messages: [
          bot([
            { kind: 'text', text: 'Of course. How many of you?' },
            { kind: 'party' },
          ]),
        ],
      };
    }

    case 'pick_party': {
      draft.party = action.value;
      return {
        state: same({ step: 'date' }),
        resolve: { kind: 'party', value: String(action.value) },
        messages: askDates(
          action.value >= 7
            ? `${action.value} of you — that is the long table, which I can hold. Which evening?`
            : `A table for ${action.value}. Which evening?`,
        ),
      };
    }

    /* ---------------- appointments ---------------- */
    case 'appointment': {
      draft.intent = 'appointment';
      const cats = bookCategories(brand);
      if (cats.length === 1) {
        return {
          state: same({ step: 'browse' }),
          messages: [
            bot([
              { kind: 'text', text: 'What are we booking?' },
              { kind: 'catalog', ids: itemsIn(brand, cats[0]).map((i) => i.id), mode: 'select' },
            ]),
          ],
        };
      }
      return {
        state: same({ step: 'category' }),
        messages: askCategories('Of course. What are we booking?'),
      };
    }

    case 'pick_person': {
      draft.personId = action.value;
      const p = brand.people.find((x) => x.id === action.value)!;
      return {
        state: same({ step: 'date' }),
        resolve: { kind: 'people', value: action.value },
        messages: askDates(`${p.title} ${p.name}. Which day suits you?`.trim(), action.value),
      };
    }

    case 'any_person': {
      const people = peopleFor(brand, draft.categoryId);
      const pick = people[0];
      draft.personId = pick?.id;
      return {
        state: same({ step: 'date' }),
        resolve: { kind: 'people', value: 'any' },
        messages: askDates(
          `I will put you with ${pick.title} ${pick.name} — soonest of the ${brand.peopleNoun}.`.replace(
            '  ',
            ' ',
          ),
          pick?.id,
        ),
      };
    }

    case 'pick_date': {
      draft.date = action.value;
      return {
        state: same({ step: 'slot' }),
        resolve: { kind: 'dates', value: action.value },
        messages: askSlots(brand, action.value, draft.personId),
      };
    }

    case 'pick_slot': {
      draft.slot = action.value;
      return {
        state: same({ step: 'details' }),
        resolve: { kind: 'slots', value: action.value },
        messages: [
          bot([
            {
              kind: 'text',
              text: 'Held for ten minutes. Last thing — a name and a number to reach you on.',
            },
            { kind: 'contactForm', wants: 'phone' },
          ]),
        ],
      };
    }

    /* ---------------- close ---------------- */
    case 'submit_details': {
      draft.name = action.name;
      draft.contact = action.contact;
      const first = action.name.split(' ')[0];
      const resolve = { kind: 'contactForm' as const, value: `${action.name}|${action.contact}` };

      if (draft.intent === 'order') {
        const order = {
          ref: refFor(brand, 'ORD'),
          lines: cart,
          fulfilment: draft.fulfilment ?? 'delivery',
          total: cartTotal(cart, brand),
          name: action.name,
          contact: action.contact,
          eta:
            draft.fulfilment === 'collection'
              ? 'Ready 20 min'
              : brand.vertical === 'salon'
                ? 'Same day'
                : '30 min',
          placedAt: Date.now(),
        };
        return {
          state: { step: 'done', draft, order },
          resolve,
          clearCart: true,
          messages: [
            system('Order sent to the kitchen', 'bag'),
            bot([
              { kind: 'text', text: `That is in, ${first}.` },
              { kind: 'orderTicket', order },
              { kind: 'progress', step: 1 },
              {
                kind: 'quickReplies',
                options: [
                  { label: 'Track it', action: { id: 'track' } },
                  { label: 'Something else', action: { id: 'restart' } },
                ],
              },
            ]),
          ],
        };
      }

      const item = brand.catalog.find((i) => i.id === draft.itemId);
      const booking = {
        ref: refFor(brand, draft.intent === 'reserve' ? 'TBL' : 'APT'),
        itemId: draft.itemId ?? '',
        personId: draft.personId,
        date: draft.date!,
        slot: draft.slot!,
        party: draft.party,
        name: action.name,
        contact: action.contact,
        total: item?.price ?? 0,
      };
      return {
        state: { step: 'done', draft, booking },
        resolve,
        messages: [
          system(
            draft.intent === 'reserve' ? 'Table held in the book' : 'Written to the diary',
            'calendar',
          ),
          bot([
            { kind: 'text', text: `That is you, ${first}.` },
            { kind: 'bookingTicket', booking },
            {
              kind: 'text',
              text: 'A confirmation is on its way by text. Reply here any time to move it.',
            },
            {
              kind: 'quickReplies',
              options: [
                { label: 'Add to calendar', action: { id: 'track' } },
                { label: 'How do I get there?', action: { id: 'location' } },
                { label: 'Something else', action: { id: 'restart' } },
              ],
            },
          ]),
        ],
      };
    }

    case 'track': {
      if (state.order) {
        return {
          state,
          messages: [
            bot([
              { kind: 'text', text: 'Here is where it is right now.' },
              { kind: 'progress', step: 2 },
            ]),
          ],
        };
      }
      return {
        state,
        messages: [
          bot([
            {
              kind: 'text',
              text: 'Sent — the confirmation carries an .ics invite, so it lands in Apple or Google Calendar in one tap.',
            },
          ]),
        ],
      };
    }

    /* ---------------- knowledge ---------------- */
    case 'faq': {
      const f = brand.faq.find((x) => x.id === action.value)!;
      return {
        state,
        messages: [
          bot([
            { kind: 'text', text: f.a },
            { kind: 'sources', items: [{ title: f.source, section: f.category }] },
            { kind: 'quickReplies', options: homeReplies(brand).slice(0, 3) },
          ]),
        ],
      };
    }

    case 'hours':
      return {
        state,
        messages: [
          bot([
            { kind: 'text', text: `Our hours at ${brand.name}:` },
            { kind: 'hours' },
            { kind: 'quickReplies', options: homeReplies(brand).slice(0, 2) },
          ]),
        ],
      };

    case 'location':
      return {
        state,
        messages: [
          bot([
            {
              kind: 'text',
              text: `We are at ${brand.address}, ${brand.district} — step-free, and a few minutes from the station.`,
            },
            { kind: 'location' },
            { kind: 'quickReplies', options: homeReplies(brand).slice(0, 2) },
          ]),
        ],
      };

    case 'pricing': {
      const rows = brand.catalog
        .filter((i) => i.available)
        .slice(0, 6)
        .map((i) => ({
          label: i.duration ? `${i.name} · ${i.duration}` : i.name,
          value: money(i.price, brand.currency),
        }));
      return {
        state,
        messages: [
          bot([
            { kind: 'text', text: 'Here is the short version of the list.' },
            { kind: 'summary', rows },
            { kind: 'quickReplies', options: homeReplies(brand).slice(0, 2) },
          ]),
        ],
      };
    }

    /* The live layer owns the rest: queueing, pickup and the agent's replies. */
    case 'human':
      return {
        state: same({ step: 'human' }),
        handoff: true,
        messages: [
          bot([
            {
              kind: 'text',
              text: 'Of course — some things are better with a person. Let me get someone.',
            },
            { kind: 'handoff' },
          ]),
        ],
      };

    case 'restart':
      return {
        state: initialState,
        messages: [
          bot([
            { kind: 'text', text: 'Anything else I can do?' },
            { kind: 'quickReplies', options: homeReplies(brand) },
          ]),
        ],
      };

    default:
      return { state, messages: [] };
  }
}

/* --- Shared date helpers ---------------------------------------------------- */

const CLOSED: Record<string, number[]> = { lumiere: [1], aurelia: [0], solene: [1] };

export function openDays(brand: Brand, count = 7): Date[] {
  const closed = CLOSED[brand.id] ?? [];
  const out: Date[] = [];
  const cursor = new Date();
  while (out.length < count) {
    if (!closed.includes(cursor.getDay())) out.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export const isoOf = (d: Date) => {
  const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return t.toISOString().slice(0, 10);
};

const refFor = (brand: Brand, kind: string) =>
  `${kind}-${(hash(brand.id + Date.now()) % 9000) + 1000}`;

export const PROGRESS_STEPS = [
  { label: 'Order received', note: 'Sent to the pass' },
  { label: 'In the kitchen', note: 'Being cooked now' },
  { label: 'On its way', note: 'Rider heading to you' },
  { label: 'Delivered', note: 'Enjoy it' },
];
