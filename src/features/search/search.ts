import MiniSearch from 'minisearch';
import type { GameData } from '../../data/schemas';

export type SearchGroupKey = 'items' | 'trophies' | 'creatures' | 'bosses' | 'stations' | 'pieces';

export const GROUP_LABELS: Record<SearchGroupKey, string> = {
  items: 'Items',
  trophies: 'Trophies',
  creatures: 'Creatures',
  bosses: 'Bosses',
  stations: 'Stations',
  pieces: 'Building pieces',
};

export interface SearchDoc {
  key: string; // unique across groups
  id: string;
  name: string;
  group: SearchGroupKey;
  aliases: string;
  tags: string;
  /** A short line shown beside the name, e.g. what a building piece is made at and what it adds. */
  detail?: string;
}

export interface SearchGroup {
  group: SearchGroupKey;
  label: string;
  hits: SearchDoc[];
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function buildDocs(data: GameData): SearchDoc[] {
  const biomeName = (id: string | null | undefined) => data.biomes.find((b) => b.id === id)?.name ?? '';
  const doc = (
    group: SearchGroupKey,
    id: string,
    name: string,
    aliases: string[] = [],
    tags: string[] = [],
    detail = '',
  ): SearchDoc => ({
    key: `${group}:${id}`,
    id,
    name,
    group,
    aliases: aliases.join(' '),
    tags: tags.join(' '),
    detail,
  });
  return [
    ...data.items.map((i) =>
      doc(
        i.category === 'trophy' ? 'trophies' : 'items',
        i.id,
        i.name,
        i.aliases,
        i.tags,
        [capital(i.category), biomeName(i.biome)].filter(Boolean).join(' · '),
      ),
    ),
    ...data.creatures.map((c) => doc('creatures', c.id, c.name, c.aliases, [], 'Creature')),
    ...data.bosses.map((b) => doc('bosses', b.id, b.name, b.aliases, [], 'Boss')),
    ...data.stations.map((s) => doc('stations', s.id, s.name, [], ['level', 'upgrade', 'extension'], 'Crafting station')),
    ...data.pieces.map((p) =>
      doc(
        'pieces',
        p.id,
        p.name,
        [],
        [p.category, p.comfortGroup ?? '', p.comfort ? 'comfort' : ''],
        [
          p.station ? `at ${data.stations.find((s) => s.id === p.station)?.name ?? p.station}` : '',
          p.comfort ? `comfort ${p.comfort}${p.comfortGroup ? ` · ${p.comfortGroup}` : ''}` : '',
        ]
          .filter(Boolean)
          .join(' · '),
      ),
    ),
  ];
}

/** Fuzzy matching starts at three letters; each match may differ by about a fifth of its length. */
const fuzzy = (term: string) => (term.length > 2 ? 0.2 : false);

/** Edit distance where swapping two neighbouring letters counts as one slip. */
function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, d[i - 2]![j - 2]! + 1);
      }
      d[i]![j] = v;
    }
  }
  return d[a.length]![b.length]!;
}

/** A suggestion must have a word within a quarter of its length of a word the player typed. */
const closeTo = (query: string, name: string) =>
  query
    .split(' ')
    .some((q) =>
      name
        .split(' ')
        .some((n) => q.length > 2 && editDistance(q, n) / Math.max(q.length, n.length) <= 0.25),
    );

/** Looser matching used only to suggest names when a search finds nothing. */
const suggestFuzzy = (term: string) => (term.length > 2 ? 0.34 : false);

/**
 * In-memory MiniSearch index, built once. Fuzzy + prefix, name boosted over aliases and tags.
 * Every word must match; if that finds nothing, any word may match, best score first.
 * `search.suggest(query)` gives up to three names to offer when both found nothing.
 */
export function createSearch(data: GameData) {
  const docs = buildDocs(data);
  const index = new MiniSearch<SearchDoc>({
    idField: 'key',
    fields: ['name', 'aliases', 'tags'],
    storeFields: ['key', 'id', 'name', 'group', 'aliases', 'tags', 'detail'],
    searchOptions: {
      boost: { name: 3 },
      weights: { fuzzy: 0.3, prefix: 0.9 },
      prefix: true,
      fuzzy,
      combineWith: 'AND',
    },
  });
  index.addAll(docs);

  type Scored = SearchDoc & { score: number };
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  const EXACT_NAME = 1000;
  const NAME_STARTS_WITH = 5;

  /** Hits grouped by category: the group holding the best match first, best first inside each group. */
  const search = (query: string, limit = 8): SearchGroup[] => {
    const q = query.trim();
    if (!q) return [];
    let found = index.search(q) as unknown as Scored[];
    if (found.length === 0) found = index.search(q, { combineWith: 'OR' }) as unknown as Scored[];
    const nq = norm(q);
    const hits = found
      .map((h) => {
        const n = norm(h.name);
        return {
          ...h,
          score: h.score + (n === nq ? EXACT_NAME : n.startsWith(nq) ? NAME_STARTS_WITH : 0),
        };
      })
      .sort((a, b) => b.score - a.score);
    const groups = new Map<SearchGroupKey, SearchDoc[]>();
    for (const h of hits) {
      const list = groups.get(h.group) ?? [];
      if (list.length < limit) list.push(h);
      groups.set(h.group, list);
    }
    return [...groups].map(([group, list]) => ({ group, label: GROUP_LABELS[group], hits: list }));
  };

  /** Names close to a query that found nothing, best first. Names only, no aliases. */
  const suggest = (query: string, count = 3): SearchDoc[] => {
    const q = query.trim();
    if (!q) return [];
    const hits = index.search(q, {
      fields: ['name'],
      fuzzy: suggestFuzzy,
      combineWith: 'OR',
    }) as unknown as Scored[];
    const nq = norm(q);
    return hits.filter((h) => closeTo(nq, norm(h.name))).slice(0, count);
  };

  return Object.assign(search, { suggest });
}
