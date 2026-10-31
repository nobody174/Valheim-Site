import { useState } from 'react';
import { useApp } from '../state/store';
import styles from './BackupNudge.module.css';

/** Download text as a file. Used for saved data the app could not read, so it is never lost. */
export function downloadText(name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Shown when saved data could not be read. The raw text is kept aside and can be downloaded. */
export function RescueBanner() {
  const rescued = useApp((s) => s.rescued);
  const [hidden, setHidden] = useState(false);
  if (hidden || rescued.length === 0) return null;
  return (
    <p role="alert" className={styles.nudge}>
      <span>
        Some saved data could not be read, so it was set aside untouched ({rescued.length}{' '}
        {rescued.length === 1 ? 'item' : 'items'}). Download it so nothing is lost.
      </span>
      <button
        type="button"
        onClick={() =>
          downloadText(
            `valheim-companion-unreadable-${new Date().toISOString().slice(0, 10)}.json`,
            JSON.stringify(
              rescued.map((r) => ({ id: r.id, key: r.key, raw: r.raw })),
              null,
              2,
            ),
          )
        }
      >
        Download raw data
      </button>
      <button type="button" onClick={() => setHidden(true)}>
        Hide
      </button>
    </p>
  );
}
