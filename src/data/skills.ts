import { skillsFile } from './load';

const byId = new Map(skillsFile.skills.map((s) => [s.id, s]));

/** The game's English name for a skill id as weapons carry it ("ElementalMagic" -> "Elemental Magic"). */
export function skillLabel(id: string): string {
  return byId.get(id)?.name ?? id;
}
