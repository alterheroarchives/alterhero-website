#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   build-book.mjs — keep assets/readim/book.json in step with the folders where
   the pages are actually drawn.

   The reader (READIM.html) seeds its shelves from book.json. That manifest is
   just a list of filenames per chapter, in reading order, so it goes stale the
   moment you draw a new page. This copies the images into the site and rewrites
   the manifest from what is on disk.

       node tools/build-book.mjs             # copy pages in + rewrite book.json
       node tools/build-book.mjs --watch     # ...and keep doing it as you draw
       node tools/build-book.mjs --dry-run   # show what would change, touch nothing

   `tools/serve.mjs` imports buildBook/watchSources from here, so running the
   local server already does all of this — you rarely need to call this directly.

   Add a chapter by adding a line to SOURCES below. A chapter with no source
   folder yet stays in the manifest with an empty page list, which is what the
   reader expects for arcs you have not started.
   --------------------------------------------------------------------------- */

import { readdirSync, mkdirSync, copyFileSync, writeFileSync, readFileSync,
         statSync, utimesSync, watch } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

/* Where each chapter's pages are drawn. Keys must match the CHAPTERS ids in
   READIM.html — anything else is ignored by the reader. */
export const SOURCES = {
  PHE: join(homedir(), 'Desktop', 'PHENO.MENAH!'),
  NO:  null,
  MEN: null,
  AH:  null,
};

/* Any chapter's folder can be pointed elsewhere for one run without editing
   the table above: AH_SRC_PHE=/some/other/folder node tools/build-book.mjs */
for (const id of Object.keys(SOURCES)) {
  const override = process.env['AH_SRC_' + id];
  if (override) SOURCES[id] = override;
}

const IMAGE = /\.(jpe?g|png)$/i;

/* The PHENOMENAH panel on the homepage shows the opening pages of the book.
   index.html reads a fixed list, P1..P4.jpg, so those filenames are a contract
   meaning "the first four pages of PHE" — not the names of any particular
   drawing. Two copies of each, matching the structure index.html's own comment
   describes: the full-resolution page in assets/originals/PHE/ for the view that
   opens on click, and a ~700x1000 copy in assets/thumbnails/PHE/ for the grid,
   so the homepage does not pull four 2MB scans just to draw four small tiles.
   Regenerated here so the panel cannot drift out of step with the book. */
const PANEL = {
  chapter: 'PHE',
  originals:  join('assets', 'originals', 'PHE'),   // full resolution, opened on click
  thumbnails: join('assets', 'thumbnails', 'PHE'),  // downscaled, shown in the grid
  count:   4,
  height:  1000,
  name:    i => 'P' + (i + 1) + '.jpg',
};

/* Whatever the machine happens to have. sips ships with macOS, so that is the
   one that normally runs; the rest are for anything else. If none of them work
   the panel is left alone and the caller says so — far better than publishing
   four full-resolution scans onto the homepage. */
function resize(from, to, height) {
  const q = s => "'" + String(s).replace(/'/g, "'\\''") + "'";
  const attempts = [
    ['sips',    `sips --resampleHeight ${height} ${q(from)} --out ${q(to)}`],
    ['magick',  `magick ${q(from)} -resize x${height} -quality 82 ${q(to)}`],
    ['convert', `convert ${q(from)} -resize x${height} -quality 82 ${q(to)}`],
    ['ffmpeg',  `ffmpeg -y -loglevel error -i ${q(from)} -vf scale=-2:${height} -q:v 3 ${q(to)}`],
  ];
  for (const [tool, cmd] of attempts) {
    try {
      execSync(cmd, { stdio: 'ignore' });
      if (statSync(to).size > 0) return tool;
    } catch { /* try the next one */ }
  }
  return null;
}

/* Keep the panel images in step with the opening pages. Staleness is judged the
   same way as the page copies — the output carries its source's mtime, so an
   unchanged opening costs nothing and a reordered or redrawn one is rebuilt. */
function syncPanel(SITE, chapters, dry) {
  const chapter = chapters.find(c => c.id === PANEL.chapter);
  const src = SOURCES[PANEL.chapter];
  if (!chapter || !src) return { originals: 0, thumbs: 0, tool: null, noResizer: 0 };

  const opening   = chapter.pages.slice(0, PANEL.count);
  const origDir   = join(SITE, PANEL.originals);
  const thumbDir  = join(SITE, PANEL.thumbnails);
  let originals = 0, thumbs = 0, tool = null, noResizer = 0;

  const fresh = (from, to) => {
    try {
      const s = statSync(from), d = statSync(to);
      return Math.abs(s.mtimeMs - d.mtimeMs) <= 1000;
    } catch { return false; }
  };
  const stamp = (from, to) => { const s = statSync(from); utimesSync(to, s.atime, s.mtime); };

  opening.forEach((pg, i) => {
    const from  = join(src, pg.file);
    const full  = join(origDir,  PANEL.name(i));
    const thumb = join(thumbDir, PANEL.name(i));

    if (!fresh(from, full)) {
      if (dry) { originals += 1; }
      else {
        mkdirSync(origDir, { recursive: true });
        copyFileSync(from, full);
        stamp(from, full);
        originals += 1;
      }
    }

    if (!fresh(from, thumb)) {
      if (dry) { thumbs += 1; }
      else {
        mkdirSync(thumbDir, { recursive: true });
        const used = resize(from, thumb, PANEL.height);
        if (!used) { noResizer += 1; }
        else { tool = used; stamp(from, thumb); thumbs += 1; }
      }
    }
  });

  return { originals, thumbs, tool, noResizer };
}

/* Reading order. A plain string sort puts "SC10" before "SC2", so digit-runs
   compare as numbers and everything else as text. Digits sort before letters,
   which keeps SC3.#3 ahead of SC3.#DRAW4.

   The extension comes off first. Left on, "SC2.#2.5.jpg" and "SC2.#2.jpg"
   diverge at "." vs ".jpg" and the inserted half-page lands *before* the page
   it was drawn to follow. Stripped, the shorter name simply runs out and sorts
   first — which is the whole point of numbering a page 2.5. */
export function naturalCompare(a, b) {
  const base = s => s.toLowerCase().replace(IMAGE, '');
  const split = s => s.match(/\d+|\D+/g) || [];
  const A = split(base(a)), B = split(base(b));
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    const x = A[i], y = B[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const nx = /^\d/.test(x), ny = /^\d/.test(y);
    if (nx && ny) { const d = Number(x) - Number(y); if (d) return d; }
    else if (nx !== ny) return nx ? -1 : 1;
    else if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

function listImages(dir) {
  try { return readdirSync(dir).filter(f => IMAGE.test(f) && !f.startsWith('.')).sort(naturalCompare); }
  catch { return []; }
}

/* Returns { copied, bytes, changed, chapters:[{id,count,src}] }. Quiet by
   default so the watcher can decide what is worth printing. */
export function buildBook({ site = '.', dry = false } = {}) {
  const SITE       = resolve(site);
  const PAGES_ROOT = join(SITE, 'assets', 'readim', 'pages');
  const BOOK       = join(SITE, 'assets', 'readim', 'book.json');

  let previous = null;
  try { previous = JSON.parse(readFileSync(BOOK, 'utf8')); } catch { /* first run */ }

  const chapters = [];
  const summary  = [];
  let copied = 0, bytes = 0;

  for (const [id, src] of Object.entries(SOURCES)) {
    const dest  = join(PAGES_ROOT, id);
    const files = src ? listImages(src) : [];

    if (files.length && !dry) mkdirSync(dest, { recursive: true });

    for (const f of files) {
      const from = join(src, f), to = join(dest, f);
      let stale = true;
      try {
        const s = statSync(from), d = statSync(to);
        /* Timestamps do not survive the copy exactly — utimes truncates the
           sub-millisecond part, and some filesystems keep only whole seconds —
           so "same file" means same size and same mtime to within a second,
           not a bit-identical mtimeMs. */
        stale = s.size !== d.size || Math.abs(s.mtimeMs - d.mtimeMs) > 1000;
      } catch { /* not there yet */ }
      if (!stale) continue;

      if (!dry) {
        copyFileSync(from, to);
        /* copyFileSync does not carry the timestamp over, so without this the
           staleness check above is always true and every run recopies the lot. */
        const s = statSync(from);
        utimesSync(to, s.atime, s.mtime);
      }
      copied += 1;
      bytes += statSync(from).size;
    }

    /* Keep any caption already written against a filename — the manifest is
       regenerated, but names are hand-typed and must survive that. */
    const oldNames = {};
    const oldChapter = previous?.chapters?.find(c => c.id === id);
    (oldChapter?.pages || []).forEach(p => { if (p.name) oldNames[p.file] = p.name; });

    /* "v" is the page's mtime in whole seconds. Without it the manifest is just
       a list of names, so redrawing a page under the same name produces an
       identical book.json  and the reader, which decides what to do by
       comparing manifest text, would never learn the drawing had changed. */
    chapters.push({
      id,
      pages: files.map(f => {
        let v = 0;
        try { v = Math.floor(statSync(join(src, f)).mtimeMs / 1000); } catch {}
        return { file: f, name: oldNames[f] || '', v };
      }),
    });
    summary.push({ id, count: files.length, src });
  }

  const json    = JSON.stringify({ chapters }, null, 2) + '\n';
  const before  = previous ? JSON.stringify(previous, null, 2) + '\n' : null;
  const changed = json !== before;

  if (!dry && changed) writeFileSync(BOOK, json);

  const panel = syncPanel(SITE, chapters, dry);

  return { copied, bytes, changed, chapters: summary, book: BOOK, panel };
}

/* Watch every configured source folder and call onChange after things settle.
   fs.watch fires several times for one save — rename, then content, sometimes
   an editor's temp file — so the debounce is what keeps this from rebuilding
   four times per drawing. Returns a stop() function. */
export function watchSources(onChange, delay = 400) {
  const watchers = [];
  let timer = null;

  const ping = () => {
    clearTimeout(timer);
    timer = setTimeout(onChange, delay);
  };

  for (const [id, src] of Object.entries(SOURCES)) {
    if (!src) continue;
    try {
      watchers.push(watch(src, ping));
    } catch {
      console.log(`  (cannot watch ${id} at ${src} — folder missing?)`);
    }
  }

  return () => { clearTimeout(timer); watchers.forEach(w => w.close()); };
}

export function describe(result, { dry = false } = {}) {
  const lines = result.chapters.map(c =>
    `  ${c.id.padEnd(4)} ${c.src ? `${c.count} page(s) from ${c.src}` : 'no source folder yet'}`);
  const mb = (result.bytes / 1048576).toFixed(1);
  lines.push('');
  lines.push(`${dry ? '[dry run] ' : ''}${result.copied} image(s) ${dry ? 'would be ' : ''}copied (${mb} MB)`);
  lines.push(`${dry ? '[dry run] ' : ''}book.json ${result.changed ? (dry ? 'would change' : 'rewritten') : 'unchanged'} — ${result.book}`);

  const p = result.panel;
  if (p && (p.originals || p.thumbs || p.noResizer)) {
    lines.push(`${dry ? '[dry run] ' : ''}PHENOMENAH panel: ${p.originals} original(s), ${p.thumbs} thumbnail(s)` +
               (p.tool ? ` via ${p.tool}` : ''));
    if (p.noResizer)
      lines.push(`  !! ${p.noResizer} thumbnail(s) not made — no sips/magick/convert/ffmpeg on this machine.\n` +
                 `     The grid will fall back to whatever is already in assets/thumbnails/PHE/.`);
  }
  return lines.join('\n');
}

/* ---------------------------------------------------------------------------
   CLI
   --------------------------------------------------------------------------- */
const runDirectly = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (runDirectly) {
  const dry     = process.argv.includes('--dry-run');
  const watching = process.argv.includes('--watch');
  const site    = process.argv.slice(2).find(a => !a.startsWith('--')) || '.';

  const once = () => {
    const r = buildBook({ site, dry });
    console.log(describe(r, { dry }));
    return r;
  };

  const first = once();
  if (first.changed && !dry && !watching)
    console.log('\nCommit and deploy, then refresh the reader to pick it up.');

  if (watching) {
    console.log('\nwatching for new pages — ctrl-c to stop\n');
    watchSources(() => {
      const r = buildBook({ site });
      if (r.copied || r.changed) {
        const stamp = new Date().toTimeString().slice(0, 8);
        console.log(`  ${stamp}  +${r.copied} image(s), book.json ${r.changed ? 'updated' : 'unchanged'}`);
      }
    });
  }
}
