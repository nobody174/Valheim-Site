// Screenshot pages of the built site in a headless Edge/Chrome, for a first-time-visitor review.
// Usage (Node 20: needs --experimental-websocket):
//   npm run build && npx vite preview --port 4173 &
//   msedge --headless=new --remote-debugging-port=9450 --user-data-dir=<fresh dir> about:blank &
//   MSYS_NO_PATHCONV=1 node --experimental-websocket tools/review/screenshots.mjs 9450 <outDir> desktop|mobile "home,/items,/item/Wood"
// Use a fresh --user-data-dir each time: the PWA service worker would otherwise serve an old build.
import { writeFileSync } from 'node:fs';
const [, , port, outDir, mode] = process.argv;
const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg.result ?? msg.error); };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'http://localhost:4173/Valheim-Site/';
await send('Page.enable');
const mobile = mode === 'mobile';
await send('Emulation.setDeviceMetricsOverride', mobile ? { width: 390, height: 1700, deviceScaleFactor: 1, mobile: true } : { width: 1280, height: 1500, deviceScaleFactor: 1, mobile: false });
const routes = (process.argv[5] || '').split(',').map((r) => (r === 'home' ? '/' : r));
for (const r of routes) {
  await send('Page.navigate', { url: BASE + '#' + r });
  await sleep(500);
  // full-page capture
  const h = mobile ? 1700 : 1500;
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const name = (mobile ? 'm' : 'd') + '_' + r.replace(/[^a-z0-9]+/gi, '_');
  writeFileSync(`${outDir}/rv_${name}.png`, Buffer.from(shot.data, 'base64'));
  console.log(name, h);
}
ws.close();
