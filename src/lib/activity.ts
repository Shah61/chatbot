import type {
  Brand,
  ConversationSummary,
  Message,
  Transaction,
} from './types';
import { initialsOf, money } from './utils';

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
      contact: 'Theo Marchetti',
      channel: 'web',
      status: 'open',
      intent: 'Order · delivery',
      at: '2 min',
      unread: 2,
      outcome: 'ordered',
      sentiment: 'positive',
      value: 78,
      tags: ['Repeat', 'Delivery'],
      meta: [
        { label: 'Phone', value: '+44 7700 900 118' },
        { label: 'Address', value: '14 Chiltern St, W1U' },
        { label: 'Orders', value: '11 this year' },
        { label: 'Page', value: '/menu' },
      ],
      turns: [
        ['user', 'is the turbot still on tonight?', 14],
        ['bot', 'It is — last two portions, and the kitchen is holding one back for a regular. Shall I put your name on it?', 13],
        ['user', 'yes please, plus the sourdough and a bottle of the chenin', 11],
        ['bot', 'Turbot, sourdough and the Les Lunes Chenin — £78 all in. Delivery to Chiltern Street, twenty-five minutes.', 10],
        ['user', 'perfect', 3],
        ['bot', 'Order is with the pass. I will ping you when the rider leaves.', 2],
      ],
    },
    {
      contact: 'Bea Salcedo',
      channel: 'whatsapp',
      status: 'escalated',
      intent: 'Allergy · nuts',
      at: '18 min',
      unread: 1,
      outcome: 'handed off',
      sentiment: 'negative',
      tags: ['Allergen', 'Priority'],
      meta: [
        { label: 'Phone', value: '+44 7700 900 244' },
        { label: 'Booking', value: 'Fri 20:00 · 4' },
        { label: 'Flagged', value: 'Severe nut allergy' },
        { label: 'Channel', value: 'WhatsApp' },
      ],
      turns: [
        ['user', 'one of our party has a severe nut allergy — can the kitchen handle that on friday?', 26],
        ['bot', 'Yes, and I want a person to confirm the detail rather than me guessing. Bringing in Odile now.', 25],
        ['system', 'Odile Renard, restaurant manager, joined', 24],
        ['agent', 'Bea — Odile here. The celeriac is the only nut dish and we will keep it off your section entirely. I have flagged the table.', 18],
      ],
    },
    {
      contact: 'Rafe Coleman',
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
        { label: 'Phone', value: '+44 7700 900 371' },
        { label: 'Party', value: '6' },
        { label: 'Date', value: 'Sat 21:00' },
        { label: 'Device', value: 'iPhone · Safari' },
      ],
      turns: [
        ['user', 'table for 6 on saturday, late as possible', 56],
        ['bot', 'Six on Saturday — 21:00 is the latest I can seat you properly. Shall I hold it?', 55],
        ['user', 'yes', 53],
        ['bot', 'Held under Coleman, ref TBL-4820. The kitchen closes at midnight, so no rush.', 52],
      ],
    },
    {
      contact: 'Anonymous visitor',
      channel: 'instagram',
      status: 'open',
      intent: 'Corkage',
      at: '2 hr',
      unread: 0,
      outcome: 'answered',
      sentiment: 'neutral',
      tags: ['FAQ'],
      meta: [
        { label: 'Handle', value: '@wine_and_wander' },
        { label: 'Followers', value: '4.4k' },
        { label: 'Session', value: '41 s' },
        { label: 'Channel', value: 'Instagram DM' },
      ],
      turns: [
        ['user', 'can we bring our own bottle', 122],
        ['bot', '£25 corkage a bottle, waived on Tuesdays, two bottles per table. Bring something good.', 121],
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
      { label: 'Corkage & wine', count: 97 },
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
