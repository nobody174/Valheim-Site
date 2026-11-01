import { Link } from 'react-router';
import { gameData } from '../data/load';
import styles from './SiteFooter.module.css';

/** The foot of every page: what the data is, how fresh it is, and a fan-project notice. */
export function SiteFooter() {
  const { gameVersion, lastReviewed } = gameData.meta;
  return (
    <footer className={styles.footer}>
      <nav aria-label="About the data" className={styles.links}>
        <Link to="/trust">Data trust</Link>
        <Link to="/updates">What&apos;s new</Link>
        <Link to="/corrections">Report a wrong value</Link>
        <Link to="/profile">Profile and data</Link>
      </nav>
      <p>
        Data: {gameVersion}, reviewed {lastReviewed}.
      </p>
      <p className={styles.dim}>
        A fan project, not affiliated with Iron Gate AB or Coffee Stain Publishing. Valheim and its
        game art belong to their owners.
      </p>
    </footer>
  );
}
