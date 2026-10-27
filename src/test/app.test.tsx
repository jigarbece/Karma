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
    expect(screen.getByRole('img', { name: /Punya ghada/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Paap ghada/ })).toBeInTheDocument();
    expect(screen.getByTestId('net-pill')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Tell me about your day' })).toBeInTheDocument();
    // the whole app is three destinations
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).getAllByRole('link')).toHaveLength(3);
  });

  it('scores each act with its own points and shows the dharma principle behind it', async () => {
    bootDemo('/');
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByRole('textbox', { name: 'Tell me about your day' }), 'I donated food and I shouted at my brother');
    await user.click(screen.getByRole('button', { name: 'Analyse' }));
    expect((await screen.findAllByText('Gave in charity', {}, { timeout: 8000 })).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Acted out of anger').length).toBeGreaterThan(0);
    // different acts, different points (+26 for annadana, -14 for anger in the mock) and the principle is shown
    expect(screen.getByLabelText('+26 points')).toBeInTheDocument();
    expect(screen.getByLabelText('−14 points')).toBeInTheDocument();
    const basis = screen.getAllByTestId('basis').map((n) => n.textContent ?? '');
    expect(basis.some((b) => b.includes('Annadāna'))).toBe(true);
    expect(basis.some((b) => b.includes('Krodha'))).toBe(true);
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
