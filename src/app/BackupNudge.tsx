import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { backupDue, daysSinceBackup, snoozeBackup } from '../state/backup';
import { useGameChecks } from '../state/gameChecks';
import { useProfile } from '../state/store';
import styles from './BackupNudge.module.css';

/** A slim reminder to download a backup, shown only when there is something to lose and it is overdue. */
export function BackupNudge() {
  const profile = useProfile();
  const gameChecks = useGameChecks();
  const { pathname } = useLocation();
  const [hidden, setHidden] = useState(false);
  const hasData =
    profile.character !== undefined ||
    Object.keys(gameChecks).length > 0 ||
    Object.keys(profile.progress).length > 0 ||
    (profile.portals ?? []).length > 0 ||
    Object.keys(profile.notes).length > 0 ||
    profile.favorites.materials.length + profile.favorites.recipes.length + profile.favorites.gear.length > 0;

  if (hidden || !hasData || pathname === '/profile' || !backupDue()) return null;
  const days = daysSinceBackup();
  return (
    <p role="status" className={styles.nudge}>
      <span>
        {days === null ? 'You have not made a backup yet.' : `Your last backup was ${days} days ago.`} Your ticks, portals and notes live
        only in this browser.
      </span>
      <Link to="/profile">Back up now</Link>
      <button type="button" onClick={() => {
          snoozeBackup();
          setHidden(true);
        }}>
        Later
      </button>
    </p>
  );
}
