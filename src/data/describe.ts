import { graph, lookup } from './lookup';
import { skillLabel } from './skills';
import { combatDamage, totalCombatDamage } from './weaponStats';

export interface EntityDescription {
  title: string;
  /** Short kind line, e.g. "Weapon · Black Forest". */
  subtitle: string;
  lines: string[];
  /** Set for items, so the tooltip can show the player's own hoard setting. */
  itemId?: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  material: 'Material',
  weapon: 'Weapon',
  armor: 'Armor',
  tool: 'Tool',
  food: 'Food',
  mead: 'Mead',
  trophy: 'Trophy',
  piece: 'Building piece',
  misc: 'Misc',
};

const num = (n: number) => String(Math.round(n * 100) / 100);
const label = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);
const duration = (sec: number) =>
  sec >= 120 ? `${Math.round(sec / 60)} min` : `${Math.round(sec)} s`;
const join = (parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' · ');

function itemLines(id: string): string[] {
  const lines: string[] = [];
  const weapon = lookup.weapon(id);
  const armor = lookup.armor(id);
  const food = lookup.food(id);

  if (weapon) {
    const dmg = combatDamage(weapon);
    const total = totalCombatDamage(weapon);
    if (total > 0) {
      const types = Object.entries(dmg)
        .map(([k, v]) => `${label(k)} ${num(v)}`)
        .join(', ');
      lines.push(`Damage ${num(total)} (${types})`);
    }
    lines.push(join([skillLabel(weapon.skill), weapon.twoHanded && 'two-handed']));
    if (weapon.blockPower !== undefined) lines.push(`Block power ${num(weapon.blockPower)}`);
  }
  if (armor) {
    lines.push(`Armor ${num(armor.armor)} · ${label(armor.slot)}`);
    if (armor.setName) lines.push(`Part of ${armor.setName}`);
  }
  if (food) {
    lines.push(
      join([
        food.health !== undefined && `Health ${num(food.health)}`,
        food.stamina !== undefined && `Stamina ${num(food.stamina)}`,
        food.eitr !== undefined && `Eitr ${num(food.eitr)}`,
        food.durationSec !== undefined && duration(food.durationSec),
      ]),
    );
  }

  const item = lookup.item(id);
  if (item && (item.weight !== null || item.stackSize !== null)) {
    lines.push(
      join([
        item.weight !== null && `Weight ${num(item.weight)}`,
        item.stackSize !== null && `Stack ${item.stackSize}`,
      ]),
    );
  }

  const recipe = graph.recipesFor(id)[0];
  if (recipe) {
    const at = recipe.station ? lookup.station(recipe.station.id)?.name : undefined;
    lines.push(at ? `Crafted at ${at}` : 'Crafted by hand');
  } else {
    const drop = lookup.droppedBy(id)[0];
    if (drop) lines.push(`Dropped by ${drop.name}`);
  }
  return lines.filter(Boolean);
}

/** Short facts for the hover card of any item, creature, boss or station. Read-only. */
export function describeEntity(id: string): EntityDescription | undefined {
  const ref = lookup.entity(id);
  if (!ref) return undefined;

  if (ref.kind === 'item') {
    const item = lookup.item(id);
    if (!item) return undefined;
    return {
      title: item.name,
      subtitle: join([
        CATEGORY_LABEL[item.category] ?? item.category,
        lookup.biomeName(item.biome),
      ]),
      lines: itemLines(id),
      itemId: id,
    };
  }

  if (ref.kind === 'station') {
    const station = lookup.station(id);
    if (!station) return undefined;
    const recipes = lookup.recipesAt(id).length;
    const lines = [
      station.buildRequirements.length
        ? `Build: ${station.buildRequirements
            .map((g) => `${g.qty} ${lookup.entity(g.item)?.name ?? g.item}`)
            .join(', ')}`
        : 'Build cost not in the data yet',
    ];
    if (recipes) lines.push(`${recipes} ${recipes === 1 ? 'recipe' : 'recipes'} here`);
    return { title: station.name, subtitle: 'Crafting station', lines };
  }

  if (ref.kind === 'piece') {
    const piece = lookup.piece(id);
    if (!piece) return undefined;
    const at = piece.station ? lookup.station(piece.station)?.name : undefined;
    return {
      title: piece.name,
      subtitle: join(['Building piece', piece.category]),
      lines: [
        `Build${at ? ` near ${at}` : ''}: ${piece.requirements
          .map((g) => `${g.qty} ${lookup.entity(g.item)?.name ?? g.item}`)
          .join(', ')}`,
        piece.comfort
          ? join([`Comfort ${piece.comfort}`, piece.comfortGroup && `${piece.comfortGroup} group`])
          : '',
      ].filter(Boolean),
    };
  }

  const monster = ref.kind === 'boss' ? lookup.boss(id) : lookup.creature(id);
  if (!monster) return undefined;
  const lines = [monster.health !== undefined ? `Health ${num(monster.health)}` : 'Health unknown'];
  if (monster.drops.length) {
    lines.push(
      `Drops ${monster.drops.map((d) => lookup.entity(d.item)?.name ?? d.item).join(', ')}`,
    );
  }
  return {
    title: monster.name,
    subtitle: join([ref.kind === 'boss' ? 'Boss' : 'Creature', lookup.biomeName(monster.biome)]),
    lines,
  };
}
