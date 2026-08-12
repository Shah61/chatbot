import { useEffect, useState } from 'react';
import { Icon } from '../Icon';
import { Motif } from '../art/Motif';
import { useLive } from '../../lib/live';
import { PROGRESS_STEPS, openDays, isoOf } from '../../lib/bot';
import type { Action, Block, Brand, CartLine } from '../../lib/types';
import {
  bookedSlots,
  cx,
  dayShort,
  freeCount,
  money,
  monthShort,
  prettyDate,
  slotsFor,
} from '../../lib/utils';

export interface BlockProps {
  block: Block;
  brand: Brand;
  live: boolean;
  resolved?: string;
  dark: boolean;
  cart: CartLine[];
  /** Lets a picker tell whether a later one has replaced it. */
  messageId?: string;
  onAction: (a: Action) => void;
  onQty: (itemId: string, delta: number) => void;
}

export function BlockView(p: BlockProps) {
  const { block, brand, live, resolved, onAction } = p;
  /* Bookings made this session, so a slot taken a moment ago stops looking
     free. The backend refuses it either way — this keeps the grid honest. */
  const { messages } = useLive();

  /* The model often re-checks availability while confirming. An unanswered
     picker with a newer one below it is noise, so it folds to one line. */
  const superseded = (kind: Block['kind']) => {
    if (resolved || !p.messageId) return false;
    const i = messages.findIndex((m) => m.id === p.messageId);
    if (i < 0) return false;
    return messages.slice(i + 1).some((m) => m.blocks.some((b) => b.kind === kind));
  };

  switch (block.kind) {
    case 'quickReplies':
      return (
        <div className="blk qr-row">
          {block.options.map((o) => (
            <button key={o.label} className="qr" disabled={!live} onClick={() => onAction(o.action)}>
              {o.label}
            </button>
          ))}
        </div>
      );

    case 'categories': {
      const cats = brand.categories.filter((c) => brand.catalog.some((i) => i.categoryId === c.id));
      return (
        <div className="blk cat-row">
          {cats.map((c) => {
            const on = resolved === c.id;
            const n = brand.catalog.filter((i) => i.categoryId === c.id && i.available).length;
            return (
              <button
                key={c.id}
                className={cx('pick cat', on && 'on', resolved && !on && 'off')}
                disabled={!live}
                onClick={() => onAction({ id: 'pick_category', value: c.id })}
              >
                <span className="cat-count">{n}</span>
                <b>{c.name}</b>
                <span>{c.note}</span>
              </button>
            );
          })}
        </div>
      );
    }

    case 'catalog': {
      const items = block.ids
        .map((id) => brand.catalog.find((i) => i.id === id))
        .filter(Boolean) as Brand['catalog'];
      return (
        <div className="blk cat-list">
          {items.map((it) => {
            const on = resolved === it.id;
            const qty = p.cart.find((l) => l.itemId === it.id)?.qty ?? 0;
            const selectable = block.mode === 'select';
            const Wrapper = selectable ? 'button' : 'div';
            return (
              <Wrapper
                key={it.id}
                className={cx('pick dish', on && 'on', resolved && !on && 'off')}
                {...(selectable
                  ? {
                      disabled: !live,
                      onClick: () => onAction({ id: 'pick_item', value: it.id }),
                    }
                  : {})}
              >
                <Motif hue={it.hue} seed={it.id} size={52} dark={p.dark} className="dish-art" />
                <div className="dish-main">
                  <div className="dish-top">
                    <span className="dish-name">{it.name}</span>
                    <span className="dish-price price">{money(it.price, brand.currency)}</span>
                  </div>
                  <p className="dish-desc">{it.description}</p>
                  <div className="dish-foot">
                    {it.duration && <span className="tagchip">{it.duration}</span>}
                    {it.tags.slice(0, 2).map((t) => (
                      <span className="tagchip" key={t}>
                        {t}
                      </span>
                    ))}
                    {selectable ? (
                      <span style={{ marginLeft: 'auto', color: 'var(--ink-4)' }}>
                        <Icon name={on ? 'checkCircle' : 'chevronRight'} size={16} />
                      </span>
                    ) : qty > 0 ? (
                      <span className="stepper">
                        <button onClick={() => p.onQty(it.id, -1)} aria-label={`One fewer ${it.name}`}>
                          <Icon name="minus" size={13} />
                        </button>
                        <b>{qty}</b>
                        <button onClick={() => p.onQty(it.id, 1)} aria-label={`One more ${it.name}`}>
                          <Icon name="plus" size={13} />
                        </button>
                      </span>
                    ) : (
                      <button className="add-btn" onClick={() => p.onQty(it.id, 1)}>
                        <Icon name="plus" size={13} />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </Wrapper>
            );
          })}
        </div>
      );
    }

    case 'people': {
      const people = block.ids
        .map((id) => brand.people.find((x) => x.id === id))
        .filter(Boolean) as Brand['people'];
      return (
        <div className="blk who-list">
          {people.map((x) => {
            const on = resolved === x.id;
            return (
              <button
                key={x.id}
                className={cx('pick who', on && 'on', resolved && !on && 'off')}
                disabled={!live}
                onClick={() => onAction({ id: 'pick_person', value: x.id })}
              >
                <Motif hue={x.hue} seed={x.id + x.name} size={44} dark={p.dark} />
                <span className="who-main">
                  <span className="who-name">{`${x.title} ${x.name}`.trim()}</span>
                  <span className="who-role">{x.role}</span>
                  <span className="who-line">
                    <span className="who-rate">
                      <Icon name="star" size={11} strokeWidth={1.8} />
                      {x.rating.toFixed(1)}
                      <span style={{ color: 'var(--ink-4)', fontWeight: 400 }}>({x.reviews})</span>
                    </span>
                    <span style={{ color: 'var(--line-strong)' }}>·</span>
                    <span className="who-next">
                      <Icon name="clock" size={11} />
                      {x.next}
                    </span>
                  </span>
                </span>
                <Icon
                  name={on ? 'checkCircle' : 'chevronRight'}
                  size={16}
                  style={{ color: on ? 'var(--accent)' : 'var(--ink-4)' }}
                />
              </button>
            );
          })}
          {people.length > 1 && (
            <button
              className="qr"
              disabled={!live}
              onClick={() => onAction({ id: 'any_person' })}
              style={{ alignSelf: 'flex-start' }}
            >
              <Icon name="wand" size={13} />
              Whoever is free soonest
            </button>
          )}
        </div>
      );
    }

    case 'party':
      return (
        <div className="blk party-row">
          {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => {
            const on = resolved === String(n);
            return (
              <button
                key={n}
                className={cx('pick party', on && 'on', resolved && !on && 'off')}
                disabled={!live}
                onClick={() => onAction({ id: 'pick_party', value: n })}
              >
                {n}
              </button>
            );
          })}
        </div>
      );

    case 'fulfilment':
      return (
        <div className="blk ful-row">
          {(
            [
              { id: 'delivery', icon: 'truck', name: 'Delivery', note: '30 min · RM 5' },
              { id: 'collection', icon: 'bag', name: 'Collection', note: 'Ready in 20 min' },
            ] as const
          ).map((f) => {
            const on = resolved === f.id;
            return (
              <button
                key={f.id}
                className={cx('pick ful', on && 'on', resolved && !on && 'off')}
                disabled={!live}
                onClick={() => onAction({ id: 'pick_fulfilment', value: f.id })}
              >
                <Icon name={f.icon} size={22} strokeWidth={1.3} />
                <b>{f.name}</b>
                <span>{f.note}</span>
              </button>
            );
          })}
        </div>
      );

    case 'dates': {
      if (superseded('dates')) {
        return (
          <div className="blk blk-stale">
            <Icon name="calendar" size={12} />
            <b>Days</b> — shown again below
          </div>
        );
      }
      const days = openDays(brand, 7);
      const key = block.personId ?? brand.id;
      return (
        <div className="blk date-row scroll-area">
          {days.map((d) => {
            const k = isoOf(d);
            const free = freeCount(key, k, bookedSlots(messages, key, k, brand.id));
            const on = resolved === k;
            return (
              <button
                key={k}
                className={cx('pick date', on && 'on', resolved && !on && 'off')}
                disabled={!live || free === 0}
                onClick={() => onAction({ id: 'pick_date', value: k })}
              >
                <i>{dayShort(d)}</i>
                <b>{d.getDate()}</b>
                <span>{free === 0 ? 'full' : `${free} free`}</span>
              </button>
            );
          })}
          <div className="date" style={{ display: 'grid', placeItems: 'center', color: 'var(--ink-4)' }}>
            <Icon name="calendar" size={15} />
            <span style={{ fontSize: 9.5, marginTop: 3 }}>{monthShort(days[0])}</span>
          </div>
        </div>
      );
    }

    case 'slots': {
      if (superseded('slots')) {
        return (
          <div className="blk blk-stale">
            <Icon name="clock" size={12} />
            <b>{prettyDate(block.date)}</b> — times shown again below
          </div>
        );
      }
      const key = block.personId ?? brand.id;
      const all = slotsFor(key, block.date, bookedSlots(messages, key, block.date, brand.id));
      const groups = [
        { name: 'Earlier', items: all.filter((s) => +s.time.slice(0, 2) < 13) },
        { name: 'Later', items: all.filter((s) => +s.time.slice(0, 2) >= 13) },
      ].filter((g) => g.items.length);
      return (
        <div className="blk">
          {groups.map((g) => (
            <div className="slot-sec" key={g.name}>
              <div className="slot-head">
                <span>{g.name}</span>
              </div>
              <div className="slot-grid">
                {g.items.map((s) => {
                  const on = resolved === s.time;
                  return (
                    <button
                      key={s.time}
                      className={cx(
                        'pick slot',
                        s.taken && 'gone',
                        on && 'on',
                        resolved && !on && !s.taken && 'off',
                      )}
                      disabled={!live || s.taken}
                      onClick={() => onAction({ id: 'pick_slot', value: s.time })}
                    >
                      {s.time}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'contactForm':
      return <ContactForm {...p} wants={block.wants} />;

    case 'orderTicket': {
      const o = block.order;
      return (
        <div className="blk ticket">
          <div className="tk-top">
            <div>
              <div className="tk-title">
                {o.fulfilment === 'collection' ? 'Collection' : 'On its way'}
              </div>
              <div className="tk-sub">
                {o.eta} · {o.name}
              </div>
            </div>
            <div className="tk-ref">
              <div className="eyebrow">Ref</div>
              <b>{o.ref}</b>
            </div>
          </div>
          <div className="tk-rip">
            <div className="tk-dash" />
          </div>
          <div className="tk-lines">
            {o.lines.map((l) => {
              const it = brand.catalog.find((i) => i.id === l.itemId);
              if (!it) return null;
              return (
                <div className="tk-line" key={l.itemId}>
                  <em>{l.qty}×</em>
                  <span>{it.name}</span>
                  <b>{money(it.price * l.qty, brand.currency)}</b>
                </div>
              );
            })}
          </div>
          <div className="tk-total">
            <span className="eyebrow">Total paid</span>
            <b>{money(o.total, brand.currency)}</b>
          </div>
          <div className="tk-foot">
            <button className="btn btn-sm btn-primary" onClick={() => onAction({ id: 'track' })}>
              <Icon name="route" size={14} />
              Track order
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => onAction({ id: 'human' })}>
              Change it
            </button>
          </div>
        </div>
      );
    }

    case 'bookingTicket': {
      const b = block.booking;
      const item = brand.catalog.find((i) => i.id === b.itemId);
      const person = brand.people.find((x) => x.id === b.personId);
      return (
        <div className="blk ticket">
          <div className="tk-top">
            <div>
              <div className="tk-title">
                {item?.name ?? `Table for ${b.party}`}
              </div>
              <div className="tk-sub">
                {person
                  ? `${person.title} ${person.name} · ${item?.duration ?? ''}`.trim()
                  : `${brand.name}, ${brand.district}`}
              </div>
            </div>
            <div className="tk-ref">
              <div className="eyebrow">Ref</div>
              <b>{b.ref}</b>
            </div>
          </div>
          <div className="tk-rip">
            <div className="tk-dash" />
          </div>
          <div className="tk-grid">
            <div className="tk-cell">
              <div className="eyebrow">When</div>
              <div className="tk-val">
                <strong>{prettyDate(b.date)}</strong>
                {b.slot}
              </div>
            </div>
            <div className="tk-cell">
              <div className="eyebrow">Where</div>
              <div className="tk-val">
                <strong>{brand.address.split(',')[0]}</strong>
                {brand.district}
              </div>
            </div>
            <div className="tk-cell">
              <div className="eyebrow">{b.party ? 'Party' : 'Name'}</div>
              <div className="tk-val">
                <strong>{b.party ? `${b.party} people` : b.name}</strong>
                {b.contact}
              </div>
            </div>
            <div className="tk-cell">
              <div className="eyebrow">{b.total ? 'Fee' : 'Deposit'}</div>
              <div className="tk-val">
                <strong>{b.total ? money(b.total, brand.currency) : 'None'}</strong>
                {b.total ? 'On the day' : 'Just turn up'}
              </div>
            </div>
          </div>
          <div className="tk-foot">
            <button className="btn btn-sm btn-primary" onClick={() => onAction({ id: 'track' })}>
              <Icon name="calendar" size={14} />
              Add to calendar
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => onAction({ id: 'human' })}>
              Move it
            </button>
          </div>
        </div>
      );
    }

    case 'progress':
      return (
        <div className="blk blk-card prog">
          {PROGRESS_STEPS.map((s, i) => (
            <div
              key={s.label}
              className={cx('prog-step', i < block.step && 'done', i === block.step && 'now')}
            >
              <span className="prog-dot">
                <Icon name="check" size={11} strokeWidth={2.4} />
              </span>
              <span>
                <b>{s.label}</b>
                <span>{i === block.step ? s.note : ''}</span>
              </span>
            </div>
          ))}
        </div>
      );

    case 'handoff':
      return <HandoffCard brand={brand} />;

    case 'hours':
      return (
        <div className="blk blk-card">
          <div className="rows" style={{ paddingTop: 8 }}>
            {brand.hours.map((h) => (
              <div className={cx('row', h.hours === 'Closed' && 'shut')} key={h.day}>
                <span className="k">{h.day}</span>
                <span className="lead" />
                <span className="v">{h.hours}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'summary':
      return (
        <div className="blk blk-card">
          <div className="rows" style={{ paddingTop: 8 }}>
            {block.rows.map((r) => (
              <div className="row" key={r.label}>
                <span className="k">{r.label}</span>
                <span className="lead" />
                <span className="v">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'sources':
      return (
        <div className="blk src-row">
          <span className="eyebrow" style={{ fontSize: 9 }}>
            From
          </span>
          {block.items.map((s) => (
            <span className="src" key={s.title}>
              <Icon name="book" size={11} />
              <b>{s.title}</b>
              <span>· {s.section}</span>
            </span>
          ))}
        </div>
      );

    case 'location':
      return (
        <div className="blk blk-card">
          <MiniMap />
          <div className="map-foot">
            <div>
              <b>{brand.legal}</b>
              {brand.address}, {brand.district}
            </div>
            <button className="btn btn-sm btn-ghost">
              <Icon name="external" size={13} />
              Directions
            </button>
          </div>
        </div>
      );

    default:
      return null;
  }
}

/* --- Handoff to a person ----------------------------------------------------- */

function HandoffCard({ brand }: { brand: Brand }) {
  const { status, agent, waitingSince, agentOnline, cancelRequest } = useLive();
  const [, tick] = useState(0);

  /* Re-render once a second so the visitor can see they are not forgotten. */
  useEffect(() => {
    if (status !== 'waiting') return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const waited = waitingSince ? Math.floor((Date.now() - waitingSince) / 1000) : 0;
  const clock = `${Math.floor(waited / 60)}:${String(waited % 60).padStart(2, '0')}`;
  const who = agent?.name ?? brand.assistant.human;
  const role = agent?.role ?? brand.assistant.humanRole;

  if (status === 'active') {
    return (
      <div className="blk handoff is-live">
        <span className="handoff-face monogram">{agent?.initials ?? who[0]}</span>
        <div className="handoff-main">
          <b>{who} is here</b>
          <span>{role} · sees this whole conversation</span>
        </div>
        <Icon name="checkCircle" size={18} style={{ color: 'var(--positive)' }} />
      </div>
    );
  }

  if (status === 'ended') {
    return (
      <div className="blk handoff is-done">
        <span className="handoff-face monogram">
          <Icon name="check" size={15} />
        </span>
        <div className="handoff-main">
          <b>Chat closed</b>
          <span>Saint has the conversation again</span>
        </div>
      </div>
    );
  }

  return (
    <div className="blk handoff">
      <span className="handoff-face monogram is-waiting">{who[0]}</span>
      <div className="handoff-main">
        <b>{agentOnline ? `Finding you ${who.split(' ')[0]}` : 'Nobody at the desk'}</b>
        <span>
          {agentOnline
            ? `${role} · usually under a minute`
            : `We are closed, so ${who.split(' ')[0]} will reply first thing`}
        </span>
        <span className="handoff-note">
          <Icon name="eye" size={11} />
          They can read everything above — you will not have to repeat yourself.
        </span>
      </div>
      <div className="handoff-side">
        <span className="handoff-clock">{clock}</span>
        <button className="handoff-cancel" onClick={cancelRequest}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* --- Inline contact capture ------------------------------------------------- */

function ContactForm({
  live,
  resolved,
  onAction,
  wants,
}: BlockProps & { wants: 'address' | 'phone' }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const ready = name.trim().length > 1 && contact.trim().length > 4;

  if (resolved) {
    const [n, c] = resolved.split('|');
    return (
      <div className="blk blk-card">
        <div className="rows" style={{ paddingTop: 8 }}>
          <div className="row">
            <span className="k">Name</span>
            <span className="lead" />
            <span className="v">{n}</span>
          </div>
          <div className="row">
            <span className="k">{wants === 'address' ? 'Address' : 'Mobile'}</span>
            <span className="lead" />
            <span className="v">{c}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      className="blk blk-card form"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onAction({ id: 'submit_details', name: name.trim(), contact: contact.trim() });
      }}
    >
      <div className="form-grid">
        <div className={wants === 'address' ? 'full' : undefined}>
          <label className="label" htmlFor="s-name">
            Name
          </label>
          <input
            id="s-name"
            className="field"
            placeholder="Aiman Hakim"
            value={name}
            disabled={!live}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className={wants === 'address' ? 'full' : undefined}>
          <label className="label" htmlFor="s-contact">
            {wants === 'address' ? 'Delivery address' : 'Mobile'}
          </label>
          <input
            id="s-contact"
            className="field"
            placeholder={wants === 'address' ? '18 Jalan Telawi, Bangsar' : '012-345 6789'}
            value={contact}
            disabled={!live}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>
      </div>
      <button className="btn btn-primary" disabled={!ready || !live}>
        {wants === 'address' ? 'Place order' : 'Confirm'}
        <Icon name="arrowRight" size={15} />
      </button>
      <div className="form-note">
        <Icon name="lock" size={11} />
        Encrypted, and never used for marketing.
      </div>
    </form>
  );
}

/* --- Decorative map --------------------------------------------------------- */

function MiniMap() {
  return (
    <svg className="map" viewBox="0 0 340 118" preserveAspectRatio="xMidYMid slice">
      <rect width="340" height="118" fill="var(--surface-2)" />
      <path d="M0 76 Q42 62 78 70 T146 62 L146 118 L0 118Z" fill="var(--accent-soft)" />
      <g stroke="var(--line)" strokeWidth="7" strokeLinecap="round">
        <path d="M-10 40 L350 26" />
        <path d="M-10 94 L350 84" />
        <path d="M214 -10 L234 128" />
        <path d="M96 -10 L104 128" />
      </g>
      <g stroke="var(--line-soft)" strokeWidth="2.5" strokeLinecap="round">
        <path d="M-10 65 L350 57" />
        <path d="M292 -10 L302 128" />
      </g>
      <g fill="var(--surface-3)">
        <rect x="118" y="34" width="30" height="16" rx="2" />
        <rect x="248" y="36" width="34" height="14" rx="2" />
        <rect x="244" y="96" width="40" height="18" rx="2" />
      </g>
      <g transform="translate(172 53)">
        <circle r="18" fill="var(--accent)" opacity="0.14" />
        <circle r="9.5" fill="var(--accent)" />
        <circle r="3.2" fill="var(--accent-ink)" />
      </g>
    </svg>
  );
}
