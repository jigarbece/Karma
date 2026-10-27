import { render, screen, waitFor } from '@testing-library/react';
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

  it('renders Home with greeting, tithi line, two ghadas and the mic', async () => {
    bootDemo('/');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: /Jai Shri Krishna/ })).toBeInTheDocument();
    expect(screen.getByTestId('tithi').textContent).toMatch(/Sud|Vad/);
    expect(screen.getByRole('img', { name: /Punya ghada/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Paap ghada/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tell me about your day' })).toBeInTheDocument();
    expect(screen.getByTestId('net-pill')).toBeInTheDocument();
  });

  it('analyses a day on Talk and shows scored action cards', async () => {
    bootDemo('/talk');
    const user = userEvent.setup();
    render(<App />);
    const box = await screen.findByRole('textbox', { name: 'Tell me about your day' });
    await user.type(box, 'I helped my neighbour but I shouted at my brother');
    await user.click(screen.getByRole('button', { name: 'Analyse' }));
    expect((await screen.findAllByText('Helped or served someone', {}, { timeout: 4000 })).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Acted out of anger').length).toBeGreaterThan(0);
    expect(screen.getAllByText('I disagree').length).toBeGreaterThan(0);
    expect(screen.getByText("Today's totals")).toBeInTheDocument();
  });

  it('shows the safety message and Tele-MANAS number, scoring nothing', async () => {
    bootDemo('/talk');
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByRole('textbox', { name: 'Tell me about your day' }), 'I want to die');
    await user.click(screen.getByRole('button', { name: 'Analyse' }));
    expect(await screen.findByText('We are here for you', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /14416/ })).toHaveAttribute('href', 'tel:14416');
  });

  it('shows the top bar with search, bell, avatar menu and a sign-out option', async () => {
    bootDemo('/');
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Demo' }));
    expect(await screen.findByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('lists Gita teachings and filters them by search word', async () => {
    bootDemo('/wisdom/gita?q=anger');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Gita Wisdom' })).toBeInTheDocument();
    expect(await screen.findAllByText(/Bhagavad Gita/)).not.toHaveLength(0);
    expect(screen.queryByText(/Tattvartha/)).not.toBeInTheDocument();
  });

  it('unlocks badges from the sample history on Awards', async () => {
    bootDemo('/awards');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Awards' })).toBeInTheDocument();
    expect((await screen.findAllByText('Unlocked')).length).toBeGreaterThan(2);
  });

  it('prefills a starter sentence from a Home quick action', async () => {
    bootDemo('/talk?topic=gratitude');
    render(<App />);
    const box = await screen.findByRole('textbox', { name: 'Tell me about your day' });
    expect(box).toHaveValue('Today I am grateful for: ');
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
