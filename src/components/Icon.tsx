import type { SVGProps } from 'react';
import type { Category } from '../lib/types';

const P: Record<string, string> = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7',
  chart: 'M4 20V10M10 20V4M16 20v-8M22 20H2',
  lotus: 'M12 5c2.5 2.6 2.5 6.4 0 9-2.5-2.6-2.5-6.4 0-9zM3 10c3.4.2 6 2.6 7 6-3.4-.2-6-2.6-7-6zM21 10c-3.4.2-6 2.6-7 6 3.4-.2 6-2.6 7-6zM6 19c4 1.4 8 1.4 12 0',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c.8-3.6 3.6-5.5 7.5-5.5s6.7 1.9 7.5 5.5',
  seva: 'M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10z',
  family: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 12a2.5 2.5 0 1 0 0-5M3 20c.6-3.2 3-5 6-5s5.4 1.8 6 5M17 14.5c2.2.2 3.6 1.7 4 4.5',
  jeev: 'M7 11c-1.3 0-2-1.2-2-2.5S5.8 6 7 6s2 1.2 2 2.5S8.3 11 7 11zM17 11c-1.3 0-2-1.2-2-2.5S15.8 6 17 6s2 1.2 2 2.5-.7 2.5-2 2.5zM12 20c-3 0-5-1.6-5-3.5 0-2 2.5-4.5 5-4.5s5 2.5 5 4.5c0 1.9-2 3.5-5 3.5z',
  satya: 'M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  vani: 'M4 5h16v11H9l-5 4V5z',
  krodh: 'M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .2 1.5 1 2 2 2-.5-3 0-6 1-8z',
  work: 'M4 8h16v11H4zM9 8V5.5h6V8M4 13h16',
  daan: 'M4 10h16v10H4zM2.5 7h19v3h-19zM12 7v13M12 7c-1-3-5-3.5-5-1.2C7 7.5 10 7 12 7zM12 7c1-3 5-3.5 5-1.2C17 7.5 14 7 12 7z',
  discipline: 'M3 12h2m14 0h2M5 8v8M19 8v8M8 6v12M16 6v12M8 12h8',
  bhakti: 'M12 3c1.6 2.4 3 3.6 3 6a3 3 0 0 1-6 0c0-2.4 1.4-3.6 3-6zM5 13h14l-1.5 6h-11z',
  ahimsa: 'M5 19c0-8 5-14 15-14 0 9-5 15-13 15M5 19c3-4 6-6 9-8',
  logout: 'M9 4H5v16h4M16 8l4 4-4 4M20 12H9',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeoff: 'M3 3l18 18M10.6 6.2A9.6 9.6 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.7M6.5 6.9C3.7 8.7 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2',
  trend: 'M3 17l6-6 4 4 8-9M15 6h6v6',
  trenddown: 'M3 7l6 6 4-4 8 9M15 18h6v-6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
  book: 'M4 5c3-1.5 6-1.5 8 0v14c-2-1.5-5-1.5-8 0zM20 5c-3-1.5-6-1.5-8 0v14c2-1.5 5-1.5 8 0z',
  goal: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  trophy: 'M8 4h8v6a4 4 0 0 1-8 0zM8 6H4v2a3 3 0 0 0 3 3M16 6h4v2a3 3 0 0 1-3 3M12 14v4M8 20h8',
  pen: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3',
  heart: 'M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z',
  plus: 'M12 5v14M5 12h14',
  alert: 'M12 4l9 16H3zM12 10v4M12 17v.01',
  check2: 'M5 13l4 4L19 7',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
  up: 'M5 15l7-7 7 7',
  down: 'M5 9l7 7 7-7',
  flat: 'M5 12h14',
  check: 'M5 12.5 10 17.5 19 7.5',
  play: 'M8 5v14l11-7z',
  stop: 'M7 7h10v10H7z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  download: 'M12 4v11M7 11l5 5 5-5M4 20h16',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5',
  thumb: 'M7 11v9H4v-9zM7 11l4-7c1.5 0 2.5 1 2 3l-.7 3H19a1.5 1.5 0 0 1 1.5 1.8l-1.3 6A2 2 0 0 1 17.3 20H7',
};

export const CATEGORY_ICON: Record<Category, string> = {
  seva: 'seva', family_duty: 'family', jeev_daya: 'jeev', satya: 'satya', vani: 'vani', krodh: 'krodh',
  honesty_work: 'work', daan: 'daan', discipline_health: 'discipline', gratitude_bhakti: 'bhakti', ahimsa_food: 'ahimsa',
};

export function Icon({ name, size = 24, ...rest }: { name: string; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}
    >
      <path d={P[name] ?? ''} />
    </svg>
  );
}
