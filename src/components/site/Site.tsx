import { useEffect, useState } from 'react';
import { Icon } from '../Icon';
import {
  CatalogView,
  JournalView,
  PageHead,
  PeopleView,
  StoryView,
  VisitingView,
  routeFor,
  type Route,
} from './pages';
import { Featured, HomeJourney, HomeStory, HomeVisit } from './sections';
import { useStore } from '../../lib/store';
import type { Brand } from '../../lib/types';
import { cx } from '../../lib/utils';
import './site.css';

/** Swap this helper for your own CDN and the whole site re-points. */
export const photo = (id: string, w = 1600) =>
  id.startsWith('photo-')
    ? `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`
    : `https://unsplash.com/photos/${id}/download?force=true&w=${w}`;

const CTA_SECOND: Record<Brand['vertical'], string> = {
  restaurant: 'Book a table',
  clinic: 'Meet the team',
  salon: 'Meet the stylists',
};

/** Reads today's row out of the opening hours table. */
function openToday(brand: Brand) {
  const dow = new Date().getDay();
  const name = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow];
  const row =
    brand.hours.find((h) => h.day === name) ??
    brand.hours.find((h) => {
      const [a, b] = h.day.split(' – ');
      if (!b) return false;
      const order = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      return ai > -1 && bi > -1 && dow >= ai && dow <= bi;
    });
  if (!row || row.hours === 'Closed') return { open: false, label: 'Closed today' };
  return { open: true, label: `Until ${row.hours.split(' – ')[1]}` };
}

export function Site() {
  const { brand, scheme } = useStore();
  const [nav, setNav] = useState<string | null>(null);
  const dark = scheme === 'dark';

  /* A different business is a different site — go back to its front page. */
  useEffect(() => {
    setNav(null);
    document.querySelector('.body')?.scrollTo({ top: 0 });
  }, [brand.id]);

  const route: Route = nav ? routeFor(brand, nav) : { kind: 'home' };
  const go = (label: string | null) => (e: React.MouseEvent) => {
    e.preventDefault();
    setNav(label);
    document.querySelector('.body')?.scrollTo({ top: 0 });
  };
  const today = openToday(brand);
  const heroItems = brand.vertical === 'salon'
    ? brand.catalog.filter((item) => item.categoryId !== 'retail')
    : brand.catalog;
  const signatureCategory =
    brand.vertical === 'restaurant' ? 'geprek' : brand.vertical === 'clinic' ? 'general' : 'cut';
  const signature = [...heroItems]
    .filter((item) => item.categoryId === signatureCategory)
    .sort((a, b) => b.sold - a.sold)[0];


  if (route.kind !== 'home') {
    return (
      <div className="site is-inner">
        <SiteNav brand={brand} nav={nav} go={go} solid />
        <div className="shell">
          <PageHead title={route.title} blurb={route.blurb} />

          {route.kind === 'catalog' && (
            <CatalogView brand={brand} only={route.only} dark={dark} />
          )}
          {route.kind === 'people' && <PeopleView brand={brand} dark={dark} />}
          {route.kind === 'visiting' && <VisitingView brand={brand} />}
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
            <span>Signature</span>
            <b>{signature?.name.split(',')[0]}</b>
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

      <HomeStory brand={brand} />
      <HomeJourney brand={brand} />

      <div className="shell">
        <Featured brand={brand} onAll={go(brand.nav[0])} />
        <HomeVisit brand={brand} onVisit={go(brand.vertical === 'restaurant' ? 'Find us' : 'Visiting')} />
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
