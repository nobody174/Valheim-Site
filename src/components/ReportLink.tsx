import { Link } from 'react-router';
import styles from './ReportLink.module.css';

/** A small link from a page to the correction note for it. */
export function ReportLink({ id }: { id: string }) {
  return (
    <Link className={styles.link} to={`/corrections?id=${encodeURIComponent(id)}`}>
      Report a wrong value
    </Link>
  );
}
