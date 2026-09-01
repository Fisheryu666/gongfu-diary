// 功夫日记 · 每日记录页
// 结构：人生志向一段 → 十不 → 读书学习一条 → 反省改过一条 → 今日行动一条 → 当日总结
import { useMemo, type ReactNode } from 'react';
import VoiceField from '@/components/VoiceField';
import { computeStreak, loadEntry, saveEntry, usePersistentState } from '@/lib/store';
import { cnDate, cnWeekday, shiftDate, todayStr } from '@/types/diary';

interface Props {
  date: string;
  onDateChange: (d: string) => void;
}

function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-stone-200 bg-[#fdfaf3] p-4 shadow-sm">
      <div className="mb-3 flex items-baseline gap-2">
        <span className="inline-block h-4 w-1 rounded bg-red-800" />
        <h2 className="text-base font-bold tracking-wide text-stone-800">{title}</h2>
        {sub && <span className="text-xs text-stone-500">{sub}</span>}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

export default function DiaryPage({ date, onDateChange }: Props) {
  const [entry, update] = usePersistentState(
    () => loadEntry(date),
    (e) => saveEntry(e),
    [date]
  );

  const isToday = date === todayStr();
  const TOTAL = 6; // 志向 + 十不 + 学习 + 反省 + 行动 + 总结
  const filled = useMemo(() => {
    let n = 0;
    if (entry.aspiration.trim()) n++;
    if (entry.shibu.trim()) n++;
    if (entry.study.trim()) n++;
    if (entry.reflection.trim()) n++;
    if (entry.action.trim()) n++;
    if (entry.summary.trim()) n++;
    return n;
  }, [entry]);

  // 连续填写天数（entry 变化时重算，写入当天后立即 +1）
  const streak = useMemo(() => computeStreak(), [entry]);

  return (
    <div className="space-y-4 pb-6">
      {/* 日期导航 */}
      <div className="flex items-center justify-between rounded-xl bg-red-900 px-3 py-2.5 text-[#f5ecd7] shadow">
        <button
          onClick={() => onDateChange(shiftDate(date, -1))}
          className="rounded-lg px-3 py-1 text-lg hover:bg-white/10"
          aria-label="前一天"
        >
          ‹
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold tracking-widest">
            {cnDate(date)} · {cnWeekday(date)}
          </div>
          {!isToday && (
            <button
              onClick={() => onDateChange(todayStr())}
              className="mt-0.5 rounded bg-white/15 px-2 py-0.5 text-xs hover:bg-white/25"
            >
              回到今天
            </button>
          )}
        </div>
        <button
          onClick={() => onDateChange(shiftDate(date, 1))}
          disabled={isToday}
          className="rounded-lg px-3 py-1 text-lg hover:bg-white/10 disabled:opacity-30"
          aria-label="后一天"
        >
          ›
        </button>
      </div>

      <div className="flex items-center justify-center gap-3 text-xs text-stone-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-red-800/10 px-2.5 py-1 font-bold text-red-800">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M12 2c1 4-3 5-3 9a4.5 4.5 0 0 0 9 0c0-2-1-3.5-2-4.5.3 2-1 3-2 3 .5-2.5-1-5.5-2-7.5Z" />
          </svg>
          已连续填写 {streak} 天
        </span>
        <span>已完成 {filled} / {TOTAL} 项 · 自动保存在本机</span>
      </div>

      {/* 一、人生志向 */}
      <Section title="倾诉我的志向" sub="每天早上写一段人生志向">
        <VoiceField
          value={entry.aspiration}
          onChange={(v) => update((p) => ({ ...p, aspiration: v }))}
          placeholder="例：立志为君子，利益成就更多人的心灵品质……"
          rows={3}
        />
      </Section>

      {/* 二、十不 */}
      <Section title="十不" sub="写出个人的十条戒律，每日对照">
        <VoiceField
          value={entry.shibu}
          onChange={(v) => update((p) => ({ ...p, shibu: v }))}
          placeholder="例：不懈怠、不急躁、不自傲、不抱怨、不吝啬、不随大流、不说善意的谎言、不疏忽、不刷抖音、不贪面子"
          rows={4}
        />
      </Section>

      {/* 三、读书学习 */}
      <Section title="读书学习" sub="记录今天的学习内容">
        <VoiceField
          value={entry.study}
          onChange={(v) => update((p) => ({ ...p, study: v }))}
          placeholder="书目 / 课程 / 时长 / 心得……"
          rows={3}
        />
      </Section>

      {/* 四、反省改过 */}
      <Section title="反省改过" sub="写下今日与志向不相应之处">
        <VoiceField
          value={entry.reflection}
          onChange={(v) => update((p) => ({ ...p, reflection: v }))}
          placeholder="意识 / 语言 / 行为上的不足，及其反作用后果，如何改正……"
          rows={3}
        />
      </Section>

      {/* 五、今日行动 */}
      <Section title="今日行动" sub="写下一个与志向相应的行动">
        <VoiceField
          value={entry.action}
          onChange={(v) => update((p) => ({ ...p, action: v }))}
          placeholder="具体、可执行、可检验……"
          rows={3}
        />
      </Section>

      {/* 六、当日总结 */}
      <Section title="当日总结" sub="总结今天行动的完成与收获">
        <VoiceField
          value={entry.summary}
          onChange={(v) => update((p) => ({ ...p, summary: v }))}
          placeholder="今天的行动完成得如何？有什么新的领悟？明天要调整什么？"
          rows={4}
        />
      </Section>
    </div>
  );
}
