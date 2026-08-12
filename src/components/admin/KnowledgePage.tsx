import { Icon } from '../Icon';
import { useStore } from '../../lib/store';
import { cx } from '../../lib/utils';

const PILL: Record<string, string> = {
  live: 'pill-positive',
  draft: 'pill-neutral',
  review: 'pill-warning',
};

const GAPS: Record<string, { q: string; asked: number }[]> = {
  lumiere: [
    { q: 'Do you have high chairs?', asked: 41 },
    { q: 'Can I order the wine list for delivery only?', asked: 22 },
    { q: 'Is the tasting menu available on Sundays?', asked: 14 },
  ],
  aurelia: [
    { q: 'Do you offer virtual consultations?', asked: 34 },
    { q: 'Can I bring a child to my appointment?', asked: 19 },
    { q: 'Do you write travel prescriptions?', asked: 12 },
  ],
  solene: [
    { q: 'Do you do wedding hair on location?', asked: 37 },
    { q: 'Can I book two people side by side?', asked: 21 },
    { q: 'Do you have parking for clients?', asked: 11 },
  ],
};

export function KnowledgePage() {
  const { brand, updateFaq } = useStore();
  const live = brand.faq.filter((f) => f.status === 'live').length;
  const gaps = GAPS[brand.id];

  return (
    <div className="stack">
      <div className="grid gsplit">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Coverage</h3>
              <p className="meta">How often Saint found an answer it was confident enough to give.</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="grid g3" style={{ gap: 18 }}>
              <div>
                <div className="numeral" style={{ fontSize: 44 }}>
                  94<span style={{ fontSize: 22, color: 'var(--ink-3)' }}>%</span>
                </div>
                <div className="eyebrow" style={{ marginTop: 6 }}>
                  Answered
                </div>
              </div>
              <div>
                <div className="numeral" style={{ fontSize: 44 }}>
                  {live}
                </div>
                <div className="eyebrow" style={{ marginTop: 6 }}>
                  Live answers
                </div>
              </div>
              <div>
                <div className="numeral" style={{ fontSize: 44 }}>
                  {gaps.reduce((n, g) => n + g.asked, 0)}
                </div>
                <div className="eyebrow" style={{ marginTop: 6 }}>
                  Unanswered asks
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Gaps worth filling</h3>
              <p className="meta">Asked, not answered</p>
            </div>
          </div>
          <div className="panel-body" style={{ paddingTop: 0 }}>
            {gaps.map((g) => (
              <div className="live-row" key={g.q}>
                <span
                  className="monogram"
                  style={{
                    background: 'var(--warning-soft)',
                    color: 'var(--warning)',
                    border: '1px solid var(--line)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 16,
                  }}
                >
                  ?
                </span>
                <div className="live-main">
                  <b>{g.q}</b>
                  <div className="meta">asked {g.asked} times</div>
                </div>
                <button className="btn btn-sm btn-ghost">
                  <Icon name="wand" size={13} />
                  Draft
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Answers</h3>
            <p className="meta">
              Saint quotes these verbatim and shows the source, so nothing is invented.
            </p>
          </div>
          <div className="panel-acts">
            <button className="btn btn-sm btn-primary">
              <Icon name="plus" size={14} />
              New answer
            </button>
          </div>
        </div>
        <div className="panel-body">
          <div className="kb-grid">
            {brand.faq.map((f) => (
              <div className="panel kb-card" key={f.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="eyebrow">{f.category}</span>
                  <span className={cx('pill', PILL[f.status])} style={{ marginLeft: 'auto' }}>
                    {f.status}
                  </span>
                </div>

                <div className="kb-q">{f.q}</div>
                <p className="kb-a">{f.a}</p>

                <div className="kb-foot">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Icon name="chat" size={12} />
                    {f.uses}
                  </span>
                  <span>{f.updated}</span>
                  <span className="conf" title={`${f.confidence}% confidence`}>
                    <span className="conf-track">
                      <span
                        className="conf-fill"
                        style={{
                          width: `${f.confidence}%`,
                          background:
                            f.confidence > 90
                              ? 'var(--positive)'
                              : f.confidence > 80
                                ? 'var(--spot)'
                                : 'var(--warning)',
                        }}
                      />
                    </span>
                    {f.confidence}%
                  </span>
                  <button
                    className={cx('switch', f.status === 'live' && 'on')}
                    role="switch"
                    aria-checked={f.status === 'live'}
                    aria-label={`${f.q} live`}
                    onClick={() =>
                      updateFaq(f.id, { status: f.status === 'live' ? 'draft' : 'live' })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
