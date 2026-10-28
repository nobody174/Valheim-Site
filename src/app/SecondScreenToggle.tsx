import { useState } from 'react';
import { applyDisplay, loadDisplay, saveDisplay } from '../state/display';
import styles from './App.module.css';

/** Header button: larger type, tighter tables and no motion, for a second monitor. */
export function SecondScreenToggle() {
  const [on, setOn] = useState(() => {
    const display = loadDisplay();
    applyDisplay(display);
    return display.secondScreen;
  });

  return (
    <button
      type="button"
      className={styles.screenToggle}
      aria-pressed={on}
      title="Larger type, tighter tables and no motion, for a monitor beside the game"
      onClick={() => {
        const next = { secondScreen: !on };
        setOn(next.secondScreen);
        saveDisplay(next);
        applyDisplay(next);
      }}
    >
      Second screen
    </button>
  );
}
