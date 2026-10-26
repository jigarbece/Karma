import type { KarmaAction } from './types';

export function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const esc = (v: unknown) => {
  let s = String(v ?? '');
  // neutralise spreadsheet formula injection
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replaceAll('"', '""')}"`;
};

export function actionsToCsv(actions: KarmaAction[]): string {
  const head = ['date', 'type', 'category', 'weight', 'summary', 'reason', 'intention_note'];
  const rows = actions.map((a) =>
    [a.date, a.type, a.category, a.type === 'paap' ? -a.weight : a.type === 'punya' ? a.weight : 0, a.summary, a.reason, a.intention_note].map(esc).join(','),
  );
  const BOM = String.fromCharCode(0xfeff); // lets Excel read Gujarati/Hindi as UTF-8
  return BOM + [head.join(','), ...rows].join('\r\n');
}

/** Milliseconds until the next HH:MM local time. */
export function msUntil(hhmm: string, now = new Date()): number {
  const [h, m] = hhmm.split(':').map(Number);
  const next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

/**
 * Browser-only reminder: fires while the app (or its installed PWA) is open or running.
 * It is not a server push, so it cannot wake a closed app.
 */
export function scheduleReminder(hhmm: string | null, title: string, body: string): () => void {
  if (!hhmm || typeof Notification === 'undefined' || Notification.permission !== 'granted') return () => undefined;
  let timer: ReturnType<typeof setTimeout>;
  const arm = () => {
    timer = setTimeout(async () => {
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        if (reg) await reg.showNotification(title, { body, icon: '/favicon.svg' });
        else new Notification(title, { body, icon: '/favicon.svg' });
      } catch {
        /* ignore */
      }
      arm();
    }, msUntil(hhmm));
  };
  arm();
  return () => clearTimeout(timer);
}
