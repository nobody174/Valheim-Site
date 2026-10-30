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

const GROUP_ORDER: SearchGroupKey[] = [
  'items',
  'trophies',
  'creatures',
  'bosses',
  'stations',
  'pieces',
];

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

export function buildDocs(data: GameData): SearchDoc[] {
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
      doc(i.category === 'trophy' ? 'trophies' : 'items', i.id, i.name, i.aliases, i.tags),
    ),
    ...data.creatures.map((c) => doc('creatures', c.id, c.name, c.aliases)),
    ...data.bosses.map((b) => doc('bosses', b.id, b.name, b.aliases)),
    ...data.stations.map((s) => doc('stations', s.id, s.name)),
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
    fields: ['name', 'id', 'aliases', 'tags'],
    storeFields: ['id', 'name', 'group', 'aliases', 'tags', 'detail'],
    searchOptions: {
      boost: { name: 3, id: 1.5 },
      prefix: true,
      fuzzy,
      combineWith: 'AND',
    },
  });
  index.addAll(docs);

  /** Hits grouped by category, best first inside each group. `limit` applies per group. */
  const search = (query: string, limit = 8): SearchGroup[] => {
    const q = query.trim();
    if (!q) return [];
    let hits = index.search(q) as unknown as (SearchDoc & { score: number })[];
    if (hits.length === 0) {
      hits = index.search(q, { combineWith: 'OR' }) as unknown as (SearchDoc & { score: number })[];
    }
    const groups = new Map<SearchGroupKey, SearchDoc[]>();
    for (const h of hits) {
      const list = groups.get(h.group) ?? [];
      if (list.length < limit) list.push(h);
      groups.set(h.group, list);
    }
    return GROUP_ORDER.filter((g) => groups.has(g)).map((g) => ({
      group: g,
      label: GROUP_LABELS[g],
      hits: groups.get(g)!,
    }));
  };

  /** Names close to a query that found nothing, best first. Names only, no aliases. */
  const suggest = (query: string, count = 3): SearchDoc[] => {
    const q = query.trim();
    if (!q) return [];
    const hits = index.search(q, {
      fields: ['name'],
      fuzzy: suggestFuzzy,
      combineWith: 'OR',
    }) as unknown as SearchDoc[];
    return hits.slice(0, count);
  };

  return Object.assign(search, { suggest });
}
