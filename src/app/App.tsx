import { lazy, Suspense, useEffect, useState } from 'react';
import { HashRouter, Link, NavLink, Route, Routes } from 'react-router';
import { gameData } from '../data/load';
import { ChecklistPage } from '../features/checklist/ChecklistPage';
import { FavoritesPage } from '../features/checklist/FavoritesPage';
import { BuildingPage } from '../features/browse/BuildingPage';
import { BossesPage, CreaturesPage, FoodPage, TrophiesPage } from '../features/browse/BrowsePages';
import { ProgressionPage } from '../features/progression/ProgressionPage';
import { PlannerPage } from '../features/planner/PlannerPage';
import { UpgradePage } from '../features/upgrades/UpgradePage';
import { ComparePage } from '../features/compare/ComparePage';
import { FoodOptimizerPage } from '../features/food/FoodOptimizerPage';
import { AdvisorPage } from '../features/advisor/AdvisorPage';
import { RankingsPage } from '../features/rankings/RankingsPage';
import { CharacterPage } from '../features/save/CharacterPage';
import { CommandsPage } from '../features/commands/CommandsPage';
import { SkillsPage } from '../features/skills/SkillsPage';
import { UpdateLogPage } from '../features/updates/UpdateLogPage';
import { PlacesPage } from '../features/places/PlacesPage';
import { TrustPage } from '../features/trust/TrustPage';
import { PortalsPage } from '../features/portals/PortalsPage';
import { WorldPage } from '../features/world/WorldPage';
import { SpotCheckPage } from '../features/spotcheck/SpotCheckPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { ProfileSwitcher } from './ProfileSwitcher';
import { SecondScreenToggle } from './SecondScreenToggle';
import { CreaturePage, StationPage } from '../features/items/EntityPage';
import { ItemPage } from '../features/items/ItemPage';
import { ComfortPage } from '../features/comfort/ComfortPage';
import { PiecePage } from '../features/comfort/PiecePage';
import { ItemsPage } from '../features/items/ItemsPage';
import { RecipesPage } from '../features/items/RecipesPage';
import { CommandPalette } from '../features/search/CommandPalette';
import { SearchPage } from '../features/search/SearchPage';
import { EntityIcon } from '../components/EntityIcon';
import { QuickInfo } from './QuickInfo';
import { BackupNudge } from './BackupNudge';
import { MobileTabs } from './MobileTabs';
import { ROUTE_GROUPS, ROUTES } from './routes';
import styles from './App.module.css';

function ComingSoon({ label, phase }: { label: string; phase: number }) {
  return (
    <section className={styles.panel}>
      <h1>{label}</h1>
      <p>Coming in Phase {phase}.</p>
    </section>
  );
}

function NotFound() {
  return (
    <section className={styles.panel}>
      <h1>Page not found</h1>
      <p>
        Lost in the Black Forest: there is nothing at this address. Try the search box above, or go
        back to the <Link to="/">start page</Link>.
      </p>
    </section>
  );
}

/** Routes that already have a real page; the rest show a placeholder. */
// The graph library is large, so it loads only when the page is opened.
const GraphPage = lazy(() =>
  import('../features/graph/GraphPage').then((m) => ({ default: m.GraphPage })),
);

const PAGES: Record<string, React.ReactElement> = {
  '/': <SearchPage />,
  '/items': <ItemsPage />,
  '/comfort': <ComfortPage />,
  '/portals': <PortalsPage />,
  '/world': <WorldPage />,
  '/recipes': <RecipesPage />,
  '/progression': <ProgressionPage />,
  '/building': <BuildingPage />,
  '/trophies': <TrophiesPage />,
  '/bosses': <BossesPage />,
  '/creatures': <CreaturesPage />,
  '/food': <FoodPage />,
  '/optimizer': <FoodOptimizerPage />,
  '/rankings': <RankingsPage />,
  '/planner': <PlannerPage />,
  '/graph': (
    <Suspense fallback={<p>Loading the graph…</p>}>
      <GraphPage />
    </Suspense>
  ),
  '/upgrades': <UpgradePage />,
  '/compare': <ComparePage />,
  '/checklist': <ChecklistPage />,
  '/next': <AdvisorPage />,
  '/favorites': <FavoritesPage />,
  '/character': <CharacterPage />,
  '/places': <PlacesPage />,
  '/skills': <SkillsPage />,
  '/commands': <CommandsPage />,
  '/spotcheck': <SpotCheckPage />,
  '/trust': <TrustPage />,
  '/updates': <UpdateLogPage />,
  '/profile': <ProfilePage />,
};

/** A small round shield with a rune, drawn here so the site needs no game art for its logo. */
function BrandMark() {
  return (
    <svg
      className={styles.brandMark}
      viewBox="0 0 32 32"
      width="30"
      height="30"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="16" cy="16" r="14.5" fill="#3b2a1c" stroke="#d3a73b" strokeWidth="2" />
      <circle
        cx="16"
        cy="16"
        r="10.5"
        fill="none"
        stroke="#a97142"
        strokeWidth="1"
        strokeDasharray="2 2.2"
      />
      <path
        d="M10 9 L22 23 M22 9 L10 23 M16 7 V25"
        stroke="#e6d7b2"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

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
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          <BrandMark />
          Valheim Companion
        </Link>
        <input
          className={styles.search}
          type="search"
          readOnly
          placeholder="Search"
          aria-label="Open search"
          onClick={() => setPaletteOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setPaletteOpen(true);
            }
          }}
        />
        <SecondScreenToggle />
        <ProfileSwitcher />
      </header>
      <nav className={styles.nav} aria-label="Main">
        {ROUTE_GROUPS.map((g) => (
          <div key={g.id} className={styles.group} role="group" aria-label={g.title || 'Start'}>
            {g.title && (
              <span className={styles.groupTitle} aria-hidden="true">
                {g.title}
              </span>
            )}
            {g.routes.map((r) => (
              <NavLink
                key={r.path}
                to={r.path}
                end
                className={({ isActive }) => (isActive ? styles.active : undefined)}
              >
                <EntityIcon id={r.icon} size={22} />
                <span>{r.label}</span>
                {r.beta && (
                  <span className={styles.beta} title="Beta: newer and less checked">
                    <span className={styles.betaText}>beta</span>
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
        <p className={styles.dataInfo}>
          <span className={styles.beta} aria-hidden="true" /> beta: newer, less checked
          <br />
          <br />
          Data: {gameData.meta.gameVersion}
          <br />
          Reviewed {gameData.meta.lastReviewed}
        </p>
      </nav>
      <main id="main" className={styles.main}>
        <BackupNudge />
        <Routes>
          {ROUTES.map((r) => (
            <Route
              key={r.path}
              path={r.path}
              element={PAGES[r.path] ?? <ComingSoon label={r.label} phase={r.phase} />}
            />
          ))}
          <Route path="/progression/:biome" element={<ProgressionPage />} />
          <Route path="/item/:id" element={<ItemPage />} />
          <Route path="/creature/:id" element={<CreaturePage />} />
          <Route path="/boss/:id" element={<CreaturePage boss />} />
          <Route path="/station/:id" element={<StationPage />} />
          <Route path="/piece/:id" element={<PiecePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <QuickInfo />
      <footer className={styles.dataInfoMobile}>
        Data: {gameData.meta.gameVersion}, reviewed {gameData.meta.lastReviewed}
      </footer>
      <MobileTabs onSearch={() => setPaletteOpen(true)} />
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
