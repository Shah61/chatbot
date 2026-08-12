import { Icon, type IconName } from '../Icon';
import { AreaChart, BarList, ChartLegend, Donut, Sparkline } from '../charts/Charts';
import {
  activityFor,
  digestFor,
  channelSplit,
  conversationsFor,
  metricsFor,
  series14,
  topIntentsFor,
  transactionsFor,
} from '../../lib/activity';
import { useStore } from '../../lib/store';
import { cx, initialsOf, money, nf } from '../../lib/utils';

const STATUS_PILL: Record<string, string> = {
  confirmed: 'pill-positive',
  preparing: 'pill-info',
  pending: 'pill-warning',
  completed: 'pill-neutral',
  cancelled: 'pill-danger',
};

export function Overview() {
  const { brand, setPage } = useStore();
  const m = metricsFor(brand);
  const s = series14[brand.id];
  const convos = conversationsFor(brand);
  const rows = transactionsFor(brand).filter((t) => t.source === 'Saint').slice(0, 5);
  const live = convos.filter((c) => c.status === 'open');

  const tiles: {
    label: string;
    value: string;
    unit?: string;
    delta: number;
    icon: IconName;
    trend: number[];
    color: string;
    note: string;
  }[] = [
    {
      label: 'Conversations',
      value: nf.format(m.convos),
      delta: 18.4,
      icon: 'chat',
      trend: s.map((d) => d[0]),
      color: 'var(--accent)',
      note: 'against the previous fortnight',
    },
    {
      label: m.doneLabel,
      value: nf.format(m.done),
      delta: 24.1,
      icon: brand.vertical === 'restaurant' ? 'bag' : 'calendar',
      trend: s.map((d) => d[1]),
      color: 'var(--spot)',
      note: `${money(m.value, brand.currency)} of value`,
    },
    {
      label: 'Handled without staff',
      value: String(m.resolution),
      unit: '%',
      delta: 5.2,
      icon: 'checkCircle',
      trend: [78, 80, 79, 83, 82, 85, 84, 86, 85, 88, 87, 89, 86, m.resolution],
      color: 'var(--accent)',
      note: '167 hours of desk time back',
    },
    {
      label: 'Median first reply',
      value: String(m.reply),
      unit: 's',
      delta: -32,
      icon: 'bolt',
      trend: [3.1, 2.8, 2.9, 2.4, 2.2, 2.3, 1.9, 1.8, 1.9, 1.6, 1.5, 1.6, 1.4, 1.4],
      color: 'var(--info)',
      note: 'day or night, every channel',
    },
  ];

  const digest = digestFor(brand);

  return (
    <div className="stack">
      {/* An AI layer over the numbers, not instead of them — every line is
          computed from the panels below, and jumps to where you can check it. */}
      <section className="digest">
        <div className="digest-head">
          <span className="digest-mark">
            <Icon name="sparkle" size={14} />
          </span>
          <div>
            <div className="eyebrow">Saint’s read · last 14 days</div>
            <h2>{digest.headline}</h2>
          </div>
          <span className="pill pill-neutral digest-live">
            <span className="dot" style={{ color: 'var(--positive)' }} />
            Live
          </span>
        </div>
        <div className="digest-rows">
          {digest.insights.map((it) => (
            <button key={it.text} className="digest-row" onClick={() => setPage(it.jump)}>
              <Icon name={it.icon} size={14} className="digest-ico" />
              <span className="digest-text">{it.text}</span>
              <span className="digest-cta">
                {it.cta}
                <Icon name="arrowRight" size={13} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid g4 stagger">
        {tiles.map((t) => {
          const up = t.delta >= 0;
          const good = t.label.includes('reply') ? !up : up;
          return (
            <div className="panel stat" key={t.label}>
              <Icon name={t.icon} size={92} strokeWidth={0.9} className="stat-ghost" />
              <div className="stat-label">
                <Icon name={t.icon} size={14} style={{ color: 'var(--ink-3)' }} />
                <span className="eyebrow">{t.label}</span>
              </div>
              <div className="stat-value">
                <span className="numeral">{t.value}</span>
                {t.unit && <span className="unit">{t.unit}</span>}
              </div>
              <div className="stat-foot">
                <div>
                  <span className={cx('delta', good ? 'up' : 'down')}>
                    <Icon name={up ? 'trendUp' : 'trendDown'} size={13} />
                    {up ? '+' : ''}
                    {t.delta}%
                  </span>
                  <div className="meta" style={{ fontSize: 10.5, marginTop: 5 }}>
                    {t.note}
                  </div>
                </div>
                <Sparkline values={t.trend} color={t.color} className="stat-spark" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gsplit">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Volume &amp; conversion</h3>
              <p className="meta">Every conversation, and the share that ended in money.</p>
            </div>
            <ChartLegend />
          </div>
          <div className="panel-body">
            <AreaChart data={s} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>What people ask</h3>
              <p className="meta">Top intents, last 14 days</p>
            </div>
          </div>
          <div className="panel-body">
            <BarList items={topIntentsFor(brand)} />
          </div>
        </div>
      </div>

      <div className="grid gsplit">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Closed by Saint</h3>
              <p className="meta">No staff touched any of these.</p>
            </div>
            <div className="panel-acts">
              <button className="btn btn-sm btn-ghost">
                <Icon name="download" size={13} />
                Export
              </button>
            </div>
          </div>
          <div className="panel-body flush">
            <div className="table-scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Detail</th>
                    <th>When</th>
                    <th className="right">Value</th>
                    <th className="right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className="who">
                          <span className="monogram">{r.initials}</span>
                          <b>{r.customer}</b>
                        </span>
                      </td>
                      <td className="clip">{r.detail}</td>
                      <td className="num">{r.when}</td>
                      <td className="right num">{money(r.total, brand.currency)}</td>
                      <td className="right">
                        <span className={cx('pill', STATUS_PILL[r.status])}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Where they arrive</h3>
                <p className="meta">Share of conversations</p>
              </div>
            </div>
            <div className="panel-body">
              <Donut segments={channelSplit} centre="4" caption="channels" />
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Live now</h3>
                <p className="meta">{live.length} open</p>
              </div>
              <span className="pill pill-positive">
                <span className="dot" />
                Active
              </span>
            </div>
            <div className="panel-body" style={{ paddingTop: 0 }}>
              {live.map((c) => (
                <div className="live-row" key={c.id}>
                  <span className="monogram">{c.initials}</span>
                  <div className="live-main">
                    <b>{c.contact}</b>
                    <div className="meta">{c.intent}</div>
                  </div>
                  <span className="meta">{c.at}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Activity</h3>
              </div>
            </div>
            <div className="panel-body" style={{ paddingTop: 0 }}>
              {activityFor(brand).map((a) => (
                <div className="live-row" key={a.what}>
                  <span className="monogram">{initialsOf(a.who)}</span>
                  <div className="live-main">
                    <b>{a.who}</b> {a.what}
                    <div className="meta">{a.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
