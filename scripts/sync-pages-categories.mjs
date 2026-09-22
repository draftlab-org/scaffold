#!/usr/bin/env node
// -----------------------------------------------------------------------------
// Sync PagesCMS category dropdowns from the category source of truth.
//
// PagesCMS `select` fields only support hardcoded local `values:` lists (there
// is no fetch-from-API option). To avoid hand-maintaining those lists in every
// spot they appear, each category-bound select in `.pages.yml` wraps its
// `values:` block in marker comments tied to a category id:
//
//     # pages-cms:category-sync start <id>
//     values:
//       - ...
//     # pages-cms:category-sync end
//
// This script rewrites the content between those markers from
// `src/content/categories/<id>.json`.
//
// Run locally with `npm run sync:pages-categories`. It also runs in CI on push
// (see .github/workflows/sync-pages-categories.yml).
//
// The script refuses to write and exits non-zero on anything it does not
// recognise, like an unknown category id, or a block with no end
// marker.
// -----------------------------------------------------------------------------
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const checkOnly = process.argv.includes('--check');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATEGORIES_DIR = join(root, 'src/content/categories');
const PAGES_YML = join(root, '.pages.yml');

const errors = [];

// id -> category entries, loaded from the JSON source of truth. An entry is either a
// plain string (label and stored value are the same) or an object carrying at least
// `id` and `name`. A half-formed object would silently emit `undefined` into the
// dropdown, so reject the file instead of writing it.
const categories = {};
for (const file of readdirSync(CATEGORIES_DIR)) {
  if (!file.endsWith('.json')) continue;
  const data = JSON.parse(readFileSync(join(CATEGORIES_DIR, file), 'utf8'));
  if (!data || typeof data.id !== 'string' || !Array.isArray(data.categories))
    continue;

  const bad = data.categories.findIndex(
    (entry) =>
      typeof entry !== 'string' &&
      !(entry && typeof entry.id === 'string' && typeof entry.name === 'string')
  );
  if (bad !== -1) {
    errors.push(
      `${file}: categories[${bad}] must be a string, or an object with string "id" and "name".`
    );
    continue;
  }

  categories[data.id] = data.categories;
}

const START = /^(\s*)#\s*pages-cms:category-sync start (\S+)/;
const END = /^\s*#\s*pages-cms:category-sync end\b/;
// Inside a block we only ever write a `values:` key and its list items — either
// plain scalars (`- Foo`) or label/value pairs for object-shaped categories.
// Anything else means the markers drifted or were wrapped around the wrong lines,
// so we refuse to overwrite content this script did not produce.
const BODY = /^\s*(values:\s*$|-\s|label:\s|value:\s)/;

// Quote a YAML scalar only when the plain form would be ambiguous.
// YAML (1.1 and 1.2) would read these as booleans or null if left unquoted
const YAML_RESERVED =
  /^(y|n|yes|no|true|false|on|off|null|nil|~)$/i;

function yamlScalar(value) {
  const text = String(value);
  const plain =
    /^[A-Za-z0-9][A-Za-z0-9 _.()+/-]*$/.test(text) &&
    !text.endsWith(' ') &&
    !YAML_RESERVED.test(text) &&
    // Anything starting with a digit could parse as a number, date or
    // sexagesimal value, so quote it to keep it a string
    !/^[0-9]/.test(text);
  return plain ? text : JSON.stringify(text);
}

const lines = readFileSync(PAGES_YML, 'utf8').split('\n');
const out = [];
let changed = 0;

for (let i = 0; i < lines.length; i++) {
  const match = lines[i].match(START);
  if (!match) {
    // End markers are consumed with their block below, so any that reach here
    // are orphaned.
    if (END.test(lines[i])) {
      errors.push(
        `Stray category-sync end marker with no start (line ${i + 1}).`
      );
    }
    out.push(lines[i]);
    continue;
  }

  const [, indent, id] = match;
  // Stop at the next marker in either direction: a block must never extend past
  // the start of the following one.
  let end = i + 1;
  while (end < lines.length && !END.test(lines[end]) && !START.test(lines[end]))
    end++;

  if (end >= lines.length || START.test(lines[end])) {
    errors.push(
      `Unterminated category-sync block for "${id}" (line ${i + 1}).`
    );
    out.push(lines[i]);
    continue;
  }
  if (!(id in categories)) {
    errors.push(
      `No src/content/categories/${id}.json for marker "${id}" (line ${i + 1}).`
    );
    for (let k = i; k <= end; k++) out.push(lines[k]);
    i = end;
    continue;
  }

  const body = lines.slice(i + 1, end);
  const stray = body.findIndex((line) => line.trim() && !BODY.test(line));
  if (stray !== -1) {
    errors.push(
      `Unexpected content in category-sync block "${id}" (line ${
        i + 2 + stray
      }): ${body[stray].trim()}`
    );
    for (let k = i; k <= end; k++) out.push(lines[k]);
    i = end;
    continue;
  }

  // Object-shaped categories carry an explicit `order`, so list them the same way the
  // site does. Flat lists keep their hand-curated file order.
  const entries = [...categories[id]];
  if (entries.every((e) => typeof e === 'object'))
    entries.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const rebuilt = [lines[i], `${indent}values:`];
  for (const entry of entries) {
    if (typeof entry === 'string') {
      // Flat category list: the label and the stored value are the same string.
      rebuilt.push(`${indent}  - ${yamlScalar(entry)}`);
    } else {
      // Object-shaped category: show `name` in the dropdown, store `id`.
      rebuilt.push(`${indent}  - label: ${yamlScalar(entry.name)}`);
      rebuilt.push(`${indent}    value: ${yamlScalar(entry.id)}`);
    }
  }
  rebuilt.push(lines[end]);

  if (lines.slice(i, end + 1).join('\n') !== rebuilt.join('\n')) changed++;
  out.push(...rebuilt);
  i = end;
}

if (errors.length) {
  console.error(
    `sync:pages-categories failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`
  );
  process.exit(1);
}

if (checkOnly) {
  if (changed) {
    console.error(
      `sync:pages-categories — .pages.yml is out of date (${changed} category list(s)). Run \`npm run sync:pages-categories\`.`
    );
    process.exit(1);
  }
  console.log('sync:pages-categories — .pages.yml category lists are in sync');
  process.exit(0);
}

writeFileSync(PAGES_YML, out.join('\n'));
console.log(
  changed
    ? `sync:pages-categories — updated ${changed} category list(s) in .pages.yml`
    : 'sync:pages-categories — .pages.yml category lists already in sync'
);
