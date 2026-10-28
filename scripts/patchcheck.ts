import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Is the installed game newer than the data? Compares the Steam build id of the installed game
 * (from its appmanifest file) with `data/meta.json`. Run it before you play after a Steam update:
 *
 *   npm run patchcheck
 *
 * Set VALHEIM_MANIFEST to another appmanifest_892970.acf path if the game is not on D:.
 * Exit code: 0 up to date, 1 the game has updated, 2 the manifest was not found.
 */
const manifest = process.env.VALHEIM_MANIFEST ?? 'D:/SteamLibrary/steamapps/appmanifest_892970.acf';

if (!existsSync(manifest)) {
  console.error(`Cannot find ${manifest}. Set VALHEIM_MANIFEST to the path of appmanifest_892970.acf.`);
  process.exit(2);
}

const build = /"buildid"\s+"(\d+)"/.exec(readFileSync(manifest, 'utf8'))?.[1];
if (!build) {
  console.error('No buildid in the manifest.');
  process.exit(2);
}

const meta = JSON.parse(readFileSync(join(process.cwd(), 'data', 'meta.json'), 'utf8')) as { gameVersion: string };
const dataBuild = /(\d+)/.exec(meta.gameVersion)?.[1];

if (dataBuild === build) {
  console.log(`Up to date: the game and the data are both Steam build ${build}.`);
} else {
  console.log(`The game has updated: installed build ${build}, data is from build ${dataBuild}.`);
  console.log('Follow docs/UPDATE_AFTER_PATCH.md. The Update log page will list what changed.');
  process.exit(1);
}
