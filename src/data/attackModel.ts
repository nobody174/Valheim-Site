import type { Weapon } from './schemas';

type Attack = NonNullable<Weapon['attack']>;
type Step = NonNullable<Attack['timing']>['steps'][number];

/** The game never lets playback fall to a standstill; this also guards the division below. */
const MIN_SPEED = 0.05;

/**
 * Real seconds it takes the animation to reach `clipTime` (seconds into the clip).
 * Playback starts at the state's speed; every Speed event sets the playback factor from then on.
 */
function realSeconds(step: Step, clipTime: number): number {
  let speed = Math.max(step.stateSpeed, MIN_SPEED);
  let at = 0;
  let seconds = 0;
  for (const ev of [...step.speedEvents].sort((a, b) => a.at - b.at)) {
    if (ev.at >= clipTime) break;
    seconds += (ev.at - at) / speed;
    at = ev.at;
    speed = Math.max(ev.factor * step.stateSpeed, MIN_SPEED);
  }
  return seconds + (clipTime - at) / speed;
}

/**
 * Seconds from the start of a swing until the next one can start.
 * Inside a combo that is the clip's Chain event; the last swing (or a single attack) ends when the
 * animation hands control back to movement, at exitTime of the clip (never later than its end).
 */
export function stepSeconds(step: Step, last: boolean): number {
  if (step.chainAt !== undefined && !last) return realSeconds(step, step.chainAt);
  return realSeconds(step, Math.min(step.exitTime ?? 1, 1) * step.lengthSec);
}

/** Seconds for one full combo, or undefined when the weapon has no timing in the data. */
export function comboSeconds(attack: Attack): number | undefined {
  const steps = attack.timing?.steps;
  if (!steps) return undefined;
  return steps.reduce((sum, step, i) => sum + stepSeconds(step, i === steps.length - 1), 0);
}

/**
 * How many times one hit's damage a whole combo deals: every swing counts the attack's damage
 * multiplier, and the last swing of a multi-swing combo uses the last-chain multiplier instead.
 */
export function comboMultiplier(attack: Attack): number {
  const swings = attack.chainLevels;
  const last = swings > 1 ? (attack.lastChainMultiplier ?? 1) : 1;
  return attack.damageMultiplier * (swings - 1 + last);
}

/** Stamina one whole combo costs. */
export const comboStamina = (attack: Attack): number => attack.staminaPerHit * attack.chainLevels;
