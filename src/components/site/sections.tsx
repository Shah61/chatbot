import { Icon } from '../Icon';
import { map, useInView, usePinned, useProgress } from '../../lib/scroll';
import type { Brand } from '../../lib/types';
import { cx, money } from '../../lib/utils';

/* ==========================================================================
   Home sections.

   Each one is driven by scroll position rather than a static layout: a
   photograph grows out of a thumbnail, images drift past a headline at
   different speeds, a sequence pins while its steps advance. All of it
   collapses to a plain stacked document under prefers-reduced-motion.
   ========================================================================== */

const photo = (id: string, w = 1600) =>
  id.startsWith('photo-')
    ? `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`
    : `https://unsplash.com/photos/${id}/download?force=true&w=${w}`;

const JOURNEY_HEAD: Record<Brand['vertical'], { eyebrow: string; title: string; body: string }> = {
  restaurant: {
    eyebrow: 'From wok to table',
    title: 'Fast enough for tonight. Made like it matters.',
    body: 'Every order follows the same four beats, whether you are dining in or getting dinner delivered across KL.',
  },
  clinic: {
    eyebrow: 'Your visit',
    title: 'Good care should feel clear from the start.',
    body: 'A calm, transparent path from first question to follow-up, with the same team looking after the details.',
  },
  salon: {
    eyebrow: 'In the chair',
    title: 'A better result begins before the first cut.',
    body: 'Consultation, technique and aftercare designed around your hair, your routine and Malaysian weather.',
  },
};

/* The home now borrows the restrained editorial language of the inner pages:
   fine rules, useful details, generous type and one strong image at a time. */
export function HomeStory({ brand }: { brand: Brand }) {
  return (
    <section className="home-story shell">
      <header className="home-section-head">
        <div className="eyebrow">{brand.story.eyebrow}</div>
        <h2>{brand.story.title}</h2>
      </header>

      <div className="home-story-grid">
        <figure
          className="home-story-photo"
          style={{ backgroundImage: `url(${photo(brand.images.story, 1500)})` }}
        >
          <figcaption>
            <span>{brand.kind}</span>
            <b>{brand.district}</b>
          </figcaption>
        </figure>

        <div className="home-story-copy">
          <p>{brand.story.body}</p>
          <div className="home-story-points">
            {brand.story.points.map((point, index) => (
              <div className="home-story-point" key={point}>
                <b>{String(index + 1).padStart(2, '0')}</b>
                <span>{point}</span>
              </div>
            ))}
          </div>

          <div className="home-proof">
            {brand.proof.map((item) => (
              <div key={item.label}>
                <b>{item.value}</b>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeJourney({ brand }: { brand: Brand }) {
  const lead = JOURNEY_HEAD[brand.vertical];
  const shots = [
    brand.images.feature[0],
    brand.images.feature[1],
    brand.images.feature[2],
    brand.images.hero,
  ];

  return (
    <section className="home-journey">
      <div className="shell">
        <header className="home-section-head is-split">
          <div>
            <div className="eyebrow">{lead.eyebrow}</div>
            <h2>{lead.title}</h2>
          </div>
          <p>{lead.body}</p>
        </header>

        <div className="home-journey-grid">
          {brand.process.map((step, index) => (
            <article className="home-journey-card" key={step.title}>
              <figure style={{ backgroundImage: `url(${photo(shots[index], 900)})` }}>
                <span>{String(index + 1).padStart(2, '0')}</span>
              </figure>
              <div>
                <h3>{step.title}</h3>
                <p>{step.note}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeVisit({
  brand,
  onVisit,
}: {
  brand: Brand;
  onVisit: (e: React.MouseEvent) => void;
}) {
  const visitTitle =
    brand.vertical === 'restaurant'
      ? 'Come hungry. We will handle the rest.'
      : brand.vertical === 'clinic'
        ? 'Everything you need before your visit.'
        : 'Your next good hair day starts in Bangsar.';

  return (
    <section className="home-visit">
      <div className="home-visit-copy">
        <div className="eyebrow">Plan your visit</div>
        <h2>{visitTitle}</h2>
        <p>
          {brand.address}, {brand.district}. Call us on {brand.phone}, or let Saint help now.
        </p>
        <button className="btn btn-lg btn-primary" onClick={onVisit}>
          {brand.vertical === 'restaurant' ? 'Find us' : 'Visiting details'}
          <Icon name="arrowRight" size={15} />
        </button>
      </div>

      <div className="home-visit-hours">
        <div className="eyebrow">Opening hours</div>
        {brand.hours.map((row) => (
          <div className="home-hours-row" key={row.day}>
            <span>{row.day}</span>
            <i />
            <b>{row.hours}</b>
          </div>
        ))}
      </div>

      <aside className="home-address-card">
        <span className="eyebrow">Kuala Lumpur</span>
        <Icon name="pin" size={22} />
        <strong>{brand.legal}</strong>
        <p>
          {brand.address}
          <br />
          {brand.district}
        </p>
        <a href={`tel:${brand.phone.replace(/\s/g, '')}`}>
          <Icon name="phone" size={13} />
          {brand.phone}
        </a>
      </aside>
    </section>
  );
}

/* --- 1. Philosophy — images drift past a headline --------------------------- */

export function Philosophy({ brand }: { brand: Brand }) {
  const [ref, p] = useProgress<HTMLElement>();

  /* Each photograph travels at its own rate, and two of them cross in front
     of the type while one stays behind it. */
  const drift = (from: number, to: number) => map(p, 0.05, 0.85, from, to);

  return (
    <section className="phil" ref={ref}>
      <div className="phil-inner">
        <div className="eyebrow phil-eyebrow">{brand.story.eyebrow}</div>
        <h2 className="phil-h">
          {brand.story.title.split(' ').slice(0, 4).join(' ')}{' '}
          <em>{brand.story.title.split(' ').slice(4).join(' ')}</em>
        </h2>

        <figure
          className="phil-img is-a"
          style={{
            backgroundImage: `url(${photo(brand.images.feature[0], 700)})`,
            transform: `translate3d(${drift(-120, 30)}px, ${drift(70, -60)}px, 0)`,
            opacity: map(p, 0.05, 0.3, 0, 1),
          }}
        />
        <figure
          className="phil-img is-b"
          style={{
            backgroundImage: `url(${photo(brand.images.feature[1], 700)})`,
            transform: `translate3d(${drift(140, -30)}px, ${drift(90, -40)}px, 0)`,
            opacity: map(p, 0.12, 0.38, 0, 1),
          }}
        />
        <figure
          className="phil-img is-c"
          style={{
            backgroundImage: `url(${photo(brand.images.feature[2], 700)})`,
            transform: `translate3d(-50%, ${drift(160, -30)}px, 0)`,
            opacity: map(p, 0.2, 0.46, 0, 1),
          }}
        />
      </div>
    </section>
  );
}

/* --- 2. Craft — a thumbnail that grows to full bleed ------------------------- */

export function Craft({ brand }: { brand: Brand }) {
  const [ref, p] = useProgress<HTMLElement>();

  /* 0.18 → 0.62 of the travel does the growing; after that the type inverts. */
  const grow = map(p, 0.16, 0.6, 0, 1);
  const wide = 26 + grow * 74; // % of the section width
  const tall = 30 + grow * 70;
  const radius = 14 - grow * 12;
  const inverted = grow > 0.72;

  return (
    <section className={cx('craft', inverted && 'is-full')} ref={ref}>
      {/* Everything pins for the run, so the type holds still while the
          photograph grows behind it. */}
      <div className="craft-pin">
      <div
        className="craft-photo"
        style={{
          width: `${wide}%`,
          height: `${tall}%`,
          borderRadius: `${radius}px`,
          backgroundImage: `url(${photo(brand.images.story, 1800)})`,
        }}
      >
        {/* Scrim rides with the photograph, so nothing outside it darkens. */}
        <span className="craft-scrim" style={{ opacity: grow }} />
      </div>

      <div className="craft-copy">
        <h2>{brand.story.title.split(',')[0]}</h2>
        <p style={{ opacity: map(p, 0.3, 0.5, 0, 1) }}>{brand.story.body}</p>
      </div>

      <div className="craft-proof" style={{ opacity: map(p, 0.44, 0.62, 0, 1) }}>
        {brand.proof.map((s) => (
          <div key={s.label}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}

/* --- 3. Process — a pinned 01/04 sequence ------------------------------------ */

export function Process({ brand }: { brand: Brand }) {
  const steps = brand.process;
  const [ref, , index] = usePinned<HTMLElement>(steps.length);
  const shots = [
    brand.images.feature[0],
    brand.images.feature[1],
    brand.images.feature[2],
    brand.images.story,
  ];

  return (
    <section className="proc" ref={ref} style={{ height: `${steps.length * 78}vh` }}>
      <div className="proc-pin">
        <header className="proc-head">
          <div className="eyebrow">How it works</div>
          <h2>
            Informed decisions, <em>supported end to end</em>
          </h2>
        </header>

        <div className="proc-stage">
          <div className="proc-title">
            <h3>{steps[index].title}</h3>
            <span className="proc-count">
              {String(index + 1).padStart(2, '0')}
              <i>/{String(steps.length).padStart(2, '0')}</i>
            </span>
          </div>

          <div className="proc-frame">
            {shots.map((s, i) => (
              <figure
                key={s + i}
                className={cx('proc-shot', i === index && 'on')}
                style={{ backgroundImage: `url(${photo(s, 900)})` }}
              />
            ))}
          </div>

          <p className="proc-note">{steps[index].note}</p>
        </div>

        <div className="proc-rail">
          {steps.map((s, i) => (
            <span key={s.title} className={cx('proc-tick', i <= index && 'on')} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* --- 4. Featured — a plain reveal, so the eye gets a rest -------------------- */

export function Featured({
  brand,
  onAll,
}: {
  brand: Brand;
  onAll: (e: React.MouseEvent) => void;
}) {
  const [ref, seen] = useInView<HTMLElement>();
  const available = brand.catalog.filter(
    (i) => i.available && (brand.vertical !== 'salon' || i.categoryId !== 'retail'),
  );
  const categoryOrder =
    brand.vertical === 'restaurant'
      ? ['geprek', 'burgers', 'sides']
      : brand.vertical === 'clinic'
        ? ['general', 'derm', 'physio']
        : ['cut', 'colour', 'care'];
  const featured = categoryOrder.flatMap((categoryId) => {
    const item = available
      .filter((candidate) => candidate.categoryId === categoryId)
      .sort((a, b) => b.sold - a.sold)[0];
    return item ? [item] : [];
  });

  const lead =
    brand.vertical === 'restaurant'
      ? { eyebrow: 'Tonight', title: 'What the kitchen is doing well.', link: 'Full menu' }
      : brand.vertical === 'clinic'
        ? { eyebrow: 'Treatments', title: 'The appointments people book most.', link: 'All treatments' }
        : { eyebrow: 'Services', title: 'What the chairs are booked for.', link: 'Full price list' };

  return (
    <section className={cx('feat', seen && 'seen')} ref={ref}>
      <div className="feat-head">
        <div>
          <div className="eyebrow">{lead.eyebrow}</div>
          <h2>{lead.title}</h2>
        </div>
        <a className="feat-all" href="#all" onClick={onAll}>
          {lead.link}
          <Icon name="arrowRight" size={14} />
        </a>
      </div>

      <div className="feat-grid">
        {featured.map((item, i) => (
          <article className="feat-card" key={item.id} style={{ transitionDelay: `${i * 90}ms` }}>
            <div
              className="feat-photo"
              style={{ backgroundImage: `url(${photo(brand.images.feature[i], 900)})` }}
            />
            <div className="feat-body">
              <div className="feat-top">
                {i === 0 && (
                  <span className="feat-flag">
                    {brand.vertical === 'restaurant' ? 'Most ordered' : 'Most booked'}
                  </span>
                )}
                {item.duration && <span className="feat-flag is-quiet">{item.duration}</span>}
              </div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="feat-foot">
                <span className="feat-price">{money(item.price, brand.currency)}</span>
                <span className="feat-go">
                  {brand.vertical === 'restaurant' ? 'Add to order' : 'Book'}
                  <Icon name="arrowRight" size={13} />
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
