import { useEffect, useState } from 'react';
import { Icon, type IconName } from '../Icon';
import { STATUS_PILL } from './DiaryCalendar';
import { isOpenBooking } from '../../lib/activity';
import { useStore } from '../../lib/store';
import type { BookingStatus, ChannelId, DiaryEntry } from '../../lib/types';
import { cx, iso, money, prettyDate } from '../../lib/utils';

/* Every booking, filterable by where it got to. The statuses double as the
   filter row because there is no second vocabulary worth teaching. */

const STATUSES: BookingStatus[] = [
  'booked',
  'rescheduled',
  'attended',
  'cancelled',
  'no show',
  'waitlist',
];

const STATUS_ICON: Record<BookingStatus, IconName> = {
  booked: 'calendar',
  rescheduled: 'refresh',
  attended: 'checkCircle',
  cancelled: 'close',
  'no show': 'alert',
  waitlist: 'clock',
};

const CHANNEL: Record<ChannelId, IconName> = {
  web: 'globe',
  whatsapp: 'whatsapp',
  instagram: 'instagram',
  sms: 'sms',
};

type Filter = 'all' | 'upcoming' | BookingStatus;

const when = (e: DiaryEntry) => {
  const today = iso(new Date());
  const d = new Date(`${e.date}T12:00:00`);
  const label =
    e.date === today
      ? 'Today'
      : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${label} · ${e.slot}`;
};

export function BookingsList({
  entries,
  onOpen,
}: {
  entries: DiaryEntry[];
  onOpen: (e: DiaryEntry) => void;
}) {
  const { brand } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const today = iso(new Date());

  /* A filter is about this book, not the next one. Switching business with
     'no show' still selected would show an empty table for no clear reason. */
  useEffect(() => setFilter('all'), [brand.id]);

  /* Newest first for what has happened, soonest first for what has not —
     which is the same thing as sorting away from today in both directions. */
  const rows = entries
    .filter((e) =>
      filter === 'all'
        ? true
        : filter === 'upcoming'
          ? e.date >= today && isOpenBooking(e.status)
          : e.status === filter,
    )
    .sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot));

  const counts = Object.fromEntries(
    STATUSES.map((s) => [s, entries.filter((e) => e.status === s).length]),
  ) as Record<BookingStatus, number>;

  const upcoming = entries.filter((e) => e.date >= today && isOpenBooking(e.status)).length;
  const value = rows.filter((e) => e.status !== 'cancelled').reduce((n, e) => n + e.value, 0);
  const noun = brand.vertical === 'restaurant' ? 'tables' : 'bookings';

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>All {noun}</h3>
          <p className="meta">
            {rows.length} of {entries.length} · {money(value, brand.currency)} on the books
          </p>
        </div>
        <div className="panel-acts wrap">
          <button className={cx('chip', filter === 'all' && 'on')} onClick={() => setFilter('all')}>
            All
          </button>
          <button
            className={cx('chip', filter === 'upcoming' && 'on')}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
            <span className="chip-count">{upcoming}</span>
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              className={cx('chip log-kind', filter === s && 'on')}
              onClick={() => setFilter(s)}
              disabled={!counts[s]}
            >
              {s}
              <span className="chip-count">{counts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-body flush">
        <div className="table-scroll">
          <table className="tbl log-tbl diary-tbl">
            <thead>
              <tr>
                <th>Ref</th>
                <th>When</th>
                <th>{brand.vertical === 'restaurant' ? 'Guest' : 'Patient'}</th>
                <th>{brand.vertical === 'restaurant' ? 'Covers' : 'With'}</th>
                <th>For</th>
                <th>Source</th>
                <th className="right">Value</th>
                <th className="right">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="log-row" onClick={() => onOpen(e)}>
                  <td className="num" style={{ letterSpacing: '0.03em' }}>
                    {e.ref}
                  </td>
                  <td className="num">
                    {when(e)}
                    {e.movedFrom && (
                      <span className="moved-mark" title={`Moved from ${prettyDate(e.movedFrom)}`}>
                        <Icon name="refresh" size={10} />
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="who">
                      <span className="monogram">{e.initials}</span>
                      <b>{e.customer}</b>
                      <Icon name={CHANNEL[e.channel]} size={12} style={{ color: 'var(--ink-4)' }} />
                    </span>
                  </td>
                  <td>
                    {e.personName ? (
                      <span className="with">
                        <span
                          className="cal-dot"
                          style={{ background: `hsl(${e.personHue} 46% 52%)` }}
                        />
                        {e.personName}
                      </span>
                    ) : (
                      <span className="meta">{e.party ? `${e.party} covers` : '—'}</span>
                    )}
                  </td>
                  <td>
                    <span className="log-ask">{e.itemName}</span>
                  </td>
                  <td>
                    {e.source === 'Saint' ? (
                      <span className="pill pill-accent">
                        <Icon name="sparkle" size={10} />
                        Saint
                      </span>
                    ) : (
                      <span className="pill pill-neutral">{e.source}</span>
                    )}
                  </td>
                  <td className="right num">{money(e.value, brand.currency)}</td>
                  <td className="right">
                    <span className={cx('pill', STATUS_PILL[e.status])}>
                      <Icon name={STATUS_ICON[e.status]} size={10} />
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <div className="log-empty">
              <Icon name="calendar" size={22} />
              Nothing under that filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
