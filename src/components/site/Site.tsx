import { Icon } from '../Icon';
import { useStore } from '../../lib/store';
import type { Brand } from '../../lib/types';
import { money } from '../../lib/utils';
import './site.css';

/** Swap this helper for your own CDN and the whole site re-points. */
export const photo = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const CTA_SECOND: Record<Brand['vertical'], string> = {
  restaurant: 'Book a table',
  clinic: 'Meet the team',
  salon: 'Meet the stylists',
};

const FEATURE_LEAD: Record<Brand['vertical'], { eyebrow: string; title: string; link: string }> = {
  restaurant: { eyebrow: 'Tonight', title: 'What the kitchen is doing well.', link: 'Full menu' },
  clinic: { eyebrow: 'Treatments', title: 'The appointments people book most.', link: 'All treatments' },
  salon: { eyebrow: 'Services', title: 'What the chairs are booked for.', link: 'Full price list' },
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
  const { brand } = useStore();
  const lead = FEATURE_LEAD[brand.vertical];
  const today = openToday(brand);

  const available = brand.catalog.filter((i) => i.available);
  const featured = [...available].sort((a, b) => b.sold - a.sold).slice(0, 3);
  const rest = available.filter((i) => !featured.includes(i)).slice(0, 6);

  return (
    <div className="site">
      {/* ---------- hero ---------- */}
      <header className="hero">
        <div className="hero-photo" style={{ backgroundImage: `url(${photo(brand.images.hero, 2000)})` }} />
        <div className="hero-tint" />
        <div className="hero-scrim" />

        <nav className="topnav">
          <span className="mark">{brand.name}</span>
          <div className="topnav-links">
            {brand.nav.map((n) => (
              <a key={n} href={`#${n.toLowerCase().replace(/\s/g, '-')}`}>
                {n}
              </a>
            ))}
          </div>
          <span className="topnav-tel">
            <Icon name="phone" size={14} />
            {brand.phone}
          </span>
          <button className="btn btn-sm btn-light">{brand.hero.cta}</button>
        </nav>

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

      {/* ---------- featured ---------- */}
      <div className="shell">
        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">{lead.eyebrow}</div>
              <h2>{lead.title}</h2>
            </div>
            <a className="section-link" href="#all">
              {lead.link}
              <Icon name="arrowRight" size={14} />
            </a>
          </div>

          <div className="features">
            {featured.map((item, i) => (
              <button className="fcard" key={item.id}>
                <div
                  className="fcard-photo"
                  style={{ backgroundImage: `url(${photo(brand.images.feature[i], 900)})` }}
                />
                <div className="fcard-top">
                  {i === 0 && (
                    <span className="glass-pill">
                      {brand.vertical === 'restaurant' ? 'Most ordered' : 'Most booked'}
                    </span>
                  )}
                  {item.duration && <span className="glass-pill">{item.duration}</span>}
                </div>
                <div className="fcard-body">
                  <div className="fcard-name">{item.name}</div>
                  <p className="fcard-desc">{item.description}</p>
                  <div className="fcard-foot">
                    <span className="fcard-price">{money(item.price, brand.currency)}</span>
                    <span className="fcard-cta">
                      {brand.vertical === 'restaurant' ? 'Add to order' : 'Book'}
                      <Icon name="arrowRight" size={13} />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="list">
            {rest.map((i) => (
              <div className="list-row" key={i.id}>
                <span>
                  <span className="list-name">{i.name}</span>
                  <span className="list-note" style={{ display: 'block' }}>
                    {i.duration ? `${i.duration} · ` : ''}
                    {i.tags.slice(0, 2).join(' · ')}
                  </span>
                </span>
                <span className="list-lead" />
                <span className="list-price">{money(i.price, brand.currency)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- story ---------- */}
        <section className="story">
          <div
            className="story-photo"
            style={{ backgroundImage: `url(${photo(brand.images.story, 1000)})` }}
          />
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>
              {brand.story.eyebrow}
            </div>
            <h2>{brand.story.title}</h2>
            <p>{brand.story.body}</p>
            <div className="story-points">
              {brand.story.points.map((p, i) => (
                <div className="story-point" key={p}>
                  <b>{String(i + 1).padStart(2, '0')}</b>
                  {p}
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="sitefoot">
          <span className="mark">{brand.name}</span>
          <span className="meta">
            {brand.address}, {brand.district} · {brand.phone}
          </span>
        </footer>
      </div>
    </div>
  );
}
