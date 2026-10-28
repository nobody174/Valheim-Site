export interface RouteDef {
  path: string;
  label: string;
  phase: number;
}

export const ROUTES: RouteDef[] = [
  { path: '/', label: 'Search', phase: 1 },
  { path: '/items', label: 'Items', phase: 2 },
  { path: '/recipes', label: 'Recipes', phase: 1 },
  { path: '/building', label: 'Building', phase: 2 },
  { path: '/progression', label: 'Progression', phase: 1 },
  { path: '/trophies', label: 'Trophies', phase: 2 },
  { path: '/bosses', label: 'Bosses', phase: 2 },
  { path: '/creatures', label: 'Creatures', phase: 2 },
  { path: '/food', label: 'Food', phase: 2 },
  { path: '/optimizer', label: 'Food optimizer', phase: 3 },
  { path: '/rankings', label: 'Rankings', phase: 3 },
  { path: '/planner', label: 'Planner', phase: 3 },
  { path: '/graph', label: 'Crafting graph', phase: 3 },
  { path: '/upgrades', label: 'Upgrades', phase: 3 },
  { path: '/compare', label: 'Compare', phase: 3 },
  { path: '/checklist', label: 'Checklist', phase: 1 },
  { path: '/next', label: 'Next steps', phase: 3 },
  { path: '/character', label: 'My character', phase: 5 },
  { path: '/favorites', label: 'Favorites', phase: 1 },
  { path: '/skills', label: 'Skills', phase: 5 },
  { path: '/commands', label: 'Console commands', phase: 5 },
  { path: '/updates', label: 'Update log', phase: 5 },
  { path: '/profile', label: 'Profile & data', phase: 1 },
];
