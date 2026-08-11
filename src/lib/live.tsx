import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { greeting } from './bot';
import { useStore } from './store';
import type { Agent, LiveStatus, Message } from './types';
import { initialsOf, uid } from './utils';

/* ==========================================================================
   The live session.

   The transcript lives here rather than inside the widget, because once a
   visitor asks for a person there are two participants: the widget and the
   console. Both read and write this one array, so escalating in the
   Storefront and replying in the Console are genuinely the same conversation.

   Swap the internals for a WebSocket and nothing above this file changes.
   ========================================================================== */

/** How long a real person "takes" to pick up, when one is at the desk. */
const PICKUP_MS = 4200;

interface LiveValue {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  reset: (msgs: Message[]) => void;

  status: LiveStatus;
  agent: Agent | null;
  waitingSince: number | null;

  /** Is anyone on the console side marked available. */
  agentOnline: boolean;
  setAgentOnline: (v: boolean) => void;

  agentTyping: boolean;
  setAgentTyping: (v: boolean) => void;
  visitorTyping: boolean;
  setVisitorTyping: (v: boolean) => void;

  requestAgent: () => void;
  cancelRequest: () => void;
  acceptChat: () => void;
  agentSay: (text: string) => void;
  endChat: (by: 'agent' | 'visitor') => void;

  unreadForAgent: number;
  clearAgentUnread: () => void;
}

const Ctx = createContext<LiveValue | null>(null);

export function LiveProvider({ children }: { children: React.ReactNode }) {
  const { brand } = useStore();

  const [messages, setMessages] = useState<Message[]>(() => greeting(brand));
  const [status, setStatus] = useState<LiveStatus>('off');
  const [agent, setAgent] = useState<Agent | null>(null);
  const [waitingSince, setWaitingSince] = useState<number | null>(null);
  const [agentOnline, setAgentOnline] = useState(true);
  const [agentTyping, setAgentTyping] = useState(false);
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [unreadForAgent, setUnreadForAgent] = useState(0);

  const pickup = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearPickup = () => {
    if (pickup.current) clearTimeout(pickup.current);
    pickup.current = null;
  };

  const sys = (text: string, icon: Message['systemIcon'] = 'agent'): Message => ({
    id: uid('s'),
    role: 'system',
    at: Date.now(),
    systemIcon: icon,
    blocks: [{ kind: 'text', text }],
  });

  const push = useCallback((m: Message) => setMessages((prev) => [...prev, m]), []);

  /* A different brand is a different business — start over. */
  const reset = useCallback((msgs: Message[]) => {
    clearPickup();
    setMessages(msgs);
    setStatus('off');
    setAgent(null);
    setWaitingSince(null);
    setAgentTyping(false);
    setVisitorTyping(false);
    setUnreadForAgent(0);
  }, []);

  useEffect(() => {
    reset(greeting(brand));
  }, [brand.id, reset]);

  useEffect(() => clearPickup, []);

  const personFor = useCallback(
    (): Agent => ({
      name: brand.assistant.human,
      role: brand.assistant.humanRole,
      initials: initialsOf(brand.assistant.human),
    }),
    [brand],
  );

  const acceptChat = useCallback(() => {
    clearPickup();
    const who = personFor();
    setAgent(who);
    setStatus('active');
    setWaitingSince(null);
    push(sys(`${who.name}, ${who.role.toLowerCase()}, joined`));
    push({
      id: uid('a'),
      role: 'agent',
      at: Date.now(),
      blocks: [
        {
          kind: 'text',
          text: `Hello, ${who.name.split(' ')[0]} here. I have read everything above, so no need to start again — what can I do?`,
        },
      ],
    });
  }, [personFor, push]);

  const requestAgent = useCallback(() => {
    if (status === 'waiting' || status === 'active') return;
    setStatus('waiting');
    setWaitingSince(Date.now());
    setUnreadForAgent((n) => n + 1);
    /* Someone at the desk picks up on their own; otherwise it sits in the
       queue until the console accepts it. */
    if (agentOnline) {
      clearPickup();
      pickup.current = setTimeout(acceptChat, PICKUP_MS);
    }
  }, [status, agentOnline, acceptChat]);

  const cancelRequest = useCallback(() => {
    clearPickup();
    setStatus('off');
    setWaitingSince(null);
    setUnreadForAgent(0);
    push(sys('Request cancelled — back with Saint', 'shield'));
  }, [push]);

  const agentSay = useCallback(
    (text: string) => {
      const body = text.trim();
      if (!body) return;
      setAgentTyping(false);
      push({
        id: uid('a'),
        role: 'agent',
        at: Date.now(),
        blocks: [{ kind: 'text', text: body }],
      });
    },
    [push],
  );

  const endChat = useCallback(
    (by: 'agent' | 'visitor') => {
      clearPickup();
      const who = agent?.name.split(' ')[0] ?? 'The team';
      setStatus('ended');
      setAgent(null);
      setAgentTyping(false);
      push(
        sys(
          by === 'agent' ? `${who} closed the chat — Saint is back` : `You ended the chat — Saint is back`,
          'shield',
        ),
      );
    },
    [agent, push],
  );

  const value = useMemo<LiveValue>(
    () => ({
      messages,
      setMessages,
      reset,
      status,
      agent,
      waitingSince,
      agentOnline,
      setAgentOnline,
      agentTyping,
      setAgentTyping,
      visitorTyping,
      setVisitorTyping,
      requestAgent,
      cancelRequest,
      acceptChat,
      agentSay,
      endChat,
      unreadForAgent,
      clearAgentUnread: () => setUnreadForAgent(0),
    }),
    [
      messages,
      reset,
      status,
      agent,
      waitingSince,
      agentOnline,
      agentTyping,
      visitorTyping,
      requestAgent,
      cancelRequest,
      acceptChat,
      agentSay,
      endChat,
      unreadForAgent,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLive() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLive must be used inside LiveProvider');
  return v;
}
