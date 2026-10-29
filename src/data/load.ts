import { z } from 'zod';
import biomes from '../../data/biomes.json';
import items from '../../data/items.json';
import recipes from '../../data/recipes.json';
import stations from '../../data/stations.json';
import weapons from '../../data/weapons.json';
import armor from '../../data/armor.json';
import foods from '../../data/foods.json';
import trophies from '../../data/trophies.json';
import creatures from '../../data/creatures.json';
import bosses from '../../data/bosses.json';
import pieces from '../../data/pieces.json';
import meta from '../../data/meta.json';
import savekeys from '../../data/savekeys.json';
import commandsRaw from '../../data/commands.json';
import skillsRaw from '../../data/skills.json';
import updateLogRaw from '../../data/updatelog.json';
import placesRaw from '../../data/places.json';
import confirmedRaw from '../../data/confirmed.json';
import { CommandSchema, FILE_SCHEMAS, PlaceSchema, MetaSchema, SaveKeysSchema, SkillsFileSchema, UpdateLogSchema, type GameData } from './schemas';

const raw = {
  biomes,
  items,
  recipes,
  stations,
  weapons,
  armor,
  foods,
  trophies,
  creatures,
  bosses,
  pieces,
};

/** The only place JSON is imported. Parsed with the same schemas the validate script uses. */
export const gameData: GameData = {
  meta: MetaSchema.parse(meta),
  ...(Object.fromEntries(
    Object.entries(FILE_SCHEMAS).map(([k, schema]) => [
      k,
      z.array(schema).parse(raw[k as keyof typeof raw]),
    ]),
  ) as Omit<GameData, 'meta'>),
};

/** In-game name keys (as written into character files) mapped to item, creature and station ids. */
export const saveKeys = SaveKeysSchema.parse(savekeys);

/** The game's console commands. */
export const commands = z.array(CommandSchema).parse(commandsRaw);

/** The game's skills (descriptions, groups, gain per use) and the share lost on death. */
export const skillsFile = SkillsFileSchema.parse(skillsRaw);

/** What changed between game builds, newest first. */
export const updateLog = UpdateLogSchema.parse(updateLogRaw);

/** Check in game lines already seen matching in the real game, with the text that was confirmed. */
export const confirmedChecks: ReadonlyMap<string, string | null> = new Map(
  Object.entries(z.record(z.string(), z.string().nullable()).parse(confirmedRaw)),
);

/** Dungeons, camps, altars and other places the game generates. */
export const places = z.array(PlaceSchema).parse(placesRaw);
