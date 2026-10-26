import MiniSearch from 'minisearch';
import type { GameData } from '../../data/schemas';

export type SearchGroupKey = 'items' | 'trophies' | 'creatures' | 'bosses' | 'stations';

export const GROUP_LABELS: Record<SearchGroupKey, string> = {
  items: 'Items',
  trophies: 'Trophies',
  creatures: 'Creatures',
  bosses: 'Bosses',
  stations: 'Stations',
};

const GROUP_ORDER: SearchGroupKey[] = ['items', 'trophies', 'creatures', 'bosses', 'stations'];

export interface SearchDoc {
  key: string; // unique across groups
  id: string;
  name: string;
  group: SearchGroupKey;
  aliases: string;
  tags: string;
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
  ): SearchDoc => ({
    key: `${group}:${id}`,
    id,
    name,
    group,
    aliases: aliases.join(' '),
    tags: tags.join(' '),
  });
  return [
    ...data.items.map((i) =>
      doc(i.category === 'trophy' ? 'trophies' : 'items', i.id, i.name, i.aliases, i.tags),
    ),
    ...data.creatures.map((c) => doc('creatures', c.id, c.name)),
    ...data.bosses.map((b) => doc('bosses', b.id, b.name)),
    ...data.stations.map((s) => doc('stations', s.id, s.name)),
  ];
}

/** In-memory MiniSearch index, built once. Fuzzy + prefix, name boosted over aliases and tags. */
export function createSearch(data: GameData) {
  const docs = buildDocs(data);
  const index = new MiniSearch<SearchDoc>({
    idField: 'key',
    fields: ['name', 'id', 'aliases', 'tags'],
    storeFields: ['id', 'name', 'group', 'aliases', 'tags'],
    searchOptions: {
      boost: { name: 3, id: 1.5 },
      prefix: true,
      fuzzy: (term) => (term.length > 4 ? 0.2 : false),
      combineWith: 'AND',
    },
  });
  index.addAll(docs);

  /** Hits grouped by category, best first inside each group. `limit` applies per group. */
  return (query: string, limit = 8): SearchGroup[] => {
    const q = query.trim();
    if (!q) return [];
    const hits = index.search(q) as unknown as (SearchDoc & { score: number })[];
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
}
