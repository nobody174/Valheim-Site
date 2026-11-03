import { commands, gameData, places } from '../../data/load';
import { ROUTES } from '../../app/routes';
import { createSearch } from './search';

export const search = createSearch(gameData, {
  pages: ROUTES.map((r) => ({ path: r.path, label: r.label })),
  places,
  commands,
});
