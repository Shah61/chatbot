import { useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '../Icon';
import { MessageRow } from '../chat/MessageRow';
import { conversationsFor } from '../../lib/activity';
import { useLive } from '../../lib/live';
import { useStore } from '../../lib/store';
import type { ChannelId, ConvStatus } from '../../lib/types';
import { cx, money } from '../../lib/utils';
import '../chat/chat.css';

const CHANNEL: Record<ChannelId, IconName> = {
  web: 'globe',
  whatsapp: 'whatsapp',
  instagram: 'instagram',
  sms: 'sms',
};

const STATUS: Record<ConvStatus, string> = {
  open: 'pill-info',
  resolved: 'pill-positive',
  escalated: 'pill-warning',
};

const FILTERS = ['All', 'Open', 'Escalated', 'Resolved'] as const;

/** The conversation happening right now in the Storefront tab. */
const LIVE_ID = '__live';

export function Inbox() {
  const { brand } = useStore();
  const live = useLive();
  const all = conversationsFor(brand);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [selected, setSelected] = useState<string | undefined>(all[0]?.id);

  useEffect(() => setSelected(all[0]?.id), [brand.id]);

  /* A visitor asking for a person should pull focus, the way a ringing
     phone does. */
  const hasLive = live.status !== 'off';
  useEffect(() => {
    if (live.status === 'waiting') setSelected(LIVE_ID);
  }, [live.status]);

  const visible = all.filter((c) => (filter === 'All' ? true : c.status === filter.toLowerCase()));
  const isLive = selected === LIVE_ID && hasLive;
  const conv = isLive ? null : (all.find((c) => c.id === selected) ?? visible[0]);

  useEffect(() => {
    if (isLive) live.clearAgentUnread();
  }, [isLive, live.messages.length]);

  return (
    <div className="inbox">
      <div className="inbox-list">
        <div className="inbox-filters">
          {FILTERS.map((f) => (
            <button key={f} className={cx('chip', filter === f && 'on')} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
          <button
            className={cx('chip presence', live.agentOnline && 'up')}
            onClick={() => live.setAgentOnline(!live.agentOnline)}
            title="Your availability for handovers"
            style={{ marginLeft: 'auto' }}
          >
            <span className="dot" />
            {live.agentOnline ? 'Available' : 'Away'}
          </button>
        </div>

        <div className="conv-scroll scroll-area">
          {hasLive && (
            <button
              className={cx('conv is-live-row', isLive && 'on')}
              onClick={() => setSelected(LIVE_ID)}
            >
              <span className="monogram">You</span>
              <span className="conv-main">
                <span className="conv-l1">
                  <Icon name="globe" size={12} style={{ color: 'var(--ink-4)' }} />
                  <span className="conv-name">Visitor · this browser</span>
                  <span className="conv-time">
                    {live.status === 'waiting' ? 'waiting' : 'live'}
                  </span>
                </span>
                <span className="conv-intent">
                  {live.status === 'waiting'
                    ? 'Asked for a person'
                    : live.status === 'active'
                      ? `With ${live.agent?.name ?? 'you'}`
                      : 'Closed'}
                </span>
                <span className="conv-prev">
                  {[...live.messages].reverse().find((m) => m.blocks.some((b) => b.kind === 'text'))
                    ?.blocks.find((b) => b.kind === 'text')?.text ?? '—'}
                </span>
              </span>
              {live.unreadForAgent > 0 && <span className="conv-badge">{live.unreadForAgent}</span>}
            </button>
          )}

          {visible.map((c) => (
            <button
              key={c.id}
              className={cx('conv', c.id === conv?.id && !isLive && 'on')}
              onClick={() => setSelected(c.id)}
            >
              <span className="monogram">{c.initials}</span>
              <span className="conv-main">
                <span className="conv-l1">
                  <Icon name={CHANNEL[c.channel]} size={12} style={{ color: 'var(--ink-4)' }} />
                  <span className="conv-name">{c.contact}</span>
                  <span className="conv-time">{c.at}</span>
                </span>
                <span className="conv-intent">{c.intent}</span>
                <span className="conv-prev">{c.preview}</span>
              </span>
              {c.unread > 0 && <span className="conv-badge">{c.unread}</span>}
            </button>
          ))}
        </div>
      </div>

      {isLive ? <LiveThread /> : conv ? <ArchivedThread conv={conv} /> : null}

      {isLive ? (
        <LiveRail />
      ) : conv ? (
        <aside className="rail scroll-area">
          <div className="rail-sec">
            <div className="eyebrow">Contact</div>
            <div className="rail-rows">
              {conv.meta.map((m) => (
                <div className="rail-row" key={m.label}>
                  <span className="k">{m.label}</span>
                  <span className="v">{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rail-sec">
            <div className="eyebrow">Signals</div>
            <div className="rail-rows">
              <div className="rail-row">
                <span className="k">Sentiment</span>
                <span className="v">
                  <span
                    className={cx(
                      'pill',
                      conv.sentiment === 'positive'
                        ? 'pill-positive'
                        : conv.sentiment === 'negative'
                          ? 'pill-danger'
                          : 'pill-neutral',
                    )}
                  >
                    {conv.sentiment}
                  </span>
                </span>
              </div>
              <div className="rail-row">
                <span className="k">Outcome</span>
                <span className="v">
                  <span className="pill pill-accent">{conv.outcome}</span>
                </span>
              </div>
              {conv.value ? (
                <div className="rail-row">
                  <span className="k">Value</span>
                  <span className="v">{money(conv.value, brand.currency)}</span>
                </div>
              ) : null}
              <div className="rail-row">
                <span className="k">Handled by</span>
                <span className="v">
                  {conv.status === 'escalated' ? brand.assistant.human : 'Saint'}
                </span>
              </div>
            </div>
          </div>

          <div className="rail-sec">
            <div className="eyebrow">Tags</div>
            <div className="tags">
              {conv.tags.map((t) => (
                <span className="pill pill-neutral" key={t}>
                  {t}
                </span>
              ))}
              <button className="pill pill-neutral" style={{ color: 'var(--ink-3)' }}>
                <Icon name="plus" size={11} />
                Add
              </button>
            </div>
          </div>

          <div className="rail-sec">
            <div className="note">
              <div className="eyebrow">
                <Icon name="sparkle" size={11} />
                Summary
              </div>
              {conv.messages.length} messages. {conv.contact.split(' ')[0]} came in about{' '}
              {conv.intent.toLowerCase()} and{' '}
              {conv.outcome === 'handed off'
                ? 'was passed to a person inside ninety seconds.'
                : `left ${conv.outcome}.`}
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}

/* ---------------- the conversation happening right now ---------------- */

function LiveThread() {
const { brand, scheme } = useStore();
const live = useLive();
const [draft, setDraft] = useState('');
const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [live.messages.length, live.visitorTyping]);

  const send = () => {
    const text = draft.trim();
    if (!text || live.status !== 'active') return;
    live.agentSay(text);
    setDraft('');
  };

  return (
    <div className="thread">
      <div className="thread-head">
        <span className="monogram" style={{ background: 'var(--spot-soft)', color: 'var(--spot)', borderColor: 'var(--spot-line)' }}>
          V
        </span>
        <div className="thread-title">
          <h2>Visitor · this browser</h2>
          <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icon name="globe" size={12} />
            Website widget
            <span style={{ color: 'var(--line-strong)' }}>·</span>
            {live.messages.length} messages
          </div>
        </div>
        <span
          className={cx('pill', live.status === 'active' ? 'pill-positive' : live.status === 'waiting' ? 'pill-warning' : 'pill-neutral')}
        >
          <span className="dot" />
          {live.status === 'waiting' ? 'waiting' : live.status === 'active' ? 'live' : 'closed'}
        </span>
        {live.status === 'active' && (
          <button className="btn btn-sm btn-ghost" onClick={() => live.endChat('agent')}>
            <Icon name="check" size={13} />
            Close chat
          </button>
        )}
      </div>

      {live.status === 'waiting' && (
        <div className="ring">
          <span className="ring-dot" />
          <div className="ring-main">
            <b>Someone is asking for a person</b>
            <span>They have read Saint's answers and want a human. Their transcript is below.</span>
          </div>
          <button className="btn btn-sm btn-primary" onClick={live.acceptChat}>
            <Icon name="users" size={13} />
            Take the chat
          </button>
        </div>
      )}

      <div className="thread-body scroll-area" ref={bodyRef}>
        <div className="w-daymark" style={{ marginTop: 0 }}>
          Today
        </div>
        {live.messages.map((m, i) => (
          <MessageRow
            key={m.id}
            message={m}
            prevRole={live.messages[i - 1]?.role}
            brand={brand}
            live={false}
            dark={scheme === 'dark'}
            cart={[]}
            onAction={() => {}}
            onQty={() => {}}
            showStamp={live.messages[i + 1]?.role !== m.role}
          />
        ))}
        {live.visitorTyping && (
          <div className="msg is-user">
            <div className="typing" aria-label="Visitor is typing">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
      </div>

      <div className="reply">
        {live.status !== 'active' ? (
          <div className="reply-locked">
            <Icon name="lock" size={13} />
            {live.status === 'waiting'
              ? 'Take the chat to start replying.'
              : 'This chat is closed. Saint has it again.'}
          </div>
        ) : (
          <>
            <div className="suggest">
              <Icon name="sparkle" size={14} style={{ color: 'var(--accent)', marginTop: 2 }} />
              <div className="grow">
                <div className="eyebrow">Saint suggests</div>
                Acknowledge what they already told Saint, answer the personal part directly, and
                offer to put it in writing.
              </div>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() =>
                  setDraft(
                    `Thanks for waiting — I have read everything above, so let me pick it up from there.`,
                  )
                }
              >
                Use
              </button>
            </div>
            <div className="reply-box">
              <textarea
                rows={1}
                value={draft}
                placeholder={`Reply as ${live.agent?.name ?? 'you'}…`}
                onChange={(e) => {
                  setDraft(e.target.value);
                  live.setAgentTyping(e.target.value.trim().length > 0);
                }}
                onBlur={() => live.setAgentTyping(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <button className="icon-btn" aria-label="Attach">
                <Icon name="paperclip" size={16} />
              </button>
              <button className="btn btn-sm btn-primary" onClick={send} disabled={!draft.trim()}>
                Send
                <Icon name="send" size={13} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LiveRail() {
const { brand } = useStore();
const live = useLive();
return (
    <aside className="rail scroll-area">
      <div className="rail-sec">
        <div className="eyebrow">This visitor</div>
        <div className="rail-rows">
          <div className="rail-row">
            <span className="k">Channel</span>
            <span className="v">Website widget</span>
          </div>
          <div className="rail-row">
            <span className="k">Brand</span>
            <span className="v">{brand.legal}</span>
          </div>
          <div className="rail-row">
            <span className="k">Messages</span>
            <span className="v">{live.messages.length}</span>
          </div>
          <div className="rail-row">
            <span className="k">Status</span>
            <span className="v">
              <span
                className={cx(
                  'pill',
                  live.status === 'active' ? 'pill-positive' : live.status === 'waiting' ? 'pill-warning' : 'pill-neutral',
                )}
              >
                {live.status}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="rail-sec">
        <div className="eyebrow">Your availability</div>
        <div className="chan-row" style={{ borderBottom: 0, padding: 0 }}>
          <span className="chan-icon">
            <Icon name="users" size={16} />
          </span>
          <div className="chan-main">
            <b>{live.agentOnline ? 'Available' : 'Away'}</b>
            <span className="meta">
              {live.agentOnline
                ? 'Handovers reach you automatically'
                : 'Requests queue until you take them'}
            </span>
          </div>
          <button
            className={cx('switch', live.agentOnline && 'on')}
            role="switch"
            aria-checked={live.agentOnline}
            aria-label="Availability"
            onClick={() => live.setAgentOnline(!live.agentOnline)}
          />
        </div>
      </div>

      <div className="rail-sec">
        <div className="note">
          <div className="eyebrow">
            <Icon name="sparkle" size={11} />
            How this works
          </div>
          Open the Storefront tab and ask Saint for a person. The request lands here, and whatever
          you send goes straight back into that widget.
        </div>
      </div>
    </aside>
  );
}

/* ---------------- archived transcripts ---------------- */

function ArchivedThread({ conv }: { conv: ReturnType<typeof conversationsFor>[number] }) {
const { brand, scheme } = useStore();
return (
  <div className="thread">
    <div className="thread-head">
      <span className="monogram">{conv.initials}</span>
      <div className="thread-title">
        <h2>{conv.contact}</h2>
        <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon name={CHANNEL[conv.channel]} size={12} />
          {conv.channel === 'web' ? 'Website widget' : conv.channel}
          <span style={{ color: 'var(--line-strong)' }}>·</span>
          {conv.intent}
        </div>
      </div>
      <span className={cx('pill', STATUS[conv.status])}>
        <span className="dot" />
        {conv.status}
      </span>
      <button className="btn btn-sm btn-ghost">
        <Icon name="users" size={13} />
        Assign
      </button>
      <button className="btn btn-sm btn-primary">
        <Icon name="check" size={13} />
        Resolve
      </button>
    </div>

    <div className="thread-body scroll-area">
      <div className="w-daymark" style={{ marginTop: 0 }}>
        Today
      </div>
      {conv.messages.map((m, i) => (
        <MessageRow
          key={m.id}
          message={m}
          prevRole={conv.messages[i - 1]?.role}
          brand={brand}
          live={false}
          dark={scheme === 'dark'}
          cart={[]}
          onAction={() => {}}
          onQty={() => {}}
          showStamp={conv.messages[i + 1]?.role !== m.role}
        />
      ))}
    </div>

    <div className="reply">
      <div className="suggest">
        <Icon name="sparkle" size={14} style={{ color: 'var(--accent)', marginTop: 2 }} />
        <div className="grow">
          <div className="eyebrow">Saint suggests</div>
          {conv.status === 'escalated'
            ? 'Acknowledge the mistake plainly, confirm what you have already done, and give a date.'
            : `Offer the ${brand.itemNoun} they looked at twice, and mention the ${brand.assistant.humanRole.toLowerCase()} is on hand.`}
        </div>
        <button className="btn btn-sm btn-ghost">Use</button>
      </div>
      <div className="reply-box">
        <textarea rows={1} placeholder={`Reply as ${brand.assistant.human.split(' ')[0]}…`} />
        <button className="icon-btn" aria-label="Attach">
          <Icon name="paperclip" size={16} />
        </button>
        <button className="btn btn-sm btn-primary">
          Send
          <Icon name="send" size={13} />
        </button>
      </div>
    </div>
  </div>
);
}
