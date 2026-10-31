import type { Item } from './schemas';
import { describeEntity } from './describe';
import { graph, lookup } from './lookup';

/** One piece of a quick line: plain text, an entity to link, or a "+N more" that opens the full list. */
export type QuickPart = string | { id: string } | { more: number };

export interface QuickLine {
  parts: QuickPart[];
  /** True when the line is hand-written or from an unverified entry, so it must carry a small marker. */
  guide: boolean;
}

export interface QuickCard {
  farm?: QuickLine;
  usedFor?: QuickLine;
  make?: QuickLine;
}

export const HOARD_LABEL: Record<Item['hoard'], string> = {
  must_keep: 'Must keep',
  keep_some: 'Keep some',
  safe_discard: 'Safe to discard',
  consumable: 'Eat or drink',
  plantable: 'Plant it',
  gear: 'Gear',
  decorative: 'Decorative',
  sell: 'Sell',
};

const MAX_DROPS = 2;
const MAX_CRAFTED = 3;

function farmLine(item: Item, withBiome: boolean): QuickLine | undefined {
  const sources = graph.obtainedFrom(item.id).filter((s) => s.type !== 'recipe');
  const biome = withBiome ? lookup.biomeName(item.biome) : null;
  const prefix: QuickPart[] = biome ? [`${biome} · `] : [];

  const written = sources.find((s) => s.type !== 'drop');
  if (written) {
    const text = written.type === 'gather' ? written.node : written.note;
    const lead = written.type === 'trader' ? 'Buy: ' : '';
    return { parts: [...prefix, `${lead}${text}`], guide: true };
  }

  // Best chance first; a drop with no stated chance counts as certain.
  const chance = (creature: string) =>
    (lookup.creature(creature) ?? lookup.boss(creature))?.drops.find((d) => d.item === item.id)
      ?.chance ?? 1;
  const drops = sources
    .flatMap((s) => (s.type === 'drop' ? [s.creature] : []))
    .sort((a, b) => chance(b) - chance(a));
  if (drops.length === 0) return undefined;

  const parts: QuickPart[] = [...prefix, 'Dropped by '];
  drops.slice(0, MAX_DROPS).forEach((id, i) => parts.push(...(i ? [', '] : []), { id }));
  if (drops.length > MAX_DROPS) parts.push(' ', { more: drops.length - MAX_DROPS });
  return { parts, guide: item.verified === 'unverified' };
}

function usedForLine(item: Item): QuickLine | undefined {
  const equipment = lookup.weapon(item.id) || lookup.armor(item.id) || lookup.food(item.id);
  if (equipment) {
    const first = describeEntity(item.id)?.lines[0];
    if (first) return { parts: [first], guide: false };
  }

  const crafted = [...new Set(graph.usedIn(item.id).map((r) => r.output.item))].filter(
    (id) => id !== item.id,
  );
  if (crafted.length > 0) {
    const parts: QuickPart[] = [];
    crafted.slice(0, MAX_CRAFTED).forEach((id, i) => parts.push(...(i ? [', '] : []), { id }));
    if (crafted.length > MAX_CRAFTED) parts.push(' ', { more: crafted.length - MAX_CRAFTED });
    return { parts, guide: false };
  }

  const summons = lookup.summonsFor(item.id);
  if (summons.length > 0) {
    const parts: QuickPart[] = ['Summons '];
    summons.forEach((b, i) => parts.push(...(i ? [', '] : []), { id: b.id }));
    return { parts, guide: false };
  }

  if (item.use) return { parts: [item.use], guide: true };
  return undefined;
}

function makeLine(item: Item): QuickLine | undefined {
  const recipe = graph.recipesFor(item.id)[0];
  if (!recipe) return undefined;
  const parts: QuickPart[] = recipe.station ? [{ id: recipe.station.id }, ': '] : ['By hand: '];
  recipe.inputs.forEach((input, i) =>
    parts.push(...(i ? [', '] : []), `${input.qty} `, { id: input.item }),
  );
  return { parts, guide: item.verified === 'unverified' };
}

/** The three short lines a player needs: where to get it, what it is for, how to make it. Read-only. */
export function quickCard(itemId: string, options: { biome?: boolean } = {}): QuickCard {
  const item = lookup.item(itemId);
  if (!item) return {};
  const card: QuickCard = {};
  const farm = farmLine(item, options.biome ?? true);
  const usedFor = usedForLine(item);
  const make = makeLine(item);
  if (farm) card.farm = farm;
  if (usedFor) card.usedFor = usedFor;
  if (make) card.make = make;
  return card;
}

/** A line as plain text, for one-line summaries and tests. */
export function quickText(line: QuickLine | undefined): string {
  if (!line) return '';
  return line.parts
    .map((p) =>
      typeof p === 'string'
        ? p
        : 'id' in p
          ? (lookup.entity(p.id)?.name ?? p.id)
          : `+${p.more} more`,
    )
    .join('');
}

/** The one line shown on an item card: where to get materials and trophies, what the rest are for. */
export function summaryLine(itemId: string): QuickLine | undefined {
  const item = lookup.item(itemId);
  if (!item) return undefined;
  // The card already names the biome, so the line leaves it out.
  const card = quickCard(itemId, { biome: false });
  const rawFirst = item.category === 'material' || item.category === 'trophy';
  return rawFirst
    ? (card.farm ?? card.usedFor ?? card.make)
    : (card.usedFor ?? card.farm ?? card.make);
}
