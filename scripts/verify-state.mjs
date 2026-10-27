#!/usr/bin/env node
// Fails when a screen reads state that the store does not have.
//
// This is the check that would have caught the original crash: HomeScreen read
// `state.nutrition.dailyLog` while the wired store had no such key, so the whole
// app threw on first render. Run with `npm run verify:state`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

function parseFile(file) {
  return parse(fs.readFileSync(file, 'utf8'), {
    sourceType: 'module',
    plugins: ['jsx'],
    errorRecovery: true,
  });
}

function propKeys(objectExpression) {
  const keys = [];
  for (const prop of objectExpression.properties || []) {
    if (prop.type !== 'ObjectProperty' && prop.type !== 'ObjectMethod') continue;
    if (prop.key.type === 'Identifier') keys.push(prop.key.name);
    else if (prop.key.type === 'StringLiteral') keys.push(prop.key.value);
  }
  return keys;
}

function findVariable(node, name, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (node.type === 'VariableDeclarator' && node.id?.name === name && node.init) out.push(node.init);
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) value.forEach((child) => findVariable(child, name, out));
    else if (value && typeof value === 'object' && value.type) findVariable(value, name, out);
  }
  return out;
}

// ── 1. reducer keys ───────────────────────────────────────────────────────────
const storeFile = path.join(SRC, 'redux', 'store.js');
const storeAst = parseFile(storeFile);
const reducerObjects = findVariable(storeAst, 'reducerMap');
if (!reducerObjects.length) {
  console.error('verify:state — could not find `reducerMap` in src/redux/store.js');
  process.exit(1);
}
const reducerKeys = propKeys(reducerObjects[0]).filter((k) => !k.startsWith('__'));

// ── 2. each slice's initialState keys ─────────────────────────────────────────
const sliceShapes = new Map(); // reducerKey -> Set(propertyName)
const slicesDir = path.join(SRC, 'redux', 'slices');
for (const file of fs.readdirSync(slicesDir).filter((f) => f.endsWith('.js'))) {
  const ast = parseFile(path.join(slicesDir, file));
  const inits = findVariable(ast, 'initialState');
  if (!inits.length) continue;
  const name = file.replace(/\.js$/, '').replace(/Slice$/, '');
  sliceShapes.set(name, new Set(propKeys(inits[0])));
}

// ── 3. every `state.X` / `state.X.Y` read in the app ──────────────────────────
const problems = [];
const reads = [];
for (const file of walk(SRC)) {
  if (file.includes(path.join('redux', 'slices'))) continue;
  let ast;
  try {
    ast = parseFile(file);
  } catch (error) {
    problems.push(`${path.relative(ROOT, file)} — unparseable: ${error.message}`);
    continue;
  }

  (function visit(node, parent) {
    if (!node || typeof node !== 'object') return;
    if (
      node.type === 'MemberExpression' &&
      node.object?.type === 'Identifier' &&
      node.object.name === 'state' &&
      node.computed === false &&
      node.property?.type === 'Identifier'
    ) {
      const key = node.property.name;
      reads.push({ file, key });
      if (!reducerKeys.includes(key)) {
        problems.push(`${path.relative(ROOT, file)} reads state.${key} — not a reducer key (${reducerKeys.join(', ')})`);
      } else if (parent?.type === 'MemberExpression' && parent.property?.name) {
        const shape = sliceShapes.get(key);
        const second = parent.property.name;
        // Only assert when we actually know the slice's initial state keys.
        if (shape && shape.size && !shape.has(second)) {
          problems.push(`${path.relative(ROOT, file)} reads state.${key}.${second} — not in that slice's initialState (${[...shape].join(', ')})`);
        }
      }
    }
    for (const k of Object.keys(node)) {
      if (k === 'loc' || k === 'start' || k === 'end' || k === 'extra' || k === 'leadingComments' || k === 'trailingComments') continue;
      const value = node[k];
      if (Array.isArray(value)) {
        value.forEach((child) => {
          if (child && typeof child === 'object' && child.type) visit(child, node);
        });
      } else if (value && typeof value === 'object' && value.type) {
        visit(value, node);
      }
    }
  })(ast.program, null);
}

if (problems.length) {
  console.error(`verify:state — ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

console.log(
  `verify:state — ok (${reducerKeys.length} reducer keys, ${reads.length} state reads, all resolved)`
);
