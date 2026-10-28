import type { Item } from '../data/schemas';

/** Generated placeholder glyph per category. No game art. */
const SHAPES: Record<Item['category'], string> = {
  material: 'M12 3l8 5v8l-8 5-8-5V8z',
  weapon: 'M12 2l2 14h-4zM8 16h8v2H8zM11 18h2v4h-2z',
  armor: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z',
  tool: 'M5 19L15 9l-2-2 3-3 4 4-3 3-2-2L7 21z',
  food: 'M4 12h16a8 8 0 01-16 0zM8 6c0 2-2 2-2 4M12 5c0 2-2 2-2 5M16 6c0 2-2 2-2 4',
  mead: 'M8 3h8l-1 6a4 4 0 01-6 0zM12 13v6M8 21h8',
  trophy: 'M7 4h10v5a5 5 0 01-10 0zM3 5h4M17 5h4M12 14v4M8 20h8',
  trinket: 'M12 2a3 3 0 013 3c0 1-1 2-3 2S9 6 9 5a3 3 0 013-3zM12 7v3M12 10a6 6 0 100 12 6 6 0 000-12z',
  piece: 'M4 10l8-6 8 6v10H4z',
  misc: 'M12 4a8 8 0 100 16 8 8 0 000-16z',
};

export function CategoryGlyph({
  category,
  size = 40,
}: {
  category: Item['category'];
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--bronze)"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={SHAPES[category]} />
    </svg>
  );
}
