import { describe, expect, it } from 'vitest';
import { comboMultiplier, comboSeconds, comboStamina, stepSeconds } from './attackModel';
import { lookup } from './lookup';
import { damageVs } from './weaponStats';
import type { Weapon } from './schemas';

type Attack = NonNullable<Weapon['attack']>;
const step = (over: Partial<NonNullable<Attack['timing']>['steps'][number]> = {}) => ({
  lengthSec: 1,
  stateSpeed: 1,
  speedEvents: [],
  ...over,
});
const attack = (over: Partial<Attack> = {}): Attack => ({
  animation: 'test',
  chainLevels: 1,
  staminaPerHit: 10,
  damageMultiplier: 1,
  ...over,
});

describe('stepSeconds', () => {
  it('plays a plain clip in its own length', () => {
    expect(stepSeconds(step({ lengthSec: 0.8 }), true)).toBeCloseTo(0.8);
  });

  it('ends at the exit fraction of the clip, never past the clip end', () => {
    expect(stepSeconds(step({ lengthSec: 2, exitTime: 0.5 }), true)).toBeCloseTo(1);
    expect(stepSeconds(step({ lengthSec: 2, exitTime: 1.3 }), true)).toBeCloseTo(2);
  });

  it('speeds up and slows down with Speed events', () => {
    // 0.5 s at normal speed, then the remaining 0.5 s of clip at double speed = 0.25 s.
    const s = step({ speedEvents: [{ at: 0.5, factor: 2 }] });
    expect(stepSeconds(s, true)).toBeCloseTo(0.75);
    // A later event that restores normal speed only affects what follows it.
    const s2 = step({
      speedEvents: [
        { at: 0.2, factor: 2 },
        { at: 0.6, factor: 1 },
      ],
    });
    expect(stepSeconds(s2, true)).toBeCloseTo(0.2 + 0.4 / 2 + 0.4);
  });

  it('scales with the state speed', () => {
    expect(stepSeconds(step({ stateSpeed: 2 }), true)).toBeCloseTo(0.5);
  });

  it('inside a combo uses the chain point, the last swing uses the exit', () => {
    const s = step({ chainAt: 0.4, exitTime: 1 });
    expect(stepSeconds(s, false)).toBeCloseTo(0.4);
    expect(stepSeconds(s, true)).toBeCloseTo(1);
  });

  it('survives a zero playback factor', () => {
    const s = step({ speedEvents: [{ at: 0.5, factor: 0 }] });
    expect(Number.isFinite(stepSeconds(s, true))).toBe(true);
  });
});

describe('combos', () => {
  it('adds the steps of a combo', () => {
    const a = attack({
      chainLevels: 3,
      timing: {
        verified: 'unverified',
        note: 'x',
        steps: [step({ chainAt: 0.5 }), step({ chainAt: 0.5 }), step({ lengthSec: 0.9 })],
      },
    });
    expect(comboSeconds(a)).toBeCloseTo(0.5 + 0.5 + 0.9);
  });

  it('has no duration without timing', () => {
    expect(comboSeconds(attack())).toBeUndefined();
  });

  it('counts the last swing with its own multiplier', () => {
    expect(comboMultiplier(attack({ chainLevels: 3, lastChainMultiplier: 2 }))).toBe(4);
    expect(comboMultiplier(attack({ chainLevels: 1, lastChainMultiplier: 2 }))).toBe(1);
    expect(comboMultiplier(attack({ chainLevels: 2, damageMultiplier: 1.5, lastChainMultiplier: 3 }))).toBe(6);
  });

  it('adds up the stamina of every swing', () => {
    expect(comboStamina(attack({ chainLevels: 3, staminaPerHit: 8 }))).toBe(24);
  });

  it('gives real weapons believable timings: a knife combo is faster than an axe combo', () => {
    const secs = (id: string) => comboSeconds(lookup.weapon(id)!.attack!)!;
    expect(secs('KnifeFlint')).toBeLessThan(secs('SwordBronze'));
    expect(secs('SwordBronze')).toBeLessThan(secs('AxeBronze'));
    for (const id of ['SwordBronze', 'AxeBronze', 'KnifeCopper', 'SpearBronze', 'AtgeirBronze']) {
      expect(secs(id)).toBeGreaterThan(0.2);
      expect(secs(id)).toBeLessThan(6);
    }
  });
});

describe('damageVs', () => {
  it('scales each damage type by the creature resistance label', () => {
    const r = { blunt: 'weak', pierce: 'resistant', slash: 'immune', fire: 'very weak', frost: 'very resistant' };
    expect(damageVs({ blunt: 10, pierce: 10, slash: 10, fire: 10, frost: 10, poison: 10 }, r)).toEqual({
      blunt: 15,
      pierce: 5,
      slash: 0,
      fire: 20,
      frost: 2.5,
      poison: 10,
    });
  });

  it('treats missing resistances as normal', () => {
    expect(damageVs({ slash: 7 }, undefined)).toEqual({ slash: 7 });
  });
});
