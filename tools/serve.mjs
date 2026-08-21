#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   serve.mjs — local host for alterhero.xyz that behaves like the deploy, and
   keeps the book in step with the folder you draw into.

       node tools/serve.mjs            # http://localhost:8000, watching
       node tools/serve.mjs 3000       # pick a port
       node tools/serve.mjs --no-watch # serve only, do not touch book.json

   Two jobs:

   1. Serve like Netlify. An ordinary static server (`npx serve`) answers a
      missing file with a real 404. Netlify does not — the `/*  /index.html 200`
      line in _redirects sends anything unmatched to the homepage with status
      200. That difference is exactly what hid the empty-shelves bug, because
      the reader's `if(!r.ok)` check never fired. This reads _redirects and
      applies the same rules, so a path that would break in production breaks
      here too.

   2. Watch the page folders. Drawing a page into ~/Desktop/PHENO.MENAH! copies
      it in and rewrites book.json; refreshing the reader then picks it up.

   No dependencies.
   --------------------------------------------------------------------------- */

import { createServer } from 'node:http';
import { readFileSync, statSync, createReadStream } from 'node:fs';
import { join, resolve, extname, normalize } from 'node:path';
import { buildBook, watchSources, describe } from './build-book.mjs';

const ARGS  = process.argv.slice(2);
const FLAGS = ARGS.filter(a => a.startsWith('--'));
const REST  = ARGS.filter(a => !a.startsWith('--'));

const PORT  = Number(REST[0]) || 8000;
const ROOT  = resolve(REST[1] || '.');
const WATCH = !FLAGS.includes('--no-watch');

const TYPES = {
  '.html': 'text/html; charset=utf-8',   '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.csv': 'text/csv; charset=utf-8',
  '.jpg':  'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif':  'image/gif',  '.svg':  'image/svg+xml', '.webp': 'image/webp',
  '.ico':  'image/x-icon', '.pdf': 'application/pdf',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.mp3':  'audio/mpeg', '.wav': 'audio/wav', '.mp4': 'video/mp4',
  '.wasm': 'application/wasm', '.rar': 'application/vnd.rar',
};

/* _redirects: "from  to  status", status may carry a trailing ! meaning the
   rule wins even when a real file sits at that path. */
function loadRules() {
  let text = '';
  try { text = readFileSync(join(ROOT, '_redirects'), 'utf8'); } catch { return []; }
  return text.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const [from, to, status = '200'] = l.split(/\s+/);
      return { from, to, status: parseInt(status, 10) || 200, force: status.endsWith('!') };
    })
    .filter(r => r.from && r.to);
}

const RULES = loadRules();

const matches = (rule, path) =>
  rule.from.endsWith('/*') ? path.startsWith(rule.from.slice(0, -1)) : rule.from === path;

function fileAt(path) {
  /* normalize first so ../ cannot climb out of ROOT */
  const full = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ''));
  if (!full.startsWith(ROOT)) return null;
  try {
    const s = statSync(full);
    if (s.isDirectory()) {
      const idx = join(full, 'index.html');
      return statSync(idx).isFile() ? { full: idx, size: statSync(idx).size } : null;
    }
    return { full, size: s.size };
  } catch { return null; }
}

createServer((req, res) => {
  /* decodeURIComponent is the point: page filenames carry '#', which reaches
     here as %23 and must be turned back into a real '#' to find the file. */
  let path;
  try { path = decodeURIComponent(req.url.split('?')[0]); }
  catch { path = req.url.split('?')[0]; }

  let status = 200;
  let hit = null;

  const forced = RULES.find(r => r.force && matches(r, path));
  if (forced) { hit = fileAt(forced.to); status = forced.status; }

  if (!hit) hit = fileAt(path);

  if (!hit) {
    const rule = RULES.find(r => matches(r, path));
    if (rule) {
      hit = fileAt(rule.to);
      status = rule.status;
      /* the thing that trips people up, said out loud */
      if (hit && rule.from.endsWith('/*'))
        console.log(`  \x1b[33m${path} -> ${rule.to} (${status})  [not a real file — Netlify would do this too]\x1b[0m`);
    }
  }

  if (!hit) {
    console.log(`  \x1b[31m404 ${path}\x1b[0m`);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('404');
  }

  res.writeHead(status, {
    'Content-Type': TYPES[extname(hit.full).toLowerCase()] || 'application/octet-stream',
    'Content-Length': hit.size,
    'Cache-Control': 'no-store',
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(hit.full).pipe(res);
}).listen(PORT, () => {
  console.log(`\n  alterhero.xyz  ->  http://localhost:${PORT}`);
  console.log(`  serving ${ROOT}`);
  console.log(`  ${RULES.length} rule(s) from _redirects\n`);

  if (WATCH) {
    console.log(describe(buildBook({ site: ROOT })));
    console.log('');
    watchSources(() => {
      const r = buildBook({ site: ROOT });
      if (!r.copied && !r.changed) return;
      const stamp = new Date().toTimeString().slice(0, 8);
      console.log(`  \x1b[32m${stamp}  +${r.copied} image(s), book.json ${r.changed ? 'updated — refresh the reader' : 'unchanged'}\x1b[0m`);
    });
    console.log('  watching for new pages\n');
  }

  console.log(`  the reader:    http://localhost:${PORT}/READIM.html`);
  console.log(`  ctrl-c to stop\n`);
});
