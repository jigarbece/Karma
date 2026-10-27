import { useId } from 'react';
import { CATEGORY_ICON, Icon } from './Icon';
import type { CategoryRow, TrendPoint } from '../lib/insights';
import type { Category } from '../lib/types';

/* Graphics only: no chart library. Green = where you did well, deep red = where to grow (always with an icon or a sign). */

const GOOD = 'rgb(var(--good))';
const CARE = 'rgb(var(--paapred))';

const trunc = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/* ----------------------------------------------------------------------------------------------- *
 * Radar: each spoke is a category. The green shape is Punya, the red dashed shape is growth areas.
 * ----------------------------------------------------------------------------------------------- */
export function CategoryRadar({ rows, name, label }: { rows: CategoryRow[]; name: (c: Category) => string; label: string }) {
  const id = useId().replace(/:/g, '');
  const W = 500;
  const H = 420;
  const cx = W / 2;
  const cy = H / 2 + 4;
  const R = 132;
  const n = rows.length;
  const max = Math.max(10, ...rows.flatMap((r) => [r.punya, r.paap]));
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  // square-root scale keeps small values visible
  const pt = (i: number, v: number, extra = 0): [number, number] => {
    const r = R * Math.sqrt(Math.max(0, v) / max) + extra;
    return [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
  };
  const poly = (key: 'punya' | 'paap') => rows.map((r, i) => pt(i, r[key]).map((v) => v.toFixed(1)).join(',')).join(' ');
  const ring = (f: number) => rows.map((_, i) => [cx + Math.cos(angle(i)) * R * f, cy + Math.sin(angle(i)) * R * f].map((v) => v.toFixed(1)).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="mx-auto block w-full max-w-[520px]">
      <defs>
        <radialGradient id={`rg${id}`} cx="50%" cy="50%" r="60%">
          <stop offset="0" stopColor="rgb(var(--gold) / 0.18)" />
          <stop offset="1" stopColor="rgb(var(--gold) / 0)" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={R + 24} fill={`url(#rg${id})`} />
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke="rgb(var(--line))" strokeWidth={f === 1 ? 1.5 : 1} />
      ))}
      {rows.map((_, i) => {
        const [x, y] = pt(i, max);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgb(var(--line))" strokeWidth="1" />;
      })}

      <polygon points={poly('paap')} fill={CARE} fillOpacity="0.2" stroke={CARE} strokeWidth="2.5" strokeDasharray="6 4" strokeLinejoin="round" />
      <polygon points={poly('punya')} fill={GOOD} fillOpacity="0.28" stroke={GOOD} strokeWidth="3" strokeLinejoin="round" />
      {rows.map((r, i) => {
        const [x, y] = pt(i, r.punya);
        const [x2, y2] = pt(i, r.paap);
        return (
          <g key={r.category}>
            {r.paap > 0 && <circle cx={x2} cy={y2} r="4" fill={CARE} />}
            {r.punya > 0 && <circle cx={x} cy={y} r="4.5" fill={GOOD} stroke="#fff" strokeWidth="1.5" />}
          </g>
        );
      })}

      {rows.map((r, i) => {
        const [x, y] = pt(i, max, 16);
        const c = Math.cos(angle(i));
        const anchor = c > 0.25 ? 'start' : c < -0.25 ? 'end' : 'middle';
        return (
          <text key={r.category} x={x} y={y + 4} textAnchor={anchor} fontSize="15" fontWeight="600" fill="rgb(var(--ink))">
            {trunc(name(r.category), 14)}
          </text>
        );
      })}
    </svg>
  );
}

/* ----------------------------------------------------------------------------------------------- *
 * Diverging bars: growth areas pull left (red), Punya pushes right (green), from one centre line.
 * ----------------------------------------------------------------------------------------------- */
export function CategoryBars({ rows, name, num }: { rows: CategoryRow[]; name: (c: Category) => string; num: (n: number) => string }) {
  const active = rows.filter((r) => r.punya > 0 || r.paap > 0).sort((a, b) => b.punya + b.paap - (a.punya + a.paap));
  const max = Math.max(1, ...active.flatMap((r) => [r.punya, r.paap]));
  const pct = (v: number) => (v / max) * 80; // leave room for the number beside the bar
  return (
    <ul className="space-y-2.5">
      {active.map((r) => (
        <li key={r.category} className="grid grid-cols-[8.25rem_1fr] items-center gap-2 sm:grid-cols-[10rem_1fr] sm:gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sand/70 text-saffron-text"><Icon name={CATEGORY_ICON[r.category]} size={18} /></span>
            <span className="min-w-0 text-[13px] font-semibold leading-tight [overflow-wrap:break-word] sm:text-sm">{name(r.category)}</span>
          </span>
          <span className="relative block h-8" aria-label={`${name(r.category)}: +${r.punya} / −${r.paap}`} role="img">
            <span className="absolute inset-y-0 left-1/2 w-px bg-line" aria-hidden="true" />
            {r.paap > 0 && (
              <>
                <span className="absolute right-1/2 top-1.5 h-5 rounded-l-full" style={{ width: `${pct(r.paap) / 2}%`, background: `linear-gradient(270deg, ${CARE}, rgb(var(--paapred) / 0.55))` }} />
                <span className="absolute top-1 text-xs font-bold text-paapred" style={{ right: `calc(50% + ${pct(r.paap) / 2}% + 6px)` }}>−{num(r.paap)}</span>
              </>
            )}
            {r.punya > 0 && (
              <>
                <span className="absolute left-1/2 top-1.5 h-5 rounded-r-full" style={{ width: `${pct(r.punya) / 2}%`, background: `linear-gradient(90deg, ${GOOD}, rgb(var(--good) / 0.55))` }} />
                <span className="absolute top-1 text-xs font-bold text-good" style={{ left: `calc(50% + ${pct(r.punya) / 2}% + 6px)` }}>+{num(r.punya)}</span>
              </>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ----------------------------------------------------------------------------------------------- *
 * Trend: net karma over time, green above the zero line and red below it.
 * ----------------------------------------------------------------------------------------------- */
export function TrendChart({ points, labelAt, label }: { points: TrendPoint[]; labelAt: (p: TrendPoint) => string; label: string }) {
  const id = useId().replace(/:/g, '');
  const W = 640;
  const H = 240;
  const L = 38;
  const Rt = 14;
  const T = 18;
  const B = 30;
  const mid = T + (H - T - B) / 2;
  const half = (H - T - B) / 2;
  const maxAbs = Math.max(10, ...points.map((p) => Math.abs(p.net)));
  const x = (i: number) => L + (points.length === 1 ? (W - L - Rt) / 2 : (i * (W - L - Rt)) / (points.length - 1));
  const y = (v: number) => mid - (v / maxAbs) * half;
  const pts = points.map((p, i) => [x(i), y(p.net)] as const);

  // smooth curve through the points (Catmull-Rom converted to cubic Beziers)
  let d = '';
  pts.forEach((p, i) => {
    if (i === 0) {
      d = `M${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
      return;
    }
    const p0 = pts[i - 2] ?? pts[i - 1];
    const p1 = pts[i - 1];
    const p3 = pts[i + 1] ?? p;
    const c1 = [p1[0] + (p[0] - p0[0]) / 6, p1[1] + (p[1] - p0[1]) / 6];
    const c2 = [p[0] - (p3[0] - p1[0]) / 6, p[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  });
  const area = `${d} L${pts[pts.length - 1][0].toFixed(1)} ${mid} L${pts[0][0].toFixed(1)} ${mid} Z`;
  const last = points[points.length - 1];
  const tick = [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block w-full">
      <defs>
        <clipPath id={`up${id}`}><rect x="0" y="0" width={W} height={mid} /></clipPath>
        <clipPath id={`dn${id}`}><rect x="0" y={mid} width={W} height={H - mid} /></clipPath>
        <linearGradient id={`gu${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GOOD} stopOpacity="0.5" />
          <stop offset="1" stopColor={GOOD} stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id={`gd${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={CARE} stopOpacity="0.5" />
          <stop offset="1" stopColor={CARE} stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {[1, 0.5, 0, -0.5, -1].map((f) => (
        <line key={f} x1={L} x2={W - Rt} y1={mid - f * half} y2={mid - f * half} stroke="rgb(var(--line))" strokeWidth={f === 0 ? 1.5 : 1} strokeDasharray={f === 0 ? undefined : '3 4'} />
      ))}
      <text x={L - 6} y={T + 4} textAnchor="end" fontSize="11" fill="rgb(var(--muted))">+{maxAbs}</text>
      <text x={L - 6} y={mid + 4} textAnchor="end" fontSize="11" fill="rgb(var(--muted))">0</text>
      <text x={L - 6} y={H - B + 4} textAnchor="end" fontSize="11" fill="rgb(var(--muted))">−{maxAbs}</text>

      <path d={area} fill={`url(#gu${id})`} clipPath={`url(#up${id})`} />
      <path d={area} fill={`url(#gd${id})`} clipPath={`url(#dn${id})`} />
      <path d={d} fill="none" stroke="rgb(var(--ink))" strokeOpacity="0.85" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.length <= 31 && pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={points[i].net === 0 ? 2 : 3.2} fill={points[i].net >= 0 ? GOOD : CARE} />
      ))}
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="7" fill={last.net >= 0 ? GOOD : CARE} stroke="#fff" strokeWidth="2.5" />

      {tick.map((i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'} fontSize="12" fill="rgb(var(--muted))">
          {labelAt(points[i])}
        </text>
      ))}
    </svg>
  );
}

/* ----------------------------------------------------------------------------------------------- *
 * A glowing badge for the strongest area or the area that needs care.
 * ----------------------------------------------------------------------------------------------- */
export function HighlightTile({ tone, title, category, value, name }: { tone: 'good' | 'care'; title: string; category?: Category; value: string; name: string }) {
  const good = tone === 'good';
  return (
    <div className="card relative overflow-hidden !p-4" data-testid={good ? 'tile-strong' : 'tile-care'}>
      <span
        aria-hidden="true"
        className="absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl"
        style={{ background: good ? 'rgb(var(--gold) / 0.45)' : 'rgb(var(--paapred) / 0.28)' }}
      />
      <div className="relative flex items-center gap-3">
        <span
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-soft"
          style={{ background: good ? 'linear-gradient(160deg, #2da66a, rgb(var(--good)))' : 'linear-gradient(160deg, #c75463, rgb(var(--paapred)))' }}
        >
          <Icon name={category ? CATEGORY_ICON[category] : good ? 'sparkle' : 'lotus'} size={28} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted">{title}</p>
          <p className="truncate font-display text-xl font-bold leading-tight">{name}</p>
          <p className={`text-2xl font-black leading-none ${good ? 'text-good' : 'text-paapred'}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
