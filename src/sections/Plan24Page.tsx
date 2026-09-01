// 引导24时 —— 活成你想要的模样
// 每个时间段三行：原本生活真实写照 / 2.0 重新规划时间 / 3.0 升级生活
import VoiceField from '@/components/VoiceField';
import { loadPlan, savePlan, usePersistentState } from '@/lib/store';
import { TIME_SLOTS } from '@/types/diary';

interface Props {
  date: string;
}

const ROWS = [
  { key: 'current' as const, label: '原本生活', hint: '真实写照 · 生活现状', color: 'bg-stone-500' },
  { key: 'replan' as const, label: '2.0 重排', hint: '重点清晰，去除馀食赘行', color: 'bg-amber-700' },
  { key: 'upgrade' as const, label: '3.0 升级', hint: '以更高层面之心为心', color: 'bg-red-800' },
];

export default function Plan24Page({ date }: Props) {
  const [plan, update] = usePersistentState(
    () => loadPlan(date),
    (p) => savePlan(p),
    [date]
  );

  return (
    <div className="space-y-3 pb-6">
      <div className="rounded-xl border border-red-900/20 bg-[#fdfaf3] p-3 text-center shadow-sm">
        <h2 className="text-base font-bold tracking-widest text-red-900">
          引导24时 —— 活成你想要的模样
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          对照志向目标，重新安排每天的时间：先如实记录现状，再重新规划，最后升级为君子生活
        </p>
      </div>

      {TIME_SLOTS.map((slot) => (
        <div
          key={slot.id}
          className="overflow-hidden rounded-xl border border-stone-200 bg-[#fdfaf3] shadow-sm"
        >
          <div className="border-b border-stone-200 bg-stone-100/80 px-3 py-1.5 text-sm font-bold tracking-wider text-stone-700">
            {slot.label}
          </div>
          <div className="divide-y divide-stone-100">
            {ROWS.map((row) => (
              <div key={row.key} className="flex gap-2 px-3 py-2">
                <div className="w-16 shrink-0 pt-1">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-bold text-white ${row.color}`}
                  >
                    {row.label}
                  </span>
                  <div className="mt-1 text-[10px] leading-tight text-stone-400">{row.hint}</div>
                </div>
                <div className="flex-1">
                  <VoiceField
                    compact
                    rows={1}
                    value={plan.slots[slot.id]?.[row.key] ?? ''}
                    onChange={(v) =>
                      update((p) => ({
                        ...p,
                        slots: {
                          ...p.slots,
                          [slot.id]: { ...p.slots[slot.id], [row.key]: v },
                        },
                      }))
                    }
                    placeholder={
                      row.key === 'current'
                        ? '这个时段我通常在……'
                        : row.key === 'replan'
                          ? '重新规划：这个时段用来……'
                          : '升级：与志向相应的安排……'
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
