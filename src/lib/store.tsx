import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { BRANDS } from './brands';
import type { Brand, BrandId, CatalogItem, FaqEntry, Person, Scheme } from './types';

/* A tiny store so the console and the widget share one source of truth:
   change a price in the admin and the chat quotes the new one. */

export type AdminPage =
  | 'overview'
  | 'inbox'
  | 'ledger'
  | 'catalog'
  | 'rota'
  | 'knowledge'
  | 'settings';

interface StoreValue {
  brandId: BrandId;
  brand: Brand;
  scheme: Scheme;
  /** Lifted out of the console so the command palette can navigate. */
  page: AdminPage;
  setPage: (p: AdminPage) => void;
  setBrandId: (id: BrandId) => void;
  setScheme: (s: Scheme) => void;
  updateItem: (id: string, patch: Partial<CatalogItem>) => void;
  createItem: () => CatalogItem;
  deleteItem: (id: string) => void;
  updateFaq: (id: string, patch: Partial<FaqEntry>) => void;
  updatePerson: (id: string, patch: Partial<Person>) => void;
  /** Brings a locum onto the rota mid-week. Returns the created row. */
  createPerson: (init: Pick<Person, 'name' | 'title' | 'role' | 'focus' | 'bio'>) => Person;
}

const Store = createContext<StoreValue | null>(null);

type Catalogs = Record<BrandId, CatalogItem[]>;
type Faqs = Record<BrandId, FaqEntry[]>;
type Teams = Record<BrandId, Person[]>;

const seedCatalogs = (): Catalogs =>
  Object.fromEntries(
    Object.entries(BRANDS).map(([k, b]) => [k, b.catalog.map((i) => ({ ...i }))]),
  ) as Catalogs;

const seedFaqs = (): Faqs =>
  Object.fromEntries(
    Object.entries(BRANDS).map(([k, b]) => [k, b.faq.map((f) => ({ ...f }))]),
  ) as Faqs;

/* Everyone starts on the rota; the console is what takes them off it. */
const seedTeams = (): Teams =>
  Object.fromEntries(
    Object.entries(BRANDS).map(([k, b]) => [k, b.people.map((p) => ({ available: true, ...p }))]),
  ) as Teams;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [brandId, setBrandIdRaw] = useState<BrandId>('lumiere');
  const [page, setPage] = useState<AdminPage>('overview');
  const [scheme, setScheme] = useState<Scheme>(BRANDS.lumiere.scheme);
  const [catalogs, setCatalogs] = useState<Catalogs>(seedCatalogs);
  const [faqs, setFaqs] = useState<Faqs>(seedFaqs);
  const [teams, setTeams] = useState<Teams>(seedTeams);

  /* Switching brand also switches to that brand's natural scheme — part of
     the pitch is that each vertical arrives already dressed. */
  const setBrandId = useCallback((id: BrandId) => {
    setBrandIdRaw(id);
    setScheme(BRANDS[id].scheme);
  }, []);

  const updateItem = useCallback(
    (id: string, patch: Partial<CatalogItem>) =>
      setCatalogs((c) => ({
        ...c,
        [brandId]: c[brandId].map((i) => (i.id === id ? { ...i, ...patch } : i)),
      })),
    [brandId],
  );

  const createItem = useCallback(() => {
    const base = BRANDS[brandId];
    const item: CatalogItem = {
      id: `new-${Date.now().toString(36)}`,
      name: '',
      categoryId: base.categories[0].id,
      price: 0,
      description: '',
      tags: [],
      duration: base.vertical === 'restaurant' ? undefined : '40 min',
      available: false,
      hue: Math.floor(Math.random() * 360),
      sold: 0,
    };
    setCatalogs((c) => ({ ...c, [brandId]: [item, ...c[brandId]] }));
    return item;
  }, [brandId]);

  const deleteItem = useCallback(
    (id: string) =>
      setCatalogs((c) => ({ ...c, [brandId]: c[brandId].filter((i) => i.id !== id) })),
    [brandId],
  );

  const updateFaq = useCallback(
    (id: string, patch: Partial<FaqEntry>) =>
      setFaqs((f) => ({
        ...f,
        [brandId]: f[brandId].map((x) => (x.id === id ? { ...x, ...patch } : x)),
      })),
    [brandId],
  );

  const updatePerson = useCallback(
    (id: string, patch: Partial<Person>) =>
      setTeams((t) => ({
        ...t,
        [brandId]: t[brandId].map((p) => (p.id === id ? { ...p, ...patch } : p)),
      })),
    [brandId],
  );

  const createPerson = useCallback(
    (init: Pick<Person, 'name' | 'title' | 'role' | 'focus' | 'bio'>) => {
      /* No rating yet, and that is the honest answer — the site hides the
         score until somebody has actually left one. */
      const person: Person = {
        id: `p-${Date.now().toString(36)}`,
        rating: 0,
        reviews: 0,
        next: 'Today',
        hue: Math.floor(Math.random() * 360),
        available: true,
        ...init,
      };
      setTeams((t) => ({ ...t, [brandId]: [...t[brandId], person] }));
      return person;
    },
    [brandId],
  );

  const brand = useMemo<Brand>(
    () => ({
      ...BRANDS[brandId],
      catalog: catalogs[brandId],
      faq: faqs[brandId],
      people: teams[brandId],
    }),
    [brandId, catalogs, faqs, teams],
  );

  const value = useMemo(
    () => ({
      brandId,
      brand,
      scheme,
      page,
      setPage,
      setBrandId,
      setScheme,
      updateItem,
      createItem,
      deleteItem,
      updateFaq,
      updatePerson,
      createPerson,
    }),
    [
      brandId,
      brand,
      scheme,
      page,
      setBrandId,
      updateItem,
      createItem,
      deleteItem,
      updateFaq,
      updatePerson,
      createPerson,
    ],
  );

  return <Store.Provider value={value}>{children}</Store.Provider>;
}

export function useStore() {
  const v = useContext(Store);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
