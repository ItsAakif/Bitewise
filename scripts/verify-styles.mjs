#!/usr/bin/env node
// Catches the style-object shape that crashed the app on device.
//
// React Native runs an attribute processor over style values that are *present*.
// For array-shaped attributes (transform, fontVariant) that processor calls
// .forEach, so an explicitly present but null/undefined value throws:
//
//   Cannot read property 'forEach' of null
//
// The fix is to omit the key, not to set it to undefined. This check exists
// because the crash only appears on a device — no bundle or unit test sees it.
//
//   npm run verify:styles

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');

const ARRAY_STYLE_KEYS = ['transform', 'fontVariant', 'shadowOffset'];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const problems = [];

for (const file of walk(SRC)) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    // Comments describe the hazard; they are not the hazard.
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;

    for (const key of ARRAY_STYLE_KEYS) {
      // `key: <anything involving ?> ... : undefined` or `key: null`
      const conditional = new RegExp(`\\b${key}\\s*:[^,\\n]*\\?[^,\\n]*:\\s*(undefined|null)`);
      const explicitNull = new RegExp(`\\b${key}\\s*:\\s*(undefined|null)\\s*[,}]`);

      if (conditional.test(line) || explicitNull.test(line)) {
        problems.push(`${path.relative(ROOT, file)}:${index + 1} — ${key} may be null/undefined; omit the key instead`);
      }
    }
  });
}

if (problems.length) {
  console.error(`verify:styles — ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log('verify:styles — ok (no array-valued style key is conditionally undefined)');
