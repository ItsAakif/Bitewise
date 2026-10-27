#!/usr/bin/env node
// Prints the SHA-1 of the certificate your debug build is signed with — the value
// Firebase wants for an Android app. Google Sign-In fails with DEVELOPER_ERROR
// when this fingerprint is missing, and the error never mentions fingerprints.
//
//   npm run android:sha1

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = process.cwd();

function run(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    return null;
  }
}

function findKeystore() {
  const candidates = [
    path.join(ROOT, 'android', 'app', 'debug.keystore'),
    path.join(os.homedir(), '.android', 'debug.keystore'),
  ];
  return candidates.find((file) => fs.existsSync(file)) || null;
}

function findApk() {
  const dir = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'apk');
  if (!fs.existsSync(dir)) return null;
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        const found = walk(full);
        if (found) return found;
      } else if (entry.name.endsWith('.apk')) {
        return full;
      }
    }
    return null;
  };
  return walk(dir);
}

function sha1FromKeystore(file) {
  const output =
    run('keytool', [
      '-list', '-v',
      '-keystore', file,
      '-alias', 'androiddebugkey',
      '-storepass', 'android',
      '-keypass', 'android',
    ]) || run('keytool', ['-list', '-v', '-keystore', file, '-storepass', 'android']);

  if (!output) return null;
  const match = /SHA1:\s*([0-9A-F:]{20,})/i.exec(output) || /SHA-1:\s*([0-9A-F:]{20,})/i.exec(output);
  return match ? match[1].toUpperCase() : null;
}

function sha1FromApk(file) {
  const output = run('keytool', ['-printcert', '-jarfile', file]);
  if (!output) return null;
  const match = /SHA1:\s*([0-9A-F:]{20,})/i.exec(output);
  return match ? match[1].toUpperCase() : null;
}

console.log('\nSHA-1 for Firebase\n');

const apk = findApk();
if (apk) {
  const sha1 = sha1FromApk(apk);
  if (sha1) {
    console.log(`  Built APK : ${path.relative(ROOT, apk)}`);
    console.log(`  SHA-1     : ${sha1}\n`);
    console.log('Paste that into Firebase → Project settings → Your apps → your Android app');
    console.log('→ Add fingerprint.\n');
    process.exit(0);
  }
}

const keystore = findKeystore();
if (keystore) {
  const sha1 = sha1FromKeystore(keystore);
  if (sha1) {
    console.log(`  Keystore  : ${keystore}`);
    console.log(`  SHA-1     : ${sha1}\n`);
    console.log('Paste that into Firebase → Project settings → Your apps → your Android app');
    console.log('→ Add fingerprint.\n');
    process.exit(0);
  }
}

console.log('  No debug keystore or APK found yet — it is created by the first debug build.\n');
console.log('  Two ways forward:\n');
console.log('  1. Build locally (needs the Android SDK):');
console.log('       npx expo run:android');
console.log('       npm run android:sha1\n');
console.log('  2. Build in the cloud (no SDK needed):');
console.log('       eas build --profile development --platform android');
console.log('       eas credentials --platform android   # shows the SHA-1 EAS generated\n');
console.log('  Either way, Google Sign-In will not work until a fingerprint is registered');
console.log('  for the Android app in Firebase, and the package name must match');
console.log('  app.json → expo.android.package.\n');
