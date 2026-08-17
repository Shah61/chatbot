import { useMemo, useState } from 'react';
import { Icon, type IconName } from '../Icon';
import { BookingDrawer } from './BookingDrawer';
import { BookingsList } from './BookingsList';
import { DiaryCalendar } from './DiaryCalendar';
import { diaryFor, hourly, isOpenBooking, transactionsFor } from '../../lib/activity';
import { useStore } from '../../lib/store';
import type { ChannelId, DiaryEntry } from '../../lib/types';
import { cx, iso, money } from '../../lib/utils';

const FILTERS = ['All', 'Confirmed', 'Preparing', 'Pending', 'Completed', 'Cancelled'] as const;

const PILL: Record<string, string> = {
  confirmed: 'pill-positive',
  preparing: 'pill-info',
  pending: 'pill-warning',
  completed: 'pill-neutral',
  cancelled: 'pill-danger',
};

const CHANNEL: Record<ChannelId, IconName> = {
  web: 'globe',
  whatsapp: 'whatsapp',
  instagram: 'instagram',
  sms: 'sms',
};

export function TransactionsPage() {
  const { brand } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [opened, setOpened] = useState<string | null>(null);
  const all = transactionsFor(brand);
  const rows = all.filter((t) => (filter === 'All' ? true : t.status === filter.toLowerCase()));

  const diary = useMemo(() => diaryFor(brand), [brand]);
  const booking = diary.find((e) => e.id === opened);
  const open = (e: DiaryEntry) => setOpened(e.id);

  const load = hourly[brand.id];
  const peak = Math.max(...load);
  const peakHour = load.indexOf(peak);
  const revenue = all.reduce((n, t) => n + t.total, 0);
  const restaurant = brand.vertical === 'restaurant';

  /* The diary is the honest source for these now — they were hardcoded when
     there was nothing behind them to count. */
  const today = iso(new Date());
  const ahead = diary.filter((e) => e.date >= today && isOpenBooking(e.status));
  const past = diary.filter((e) => e.date < today);
  const noShow = past.filter((e) => e.status === 'no show').length;
  const moved = diary.filter((e) => e.status === 'rescheduled').length;

  const tiles = [
    {
      icon: restaurant ? 'bag' : 'calendar',
      label: restaurant ? 'Tables ahead' : 'Booked ahead',
      value: String(ahead.length),
      note: `${money(ahead.reduce((n, e) => n + e.value, 0), brand.currency)} in the next three weeks`,
    },
    {
      icon: 'refresh',
      label: 'Moved by Saint',
      value: String(moved),
      note: 'rescheduled in chat, without a call to the desk',
    },
    {
      icon: 'bell',
      label: 'No-show rate',
      value: past.length ? `${((noShow / past.length) * 100).toFixed(1)}%` : '0%',
      note: `${noShow} in the last fortnight · reminders go out automatically`,
    },
  ] as const;

  return (
    <div className="stack">
      <div className="grid g3 stagger">
        {tiles.map((t) => (
          <div className="panel stat" key={t.label}>
            <Icon name={t.icon as IconName} size={88} strokeWidth={0.9} className="stat-ghost" />
            <div className="stat-label">
              <Icon name={t.icon as IconName} size={14} style={{ color: 'var(--ink-3)' }} />
              <span className="eyebrow">{t.label}</span>
            </div>
            <div className="stat-value">
              <span className="numeral">{t.value}</span>
            </div>
            <div className="meta" style={{ fontSize: 10.5 }}>
              {t.note}
            </div>
          </div>
        ))}
      </div>

      <DiaryCalendar entries={diary} onOpen={open} />

      <BookingsList entries={diary} onOpen={open} />

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>When they come in</h3>
            <p className="meta">
              Requests by hour — {restaurant ? 'the rush is after the phone line closes' : 'a third arrive after the desk goes home'}.
            </p>
          </div>
          <span className="pill pill-accent">
            Peak {String(peakHour).padStart(2, '0')}:00
          </span>
        </div>
        <div className="panel-body">
          <div className="hours-bars">
            {load.map((v, h) => (
              <div
                key={h}
                className={cx('hour', v > peak * 0.8 && 'peak')}
                style={{ height: `${(v / peak) * 100}%`, animationDelay: `${h * 14}ms` }}
                title={`${String(h).padStart(2, '0')}:00 — ${v}`}
              />
            ))}
          </div>
          <div className="hours-axis">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
        </div>
      </div>

      {/* Only a kitchen has a pass. For the clinic and the salon everything
          Saint closed is a booking, and the diary above already has it. */}
      {restaurant && (
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>The pass</h3>
            <p className="meta">
              {rows.length} of {all.length} · {money(revenue, brand.currency)} total
            </p>
          </div>
          <div className="panel-acts">
            {FILTERS.map((f) => (
              <button key={f} className={cx('chip', filter === f && 'on')} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="panel-body flush">
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Customer</th>
                  <th>Detail</th>
                  <th>When</th>
                  <th>Source</th>
                  <th className="right">Value</th>
                  <th className="right">Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="num" style={{ letterSpacing: '0.03em' }}>
                      {t.ref}
                    </td>
                    <td>
                      <span className="who">
                        <span className="monogram">{t.initials}</span>
                        <b>{t.customer}</b>
                      </span>
                    </td>
                    <td className="clip">{t.detail}</td>
                    <td className="num">{t.when}</td>
                    <td>
                      {t.source === 'Saint' ? (
                        <span className="pill pill-accent">
                          <Icon name="sparkle" size={10} />
                          Saint
                        </span>
                      ) : (
                        <span className="pill pill-neutral">{t.source}</span>
                      )}
                    </td>
                    <td className="right num">{money(t.total, brand.currency)}</td>
                    <td className="right">
                      <span className={cx('pill', PILL[t.status])}>{t.status}</span>
                    </td>
                    <td className="right">
                      <span
                        style={{ display: 'inline-flex', gap: 4, color: 'var(--ink-4)' }}
                        title={t.channel}
                      >
                        <Icon name={CHANNEL[t.channel]} size={14} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {booking && <BookingDrawer entry={booking} onClose={() => setOpened(null)} />}
    </div>
  );
}
