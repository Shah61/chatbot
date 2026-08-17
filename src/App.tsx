import { Suspense, lazy, useEffect, useState } from 'react';
import { Icon } from './components/Icon';
import { CommandPalette } from './components/CommandPalette';
import { BRANDS, BRAND_ORDER, PRODUCT } from './lib/brands';
import { LiveProvider, useLive } from './lib/live';
import { StoreProvider, useStore } from './lib/store';
import { cx } from './lib/utils';

/* The storefront and the console are split into their own chunks, which also
   splits their stylesheets. Bundled together they produced a single ~97 kB CSS
   file, and everything past roughly 64 kB of it was arriving truncated in
   production — first the demo chrome, then the whole console. Three files of
   12/50/32 kB keep every one of them well clear of that ceiling, and the
   storefront stops shipping an admin console it never renders. */
const Site = lazy(() => import('./components/site/Site').then((m) => ({ default: m.Site })));
const ChatWidget = lazy(() =>
  import('./components/chat/ChatWidget').then((m) => ({ default: m.ChatWidget })),
);
const AdminConsole = lazy(() =>
  import('./components/admin/AdminConsole').then((m) => ({ default: m.AdminConsole })),
);

export default function App() {
  return (
    <StoreProvider>
      <LiveProvider>
        <Shell />
      </LiveProvider>
    </StoreProvider>
  );
}

function Shell() {
  const { brandId, scheme, setBrandId, setScheme } = useStore();
  const live = useLive();
  const [view, setView] = useState<'store' | 'console'>('store');

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.brand = brandId;
    root.dataset.theme = scheme;
  }, [brandId, scheme]);

  return (
    <div className="app">
      <div className="bar">
        <div className="bar-brand">
          <span className="monogram">S</span>
          <b>{PRODUCT.name}</b>
        </div>

        <div className="brands" role="tablist" aria-label="Template">
          {BRAND_ORDER.map((id) => {
            const b = BRANDS[id];
            return (
              <button
                key={id}
                role="tab"
                aria-selected={brandId === id}
                className={cx('brand-btn', brandId === id && 'on')}
                onClick={() => setBrandId(id)}
              >
                <span className="monogram">{b.name[0]}</span>
                <span className="brand-btn-text">
                  <b>{b.name}</b>
                  <span>{b.vertical}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="bar-spacer" />


        <div className="views" role="tablist">
          <button
            role="tab"
            aria-selected={view === 'store'}
            className={cx(view === 'store' && 'on')}
            onClick={() => setView('store')}
          >
            <Icon name="chat" size={14} />
            Storefront
          </button>
          <button
            role="tab"
            aria-selected={view === 'console'}
            className={cx(view === 'console' && 'on', live.status === 'waiting' && 'ringing')}
            onClick={() => setView('console')}
          >
            <Icon name="grid" size={14} />
            Console
            {live.status === 'waiting' && <span className="tab-ring" />}
          </button>
        </div>

        <button
          className="icon-btn"
          onClick={() => setScheme(scheme === 'light' ? 'dark' : 'light')}
          aria-label="Toggle light and dark"
          title="Toggle light and dark"
        >
          <Icon name={scheme === 'light' ? 'moon' : 'sun'} size={16} />
        </button>
      </div>

      <CommandPalette view={view} setView={setView} />

      <div className={cx('body', view === 'store' && 'scrolls')}>
        <Suspense fallback={<div className="booting" />}>
          {view === 'store' ? (
            <>
              <Site />
              <ChatWidget />
            </>
          ) : (
            <AdminConsole />
          )}
        </Suspense>
      </div>
    </div>
  );
}
