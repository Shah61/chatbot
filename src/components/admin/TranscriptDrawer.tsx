import { useEffect } from 'react';
import { Icon, type IconName } from '../Icon';
import { transcriptFor } from '../../lib/activity';
import { useStore } from '../../lib/store';
import type { ChannelId, ChatlogEntry } from '../../lib/types';
import { cx, nf } from '../../lib/utils';

/* ==========================================================================
   Transcript

   A log row says a call went wrong. This says what the visitor actually saw.
   The turn the row is about is marked; everything above it is the context
   the model was answering into, which is usually where the fault is.
   ========================================================================== */

const CHANNEL: Record<ChannelId, IconName> = {
  web: 'globe',
  whatsapp: 'whatsapp',
  instagram: 'instagram',
  sms: 'sms',
};

const usd = (n: number) => (n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(3)}`);

export function TranscriptDrawer({
  entry,
  pill,
  icon,
  flagged,
  onClose,
}: {
  entry: ChatlogEntry;
  pill: string;
  icon: IconName;
  flagged: boolean;
  onClose: () => void;
}) {
  const { brand } = useStore();
  const turns = transcriptFor(entry, brand);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const spent = [
    { k: 'Model', v: entry.model },
    { k: 'Intent', v: entry.intent },
    { k: 'Prompt', v: `${nf.format(entry.tokensIn)} tokens` },
    { k: 'Of which cached', v: `${nf.format(entry.cached)} · billed at 10%` },
    { k: 'Completion', v: `${nf.format(entry.tokensOut)} tokens` },
    { k: 'Latency', v: `${entry.latency}s` },
    { k: 'Cost', v: usd(entry.cost) },
  ];

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside
        className="drawer drawer-wide"
        role="dialog"
        aria-label={`Transcript with ${entry.conversation}`}
      >
        <header className="drawer-head">
          <span className="monogram">{entry.initials}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{entry.conversation}</h2>
            <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name={CHANNEL[entry.channel]} size={12} />
              {entry.channel === 'web' ? 'Website widget' : entry.channel} · {entry.at}
            </div>
          </div>
          <span className={cx('pill', pill)}>
            <Icon name={icon} size={10} />
            {entry.outcome}
          </span>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={16} />
          </button>
        </header>

        <div className="drawer-body scroll-area">
          {flagged && entry.note && (
            <div className="tr-fault">
              <Icon name={icon} size={15} />
              <span>
                <b>{entry.outcome}</b>
                {entry.note}
              </span>
            </div>
          )}

          <section className="tr-thread">
            {turns.map((t, i) =>
              t.tool ? (
                <div className={cx('tr-tool', !t.tool.ok && 'failed')} key={i}>
                  <div className="tr-tool-head">
                    <Icon name={t.tool.ok ? 'bolt' : 'alert'} size={12} />
                    <b>{t.tool.name}</b>
                    <span className="tr-tool-ms">{nf.format(t.tool.ms)}ms</span>
                  </div>
                  <code>{t.tool.args}</code>
                  <code className="tr-tool-out">{t.tool.result}</code>
                </div>
              ) : t.role === 'system' ? (
                <div className={cx('tr-sys', t.focus && 'focus')} key={i}>
                  <Icon name={t.focus ? icon : 'shield'} size={12} />
                  {t.text}
                </div>
              ) : (
                <div className={cx('tr-turn', t.role === 'user' && 'is-user')} key={i}>
                  <span className="monogram tr-face">
                    {t.role === 'user' ? entry.initials.charAt(0) : 'S'}
                  </span>
                  <div className={cx('tr-bubble', t.focus && 'focus')}>
                    {t.text}
                    {t.focus && <span className="tr-mark">this call</span>}
                  </div>
                </div>
              ),
            )}
          </section>

          <section className="fieldset">
            <div className="eyebrow">
              <Icon name="layers" size={12} />
              What this call cost
            </div>
            <div className="rail-rows">
              {spent.map((r) => (
                <div className="rail-row" key={r.k}>
                  <span className="k">{r.k}</span>
                  <span className="v">{r.v}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="drawer-foot">
          {flagged && (
            <button className="btn btn-sm btn-primary">
              <Icon name="book" size={13} />
              Add to knowledge
            </button>
          )}
          <button className="btn btn-sm btn-ghost">
            <Icon name="users" size={13} />
            Hand to a person
          </button>
          <button className="btn btn-sm btn-quiet" style={{ marginLeft: 'auto' }} onClick={onClose}>
            Close
          </button>
        </footer>
      </aside>
    </>
  );
}
