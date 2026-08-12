import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, type IconName } from './Icon';
import { BRANDS, BRAND_ORDER } from '../lib/brands';
import { useStore, type AdminPage } from '../lib/store';
import { cx, money } from '../lib/utils';
import './palette.css';

/* ==========================================================================
   ⌘K

   The console is a power tool, so it should be reachable from the keyboard.
   Everything here is a real action — navigating, switching business, opening
   an item for editing — not a search box that only looks the part.
   ========================================================================== */

interface Cmd {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: IconName;
  keywords?: string;
  run: () => void;
}

export function CommandPalette({
  view,
  setView,
}: {
  view: 'store' | 'console';
  setView: (v: 'store' | 'console') => void;
}) {
  const { brand, brandId, setBrandId, scheme, setScheme, setPage } = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  /* ⌘K / Ctrl-K anywhere, Escape to leave. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    (window as unknown as { openPalette?: () => void }).openPalette = () => setOpen(true);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
    }
  }, [open]);

  const go = (page: AdminPage) => () => {
    setView('console');
    setPage(page);
    setOpen(false);
  };

  const commands = useMemo<Cmd[]>(() => {
    const restaurant = brand.vertical === 'restaurant';
    const catalogLabel = restaurant ? 'Menu' : brand.vertical === 'clinic' ? 'Treatments' : 'Services';

    const nav: Cmd[] = [
      { id: 'n-over', label: 'Overview', group: 'Go to', icon: 'grid', keywords: 'dashboard stats', run: go('overview') },
      { id: 'n-inbox', label: 'Inbox', group: 'Go to', icon: 'inbox', keywords: 'conversations chat', run: go('inbox') },
      {
        id: 'n-ledger',
        label: restaurant ? 'Orders & tables' : 'Bookings',
        group: 'Go to',
        icon: restaurant ? 'bag' : 'calendar',
        keywords: 'diary appointments',
        run: go('ledger'),
      },
      { id: 'n-cat', label: catalogLabel, group: 'Go to', icon: 'layers', keywords: 'catalog prices items', run: go('catalog') },
      ...(brand.people.length
        ? [
            {
              id: 'n-rota',
              label: 'Availability',
              hint: `Who is on, and who covers them`,
              group: 'Go to',
              icon: 'users' as const,
              keywords: 'rota roster mc sick leave cover doctor stylist away holiday',
              run: go('rota'),
            },
          ]
        : []),
      { id: 'n-kb', label: 'Knowledge', group: 'Go to', icon: 'book', keywords: 'answers faq', run: go('knowledge') },
      { id: 'n-set', label: 'Settings', group: 'Go to', icon: 'settings', keywords: 'voice channels handover', run: go('settings') },
      {
        id: 'n-store',
        label: 'Storefront',
        hint: 'See the widget as a customer',
        group: 'Go to',
        icon: 'chat',
        keywords: 'site widget preview',
        run: () => {
          setView('store');
          setOpen(false);
        },
      },
    ];

    const brands: Cmd[] = BRAND_ORDER.filter((id) => id !== brandId).map((id) => ({
      id: `b-${id}`,
      label: `Switch to ${BRANDS[id].name}`,
      hint: BRANDS[id].kind,
      group: 'Business',
      icon: 'refresh',
      keywords: BRANDS[id].vertical,
      run: () => {
        setBrandId(id);
        setOpen(false);
      },
    }));

    const items: Cmd[] = brand.catalog.slice(0, 40).map((i) => ({
      id: `i-${i.id}`,
      label: i.name,
      hint: `${money(i.price, brand.currency)}${i.available ? '' : ' · hidden'}`,
      group: catalogLabel,
      icon: 'pencil',
      keywords: `${i.tags.join(' ')} edit price description`,
      run: () => {
        setView('console');
        setPage('catalog');
        setOpen(false);
      },
    }));

    const actions: Cmd[] = [
      {
        id: 'a-theme',
        label: scheme === 'light' ? 'Switch to dark' : 'Switch to light',
        group: 'Actions',
        icon: scheme === 'light' ? 'moon' : 'sun',
        keywords: 'theme appearance mode',
        run: () => {
          setScheme(scheme === 'light' ? 'dark' : 'light');
          setOpen(false);
        },
      },
      {
        id: 'a-view',
        label: view === 'console' ? 'Open the storefront' : 'Open the console',
        group: 'Actions',
        icon: view === 'console' ? 'chat' : 'grid',
        keywords: 'switch view',
        run: () => {
          setView(view === 'console' ? 'store' : 'console');
          setOpen(false);
        },
      },
    ];

    return [...nav, ...brands, ...actions, ...items];
  }, [brand, brandId, scheme, view]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return commands.filter((c) => c.group !== brand.itemNounPlural).slice(0, 12);
    return commands
      .map((c) => {
        const hay = `${c.label} ${c.hint ?? ''} ${c.keywords ?? ''} ${c.group}`.toLowerCase();
        const i = hay.indexOf(needle);
        return i === -1 ? null : { c, score: (c.label.toLowerCase().startsWith(needle) ? 0 : 10) + i };
      })
      .filter(Boolean)
      .sort((a, b) => a!.score - b!.score)
      .slice(0, 14)
      .map((r) => r!.c);
  }, [q, commands, brand.itemNounPlural]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    listRef.current?.querySelector('.cmd.on')?.scrollIntoView({ block: 'nearest' });
  }, [active, results]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % Math.max(results.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      results[active]?.run();
    }
  };

  let lastGroup = '';

  return (
    <div className="cmd-scrim" onMouseDown={() => setOpen(false)}>
      <div
        className="cmd-panel"
        role="dialog"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="cmd-input">
          <Icon name="search" size={17} />
          <input
            autoFocus
            value={q}
            placeholder={`Search ${brand.legal}…`}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <kbd>esc</kbd>
        </div>

        <div className="cmd-list scroll-area" ref={listRef}>
          {results.length === 0 && (
            <div className="cmd-empty">
              <Icon name="search" size={22} />
              <b>Nothing matches “{q}”</b>
              <span>Try a page, a business, or the name of something you sell.</span>
            </div>
          )}

          {results.map((c, i) => {
            const head = c.group !== lastGroup ? c.group : null;
            lastGroup = c.group;
            return (
              <div key={c.id}>
                {head && <div className="cmd-group">{head}</div>}
                <button
                  className={cx('cmd', i === active && 'on')}
                  onMouseEnter={() => setActive(i)}
                  onClick={c.run}
                >
                  <span className="cmd-icon">
                    <Icon name={c.icon} size={15} />
                  </span>
                  <span className="cmd-label">{c.label}</span>
                  {c.hint && <span className="cmd-hint">{c.hint}</span>}
                  <Icon name="arrowRight" size={14} className="cmd-go" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="cmd-foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> move
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>⌘</kbd>
            <kbd>K</kbd> toggle
          </span>
        </div>
      </div>
    </div>
  );
}
