const SIDE: Record<string, string> = { l: 'left', r: 'right', v: 'vertical', h: 'horizontal' };

/**
 * A readable name for an attack from its prefab id: the creature's own prefix and the word
 * "attack" are dropped, camelCase and underscores become spaces. Falls back to "Attack N".
 */
export function attackName(attackId: string, creatureId: string, index: number): string {
  const prefix = creatureId.toLowerCase().replace(/_/g, '');
  const words = attackId
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[_\s]+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w && !/^attack\d*$/.test(w));
  let consumed = '';
  while (words.length > 0 && prefix.startsWith(consumed + words[0]!)) consumed += words.shift();
  const text = words.map((w) => SIDE[w] ?? w).join(' ');
  if (!text || /^\d+$/.test(text)) return `Attack ${index + 1}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
