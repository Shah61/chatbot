import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../Icon';
import { MessageRow } from './MessageRow';
import { PRODUCT } from '../../lib/brands';
import { cartTotal, greeting, homeReplies, initialState, reply } from '../../lib/bot';
import { useLive } from '../../lib/live';
import {
  ChatUnavailable,
  aiHandles,
  brandContext,
  getHealth,
  streamChat,
  toHistory,
  type Health,
} from '../../lib/server';
import { useStore } from '../../lib/store';
import type { Action, Block, BotState, CartLine, Message } from '../../lib/types';
import { cx, money, sleep, uid } from '../../lib/utils';
import './chat.css';

/** Quick replies read as something the visitor said, so they echo as one. */
const ECHO: Partial<Record<Action['id'], string>> = {
  order: 'I’d like to order',
  menu: 'Show me the menu',
  reserve: 'Book a table',
  appointment: 'Book an appointment',
  checkout: 'Check out',
  hours: 'Opening hours',
  location: 'Where are you?',
  pricing: 'What does it cost?',
  human: 'I’d like to talk to a person',
  track: 'Track it',
  restart: 'Something else',
};

export function ChatWidget() {
  const { brand, scheme } = useStore();
  const live = useLive();
  const { messages, setMessages } = live;
  const dark = scheme === 'dark';

  /* A bubble until someone wants it — the page keeps its full width. */
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [typing, setTyping] = useState(false);

  const [health, setHealth] = useState<Health>({ ai: false, model: null, brands: [] });

  const botState = useRef<BotState>(initialState);
  const cartRef = useRef<CartLine[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const historyRef = useRef<Message[]>(messages);

  /* Ask the server once whether it can answer. If it cannot — no key, not
     running, brand not switched on — everything below stays scripted. */
  useEffect(() => {
    getHealth().then(setHealth);
  }, []);

  useEffect(() => {
    historyRef.current = messages;
  }, [messages]);

  /* The live layer resets the transcript on a brand change; clear our half. */
  useEffect(() => {
    botState.current = initialState;
    cartRef.current = [];
    setCart([]);
    setTyping(false);
    busy.current = false;
  }, [brand.id]);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, typing, wide, cart.length, live.agentTyping]);

  const lastLiveId = useMemo(
    () => [...messages].reverse().find((m) => m.role === 'bot' || m.role === 'agent')?.id,
    [messages],
  );

  const withHuman = live.status === 'active';

  /**
   * One turn through the model. Returns false if the server declined, so the
   * caller can fall back to the scripted flow without the visitor noticing.
   */
  const askServer = useCallback(
    async (text: string) => {
      const userMsg: Message = {
        id: uid('u'),
        role: 'user',
        at: Date.now(),
        blocks: [{ kind: 'text', text }],
      };
      const botId = uid('b');
      const history = toHistory([...historyRef.current, userMsg]);

      setMessages((prev) => [...prev, userMsg]);
      setTyping(true);

      let opened = false;
      let acc = '';
      const extra: Block[] = [];

      const render = () => {
        const blocks: Block[] = [];
        if (acc.trim()) blocks.push({ kind: 'text', text: acc.trim() });
        blocks.push(...extra);
        if (!blocks.length) return;

        if (!opened) {
          opened = true;
          setTyping(false);
          setMessages((prev) => [...prev, { id: botId, role: 'bot', at: Date.now(), blocks }]);
          return;
        }
        setMessages((prev) => prev.map((m) => (m.id === botId ? { ...m, blocks } : m)));
      };

      let handoff = false;

      try {
        await streamChat({ brand: brandContext(brand), messages: history }, (e) => {
          switch (e.type) {
            case 'delta':
              acc += e.text;
              render();
              break;
            case 'replace':
              acc = e.text;
              render();
              break;
            case 'blocks':
              extra.push(...e.blocks);
              render();
              break;
            case 'handoff':
              handoff = true;
              break;
            case 'error':
              acc += (acc ? '\n\n' : '') + e.message;
              render();
              break;
            default:
              break;
          }
        });
      } catch (err) {
        setTyping(false);
        /* Server unreachable or switched off — take the message back out and
           let the scripted flow answer it instead. */
        if (err instanceof ChatUnavailable) {
          setHealth({ ai: false, model: null, brands: [] });
          setMessages((prev) => prev.filter((m) => m.id !== userMsg.id && m.id !== botId));
          return false;
        }
        throw err;
      }

      setTyping(false);
      if (!opened) {
        acc = acc || 'Sorry — I did not catch that. Could you say it another way?';
        render();
      }

      /* Every answer ends somewhere to go next. Anything the model sent of
         its own — a slot grid, a ticket — is the better next step, and does
         not want a row of chips underneath repeating the offer. */
      if (!handoff && !extra.length) {
        extra.push({ kind: 'quickReplies', options: homeReplies(brand) });
        render();
      }

      if (handoff) live.requestAgent();
      return true;
    },
    [brand, live, setMessages],
  );

  const dispatch = useCallback(
    async (action: Action) => {
      if (busy.current) return;

      /* A person is on the line — Saint stays out of the way. */
      if (withHuman && action.id === 'freetext') {
        live.setVisitorTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: uid('u'), role: 'user', at: Date.now(), blocks: [{ kind: 'text', text: action.text }] },
        ]);
        return;
      }

      busy.current = true;

      /* Typed questions go to the model when it is switched on for this
         brand. Taps stay scripted — a card the visitor pressed should do
         exactly what it says, every time. */
      if (action.id === 'freetext' && aiHandles(health, brand.id)) {
        try {
          if (await askServer(action.text)) {
            busy.current = false;
            return;
          }
        } catch {
          setTyping(false);
        }
      }

      const result = reply(action, {
        state: botState.current,
        brand,
        cart: cartRef.current,
      });
      botState.current = result.state;

      const echo = action.id === 'freetext' ? action.text : ECHO[action.id];

      setMessages((prev) => {
        let next = prev;
        const hit = result.resolve;
        if (hit) {
          const i = next.map((m) => m.blocks.some((b) => b.kind === hit.kind)).lastIndexOf(true);
          if (i > -1) next = next.map((m, j) => (j === i ? { ...m, resolved: hit.value } : m));
        }
        if (echo) {
          next = [
            ...next,
            { id: uid('u'), role: 'user', at: Date.now(), blocks: [{ kind: 'text', text: echo }] },
          ];
        }
        return next;
      });

      if (result.clearCart) {
        cartRef.current = [];
        setCart([]);
      }

      for (const [i, msg] of result.messages.entries()) {
        if (msg.role === 'system') {
          await sleep(300);
        } else {
          setTyping(true);
          await sleep(i === 0 ? 600 : 460);
          setTyping(false);
        }
        setMessages((prev) => [...prev, { ...msg, at: Date.now() }]);
        await sleep(90);
      }

      if (result.handoff) live.requestAgent();

      busy.current = false;
    },
    [askServer, brand, health, live, setMessages, withHuman],
  );

  const onQty = useCallback((itemId: string, delta: number) => {
    setCart((prev) => {
      const found = prev.find((l) => l.itemId === itemId);
      if (!found) return delta > 0 ? [...prev, { itemId, qty: 1 }] : prev;
      const qty = found.qty + delta;
      return qty <= 0
        ? prev.filter((l) => l.itemId !== itemId)
        : prev.map((l) => (l.itemId === itemId ? { ...l, qty } : l));
    });
  }, []);

  const restart = () => {
    botState.current = initialState;
    cartRef.current = [];
    setCart([]);
    live.reset(greeting(brand));
  };

  const count = cart.reduce((n, l) => n + l.qty, 0);
  const total = cartTotal(cart, brand);
  const agent = live.agent;

  return (
    <div className="dock">
      {open && (
        <div className={cx('widget', wide && 'is-wide')} role="dialog" aria-label="Saint chat">
          <header
            className={cx('w-head', withHuman && 'is-human')}
            data-mark={withHuman ? (agent?.initials.charAt(0) ?? 'A') : brand.name[0]}
          >
            <span className="monogram w-mark">{withHuman ? (agent?.initials ?? 'A') : 'S'}</span>
            <div className="w-head-text">
              <div className="w-name">
                {withHuman ? agent?.name : PRODUCT.name}
                {withHuman && <span className="w-agent-tag">Human</span>}
              </div>
              <div className="w-sub">
                <span className="w-live" />
                {withHuman ? `${agent?.role} · ${brand.legal}` : `${brand.legal} · replies instantly`}
              </div>
            </div>
            <div className="w-acts">
              {withHuman ? (
                <button
                  className="w-btn"
                  onClick={() => live.endChat('visitor')}
                  title="Back to Saint"
                  aria-label="Back to Saint"
                >
                  <Icon name="undo" size={15} />
                </button>
              ) : (
                <button
                  className="w-btn"
                  onClick={() => dispatch({ id: 'human' })}
                  disabled={live.status === 'waiting'}
                  title="Talk to a person"
                  aria-label="Talk to a person"
                >
                  <Icon name="users" size={15} />
                </button>
              )}
              <button className="w-btn" onClick={restart} title="Start over" aria-label="Start over">
                <Icon name="refresh" size={15} />
              </button>
              <button
                className="w-btn"
                onClick={() => setWide((w) => !w)}
                title={wide ? 'Shrink' : 'Expand'}
                aria-label={wide ? 'Shrink' : 'Expand'}
              >
                <Icon name={wide ? 'collapse' : 'expand'} size={15} />
              </button>
              <button
                className="w-btn"
                onClick={() => setOpen(false)}
                title="Minimise"
                aria-label="Minimise"
              >
                <Icon name="minus" size={15} />
              </button>
            </div>
          </header>

          <div className="w-scroll">
            <div className="w-body scroll-area" ref={bodyRef}>
              <div className="w-daymark">Today</div>
              {messages.map((m, i) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  prevRole={messages[i - 1]?.role}
                  brand={brand}
                  live={m.id === lastLiveId}
                  dark={dark}
                  cart={cart}
                  onAction={dispatch}
                  onQty={onQty}
                  showStamp={messages[i + 1]?.role !== m.role}
                />
              ))}
              {(typing || live.agentTyping) && (
                <div className="msg">
                  <span
                    className={cx('monogram msg-face', live.agentTyping && 'is-agent')}
                  >
                    {live.agentTyping ? (agent?.initials.charAt(0) ?? 'A') : 'S'}
                  </span>
                  <div className="typing" aria-label="Typing">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              )}
            </div>
          </div>

          {count > 0 && !withHuman && (
            <div className="tray">
              <span className="tray-count">{count}</span>
              <span className="tray-text">
                <b>{count === 1 ? '1 item' : `${count} items`} in your basket</b>
                <span>{brand.vertical === 'restaurant' ? 'Kitchen is open' : 'Free over £50'}</span>
              </span>
              <span className="tray-total">{money(total, brand.currency)}</span>
              <button className="tray-go" onClick={() => dispatch({ id: 'checkout' })}>
                Check out
                <Icon name="arrowRight" size={14} />
              </button>
            </div>
          )}

          <Composer
            onSend={(text) => dispatch({ id: 'freetext', text })}
            onTyping={(v) => live.setVisitorTyping(v)}
            disabled={typing}
            placeholder={
              withHuman ? `Message ${agent?.name.split(' ')[0]}…` : 'Ask me anything…'
            }
            footer={withHuman ? `${agent?.name} · ${brand.legal}` : `Powered by ${PRODUCT.name}`}
          />
        </div>
      )}

      <button
        className="launcher"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        <Icon name={open ? 'chevronDown' : 'chat'} size={23} strokeWidth={1.4} />
        {!open && <span className="launcher-badge">1</span>}
      </button>
    </div>
  );
}

function Composer({
  onSend,
  onTyping,
  disabled,
  placeholder,
  footer,
}: {
  onSend: (t: string) => void;
  onTyping: (v: boolean) => void;
  disabled?: boolean;
  placeholder: string;
  footer: string;
}) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
    onTyping(false);
    if (ref.current) ref.current.style.height = 'auto';
  };

  return (
    <div className="composer">
      <div className="composer-box">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          placeholder={placeholder}
          aria-label="Write a message"
          onChange={(e) => {
            setValue(e.target.value);
            onTyping(e.target.value.trim().length > 0);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 104)}px`;
          }}
          onBlur={() => onTyping(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button className="tool" title="Attach" aria-label="Attach a file">
          <Icon name="paperclip" size={16} />
        </button>
        <button className="send" onClick={submit} disabled={!value.trim() || disabled} aria-label="Send">
          <Icon name="send" size={16} />
        </button>
      </div>
      <div className="composer-foot">
        <Icon name="sparkle" size={10} />
        {footer}
      </div>
    </div>
  );
}
