/** Parse CSV rows respecting quoted fields (commas, newlines, "" inside quotes). */
export function parseCSVRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (i + 1 < len && text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (c === "\n" || c === "\r") {
      row.push(cell.trim());
      cell = "";
      if (row.some((x) => x.length > 0)) rows.push(row);
      row = [];
      if (c === "\r" && i + 1 < len && text[i + 1] === "\n") i++;
      continue;
    }
    cell += c;
  }
  row.push(cell.trim());
  if (row.some((x) => x.length > 0)) rows.push(row);
  return rows;
}
