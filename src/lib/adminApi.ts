import { supabase } from './supabase';

/** Calls the admin-only Edge Function (it checks the caller's email against the admins table on the server). */
export async function adminCall<T = unknown>(body: object): Promise<T> {
  const { data, error } = await supabase!.functions.invoke('admin-users', { body });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const b = ctx && typeof ctx.json === 'function' ? await ctx.json().catch(() => ({})) : {};
    throw new Error(b.error ?? error.message);
  }
  return data as T;
}

/** A value safe to put in a CSV cell (quotes doubled; formulas neutralised so a spreadsheet will not run them). */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replaceAll('"', '""')}"`;
}

export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  return [cols.map(csvCell).join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n');
}

export function downloadText(filename: string, text: string, type = 'text/csv') {
  const href = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 4000);
}
