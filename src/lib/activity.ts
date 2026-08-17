import type {
  BookingStatus,
  Brand,
  ChannelId,
  ChatlogEntry,
  ConversationSummary,
  DiaryEntry,
  Message,
  Transaction,
  TurnOutcome,
  Vertical,
} from './types';
import { hash, initialsOf, iso, money } from './utils';

/* Demo traffic. Everything is derived from the brand so the console tells a
   coherent story whichever template you are looking at. */

const t = (mins: number) => Date.now() - mins * 60000;

const say = (role: Message['role'], text: string, mins: number): Message => ({
  id: `${role}-${mins}-${text.length}`,
  role,
  at: t(mins),
  blocks: [{ kind: 'text', text }],
});

interface Seed {
  contact: string;
  channel: ConversationSummary['channel'];
  status: ConversationSummary['status'];
  intent: string;
  at: string;
  unread: number;
  outcome: string;
  sentiment: ConversationSummary['sentiment'];
  value?: number;
  tags: string[];
  meta: { label: string; value: string }[];
  turns: [Message['role'], string, number][];
}

const SEEDS: Record<string, Seed[]> = {
  lumiere: [
    {
      contact: 'Aiman Hakim',
      channel: 'web',
      status: 'open',
      intent: 'Order · delivery',
      at: '2 min',
      unread: 2,
      outcome: 'ordered',
      sentiment: 'positive',
      value: 62,
      tags: ['Repeat', 'Delivery'],
      meta: [
        { label: 'Phone', value: '+60 12-884 0118' },
        { label: 'Address', value: '12 Jalan Kia Peng, KLCC' },
        { label: 'Orders', value: '11 this year' },
        { label: 'Page', value: '/menu' },
      ],
      turns: [
        ['user', 'is the ayam gepuk sambal bawang still available tonight?', 14],
        ['bot', 'It is — would you like friendly, pedas or full-power sambal?', 13],
        ['user', 'pedas please, plus the smash burger and asam boi', 11],
        ['bot', 'Ayam gepuk, Seroja Double Smash and asam boi — RM 58 all in. Delivery to Jalan Kia Peng, around thirty minutes.', 10],
        ['user', 'perfect', 3],
        ['bot', 'Order is with the pass. I will ping you when the rider leaves.', 2],
      ],
    },
    {
      contact: 'Nurul Amira',
      channel: 'whatsapp',
      status: 'escalated',
      intent: 'Allergy · nuts',
      at: '18 min',
      unread: 1,
      outcome: 'handed off',
      sentiment: 'negative',
      tags: ['Allergen', 'Priority'],
      meta: [
        { label: 'Phone', value: '+60 17-620 0244' },
        { label: 'Booking', value: 'Fri 20:00 · 4' },
        { label: 'Flagged', value: 'Severe nut allergy' },
        { label: 'Channel', value: 'WhatsApp' },
      ],
      turns: [
        ['user', 'one of us has a severe peanut allergy — can the kitchen handle that on friday?', 26],
        ['bot', 'Some sambal and satay contain peanuts, so I want a person to confirm the safest order. Bringing in Farah now.', 25],
        ['system', 'Farah Aziz, restaurant manager, joined', 24],
        ['agent', 'Nurul — Farah here. I have flagged your table and the kitchen will prepare an allergy-safe set separately with clean utensils.', 18],
      ],
    },
    {
      contact: 'Daniel Tan',
      channel: 'web',
      status: 'resolved',
      intent: 'Table · 6 people',
      at: '52 min',
      unread: 0,
      outcome: 'booked',
      sentiment: 'neutral',
      value: 0,
      tags: ['Reservation'],
      meta: [
        { label: 'Phone', value: '+60 16-771 0371' },
        { label: 'Party', value: '6' },
        { label: 'Date', value: 'Sat 21:00' },
        { label: 'Device', value: 'iPhone · Safari' },
      ],
      turns: [
        ['user', 'table for 6 on saturday, late as possible', 56],
        ['bot', 'Six on Saturday — 21:00 is the latest I can seat you properly. Shall I hold it?', 55],
        ['user', 'yes', 53],
        ['bot', 'Held under Tan, ref TBL-4820. I have added the Kampung Baru directions to your confirmation.', 52],
      ],
    },
    {
      contact: 'Anonymous visitor',
      channel: 'instagram',
      status: 'open',
      intent: 'Halal status',
      at: '2 hr',
      unread: 0,
      outcome: 'answered',
      sentiment: 'neutral',
      tags: ['FAQ'],
      meta: [
        { label: 'Handle', value: '@klfoodtrail' },
        { label: 'Followers', value: '4.4k' },
        { label: 'Session', value: '41 s' },
        { label: 'Channel', value: 'Instagram DM' },
      ],
      turns: [
        ['user', 'is the whole restaurant halal or only some dishes?', 122],
        ['bot', 'The whole kitchen is halal: halal-certified meat, no pork or lard, and no alcohol is served.', 121],
      ],
    },
  ],

  aurelia: [
    {
      contact: 'Priya Raghunathan',
      channel: 'web',
      status: 'open',
      intent: 'Book · dermatology',
      at: '2 min',
      unread: 2,
      outcome: 'booked',
      sentiment: 'positive',
      value: 180,
      tags: ['New patient', 'Dermatology'],
      meta: [
        { label: 'Email', value: 'priya.r@fastmail.com' },
        { label: 'Phone', value: '+44 7700 900 118' },
        { label: 'First seen', value: '12 min ago' },
        { label: 'Page', value: '/dermatology' },
      ],
      turns: [
        ['user', 'hi, do you have anything this week for a mole check?', 12],
        ['bot', 'We do. Mole mapping is 45 minutes at £180, and Dr Levi Hartmann has three openings before Friday.', 11],
        ['user', 'thursday morning would be ideal', 9],
        ['bot', 'Thursday 09:30 or 11:00 — both with Dr Hartmann.', 8],
        ['user', '9:30 please', 4],
        ['bot', 'Booked. Confirmation sent with directions and parking notes. Reference APT-4192.', 2],
      ],
    },
    {
      contact: 'Tomas Beckett',
      channel: 'whatsapp',
      status: 'escalated',
      intent: 'Billing dispute',
      at: '14 min',
      unread: 1,
      outcome: 'handed off',
      sentiment: 'negative',
      tags: ['Billing', 'Priority'],
      meta: [
        { label: 'Phone', value: '+44 7700 900 244' },
        { label: 'Patient since', value: 'Mar 2023' },
        { label: 'Invoice', value: '#INV-2291' },
        { label: 'Channel', value: 'WhatsApp' },
      ],
      turns: [
        ['user', "I've been charged twice for the same appointment on the 12th.", 24],
        ['bot', "I'm sorry — that should not happen. I can see two charges against #INV-2291. This needs a person from billing, so I am bringing one in.", 23],
        ['system', 'Marguerite Vance, patient coordinator, joined', 22],
        ['agent', 'Tomas, Marguerite here. Refunded the duplicate — it clears in three working days. Apologies for the trouble.', 14],
      ],
    },
    {
      contact: 'Hélène Dufort',
      channel: 'web',
      status: 'resolved',
      intent: 'Opening hours',
      at: '38 min',
      unread: 0,
      outcome: 'answered',
      sentiment: 'neutral',
      tags: ['FAQ'],
      meta: [
        { label: 'Page', value: '/contact' },
        { label: 'Device', value: 'iPhone · Safari' },
        { label: 'Session', value: '1 m 12 s' },
        { label: 'Location', value: 'London, UK' },
      ],
      turns: [
        ['user', 'are you open on saturdays', 40],
        ['bot', 'Yes — Saturdays we run a short day, 09:00 to 14:00.', 39],
        ['user', 'perfect thank you', 38],
      ],
    },
    {
      contact: 'Marion Alvarez',
      channel: 'sms',
      status: 'resolved',
      intent: 'Reschedule',
      at: '2 hr',
      unread: 0,
      outcome: 'rebooked',
      sentiment: 'neutral',
      value: 110,
      tags: ['Existing patient'],
      meta: [
        { label: 'Phone', value: '+44 7700 900 371' },
        { label: 'Patient ID', value: 'AUR-00812' },
        { label: 'Visits', value: '9' },
        { label: 'No-shows', value: '0' },
      ],
      turns: [
        ['user', 'need to move tuesday, something came up', 126],
        ['bot', 'No trouble. Your Tuesday 14:15 with Ms Sena Ellery — shall I look at Friday instead?', 125],
        ['user', 'friday morning yes', 122],
        ['bot', 'Moved to Friday 10:00. Your old slot is released.', 121],
      ],
    },
  ],

  solene: [
    {
      contact: 'Amelie Fontaine',
      channel: 'instagram',
      status: 'open',
      intent: 'Book · balayage',
      at: '4 min',
      unread: 3,
      outcome: 'booked',
      sentiment: 'positive',
      value: 245,
      tags: ['New client', 'Colour'],
      meta: [
        { label: 'Handle', value: '@ameliefontaine' },
        { label: 'Phone', value: '+44 7700 900 662' },
        { label: 'Patch test', value: 'Booked Tue' },
        { label: 'Channel', value: 'Instagram DM' },
      ],
      turns: [
        ['user', 'hiii how much is balayage and do you have anything next week', 20],
        ['bot', 'From £245 with a senior colourist, toner and finish included. Malik has Wednesday at 11:00 and Friday at 14:30.', 19],
        ['user', 'wednesday!! do i need to do anything first', 14],
        ['bot', 'A patch test 48 hours before — two minutes, and I can put you in Tuesday at 17:00 for it.', 12],
        ['user', 'yes perfect', 5],
        ['bot', 'Both in the book. Patch test Tuesday 17:00, colour Wednesday 11:00 with Malik.', 4],
      ],
    },
    {
      contact: 'Grace Okafor',
      channel: 'web',
      status: 'open',
      intent: 'Order · retail',
      at: '26 min',
      unread: 0,
      outcome: 'ordered',
      sentiment: 'positive',
      value: 60,
      tags: ['Retail', 'Repeat'],
      meta: [
        { label: 'Email', value: 'g.okafor@hey.com' },
        { label: 'Address', value: '8 Ezra Street, E2' },
        { label: 'Orders', value: '4' },
        { label: 'Page', value: '/retail' },
      ],
      turns: [
        ['user', 'can i reorder the mask and the shampoo', 30],
        ['bot', 'Repair Mask and Everyday Shampoo — £60, free delivery over £50. Same address on Ezra Street?', 29],
        ['user', 'yep', 27],
        ['bot', 'Done. It goes out tonight and lands tomorrow.', 26],
      ],
    },
    {
      contact: 'Dana Whitlock',
      channel: 'sms',
      status: 'escalated',
      intent: 'Colour correction',
      at: '1 hr',
      unread: 1,
      outcome: 'handed off',
      sentiment: 'negative',
      tags: ['Correction', 'Priority'],
      meta: [
        { label: 'Phone', value: '+44 7700 900 905' },
        { label: 'Last visit', value: '3 days ago' },
        { label: 'Stylist', value: 'Elif Kaya' },
        { label: 'Spend', value: '£1,240 lifetime' },
      ],
      turns: [
        ['user', 'the tone has gone brassy already and I have an event on saturday', 70],
        ['bot', 'That should not happen three days in. This needs Iris rather than me — putting you through now.', 68],
        ['system', 'Iris Bellamy, studio manager, joined', 67],
        ['agent', 'Dana, Iris here. Come in Thursday and Elif will re-tone it, no charge. I have held 18:00 for you.', 60],
      ],
    },
    {
      contact: 'Anonymous visitor',
      channel: 'web',
      status: 'resolved',
      intent: 'Student discount',
      at: '3 hr',
      unread: 0,
      outcome: 'answered',
      sentiment: 'neutral',
      tags: ['FAQ', 'Pricing'],
      meta: [
        { label: 'Page', value: '/services' },
        { label: 'Device', value: 'Android · Chrome' },
        { label: 'Session', value: '52 s' },
        { label: 'Referrer', value: 'instagram.com' },
      ],
      turns: [
        ['user', 'do you do student prices', 182],
        ['bot', '20% off cuts on Tuesdays and Wednesdays with a valid card — colour is excluded.', 181],
      ],
    },
  ],
};

export function conversationsFor(brand: Brand): ConversationSummary[] {
  return (SEEDS[brand.id] ?? []).map((s, i) => ({
    id: `${brand.id}-c${i}`,
    contact: s.contact,
    initials: initialsOf(s.contact === 'Anonymous visitor' ? 'A V' : s.contact),
    channel: s.channel,
    status: s.status,
    intent: s.intent,
    preview: s.turns[s.turns.length - 1][1],
    at: s.at,
    unread: s.unread,
    outcome: s.outcome,
    sentiment: s.sentiment,
    value: s.value,
    tags: s.tags,
    meta: s.meta,
    messages: s.turns.map(([role, text, mins]) => {
      const m = say(role, text, mins);
      return role === 'system' ? { ...m, systemIcon: 'agent' as const } : m;
    }),
  }));
}

/* --- Orders & bookings ------------------------------------------------------- */

const NAMES = [
  'Theo Marchetti',
  'Bea Salcedo',
  'Rafe Coleman',
  'Ines Kowalski',
  'George Adeyemi',
  'Hélène Dufort',
  'Rowan Petit',
  'Yusuf Demir',
  'Grace Okafor',
  'Dana Whitlock',
];

const WHEN = [
  'Today · 19:30',
  'Today · 20:15',
  'Today · 21:00',
  'Tomorrow · 12:30',
  'Tomorrow · 18:45',
  'Fri · 13:00',
  'Fri · 19:15',
  'Sat · 20:00',
];

const STATUSES: Transaction['status'][] = [
  'confirmed',
  'preparing',
  'confirmed',
  'pending',
  'completed',
  'confirmed',
  'cancelled',
  'completed',
];

const SOURCES: Transaction['source'][] = [
  'Saint',
  'Saint',
  'Saint',
  'Front desk',
  'Saint',
  'Phone',
  'Saint',
  'Walk-in',
];

const CHANNELS: Transaction['channel'][] = [
  'web',
  'whatsapp',
  'web',
  'instagram',
  'web',
  'sms',
  'web',
  'web',
];

export function transactionsFor(brand: Brand): Transaction[] {
  const items = brand.catalog.filter((i) => i.available);
  const kind = brand.vertical === 'restaurant' ? 'ORD' : 'APT';
  return NAMES.slice(0, 8).map((name, i) => {
    const item = items[i % items.length];
    const second = items[(i + 3) % items.length];
    const detail =
      brand.vertical === 'restaurant'
        ? `${item.name} · ${second.name}`
        : brand.people.length
          ? `${item.name} · ${brand.people[i % brand.people.length].name}`
          : item.name;
    return {
      id: `${brand.id}-t${i}`,
      ref: `${kind}-${4100 + i * 37}`,
      customer: name,
      initials: initialsOf(name),
      detail,
      when: WHEN[i],
      status: STATUSES[i],
      source: SOURCES[i],
      total: item.price + (brand.vertical === 'restaurant' ? second.price : 0),
      channel: CHANNELS[i],
    };
  });
}

/* --- Numbers ----------------------------------------------------------------- */

export const series14: Record<string, number[][]> = {
  lumiere: [
    [86, 31], [94, 36], [78, 27], [112, 44], [128, 52], [141, 61], [96, 34],
    [88, 30], [104, 41], [126, 49], [118, 46], [149, 64], [131, 55], [162, 71],
  ],
  aurelia: [
    [72, 16], [81, 19], [68, 14], [94, 24], [103, 27], [76, 18], [41, 9],
    [88, 22], [97, 26], [112, 31], [104, 29], [121, 36], [93, 25], [134, 41],
  ],
  solene: [
    [58, 21], [64, 24], [71, 28], [69, 25], [83, 34], [91, 39], [52, 18],
    [61, 23], [77, 31], [86, 36], [94, 41], [88, 37], [102, 46], [114, 52],
  ],
};

export const hourly: Record<string, number[]> = {
  lumiere: [12, 6, 2, 1, 0, 0, 1, 3, 6, 11, 18, 34, 41, 26, 19, 24, 38, 62, 88, 96, 74, 51, 34, 21],
  aurelia: [2, 1, 0, 0, 1, 3, 9, 18, 34, 47, 52, 44, 38, 41, 49, 55, 46, 33, 21, 14, 9, 6, 4, 3],
  solene: [3, 1, 0, 0, 1, 2, 6, 14, 29, 44, 51, 47, 39, 42, 48, 53, 44, 36, 27, 18, 11, 8, 6, 4],
};

export function metricsFor(brand: Brand) {
  const s = series14[brand.id];
  const convos = s.reduce((n, d) => n + d[0], 0);
  const done = s.reduce((n, d) => n + d[1], 0);
  const value = done * (brand.vertical === 'restaurant' ? 62 : brand.vertical === 'clinic' ? 148 : 118);
  return {
    convos,
    done,
    value,
    resolution: brand.vertical === 'restaurant' ? 91 : brand.vertical === 'clinic' ? 87 : 89,
    reply: 1.4,
    doneLabel:
      brand.vertical === 'restaurant' ? 'Orders & tables' : brand.vertical === 'clinic' ? 'Appointments booked' : 'Bookings & orders',
    valueLabel: 'Value handled',
  };
}

export function topIntentsFor(brand: Brand) {
  const map: Record<string, { label: string; count: number }[]> = {
    lumiere: [
      { label: 'Order for delivery', count: 486 },
      { label: 'Book a table', count: 302 },
      { label: 'Allergens & swaps', count: 178 },
      { label: 'Opening hours', count: 142 },
      { label: 'Halal & ingredients', count: 97 },
      { label: 'Parking', count: 64 },
    ],
    aurelia: [
      { label: 'Book an appointment', count: 486 },
      { label: 'Insurance & billing', count: 231 },
      { label: 'Opening hours', count: 178 },
      { label: 'Reschedule or cancel', count: 142 },
      { label: 'Prescriptions', count: 97 },
      { label: 'Access & parking', count: 64 },
    ],
    solene: [
      { label: 'Book a chair', count: 412 },
      { label: 'Colour pricing', count: 264 },
      { label: 'Patch test', count: 198 },
      { label: 'Product reorder', count: 151 },
      { label: 'Cancellation', count: 88 },
      { label: 'Stylist match', count: 57 },
    ],
  };
  return map[brand.id].map((x, i) => ({ ...x, tone: i === 0 ? ('accent' as const) : ('neutral' as const) }));
}

export const channelSplit = [
  { label: 'Website', value: 58, color: 'var(--accent)' },
  { label: 'WhatsApp', value: 22, color: 'var(--spot)' },
  { label: 'Instagram', value: 13, color: 'var(--info)' },
  { label: 'SMS', value: 7, color: 'var(--ink-4)' },
];

export function automationsFor(brand: Brand) {
  const shared = [
    {
      id: 'a3',
      name: 'Escalate on frustration',
      trigger: 'Negative sentiment twice in a row',
      action: `Hand to ${brand.assistant.human} with a summary`,
      runs: 23,
      on: true,
    },
    {
      id: 'a4',
      name: 'Out-of-hours cover',
      trigger: 'Message outside opening hours',
      action: 'Answer, take a number, flag anything urgent',
      runs: 189,
      on: true,
    },
  ];
  if (brand.vertical === 'restaurant') {
    return [
      {
        id: 'a1',
        name: 'Confirm & fire',
        trigger: 'Order placed',
        action: 'Send the ticket to the pass and text an ETA',
        runs: 486,
        on: true,
      },
      {
        id: 'a2',
        name: 'Fill a cancelled table',
        trigger: 'Table released under 24 h',
        action: 'Offer it to the waiting list, first reply wins',
        runs: 61,
        on: true,
      },
      ...shared,
      {
        id: 'a5',
        name: 'Sold-out sweep',
        trigger: 'Kitchen marks a dish off',
        action: 'Hide it everywhere and suggest the nearest thing',
        runs: 34,
        on: false,
      },
    ];
  }
  return [
    {
      id: 'a1',
      name: 'Confirm & remind',
      trigger: 'Booking made',
      action: 'Confirm now, remind 24 hours before',
      runs: 341,
      on: true,
    },
    {
      id: 'a2',
      name: 'Fill a cancellation',
      trigger: 'Slot released under 48 h',
      action: 'Offer it to the waiting list, first reply wins',
      runs: 47,
      on: true,
    },
    ...shared,
    {
      id: 'a5',
      name: 'Rebook nudge',
      trigger: brand.vertical === 'salon' ? '5 weeks after a colour' : '48 h after a visit',
      action: brand.vertical === 'salon' ? 'Offer the same stylist, same slot' : 'Ask for a review, offer a follow-up',
      runs: 0,
      on: false,
    },
  ];
}

export const channels = [
  { id: 'web', name: 'Website widget', on: true, volume: 58 },
  { id: 'whatsapp', name: 'WhatsApp Business', on: true, volume: 22 },
  { id: 'instagram', name: 'Instagram DMs', on: true, volume: 13 },
  { id: 'sms', name: 'SMS', on: true, volume: 7 },
  { id: 'messenger', name: 'Facebook Messenger', on: false, volume: 0 },
];

export function activityFor(brand: Brand) {
  return [
    { who: brand.assistant.human, what: 'closed an escalation', when: '12 min ago' },
    {
      who: 'Saint',
      what: brand.vertical === 'restaurant' ? 'took 14 orders' : 'booked 6 appointments',
      when: '1 hr ago',
    },
    { who: 'Saint', what: 'filled a late cancellation', when: '2 hr ago' },
    { who: 'Saint', what: `answered 31 questions from ${brand.faq.length} articles`, when: '3 hr ago' },
  ];
}

export const fmtMoney = money;

/* ==========================================================================
   Saint's read

   An AI layer on top of the numbers, never instead of them: every line is
   computed from the same data the panels below show, and each one points at
   the page where you can check it.
   ========================================================================== */

export interface Insight {
  icon: 'trendUp' | 'clock' | 'alert' | 'sparkle' | 'users';
  text: string;
  jump: 'overview' | 'inbox' | 'ledger' | 'catalog' | 'knowledge' | 'settings';
  cta: string;
}

export function digestFor(brand: Brand): { headline: string; insights: Insight[] } {
  const s = series14[brand.id];
  const load = hourly[brand.id];
  const m = metricsFor(brand);
  const intents = topIntentsFor(brand);
  const convos = conversationsFor(brand);

  /* Share of the day's volume that lands after the desk closes. */
  const afterHours = load.slice(19).concat(load.slice(0, 7)).reduce((n, v) => n + v, 0);
  const allHours = load.reduce((n, v) => n + v, 0);
  const afterPct = Math.round((afterHours / allHours) * 100);

  const peak = load.indexOf(Math.max(...load));
  const thin = brand.catalog.filter((i) => i.description.trim().length < 12).length;
  const escalated = convos.filter((c) => c.status === 'escalated').length;
  const topShare = Math.round((intents[0].count / intents.reduce((n, i) => n + i.count, 0)) * 100);
  const last = s[s.length - 1];
  const rate = Math.round((last[1] / last[0]) * 100);

  const insights: Insight[] = [
    {
      icon: 'trendUp',
      text: `${topShare}% of everything asked is “${intents[0].label.toLowerCase()}”, and ${rate}% of yesterday's conversations ended in money.`,
      jump: 'ledger',
      cta: brand.vertical === 'restaurant' ? 'See the pass' : 'See the diary',
    },
    {
      icon: 'clock',
      text: `${afterPct}% of requests arrive outside desk hours — the busiest single hour is ${String(peak).padStart(2, '0')}:00.`,
      jump: 'settings',
      cta: 'Out-of-hours rule',
    },
    thin > 0
      ? {
          icon: 'alert',
          text: `${thin} ${thin === 1 ? 'entry has' : 'entries have'} no description, so Saint has nothing to quote when someone asks about ${thin === 1 ? 'it' : 'them'}.`,
          jump: 'catalog',
          cta: 'Write them',
        }
      : {
          icon: 'users',
          text: `${escalated} ${escalated === 1 ? 'conversation' : 'conversations'} reached ${brand.assistant.human.split(' ')[0]} this fortnight — the rest closed without staff.`,
          jump: 'inbox',
          cta: 'Open the inbox',
        },
  ];

  return {
    headline: `${nfmt(m.convos)} conversations, ${nfmt(m.done)} closed, ${m.resolution}% without anyone stepping in.`,
    insights,
  };
}

const nfmt = (n: number) => new Intl.NumberFormat('en-GB').format(n);

/* ==========================================================================
   Chatlog

   What the assistant cost, and where it went wrong. Every row is one model
   call: tokens in, tokens out, what it was asked and how it ended. The demo
   figures are deterministic — same brand, same numbers — because a bill that
   reshuffles on every render is not a bill anyone would read.
   ========================================================================== */

/** Per million tokens, in USD, in / out. Roughly the published rates. */
const MODELS: { name: string; in: number; out: number; share: number }[] = [
  { name: 'claude-sonnet-5', in: 3, out: 15, share: 0.72 },
  { name: 'claude-haiku-4.5', in: 1, out: 5, share: 0.24 },
  { name: 'claude-opus-5', in: 15, out: 75, share: 0.04 },
];

/* Anything past 'escalated' is a row someone should read. The weights are
   what a well-behaved assistant actually looks like: mostly clean, a thin
   tail of trouble. */
const OUTCOMES: { outcome: TurnOutcome; weight: number; note?: string }[] = [
  { outcome: 'answered', weight: 62 },
  { outcome: 'booked', weight: 19 },
  { outcome: 'escalated', weight: 7, note: 'Handed to a person on request' },
  { outcome: 'low confidence', weight: 3.4, note: 'No knowledge article scored above 0.4 — answered from the brand summary' },
  { outcome: 'bad answer', weight: 2.4, note: 'Visitor pressed thumbs down, then asked the same thing again' },
  { outcome: 'wrong info', weight: 1.4, note: 'Quoted a price the catalog had already changed' },
  { outcome: 'refused', weight: 1.3, note: 'Declined a question it holds the answer to' },
  { outcome: 'cut off', weight: 1.2, note: 'Hit the 1,024-token ceiling mid-sentence' },
  { outcome: 'tool error', weight: 0.9, note: 'check_availability returned 502 — fell back to the scripted flow' },
  { outcome: 'timeout', weight: 0.7, note: 'No first token inside 30s; the visitor left' },
  { outcome: 'rate limited', weight: 0.5, note: '429 from the provider — retried once, then queued' },
  { outcome: 'error', weight: 0.2, note: 'Upstream 500. Nothing reached the visitor' },
];

/** Everything that is not plainly successful — what the filter is for. */
export const FLAGGED: TurnOutcome[] = OUTCOMES.slice(3).map((o) => o.outcome);

export const isFlagged = (o: TurnOutcome) => FLAGGED.includes(o);

const PROMPTS: Record<Vertical, string[]> = {
  restaurant: [
    'is the ayam gepuk still on tonight',
    'table for 6 saturday late',
    'do you deliver to mont kiara',
    'whats in the sambal bawang',
    'can i change my order to collection',
    'is everything halal certified',
    'how spicy is full-power',
    'do you do set menus for 20 people',
    'parking near the restaurant?',
    'my rider hasnt arrived, order 4820',
  ],
  clinic: [
    'earliest appointment this week',
    'do you take bupa',
    'need to move fridays appointment',
    'is the mole check done by a dermatologist',
    'how much is a full health review',
    'can i get a repeat prescription',
    'do i need a referral',
    'is there step-free access',
    'what happens if i cancel same day',
    'my results havent come through',
  ],
  salon: [
    'balayage on dark hair, how long',
    'do i need a patch test',
    'can i book with jules on thursday',
    'how much for a cut and colour',
    'do you sell the shampoo you used',
    'can i bring my daughter',
    'whats your cancellation policy',
    'is there parking',
    'gift card for a friend?',
    'my colour has gone brassy',
  ],
};

const CHATLOG_CHANNELS: ChannelId[] = ['web', 'web', 'whatsapp', 'web', 'instagram', 'web', 'sms', 'whatsapp'];

/** Pick from a weighted table with a value already in [0, 1). */
function weighted<T extends { weight: number }>(table: T[], r: number): T {
  const total = table.reduce((n, x) => n + x.weight, 0);
  let acc = 0;
  for (const row of table) {
    acc += row.weight / total;
    if (r < acc) return row;
  }
  return table[table.length - 1];
}

export function chatlogFor(brand: Brand, count = 60): ChatlogEntry[] {
  const prompts = PROMPTS[brand.vertical];
  const intents = topIntentsFor(brand);

  return Array.from({ length: count }, (_, i) => {
    /* One hash per field, with the row index buried mid-string. Taking
       different bit windows out of a single hash looks like it should work
       and does not: FNV-1a only avalanches over the bytes that follow the
       one that changed, so keys differing in their last character land a few
       hundred apart and every row shows the same token count. */
    const r = (field: string) => hash(`${brand.id}/${i}/${field}/log`) / 4294967296;

    const model = weighted(MODELS.map((m) => ({ ...m, weight: m.share })), r('model'));
    const picked = weighted(OUTCOMES, r('outcome'));
    const outcome = picked.outcome;

    /* A long conversation costs more because the whole transcript is resent
       every turn — which is the single most useful thing this page teaches. */
    const turns = 1 + Math.floor(r('turns') * 9);
    const tokensIn = Math.round(900 + turns * (420 + r('in') * 380));
    const cached = outcome === 'error' ? 0 : Math.round(tokensIn * (0.35 + r('cache') * 0.4));
    const tokensOut =
      outcome === 'error' || outcome === 'timeout'
        ? 0
        : outcome === 'cut off'
          ? 1024
          : Math.round(90 + r('out') * 420);

    /* Cached prompt tokens bill at a tenth. */
    const cost =
      ((tokensIn - cached) * model.in + cached * model.in * 0.1 + tokensOut * model.out) / 1e6;

    const ago = 3 + i * 11 + Math.floor(r('when') * 9);
    const when = new Date(Date.now() - ago * 60000);

    const name = NAMES[i % NAMES.length];

    return {
      id: `${brand.id}-log-${i}`,
      at: when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      ago,
      conversation: name,
      initials: initialsOf(name),
      channel: CHATLOG_CHANNELS[i % CHATLOG_CHANNELS.length],
      intent: intents[i % intents.length].label,
      model: model.name,
      tokensIn,
      tokensOut,
      cached,
      cost,
      latency:
        outcome === 'timeout' ? 30 : Number((0.6 + r('lat') * 2.6 + turns * 0.12).toFixed(1)),
      outcome,
      prompt: prompts[i % prompts.length],
      note: picked.note,
    };
  });
}

/** Turns behind one conversation. A booking argues; 'what time do you close'
    does not. Every call resends the transcript, so this is the multiplier
    that actually decides the bill. */
const CALLS_PER_CONVO = 3.4;

/**
 * The bill, derived from the log rather than invented alongside it: the mean
 * cost of a sampled call times the conversation volume the rest of the
 * console already reports. The chart and the tiles cannot disagree because
 * they are the same number.
 */
export function aiSpendFor(brand: Brand) {
  const log = chatlogFor(brand);
  const mean = log.reduce((n, e) => n + e.cost, 0) / log.length;
  const volume = series14[brand.id];
  const series = volume.map((d) => Number((d[0] * CALLS_PER_CONVO * mean).toFixed(2)));
  return {
    series,
    fortnight: series.reduce((n, v) => n + v, 0),
    today: series[series.length - 1],
    callsToday: Math.round(volume[volume.length - 1][0] * CALLS_PER_CONVO),
    mean,
  };
}

/** Spend and volume per model, derived from the log so the totals agree. */
export function modelMixFor(brand: Brand) {
  const log = chatlogFor(brand);
  return MODELS.map((m) => {
    const rows = log.filter((e) => e.model === m.name);
    return {
      name: m.name,
      calls: rows.length,
      tokens: rows.reduce((n, e) => n + e.tokensIn + e.tokensOut, 0),
      cost: rows.reduce((n, e) => n + e.cost, 0),
      rate: `$${m.in}/$${m.out} per M`,
    };
  }).filter((m) => m.calls > 0);
}

/* --- Transcripts -------------------------------------------------------------
   A log row is one model call; the drawer behind it has to answer 'what did
   it actually say'. The turns are reconstructed from the row — the outcome
   decides the reply, so a refusal reads like a refusal and a tool error shows
   the call that failed. */

export interface ToolCall {
  name: string;
  args: string;
  result: string;
  ok: boolean;
  ms: number;
}

export interface TranscriptTurn {
  role: 'user' | 'bot' | 'system';
  text: string;
  /** Minutes before the logged call; the logged turn itself is 0. */
  before: number;
  /** The turn this log row is about. Everything else is context. */
  focus?: boolean;
  tool?: ToolCall;
}

const OPENERS: Record<Vertical, [ 'user' | 'bot', string ][][]> = {
  restaurant: [
    [
      ['user', 'hi, are you open tonight?'],
      ['bot', 'We are — kitchen runs to 22:30, last orders at 22:00. What can I get you?'],
    ],
    [
      ['user', 'hey'],
      ['bot', 'Hai — I can take an order, book you a table, or answer anything about the kitchen.'],
    ],
  ],
  clinic: [
    [
      ['user', 'hello'],
      ['bot', 'Good day — I can book you in, move an appointment, or answer anything about the clinic.'],
    ],
    [
      ['user', 'are you taking new patients?'],
      ['bot', 'We are. First visits are forty minutes, and I can find you one this week.'],
    ],
  ],
  salon: [
    [
      ['user', 'hi there'],
      ['bot', 'Hello — I can book you a chair, match you to a stylist, or sort a product order.'],
    ],
    [
      ['user', 'do you have anything this week?'],
      ['bot', 'Most days, yes. Colour needs a bit more notice — what are you after?'],
    ],
  ],
};

/** The reply the row is really about, and anything the visitor said after. */
function answerFor(e: ChatlogEntry, brand: Brand): { text: string; then?: string } {
  const person = brand.people[0]?.name.split(' ').slice(-1)[0];
  const first = brand.catalog.find((i) => i.available) ?? brand.catalog[0];
  const price = money(first?.price ?? 0, brand.currency);

  switch (e.outcome) {
    case 'booked':
      return { text: `Done — you are in the diary. I have sent the confirmation to your phone.` };
    case 'escalated':
      return {
        text: `That one deserves a person rather than me. Bringing in ${brand.assistant.human} now — one moment.`,
      };
    case 'low confidence':
      return {
        text: `I think so, though I would rather not guess at the detail. ${brand.legal} can confirm on ${brand.phone} — shall I have someone call you back?`,
      };
    case 'bad answer':
      return {
        text: `Our opening hours are on the Visiting page, and there is parking on the street outside.`,
        then: `that isn't what I asked. I asked about ${e.prompt}`,
      };
    case 'wrong info':
      return {
        text: `${first?.name} is ${price} — that has not changed this year.`,
        then: `the website says something different?`,
      };
    case 'refused':
      return {
        text: `That's outside what I can help with, I'm afraid. I'm only set up for ${brand.legal} bookings and information.`,
        then: `but it's on your own website`,
      };
    case 'cut off':
      return {
        text: `Of course. ${first?.name} is ${price} and runs ${first?.duration ?? 'about forty minutes'}. ${person ? `${person} covers it most days, and the` : 'The'} usual pattern is a first visit followed by a review a fortnight later, at which point we`,
      };
    case 'tool error':
      return {
        text: `I could not reach the diary just then. I can take your number and have the desk call you back within the hour — would that do?`,
      };
    case 'timeout':
      return { text: '' };
    case 'rate limited':
      return { text: '' };
    case 'error':
      return { text: '' };
    default:
      return {
        text: `Yes — ${first?.name} is ${price}${first?.duration ? `, ${first.duration}` : ''}. Would you like me to put you down for one?`,
      };
  }
}

function toolFor(e: ChatlogEntry): ToolCall | undefined {
  const slow = Math.round(120 + (hash(e.id + 'tool') % 400));
  if (e.outcome === 'tool error')
    return {
      name: 'check_availability',
      args: `{ "from": "today", "days": 7 }`,
      result: '502 Bad Gateway — diary service unreachable',
      ok: false,
      ms: 30000,
    };
  if (e.outcome === 'booked')
    return {
      name: 'create_booking',
      args: `{ "slot": "09:00", "name": "${e.conversation}" }`,
      result: `{ "ref": "APT-${4100 + (hash(e.id) % 800)}", "confirmed": true }`,
      ok: true,
      ms: slow,
    };
  if (e.outcome === 'wrong info')
    return {
      name: 'search_knowledge',
      args: `{ "q": "price" }`,
      result: '2 articles, top score 0.71 — both last edited in March',
      ok: true,
      ms: slow,
    };
  if (e.outcome === 'low confidence')
    return {
      name: 'search_knowledge',
      args: `{ "q": "${e.prompt.slice(0, 28)}" }`,
      result: 'no article above 0.4 — falling back to the brand summary',
      ok: true,
      ms: slow,
    };
  return undefined;
}

export function transcriptFor(e: ChatlogEntry, brand: Brand): TranscriptTurn[] {
  const opener = OPENERS[brand.vertical][hash(e.id + 'open') % 2];
  const answer = answerFor(e, brand);
  const turns: TranscriptTurn[] = [
    {
      role: 'system',
      text: `Conversation opened · ${e.channel === 'web' ? 'website widget' : e.channel}`,
      before: 9,
    },
    ...opener.map(([role, text], i) => ({ role, text, before: 8 - i })),
    { role: 'user' as const, text: e.prompt, before: 1 },
  ];

  const tool = toolFor(e);
  if (tool) turns.push({ role: 'system', text: '', before: 0, tool });

  if (answer.text) {
    turns.push({ role: 'bot', text: answer.text, before: 0, focus: true });
  } else {
    /* Nothing reached the visitor. Say so where the reply would have been —
       an empty gap is the one thing a transcript must never leave. */
    turns.push({
      role: 'system',
      text:
        e.outcome === 'timeout'
          ? 'No first token inside 30s. The widget gave up and the visitor left.'
          : e.outcome === 'rate limited'
            ? '429 from the provider. Retried once, then queued behind 6 other calls.'
            : 'Upstream 500. Nothing was shown to the visitor.',
      before: 0,
      focus: true,
    });
  }

  if (answer.then) turns.push({ role: 'user', text: answer.then, before: 0 });
  if (e.outcome === 'escalated')
    turns.push({
      role: 'system',
      text: `${brand.assistant.human}, ${brand.assistant.humanRole}, joined`,
      before: 0,
    });

  return turns;
}

/* ==========================================================================
   The diary

   Five weeks either side of today, so the calendar has a past to report on
   and a future to fill. Deterministic per brand: the same week always looks
   the same, which is what makes it a demo rather than a lava lamp.
   ========================================================================== */

const DIARY_NAMES = [
  'Priya Raghunathan', 'Tomas Beckett', 'Hélène Dufort', 'Marion Alvarez', 'Aiman Hakim',
  'Nurul Amira', 'Daniel Tan', 'Grace Okafor', 'Rowan Petit', 'Yusuf Demir',
  'Ines Kowalski', 'Rafe Coleman', 'Bea Salcedo', 'Theo Marchetti', 'Dana Whitlock',
  'George Adeyemi', 'Cleo Nakamura', 'Idris Mensah', 'Freya Lindqvist', 'Omar Haddad',
];

const DIARY_SLOTS = [
  '09:00', '09:45', '10:30', '11:15', '12:00', '13:30',
  '14:15', '15:00', '15:45', '16:30', '17:15', '18:00', '19:00', '20:00',
];

/* Nobody books a table for nine in the morning. Service, not office hours. */
const SITTINGS = [
  '17:00', '17:30', '18:00', '18:30', '19:00',
  '19:30', '20:00', '20:30', '21:00', '21:30',
];

/* A restaurant books a table, not a dish — the diary should say where they
   are sitting, and the kitchen ticket is a separate thing entirely. */
const AREAS = ['Main room', 'Window table', 'Terrace', 'Bar counter', 'Private booth'];

/** Average spend per cover, for pricing a table before anyone has ordered. */
const PER_COVER = 24;

const SOURCES2: DiaryEntry['source'][] = ['Saint', 'Saint', 'Saint', 'Front desk', 'Saint', 'Phone', 'Saint', 'Walk-in'];
const DIARY_CHANNELS: ChannelId[] = ['web', 'web', 'whatsapp', 'web', 'instagram', 'sms', 'web', 'whatsapp'];

/* A day that has already happened can only have finished one way; a day that
   has not can only be waiting for one. Splitting the tables is what keeps
   'no show' out of next Tuesday. */
const PAST: { status: BookingStatus; weight: number }[] = [
  { status: 'attended', weight: 78 },
  { status: 'cancelled', weight: 12 },
  { status: 'no show', weight: 6 },
  { status: 'rescheduled', weight: 4 },
];

const AHEAD: { status: BookingStatus; weight: number }[] = [
  { status: 'booked', weight: 76 },
  { status: 'rescheduled', weight: 12 },
  { status: 'cancelled', weight: 7 },
  { status: 'waitlist', weight: 5 },
];

const shiftDate = (days: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
};

/** Fourteen days back, twenty-one forward. Quiet Sundays, busy Saturdays. */
export function diaryFor(brand: Brand): DiaryEntry[] {
  const items = brand.catalog.filter((i) => i.available && i.categoryId !== 'retail');
  const menu = items.length ? items : brand.catalog;
  const team = brand.people.filter((p) => p.available !== false);
  const slots = brand.vertical === 'restaurant' ? SITTINGS : DIARY_SLOTS;
  const out: DiaryEntry[] = [];
  let n = 0;

  for (let offset = -14; offset <= 21; offset++) {
    const day = shiftDate(offset);
    const dow = day.getDay();
    const key = iso(day);
    const r = (field: string) => hash(`${brand.id}/${key}/${field}/diary`) / 4294967296;

    /* Sunday is closed almost everywhere in these three; Saturday is short
       and busy. Everything else runs a normal book. */
    if (dow === 0) continue;
    const load = dow === 6 ? 3 + Math.floor(r('load') * 3) : 4 + Math.floor(r('load') * 5);

    const used = new Set<string>();
    for (let k = 0; k < load; k++) {
      const rr = (field: string) => hash(`${brand.id}/${key}/${k}/${field}`) / 4294967296;

      let slot = slots[Math.floor(rr('slot') * slots.length)];
      /* Two people cannot have the same chair at the same time. */
      let guard = 0;
      while (used.has(slot) && guard++ < slots.length) {
        slot = slots[(slots.indexOf(slot) + 1) % slots.length];
      }
      used.add(slot);

      const item = menu[Math.floor(rr('item') * menu.length)];
      const person = team.length ? team[Math.floor(rr('who') * team.length)] : undefined;
      const name = DIARY_NAMES[Math.floor(rr('name') * DIARY_NAMES.length)];
      const picked = weighted(offset < 0 ? PAST : AHEAD, rr('status'));
      const table = brand.vertical === 'restaurant';
      const party = table ? 2 + Math.floor(rr('party') * 6) : undefined;

      out.push({
        id: `${brand.id}-d${n}`,
        ref: `${brand.vertical === 'restaurant' ? 'TBL' : 'APT'}-${4100 + n * 7}`,
        date: key,
        slot,
        minutes: table ? 90 : Number.parseInt(item.duration ?? '40', 10) || 40,
        customer: name,
        initials: initialsOf(name),
        contact: `+44 7700 900 ${100 + (n % 800)}`,
        personId: person?.id,
        personName: person?.name,
        personHue: person?.hue,
        /* No catalog item behind a table, so the drawer shows the booking
           rather than a dish nobody has ordered yet. */
        itemId: table ? '' : item.id,
        itemName: table ? AREAS[Math.floor(rr('area') * AREAS.length)] : item.name,
        party,
        status: picked.status,
        channel: DIARY_CHANNELS[n % DIARY_CHANNELS.length],
        source: SOURCES2[n % SOURCES2.length],
        value: table ? (party ?? 2) * PER_COVER : item.price,
        movedFrom:
          picked.status === 'rescheduled'
            ? iso(shiftDate(offset - 2 - Math.floor(rr('moved') * 6)))
            : undefined,
        note:
          picked.status === 'cancelled'
            ? 'Cancelled in chat, slot released automatically'
            : picked.status === 'no show'
              ? 'Reminder delivered, nobody arrived'
              : picked.status === 'waitlist'
                ? 'Holding for the first cancellation'
                : undefined,
      });
      n++;
    }
  }

  return out;
}

/** Counts for the calendar cells, keyed by ISO date. */
export function diaryByDate(entries: DiaryEntry[]) {
  const map = new Map<string, DiaryEntry[]>();
  for (const e of entries) {
    const list = map.get(e.date);
    if (list) list.push(e);
    else map.set(e.date, [e]);
  }
  for (const list of map.values()) list.sort((a, b) => a.slot.localeCompare(b.slot));
  return map;
}

/** Live in the diary's sense: still expected to happen. */
export const isOpenBooking = (s: BookingStatus) =>
  s === 'booked' || s === 'rescheduled' || s === 'waitlist';
