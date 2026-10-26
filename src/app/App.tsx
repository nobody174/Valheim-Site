import { useEffect, useState } from 'react';
import { HashRouter, NavLink, Route, Routes } from 'react-router';
import { gameData } from '../data/load';
import { CreaturePage, StationPage } from '../features/items/EntityPage';
import { ItemPage } from '../features/items/ItemPage';
import { ItemsPage } from '../features/items/ItemsPage';
import { CommandPalette } from '../features/search/CommandPalette';
import { SearchPage } from '../features/search/SearchPage';
import { ROUTES } from './routes';
import styles from './App.module.css';

function ComingSoon({ label, phase }: { label: string; phase: number }) {
  return (
    <section className={styles.panel}>
      <h1>{label}</h1>
      <p>Coming in Phase {phase}.</p>
    </section>
  );
}

/** Routes that already have a real page; the rest show a placeholder. */
const PAGES: Record<string, React.ReactElement> = {
  '/': <SearchPage />,
  '/items': <ItemsPage />,
};

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

function Shell() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (e.key === '/' && !isTyping(e.target) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.brand}>Valheim Companion</span>
        <input
          className={styles.search}
          type="search"
          readOnly
          placeholder="Search (Ctrl+K or /)"
          aria-label="Open search"
          onFocus={() => setPaletteOpen(true)}
          onClick={() => setPaletteOpen(true)}
        />
      </header>
      <nav className={styles.nav} aria-label="Main">
        {ROUTES.map((r) => (
          <NavLink
            key={r.path}
            to={r.path}
            end
            className={({ isActive }) => (isActive ? styles.active : undefined)}
          >
            {r.label}
          </NavLink>
        ))}
        <p className={styles.dataInfo}>
          Data: {gameData.meta.gameVersion}
          <br />
          Reviewed {gameData.meta.lastReviewed}
        </p>
      </nav>
      <main className={styles.main}>
        <Routes>
          {ROUTES.map((r) => (
            <Route
              key={r.path}
              path={r.path}
              element={PAGES[r.path] ?? <ComingSoon label={r.label} phase={r.phase} />}
            />
          ))}
          <Route path="/item/:id" element={<ItemPage />} />
          <Route path="/creature/:id" element={<CreaturePage />} />
          <Route path="/boss/:id" element={<CreaturePage boss />} />
          <Route path="/station/:id" element={<StationPage />} />
          <Route path="*" element={<ComingSoon label="Not found" phase={0} />} />
        </Routes>
      </main>
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
