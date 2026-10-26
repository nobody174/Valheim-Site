import { HashRouter, NavLink, Route, Routes } from 'react-router';
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

export function App() {
  return (
    <HashRouter>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.brand}>Valheim Companion</span>
          <input
            className={styles.search}
            type="search"
            placeholder="Search (coming in Phase 1)"
            disabled
            aria-label="Search"
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
        </nav>
        <main className={styles.main}>
          <Routes>
            {ROUTES.map((r) => (
              <Route
                key={r.path}
                path={r.path}
                element={<ComingSoon label={r.label} phase={r.phase} />}
              />
            ))}
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
