import { Link } from 'react-router';
import { EntityIcon } from '../../components/EntityIcon';
import { lookup } from '../../data/lookup';
import { hasFlag } from '../../state/model';
import { useProfile } from '../../state/store';
import styles from './Search.module.css';

const TOOLS = [
  { to: '/next', label: 'Next steps', hint: 'What now?', icon: 'Wishbone' },
  { to: '/compare', label: 'Compare', hint: 'Which is better?', icon: 'ShieldBronzeBuckler' },
  { to: '/rankings', label: 'Rankings', hint: 'Best weapon and armor', icon: 'SwordIron' },
  { to: '/character', label: 'My character', hint: 'Read my save', icon: 'ArmorBronzeChest' },
  { to: '/places', label: 'Dungeons', hint: 'Where to explore', icon: 'CryptKey' },
];

/** One card per zone with its boss and how much of the zone the active profile has collected. */
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
          return (
            <Link key={b.id} to={`/progression/${b.id}`} className={styles.zoneCard} data-zone={b.id}>
              <span className={styles.zoneArt} aria-hidden="true">
                {boss && <EntityIcon id={boss.id} size={52} />}
              </span>
              <span className={styles.zoneName}>{b.name}</span>
              <span className={styles.zoneMeta}>{boss ? `Boss: ${boss.name}` : 'No boss'}</span>
              <progress
                className={styles.zoneProgress}
                value={got}
                max={Math.max(1, inZone.length)}
                aria-label={`${b.name}: ${got} of ${inZone.length} items collected`}
              />
              <span className={styles.zoneCount}>
                {got === 0 ? (
                  <>Not started</>
                ) : (
                  <>
                    <strong>{got}</strong> / {inZone.length} found
                  </>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

/** The rest of the tools, shown inside the folded shortcuts. */
export function ZoneTools() {
  return (
    <>
      <h2 className={styles.sectionTitle}>Handy tools</h2>
      <div className={styles.tools}>
        {TOOLS.map((t) => (
          <Link key={t.to} to={t.to} className={styles.tool}>
            <EntityIcon id={t.icon} size={40} />
            <span className={styles.toolText}>
              <span className={styles.toolName}>{t.label}</span>
              <span className={styles.zoneMeta}>{t.hint}</span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
