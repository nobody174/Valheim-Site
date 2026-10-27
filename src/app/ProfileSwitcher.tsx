import { Link } from 'react-router';
import { appStore, useApp } from '../state/store';
import styles from './App.module.css';

/** Active-profile picker in the header. Managing profiles lives on /profile. */
export function ProfileSwitcher() {
  const order = useApp((s) => s.order);
  const active = useApp((s) => s.active);
  const profiles = useApp((s) => s.profiles);
  return (
    <div className={styles.profile}>
      <select
        aria-label="Active profile"
        value={active}
        onChange={(e) => appStore.getState().switchProfile(e.target.value)}
      >
        {order.map((id) => (
          <option key={id} value={id}>
            {profiles[id].name}
          </option>
        ))}
      </select>
      <Link
        to="/profile"
        aria-label="Manage profiles and backups"
        title="Manage profiles and backups"
      >
        ⚙
      </Link>
    </div>
  );
}
