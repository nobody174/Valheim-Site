import { graph, lookup } from '../../data/lookup';
import { hasFlag } from '../../state/model';
import { useProfile } from '../../state/store';
import { advise, type Advice } from './advisor';

/** The advisor's answer for the active profile, from its checklist and inventory. */
export function useAdvice(): Advice {
  const profile = useProfile();
  return advise(
    {
      items: lookup.allItems(),
      recipesFor: (id) => graph.recipesFor(id),
      bosses: lookup.allBosses(),
      zoneOrder: new Map(lookup.allBiomes().map((b) => [b.id, b.order])),
    },
    {
      collected: (id) => hasFlag(profile, id, 'collected'),
      crafted: (id) => hasFlag(profile, id, 'crafted'),
      inventory: profile.inventory,
    },
  );
}
