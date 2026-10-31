export interface RouteDef {
  path: string;
  label: string;
  phase: number;
  /** Id of the in-game icon shown beside the label (any item id with an exported icon). */
  icon: string;
  /** Where the menu shows it: always, under "More pages", or under "My game and data". */
  tier: 'main' | 'more' | 'owner';
}

export interface RouteGroup {
  id: string;
  title: string;
  routes: RouteDef[];
}

/** The ten pages a player reaches for most. Everything else sits one click away. */
const MAIN = new Set(['/', '/items', '/recipes', '/building', '/creatures', '/bosses', '/food', '/planner', '/next', '/checklist']);
/** Pages that read or hold the owner's own character, world and data. */
const OWNER = new Set(['/character', '/spotcheck', '/portals', '/world', '/profile']);

/** The sidebar, in the order a player reaches for things: look up, plan, track, reference. */
const RAW_GROUPS: { id: string; title: string; routes: Omit<RouteDef, 'tier'>[] }[] = [
  {
    id: 'start',
    title: '',
    routes: [{ path: '/', label: 'Home', phase: 1, icon: 'Torch' }],
  },
  {
    id: 'lookup',
    title: 'Look things up',
    routes: [
      { path: '/items', label: 'Items', phase: 2, icon: 'Wood' },
      { path: '/recipes', label: 'Recipes', phase: 1, icon: 'Flint' },
      { path: '/building', label: 'Building', phase: 2, icon: 'Stone' },
      { path: '/creatures', label: 'Creatures', phase: 2, icon: 'TrophyBoar' },
      { path: '/bosses', label: 'Bosses', phase: 2, icon: 'TrophyEikthyr' },
      { path: '/trophies', label: 'Trophies', phase: 2, icon: 'TrophyDeer' },
      { path: '/food', label: 'Food', phase: 2, icon: 'CookedMeat' },
      { path: '/skills', label: 'Skills', phase: 5, icon: 'SwordBronze' },
      { path: '/places', label: 'Places', phase: 5, icon: 'CryptKey' },
    ],
  },
  {
    id: 'plan',
    title: 'Plan & compare',
    routes: [
      { path: '/planner', label: 'Build planner', phase: 3, icon: 'Hammer' },
      { path: '/comfort', label: 'Comfort', phase: 3, icon: 'piece_bed02' },
      { path: '/upgrades', label: 'Upgrades', phase: 3, icon: 'PickaxeBronze' },
      { path: '/rankings', label: 'Rankings', phase: 3, icon: 'SwordIron' },
      { path: '/compare', label: 'Compare', phase: 3, icon: 'ShieldBronzeBuckler' },
      { path: '/optimizer', label: 'Food optimizer', phase: 3, icon: 'MeadHealthMinor' },
      { path: '/graph', label: 'Crafting graph', phase: 3, icon: 'Amber' },
    ],
  },
  {
    id: 'mygame',
    title: 'My game',
    routes: [
      { path: '/character', label: 'My character', phase: 5, icon: 'ArmorBronzeChest' },
      { path: '/spotcheck', label: 'Check in game', phase: 5, icon: 'Thistle' },
      { path: '/portals', label: 'My portals', phase: 5, icon: 'SurtlingCore' },
      { path: '/world', label: 'My world', phase: 5, icon: 'piece_cartographytable' },
      { path: '/next', label: 'Next steps', phase: 3, icon: 'Wishbone' },
      { path: '/checklist', label: 'Checklist', phase: 1, icon: 'Raspberry' },
      { path: '/progression', label: 'Progression', phase: 1, icon: 'TrophyTheElder' },
      { path: '/favorites', label: 'Favorites', phase: 1, icon: 'Honey' },
    ],
  },
  {
    id: 'reference',
    title: 'Reference',
    routes: [
      { path: '/commands', label: 'Console commands', phase: 5, icon: 'Ruby' },
      { path: '/trust', label: 'Data trust', phase: 5, icon: 'Bell' },
      { path: '/updates', label: 'Update log', phase: 5, icon: 'BellFragment' },
      { path: '/profile', label: 'Profile & data', phase: 1, icon: 'Coins' },
    ],
  },
];

export const ROUTE_GROUPS: RouteGroup[] = RAW_GROUPS.map((g) => ({
  ...g,
  routes: g.routes.map((r) => ({
    ...r,
    tier: MAIN.has(r.path) ? 'main' : OWNER.has(r.path) ? 'owner' : 'more',
  })),
}));

export const ROUTES: RouteDef[] = ROUTE_GROUPS.flatMap((g) => g.routes);

/** The groups of one tier, leaving out groups with nothing in that tier. */
export function groupsOfTier(tier: RouteDef['tier']): RouteGroup[] {
  return ROUTE_GROUPS.map((g) => ({ ...g, routes: g.routes.filter((r) => r.tier === tier) })).filter(
    (g) => g.routes.length > 0,
  );
}
