import { HOARD_OPTIONS } from '../../components/Badges';
import type { Item } from '../../data/schemas';
import { favoriteKindOf, hasFlag, PROGRESS_FLAGS, type ProgressFlag } from '../../state/model';
import { useApp, useProfile } from '../../state/store';
import styles from './Items.module.css';

const FLAG_LABEL: Record<ProgressFlag, string> = {
  collected: 'Collected',
  crafted: 'Crafted',
  completed: 'Completed',
  farmed: 'Farmed',
};

export function FavoriteStar({
  kind,
  id,
  label,
}: {
  kind: 'materials' | 'recipes' | 'gear';
  id: string;
  label: string;
}) {
  const profile = useProfile();
  const toggle = useApp((s) => s.toggleFavorite);
  const on = profile.favorites[kind].includes(id);
  return (
    <button
      type="button"
      className={on ? `${styles.star} ${styles.starOn}` : styles.star}
      aria-pressed={on}
      aria-label={`${on ? 'Remove from' : 'Add to'} favorites: ${label}`}
      title={on ? 'Remove from favorites' : 'Add to favorites'}
      onClick={() => toggle(kind, id)}
    >
      {on ? '★' : '☆'}
    </button>
  );
}

/** Favorite, progress toggles and hoard override for the active profile. */
export function ItemActions({ item }: { item: Item }) {
  const profile = useProfile();
  const toggleFlag = useApp((s) => s.toggleFlag);
  const setOverride = useApp((s) => s.setHoardOverride);
  const override = profile.hoardOverrides[item.id];

  return (
    <section className={styles.section} aria-label="Your progress">
      <h2>
        Your progress <span className={styles.dim}>({profile.name})</span>
      </h2>
      <div className={styles.toggles}>
        <FavoriteStar kind={favoriteKindOf(item.category)} id={item.id} label={item.name} />
        {PROGRESS_FLAGS.map((flag) => {
          const on = hasFlag(profile, item.id, flag);
          return (
            <button
              key={flag}
              type="button"
              className={on ? `${styles.toggle} ${styles.toggleOn}` : styles.toggle}
              aria-pressed={on}
              onClick={() => toggleFlag(item.id, flag)}
            >
              {on ? '✓ ' : ''}
              {FLAG_LABEL[flag]}
            </button>
          );
        })}
      </div>
      <label className={styles.override}>
        Keep, stock up or throw away?
        <select
          value={override ?? ''}
          onChange={(e) => setOverride(item.id, (e.target.value || null) as Item['hoard'] | null)}
        >
          <option value="">Default</option>
          {HOARD_OPTIONS.map(([value, name]) => (
            <option key={value} value={value}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <p className={styles.dim}>
        The default is a suggestion. Pick your own if you disagree; it is saved for this profile.
      </p>
      {override && (
        <button type="button" className={styles.reset} onClick={() => setOverride(item.id, null)}>
          Reset to default
        </button>
      )}
    </section>
  );
}
