import { z } from 'zod';

export const VERIFIED_LEVELS = ['unverified', 'cross-checked', 'in-game'] as const;
export const HOARD_CATEGORIES = [
  'must_keep',
  'keep_some',
  'safe_discard',
  'decorative',
  'sell',
] as const;
export const ITEM_CATEGORIES = [
  'material',
  'weapon',
  'armor',
  'tool',
  'food',
  'mead',
  'trophy',
  'piece',
  'misc',
] as const;

const id = z.string().min(1);
const qty = z.number().int().positive();

/** Provenance fields required on every data entry. */
const provenance = {
  source: z.string().min(1),
  verified: z.enum(VERIFIED_LEVELS),
  note: z.string().optional(),
};

const ingredient = z.object({ item: id, qty }).strict();
const damage = z.record(z.string(), z.number().nonnegative());

export const MetaSchema = z
  .object({
    gameVersion: z.string().min(1),
    lastReviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
  })
  .strict();

export const BiomeSchema = z
  .object({ id, name: z.string().min(1), order: z.number().int().nonnegative(), ...provenance })
  .strict();

const ObtainedFromSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('gather'), node: z.string().min(1) }).strict(),
  z.object({ type: z.literal('drop'), creature: id }).strict(),
  z.object({ type: z.literal('recipe'), recipe: id }).strict(),
  z.object({ type: z.literal('other'), note: z.string().min(1) }).strict(),
]);

export const ItemSchema = z
  .object({
    id,
    name: z.string().min(1),
    aliases: z.array(z.string()).optional(),
    category: z.enum(ITEM_CATEGORIES),
    biome: id.nullable(),
    weight: z.number().nonnegative().nullable(),
    stackSize: z.number().int().positive().nullable(),
    tags: z.array(z.string()).default([]),
    hoard: z.enum(HOARD_CATEGORIES),
    hoardNote: z.string().optional(),
    recommendedQty: z.number().int().positive().nullable().optional(),
    sellValue: z.number().nonnegative().nullable().optional(),
    obtainedFrom: z.array(ObtainedFromSchema).default([]),
    ...provenance,
  })
  .strict()
  .superRefine((item, ctx) => {
    if (item.hoard === 'keep_some' && item.recommendedQty == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['recommendedQty'],
        message: 'hoard "keep_some" requires recommendedQty',
      });
    }
  });

export const RecipeSchema = z
  .object({
    id,
    kind: z.enum(['craft', 'cook', 'smelt', 'other']).default('craft'),
    output: ingredient,
    station: z.object({ id, minLevel: z.number().int().positive() }).strict().nullable(),
    inputs: z.array(ingredient),
    upgrades: z
      .array(z.object({ quality: z.number().int().min(2), inputs: z.array(ingredient) }).strict())
      .default([]),
    ...provenance,
  })
  .strict();

export const StationSchema = z
  .object({
    id,
    name: z.string().min(1),
    levels: z
      .array(
        z
          .object({
            level: z.number().int().positive(),
            requirements: z.array(ingredient).default([]),
            unlocks: z.array(id).default([]),
          })
          .strict(),
      )
      .default([]),
    ...provenance,
  })
  .strict();

export const WeaponSchema = z
  .object({
    item: id,
    skill: z.string().min(1),
    twoHanded: z.boolean().optional(),
    damage,
    blockPower: z.number().nonnegative().optional(),
    parryForce: z.number().nonnegative().optional(),
    knockback: z.number().nonnegative().optional(),
    durability: z.number().positive().optional(),
    ...provenance,
  })
  .strict();

export const ArmorSchema = z
  .object({
    item: id,
    slot: z.enum(['helmet', 'chest', 'legs', 'cape', 'shield']),
    armor: z.number().nonnegative(),
    durability: z.number().positive().optional(),
    setName: z.string().optional(),
    ...provenance,
  })
  .strict();

export const FoodSchema = z
  .object({
    item: id,
    kind: z.enum(['food', 'mead']),
    health: z.number().nonnegative().optional(),
    stamina: z.number().nonnegative().optional(),
    eitr: z.number().nonnegative().optional(),
    durationSec: z.number().positive().optional(),
    effect: z.string().optional(),
    ...provenance,
  })
  .strict();

export const TrophySchema = z.object({ item: id, creature: id, ...provenance }).strict();

const drop = z
  .object({
    item: id,
    min: z.number().int().nonnegative().optional(),
    max: z.number().int().nonnegative().optional(),
    chance: z.number().min(0).max(1).optional(),
  })
  .strict();

export const CreatureSchema = z
  .object({
    id,
    name: z.string().min(1),
    biome: id.nullable(),
    health: z.number().positive().optional(),
    drops: z.array(drop).default([]),
    resistances: z.record(z.string(), z.string()).optional(),
    ...provenance,
  })
  .strict();

export const BossSchema = z
  .object({
    id,
    name: z.string().min(1),
    biome: id,
    summonItems: z.array(ingredient).default([]),
    trophy: id.optional(),
    drops: z.array(drop).default([]),
    health: z.number().positive().optional(),
    ...provenance,
  })
  .strict();

export const PieceSchema = z
  .object({
    id,
    name: z.string().min(1),
    category: z.string().min(1),
    requirements: z.array(ingredient).default([]),
    station: id.optional(),
    ...provenance,
  })
  .strict();

/** Every data file in /data, its filename and the schema of one entry (meta is a single object). */
export const FILE_SCHEMAS = {
  biomes: BiomeSchema,
  items: ItemSchema,
  recipes: RecipeSchema,
  stations: StationSchema,
  weapons: WeaponSchema,
  armor: ArmorSchema,
  foods: FoodSchema,
  trophies: TrophySchema,
  creatures: CreatureSchema,
  bosses: BossSchema,
  pieces: PieceSchema,
} as const;

export type Meta = z.infer<typeof MetaSchema>;
export type Biome = z.infer<typeof BiomeSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type Station = z.infer<typeof StationSchema>;
export type Weapon = z.infer<typeof WeaponSchema>;
export type Armor = z.infer<typeof ArmorSchema>;
export type Food = z.infer<typeof FoodSchema>;
export type Trophy = z.infer<typeof TrophySchema>;
export type Creature = z.infer<typeof CreatureSchema>;
export type Boss = z.infer<typeof BossSchema>;
export type Piece = z.infer<typeof PieceSchema>;

export interface GameData {
  meta: Meta;
  biomes: Biome[];
  items: Item[];
  recipes: Recipe[];
  stations: Station[];
  weapons: Weapon[];
  armor: Armor[];
  foods: Food[];
  trophies: Trophy[];
  creatures: Creature[];
  bosses: Boss[];
  pieces: Piece[];
}
