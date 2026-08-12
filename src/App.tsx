import { useEffect, useState } from 'react';
import { Icon } from './components/Icon';
import { Site } from './components/site/Site';
import { ChatWidget } from './components/chat/ChatWidget';
import { AdminConsole } from './components/admin/AdminConsole';
import { CommandPalette } from './components/CommandPalette';
import { BRANDS, BRAND_ORDER, PRODUCT } from './lib/brands';
import { LiveProvider, useLive } from './lib/live';
import { StoreProvider, useStore } from './lib/store';
import { cx } from './lib/utils';

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
        {view === 'store' ? (
          <>
            <Site />
            <ChatWidget />
          </>
        ) : (
          <AdminConsole />
        )}
      </div>
    </div>
  );
}
