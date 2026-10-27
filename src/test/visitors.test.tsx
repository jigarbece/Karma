import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../lib/i18n';

const rpc = vi.fn();
vi.mock('../lib/supabase', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) }, supabaseConfigured: true, demoAllowed: true }));

import { VisitorCount } from '../components/VisitorCount';
import { getVisitorId, loadVisitorCount, resetVisitorCache } from '../lib/visitors';

beforeEach(() => {
  rpc.mockReset();
  resetVisitorCache();
  localStorage.clear();
  Object.defineProperty(navigator, 'doNotTrack', { value: null, configurable: true });
});

describe('visitor counter', () => {
  it('keeps one random anonymous id per browser', () => {
    const a = getVisitorId();
    expect(a).toMatch(/^[0-9a-f-]{36}$/);
    expect(getVisitorId()).toBe(a);
  });

  it('registers this browser once and returns the total', async () => {
    rpc.mockResolvedValue({ data: 1234, error: null });
    expect(await loadVisitorCount()).toBe(1234);
    expect(await loadVisitorCount()).toBe(1234); // cached: one call per page load
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('register_visit', { vid: getVisitorId() });
  });

  it('only reads the total, and stores no id, when Do Not Track is on', async () => {
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true });
    rpc.mockResolvedValue({ data: 77, error: null });
    expect(await loadVisitorCount()).toBe(77);
    expect(rpc).toHaveBeenCalledWith('visitor_count');
    expect(localStorage.getItem('karma.vid')).toBeNull();
  });

  it('returns null when the function is missing or fails, so nothing is shown', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'function not found' } });
    expect(await loadVisitorCount()).toBeNull();
  });

  it('shows a small line with a grouped number in English and Gujarati digits in Gujarati', async () => {
    rpc.mockResolvedValue({ data: 1234567, error: null });
    const { unmount } = render(<I18nProvider lang="en"><VisitorCount /></I18nProvider>);
    expect(await screen.findByTestId('visitor-count')).toHaveTextContent('12,34,567 visitors');
    unmount();
    resetVisitorCache();
    render(<I18nProvider lang="gu"><VisitorCount /></I18nProvider>);
    expect(await screen.findByTestId('visitor-count')).toHaveTextContent('૧૨,૩૪,૫૬૭ મુલાકાતીઓ');
  });

  it('renders nothing while the count is unknown', () => {
    rpc.mockReturnValue(new Promise(() => undefined));
    render(<I18nProvider lang="en"><VisitorCount /></I18nProvider>);
    expect(screen.queryByTestId('visitor-count')).not.toBeInTheDocument();
  });
});
