import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { seedDemo } from '../lib/repo';

function bootDemo(path: string) {
  localStorage.clear();
  localStorage.setItem('karma.lang', 'en');
  localStorage.setItem('karma.demo.active', '1');
  seedDemo(true);
  window.history.pushState({}, '', path);
}

describe('Karma app (demo mode)', () => {
  beforeEach(() => localStorage.clear());

  it('shows the landing page when logged out', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(await screen.findByText('See your karma. Grow every day.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try the demo' })).toBeInTheDocument();
  });

  it('keeps Home simple: greeting, tithi, two pots, net and a place to say your day', async () => {
    bootDemo('/');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: /Jai Shri Krishna/ })).toBeInTheDocument();
    expect(screen.getByTestId('tithi').textContent).toMatch(/Sud|Vad/);
    expect(screen.getByTestId('shloka')).toHaveTextContent('Bhagavad Gita');
    expect(screen.getByRole('img', { name: /Punya ghada/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Paap ghada/ })).toBeInTheDocument();
    // the pots carry points, never a percentage
    expect(screen.getByRole('img', { name: /Punya ghada/ })).toHaveTextContent(/^\+\d+$/);
    expect(screen.getByRole('img', { name: /Paap ghada/ })).toHaveTextContent(/^(−\d+|0)$/);
    expect(document.body.textContent).not.toMatch(/\d\s*%/);
    expect(screen.getByTestId('net-pill')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Tell me about your day' })).toBeInTheDocument();
    // the whole app is four destinations
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).getAllByRole('link')).toHaveLength(4);
  });

  it('scores each act with its own points, masks what was done, and reveals the principle only on request', async () => {
    bootDemo('/');
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByRole('textbox', { name: 'Tell me about your day' }), 'I donated food and I shouted at my brother');
    await user.click(screen.getByRole('button', { name: 'Analyse' }));
    // different acts, different points (+26 for annadana, -14 for anger in the mock)
    expect(await screen.findByLabelText('+26 points', {}, { timeout: 8000 })).toBeInTheDocument();
    expect(screen.getByLabelText('−14 points')).toBeInTheDocument();

    // what was done is NOT shown by default: no summary, no reason, no category, no principle
    expect(screen.queryByText('Gave in charity')).not.toBeInTheDocument();
    expect(screen.queryByText('Acted out of anger')).not.toBeInTheDocument();
    expect(screen.queryByTestId('basis')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('masked-act').length).toBeGreaterThan(1);

    // a deliberate tap on Show reveals one act and its dharma principle
    const card = screen.getByLabelText('+26 points').closest('li') as HTMLElement;
    await user.click(within(card).getByRole('button', { name: 'Show' }));
    expect(within(card).getByText('Gave in charity')).toBeInTheDocument();
    expect(within(card).getByTestId('basis')).toHaveTextContent('Annadāna');
    expect(screen.queryByText('Acted out of anger')).not.toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: 'Hide' }));
    expect(within(card).queryByText('Gave in charity')).not.toBeInTheDocument();
  });

  it('opens a popup after Analyse with Punya and reflect-upon totals, words hidden until asked, then closes', async () => {
    bootDemo('/');
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByRole('textbox', { name: 'Tell me about your day' }), 'I donated food and I shouted at my brother');
    await user.click(screen.getByRole('button', { name: 'Analyse' }));
    const dialog = await screen.findByRole('dialog', {}, { timeout: 8000 });
    expect(within(dialog).getByTestId('dlg-punya')).toHaveTextContent(/\+\d+/);
    expect(within(dialog).getByTestId('dlg-growth')).toHaveTextContent(/−\d+/);
    expect(within(dialog).queryByText('Gave in charity')).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Show details' }));
    expect(within(dialog).getByText('Gave in charity')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'See my ghadas' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the act text and its dharma principle in whichever language is selected', async () => {
    bootDemo('/history');
    const user = userEvent.setup();
    render(<App />);
    const first = (await screen.findAllByTestId('masked-act'))[0].closest('li') as HTMLElement;
    await user.click(within(first).getByRole('button', { name: 'Show' }));
    expect(within(first).getByTestId('act-text').textContent).not.toMatch(/[\u0900-\u0AFF]/); // English: no Devanagari or Gujarati

    // switch to Gujarati: the same act now reads in Gujarati, principle name and source too
    await user.click(screen.getByRole('button', { name: 'ગુજરાતી' }));
    expect(within(first).getByTestId('act-text').textContent).toMatch(/[\u0A80-\u0AFF]/);
    expect(within(first).getByTestId('basis').textContent).toMatch(/[\u0A80-\u0AFF]/);

    // and Hindi
    await user.click(screen.getByRole('button', { name: 'हिंदी' }));
    expect(within(first).getByTestId('act-text').textContent).toMatch(/[\u0900-\u097F]/);
    expect(within(first).getByTestId('basis').textContent).toMatch(/[\u0900-\u097F]/);
  });

  it('switches the whole page language, including the brand and the document title', async () => {
    bootDemo('/');
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'ગુજરાતી' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'આજે તમે શું કર્યું?' })).toBeInTheDocument();
    expect(document.title).toBe('કર્મ');
    expect(document.documentElement.lang).toBe('gu');
    expect(screen.queryByText('Tell me about your day')).not.toBeInTheDocument();
  });

  it("shows the shloka in the reader's script with a labelled meaning, and Roman text only in English", async () => {
    bootDemo('/');
    const user = userEvent.setup();
    render(<App />);
    const card = await screen.findByTestId('shloka');
    // English: Devanagari verse + labelled pronunciation + labelled meaning
    expect(card.textContent).toMatch(/[\u0900-\u097F]/);
    expect(within(card).getByText('Pronunciation')).toBeInTheDocument();
    expect(within(card).getByText('Meaning')).toBeInTheDocument();

    // Gujarati: Gujarati-script verse, no Roman pronunciation, meaning label and reference in Gujarati
    await user.click(screen.getByRole('button', { name: 'ગુજરાતી' }));
    const gu = await screen.findByTestId('shloka');
    expect(within(gu).queryByText('Pronunciation')).not.toBeInTheDocument();
    expect(within(gu).queryByText('ઉચ્ચારણ')).not.toBeInTheDocument();
    expect(within(gu).getByText('અર્થ')).toBeInTheDocument();
    expect(gu.textContent).toMatch(/[\u0A80-\u0AFF]/);
    expect((gu.textContent ?? '').replace('\u0950', '')).not.toMatch(/[\u0900-\u0963\u0966-\u097F]/); // no Devanagari letters left in Gujarati mode (the Om symbol and the shared danda marks are fine)
    expect(gu.textContent).toContain('ભગવદ્ ગીતા');

    // Hindi: Devanagari verse and meaning
    await user.click(screen.getByRole('button', { name: 'हिंदी' }));
    const hi = await screen.findByTestId('shloka');
    expect(within(hi).getByText('अर्थ')).toBeInTheDocument();
    expect(hi.textContent).toContain('भगवद्गीता');
  });

  it("keeps Today's acts compact: a scrolling list, eye-only controls and no repeated privacy hint", async () => {
    bootDemo('/');
    render(<App />);
    const list = await screen.findByRole('list', { name: "Today's acts" });
    expect(list.className).toContain('scroll-y');
    expect(within(list).getAllByRole('button', { name: 'Show' }).length).toBeGreaterThan(1);
    expect(screen.queryByText(/Hidden for your privacy/)).not.toBeInTheDocument();
  });

  it('shows graphical insights by category: strengths, growth areas, radar, bars and trend', async () => {
    bootDemo('/insights');
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Insights' })).toBeInTheDocument();
    expect(await screen.findByTestId('tile-strong')).toHaveTextContent('Strongest area');
    expect(screen.getByTestId('tile-care')).toHaveTextContent('Needs care');
    // three graphics, all labelled for screen readers
    expect(screen.getByRole('img', { name: /Virtues by category/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Net karma trend/ })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /\+\d+ \/ −\d+/ }).length).toBeGreaterThan(3); // one bar row per active category
    // the range toggle redraws the charts
    await user.click(screen.getByRole('button', { name: 'Lifetime' }));
    expect(screen.getByRole('img', { name: /Net karma trend/ })).toBeInTheDocument();
  });

  it('invites a first entry when there is nothing to chart yet', async () => {
    localStorage.clear();
    localStorage.setItem('karma.lang', 'en');
    localStorage.setItem('karma.demo.active', '1');
    seedDemo(false); // demo profile without sample history
    const raw = JSON.parse(localStorage.getItem('karma.demo.v1') as string);
    raw.profile.onboarding_done = true;
    localStorage.setItem('karma.demo.v1', JSON.stringify(raw));
    window.history.pushState({}, '', '/insights');
    render(<App />);
    expect(await screen.findByText('Insights appear after your first entries.')).toBeInTheDocument();
  });

  it('masks seeded acts on History too', async () => {
    bootDemo('/history');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'History' })).toBeInTheDocument();
    expect((await screen.findAllByTestId('masked-act')).length).toBeGreaterThan(3);
    expect(screen.queryByText('Snapped at a family member')).not.toBeInTheDocument();
    expect(screen.queryByText('Helped a neighbour carry groceries')).not.toBeInTheDocument();
  });

  it('encrypts the saved message and never shows it again, only a masked notice', async () => {
    bootDemo('/');
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByTestId('privacy-note')).toHaveTextContent('encrypted');
    await user.type(await screen.findByRole('textbox', { name: 'Tell me about your day' }), 'UNIQUE-PRIVATE-PHRASE I donated food');
    await user.click(screen.getByRole('button', { name: 'Analyse' }));
    await screen.findByLabelText('+26 points', {}, { timeout: 8000 });

    // nothing the user wrote is shown back, and it is not stored in the clear
    expect(screen.queryByText(/UNIQUE-PRIVATE-PHRASE/)).not.toBeInTheDocument();
    const stored = localStorage.getItem('karma.demo.v1') ?? '';
    expect(stored).not.toContain('UNIQUE-PRIVATE-PHRASE');
    expect(stored).toContain('enc:v1:');

    await user.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: 'History' }));
    expect((await screen.findAllByTestId('masked-message')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/encrypted and kept private/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/UNIQUE-PRIVATE-PHRASE/)).not.toBeInTheDocument();
  });

  it('shows the safety message and Tele-MANAS number, scoring nothing', async () => {
    bootDemo('/');
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByRole('textbox', { name: 'Tell me about your day' }), 'I want to die');
    await user.click(screen.getByRole('button', { name: 'Analyse' }));
    expect(await screen.findByText('We are here for you', {}, { timeout: 8000 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /14416/ })).toHaveAttribute('href', 'tel:14416');
  });

  it('has a visible sign-out and a history page of past entries', async () => {
    bootDemo('/history');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'History' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('requires typing DELETE before deleting everything', async () => {
    bootDemo('/profile');
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /Delete my account and all data/ }));
    const confirm = screen.getByRole('button', { name: 'Delete everything' });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText('Type DELETE to confirm'), 'DELETE');
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    await waitFor(() => expect(localStorage.getItem('karma.demo.v1')).toBeNull());
  });
});
