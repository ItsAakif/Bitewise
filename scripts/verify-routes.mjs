// Route registration check. Only calls that actually target a navigator are
// considered: `navigation.navigate(...)` / `push` / `replace`, and bare
// `navigate(...)` from a destructured navigator. A string's `.replace()` must
// not be mistaken for navigation.

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

function readNameAttribute(node) {
  if (!node || node.type !== 'JSXAttribute' || node.name?.name !== 'name') return null;
  const value = node.value;
  if (value?.type === 'StringLiteral') return value.value;
  if (value?.type === 'JSXExpressionContainer' && value.expression?.type === 'StringLiteral') {
    return value.expression.value;
  }
  return null;
}

/** True when the callee's receiver is a navigator object. */
function isNavigatorCallee(callee) {
  if (callee?.type === 'Identifier') {
    return callee.name === 'navigate' || callee.name === 'goBack';
  }
  if (callee?.type !== 'MemberExpression') return false;
  const method = callee.property?.name;
  if (!['navigate', 'push', 'replace'].includes(method)) return false;

  let receiver = callee.object;
  while (receiver) {
    if (receiver.type === 'Identifier') return /nav/i.test(receiver.name);
    if (receiver.type === 'MemberExpression') {
      if (receiver.property?.name && /nav/i.test(receiver.property.name)) return true;
      receiver = receiver.object;
      continue;
    }
    if (receiver.type === 'CallExpression') {
      receiver = receiver.callee;
      continue;
    }
    return false;
  }
  return false;
}

// ── registered routes ─────────────────────────────────────────────────────────
const registered = new Set();
const navDir = path.join(SRC, 'navigation');
for (const file of fs.readdirSync(navDir).filter((f) => f.endsWith('.js'))) {
  const ast = parseFile(path.join(navDir, file));
  (function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXOpeningElement') {
      for (const attr of node.attributes || []) {
        const name = readNameAttribute(attr);
        if (name) registered.add(name);
      }
    }
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object' && value.type) visit(value);
    }
  })(ast.program);
}

if (!registered.size) {
  console.error('verify:routes — no registered routes found in src/navigation');
  process.exit(1);
}

// ── navigation calls ──────────────────────────────────────────────────────────
const problems = [];
const dynamic = [];
let callCount = 0;

for (const file of walk(SRC)) {
  if (file.startsWith(navDir)) continue;
  let ast;
  try {
    ast = parseFile(file);
  } catch {
    continue;
  }

  (function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'CallExpression' && isNavigatorCallee(node.callee)) {
      callCount += 1;
      const first = node.arguments?.[0];
      if (first?.type === 'StringLiteral') {
        if (!registered.has(first.value)) {
          problems.push(
            `${path.relative(ROOT, file)}:${node.loc?.start.line} navigates to "${first.value}" — not registered`
          );
        }
      } else if (first) {
        dynamic.push(`${path.relative(ROOT, file)}:${node.loc?.start.line}`);
      }
    }
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object' && value.type) visit(value);
    }
  })(ast.program);
}

if (problems.length) {
  console.error(`verify:routes — ${problems.length} unregistered target(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

const dynamicNote = dynamic.length ? `, ${dynamic.length} dynamic (not checked)` : '';
console.log(
  `verify:routes — ok (${registered.size} routes, ${callCount} navigation calls${dynamicNote})`
);
