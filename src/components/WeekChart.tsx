import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/** Lazy-loaded so the Recharts bundle does not block the first paint of Home. */
export default function WeekChart({ data }: { data: Array<{ label: string; net: number }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey="net" stroke="rgb(var(--saffron))" strokeWidth={3} dot={{ r: 4, fill: 'rgb(var(--gold))', strokeWidth: 0 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
