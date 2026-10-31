import { HOARD_LABEL } from '../data/quick';
import type { Item } from '../data/schemas';
import styles from './Badges.module.css';

const VERIFIED_LABEL: Record<Item['verified'], string> = {
  unverified: 'Guide, not checked',
  'cross-checked': 'From game files',
  'in-game': 'Seen in game',
};

export function VerifiedBadge({ level, note }: { level: Item['verified']; note?: string }) {
  return (
    <span className={`${styles.badge} ${styles[`v_${level.replace('-', '_')}`]}`} title={note}>
      {VERIFIED_LABEL[level]}
    </span>
  );
}

export const HOARD_OPTIONS = Object.entries(HOARD_LABEL) as [Item['hoard'], string][];

export function HoardBadge({
  hoard,
  qty,
  custom,
}: {
  hoard: Item['hoard'];
  qty?: number | null;
  custom?: boolean;
}) {
  return (
    <span
      className={`${styles.badge} ${styles[`h_${hoard}`]}`}
      title={custom ? 'You changed this from the default' : undefined}
    >
      {HOARD_LABEL[hoard]}
      {hoard === 'keep_some' && qty ? ` (${qty})` : ''}
      {custom ? ' · custom' : ''}
    </span>
  );
}

/** Marks one hand-written value (a source line, a summon cost) that was not read from the game files. */
export function GuideTag() {
  return (
    <span className={styles.guide} title="Written by hand from guides; not checked in game">
      guide, not checked
    </span>
  );
}
