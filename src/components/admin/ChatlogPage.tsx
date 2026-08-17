import { useMemo, useState } from 'react';
import { Icon, type IconName } from '../Icon';
import { Sparkline } from '../charts/Charts';
import { TranscriptDrawer } from './TranscriptDrawer';
import { FLAGGED, aiSpendFor, chatlogFor, isFlagged, modelMixFor } from '../../lib/activity';
import { useStore } from '../../lib/store';
import type { ChannelId, TurnOutcome } from '../../lib/types';
import { cx, nf } from '../../lib/utils';

/* ==========================================================================
   Chatlog

   The AI bill, itemised, and the rows that did not go well. An owner opens
   this for one of two reasons: to find out what the assistant is costing, or
   because a customer told them it said something daft. Both answers are on
   this page, and the second one is the reason the successful rows are the
   quietest thing on it.
   ========================================================================== */

const PILL: Record<TurnOutcome, string> = {
  answered: 'pill-neutral',
  booked: 'pill-positive',
  escalated: 'pill-info',
  'low confidence': 'pill-warning',
  'bad answer': 'pill-danger',
  'wrong info': 'pill-danger',
  refused: 'pill-warning',
  'cut off': 'pill-warning',
  'tool error': 'pill-danger',
  timeout: 'pill-danger',
  'rate limited': 'pill-warning',
  error: 'pill-danger',
};

const OUTCOME_ICON: Record<TurnOutcome, IconName> = {
  answered: 'check',
  booked: 'checkCircle',
  escalated: 'users',
  'low confidence': 'alert',
  'bad answer': 'alert',
  'wrong info': 'alert',
  refused: 'lock',
  'cut off': 'sliders',
  'tool error': 'bolt',
  timeout: 'clock',
  'rate limited': 'pause',
  error: 'alert',
};

const CHANNEL: Record<ChannelId, IconName> = {
  web: 'globe',
  whatsapp: 'whatsapp',
  instagram: 'instagram',
  sms: 'sms',
};

const usd = (n: number) => (n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(3)}`);

/** 12,400 → 12.4k. A token count is an order of magnitude, not an amount. */
const tok = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(1)}k` : nf.format(n));

type Filter = 'all' | 'flagged' | TurnOutcome;

export function ChatlogPage() {
  const { brand } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<string | null>(null);
  const [reading, setReading] = useState<string | null>(null);

  const log = useMemo(() => chatlogFor(brand), [brand]);
  const bill = useMemo(() => aiSpendFor(brand), [brand]);
  const models = useMemo(() => modelMixFor(brand), [brand]);

  const rows = log.filter((e) =>
    filter === 'all' ? true : filter === 'flagged' ? isFlagged(e.outcome) : e.outcome === filter,
  );

  const tokensIn = log.reduce((n, e) => n + e.tokensIn, 0);
  const tokensOut = log.reduce((n, e) => n + e.tokensOut, 0);
  const cached = log.reduce((n, e) => n + e.cached, 0);
  const flagged = log.filter((e) => isFlagged(e.outcome));
  const clean = Math.round(((log.length - flagged.length) / log.length) * 100);

  /* What the prompt cache is worth: cached tokens bill at a tenth, so nine
     tenths of them are the saving. Sonnet's input rate covers the bulk. */
  const saved = log.reduce((n, e) => n + (e.cached * 0.9 * 3) / 1e6, 0);

  const tiles = [
    {
      icon: 'sparkle' as IconName,
      label: 'Spend · last 14 days',
      value: `$${bill.fortnight.toFixed(2)}`,
      note: `${usd(bill.today)} today across ${nf.format(bill.callsToday)} calls`,
      trend: bill.series,
      color: 'var(--accent)',
    },
    {
      icon: 'chat' as IconName,
      label: 'Cost per call',
      value: usd(bill.mean),
      note: `${usd(saved)} saved on this sample by prompt caching`,
      trend: log.slice(0, 14).map((e) => e.cost * 1000),
      color: 'var(--spot)',
    },
    {
      icon: 'layers' as IconName,
      label: `Tokens · last ${log.length} calls`,
      value: tok(tokensIn + tokensOut),
      note: `${tok(tokensIn)} in · ${tok(tokensOut)} out · ${Math.round((cached / tokensIn) * 100)}% cached`,
      trend: log.slice(0, 14).map((e) => e.tokensIn + e.tokensOut),
      color: 'var(--info)',
    },
    {
      icon: 'shield' as IconName,
      label: 'Clean answers',
      value: `${clean}%`,
      note: `${flagged.length} of ${log.length} need a look`,
      trend: [88, 91, 87, 92, 90, 94, 89, 93, 91, 95, 92, 90, 94, clean],
      color: 'var(--positive)',
    },
  ];

  /* Only the kinds that actually occurred, worst first — an empty filter chip
     is a dead end, and the ranking is the triage order. */
  const breakdown = FLAGGED.map((o) => ({
    outcome: o,
    count: log.filter((e) => e.outcome === o).length,
  })).filter((x) => x.count > 0);

  const worst = [...breakdown].sort((a, b) => b.count - a.count);
  const peak = Math.max(...bill.series);
  const read = log.find((e) => e.id === reading);

  return (
    <div className="stack">
      <div className="grid g4 stagger">
        {tiles.map((t) => (
          <div className="panel stat" key={t.label}>
            <Icon name={t.icon} size={88} strokeWidth={0.9} className="stat-ghost" />
            <div className="stat-label">
              <Icon name={t.icon} size={14} style={{ color: 'var(--ink-3)' }} />
              <span className="eyebrow">{t.label}</span>
            </div>
            <div className="stat-value">
              <span className="numeral">{t.value}</span>
            </div>
            <div className="stat-foot">
              <span className="meta" style={{ fontSize: 10.5 }}>
                {t.note}
              </span>
              <Sparkline values={t.trend} color={t.color} className="stat-spark" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gsplit">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>What it cost</h3>
              <p className="meta">
                Daily spend in USD. The bill tracks conversation volume, not headcount.
              </p>
            </div>
            <span className="pill pill-accent">Peak ${peak.toFixed(2)}</span>
          </div>
          <div className="panel-body">
            <div className="hours-bars">
              {bill.series.map((v, i) => (
                <div
                  key={i}
                  className={cx('hour', v > peak * 0.85 && 'peak')}
                  style={{ height: `${(v / peak) * 100}%`, animationDelay: `${i * 22}ms` }}
                  title={`$${v.toFixed(2)}`}
                />
              ))}
            </div>
            <div className="hours-axis">
              <span>14 days ago</span>
              <span>7 days</span>
              <span>Today</span>
            </div>

            <div className="ai-models">
              {models.map((m) => (
                <div className="ai-model" key={m.name}>
                  <span className="ai-model-name">
                    <b>{m.name}</b>
                    <span className="meta">{m.rate}</span>
                  </span>
                  <span className="ai-model-num tnum">{m.calls} calls</span>
                  <span className="ai-model-num tnum">{tok(m.tokens)}</span>
                  <span className="ai-model-cost price">{usd(m.cost)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Needs a look</h3>
              <p className="meta">Everything that did not simply work. Pick one to filter the log.</p>
            </div>
            <span className={cx('pill', flagged.length ? 'pill-warning' : 'pill-positive')}>
              {flagged.length}
            </span>
          </div>
          <div className="panel-body">
            <div className="fault-list">
              {worst.map((f) => (
                <button
                  key={f.outcome}
                  className={cx('fault', filter === f.outcome && 'on')}
                  onClick={() => setFilter(filter === f.outcome ? 'all' : f.outcome)}
                >
                  <span className={cx('fault-mark', PILL[f.outcome])}>
                    <Icon name={OUTCOME_ICON[f.outcome]} size={13} />
                  </span>
                  <span className="fault-text">
                    <b>{f.outcome}</b>
                    <span className="meta">{FAULT_BLURB[f.outcome]}</span>
                  </span>
                  <span className="fault-count numeral">{f.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>The last {log.length} calls</h3>
            <p className="meta">
              Showing {rows.length} · {usd(rows.reduce((n, e) => n + e.cost, 0))} ·{' '}
              {tok(rows.reduce((n, e) => n + e.tokensIn + e.tokensOut, 0))} tokens
            </p>
          </div>
          <div className="panel-acts">
            <button className={cx('chip', filter === 'all' && 'on')} onClick={() => setFilter('all')}>
              All
            </button>
            <button
              className={cx('chip', filter === 'flagged' && 'on')}
              onClick={() => setFilter('flagged')}
            >
              Flagged
              <span className="chip-count">{flagged.length}</span>
            </button>
            {breakdown.map((f) => (
              <button
                key={f.outcome}
                className={cx('chip log-kind', filter === f.outcome && 'on')}
                onClick={() => setFilter(f.outcome)}
              >
                {f.outcome}
              </button>
            ))}
          </div>
        </div>
        <div className="panel-body flush">
          <div className="table-scroll">
            <table className="tbl log-tbl calls-tbl">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Conversation</th>
                  <th>Asked</th>
                  <th>Model</th>
                  <th className="right">In</th>
                  <th className="right">Out</th>
                  <th className="right">Cost</th>
                  <th className="right">Took</th>
                  <th className="right">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const bad = isFlagged(e.outcome);
                  const shown = open === e.id;
                  return [
                    <tr
                      key={e.id}
                      className={cx('log-row', bad && 'is-flagged', shown && 'is-open')}
                      onClick={() => setOpen(shown ? null : e.id)}
                    >
                      <td className="num">{e.at}</td>
                      <td>
                        <span className="who">
                          <span className="monogram">{e.initials}</span>
                          <b>{e.conversation}</b>
                          <Icon
                            name={CHANNEL[e.channel]}
                            size={12}
                            style={{ color: 'var(--ink-4)' }}
                          />
                        </span>
                      </td>
                      <td>
                        <span className="log-ask">{e.prompt}</span>
                      </td>
                      <td className="meta log-model">{e.model}</td>
                      <td className="right num">
                        {tok(e.tokensIn)}
                        {e.cached > 0 && <span className="cached">·{Math.round((e.cached / e.tokensIn) * 100)}%</span>}
                      </td>
                      <td className="right num">{tok(e.tokensOut)}</td>
                      <td className="right num">{usd(e.cost)}</td>
                      <td className="right num">{e.latency}s</td>
                      <td className="right">
                        <span className={cx('pill', PILL[e.outcome])}>
                          <Icon name={OUTCOME_ICON[e.outcome]} size={10} />
                          {e.outcome}
                        </span>
                      </td>
                    </tr>,
                    shown && (
                      <tr key={`${e.id}-why`} className="log-why">
                        <td colSpan={9}>
                          <div className="why">
                            <div className="why-top">
                              <span className="why-q">
                                <Icon name="chat" size={13} />“{e.prompt}”
                              </span>
                              {e.note && (
                                <span className="why-note">
                                  <Icon name={OUTCOME_ICON[e.outcome]} size={13} />
                                  {e.note}
                                </span>
                              )}
                            </div>
                            <div className="why-foot">
                              <span className="why-meta">
                                {e.intent} · {nf.format(e.tokensIn)} in ({nf.format(e.cached)} cached)
                                · {nf.format(e.tokensOut)} out · {usd(e.cost)} · {e.latency}s
                              </span>
                              <span className="why-acts">
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    setReading(e.id);
                                  }}
                                >
                                  <Icon name="inbox" size={13} />
                                  Open transcript
                                </button>
                                {bad && (
                                  <button className="btn btn-ghost btn-sm">
                                    <Icon name="book" size={13} />
                                    Add to knowledge
                                  </button>
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
            {!rows.length && (
              <div className="log-empty">
                <Icon name="checkCircle" size={22} />
                Nothing under that filter — which is the good outcome.
              </div>
            )}
          </div>
        </div>
      </div>

      {read && (
        <TranscriptDrawer
          entry={read}
          pill={PILL[read.outcome]}
          icon={OUTCOME_ICON[read.outcome]}
          flagged={isFlagged(read.outcome)}
          onClose={() => setReading(null)}
        />
      )}
    </div>
  );
}

/** One line each, in the owner's language rather than the engineer's. */
const FAULT_BLURB: Record<TurnOutcome, string> = {
  answered: '',
  booked: '',
  escalated: 'Passed to a person, as asked',
  'low confidence': 'Answered with nothing solid behind it',
  'bad answer': 'The visitor said so',
  'wrong info': 'Contradicted the catalog',
  refused: 'Declined something it knows',
  'cut off': 'Ran out of room mid-sentence',
  'tool error': 'A booking call failed',
  timeout: 'No reply inside thirty seconds',
  'rate limited': 'Throttled by the provider',
  error: 'The provider fell over',
};
