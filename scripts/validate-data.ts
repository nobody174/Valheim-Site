import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { FILE_SCHEMAS } from '../src/data/schemas';
import { validateData, type RawData } from './validate-lib';

const dataDir = join(process.cwd(), 'data');
const raw: RawData = {};
const fail: string[] = [];

for (const name of ['meta', ...Object.keys(FILE_SCHEMAS)]) {
  const path = join(dataDir, `${name}.json`);
  if (!existsSync(path)) {
    fail.push(`${name}.json: file missing`);
    continue;
  }
  try {
    raw[name] = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    fail.push(`${name}.json: invalid JSON (${(e as Error).message})`);
  }
}

const result = validateData(raw);
const errors = [...fail, ...result.errors];

console.log('Data summary');
for (const [file, n] of Object.entries(result.counts)) console.log(`  ${file.padEnd(10)} ${n}`);
console.log(
  'Verified: ' +
    Object.entries(result.verified)
      .map(([k, v]) => `${k}=${v}`)
      .join('  '),
);

if (errors.length > 0) {
  console.error(`\nValidation FAILED (${errors.length} problem${errors.length === 1 ? '' : 's'}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('Validation passed.');
