// Session-unique identifiers. Monotonic counter plus base36 time, so ids are
// stable across a session and cannot collide when two items are added in the
// same millisecond.

let counter = 0;

export function uid(prefix = 'id') {
  counter += 1;
  return `${prefix}-${counter}-${Date.now().toString(36)}`;
}

export function resetUidCounter() {
  counter = 0;
}

export default uid;
