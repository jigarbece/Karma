import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { csvCell, toCsv } from '../lib/adminApi';

const calls: Array<Record<string, unknown>> = [];
const USER = {
  id: '11111111-1111-4111-8111-111111111111', email: 'friend@example.com', name: 'Meera Patel', language: 'gu', onboarded: true,
  created_at: '2026-10-01T10:00:00Z', last_sign_in_at: '2026-10-26T10:00:00Z', blocked: false, admin: false, days_analysed: 4,
  analysed_7d: 3, last_analysed_at: '2026-10-26T10:00:00Z', punya_acts: 7, paap_acts: 2, board_hidden: false, on_board: true,
};
const today = new Date().toISOString().slice(0, 10);

vi.mock('../lib/supabase', () => {
  const invoke = vi.fn(async (_name: string, { body }: { body: Record<string, unknown> }) => {
    calls.push(body);
    switch (body.action) {
      case 'list': return { data: { users: [USER, { ...USER, id: '22222222-2222-4222-8222-222222222222', email: 'old@example.com', name: 'Old Timer', last_sign_in_at: null, days_analysed: 0, blocked: true }] }, error: null };
      case 'detail': return { data: { user: USER, groups: [{ date: today, type: 'punya', category: 'seva', mode: 'done', points: 40, count: 2 }, { date: today, type: 'paap', category: 'krodh', mode: 'thought', points: 5, count: 1 }] }, error: null };
      case 'entries': return { data: { entries: [{ id: 'e1', date: today, created_at: today, language: 'en', message: 'I helped a neighbour today', acts: [{ id: 'a1', type: 'punya', mode: 'done', category: 'seva', points: 21, principle: 'paropakara', summary: 'Helped a neighbour', reason: 'Quiet help', translations: {} }] }] }, error: null };
      case 'health': return { data: { ai: true, ai_provider: 'groq', ai_model: 'm', ai_fallback: false, voice: true, message_key: false, allowed_origin: '(any)', daily_limit: 10 }, error: null };
      case 'admins': return { data: { admins: ['boss@example.com', 'helper@example.com'], me: 'boss@example.com' }, error: null };
      case 'feedback': return { data: { feedback: [{ id: 'f1', created_at: '2026-10-25T00:00:00Z', comment: 'The lie was small', user_id: USER.id, email: USER.email, act: { summary: 'Lied to boss', reason: 'r', type: 'paap', points: 16, principle: 'asatya', mode: 'done', date: '2026-10-25' } }] }, error: null };
      default: return { data: { ok: true }, error: null };
    }
  });
  const builder = (rows: unknown[]) => {
    const b: Record<string, unknown> = {};
    for (const m of ['select', 'order', 'eq', 'update', 'insert', 'upsert', 'delete']) b[m] = () => b;
    b.then = (res: (v: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(res);
    return b;
  };
  return { supabase: { functions: { invoke }, rpc: vi.fn(async () => ({ data: null, error: null })), from: vi.fn(() => builder([])) }, supabaseConfigured: true };
});

import Admin from '../pages/Admin';

// the app mounts the admin area at /admin/*; its own routes are relative to that
const open = (path: string) => render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/admin/*" element={<Admin />} /></Routes></MemoryRouter>);

describe('admin area', () => {
  beforeEach(() => { calls.length = 0; });

  it('has a sidebar with every owner tool', () => {
    open('/admin/system');
    const nav = screen.getByRole('navigation', { name: 'Admin' });
    for (const name of ['Overview', 'Users', 'Feedback', 'Announcements', 'Settings', 'Admins', 'System']) expect(within(nav).getByRole('link', { name })).toBeInTheDocument();
  });

  it('lists users, filters them and exports what is shown', async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = click;
    open('/admin/users');
    expect(await screen.findAllByTestId('admin-user')).toHaveLength(2);
    expect(screen.getAllByTestId('admin-activity')[0]).toHaveTextContent('4 days analysed');
    await user.selectOptions(screen.getByLabelText('Filter users'), 'blocked');
    expect(screen.getAllByTestId('admin-user')).toHaveLength(1);
    expect(screen.getByText(/Old Timer/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Filter users'), 'all');
    await user.type(screen.getByLabelText('Search users'), 'meera');
    expect(screen.getAllByTestId('admin-user')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));
    expect(click).toHaveBeenCalled();
  });

  it('opens a user: ghadas, categories, entries with the message and acts, and moderation', async () => {
    const user = userEvent.setup();
    open(`/admin/users/${USER.id}`);
    expect(await screen.findByRole('heading', { name: 'Meera Patel' })).toBeInTheDocument();
    expect(screen.getByText('Their ghadas')).toBeInTheDocument();
    expect(screen.getByTestId('u-modes')).toHaveTextContent('Thoughts');
    expect(await screen.findByTestId('admin-message')).toHaveTextContent('I helped a neighbour today');
    expect(screen.getByTestId('admin-act')).toHaveTextContent('Helped a neighbour');
    await user.click(screen.getByTestId('board-toggle'));
    await waitFor(() => expect(calls).toContainEqual({ action: 'board', id: USER.id, hidden: true }));
  });

  it('shows system health, admins and the feedback inbox', async () => {
    open('/admin/system');
    const rows = await screen.findAllByTestId('health-row');
    expect(rows[0]).toHaveTextContent('groq / m');
    expect(rows[3]).toHaveTextContent('Needs attention'); // message key missing
  });

  it('lists admins without a remove button for yourself', async () => {
    open('/admin/admins');
    const rows = await screen.findAllByTestId('admin-row');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).queryByRole('button')).toBeNull();
    expect(within(rows[1]).getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('shows feedback with the act it is about', async () => {
    open('/admin/feedback');
    expect(await screen.findByTestId('feedback-row')).toHaveTextContent('Lied to boss');
  });
});

describe('csv export', () => {
  it('quotes cells and neutralises spreadsheet formulas', () => {
    expect(csvCell('a "b"')).toBe('"a ""b"""');
    expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell(null)).toBe('""');
    expect(toCsv([{ a: 1, b: 'x,y' }])).toBe('"a","b"\n"1","x,y"');
    expect(toCsv([])).toBe('');
  });
});
