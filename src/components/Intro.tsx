import type { ReactNode } from 'react';
import styles from './Intro.module.css';

/**
 * The explanation at the top of a page, folded away so the page opens on the content, not on a
 * paragraph. One click opens it.
 */
export function Intro({ children, title = 'About this page' }: { children: ReactNode; title?: string }) {
  return (
    <details className={styles.intro}>
      <summary>
        <span className={styles.mark} aria-hidden="true">
          ?
        </span>
        {title}
      </summary>
      <div className={styles.body}>{children}</div>
    </details>
  );
}
