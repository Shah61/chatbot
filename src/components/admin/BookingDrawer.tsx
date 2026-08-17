import { useEffect } from 'react';
import { Icon, type IconName } from '../Icon';
import { Motif } from '../art/Motif';
import { STATUS_PILL } from './DiaryCalendar';
import { useStore } from '../../lib/store';
import type { ChannelId, DiaryEntry } from '../../lib/types';
import { cx, money, prettyDate } from '../../lib/utils';

/* One booking, opened from the calendar or the list. Same drawer as the
   transcript, so the console only ever slides one thing in from the right. */

const CHANNEL: Record<ChannelId, IconName> = {
  web: 'globe',
  whatsapp: 'whatsapp',
  instagram: 'instagram',
  sms: 'sms',
};

export function BookingDrawer({ entry, onClose }: { entry: DiaryEntry; onClose: () => void }) {
  const { brand, scheme } = useStore();
  const item = brand.catalog.find((i) => i.id === entry.itemId);
  const person = brand.people.find((p) => p.id === entry.personId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rows: [string, string][] = [
    ['When', `${prettyDate(entry.date)} · ${entry.slot}`],
    ['Length', `${entry.minutes} min`],
    [brand.vertical === 'restaurant' ? 'Covers' : 'With', entry.personName ?? `${entry.party ?? 2} people`],
    ['For', entry.itemName],
    ['Value', money(entry.value, brand.currency)],
    ['Reference', entry.ref],
    ['Booked through', entry.source === 'Saint' ? 'Saint · in chat' : entry.source],
    ['Contact', entry.contact],
  ];

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={`Booking ${entry.ref}`}>
        <header className="drawer-head">
          <span className="monogram">{entry.initials}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{entry.customer}</h2>
            <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name={CHANNEL[entry.channel]} size={12} />
              {entry.ref} · {prettyDate(entry.date)}
            </div>
          </div>
          <span className={cx('pill', STATUS_PILL[entry.status])}>{entry.status}</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={16} />
          </button>
        </header>

        <div className="drawer-body scroll-area">
          {entry.movedFrom && (
            <div className="tr-fault" style={{ color: 'var(--warning)', background: 'var(--warning-soft)', borderColor: 'color-mix(in srgb, var(--warning) 28%, transparent)' }}>
              <Icon name="refresh" size={15} />
              <span>
                <b>Moved</b>
                Was {prettyDate(entry.movedFrom)}. Saint offered the new time and the visitor took
                it — no call to the desk.
              </span>
            </div>
          )}
          {entry.note && !entry.movedFrom && (
            <div className="tr-fault" style={{ color: 'var(--ink-2)', background: 'var(--surface-2)', borderColor: 'var(--line)' }}>
              <Icon name="shield" size={15} />
              <span>{entry.note}</span>
            </div>
          )}

          {item && (
            <div className="book-item">
              <Motif hue={item.hue} seed={item.id} size={54} dark={scheme === 'dark'} />
              <div>
                <b>{item.name}</b>
                <p className="meta">{item.description}</p>
              </div>
            </div>
          )}

          <section className="fieldset">
            <div className="eyebrow">
              <Icon name="calendar" size={12} />
              The booking
            </div>
            <div className="rail-rows">
              {rows.map(([k, v]) => (
                <div className="rail-row" key={k}>
                  <span className="k">{k}</span>
                  <span className="v">{v}</span>
                </div>
              ))}
            </div>
          </section>

          {person && (
            <section className="fieldset">
              <div className="eyebrow">
                <Icon name="users" size={12} />
                {brand.peopleNoun.replace(/s$/, '')}
              </div>
              <div className="book-person">
                <Motif hue={person.hue} seed={person.id + person.name} size={44} dark={scheme === 'dark'} />
                <div>
                  <b>{person.name}</b>
                  <p className="meta">
                    {person.title} · next free {person.next}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        <footer className="drawer-foot">
          <button className="btn btn-sm btn-primary">
            <Icon name="refresh" size={13} />
            Move
          </button>
          <button className="btn btn-sm btn-ghost">
            <Icon name="mail" size={13} />
            Remind
          </button>
          <button className="btn btn-sm btn-quiet" style={{ marginLeft: 'auto' }} onClick={onClose}>
            Close
          </button>
        </footer>
      </aside>
    </>
  );
}
