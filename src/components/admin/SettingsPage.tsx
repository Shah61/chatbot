import { useEffect, useState } from 'react';
import { Icon, type IconName } from '../Icon';
import { automationsFor, channels } from '../../lib/activity';
import { useStore } from '../../lib/store';
import { PRODUCT } from '../../lib/brands';
import { cx, nf } from '../../lib/utils';

const TONES = [
  { id: 'warm', name: 'Warm', note: 'Human, unhurried' },
  { id: 'formal', name: 'Formal', note: 'Precise, professional' },
  { id: 'brief', name: 'Brief', note: 'Short, no flourish' },
];

const CHAN_ICON: Record<string, IconName> = {
  web: 'globe',
  whatsapp: 'whatsapp',
  instagram: 'instagram',
  sms: 'sms',
  messenger: 'chat',
};

const ESCALATE: Record<string, string[]> = {
  lumiere: ['Allergy detail', 'Complaints', 'Refunds', 'Large parties', 'Press'],
  aurelia: ['Clinical advice', 'Refunds & disputes', 'Two negative turns', 'Complaints'],
  solene: ['Colour corrections', 'Refunds', 'Two negative turns', 'Complaints'],
};

export function SettingsPage() {
  const { brand } = useStore();
  const [tone, setTone] = useState('warm');
  const autos = automationsFor(brand);
  const [on, setOn] = useState<Record<string, boolean>>({});
  const [chan, setChan] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOn(Object.fromEntries(autos.map((a) => [a.id, a.on])));
    setChan(Object.fromEntries(channels.map((c) => [c.id, c.on])));
  }, [brand.id]);

  return (
    <div className="stack" style={{ maxWidth: 960 }}>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Voice</h3>
            <p className="meta">The name and first words every visitor meets.</p>
          </div>
        </div>
        <div className="panel-body">
          <div className="set-row">
            <div>
              <h4>Assistant name</h4>
              <p className="meta">Shown in the widget header and every signature.</p>
            </div>
            <div style={{ maxWidth: 300 }}>
              <input className="field" defaultValue={PRODUCT.name} />
            </div>
          </div>

          <div className="set-row">
            <div>
              <h4>Opening line</h4>
              <p className="meta">Under two sentences — long greetings get skipped.</p>
            </div>
            <div>
              <textarea
                className="field"
                rows={3}
                key={brand.id}
                defaultValue={`${brand.assistant.greeting} ${brand.assistant.offer}`}
              />
            </div>
          </div>

          <div className="set-row">
            <div>
              <h4>Tone</h4>
              <p className="meta">Applies to every generated reply and to Saint Copy.</p>
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {TONES.map((t) => (
                <button
                  key={t.id}
                  className={cx('tone', tone === t.id && 'on')}
                  onClick={() => setTone(t.id)}
                >
                  <b>{t.name}</b>
                  <span>{t.note}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Automations</h3>
            <p className="meta">Each rule watches for one thing and acts on its own.</p>
          </div>
          <div className="panel-acts">
            <button className="btn btn-sm btn-ghost">
              <Icon name="plus" size={13} />
              New rule
            </button>
          </div>
        </div>
        <div className="panel-body flush">
          {autos.map((a) => (
            <div className="auto-row" key={a.id}>
              <span className="auto-icon">
                <Icon name="route" size={16} />
              </span>
              <div className="auto-main">
                <div className="auto-name">{a.name}</div>
                <div className="auto-flow">
                  <b>When</b> {a.trigger}
                  <Icon name="arrowRight" size={12} />
                  <b>then</b> {a.action}
                </div>
              </div>
              <span className="meta" style={{ whiteSpace: 'nowrap' }}>
                {a.runs ? `${nf.format(a.runs)} runs` : 'never run'}
              </span>
              <button
                className={cx('switch', on[a.id] && 'on')}
                role="switch"
                aria-checked={!!on[a.id]}
                aria-label={`Toggle ${a.name}`}
                onClick={() => setOn((s) => ({ ...s, [a.id]: !s[a.id] }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Channels</h3>
            <p className="meta">One assistant, one memory, wherever people write from.</p>
          </div>
        </div>
        <div className="panel-body">
          {channels.map((c) => (
            <div className="chan-row" key={c.id}>
              <span className="chan-icon">
                <Icon name={CHAN_ICON[c.id]} size={16} />
              </span>
              <div className="chan-main">
                <b>{c.name}</b>
                <span className="meta">
                  {c.id === 'web'
                    ? `${brand.name.toLowerCase()}.co.uk`
                    : c.id === 'whatsapp'
                      ? brand.phone
                      : c.id === 'instagram'
                        ? `@${brand.name.toLowerCase().replace(/[^a-z]/g, '')}`
                        : c.volume
                          ? 'Shortcode 60412'
                          : 'Not connected'}
                </span>
              </div>
              {c.volume > 0 && <span className="pill pill-neutral">{c.volume}% of volume</span>}
              <button
                className={cx('switch', chan[c.id] && 'on')}
                role="switch"
                aria-checked={!!chan[c.id]}
                aria-label={`Toggle ${c.name}`}
                onClick={() => setChan((s) => ({ ...s, [c.id]: !s[c.id] }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Handover</h3>
            <p className="meta">When Saint should stop and fetch a person.</p>
          </div>
        </div>
        <div className="panel-body">
          <div className="set-row">
            <div>
              <h4>Escalate on</h4>
              <p className="meta">Any one of these ends the automated reply.</p>
            </div>
            <div className="tags">
              {ESCALATE[brand.id].map((t) => (
                <span className="pill pill-accent" key={t}>
                  <Icon name="check" size={11} />
                  {t}
                </span>
              ))}
              <button className="pill pill-neutral">
                <Icon name="plus" size={11} />
                Add rule
              </button>
            </div>
          </div>

          <div className="set-row">
            <div>
              <h4>Goes to</h4>
              <p className="meta">First responder for anything Saint hands over.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, maxWidth: 340 }}>
              <span
                className="monogram"
                style={{
                  width: 34,
                  height: 34,
                  fontSize: 13,
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  background: 'var(--spot-soft)',
                  color: 'var(--spot)',
                  border: '1px solid var(--spot-line)',
                }}
              >
                {brand.assistant.human
                  .split(' ')
                  .map((w) => w[0])
                  .join('')}
              </span>
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{brand.assistant.human}</div>
                <div className="meta" style={{ fontSize: 11 }}>
                  {brand.assistant.humanRole}
                </div>
              </div>
              <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }}>
                Change
              </button>
            </div>
          </div>

          <div className="set-row">
            <div>
              <h4>Out of hours</h4>
              <p className="meta">Nobody is at the desk overnight.</p>
            </div>
            <div className="note">
              Keep answering and taking {brand.vertical === 'restaurant' ? 'orders' : 'bookings'},
              collect a callback number, and flag anything urgent to{' '}
              {brand.assistant.human.split(' ')[0]} first thing.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost">Discard</button>
        <button className="btn btn-primary">
          <Icon name="check" size={15} />
          Save changes
        </button>
      </div>
    </div>
  );
}
