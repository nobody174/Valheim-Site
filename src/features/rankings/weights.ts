/**
 * Weights of the overall rating. The rating is an opinion, not a game stat: each weapon is scored
 * 0 to 100 by where it stands among the listed weapons on each measure, blended with these
 * weights. The page lets you change them; the values below are only the starting point.
 */
export const RATING_MEASURES = [
  { key: 'dps', label: 'Damage per second (estimate)', weight: 5 },
  { key: 'stamina', label: 'Damage per stamina', weight: 3 },
  { key: 'reach', label: 'Reach', weight: 2 },
] as const;

export type RatingKey = (typeof RATING_MEASURES)[number]['key'];
export type RatingWeights = Record<RatingKey, number>;

export const DEFAULT_WEIGHTS: RatingWeights = Object.fromEntries(
  RATING_MEASURES.map((m) => [m.key, m.weight]),
) as RatingWeights;

/** Weights live in the URL as "5,3,2" in the order of RATING_MEASURES; bad input gives defaults. */
export function parseWeights(raw: string | null): RatingWeights {
  if (!raw) return DEFAULT_WEIGHTS;
  const parts = raw.split(',').map(Number);
  if (parts.length !== RATING_MEASURES.length || parts.some((n) => !Number.isFinite(n) || n < 0)) {
    return DEFAULT_WEIGHTS;
  }
  if (parts.every((n) => n === 0)) return DEFAULT_WEIGHTS;
  return Object.fromEntries(RATING_MEASURES.map((m, i) => [m.key, parts[i]])) as RatingWeights;
}

export const formatWeights = (w: RatingWeights): string =>
  RATING_MEASURES.map((m) => w[m.key]).join(',');
