import { lookup } from './lookup';

/** Every exported icon, keyed by the entry id in its file name (SwordBronze.webp -> SwordBronze). */
const files = import.meta.glob<string>('../assets/icons/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

const urls = new Map<string, string>(
  Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.webp'.length), url]),
);

/** The entry whose icon stands for this id: creatures and bosses use their trophy. */
function iconId(id: string): string {
  if (lookup.creature(id)) return lookup.trophyOf(id) ?? id;
  const boss = lookup.boss(id);
  if (boss) return boss.trophy ?? id;
  return id;
}

/** URL of the icon for an item, station, creature or boss, or undefined if there is none. */
export function iconUrl(id: string): string | undefined {
  return urls.get(iconId(id));
}
