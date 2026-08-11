import { useEffect, useState } from 'react';
import { Icon } from '../Icon';
import { Motif } from '../art/Motif';
import {
  REFINEMENTS,
  TONES,
  copyChecks,
  draftDescriptions,
  refine,
  typeOut,
  type Refinement,
  type Tone,
} from '../../lib/ai';
import { useStore } from '../../lib/store';
import type { CatalogItem } from '../../lib/types';
import { cx } from '../../lib/utils';

/* The catalog editor. The half that matters is Saint Copy: an owner who
   cannot face writing forty descriptions gets three drafts in two seconds,
   and can still change every word. */

export function ItemEditor({ item, onClose }: { item: CatalogItem; onClose: () => void }) {
  const { brand, scheme, updateItem, deleteItem } = useStore();
  const [draft, setDraft] = useState<CatalogItem>(item);
  const [tone, setTone] = useState<Tone>('warm');
  const [variants, setVariants] = useState<string[]>([]);
  const [busy, setBusy] = useState<'draft' | Refinement | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (patch: Partial<CatalogItem>) => setDraft((d) => ({ ...d, ...patch }));

  const generate = async () => {
    setBusy('draft');
    setProblem(null);
    setVariants([]);
    try {
      const out = await draftDescriptions(
        { ...draft, name: draft.name || 'This item' },
        brand,
        tone,
        nonce,
      );
      setVariants(out);
      setNonce((n) => n + 1);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Could not write that.');
    } finally {
      setBusy(null);
    }
  };

  const useVariant = async (text: string) => {
    set({ description: '' });
    await typeOut(text, (partial) => set({ description: partial }));
  };

  const applyRefinement = async (how: Refinement) => {
    if (!draft.description.trim()) return;
    setBusy(how);
    setProblem(null);
    try {
      const next = await refine(draft.description, how, draft, brand);
      await useVariant(next);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Could not rewrite that.');
    } finally {
      setBusy(null);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    set({ tags: [...draft.tags, t] });
    setTagInput('');
  };

  const save = () => {
    updateItem(item.id, draft);
    onClose();
  };

  const checks = copyChecks(draft.description);
  const dirty = JSON.stringify(draft) !== JSON.stringify(item);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={`Edit ${item.name}`}>
        <header className="drawer-head">
          <Motif hue={draft.hue} seed={draft.id} size={40} round={false} dark={scheme === 'dark'} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{draft.name || `New ${brand.itemNoun}`}</h2>
            <div className="meta">
              {brand.categories.find((c) => c.id === draft.categoryId)?.name}
              {dirty && <span style={{ color: 'var(--warning)' }}> · unsaved</span>}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={17} />
          </button>
        </header>

        <div className="drawer-body scroll-area">
          {/* --- details --- */}
          <section className="fieldset">
            <div className="eyebrow">
              <Icon name="tag" size={12} />
              Details
            </div>
            <div className="stack-sm">
              <div>
                <label className="label" htmlFor="it-name">
                  Name
                </label>
                <input
                  id="it-name"
                  className="field"
                  value={draft.name}
                  placeholder={`e.g. ${brand.catalog[1]?.name ?? 'House special'}`}
                  onChange={(e) => set({ name: e.target.value })}
                />
              </div>

              <div className="two">
                <div>
                  <label className="label" htmlFor="it-cat">
                    Group
                  </label>
                  <select
                    id="it-cat"
                    className="field"
                    value={draft.categoryId}
                    onChange={(e) => set({ categoryId: e.target.value })}
                  >
                    {brand.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="it-price">
                    Price ({brand.currency})
                  </label>
                  <input
                    id="it-price"
                    className="field"
                    type="number"
                    min={0}
                    value={draft.price}
                    onChange={(e) => set({ price: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="two">
                <div>
                  <label className="label" htmlFor="it-dur">
                    Duration
                  </label>
                  <input
                    id="it-dur"
                    className="field"
                    value={draft.duration ?? ''}
                    placeholder="not timed"
                    onChange={(e) => set({ duration: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <label className="label">Artwork hue</label>
                  <input
                    className="field"
                    type="range"
                    min={0}
                    max={360}
                    value={draft.hue}
                    onChange={(e) => set({ hue: Number(e.target.value) })}
                    style={{ padding: 0, accentColor: 'var(--accent)' }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  paddingTop: 4,
                }}
              >
                <button
                  className={cx('switch', draft.available && 'on')}
                  role="switch"
                  aria-checked={draft.available}
                  onClick={() => set({ available: !draft.available })}
                />
                <div style={{ lineHeight: 1.3 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {draft.available ? 'Saint can sell this' : 'Hidden from Saint'}
                  </div>
                  <div className="meta" style={{ fontSize: 11 }}>
                    Turn it off and it disappears from chat immediately.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* --- description + Saint Copy --- */}
          <section className="fieldset">
            <div className="copy-head">
              <span className="spark">
                <Icon name="sparkle" size={14} />
              </span>
              <div style={{ flex: 1 }}>
                <b>Saint Copy</b>
                <span>Not sure what to write? Pick a tone and take one.</span>
              </div>
            </div>

            <textarea
              className="field"
              rows={4}
              value={draft.description}
              placeholder="Describe it in a sentence or two — or let Saint draft it."
              onChange={(e) => set({ description: e.target.value })}
            />

            <div className="checks">
              {checks.map((c) => (
                <span className={cx('check', c.ok ? 'ok' : 'bad')} key={c.label}>
                  <Icon name={c.ok ? 'checkCircle' : 'alert'} size={11} />
                  {c.label} · {c.note}
                </span>
              ))}
            </div>

            <div style={{ height: 1, background: 'var(--line-soft)', margin: '14px 0 13px' }} />

            <div className="tone-row">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  className={cx('tone', tone === t.id && 'on')}
                  onClick={() => setTone(t.id)}
                >
                  <b>{t.name}</b>
                  <span>{t.note}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              <button className="btn btn-sm btn-primary" onClick={generate} disabled={busy !== null}>
                {busy === 'draft' ? <span className="spinner" /> : <Icon name="wand" size={14} />}
                {busy === 'draft' ? 'Writing…' : variants.length ? 'Try three more' : 'Draft three options'}
              </button>
              {REFINEMENTS.map((r) => (
                <button
                  key={r.id}
                  className="btn btn-sm btn-ghost"
                  disabled={busy !== null || !draft.description.trim()}
                  onClick={() => applyRefinement(r.id)}
                >
                  {busy === r.id ? <span className="spinner" /> : null}
                  {r.label}
                </button>
              ))}
            </div>

            {problem && (
              <div className="copy-problem">
                <Icon name="alert" size={13} />
                {problem}
              </div>
            )}

            {variants.length > 0 && (
              <div className="variants">
                {variants.map((v, i) => (
                  <button className="variant" key={i} onClick={() => useVariant(v)}>
                    <span className="variant-tag">
                      <span className="pill pill-accent">Option {i + 1}</span>
                      <span className="variant-use">Use this →</span>
                    </span>
                    {v}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* --- tags --- */}
          <section className="fieldset">
            <div className="eyebrow">
              <Icon name="list" size={12} />
              {brand.tagNoun}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="field"
                value={tagInput}
                placeholder={brand.vertical === 'restaurant' ? 'e.g. Gluten' : 'e.g. Written plan'}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <button className="btn btn-ghost" onClick={addTag} disabled={!tagInput.trim()}>
                Add
              </button>
            </div>
            <div className="taglist">
              {draft.tags.map((t) => (
                <span className="tag-x" key={t}>
                  {t}
                  <button
                    onClick={() => set({ tags: draft.tags.filter((x) => x !== t) })}
                    aria-label={`Remove ${t}`}
                  >
                    <Icon name="close" size={11} />
                  </button>
                </span>
              ))}
              {!draft.tags.length && <span className="meta">None yet.</span>}
            </div>
          </section>
        </div>

        <footer className="drawer-foot">
          <button
            className="btn btn-sm btn-quiet"
            style={{ color: 'var(--danger)' }}
            onClick={() => {
              deleteItem(item.id);
              onClose();
            }}
          >
            <Icon name="trash" size={14} />
            Delete
          </button>
          <span style={{ flex: 1 }} />
          <button className="btn btn-sm btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-sm btn-primary" onClick={save} disabled={!dirty}>
            <Icon name="check" size={14} />
            Save changes
          </button>
        </footer>
      </aside>
    </>
  );
}
