import { useState } from 'react';
import { Icon, type IconName } from '../Icon';
import { Motif } from '../art/Motif';
import { useStore } from '../../lib/store';
import type { AwayReason, Person } from '../../lib/types';
import { cx } from '../../lib/utils';

/* ==========================================================================
   Rota — who is on today.

   The console page that answers one question: can we still see this patient?
   Taking someone off drops them out of the site's team page and out of what
   the assistant offers, so the answer stays true without anyone remembering
   to change it in two places. Naming cover moves their list to a colleague;
   leaving cover blank closes the slots, and if that empties a service the
   page says so before you find out from a booking.
   ========================================================================== */

const REASONS: { id: AwayReason; label: string; short: string; icon: IconName }[] = [
  { id: 'mc', label: 'Sick leave (MC)', short: 'MC', icon: 'heart' },
  { id: 'leave', label: 'Annual leave', short: 'Leave', icon: 'calendar' },
  { id: 'training', label: 'Training', short: 'Training', icon: 'book' },
  { id: 'conference', label: 'Conference', short: 'Conference', icon: 'globe' },
];

const reasonOf = (id: AwayReason) => REASONS.find((r) => r.id === id)!;
const fullName = (p: Person) => `${p.title} ${p.name}`.trim();

export function RotaPage() {
  const { brand, scheme, updatePerson } = useStore();
  const [editing, setEditing] = useState<string | null>(null);

  const dark = scheme === 'dark';
  const team = brand.people;
  const on = team.filter((p) => p.available !== false);
  const off = team.filter((p) => p.available === false);
  const uncovered = off.filter((p) => !p.away?.coverId);

  /* A service is only bookable while someone who covers it is on the rota. */
  const services = brand.categories
    .filter((c) => c.id !== 'retail' && team.some((p) => p.focus.includes(c.id)))
    .map((c) => ({
      ...c,
      onNow: on.filter((p) => p.focus.includes(c.id)),
      total: team.filter((p) => p.focus.includes(c.id)).length,
    }));
  const dropped = services.filter((s) => s.onNow.length === 0);

  const goOff = (p: Person) => {
    updatePerson(p.id, {
      available: false,
      away: p.away ?? { reason: 'mc', until: 'End of the week' },
    });
    setEditing(p.id);
  };

  const goOn = (p: Person) => {
    updatePerson(p.id, { available: true, away: undefined });
    if (editing === p.id) setEditing(null);
  };

  return (
    <div className="stack">
      <div className="grid g3 stagger">
        <div className="panel stat">
          <Icon name="users" size={88} strokeWidth={0.9} className="stat-ghost" />
          <div className="stat-label">
            <Icon name="users" size={14} style={{ color: 'var(--ink-3)' }} />
            <span className="eyebrow">On the rota</span>
          </div>
          <div className="stat-value">
            <span className="numeral">{on.length}</span>
            <span className="unit">/ {team.length} {brand.peopleNoun}</span>
          </div>
          <div className="meta" style={{ fontSize: 10.5 }}>
            {off.length ? `${off.length} away right now` : 'everyone is in'}
          </div>
        </div>

        <div className="panel stat">
          <Icon name="calendar" size={88} strokeWidth={0.9} className="stat-ghost" />
          <div className="stat-label">
            <Icon name="calendar" size={14} style={{ color: 'var(--ink-3)' }} />
            <span className="eyebrow">Covered</span>
          </div>
          <div className="stat-value">
            <span className="numeral">{off.length - uncovered.length}</span>
            <span className="unit">/ {off.length || 0} lists</span>
          </div>
          <div className="meta" style={{ fontSize: 10.5 }}>
            {uncovered.length
              ? `${uncovered.length} without a name against it`
              : 'every absence has cover'}
          </div>
        </div>

        <div className={cx('panel stat', dropped.length > 0 && 'is-warning')}>
          <Icon name="alert" size={88} strokeWidth={0.9} className="stat-ghost" />
          <div className="stat-label">
            <Icon name="alert" size={14} style={{ color: 'var(--ink-3)' }} />
            <span className="eyebrow">Off the menu</span>
          </div>
          <div className="stat-value">
            <span className="numeral">{dropped.length}</span>
            <span className="unit">services</span>
          </div>
          <div className="meta" style={{ fontSize: 10.5 }}>
            {dropped.length
              ? `Saint has stopped booking ${dropped.map((d) => d.name.toLowerCase()).join(', ')}`
              : 'everything is still bookable'}
          </div>
        </div>
      </div>

      <div className="grid gsplit">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Today</h3>
              <p className="meta">
                Switch someone off and they come off the site and out of the assistant in the same
                breath. Name cover and their list moves across.
              </p>
            </div>
          </div>

          <div className="panel-body" style={{ paddingTop: 4 }}>
            <div className="rota">
              {team.map((p) => {
                const isOn = p.available !== false;
                const cover = p.away?.coverId
                  ? team.find((x) => x.id === p.away?.coverId)
                  : undefined;

                return (
                  <div className={cx('rota-row', !isOn && 'is-off')} key={p.id}>
                    <div className="rota-main">
                      <Motif hue={p.hue} seed={p.id + p.name} size={44} dark={dark} />
                      <div className="rota-who">
                        <div className="rota-name">
                          {fullName(p)}
                          {isOn ? (
                            <span className="pill pill-positive">
                              <span className="dot" />
                              On
                            </span>
                          ) : (
                            <span className="pill pill-warning">
                              {reasonOf(p.away?.reason ?? 'mc').short}
                            </span>
                          )}
                        </div>
                        <div className="rota-role">
                          {p.role}
                          <i />
                          {isOn ? (
                            <span>
                              <Icon name="clock" size={11} />
                              Next free {p.next.toLowerCase()}
                            </span>
                          ) : (
                            <span>Back {p.away?.until.toLowerCase()}</span>
                          )}
                        </div>
                      </div>

                      <div className="rota-acts">
                        {!isOn && (
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => setEditing(editing === p.id ? null : p.id)}
                          >
                            <Icon name="pencil" size={13} />
                            {cover ? 'Change cover' : 'Assign cover'}
                          </button>
                        )}
                        <button
                          className={cx('switch', isOn && 'on')}
                          role="switch"
                          aria-checked={isOn}
                          aria-label={`${fullName(p)} on the rota`}
                          onClick={() => (isOn ? goOff(p) : goOn(p))}
                        />
                      </div>
                    </div>

                    {/* What the change actually did, in the words a receptionist
                        would use — this is the line that makes the toggle safe. */}
                    {!isOn && (
                      <div className={cx('rota-effect', !cover && 'is-open')}>
                        <Icon name={cover ? 'route' : 'alert'} size={13} />
                        {cover ? (
                          <span>
                            <b>{fullName(cover)}</b> is taking the list. Saint offers their slots for{' '}
                            {p.focus
                              .map((f) => brand.categories.find((c) => c.id === f)?.name ?? f)
                              .join(' and ')
                              .toLowerCase()}
                            .
                          </span>
                        ) : (
                          <span>
                            No cover named, so those slots stay closed and Saint offers the next
                            {' '}{brand.peopleNoun.replace(/s$/, '')} who is free.
                          </span>
                        )}
                      </div>
                    )}

                    {editing === p.id && !isOn && (
                      <AwayEditor
                        key={p.id}
                        person={p}
                        team={team}
                        onDone={() => setEditing(null)}
                        onChange={(patch) => updatePerson(p.id, patch)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Cover by service</h3>
              <p className="meta">What Saint is still allowed to book.</p>
            </div>
          </div>
          <div className="panel-body" style={{ paddingTop: 4 }}>
            <div className="cover-list">
              {services.map((s) => (
                <div className={cx('cover-row', !s.onNow.length && 'is-down')} key={s.id}>
                  <div className="cover-top">
                    <span className="cover-name">{s.name}</span>
                    <span className={cx('cover-count', !s.onNow.length && 'is-down')}>
                      {s.onNow.length}/{s.total}
                    </span>
                  </div>
                  <div className="cover-bar">
                    {Array.from({ length: s.total }, (_, i) => (
                      <span key={i} className={cx('cover-tick', i < s.onNow.length && 'on')} />
                    ))}
                  </div>
                  <div className="cover-who">
                    {s.onNow.length
                      ? s.onNow.map((p) => fullName(p)).join(' · ')
                      : 'Nobody on — bookings paused'}
                  </div>
                </div>
              ))}
            </div>

            <div className={cx('cover-note', dropped.length > 0 && 'is-warning')}>
              <Icon name={dropped.length ? 'alert' : 'checkCircle'} size={14} />
              {dropped.length ? (
                <span>
                  Anyone asking for {dropped.map((d) => d.name.toLowerCase()).join(' or ')} is
                  offered the waiting list instead of a slot.
                </span>
              ) : (
                <span>Every service on the list has someone who can deliver it today.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Marking someone off ------------------------------------------------------ */

function AwayEditor({
  person,
  team,
  onChange,
  onDone,
}: {
  person: Person;
  team: Person[];
  onChange: (patch: Partial<Person>) => void;
  onDone: () => void;
}) {
  const { brand, createPerson } = useStore();
  const [adding, setAdding] = useState(false);
  const away = person.away ?? { reason: 'mc' as AwayReason, until: '' };

  /* Only colleagues who are in and who actually cover the same ground — a
     dermatologist cannot pick up a dental list. */
  const eligible = team.filter(
    (p) => p.id !== person.id && p.available !== false && p.focus.some((f) => person.focus.includes(f)),
  );
  const rest = team.filter(
    (p) =>
      p.id !== person.id && p.available !== false && !p.focus.some((f) => person.focus.includes(f)),
  );

  const set = (patch: Partial<typeof away>) => onChange({ away: { ...away, ...patch } });

  return (
    <div className="away">
      <div className="away-grid">
        <div>
          <label className="label">Reason</label>
          <div className="seg">
            {REASONS.map((r) => (
              <button
                key={r.id}
                className={cx('seg-btn', away.reason === r.id && 'on')}
                onClick={() => set({ reason: r.id })}
              >
                <Icon name={r.icon} size={13} />
                {r.short}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Back on</label>
          <input
            className="field"
            value={away.until}
            placeholder="Fri 15 Aug"
            onChange={(e) => set({ until: e.target.value })}
          />
        </div>
      </div>

      <div className="away-cover">
        <label className="label">Who takes the list</label>
        <div className="away-picks">
          <button
            className={cx('pick', !away.coverId && 'on')}
            onClick={() => set({ coverId: undefined })}
          >
            <span className="pick-mark">
              <Icon name="close" size={13} />
            </span>
            <span className="pick-text">
              <b>Close the slots</b>
              <span>Nothing is offered until they are back</span>
            </span>
          </button>

          {eligible.map((p) => (
            <button
              key={p.id}
              className={cx('pick', away.coverId === p.id && 'on')}
              onClick={() => set({ coverId: p.id })}
            >
              <span className="pick-mark">
                <Icon name="check" size={13} />
              </span>
              <span className="pick-text">
                <b>{fullName(p)}</b>
                <span>{p.role} · next free {p.next.toLowerCase()}</span>
              </span>
            </button>
          ))}

          {/* Nobody in the building can take it — so bring somebody in. */}
          <button className="pick is-add" onClick={() => setAdding(true)}>
            <span className="pick-mark">
              <Icon name="plus" size={13} />
            </span>
            <span className="pick-text">
              <b>Add a {locumNoun(brand.vertical)}</b>
              <span>Somebody new, straight onto the rota</span>
            </span>
          </button>

          {eligible.length === 0 && !adding && (
            <p className="meta away-empty">
              Nobody else on the rota covers {person.role.toLowerCase()}
              {rest.length ? ' — cover it with someone new, or let the slots close.' : '.'}
            </p>
          )}
        </div>

        {adding && (
          <NewPersonForm
            person={person}
            onCancel={() => setAdding(false)}
            onCreate={(init) => {
              const made = createPerson(init);
              set({ coverId: made.id });
              setAdding(false);
            }}
          />
        )}
      </div>

      <div className="away-foot">
        <button className="btn btn-sm btn-primary" onClick={onDone}>
          <Icon name="check" size={13} />
          Done
        </button>
      </div>
    </div>
  );
}

const locumNoun = (vertical: string) =>
  vertical === 'clinic' ? 'locum' : vertical === 'salon' ? 'stylist' : 'colleague';

/* --- Bringing somebody new in ------------------------------------------------- */

function NewPersonForm({
  person,
  onCreate,
  onCancel,
}: {
  person: Person;
  onCreate: (init: Pick<Person, 'name' | 'title' | 'role' | 'focus' | 'bio'>) => void;
  onCancel: () => void;
}) {
  const { brand } = useStore();
  /* Prefilled to cover exactly what is now missing, which is the whole reason
     this form is open — it can still be changed. */
  const [title, setTitle] = useState(brand.vertical === 'clinic' ? 'Dr' : '');
  const [name, setName] = useState('');
  const [role, setRole] = useState(person.role);
  const [focus, setFocus] = useState<string[]>(person.focus);

  const bookable = brand.categories.filter((c) => c.id !== 'retail');
  const ready = name.trim().length > 1 && role.trim().length > 1 && focus.length > 0;

  const toggle = (id: string) =>
    setFocus((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  return (
    <div className="newp">
      <div className="newp-head">
        <Icon name="user" size={14} />
        <b>New on the rota</b>
        <span className="meta">
          Covering {fullName(person)} — they go live on the site and in the assistant straight away.
        </span>
      </div>

      <div className="newp-fields">
        <div className="newp-title">
          <label className="label">Title</label>
          <input
            className="field"
            value={title}
            placeholder={brand.vertical === 'clinic' ? 'Dr' : '—'}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Name</label>
          <input
            className="field"
            value={name}
            placeholder="Full name"
            autoFocus
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Speciality</label>
          <input
            className="field"
            value={role}
            placeholder="General medicine"
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
      </div>

      <div className="newp-focus">
        <label className="label">Can take</label>
        <div className="newp-chips">
          {bookable.map((c) => (
            <button
              key={c.id}
              className={cx('chip', focus.includes(c.id) && 'on')}
              onClick={() => toggle(c.id)}
            >
              {focus.includes(c.id) && <Icon name="check" size={12} />}
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="newp-foot">
        <button className="btn btn-sm btn-quiet" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn btn-sm btn-primary"
          disabled={!ready}
          onClick={() =>
            onCreate({
              title: title.trim(),
              name: name.trim(),
              role: role.trim(),
              focus,
              bio: `Covering ${fullName(person)} while they are away.`,
            })
          }
        >
          <Icon name="check" size={13} />
          Add and assign
        </button>
      </div>
    </div>
  );
}
