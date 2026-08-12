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
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

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
  const available = brand.catalog.filter((i) => i.available);
  const featured = [...available].sort((a, b) => b.sold - a.sold).slice(0, 3);

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
