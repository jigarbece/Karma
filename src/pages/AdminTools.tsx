import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { adminCall } from '../lib/adminApi';
import { getPrinciple } from '../lib/dharma';
import { Spinner } from '../components/ui';

/* Owner tools: announcements, feedback inbox, settings, admins and system health. */

const Heading = ({ children, sub }: { children: string; sub?: string }) => (
  <header>
    <h1 className="text-3xl font-bold">{children}</h1>
    {sub && <p className="text-muted">{sub}</p>}
  </header>
);
const Problem = ({ text }: { text: string }) => <p role="alert" className="card text-muted">{text}</p>;

/* ------------------------------------------------------------------ Announcements */

interface Row { id: number; message: Record<string, string>; active: boolean; created_at: string }

export function Announcements() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [problem, setProblem] = useState('');
  const [text, setText] = useState({ en: '', gu: '', hi: '' });
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase!.from('announcements').select('*').order('created_at', { ascending: false });
    if (error) setProblem(/announcements/.test(error.message) ? 'Run the community SQL (20261031000000_community_and_admin.sql) in Supabase first.' : error.message);
    else setRows(data as Row[]);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);

  const publish = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.en.trim()) return setNote('Write the English message first (it is the fallback for every language).');
    const message = Object.fromEntries(Object.entries(text).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()]));
    // one message on at a time: switch the others off
    await supabase!.from('announcements').update({ active: false }).eq('active', true);
    const { error } = await supabase!.from('announcements').insert({ message, active: true });
    setNote(error ? error.message : 'Published. Users see it on Home.');
    if (!error) setText({ en: '', gu: '', hi: '' });
    await load();
  };
  const toggle = async (r: Row) => {
    if (!r.active) await supabase!.from('announcements').update({ active: false }).eq('active', true);
    await supabase!.from('announcements').update({ active: !r.active }).eq('id', r.id);
    await load();
  };
  const remove = async (r: Row) => {
    if (!window.confirm('Delete this announcement?')) return;
    await supabase!.from('announcements').delete().eq('id', r.id);
    await load();
  };

  if (problem) return <Problem text={problem} />;
  return (
    <div className="space-y-5">
      <Heading sub="A short message shown at the top of every user's Home. Only one is on at a time.">Announcements</Heading>
      <form onSubmit={publish} className="card space-y-3">
        {(['en', 'gu', 'hi'] as const).map((l) => (
          <label key={l} className="block text-sm font-semibold">
            {{ en: 'English (required)', gu: 'Gujarati (optional)', hi: 'Hindi (optional)' }[l]}
            <textarea className="field mt-1 block w-full" rows={2} maxLength={280} value={text[l]} onChange={(e) => setText({ ...text, [l]: e.target.value })} />
          </label>
        ))}
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary">Publish</button>
          {note && <span role="status" className="text-sm text-muted">{note}</span>}
        </div>
      </form>
      {!rows ? <Spinner label="Loading" /> : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="card !p-3" data-testid="announcement-row">
              <p className="[overflow-wrap:anywhere]">{r.message.en}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className={`rounded-full px-2 py-0.5 font-semibold ${r.active ? 'bg-good text-white' : 'bg-line text-muted'}`}>{r.active ? 'On' : 'Off'}</span>
                <span className="text-muted">{r.created_at.slice(0, 10)}</span>
                <button type="button" className="btn-ghost !min-h-[36px] !px-3" onClick={() => toggle(r)}>{r.active ? 'Turn off' : 'Turn on'}</button>
                <button type="button" className="btn-ghost !min-h-[36px] !px-3 text-paapred" onClick={() => remove(r)}>Delete</button>
              </div>
            </li>
          ))}
          {rows.length === 0 && <li className="text-muted">No announcements yet.</li>}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Feedback inbox */

interface Feedback {
  id: string; created_at: string; comment: string; email: string; user_id: string;
  act: { summary: string; reason: string; type: string; points: number; principle: string; mode: string; date: string } | null;
}

export function FeedbackInbox() {
  const [items, setItems] = useState<Feedback[] | null>(null);
  const [problem, setProblem] = useState('');
  useEffect(() => {
    adminCall<{ feedback: Feedback[] }>({ action: 'feedback' }).then((d) => setItems(d.feedback)).catch((e) => setProblem(`Could not load feedback: ${e.message}`));
  }, []);
  if (problem) return <Problem text={problem} />;
  return (
    <div className="space-y-4">
      <Heading sub={'Notes from "I disagree" on a score. Good ones become test cases in eval/cases.json.'}>Feedback</Heading>
      {!items ? <Spinner label="Loading" /> : (
        <ul className="space-y-3">
          {items.map((f) => {
            const p = f.act ? getPrinciple(f.act.principle) : undefined;
            return (
              <li key={f.id} className="card !p-4" data-testid="feedback-row">
                <p className="text-sm text-muted">{f.created_at.slice(0, 10)} · {f.email || f.user_id}</p>
                <p className="mt-1 font-semibold [overflow-wrap:anywhere]">“{f.comment}”</p>
                {f.act && (
                  <p className="mt-2 rounded-xl bg-sand/60 p-3 text-sm [overflow-wrap:anywhere]">
                    <span className={`font-semibold ${f.act.type === 'punya' ? 'text-good' : 'text-paapred'}`}>{f.act.type === 'punya' ? '+' : '−'}{f.act.points}</span>{' '}
                    {f.act.summary}
                    <span className="block text-muted">{f.act.reason}</span>
                    <span className="block text-xs text-muted">{f.act.mode}{p ? ` · ${p.label}` : ''} · {f.act.date}</span>
                  </p>
                )}
              </li>
            );
          })}
          {items.length === 0 && <li className="text-muted">No feedback yet.</li>}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Settings */

export function SettingsPage() {
  const [vals, setVals] = useState<{ community_goal: string; personal_goal: string } | null>(null);
  const [note, setNote] = useState('');
  useEffect(() => {
    supabase!.from('app_settings').select('key, value').then(({ data, error }) => {
      if (error) return setNote('Run the community SQL (20261031000000_community_and_admin.sql) first.');
      const m = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
      setVals({ community_goal: m.community_goal ?? '2000', personal_goal: m.personal_goal ?? '100' });
    });
  }, []);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!vals) return;
    const rows = (['community_goal', 'personal_goal'] as const).map((key) => ({ key, value: String(Math.max(1, Math.round(Number(vals[key]) || 0))) }));
    const { error } = await supabase!.from('app_settings').upsert(rows);
    setNote(error ? error.message : 'Saved. Users get the new goals on their next visit.');
  };
  if (!vals) return note ? <Problem text={note} /> : <Spinner label="Loading" />;
  return (
    <div className="space-y-4">
      <Heading sub="Goals users see on Home.">Settings</Heading>
      <form onSubmit={save} className="card max-w-md space-y-3">
        <label className="block text-sm font-semibold">Common ghada goal (punya points per week, everyone together)
          <input className="field mt-1 block w-full" inputMode="numeric" value={vals.community_goal} onChange={(e) => setVals({ ...vals, community_goal: e.target.value })} />
        </label>
        <label className="block text-sm font-semibold">Personal weekly goal (punya points)
          <input className="field mt-1 block w-full" inputMode="numeric" value={vals.personal_goal} onChange={(e) => setVals({ ...vals, personal_goal: e.target.value })} />
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary">Save</button>
          {note && <span role="status" className="text-sm text-muted">{note}</span>}
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ Admins */

export function AdminsPage() {
  const [data, setData] = useState<{ admins: string[]; me: string } | null>(null);
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const load = useCallback(() => adminCall<{ admins: string[]; me: string }>({ action: 'admins' }).then(setData).catch((e) => setNote(e.message)), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);
  const add = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await adminCall({ action: 'admin_add', email: email.trim() });
      setEmail('');
      setNote('Added. They can open /admin the next time they sign in.');
      await load();
    } catch (err) { setNote(`Could not add: ${(err as Error).message}`); }
  };
  const remove = async (a: string) => {
    if (!window.confirm(`Remove ${a} as admin?`)) return;
    try { await adminCall({ action: 'admin_remove', email: a }); await load(); } catch (err) { setNote(`Could not remove: ${(err as Error).message}`); }
  };
  if (!data) return note ? <Problem text={note} /> : <Spinner label="Loading" />;
  return (
    <div className="space-y-4">
      <Heading sub="Admins can read every user's entries and manage users. Add only people you trust.">Admins</Heading>
      <form onSubmit={add} className="card flex max-w-xl flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 basis-56 text-sm font-semibold">Email to add
          <input type="email" required className="field mt-1 block w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button type="submit" className="btn-primary">Add admin</button>
      </form>
      {note && <p role="status" className="text-sm text-muted">{note}</p>}
      <ul className="space-y-2">
        {data.admins.map((a) => (
          <li key={a} className="card flex items-center justify-between gap-3 !p-3" data-testid="admin-row">
            <span className="min-w-0 truncate">{a}{a === data.me && <span className="ml-2 rounded-full bg-gold/25 px-2 py-0.5 text-xs font-semibold text-saffron-text">You</span>}</span>
            {a !== data.me && <button type="button" className="btn-ghost !min-h-[36px] !px-3 text-paapred" onClick={() => remove(a)}>Remove</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ System health */

interface Health { ai: boolean; ai_provider: string; ai_model: string; ai_fallback: boolean; voice: boolean; message_key: boolean; allowed_origin: string; daily_limit: number }

export function SystemPage() {
  const [h, setH] = useState<Health | null>(null);
  const [problem, setProblem] = useState('');
  useEffect(() => {
    adminCall<Health>({ action: 'health' }).then(setH).catch((e) => setProblem(`Could not check: ${e.message}`));
  }, []);
  if (problem) return <Problem text={problem} />;
  if (!h) return <Spinner label="Checking" />;
  const rows: Array<[string, boolean, string]> = [
    ['AI scoring', h.ai, h.ai ? `${h.ai_provider} / ${h.ai_model}` : 'AI_API_KEY is not set: analysis will fail'],
    ['AI fallback provider', h.ai_fallback, h.ai_fallback ? 'Set: used if the main one is busy or limited' : 'Not set: on a free tier this is your safety net for busy minutes'],
    ['Voice to text (Gujarati and others)', h.voice, h.voice ? 'A Groq key is available' : 'No Groq key: Gujarati voice will not work'],
    ['Message encryption key', h.message_key, h.message_key ? 'TRANSCRIPT_KEY is set' : 'Not set: no message text is saved'],
  ];
  return (
    <div className="space-y-4">
      <Heading sub="What the server has configured. Secrets are never shown, only whether they exist.">System</Heading>
      <ul className="space-y-2">
        {rows.map(([label, ok, detail]) => (
          <li key={label} className="card flex items-start gap-3 !p-3" data-testid="health-row">
            <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${ok ? 'bg-good' : 'bg-paapred'}`} aria-hidden="true" />
            <div className="min-w-0"><p className="font-semibold">{label} <span className="font-normal text-muted">{ok ? 'OK' : 'Needs attention'}</span></p><p className="text-sm text-muted">{detail}</p></div>
          </li>
        ))}
        <li className="card !p-3 text-sm"><span className="font-semibold">Analyses per user per day:</span> {h.daily_limit > 0 ? h.daily_limit : 'unlimited'} · <span className="font-semibold">Allowed sites:</span> <span className="[overflow-wrap:anywhere]">{h.allowed_origin}</span></li>
      </ul>
    </div>
  );
}
