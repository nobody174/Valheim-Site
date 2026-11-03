import type { Armor } from '../../data/schemas';

export interface ArmorSet {
  key: string;
  name: string;
  pieces: Armor[];
}

const SLOT_ORDER = ['helmet', 'chest', 'legs', 'cape'];

/** "ArmorAshlandsMediumlegs" and "HelmetAshlandsMediumHood" both give "AshlandsMedium". */
function setKey(armor: Armor): string {
  const key = armor.item
    .replace(/^(Armor|Helmet|Cape)/, '')
    .replace(/(Chest|Legs|legs|Cuirass|Greaves|Hood)(?=_|$)/, '');
  return key === 'TrollHide' ? 'TrollLeather' : key;
}

const words = (key: string) => key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');

/** Armor grouped into the sets a player thinks in (helmet, chest, legs and cape of one material). Singles are left out. */
export function armorSets(all: readonly Armor[]): ArmorSet[] {
  const groups = new Map<string, Armor[]>();
  for (const a of all) groups.set(setKey(a), [...(groups.get(setKey(a)) ?? []), a]);
  return [...groups]
    .filter(([, pieces]) => pieces.length > 1)
    .map(([key, pieces]) => ({
      key,
      name: words(key),
      pieces: [...pieces].sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot)),
    }));
}
