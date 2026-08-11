import { useState } from 'react';
import { Icon, type IconName } from '../Icon';
import { Overview } from './Overview';
import { Inbox } from './Inbox';
import { TransactionsPage } from './TransactionsPage';
import { CatalogPage } from './CatalogPage';
import { KnowledgePage } from './KnowledgePage';
import { SettingsPage } from './SettingsPage';
import { useStore } from '../../lib/store';
import { cx } from '../../lib/utils';
import './admin.css';

type PageId = 'overview' | 'inbox' | 'ledger' | 'catalog' | 'knowledge' | 'settings';

export function AdminConsole() {
  const { brand } = useStore();
  const [page, setPage] = useState<PageId>('overview');

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

  const current = PAGES.find((p) => p.id === page)!;
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
          <input className="field" placeholder="Search everything" />
          <kbd>⌘K</kbd>
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
          {page === 'ledger' && <TransactionsPage />}
          {page === 'catalog' && <CatalogPage />}
          {page === 'knowledge' && <KnowledgePage />}
          {page === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}
