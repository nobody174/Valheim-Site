import type { Item } from '../data/schemas';
import { iconUrl } from '../data/icons';
import { lookup } from '../data/lookup';
import { CategoryGlyph } from './CategoryGlyph';
import styles from './EntityIcon.module.css';

/** Category used for the fallback glyph when an id has no exported icon. */
function fallbackCategory(id: string): Item['category'] {
  const item = lookup.item(id);
  if (item) return item.category;
  return lookup.station(id) || lookup.piece(id) ? 'piece' : 'misc';
}

/**
 * The in-game icon for an item, station, creature or boss (creatures use their trophy), or the
 * generated category glyph when none was exported. Decorative: the name is always shown next to it.
 */
export function EntityIcon({ id, size = 24 }: { id: string; size?: number }) {
  const url = iconUrl(id);
  if (!url) {
    return (
      <span className={styles.icon} style={{ width: size, height: size }}>
        <CategoryGlyph category={fallbackCategory(id)} size={size} />
      </span>
    );
  }
  return (
    <img
      className={styles.icon}
      src={url}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      decoding="async"
    />
  );
}
