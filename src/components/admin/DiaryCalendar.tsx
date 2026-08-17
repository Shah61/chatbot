import { useMemo, useState } from 'react';
import { Icon } from '../Icon';
import { diaryByDate } from '../../lib/activity';
import { useStore } from '../../lib/store';
import type { BookingStatus, DiaryEntry } from '../../lib/types';
import { cx, iso, money } from '../../lib/utils';

/* ==========================================================================
   The diary, as a month

   A booking list answers "what happened to Mrs Okafor"; a calendar answers
   "what does Thursday look like", which is the question an owner actually
   opens the console with. Days carry their own load so the shape of the week
   is legible before you read a single name.
   ========================================================================== */

export const STATUS_PILL: Record<BookingStatus, string> = {
  booked: 'pill-info',
  rescheduled: 'pill-warning',
  attended: 'pill-positive',
  cancelled: 'pill-danger',
  'no show': 'pill-danger',
  waitlist: 'pill-neutral',
};

/* Monday-first: every one of these businesses thinks of the week that way. */
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const monthLabel = (d: Date) =>
  d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

const dayLabel = (isoDate: string) =>
  new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

/** The 6×7 block of dates that covers a month, Monday first. */
function monthGrid(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
  /* getDay is Sunday-first; shift so Monday is 0. */
  const lead = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(first);
    d.setDate(1 - lead + i);
    return d;
  });
}

export function DiaryCalendar({
  entries,
  onOpen,
}: {
  entries: DiaryEntry[];
  onOpen: (e: DiaryEntry) => void;
}) {
  const { brand } = useStore();
  const today = iso(new Date());
  const [anchor, setAnchor] = useState(() => new Date());
  const [picked, setPicked] = useState(today);

  const byDate = useMemo(() => diaryByDate(entries), [entries]);
  const grid = useMemo(() => monthGrid(anchor), [anchor]);
  const month = anchor.getMonth();

  const day = byDate.get(picked) ?? [];
  const busiest = Math.max(1, ...grid.map((d) => byDate.get(iso(d))?.length ?? 0));

  /* The diary only runs a few weeks either side of today. Paging past that
     would show an empty month, which reads as a bug rather than as the end
     of the data, so the arrows stop where the book does. */
  const span = useMemo(() => {
    const dates = entries.map((e) => e.date).sort();
    return { first: dates[0]?.slice(0, 7) ?? '', last: dates.at(-1)?.slice(0, 7) ?? '' };
  }, [entries]);
  const cursor = iso(anchor).slice(0, 7);

  const step = (by: number) => {
    const next = new Date(anchor);
    next.setDate(1);
    next.setMonth(next.getMonth() + by);
    setAnchor(next);
  };

  const jumpToday = () => {
    setAnchor(new Date());
    setPicked(today);
  };

  return (
    <div className="grid gsplit">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>{monthLabel(anchor)}</h3>
            <p className="meta">
              {entries.filter((e) => e.date.startsWith(iso(anchor).slice(0, 7))).length}{' '}
              {brand.vertical === 'restaurant' ? 'tables' : 'appointments'} this month · pick a day
              to see it in full.
            </p>
          </div>
          <div className="panel-acts">
            <button className="chip" onClick={jumpToday}>
              Today
            </button>
            <button
              className="icon-btn"
              onClick={() => step(-1)}
              disabled={cursor <= span.first}
              aria-label="Previous month"
            >
              <Icon name="chevronLeft" size={15} />
            </button>
            <button
              className="icon-btn"
              onClick={() => step(1)}
              disabled={cursor >= span.last}
              aria-label="Next month"
            >
              <Icon name="chevronRight" size={15} />
            </button>
          </div>
        </div>
        <div className="panel-body">
          <div className="cal-head">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="cal-grid">
            {grid.map((d) => {
              const key = iso(d);
              const list = byDate.get(key) ?? [];
              const open = list.filter((e) => e.status !== 'cancelled');
              return (
                <button
                  key={key}
                  className={cx(
                    'cal-day',
                    d.getMonth() !== month && 'off',
                    key === today && 'today',
                    key === picked && 'on',
                  )}
                  onClick={() => setPicked(key)}
                >
                  <span className="cal-date">{d.getDate()}</span>
                  {open.length > 0 && (
                    <>
                      {/* A bar rather than a number: the shape of the week
                          should be readable without counting. */}
                      <span
                        className="cal-load"
                        style={{ width: `${(open.length / busiest) * 100}%` }}
                      />
                      <span className="cal-marks">
                        {open.slice(0, 4).map((e) => (
                          <span
                            key={e.id}
                            className="cal-dot"
                            style={
                              e.personHue !== undefined
                                ? { background: `hsl(${e.personHue} 46% 52%)` }
                                : undefined
                            }
                          />
                        ))}
                        {open.length > 4 && <span className="cal-more">+{open.length - 4}</span>}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {brand.people.length > 0 && (
            <div className="cal-key">
              {brand.people.map((p) => (
                <span className="cal-key-item" key={p.id}>
                  <span className="cal-dot" style={{ background: `hsl(${p.hue} 46% 52%)` }} />
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>{picked === today ? 'Today' : dayLabel(picked)}</h3>
            <p className="meta">
              {day.length
                ? `${day.filter((e) => e.status !== 'cancelled').length} in the book · ${money(
                    day.filter((e) => e.status !== 'cancelled').reduce((n, e) => n + e.value, 0),
                    brand.currency,
                  )}`
                : 'Nothing in the book.'}
            </p>
          </div>
        </div>
        <div className="panel-body day-body scroll-area">
          {day.map((e) => (
            <button key={e.id} className="day-row" onClick={() => onOpen(e)}>
              <span className="day-time num">{e.slot}</span>
              <span
                className="day-spine"
                style={
                  e.personHue !== undefined
                    ? { background: `hsl(${e.personHue} 46% 52%)` }
                    : undefined
                }
              />
              <span className="day-main">
                <span className="day-l1">
                  <b>{e.customer}</b>
                  <span className={cx('pill', STATUS_PILL[e.status])}>{e.status}</span>
                </span>
                <span className="day-l2">
                  {e.itemName}
                  {e.personName && ` · ${e.personName}`}
                  {e.party && ` · ${e.party} covers`}
                </span>
              </span>
            </button>
          ))}
          {!day.length && (
            <div className="log-empty">
              <Icon name="calendar" size={22} />
              A clear day. Saint will fill it if anyone asks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
