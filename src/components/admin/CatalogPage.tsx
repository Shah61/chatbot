import { useState } from 'react';
import { Icon } from '../Icon';
import { Motif } from '../art/Motif';
import { ItemEditor } from './ItemEditor';
import { useStore } from '../../lib/store';
import { cx, money, nf } from '../../lib/utils';

export function CatalogPage() {
  const { brand, scheme, updateItem, createItem } = useStore();
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const dark = scheme === 'dark';
  const items = brand.catalog.filter(
    (i) =>
      (cat === 'all' || i.categoryId === cat) &&
      (q === '' || `${i.name} ${i.description}`.toLowerCase().includes(q.toLowerCase())),
  );

  const missing = brand.catalog.filter((i) => i.description.trim().length < 12).length;
  const offline = brand.catalog.filter((i) => !i.available).length;
  const item = brand.catalog.find((i) => i.id === editing) ?? null;

  return (
    <div className="stack">
      <div className="grid g3 stagger">
        <div className="panel stat">
          <Icon name="layers" size={88} strokeWidth={0.9} className="stat-ghost" />
          <div className="stat-label">
            <Icon name="layers" size={14} style={{ color: 'var(--ink-3)' }} />
            <span className="eyebrow">On the list</span>
          </div>
          <div className="stat-value">
            <span className="numeral">{brand.catalog.length}</span>
            <span className="unit">/ {brand.categories.length} groups</span>
          </div>
          <div className="meta" style={{ fontSize: 10.5 }}>
            {offline > 0 ? `${offline} hidden from Saint right now` : 'all live'}
          </div>
        </div>

        <div className="panel stat">
          <Icon name="trendUp" size={88} strokeWidth={0.9} className="stat-ghost" />
          <div className="stat-label">
            <Icon name="trendUp" size={14} style={{ color: 'var(--ink-3)' }} />
            <span className="eyebrow">Sold this month</span>
          </div>
          <div className="stat-value">
            <span className="numeral">{nf.format(brand.catalog.reduce((n, i) => n + i.sold, 0))}</span>
          </div>
          <div className="meta" style={{ fontSize: 10.5 }}>
            best: {[...brand.catalog].sort((a, b) => b.sold - a.sold)[0]?.name}
          </div>
        </div>

        <div className="panel stat">
          <Icon name="wand" size={88} strokeWidth={0.9} className="stat-ghost" />
          <div className="stat-label">
            <Icon name="wand" size={14} style={{ color: 'var(--ink-3)' }} />
            <span className="eyebrow">Needs copy</span>
          </div>
          <div className="stat-value">
            <span className="numeral">{missing}</span>
          </div>
          <div className="meta" style={{ fontSize: 10.5 }}>
            {missing ? 'Saint can draft these for you' : 'every entry has a description'}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>
              {brand.vertical === 'restaurant'
                ? 'The menu'
                : brand.vertical === 'clinic'
                  ? 'Treatments'
                  : 'Services & retail'}
            </h3>
            <p className="meta">
              Anything you change here, Saint quotes in the next message — price, wording and all.
            </p>
          </div>
          <div className="panel-acts">
            <div className="side-search" style={{ margin: 0, width: 190 }}>
              <Icon name="search" size={14} className="lead" />
              <input
                className="field"
                placeholder="Search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setEditing(createItem().id)}
            >
              <Icon name="plus" size={14} />
              New {brand.itemNoun}
            </button>
          </div>
        </div>

        <div className="panel-body" style={{ paddingTop: 0 }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
            <button className={cx('chip', cat === 'all' && 'on')} onClick={() => setCat('all')}>
              All
            </button>
            {brand.categories.map((c) => (
              <button
                key={c.id}
                className={cx('chip', cat === c.id && 'on')}
                onClick={() => setCat(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="cat-grid">
            {items.map((i) => {
              const thin = i.description.trim().length < 12;
              return (
                <div className="panel item-card" key={i.id}>
                  <div className="item-top">
                    <Motif hue={i.hue} seed={i.id} size={52} round={false} dark={dark} />
                    <div className="item-head">
                      <div className="item-name">{i.name || 'Untitled'}</div>
                      <div className="item-cat">
                        {brand.categories.find((c) => c.id === i.categoryId)?.name}
                        {i.duration ? ` · ${i.duration}` : ''}
                      </div>
                    </div>
                    <div className="item-price">{money(i.price, brand.currency)}</div>
                  </div>

                  <p className={cx('item-desc', thin && 'empty')}>
                    {thin ? 'No description yet — Saint can draft one.' : i.description}
                  </p>

                  <div className="item-foot">
                    {i.popular && <span className="pill pill-spot">Popular</span>}
                    <span>{nf.format(i.sold)} sold</span>
                    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        className={cx('switch', i.available && 'on')}
                        role="switch"
                        aria-checked={i.available}
                        aria-label={`${i.name} available`}
                        onClick={() => updateItem(i.id, { available: !i.available })}
                      />
                      <button className="btn btn-sm btn-ghost" onClick={() => setEditing(i.id)}>
                        <Icon name="pencil" size={13} />
                        Edit
                      </button>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {item && <ItemEditor item={item} onClose={() => setEditing(null)} />}
    </div>
  );
}
