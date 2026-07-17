/**
 * Hardened CSV export helpers, shared by every admin export (assessment list,
 * questions, submissions).
 *
 * Two guarantees the ad-hoc per-file versions were missing:
 *  1. CSV formula-injection is neutralized — a cell beginning with = + - @ (or a
 *     tab/CR that some spreadsheets treat as a formula lead) is prefixed with a
 *     single quote so Excel/Sheets never evaluates learner-controlled content
 *     (e.g. a name like `=HYPERLINK(...)`).
 *  2. A UTF-8 BOM is prepended on download so non-ASCII names and the ₹ symbol
 *     render correctly in Excel.
 */

const FORMULA_LEAD = /^[=+\-@\t\r]/;

/** Escape one cell: neutralize formula injection, then quote if needed. */
export function escapeCsvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  // Neutralize a formula lead at index 0 OR after leading whitespace (some spreadsheets trim the
  // cell before evaluating, so " =1+1" can still execute).
  if (FORMULA_LEAD.test(s) || /^\s+[=+\-@]/.test(s)) {
    s = `'${s}`;
  }
  if (/[",\n\r]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export interface CsvColumn<T> {
  key: keyof T | string;
  header: string;
}

/** Build a CSV string (header + rows) with every cell hardened. */
export function rowsToCsv<T extends Record<string, unknown>>(
  columns: CsvColumn<T>[],
  rows: T[],
): string {
  const head = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCsvCell(row[c.key as string])).join(","))
    .join("\n");
  return body ? `${head}\n${body}` : head;
}

/** Trigger a browser download of a CSV string, with a UTF-8 BOM. */
export function downloadCsv(csv: string, filename: string): void {
  const BOM = "﻿";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
