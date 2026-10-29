/**
 * Browser checks on the built site: accessibility (axe), tap targets, tiny text, sideways scroll and
 * console errors, on every page at phone and desktop width. Run after a build:
 *
 *   npm run build && npm run qa
 *
 * Exit code 1 when anything is worse than `tools/qa/budget.json`. After fixing things, lower the
 * budget with `npm run qa -- --write-budget` so the improvement is kept.
 *
 * Set QA_CHANNEL=msedge (or chrome) to use an installed browser instead of Playwright's Chromium.
 * The phone run emulates a touch screen, so the touch-only CSS rules apply as they do on a phone.
 * Tap targets are only counted on the phone run; a mouse does not need 44px.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';
import { ROUTES } from '../../src/app/routes';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const BUDGET_FILE = join(process.cwd(), 'tools', 'qa', 'budget.json');
const writeBudget = process.argv.includes('--write-budget');

/** Pages with a parameter in the path, one example each. */
const EXTRA = ['/item/Iron', '/item/Wood', '/creature/Boar', '/boss/Eikthyr', '/station/piece_workbench', '/progression/meadows'];
const PATHS = [...new Set([...ROUTES.map((r) => r.path), ...EXTRA])];

const SIZES = [
  { name: 'phone', width: 390, height: 800, touch: true },
  { name: 'desktop', width: 1280, height: 900, touch: false },
] as const;

interface Result {
  axe: number;
  small: number;
  tiny: number;
  overflow: boolean;
  errors: number;
}
type Budget = Record<string, Result>;

const server = await preview({ preview: { port: 4173, strictPort: true }, base: '/Valheim-Site/' });
const base = 'http://localhost:4173/Valheim-Site/#';
const browser = await chromium.launch({ channel: process.env.QA_CHANNEL });
const results: Budget = {};
const details: string[] = [];

for (const size of SIZES) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    hasTouch: size.touch,
    isMobile: size.touch,
    serviceWorkers: 'block',
  });
  for (const path of PATHS) {
    const page = await context.newPage();
    let errors = 0;
    page.on('pageerror', () => (errors += 1));
    page.on('console', (m) => {
      if (m.type() === 'error') errors += 1;
    });
    await page.goto(base + path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);
    await page.evaluate(axeSource);
    const touch = size.touch;
    const found = await page.evaluate(async (touch) => {
      const axe = (window as unknown as { axe: { run: (c: Document, o: object) => Promise<{ violations: { id: string; nodes: unknown[] }[] }> } }).axe;
      const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } });
      const small: string[] = [];
      for (const e of document.querySelectorAll('a, button, input, select, summary, label')) {
        const b = e.getBoundingClientRect();
        if (b.width === 0 || b.height === 0 || e.closest('.skip-link, [aria-hidden=true]') || e.classList.contains('skip-link')) continue;
        // A checkbox is as tappable as the label around it, and a label around a field is just its caption.
        if (e instanceof HTMLInputElement && e.closest('label')) continue;
        if (e instanceof HTMLLabelElement && e.querySelector('input, select, textarea')) continue;
        // Links inside a sentence are exempt, as in WCAG's target-size rule.
        if (e instanceof HTMLAnchorElement && e.closest('p') && getComputedStyle(e).display === 'inline') continue;
        if (touch && (b.width < 44 || b.height < 44)) small.push(`${e.tagName.toLowerCase()} ${Math.round(b.width)}x${Math.round(b.height)} ${(e.textContent ?? '').trim().slice(0, 24)}`);
      }
      let tiny = 0;
      for (const e of document.querySelectorAll('body *')) {
        const own = [...e.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim());
        if (own && parseFloat(getComputedStyle(e).fontSize) < 11) tiny += 1;
      }
      return {
        axe: r.violations.map((v) => `${v.id} x${v.nodes.length}`),
        small,
        tiny,
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    }, touch);
    const key = `${size.name} ${path}`;
    results[key] = { axe: found.axe.length, small: found.small.length, tiny: found.tiny, overflow: found.overflow, errors };
    if (found.axe.length) details.push(`${key}: axe ${found.axe.join(', ')}`);
    if (found.small.length) details.push(`${key}: ${found.small.length} small, e.g. ${found.small.slice(0, 3).join('; ')}`);
    await page.close();
  }
  await context.close();
}
await browser.close();
await server.close();

if (writeBudget) {
  writeFileSync(BUDGET_FILE, JSON.stringify(results, null, 2) + '\n');
  console.log(`Wrote ${BUDGET_FILE} for ${Object.keys(results).length} page/size pairs.`);
  process.exit(0);
}

const budget = JSON.parse(readFileSync(BUDGET_FILE, 'utf8')) as Budget;
const worse: string[] = [];
for (const [key, r] of Object.entries(results)) {
  const b = budget[key] ?? { axe: 0, small: 0, tiny: 0, overflow: false, errors: 0 };
  if (r.axe > b.axe) worse.push(`${key}: ${r.axe} accessibility problems (budget ${b.axe})`);
  if (r.small > b.small) worse.push(`${key}: ${r.small} small tap targets (budget ${b.small})`);
  if (r.tiny > b.tiny) worse.push(`${key}: ${r.tiny} tiny text spots (budget ${b.tiny})`);
  if (r.overflow && !b.overflow) worse.push(`${key}: the page scrolls sideways`);
  if (r.errors > b.errors) worse.push(`${key}: ${r.errors} console errors (budget ${b.errors})`);
}
const sum = (f: (r: Result) => number) => Object.values(results).reduce((n, r) => n + f(r), 0);
console.log(`${Object.keys(results).length} page/size pairs: ${sum((r) => r.axe)} axe, ${sum((r) => r.small)} small targets, ${sum((r) => r.tiny)} tiny text, ${sum((r) => r.errors)} console errors.`);
if (details.length) console.log(details.join('\n'));
if (worse.length) {
  console.error(`\nWorse than the budget:\n${worse.join('\n')}`);
  process.exit(1);
}
console.log('Within the budget.');
