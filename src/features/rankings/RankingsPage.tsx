import { useSearchParams } from 'react-router';
import { ArmorRankings } from './ArmorRankings';
import { WeaponRankings } from './WeaponRankings';
import styles from './Rankings.module.css';

const TABS = [
  { key: 'weapons', label: 'Weapons' },
  { key: 'armor', label: 'Armor' },
] as const;

/** Weapon and armor rankings. The tab lives in the URL; each tab keeps its own filters there too. */
export function RankingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'armor' ? 'armor' : 'weapons';

  return (
    <section>
      <h1>Rankings</h1>
      <div className={styles.tabs} role="tablist" aria-label="Rankings">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            className={styles.tab}
            aria-selected={tab === t.key}
            // Switching tab starts that tab with clean filters.
            onClick={() => setParams(t.key === 'weapons' ? {} : { tab: t.key }, { replace: true })}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'armor' ? <ArmorRankings /> : <WeaponRankings />}
    </section>
  );
}
