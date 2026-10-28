import { describe, expect, it } from 'vitest';
import { attackName } from './attackName';

describe('attackName', () => {
  it('drops the creature prefix and the word attack', () => {
    expect(attackName('troll_groundslam', 'Troll', 0)).toBe('Groundslam');
    expect(attackName('Eikthyr_charge', 'Eikthyr', 1)).toBe('Charge');
    expect(attackName('Neck_BiteAttack', 'Neck', 0)).toBe('Bite');
  });

  it('spells out side letters', () => {
    expect(attackName('troll_log_swing_v', 'Troll', 0)).toBe('Log swing vertical');
    expect(attackName('bjorn_swipe_l', 'Bjorn', 0)).toBe('Swipe left');
  });

  it('keeps a distinguishing prefix that is not the creature', () => {
    expect(attackName('imp_fireball_attack', 'Surtling', 0)).toBe('Imp fireball');
  });

  it('falls back to a number when nothing readable is left', () => {
    expect(attackName('Wolf_Attack1', 'Wolf', 0)).toBe('Attack 1');
    expect(attackName('Abomination_attack2', 'Abomination', 1)).toBe('Attack 2');
    expect(attackName('Greydwarf_shaman_attack', 'Greydwarf_Shaman', 0)).toBe('Attack 1');
  });
});
