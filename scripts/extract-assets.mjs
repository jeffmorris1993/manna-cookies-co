// One-off: pull the brand assets out of the Sirrom prototype bundle into /public.
// Usage: node scripts/extract-assets.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { createReadStream } from 'node:fs';

const ASSETS = {
  'a7576aa7-5a6c-4f5a-902a-9ebe2c072826': 'logo.png',
  '77616ce3-2321-43b3-a913-a37ec8cc280f': 'logo-hero.png',
  '114416ab-64fe-4823-9d31-8d7cf9e81001': 'cookie-broken.jpg',
  '15c2569f-9b7a-4f6e-9a07-55a807b50691': 'customer.jpg',
  '0ff383d3-54a3-4a06-bd33-5e672b94315c': 'sea-salt.jpg',
  'dbb955b8-3a7f-4a26-9c93-89e4e9bb1caa': 'brown-butter.jpg',
  '6069334c-7f61-43d0-a0e4-bb6fb6e24dde': 'cookie-stack.jpg',
  'd8db0b83-9e07-4a83-bd05-04c6a3bcad2d': 'hero-source.mp4',
};

const rl = createInterface({ input: createReadStream('prototype/index.html'), crlfDelay: Infinity });
// the manifest is the single multi-megabyte JSON line in the file
let manifestLine = null;
for await (const line of rl) {
  const t = line.trim();
  if (t.startsWith('{"') && t.length > 1_000_000) { manifestLine = t; break; }
}
const manifest = JSON.parse(manifestLine);

mkdirSync('public', { recursive: true });
const found = Object.keys(manifest);
console.log(`manifest entries: ${found.length}`);
for (const [uuid, file] of Object.entries(ASSETS)) {
  // match by prefix — tail of some uuids was reconstructed from the report
  const key = found.find((k) => k.startsWith(uuid.slice(0, 8)));
  if (!key) { console.error(`MISSING ${uuid} (${file})`); continue; }
  const entry = manifest[key];
  const data = typeof entry === 'string' ? entry : entry.data;
  const buf = Buffer.from(data, 'base64');
  writeFileSync(`public/${file}`, buf);
  console.log(`${file}: ${(buf.length / 1024).toFixed(0)} KB (type: ${entry.type ?? 'unknown'})`);
}
