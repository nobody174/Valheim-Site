import { stableHash } from './fch';

/** Writes the same primitives the game does, to build a small character file for the tests. */
class Writer {
  private parts: number[] = [];
  byte(v: number) {
    this.parts.push(v & 0xff);
  }
  bool(v: boolean) {
    this.byte(v ? 1 : 0);
  }
  ushort(v: number) {
    this.byte(v);
    this.byte(v >> 8);
  }
  int(v: number) {
    const b = new DataView(new ArrayBuffer(4));
    b.setInt32(0, v, true);
    for (let i = 0; i < 4; i++) this.byte(b.getUint8(i));
  }
  float(v: number) {
    const b = new DataView(new ArrayBuffer(4));
    b.setFloat32(0, v, true);
    for (let i = 0; i < 4; i++) this.byte(b.getUint8(i));
  }
  long(v: number) {
    this.int(v);
    this.int(0);
  }
  string(s: string) {
    const bytes = new TextEncoder().encode(s);
    this.byte(bytes.length);
    bytes.forEach((x) => this.byte(x));
  }
  strings(list: string[]) {
    this.int(list.length);
    list.forEach((s) => this.string(s));
  }
  floatMap(m: Record<string, number>) {
    this.int(Object.keys(m).length);
    for (const [k, v] of Object.entries(m)) {
      this.string(k);
      this.float(v);
    }
  }
  blob(w: Writer) {
    this.int(w.parts.length);
    this.parts.push(...w.parts);
  }
  bytes() {
    return new Uint8Array(this.parts);
  }
}

function item(w: Writer, prefab: string, flags: { stack?: number; quality?: number; equipped?: boolean; crafter?: string }) {
  w.int(10000); // durability 100.00
  w.byte(0);
  w.byte(0);
  w.byte(0);
  let f = 0x40;
  if (flags.equipped) f |= 0x02;
  if (flags.quality) f |= 0x04;
  if (flags.stack) f |= 0x08;
  if (flags.crafter) f |= 0x20;
  w.byte(f);
  if (flags.quality) w.ushort(flags.quality);
  if (flags.stack) w.ushort(flags.stack);
  if (flags.crafter) {
    w.long(1);
    w.string(flags.crafter);
  }
  w.int(stableHash(prefab));
  w.byte(0);
}

/** A small, valid version-47 character file for the tests: Venom with a hammer, wood and a bronze axe. */
export function buildFile(version = 47): Uint8Array {
  const p = new Writer();
  p.int(34);
  p.float(100); // max health
  p.float(90);
  p.float(110); // max stamina
  p.float(0);
  p.string('GP_Eikthyr');
  p.float(0);
  p.int(110);
  p.ushort(3);
  item(p, 'Hammer', { equipped: true });
  item(p, 'Wood', { stack: 40 });
  item(p, 'AxeBronze', { quality: 2, crafter: 'Venom' });
  p.strings([]); // recipes
  p.int(1);
  p.string('$piece_workbench');
  p.int(3);
  p.strings(['$item_wood', '$item_stone', '$item_notindata']);
  p.strings([]); // tutorials
  p.strings(['GP_Eikthyr']);
  p.strings(['TrophyDeer', 'TrophyEikthyr']);
  p.strings(['Meadows', 'Black Forest']);
  p.int(0); // texts
  p.string('');
  p.string('');
  for (let i = 0; i < 6; i++) p.float(0);
  p.int(0); // model
  p.int(1);
  p.string('CookedMeat');
  p.float(600);
  p.int(2); // skills version
  p.int(2);
  p.int(7);
  p.float(27.9);
  p.float(0);
  p.int(13);
  p.float(50);
  p.float(0);

  const w = new Writer();
  w.int(version);
  w.int(3); // stat counters
  w.int(1); // groups
  w.float(4); // deaths
  w.float(12); // crafts
  w.float(30); // builds
  w.floatMap({});
  w.floatMap({});
  w.floatMap({});
  w.int(1);
  w.floatMap({ $enemy_boar: 5, $enemy_greyling: 0 });
  w.floatMap({});
  w.floatMap({ $item_axe_bronze: 1, $item_hammer: 0 });
  w.floatMap({});
  w.floatMap({});
  w.floatMap({});
  w.bool(false); // first spawn
  w.int(0); // worlds
  w.string('Venom');
  w.long(7);
  w.string('');
  w.bool(false);
  w.long(0);
  w.bool(true);
  w.blob(p);
  const body = w;
  const out = new Writer();
  out.blob(body);
  out.int(64);
  for (let i = 0; i < 64; i++) out.byte(0);
  return out.bytes();
}
