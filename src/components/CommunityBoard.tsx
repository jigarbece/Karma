import { Ghada } from './Ghada';
import { useI18n } from '../lib/i18n';
import { chase, type Board } from '../lib/community';

/**
 * One common punya ghada for everyone this week, and a leaderboard of punya only with half-masked names.
 * Paap, acts and net scores never appear here. The call to action asks people to beat the leader.
 */
export function CommunityBoard({ board, onCta }: { board: Board; onCta: () => void }) {
  const { t, num } = useI18n();
  const fraction = board.week_total > 0 ? Math.max(0.07, Math.min(1, board.week_total / Math.max(1, board.goal))) : 0;
  const reached = board.week_total >= board.goal;
  const c = chase(board);
  const leader = board.leaders[0];

  return (
    <section className="stage-card" aria-labelledby="community-h" data-testid="community">
      <div className="relative grid items-center gap-4 sm:grid-cols-[minmax(0,13rem)_1fr]">
        <div className="mx-auto w-full max-w-[13rem]">
          <Ghada kind="punya" fraction={fraction} centerText={`+${num(board.week_total)}`} className="w-full" label={t('community.ghada_label', { value: num(board.week_total) })} />
        </div>
        <div className="min-w-0 text-center sm:text-left">
          <h2 id="community-h" className="font-display text-3xl font-bold leading-tight">{t('community.title')}</h2>
          <p className="mt-1 text-muted">{t('community.sub', { n: num(board.participants) })}</p>
          <p className="mt-2 font-semibold text-saffron-text" data-testid="community-goal">
            {reached ? t('community.goal_done') : t('community.goal', { goal: num(board.goal), left: num(board.goal - board.week_total) })}
          </p>
        </div>
      </div>

      <div className="relative mt-5">
        <h3 className="font-display text-2xl font-bold">{t('community.board')}</h3>
        {board.leaders.length === 0 ? (
          <p className="mt-2 text-muted">{t('community.empty')}</p>
        ) : (
          <ol className="mt-2 space-y-2" data-testid="leaderboard">
            {board.leaders.map((l) => (
              <li
                key={l.rank}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-2 ${l.me ? 'border-saffron bg-gold/20' : 'border-line/70 bg-card/90'}`}
                data-testid="leader-row"
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-lg font-bold ${
                    l.rank === 1 ? 'bg-gold text-[#2A1A08]' : l.rank <= 3 ? 'bg-gold/40 text-saffron-text' : 'bg-line text-muted'
                  }`}
                  aria-label={t('community.rank', { n: num(l.rank) })}
                >
                  {num(l.rank)}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold tracking-wide">
                  {l.name}
                  {l.me && <span className="ml-2 rounded-full bg-saffron px-2 py-0.5 text-xs font-bold text-[#2A1A08]">{t('community.you')}</span>}
                </span>
                <span className="shrink-0 font-display text-2xl font-bold text-good">+{num(l.points)}</span>
              </li>
            ))}
          </ol>
        )}

        {c.state !== 'empty' && (
          <div className="mt-3 rounded-2xl bg-night p-4 text-cream" data-testid="chase">
            {c.state === 'leading' ? (
              <p className="font-semibold">{t('community.leading')}</p>
            ) : (
              <>
                <p className="font-semibold">{t('community.chase', { name: leader.name, points: num(leader.points), gap: num(c.toLead) })}</p>
                {board.next_up && board.next_up.rank > 1 && <p className="mt-1 text-sm opacity-90">{t('community.chase_next', { name: board.next_up.name, gap: num(c.toNext) })}</p>}
                {c.state === 'new' && <p className="mt-1 text-sm opacity-90">{t('community.new')}</p>}
              </>
            )}
            <button type="button" className="btn-primary mt-3 w-full sm:w-auto" onClick={onCta}>{t('community.cta')}</button>
          </div>
        )}
        {c.state === 'empty' && <button type="button" className="btn-primary mt-3 w-full sm:w-auto" onClick={onCta}>{t('community.cta')}</button>}
      </div>
    </section>
  );
}
