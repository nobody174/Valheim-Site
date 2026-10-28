import { useState } from 'react';
import { loadDisplay, saveDisplay, type ListView } from '../state/display';
import styles from './ViewToggle.module.css';

/** Cards or table for a list page; the choice is remembered for every list. */
export function useListView(): [ListView, (view: ListView) => void] {
  const [view, setView] = useState<ListView>(() => loadDisplay().view);
  return [
    view,
    (next) => {
      setView(next);
      saveDisplay({ ...loadDisplay(), view: next });
    },
  ];
}

export function ViewToggle({ view, onChange }: { view: ListView; onChange: (view: ListView) => void }) {
  return (
    <div className={styles.toggle} role="group" aria-label="Show as">
      {(['cards', 'list'] as const).map((v) => (
        <button key={v} type="button" aria-pressed={view === v} onClick={() => onChange(v)}>
          {v === 'cards' ? 'Cards' : 'List'}
        </button>
      ))}
    </div>
  );
}
