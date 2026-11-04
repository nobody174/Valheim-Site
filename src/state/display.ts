/**
 * How the site is shown on this device: second-screen mode ("Big text") makes type larger, tables
 * tighter and turns motion off; `view` is whether lists show as cards or as a table. Stored in this
 * browser only (not in a profile), and the site works when storage is blocked.
 */
const KEY = 'vcs:v1:display';

export type ListView = 'cards' | 'list';

export interface Display {
  secondScreen: boolean;
  /** A further step up (125%) while second-screen mode is on. */
  bigger?: boolean;
  view: ListView;
}

const DEFAULT: Display = { secondScreen: false, view: 'cards' };

export function loadDisplay(): Display {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as { secondScreen?: unknown; bigger?: unknown; view?: unknown };
    const secondScreen = parsed.secondScreen === true;
    return {
      secondScreen,
      ...(secondScreen && parsed.bigger === true ? { bigger: true } : {}),
      view: parsed.view === 'list' ? 'list' : 'cards',
    };
  } catch {
    return DEFAULT;
  }
}

export function saveDisplay(display: Display): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(display));
  } catch {
    // Blocked storage: the setting just lasts until the page closes.
  }
}

/** Put the setting on the page, where the stylesheet reads it. */
export function applyDisplay(display: Display): void {
  document.documentElement.dataset.screen = !display.secondScreen
    ? 'normal'
    : display.bigger
      ? 'bigger'
      : 'second';
}
