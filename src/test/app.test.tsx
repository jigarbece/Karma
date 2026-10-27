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
    expect(screen.getByTestId('net-pill')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Tell me about your day' })).toBeInTheDocument();
    // the whole app is three destinations
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).getAllByRole('link')).toHaveLength(3);
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
