import { Icon } from '../Icon';
import { Motif } from '../art/Motif';
import type { Brand, CatalogItem } from '../../lib/types';
import { cx, money } from '../../lib/utils';

/* ==========================================================================
   Inner pages.

   Everything here is rendered from the same brand data the backend sends to
   the model as context — the catalog, the people, the hours, the published
   answers. Nothing is written twice, so the site and the assistant cannot
   drift: if a page says £180, that is because the catalog says £180, and the
   model is reading the same row.
   ========================================================================== */

export type Route =
  | { kind: 'home' }
  | { kind: 'catalog'; only?: string; title: string; blurb: string }
  | { kind: 'shop'; only: string; title: string; blurb: string }
  | { kind: 'people'; title: string; blurb: string }
  | { kind: 'visiting'; title: string; blurb: string }
  | { kind: 'journal'; title: string; blurb: string }
  | { kind: 'story'; title: string; blurb: string };

/** Maps a nav label onto a page. Labels come from brand.nav. */
export function routeFor(brand: Brand, label: string): Route {
  const l = label.toLowerCase();
  /* The blurb is the category's note, never its name — the name is already the
     page title, and printing it twice is what made these pages read like a
     placeholder. */
  const note = (id: string, fallback: string) =>
    brand.categories.find((c) => c.id === id)?.note ?? fallback;

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
    return {
      kind: 'catalog',
      only: 'wine',
      title: 'Wine list',
      blurb: note('wine', 'The full list, by the glass and by the bottle.'),
    };
  }
  if (l === 'retail') {
    return {
      kind: 'shop',
      only: 'retail',
      title: label,
      blurb: note('retail', 'What we use in the studio, to take home.'),
    };
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

/* --- Opening hours ---------------------------------------------------------- */

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Today's row in the opening-hours table — a single day or a range covering it. */
export function todayRow(brand: Brand) {
  const dow = new Date().getDay();
  return (
    brand.hours.find((h) => h.day === DAYS[dow]) ??
    brand.hours.find((h) => {
      const [from, to] = h.day.split(' – ');
      if (!to) return false;
      const a = DAYS.indexOf(from);
      const b = DAYS.indexOf(to);
      return a > -1 && b > -1 && dow >= a && dow <= b;
    }) ??
    null
  );
}

/** Whether the doors are open today, and until when. */
export function openToday(brand: Brand) {
  const row = todayRow(brand);
  if (!row || row.hours === 'Closed') return { open: false, label: 'Closed today', row };
  return { open: true, label: `Until ${row.hours.split(' – ')[1]}`, row };
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

/* --- Shop --------------------------------------------------------------------
   Retail is the one catalog that is not a list of things you order at a table,
   so it gets cards with their own artwork rather than a menu with price
   leaders. Same catalog rows, same prices — only the layout changes.
   ----------------------------------------------------------------------------- */

export function ShopView({ brand, only, dark }: { brand: Brand; only: string; dark: boolean }) {
  const items = brand.catalog.filter((i) => i.categoryId === only && i.available);
  const category = brand.categories.find((c) => c.id === only);

  if (!items.length) {
    return <p className="meta">Nothing in stock right now — ask us and we will order it in.</p>;
  }

  return (
    <div className="shop">
      <div className="shop-grid">
        {items.map((item) => (
          <article className="shop-card" key={item.id}>
            <div className="shop-art">
              <Motif hue={item.hue} seed={item.id} size={400} round={false} dark={dark} radius={0} />
              {item.popular && <span className="shop-flag">Popular</span>}
            </div>
            <div className="shop-body">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="shop-tags">
                {item.tags.map((t) => (
                  <span className="tagchip" key={t}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="shop-foot">
                <span className="shop-price">{money(item.price, brand.currency)}</span>
                <button className="shop-add">
                  <Icon name="bag" size={13} />
                  Add to bag
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {category?.note && (
        <p className="shop-note">
          <Icon name="truck" size={14} />
          {category.note}
        </p>
      )}
    </div>
  );
}

/* --- People ------------------------------------------------------------------ */

export function PeopleView({ brand, dark }: { brand: Brand; dark: boolean }) {
  /* The rota decides who the site lists — take someone off in the console and
     they come off the page as well. */
  const team = brand.people.filter((p) => p.available !== false);

  if (!brand.people.length) {
    return <p className="meta">No named staff — bookings sit against the business.</p>;
  }
  return (
    <div className="team-grid">
      {team.map((p) => (
        <article className="team-card" key={p.id}>
          <Motif hue={p.hue} seed={p.id + p.name} size={72} dark={dark} />
          <h3>{`${p.title} ${p.name}`.trim()}</h3>
          <div className="team-role">{p.role}</div>
          <p>{p.bio}</p>
          <div className="team-foot">
            {/* Somebody who joined the rota this morning has no score, and a
                bold 0.0 would read as a bad one. */}
            {p.reviews > 0 ? (
              <span className="team-rate">
                <Icon name="star" size={12} strokeWidth={1.8} />
                {p.rating.toFixed(1)}
                <span>({p.reviews})</span>
              </span>
            ) : (
              <span className="team-rate is-new">New</span>
            )}
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

export function VisitingView({ brand, photoUrl }: { brand: Brand; photoUrl: string }) {
  const today = openToday(brand);
  /* Getting-here answers first, then whatever else is published — only one of
     the three brands has enough of the former to fill a column, and these are
     the same live entries the assistant answers from either way. */
  const live = brand.faq.filter((f) => f.status === 'live');
  const isAccess = (f: (typeof live)[number]) =>
    f.category === 'Visiting' || /park|step-free|wheelchair|access|nearest|get here/i.test(f.q);
  const asked = [...live.filter(isAccess), ...live.filter((f) => !isAccess(f))].slice(0, 3);
  const tel = `tel:${brand.phone.replace(/[^\d+]/g, '')}`;

  return (
    <div className="visit">
      {/* The home page opens on a photograph, so this page does too — same
          layers, same facts rail, a third of the height. */}
      <section className="visit-hero">
        <div className="hero-photo" style={{ backgroundImage: `url(${photoUrl})` }} />
        <div className="hero-tint" />
        <div className="hero-scrim" />

        <div className="visit-hero-inner">
          <div className="hero-eyebrow">
            <i />
            {brand.kind}
          </div>
          <h2>{brand.legal}</h2>
          <div className="hero-cta">
            <button className="btn btn-lg btn-light">
              <Icon name="route" size={15} />
              Directions
            </button>
            <a className="btn btn-lg btn-glass" href={tel}>
              <Icon name="phone" size={15} />
              {brand.phone}
            </a>
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
              {today.row && <small>{today.row.day}</small>}
            </div>
          </div>
          {brand.hero.stats.map((s) => (
            <div className="fact" key={s.label}>
              <div className="fact-label">{s.label}</div>
              <div className="fact-value">{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="visit-grid">
        <div className="visit-main">
          <section className="visit-block">
            <div className="eyebrow">Opening hours</div>
            <div className="hours-table">
              {brand.hours.map((h) => (
                <div
                  className={cx(
                    'hours-row',
                    h.hours === 'Closed' && 'shut',
                    h === today.row && 'is-today',
                  )}
                  key={h.day}
                >
                  <span>
                    {h.day}
                    {h === today.row && <em>Today</em>}
                  </span>
                  <i />
                  <b>{h.hours}</b>
                </div>
              ))}
            </div>
          </section>

          {asked.length > 0 && (
            <section className="visit-block">
              <div className="eyebrow">Before you come</div>
              <div className="qa-list">
                {asked.map((f) => (
                  <div className="qa" key={f.id}>
                    <h4>{f.q}</h4>
                    <p>{f.a}</p>
                    <span className="qa-src">
                      <Icon name="book" size={11} />
                      {f.source}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="visit-side">
          <div className="visit-card">
            <div className="eyebrow">Address</div>
            <p className="visit-addr">
              {brand.address}
              <br />
              {brand.district}
            </p>
            <div className="visit-lines">
              <a className="visit-link" href={tel}>
                <Icon name="phone" size={14} />
                {brand.phone}
              </a>
              <span className="visit-link is-static">
                <Icon name="pin" size={14} />
                {brand.district}
              </span>
            </div>
            <button className="btn btn-primary visit-directions">
              <Icon name="external" size={14} />
              Open in maps
            </button>
          </div>
        </aside>
      </div>
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
