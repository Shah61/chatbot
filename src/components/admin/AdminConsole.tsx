import { Icon, type IconName } from '../Icon';
import { Overview } from './Overview';
import { Inbox } from './Inbox';
import { ChatlogPage } from './ChatlogPage';
import { TransactionsPage } from './TransactionsPage';
import { CatalogPage } from './CatalogPage';
import { RotaPage } from './RotaPage';
import { KnowledgePage } from './KnowledgePage';
import { SettingsPage } from './SettingsPage';
import { useStore, type AdminPage } from '../../lib/store';
import { MOD_HINT, cx } from '../../lib/utils';
import './admin.css';

type PageId = AdminPage;

export function AdminConsole() {
  const { brand, page, setPage } = useStore();

  const restaurant = brand.vertical === 'restaurant';
  const catalogLabel =
    brand.vertical === 'restaurant' ? 'Menu' : brand.vertical === 'clinic' ? 'Treatments' : 'Services';
  const ledgerLabel = restaurant ? 'Orders & tables' : 'Bookings';

  const PAGES: {
    id: PageId;
    label: string;
    icon: IconName;
    group: string;
    title: string;
    sub: string;
    mark: string;
    count?: number;
    flush?: boolean;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'grid',
      group: brand.name,
      title: 'Overview',
      sub: 'What Saint handled over the last fourteen days.',
      mark: 'Today',
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: 'inbox',
      group: brand.name,
      title: 'Inbox',
      sub: 'Every conversation, live and closed.',
      mark: 'Inbox',
      count: 3,
      flush: true,
    },
    {
      id: 'chatlog',
      label: 'Chatlog',
      icon: 'sparkle',
      group: brand.name,
      title: 'Chatlog',
      sub: 'What every answer cost, and the ones that did not land.',
      mark: 'Spend',
    },
    {
      id: 'ledger',
      label: ledgerLabel,
      icon: restaurant ? 'bag' : 'calendar',
      group: brand.name,
      title: ledgerLabel,
      sub: restaurant
        ? 'Taken in chat and fired straight to the pass.'
        : 'Booked in chat and written straight to the diary.',
      mark: restaurant ? 'Pass' : 'Diary',
    },
    {
      id: 'catalog',
      label: catalogLabel,
      icon: restaurant ? 'utensils' : brand.vertical === 'clinic' ? 'stethoscope' : 'scissors',
      group: 'Assistant',
      title: catalogLabel,
      sub: `Prices, descriptions and what Saint is allowed to sell.`,
      mark: catalogLabel,
    },
    /* Only the verticals that sell time with a named person have a rota. */
    ...(brand.people.length
      ? [
          {
            id: 'rota' as PageId,
            label: 'Availability',
            icon: 'users' as IconName,
            group: 'Assistant',
            title: 'Availability',
            sub: `Who is on today, and who covers them when they are not.`,
            mark: 'Rota',
          },
        ]
      : []),
    {
      id: 'knowledge',
      label: 'Knowledge',
      icon: 'book',
      group: 'Assistant',
      title: 'Knowledge',
      sub: 'What Saint may say, and how sure it is.',
      mark: 'Answers',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      group: 'Assistant',
      title: 'Settings',
      sub: 'Voice, channels, automations and the handover line.',
      mark: 'Setup',
    },
  ];

  /* Switching to a brand without a rota while sitting on it would leave the
     header with nothing to describe. */
  const current = PAGES.find((p) => p.id === page) ?? PAGES[0];
  const groups = [...new Set(PAGES.map((p) => p.group))];

  return (
    <div className="console">
      <aside className="side">
        <div className="side-top">
          <button className="ws">
            <span className="monogram">{brand.name[0]}</span>
            <span className="ws-text">
              <span className="ws-name">{brand.legal}</span>
              <span className="ws-kind">{brand.kind}</span>
            </span>
            <Icon name="chevronDown" size={14} style={{ color: 'var(--ink-4)' }} />
          </button>
        </div>

        <div className="side-search">
          <Icon name="search" size={14} className="lead" />
          <input
            className="field"
            placeholder="Search everything"
            readOnly
            onFocus={(e) => {
              e.currentTarget.blur();
              (window as unknown as { openPalette?: () => void }).openPalette?.();
            }}
          />
          <kbd>{MOD_HINT}</kbd>
        </div>

        <nav className="side-nav scroll-area">
          {groups.map((g) => (
            <div key={g}>
              <div className="nav-label eyebrow">{g}</div>
              {PAGES.filter((p) => p.group === g).map((p) => (
                <button
                  key={p.id}
                  className={cx('nav-item', page === p.id && 'on')}
                  onClick={() => setPage(p.id)}
                >
                  <Icon name={p.icon} size={16} />
                  {p.label}
                  {p.count ? <span className="nav-count">{p.count}</span> : null}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="side-foot">
          <button className="me">
            <span className="monogram">
              {brand.assistant.human
                .split(' ')
                .map((w) => w[0])
                .join('')}
            </span>
            <span className="me-text">
              <span className="me-name">{brand.assistant.human}</span>
              <span className="me-role">{brand.assistant.humanRole}</span>
            </span>
            <Icon name="more" size={15} style={{ color: 'var(--ink-4)' }} />
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="watermark">{current.mark}</div>
          <div className="topbar-text">
            <h1 className="display-lg">{current.title}</h1>
            <p className="meta">{current.sub}</p>
          </div>
          <div className="topbar-acts">
            {page === 'overview' && (
              <span className="range">
                <Icon name="calendar" size={14} />
                Last 14 days
                <Icon name="chevronDown" size={13} style={{ color: 'var(--ink-4)' }} />
              </span>
            )}
            <button className="icon-btn" aria-label="Notifications">
              <Icon name="bell" size={16} />
            </button>
          </div>
        </header>

        <div className={cx('page scroll-area', current.flush && 'flush')}>
          {page === 'overview' && <Overview />}
          {page === 'inbox' && <Inbox />}
          {page === 'chatlog' && <ChatlogPage />}
          {page === 'ledger' && <TransactionsPage />}
          {page === 'catalog' && <CatalogPage />}
          {page === 'rota' && brand.people.length > 0 && <RotaPage />}
          {page === 'knowledge' && <KnowledgePage />}
          {page === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}
