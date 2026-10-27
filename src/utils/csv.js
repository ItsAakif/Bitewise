// RFC 4180 CSV. Quoting is not optional here: food names contain commas
// ("Chicken breast, grilled") and a naive split would corrupt every export.

const needsQuoting = (value) => /[",\n\r]/.test(String(value ?? ''));

export function escapeCell(value) {
  const text = value == null ? '' : String(value);
  return needsQuoting(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCSV(rows = [], columns = []) {
  const header = columns.map((column) => escapeCell(column.label ?? column.key ?? column)).join(',');
  const body = rows.map((row) =>
    columns
      .map((column) => escapeCell(row[column.key ?? column]))
      .join(',')
  );
  return [header, ...body].join('\r\n');
}

/** Minimal RFC 4180 parser: handles quotes, escaped quotes and CRLF. */
export function parseCSV(text) {
  const input = String(text ?? '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char === '\r') {
      // handled by the following \n
    } else {
      cell += char;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((entry) => entry.some((value) => value !== ''));
}

/** Header row -> array of objects. Unknown columns are ignored. */
export function csvToObjects(text) {
  const [header, ...rows] = parseCSV(text);
  if (!header) return [];
  return rows.map((row) => {
    const record = {};
    header.forEach((key, index) => {
      record[String(key).trim()] = row[index] ?? '';
    });
    return record;
  });
}
