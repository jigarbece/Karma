import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// lazy route chunks can take a few seconds to compile on a busy machine
configure({ asyncUtilTimeout: 10_000 });

// recharts needs ResizeObserver; jsdom has none
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver ??= RO;

if (!window.matchMedia) {
  window.matchMedia = ((q: string) => ({
    matches: false, media: q, onchange: null, addListener() {}, removeListener() {},
    addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
