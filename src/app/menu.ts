import { ROUTES, type RouteDef } from './routes';

/** One dropdown of the top menu: a task a player has, and the pages that help with it. */
export interface MenuSection {
  id: string;
  label: string;
  /** Page paths from routes.ts, in the order shown. A page may appear in more than one section. */
  paths: string[];
}

/** The top menu. At most eight sections; every page in routes.ts is in at least one. */
export const MENU: MenuSection[] = [
  {
    id: 'gear',
    label: 'Gear',
    paths: ['/items', '/finder', '/recipes', '/rankings', '/compare', '/upgrades', '/skills'],
  },
  {
    id: 'creatures',
    label: 'Creatures',
    paths: ['/creatures', '/bosses', '/trophies', '/places'],
  },
  {
    id: 'building',
    label: 'Building',
    paths: ['/building', '/planner', '/comfort', '/graph'],
  },
  {
    id: 'food',
    label: 'Food',
    paths: ['/food', '/optimizer'],
  },
  {
    id: 'progress',
    label: 'Progress',
    paths: ['/progression', '/guides', '/next', '/checklist', '/favorites'],
  },
  {
    id: 'game',
    label: 'My game',
    paths: ['/character', '/world', '/portals', '/spotcheck', '/profile'],
  },
  {
    id: 'tools',
    label: 'Tools',
    paths: ['/finder', '/planner', '/optimizer', '/graph', '/compare', '/comfort', '/commands'],
  },
  {
    id: 'about',
    label: 'About',
    paths: ['/trust', '/updates', '/corrections'],
  },
];

const BY_PATH = new Map(ROUTES.map((r) => [r.path, r]));

/** The pages of a section, as route definitions. */
export function pagesOf(section: MenuSection): RouteDef[] {
  return section.paths.map((p) => BY_PATH.get(p)).filter((r): r is RouteDef => r !== undefined);
}
