/* ==========================================================================
   Saint — domain types
   One vocabulary covers all three verticals: a restaurant sells items from a
   catalog, a clinic sells time with a person, a salon does both.
   ========================================================================== */

export type BrandId = 'lumiere' | 'aurelia' | 'solene';
export type Vertical = 'restaurant' | 'clinic' | 'salon';
export type Scheme = 'light' | 'dark';

export interface Category {
  id: string;
  name: string;
  note: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  description: string;
  /** Allergens, benefits, ingredients — whatever the vertical labels them. */
  tags: string[];
  /** Services only. */
  duration?: string;
  available: boolean;
  /** Drives the generated artwork, 0–360. */
  hue: number;
  popular?: boolean;
  /** Units sold / booked in the period, used across the admin. */
  sold: number;
}

/** Why someone is off the rota. Drives the wording Saint uses. */
export type AwayReason = 'mc' | 'leave' | 'training' | 'conference';

export interface Away {
  reason: AwayReason;
  /** Free text, e.g. 'Fri 15 Aug' — the diary owns real dates. */
  until: string;
  /** Who picks up their list. Absent means the slots simply close. */
  coverId?: string;
}

export interface Person {
  id: string;
  name: string;
  title: string;
  role: string;
  /** Category ids this person covers. */
  focus: string[];
  rating: number;
  reviews: number;
  next: string;
  hue: number;
  bio: string;
  /** Rota state, owned by the console. Undefined counts as on. */
  available?: boolean;
  away?: Away;
}

export interface FaqEntry {
  id: string;
  q: string;
  a: string;
  source: string;
  category: string;
  uses: number;
  confidence: number;
  updated: string;
  status: 'live' | 'draft' | 'review';
}

export interface Brand {
  id: BrandId;
  vertical: Vertical;
  /** Wordmark, e.g. LUMIÈRE */
  name: string;
  /** Legal-ish full name for the admin workspace row */
  legal: string;
  kind: string;
  scheme: Scheme;
  currency: string;
  address: string;
  district: string;
  phone: string;

  hero: {
    eyebrow: string;
    line1: string;
    line2: string;
    body: string;
    cta: string;
    stats: { value: string; label: string }[];
  };
  nav: string[];

  /** Unsplash ids — swap for your own photography. */
  images: {
    hero: string;
    feature: [string, string, string];
    story: string;
  };
  story: { eyebrow: string; title: string; body: string; points: string[] };
  /** The pinned 01/04 sequence on the home page. */
  process: { title: string; note: string }[];
  /** Two headline numbers for the full-bleed craft section. */
  proof: { value: string; label: string }[];
  marquee: string[];

  assistant: {
    greeting: string;
    offer: string;
    /** Nudge bubble shown when the widget is closed. */
    nudgeTitle: string;
    nudgeBody: string;
    /** Human who takes escalations. */
    human: string;
    humanRole: string;
  };

  /** Which flows this brand exposes — drives quick replies and admin nav. */
  skills: {
    order: boolean;
    reserve: boolean;
    appointment: boolean;
  };

  itemNoun: string;
  itemNounPlural: string;
  tagNoun: string;
  peopleNoun: string;

  categories: Category[];
  catalog: CatalogItem[];
  people: Person[];
  hours: { day: string; hours: string }[];
  faq: FaqEntry[];
}

/* --- Orders & bookings ------------------------------------------------------ */

export interface CartLine {
  itemId: string;
  qty: number;
}

export type Fulfilment = 'delivery' | 'collection' | 'table';

export interface Order {
  ref: string;
  lines: CartLine[];
  fulfilment: Fulfilment;
  total: number;
  name: string;
  contact: string;
  eta: string;
  placedAt: number;
}

export interface Booking {
  ref: string;
  itemId: string;
  personId?: string;
  date: string;
  slot: string;
  party?: number;
  name: string;
  contact: string;
  total: number;
}

/* --- Chat ------------------------------------------------------------------- */

export type Role = 'bot' | 'user' | 'agent' | 'system';

export interface QuickReply {
  label: string;
  action: Action;
}

export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'quickReplies'; options: QuickReply[] }
  | { kind: 'categories' }
  | { kind: 'catalog'; ids: string[]; mode: 'add' | 'select' }
  | { kind: 'people'; ids: string[] }
  | { kind: 'party' }
  | { kind: 'fulfilment' }
  | { kind: 'dates'; personId?: string }
  | { kind: 'slots'; personId?: string; date: string }
  | { kind: 'contactForm'; wants: 'address' | 'phone' }
  | { kind: 'orderTicket'; order: Order }
  | { kind: 'bookingTicket'; booking: Booking }
  | { kind: 'progress'; step: number }
  | { kind: 'handoff' }
  | { kind: 'hours' }
  | { kind: 'location' }
  | { kind: 'summary'; rows: { label: string; value: string }[] }
  | { kind: 'sources'; items: { title: string; section: string }[] };

export interface Message {
  id: string;
  role: Role;
  blocks: Block[];
  at: number;
  /** Locks an interactive card once it has been answered. */
  resolved?: string;
  systemIcon?: 'agent' | 'calendar' | 'bag' | 'shield';
}

export type Step =
  | 'idle'
  | 'category'
  | 'browse'
  | 'fulfilment'
  | 'party'
  | 'person'
  | 'date'
  | 'slot'
  | 'details'
  | 'done'
  | 'human';

export interface Draft {
  categoryId?: string;
  itemId?: string;
  personId?: string;
  date?: string;
  slot?: string;
  party?: number;
  fulfilment?: Fulfilment;
  name?: string;
  contact?: string;
  intent?: 'order' | 'reserve' | 'appointment';
}

export interface BotState {
  step: Step;
  draft: Draft;
  order?: Order;
  booking?: Booking;
}

export type Action =
  | { id: 'order' }
  | { id: 'reserve' }
  | { id: 'appointment' }
  | { id: 'menu' }
  | { id: 'pick_category'; value: string }
  | { id: 'pick_item'; value: string }
  | { id: 'checkout' }
  | { id: 'pick_fulfilment'; value: Fulfilment }
  | { id: 'pick_party'; value: number }
  | { id: 'pick_person'; value: string }
  | { id: 'any_person' }
  | { id: 'pick_date'; value: string }
  | { id: 'pick_slot'; value: string }
  | { id: 'submit_details'; name: string; contact: string }
  | { id: 'hours' }
  | { id: 'location' }
  | { id: 'pricing' }
  | { id: 'faq'; value: string }
  | { id: 'human' }
  | { id: 'track' }
  | { id: 'restart' }
  | { id: 'freetext'; text: string };

/* --- Admin ------------------------------------------------------------------ */

/**
 * How one model turn ended. The first two are the bill doing its job; every
 * other value is a reason someone should look at the transcript, which is the
 * whole point of the chatlog — 'successful' is not a useful thing to read.
 */
export type TurnOutcome =
  | 'answered'
  | 'booked'
  | 'escalated'
  | 'low confidence'
  | 'bad answer'
  | 'wrong info'
  | 'refused'
  | 'cut off'
  | 'tool error'
  | 'timeout'
  | 'rate limited'
  | 'error';

/**
 * Where a booking got to. 'rescheduled' is its own state rather than a second
 * 'booked' row because the owner's question is usually "how many moved?", and
 * a diary that quietly rewrites the date cannot answer it.
 */
export type BookingStatus =
  | 'booked'
  | 'rescheduled'
  | 'attended'
  | 'cancelled'
  | 'no show'
  | 'waitlist';

/** One line in the diary. A clinic books time with a person, a restaurant
    books a table for a number of people; the shape covers both. */
export interface DiaryEntry {
  id: string;
  ref: string;
  /** ISO yyyy-mm-dd, so the calendar can key off it directly. */
  date: string;
  slot: string;
  minutes: number;
  customer: string;
  initials: string;
  contact: string;
  /** Absent for a restaurant table, and for 'any available'. */
  personId?: string;
  personName?: string;
  personHue?: number;
  itemId: string;
  itemName: string;
  /** Restaurants only. */
  party?: number;
  status: BookingStatus;
  channel: ChannelId;
  source: 'Saint' | 'Front desk' | 'Phone' | 'Walk-in';
  value: number;
  /** Set on rescheduled rows: the date it was moved off. */
  movedFrom?: string;
  note?: string;
}

/** One model call, priced. The unit the AI bill is actually made of. */
export interface ChatlogEntry {
  id: string;
  /** Clock time, and minutes ago for the grouping headers. */
  at: string;
  ago: number;
  conversation: string;
  initials: string;
  channel: ChannelId;
  intent: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  /** Prompt tokens served from cache — charged at a tenth, so worth showing. */
  cached: number;
  /** USD. The bill arrives in dollars whatever the till takes. */
  cost: number;
  /** Seconds, end to end. */
  latency: number;
  outcome: TurnOutcome;
  /** What the visitor asked, trimmed to a line. */
  prompt: string;
  /** Present on everything that is not plainly successful. */
  note?: string;
}

/* --- Live support ----------------------------------------------------------- */

export interface Agent {
  name: string;
  role: string;
  initials: string;
}

/** off → visitor asked → a person picked up → the person left. */
export type LiveStatus = 'off' | 'waiting' | 'active' | 'ended';

export type ConvStatus = 'open' | 'resolved' | 'escalated';
export type ChannelId = 'web' | 'whatsapp' | 'instagram' | 'sms';

export interface ConversationSummary {
  id: string;
  contact: string;
  initials: string;
  channel: ChannelId;
  status: ConvStatus;
  intent: string;
  preview: string;
  at: string;
  unread: number;
  outcome: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  value?: number;
  messages: Message[];
  meta: { label: string; value: string }[];
  tags: string[];
}

export interface Transaction {
  id: string;
  ref: string;
  customer: string;
  initials: string;
  detail: string;
  when: string;
  status: 'confirmed' | 'preparing' | 'pending' | 'completed' | 'cancelled';
  source: 'Saint' | 'Front desk' | 'Phone' | 'Walk-in';
  total: number;
  channel: ChannelId;
}
