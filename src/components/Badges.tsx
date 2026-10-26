import type { Item } from '../data/schemas';
import styles from './Badges.module.css';

const VERIFIED_LABEL: Record<Item['verified'], string> = {
  unverified: 'Unverified',
  'cross-checked': 'Cross-checked',
  'in-game': 'Verified in game',
};

export function VerifiedBadge({ level, note }: { level: Item['verified']; note?: string }) {
  return (
    <span className={`${styles.badge} ${styles[`v_${level.replace('-', '_')}`]}`} title={note}>
      {VERIFIED_LABEL[level]}
    </span>
  );
}

const HOARD_LABEL: Record<Item['hoard'], string> = {
  must_keep: 'Must keep',
  keep_some: 'Keep some',
  safe_discard: 'Safe to discard',
  decorative: 'Decorative',
  sell: 'Sell',
};

export const HOARD_OPTIONS = Object.entries(HOARD_LABEL) as [Item['hoard'], string][];

export function HoardBadge({ hoard, qty }: { hoard: Item['hoard']; qty?: number | null }) {
  return (
    <span className={`${styles.badge} ${styles[`h_${hoard}`]}`}>
      {HOARD_LABEL[hoard]}
      {hoard === 'keep_some' && qty ? ` (${qty})` : ''}
    </span>
  );
}
