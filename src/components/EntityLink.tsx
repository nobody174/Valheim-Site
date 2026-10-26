import { Link } from 'react-router';
import { lookup, type EntityKind } from '../data/lookup';

export function entityPath(kind: EntityKind, id: string): string {
  return `/${kind}/${encodeURIComponent(id)}`;
}

/** Every item, creature, boss and station name in the app renders through this link. */
export function EntityLink({ id }: { id: string }) {
  const ref = lookup.entity(id);
  if (!ref) return <span title="Unknown reference">{id}</span>;
  return <Link to={entityPath(ref.kind, id)}>{ref.name}</Link>;
}
