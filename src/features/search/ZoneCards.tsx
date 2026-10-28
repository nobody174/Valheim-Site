import { Link } from 'react-router';
import { lookup } from '../../data/lookup';
import { hasFlag } from '../../state/model';
import { useProfile } from '../../state/store';
import styles from './Search.module.css';

const TOOLS = [
  { to: '/planner', label: 'Build planner', hint: 'Materials and a shopping list' },
  { to: '/next', label: 'Next steps', hint: 'What to craft or collect now' },
  { to: '/graph', label: 'Crafting graph', hint: 'What goes into what' },
  { to: '/compare', label: 'Compare', hint: 'Weapons or armor side by side' },
  { to: '/optimizer', label: 'Food optimizer', hint: 'The best three foods' },
  { to: '/rankings', label: 'Rankings', hint: 'Best weapon and armor' },
];

/** One card per zone with the boss and how much of the zone the active profile has collected. */
export function ZoneCards() {
  const profile = useProfile();
  const items = lookup.allItems();
  return (
    <>
      <h2 className={styles.sectionTitle}>Zones</h2>
      <div className={styles.zones}>
        {lookup.allBiomes().map((b) => {
          const inZone = items.filter((i) => i.biome === b.id);
          const got = inZone.filter((i) => hasFlag(profile, i.id, 'collected')).length;
          const boss = lookup.allBosses().find((x) => x.biome === b.id);
          const creatures = lookup.allCreatures().filter((c) => c.biome === b.id).length;
          return (
            <Link key={b.id} to={`/progression/${b.id}`} className={styles.zoneCard} data-zone={b.id}>
              <span className={styles.zoneName}>{b.name}</span>
              <span className={styles.zoneMeta}>
                {boss ? `Boss: ${boss.name}` : 'No boss'} · {creatures} creatures · {inZone.length} items
              </span>
              <progress
                className={styles.zoneProgress}
                value={got}
                max={Math.max(1, inZone.length)}
                aria-label={`${b.name}: ${got} of ${inZone.length} items collected`}
              />
              <span className={styles.zoneMeta}>
                {got} of {inZone.length} collected
              </span>
            </Link>
          );
        })}
      </div>

      <h2 className={styles.sectionTitle}>Tools</h2>
      <div className={styles.tools}>
        {TOOLS.map((t) => (
          <Link key={t.to} to={t.to} className={styles.tool}>
            <span className={styles.zoneName}>{t.label}</span>
            <span className={styles.zoneMeta}>{t.hint}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
