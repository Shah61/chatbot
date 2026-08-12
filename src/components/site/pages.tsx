import { Icon } from '../Icon';
import { Motif } from '../art/Motif';
import type { Brand, CatalogItem } from '../../lib/types';
import { money } from '../../lib/utils';

/* ==========================================================================
   Inner pages.

   Everything here is rendered from the same brand data the backend sends to
   the model as context — the catalog, the people, the hours, the published
   answers. Nothing is written twice, so the site and the assistant cannot
   drift: if a page says RM 320, that is because the catalog says RM 320, and the
   model is reading the same row.
   ========================================================================== */

export type Route =
  | { kind: 'home' }
  | { kind: 'catalog'; only?: string; title: string; blurb: string }
  | { kind: 'people'; title: string; blurb: string }
  | { kind: 'visiting'; title: string; blurb: string }
  | { kind: 'journal'; title: string; blurb: string }
  | { kind: 'story'; title: string; blurb: string };

/** Maps a nav label onto a page. Labels come from brand.nav. */
export function routeFor(brand: Brand, label: string): Route {
  const l = label.toLowerCase();
  const cat = (id: string) => brand.categories.find((c) => c.id === id)?.name ?? label;

  if (l === 'menu' || l === 'treatments' || l === 'services') {
    return {
      kind: 'catalog',
      title: label,
      blurb:
        brand.vertical === 'restaurant'
          ? 'Everything the kitchen is sending out, and what it costs.'
          : 'Every appointment we offer, how long it takes and what you pay.',
    };
  }
  if (l === 'wine list') {
    return { kind: 'catalog', only: 'wine', title: 'Wine list', blurb: cat('wine') };
  }
  if (l === 'retail') {
    return { kind: 'catalog', only: 'retail', title: 'Retail', blurb: cat('retail') };
  }
  if (l === 'our team' || l === 'stylists') {
    return {
      kind: 'people',
      title: label,
      blurb: `Who you will be seeing, and what each of them is best at.`,
    };
  }
  if (l === 'visiting' || l === 'find us') {
    return { kind: 'visiting', title: label, blurb: 'Hours, address, access and how to reach us.' };
  }
  if (l === 'journal') {
    return {
      kind: 'journal',
      title: 'Journal',
      blurb: 'Everything we have published — and the same answers Saint gives in chat.',
    };
  }
  return { kind: 'story', title: label, blurb: brand.story.eyebrow };
}

/* --- Page furniture --------------------------------------------------------- */

export function PageHead({ title, blurb }: { title: string; blurb: string }) {
  return (
    <header className="page-head">
      <div className="eyebrow">{blurb}</div>
      <h1>{title}</h1>
    </header>
  );
}

/* --- Catalog ---------------------------------------------------------------- */

export function CatalogView({
  brand,
  only,
  dark,
}: {
  brand: Brand;
  only?: string;
  dark: boolean;
}) {
  const cats = brand.categories.filter((c) => (only ? c.id === only : true));

  return (
    <div className="menu-list">
      {cats.map((cat) => {
        const items = brand.catalog.filter((i) => i.categoryId === cat.id && i.available);
        if (!items.length) return null;
        return (
          <section className="menu-sec" key={cat.id}>
            <div className="menu-sec-head">
              <h2>{cat.name}</h2>
              <span className="meta">{cat.note}</span>
            </div>
            <div className="menu-rows">
              {items.map((i) => (
                <MenuRow key={i.id} item={i} brand={brand} dark={dark} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MenuRow({ item, brand, dark }: { item: CatalogItem; brand: Brand; dark: boolean }) {
  return (
    <article className="menu-row">
      <Motif hue={item.hue} seed={item.id} size={54} round={false} dark={dark} />
      <div className="menu-main">
        <div className="menu-top">
          <h3>{item.name}</h3>
          <span className="menu-dots" />
          <span className="menu-price">{money(item.price, brand.currency)}</span>
        </div>
        <p>{item.description}</p>
        <div className="menu-tags">
          {item.duration && (
            <span className="tagchip">
              <Icon name="clock" size={10} />
              {item.duration}
            </span>
          )}
          {item.tags.map((t) => (
            <span className="tagchip" key={t}>
              {t}
            </span>
          ))}
          {item.popular && <span className="tagchip is-hot">Popular</span>}
        </div>
      </div>
    </article>
  );
}

/* --- People ------------------------------------------------------------------ */

export function PeopleView({ brand, dark }: { brand: Brand; dark: boolean }) {
  if (!brand.people.length) {
    return <p className="meta">No named staff — bookings sit against the business.</p>;
  }
  return (
    <div className="team-grid">
      {brand.people.map((p) => (
        <article className="team-card" key={p.id}>
          <Motif hue={p.hue} seed={p.id + p.name} size={72} dark={dark} />
          <h3>{`${p.title} ${p.name}`.trim()}</h3>
          <div className="team-role">{p.role}</div>
          <p>{p.bio}</p>
          <div className="team-foot">
            <span className="team-rate">
              <Icon name="star" size={12} strokeWidth={1.8} />
              {p.rating.toFixed(1)}
              <span>({p.reviews})</span>
            </span>
            <span className="team-next">
              <Icon name="clock" size={12} />
              {p.next}
            </span>
          </div>
          <div className="team-does">
            {p.focus.map((f) => (
              <span className="tagchip" key={f}>
                {brand.categories.find((c) => c.id === f)?.name ?? f}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

/* --- Visiting ----------------------------------------------------------------- */

export function VisitingView({ brand }: { brand: Brand }) {
  const access = brand.faq.filter(
    (f) => f.status === 'live' && /visit|access|park|find|hour/i.test(`${f.category} ${f.source} ${f.q}`),
  );

  return (
    <div className="visit-grid">
      <div className="visit-main">
        <section className="visit-block">
          <div className="eyebrow">Opening hours</div>
          <div className="hours-table">
            {brand.hours.map((h) => (
              <div className={`hours-row${h.hours === 'Closed' ? ' shut' : ''}`} key={h.day}>
                <span>{h.day}</span>
                <i />
                <b>{h.hours}</b>
              </div>
            ))}
          </div>
        </section>

        {access.length > 0 && (
          <section className="visit-block">
            <div className="eyebrow">Getting here</div>
            {access.map((f) => (
              <div className="qa" key={f.id}>
                <h4>{f.q}</h4>
                <p>{f.a}</p>
              </div>
            ))}
          </section>
        )}
      </div>

      <aside className="visit-side">
        <div className="visit-card">
          <div className="eyebrow">Address</div>
          <p className="visit-addr">
            {brand.legal}
            <br />
            {brand.address}
            <br />
            {brand.district}
          </p>
          <a className="visit-link" href={`tel:${brand.phone.replace(/\s/g, '')}`}>
            <Icon name="phone" size={14} />
            {brand.phone}
          </a>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>
            <Icon name="external" size={14} />
            Directions
          </button>
        </div>
      </aside>
    </div>
  );
}

/* --- Journal ------------------------------------------------------------------ */

export function JournalView({ brand }: { brand: Brand }) {
  const posts = brand.faq.filter((f) => f.status !== 'draft');
  return (
    <div className="journal">
      {posts.map((f) => (
        <article className="post" key={f.id}>
          <div className="post-meta">
            <span className="tagchip">{f.category}</span>
            <span className="meta">{f.updated}</span>
          </div>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
          <div className="post-src">
            <Icon name="book" size={11} />
            {f.source}
          </div>
        </article>
      ))}
    </div>
  );
}

/* --- Story -------------------------------------------------------------------- */

export function StoryView({ brand, photoUrl }: { brand: Brand; photoUrl: string }) {
  return (
    <div className="story-page">
      <div className="story-photo" style={{ backgroundImage: `url(${photoUrl})` }} />
      <div>
        <h2 className="story-h">{brand.story.title}</h2>
        <p className="story-p">{brand.story.body}</p>
        <div className="story-points">
          {brand.story.points.map((p, i) => (
            <div className="story-point" key={p}>
              <b>{String(i + 1).padStart(2, '0')}</b>
              {p}
            </div>
          ))}
        </div>
        <div className="story-cta">
          <button className="btn btn-primary btn-lg">
            {brand.hero.cta}
            <Icon name="arrowRight" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
