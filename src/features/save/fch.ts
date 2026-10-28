/**
 * Reads a Valheim character file (`.fch`) in the browser. Nothing is uploaded: the file is read
 * from the disk the owner picks, and only the numbers and names we need are kept.
 *
 * The layout follows the game's own loader (PlayerProfile.LoadPlayerFromDisk, Player.Load,
 * Inventory.Load, ItemData.Load, Skills.Load), file version 47 and player data version 34.
 * Anything older than that is refused with a clear message instead of guessed at: the game
 * changes this layout from time to time.
 */

/** Oldest file version this reader understands (the one with per-world-level stat groups). */
export const MIN_FILE_VERSION = 46;
/** Newest file version this reader has been checked against. */
export const MAX_FILE_VERSION = 47;

export interface ParsedItem {
  /** The game's stable hash of the prefab name (see {@link stableHash}). */
  hash: number;
  stack: number;
  quality: number;
  equipped: boolean;
  /** Durability in game units. */
  durability: number;
  crafterName: string;
}

export interface ParsedSkill {
  /** The game's skill number (Swords = 1 ... Ride = 110). */
  type: number;
  level: number;
}

export interface ParsedCharacter {
  fileVersion: number;
  name: string;
  playerDataVersion: number;
  /** Counters by PlayerStatType number (Deaths = 0, Builds = 2, EnemyKills = 6 ...). */
  stats: number[];
  /** `$enemy_*` name key -> times killed. */
  kills: Record<string, number>;
  /** `$item_*` name key -> times crafted. */
  crafted: Record<string, number>;
  maxHealth: number;
  maxStamina: number;
  guardianPower: string;
  items: ParsedItem[];
  knownRecipes: string[];
  /** `$piece_*` name key -> station level. */
  knownStations: Record<string, number>;
  knownMaterials: string[];
  uniques: string[];
  trophies: string[];
  knownBiomes: string[];
  foods: { name: string; secondsLeft: number }[];
  skills: ParsedSkill[];
}

export class FchError extends Error {}

/** Valheim's `string.GetStableHashCode()`, used for the prefab hash of inventory items. */
export function stableHash(text: string): number {
  let a = 5381;
  let b = 5381;
  for (let i = 0; i < text.length; i += 2) {
    a = ((a << 5) + a) ^ text.charCodeAt(i);
    if (i === text.length - 1) break;
    b = ((b << 5) + b) ^ text.charCodeAt(i + 1);
  }
  return (a + Math.imul(b, 1566083941)) | 0;
}

/** Little-endian reader with the same primitives as the game's ZPackage / .NET BinaryReader. */
class Reader {
  private pos = 0;
  private readonly view: DataView;
  private readonly bytes: Uint8Array;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  private need(n: number): void {
    if (this.pos + n > this.bytes.length) throw new FchError('The file ends too early; it may be damaged.');
  }

  byte(): number {
    this.need(1);
    return this.view.getUint8(this.pos++);
  }
  bool(): boolean {
    return this.byte() !== 0;
  }
  ushort(): number {
    this.need(2);
    const v = this.view.getUint16(this.pos, true);
    this.pos += 2;
    return v;
  }
  int(): number {
    this.need(4);
    const v = this.view.getInt32(this.pos, true);
    this.pos += 4;
    return v;
  }
  float(): number {
    this.need(4);
    const v = this.view.getFloat32(this.pos, true);
    this.pos += 4;
    return v;
  }
  long(): bigint {
    this.need(8);
    const v = this.view.getBigInt64(this.pos, true);
    this.pos += 8;
    return v;
  }
  skip(n: number): void {
    this.need(n);
    this.pos += n;
  }
  /** A count that must be sane, so a damaged file fails fast instead of looping for ever. */
  count(max = 1_000_000): number {
    const n = this.int();
    if (n < 0 || n > max) throw new FchError('The file has an unexpected layout (a count is out of range).');
    return n;
  }
  string(): string {
    let length = 0;
    for (let shift = 0; shift < 35; shift += 7) {
      const b = this.byte();
      length |= (b & 0x7f) << shift;
      if (b < 0x80) break;
    }
    this.need(length);
    const text = new TextDecoder().decode(this.bytes.subarray(this.pos, this.pos + length));
    this.pos += length;
    return text;
  }
  byteArray(): Uint8Array {
    const n = this.count(this.bytes.length);
    this.need(n);
    const out = this.bytes.subarray(this.pos, this.pos + n);
    this.pos += n;
    return out;
  }
  /** ZPackage.ReadNumItems: one byte, or two when the top bit is set. */
  numItems(): number {
    const b = this.byte();
    return (b & 0x80) !== 0 ? ((b & 0x7f) << 8) | this.byte() : b;
  }
  stringList(): string[] {
    const out: string[] = [];
    for (let i = 0, n = this.count(); i < n; i++) out.push(this.string());
    return out;
  }
  /** A map of name -> number, read as the game does (count, then name and float pairs). */
  floatMap(): Record<string, number> {
    const out: Record<string, number> = {};
    for (let i = 0, n = this.count(); i < n; i++) {
      const key = this.string();
      out[key] = this.float();
    }
    return out;
  }
}

/** Parse the bytes of a `.fch` file. Throws {@link FchError} with a plain message on trouble. */
export function parseCharacter(file: Uint8Array): ParsedCharacter {
  if (file.length < 16) throw new FchError('This is not a Valheim character file (it is too small).');
  const length = new DataView(file.buffer, file.byteOffset, 4).getInt32(0, true);
  if (length <= 0 || length + 4 > file.length) {
    throw new FchError('This is not a Valheim character file, or it is damaged.');
  }
  const r = new Reader(file.subarray(4, 4 + length));

  const fileVersion = r.int();
  if (fileVersion < MIN_FILE_VERSION || fileVersion > MAX_FILE_VERSION) {
    throw new FchError(
      fileVersion > MAX_FILE_VERSION
        ? `This character was saved by a newer Valheim (file version ${fileVersion}) than this site can read yet (up to ${MAX_FILE_VERSION}).`
        : `This character is from an older Valheim (file version ${fileVersion}); this site reads version ${MIN_FILE_VERSION} and newer. Load it once in the current game, then pick it again.`,
    );
  }

  // Statistics: `statCount` counters and several name maps, once per stat group (group 0 is the one we use).
  const statCount = r.count(10_000);
  const groups = r.count(100);
  let stats: number[] = [];
  let kills: Record<string, number> = {};
  let crafted: Record<string, number> = {};
  for (let g = 0; g < groups; g++) {
    const counters: number[] = [];
    for (let i = 0; i < statCount; i++) counters.push(r.float());
    r.floatMap(); // known worlds
    r.floatMap(); // known world keys
    r.floatMap(); // known commands
    const enemyGroups: Record<string, number>[] = [];
    for (let i = 0, n = r.count(100); i < n; i++) enemyGroups.push(r.floatMap());
    r.floatMap(); // items picked up
    const craftedHere = r.floatMap();
    r.floatMap(); // pickables
    r.floatMap(); // food eaten
    r.floatMap(); // pieces placed
    if (g === 0) {
      stats = counters;
      kills = enemyGroups[0] ?? {};
      crafted = craftedHere;
    }
  }

  r.bool(); // first spawn
  for (let i = 0, n = r.count(1000); i < n; i++) {
    r.long(); // world id
    r.bool();
    r.skip(12); // custom spawn point
    r.bool();
    r.skip(12); // logout point
    r.bool();
    r.skip(12); // death point
    r.skip(12); // home point
    if (r.bool()) r.byteArray(); // map
  }

  const name = r.string();
  r.long(); // player id
  r.string(); // start seed
  r.bool(); // used cheats
  r.long(); // date created

  if (!r.bool()) throw new FchError('This character has no saved player data yet. Start it once in the game.');
  const p = new Reader(r.byteArray());

  const playerDataVersion = p.int();
  if (playerDataVersion < 34) {
    throw new FchError(`This character's player data (version ${playerDataVersion}) is too old to read.`);
  }
  const maxHealth = p.float();
  p.float(); // health
  const maxStamina = p.float();
  p.float(); // time since death
  const guardianPower = p.string();
  p.float(); // guardian power cooldown

  const inventoryVersion = p.int();
  if (inventoryVersion < 108) {
    throw new FchError(`This character's inventory (version ${inventoryVersion}) is too old to read.`);
  }
  const items: ParsedItem[] = [];
  for (let i = 0, n = p.ushort(); i < n; i++) {
    const durability = p.int() * 0.01;
    p.byte(); // grid x
    p.byte(); // grid y
    p.byte(); // world level
    const flags = p.byte();
    const quality = (flags & 0x04) !== 0 ? p.ushort() : 1;
    const stack = (flags & 0x08) !== 0 ? p.ushort() : 1;
    if ((flags & 0x10) !== 0) p.int(); // variant
    let crafterName = '';
    if ((flags & 0x20) !== 0) {
      p.long();
      crafterName = p.string();
    }
    const hash = (flags & 0x40) !== 0 ? p.int() : 0;
    if ((flags & 0x80) !== 0) {
      for (let k = 0, m = p.numItems(); k < m; k++) {
        p.string();
        p.string();
      }
    }
    p.byte(); // cheat flags
    if (hash !== 0) items.push({ hash, stack, quality, equipped: (flags & 0x02) !== 0, durability, crafterName });
  }

  const knownRecipes = p.stringList();
  const knownStations: Record<string, number> = {};
  for (let i = 0, n = p.count(); i < n; i++) {
    const key = p.string();
    knownStations[key] = p.int();
  }
  const knownMaterials = p.stringList();
  p.stringList(); // shown tutorials
  const uniques = p.stringList();
  const trophies = p.stringList();
  const knownBiomes = p.stringList();
  for (let i = 0, n = p.count(); i < n; i++) {
    p.string();
    p.string(); // known texts
  }
  p.string(); // beard
  p.string(); // hair
  p.skip(24); // skin and hair colour
  p.int(); // model

  const foods: { name: string; secondsLeft: number }[] = [];
  for (let i = 0, n = p.count(); i < n; i++) {
    const foodName = p.string();
    foods.push({ name: foodName, secondsLeft: p.float() });
  }

  p.int(); // skills version
  const skills: ParsedSkill[] = [];
  for (let i = 0, n = p.count(1000); i < n; i++) {
    const type = p.int();
    const level = p.float();
    p.float(); // accumulator
    skills.push({ type, level });
  }

  return {
    fileVersion,
    name,
    playerDataVersion,
    stats,
    kills,
    crafted,
    maxHealth,
    maxStamina,
    guardianPower,
    items,
    knownRecipes,
    knownStations,
    knownMaterials,
    uniques,
    trophies,
    knownBiomes,
    foods,
    skills,
  };
}
