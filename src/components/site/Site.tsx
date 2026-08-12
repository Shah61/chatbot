import { useEffect, useState } from 'react';
import { Icon } from '../Icon';
import {
  CatalogView,
  JournalView,
  PageHead,
  PeopleView,
  ShopView,
  StoryView,
  VisitingView,
  openToday,
  routeFor,
  type Route,
} from './pages';
import { Craft, Featured, Philosophy, Process } from './sections';
import { useStore } from '../../lib/store';
import type { Brand } from '../../lib/types';
import { cx } from '../../lib/utils';
import './site.css';

/** Swap this helper for your own CDN and the whole site re-points. */
export const photo = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const CTA_SECOND: Record<Brand['vertical'], string> = {
  restaurant: 'Book a table',
  clinic: 'Meet the team',
  salon: 'Meet the stylists',
};

export function Site() {
  const { brand, scheme } = useStore();
  const [nav, setNav] = useState<string | null>(null);
  const dark = scheme === 'dark';

  /* A different business is a different site — go back to its front page. */
  useEffect(() => setNav(null), [brand.id]);

  const route: Route = nav ? routeFor(brand, nav) : { kind: 'home' };
  const go = (label: string | null) => (e: React.MouseEvent) => {
    e.preventDefault();
    setNav(label);
    document.querySelector('.body')?.scrollTo({ top: 0 });
  };
  const today = openToday(brand);


  if (route.kind !== 'home') {
    return (
      <div className="site is-inner">
        <SiteNav brand={brand} nav={nav} go={go} solid />
        <div className="shell">
          <PageHead title={route.title} blurb={route.blurb} />

          {route.kind === 'catalog' && (
            <CatalogView brand={brand} only={route.only} dark={dark} />
          )}
          {route.kind === 'shop' && <ShopView brand={brand} only={route.only} dark={dark} />}
          {route.kind === 'people' && <PeopleView brand={brand} dark={dark} />}
          {route.kind === 'visiting' && (
            <VisitingView brand={brand} photoUrl={photo(brand.images.hero, 1600)} />
          )}
          {route.kind === 'journal' && <JournalView brand={brand} />}
          {route.kind === 'story' && (
            <StoryView brand={brand} photoUrl={photo(brand.images.story, 1000)} />
          )}

          <SiteFoot brand={brand} />
        </div>
      </div>
    );
  }

  return (
    <div className="site">
      {/* The opening pair is one layered scroll scene: the editorial panel
          rises over the pinned hero instead of following it like a block. */}
      <div className="intro-stack">
        {/* ---------- hero ---------- */}
        <header className="hero">
        <div className="hero-photo" style={{ backgroundImage: `url(${photo(brand.images.hero, 2000)})` }} />
        <div className="hero-tint" />
        <div className="hero-scrim" />

        <SiteNav brand={brand} nav={nav} go={go} solid={false} />

        <div className="hero-inner">
          <div className="hero-eyebrow">
            <i />
            {brand.hero.eyebrow}
          </div>

          <h1>
            {brand.hero.line1}
            <em>{brand.hero.line2}</em>
          </h1>

          <p>{brand.hero.body}</p>

          <div className="hero-cta">
            <button className="btn btn-lg btn-light">
              {brand.hero.cta}
              <Icon name="arrowRight" size={15} />
            </button>
            <button className="btn btn-lg btn-glass">{CTA_SECOND[brand.vertical]}</button>
          </div>
        </div>

        <div className="hero-note">
          <div className="hero-note-box" />
          <div className="hero-note-tag">
            <span>{brand.categories[0]?.name}</span>
            <b>{[...brand.catalog].sort((a, b) => b.sold - a.sold)[0]?.name.split(',')[0]}</b>
          </div>
        </div>

        <div className="hero-facts">
          <div className="fact">
            <div className="fact-label">
              {today.open && <span className="open-dot" />}
              {today.open ? 'Open now' : 'Closed'}
            </div>
            <div className="fact-value">
              {today.label}
              <small>{brand.hours[0].day}</small>
            </div>
          </div>
          {brand.hero.stats.slice(0, 2).map((s) => (
            <div className="fact" key={s.label}>
              <div className="fact-label">{s.label}</div>
              <div className="fact-value">{s.value}</div>
            </div>
          ))}
          <div className="fact">
            <div className="fact-label">Find us</div>
            <div className="fact-value">
              {brand.address.split(',')[0]}
              <small>{brand.district}</small>
            </div>
          </div>
        </div>
        </header>

        <Philosophy brand={brand} />
      </div>

      <Craft brand={brand} />

      {/* ---------- marquee ---------- */}
      <div className="marquee">
        <div className="marquee-track">
          {[...brand.marquee, ...brand.marquee, ...brand.marquee, ...brand.marquee].map((m, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 34 }}>
              {m}
              <i />
            </span>
          ))}
        </div>
      </div>

      <Process brand={brand} />

      <div className="shell">
        <Featured brand={brand} onAll={go(brand.nav[0])} />
        <SiteFoot brand={brand} />
      </div>
    </div>
  );
}


/* ==========================================================================
   Shared chrome

   Over the hero the nav is transparent with light type; on an inner page it
   sits on the surface with ink type. One component, one set of links.
   ========================================================================== */

function SiteNav({
  brand,
  nav,
  go,
  solid,
}: {
  brand: Brand;
  nav: string | null;
  go: (label: string | null) => (e: React.MouseEvent) => void;
  solid: boolean;
}) {
  return (
    <nav className={cx('topnav', solid && 'is-solid')}>
      <a className="mark" href="#home" onClick={go(null)}>
        {brand.name}
      </a>
      <div className="topnav-links">
        {brand.nav.map((n) => (
          <a
            key={n}
            href={`#${n.toLowerCase().replace(/\s/g, '-')}`}
            className={cx(nav === n && 'on')}
            onClick={go(n)}
          >
            {n}
          </a>
        ))}
      </div>
      <span className="topnav-tel">
        <Icon name="phone" size={14} />
        {brand.phone}
      </span>
      <button className={cx('btn btn-sm', solid ? 'btn-primary' : 'btn-light')}>
        {brand.hero.cta}
      </button>
    </nav>
  );
}

function SiteFoot({ brand }: { brand: Brand }) {
  return (
    <footer className="sitefoot">
      <span className="mark">{brand.name}</span>
      <span className="meta">
        {brand.address}, {brand.district} · {brand.phone}
      </span>
    </footer>
  );
}
