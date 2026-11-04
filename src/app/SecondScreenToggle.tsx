import { useState } from 'react';
import { applyDisplay, loadDisplay, saveDisplay, type Display } from '../state/display';
import styles from './App.module.css';

/** Header buttons ("Big text", then "Bigger"): larger type, tighter tables and no motion, for a second monitor. */
export function SecondScreenToggle() {
  const [display, setDisplay] = useState(() => {
    const loaded = loadDisplay();
    applyDisplay(loaded);
    return loaded;
  });

  const change = (patch: Partial<Display>) => {
    const next = { ...loadDisplay(), ...patch };
    if (!next.bigger) delete next.bigger;
    setDisplay(next);
    saveDisplay(next);
    applyDisplay(next);
  };

  return (
    <>
      <button
        type="button"
        className={styles.screenToggle}
        aria-pressed={display.secondScreen}
        title="Bigger text, tighter tables and no animations, easier to read from a second monitor while you play"
        onClick={() => change({ secondScreen: !display.secondScreen, bigger: false })}
      >
        Big text
      </button>
      {display.secondScreen && (
        <button
          type="button"
          className={styles.screenToggle}
          aria-pressed={display.bigger === true}
          title="Text at 125% instead of 112.5%"
          onClick={() => change({ bigger: !display.bigger })}
        >
          Bigger
        </button>
      )}
    </>
  );
}
