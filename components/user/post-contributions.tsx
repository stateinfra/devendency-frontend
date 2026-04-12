/**
 * Blog post contribution graph — GitHub-grass style.
 * Renders a 53-week × 7-day heatmap of days the user published posts.
 */
type Props = {
  /** Map of YYYY-MM-DD → post count. Missing dates = 0. */
  counts: Record<string, number>;
};

function fmt(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function level(n: number): 0 | 1 | 2 | 3 | 4 {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  if (n <= 2) return 2;
  if (n <= 4) return 3;
  return 4;
}

const CELL_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-black/[0.06] dark:bg-white/[0.05]",
  1: "bg-primary/25",
  2: "bg-primary/50",
  3: "bg-primary/75",
  4: "bg-primary",
};

export function PostContributions({ counts }: Props) {
  // Build 53-week grid ending today, aligned to week (Sun=0)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  // Advance end to Saturday so all weeks are complete on right
  end.setDate(end.getDate() + (6 - end.getDay()));
  const weeks: Date[][] = [];
  for (let w = 52; w >= 0; w--) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(end);
      date.setDate(end.getDate() - w * 7 - (6 - d));
      week.push(date);
    }
    weeks.push(week);
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const monthLabels: { index: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((w, i) => {
    const first = w[0];
    if (first.getMonth() !== lastMonth && first.getDate() <= 7) {
      monthLabels.push({ index: i, label: `${first.getMonth() + 1}월` });
      lastMonth = first.getMonth();
    }
  });

  return (
    <section className="p-4 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          지난 1년간 작성한 글
        </h3>
        <span className="text-[11px] text-slate-500">총 {total}개</span>
      </div>

      <div className="w-full">
        {/* Month row — grid aligned with week columns */}
        <div
          className="grid gap-[2px] h-3 pl-6 text-[10px] text-slate-500"
          style={{ gridTemplateColumns: `repeat(53, minmax(0, 1fr))` }}
        >
          {weeks.map((_, i) => {
            const m = monthLabels.find((x) => x.index === i);
            return (
              <div key={i} className="relative">
                {m && <span className="absolute left-0 top-0 whitespace-nowrap">{m.label}</span>}
              </div>
            );
          })}
        </div>

        <div className="flex gap-1 mt-1">
          {/* Weekday labels */}
          <div className="flex flex-col justify-between text-[10px] text-slate-500 w-5 shrink-0 py-[2px]">
            <span>월</span>
            <span>수</span>
            <span>금</span>
          </div>

          {/* Heatmap — weeks as columns, days as rows (grid for responsive) */}
          <div
            className="grid gap-[2px] flex-1"
            style={{ gridTemplateColumns: `repeat(53, minmax(0, 1fr))` }}
          >
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-rows-7 gap-[2px]">
                {week.map((date, di) => {
                  const key = fmt(date);
                  const n = counts[key] || 0;
                  const inFuture = date > today;
                  return (
                    <div
                      key={di}
                      title={inFuture ? "" : `${key} · ${n}개`}
                      className={`aspect-square rounded-[2px] ${
                        inFuture ? "bg-transparent" : CELL_COLORS[level(n)]
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 justify-end text-[10px] text-slate-500 mt-2">
          <span>적음</span>
          {[0, 1, 2, 3, 4].map((lv) => (
            <span
              key={lv}
              className={`size-[10px] rounded-[2px] ${CELL_COLORS[lv as 0]}`}
            />
          ))}
          <span>많음</span>
        </div>
      </div>
    </section>
  );
}
