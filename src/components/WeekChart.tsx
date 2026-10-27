import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface JourneyPoint {
  label: string;
  net: number;
  punya: number;
  /** negative magnitude so it plots below zero */
  paap: number;
}

/** Lazy-loaded so the Recharts bundle does not block the first paint of Home. */
export default function WeekChart({ data, names }: { data: JourneyPoint[]; names: { net: string; punya: string; paap: string } }) {
  const tick = { fill: 'rgb(var(--muted))', fontSize: 12 };
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="jn-net" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(var(--good))" stopOpacity="0.28" />
            <stop offset="1" stopColor="rgb(var(--good))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} />
        <YAxis tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="net" name={names.net} stroke="rgb(var(--good))" strokeWidth={3} fill="url(#jn-net)" dot={{ r: 3.5, fill: 'rgb(var(--good))', strokeWidth: 0 }} isAnimationActive={false} />
        <Line type="monotone" dataKey="punya" name={names.punya} stroke="rgb(var(--gold))" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="paap" name={names.paap} stroke="rgb(var(--indigo))" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
