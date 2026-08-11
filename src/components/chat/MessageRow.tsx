import { Icon, type IconName } from '../Icon';
import { BlockView } from './Blocks';
import type { Action, Brand, CartLine, Message } from '../../lib/types';
import { clockTime, cx } from '../../lib/utils';

const SYS: Record<string, IconName> = {
  agent: 'users',
  calendar: 'calendar',
  bag: 'bag',
  shield: 'shield',
};

export function MessageRow({
  message,
  prevRole,
  brand,
  live,
  dark,
  cart,
  onAction,
  onQty,
  showStamp = true,
}: {
  message: Message;
  prevRole?: Message['role'];
  brand: Brand;
  live: boolean;
  dark: boolean;
  cart: CartLine[];
  onAction: (a: Action) => void;
  onQty: (itemId: string, delta: number) => void;
  showStamp?: boolean;
}) {
  if (message.role === 'system') {
    const text = message.blocks[0]?.kind === 'text' ? message.blocks[0].text : '';
    return (
      <div className="sysline">
        <span>
          <Icon name={SYS[message.systemIcon ?? 'shield']} size={12} />
          {text}
        </span>
      </div>
    );
  }

  const isUser = message.role === 'user';
  const grouped = prevRole === message.role;

  return (
    <div className={cx('msg', isUser && 'is-user', message.role === 'agent' && 'is-agent')}>
      {!isUser && (
        <span
          className={cx(
            'monogram msg-face',
            message.role === 'agent' && 'is-agent',
            grouped && 'is-ghost',
          )}
        >
          {grouped ? '' : message.role === 'agent' ? brand.assistant.human[0] : 'S'}
        </span>
      )}

      <div className="msg-col">
        {message.blocks.map((block, i) =>
          block.kind === 'text' ? (
            <div key={i} className={cx('bubble', i === message.blocks.length - 1 && 'tail')}>
              {block.text}
            </div>
          ) : (
            <BlockView
              key={i}
              block={block}
              brand={brand}
              live={live && !message.resolved}
              resolved={message.resolved}
              dark={dark}
              cart={cart}
              messageId={message.id}
              onAction={onAction}
              onQty={onQty}
            />
          ),
        )}
        {showStamp && (
          <div className="msg-stamp">
            {message.role === 'agent' && `${brand.assistant.human.split(' ')[0]} · `}
            {clockTime(message.at)}
            {isUser && <Icon name="ticks" size={13} strokeWidth={1.8} />}
          </div>
        )}
      </div>
    </div>
  );
}
