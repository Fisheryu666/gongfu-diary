// 历史查询（按日期选择）+ 数据导出/导入
import { useMemo, useRef, useState } from 'react';
import {
  downloadBackup,
  importData,
  loadEntries,
  loadEntry,
  searchEntries,
} from '@/lib/store';
import { cnDate, shiftDate, todayStr } from '@/types/diary';

interface Props {
  onOpenDate: (date: string) => void;
}

export default function SearchPage({ onOpenDate }: Props) {
  // 默认选中昨天：早上补记、晚间复盘后最常回看的就是昨天
  const [day, setDay] = useState(() => shiftDate(todayStr(), -1));
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const searching = !!day;
  const hits = useMemo(
    () => searchEntries('', { from: day || undefined, to: day || undefined }),
    [day]
  );

  const allDates = useMemo(
    () =>
      Object.keys(loadEntries())
        .filter((d) => {
          const e = loadEntry(d);
          return (
            e.aspiration.trim() ||
            e.summary.trim() ||
            e.study.trim() ||
            e.reflection.trim() ||
            e.action.trim() ||
            e.shibu.trim()
          );
        })
        .sort()
        .reverse()
        .slice(0, 6), // 快速查看只保留最近 6 天，更早的记录选日期查询
    []
  );

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = importData(String(reader.result ?? ''));
      if (result.ok) {
        setImportMsg(
          `导入成功：${result.entryCount ?? 0} 天日记、${result.planCount ?? 0} 天24时记录（同一天以较新者为准）。正在刷新…`
        );
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setImportMsg(result.message);
      }
    };
    reader.onerror = () => setImportMsg('读取文件失败，请重试');
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 选择一个日期，查看那天的记录 */}
      <div className="rounded-xl border border-stone-200 bg-[#fdfaf3] p-3 shadow-sm">
        <div className="mb-2 text-center text-xs text-stone-500">
          选择一个日期，查看那天的记录
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            aria-label="选择日期"
            className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white/90 px-3 py-2.5 text-center text-sm text-stone-700 outline-none focus:border-red-800/60"
          />
          {day && (
            <button
              onClick={() => setDay('')}
              className="shrink-0 rounded-lg bg-stone-200/80 px-2.5 py-2.5 text-xs text-stone-600 hover:bg-stone-300/80"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {searching ? (
        <>
          <div className="text-xs text-stone-500">
            {cnDate(day)} · 共 {hits.length} 条记录
          </div>
          <div className="space-y-2">
            {hits.map((h, i) => (
              <button
                key={i}
                onClick={() => onOpenDate(h.date)}
                className="block w-full rounded-xl border border-stone-200 bg-[#fdfaf3] p-3 text-left shadow-sm transition-colors hover:border-red-800/40"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-bold text-red-900">{cnDate(h.date)}</span>
                  <span className="rounded bg-stone-200/70 px-1.5 py-0.5 text-[10px] text-stone-600">
                    {h.section}
                  </span>
                </div>
                <div className="line-clamp-2 text-sm leading-relaxed text-stone-700">{h.text}</div>
              </button>
            ))}
            {hits.length === 0 && (
              <div className="py-10 text-center text-sm text-stone-400">
                这一天没有记录
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="text-xs text-stone-500">
            最近 6 天记录 · 点击查看；更早的记录请在上方选择日期
          </div>
          <div className="grid grid-cols-3 gap-2">
            {allDates.map((d) => (
              <button
                key={d}
                onClick={() => onOpenDate(d)}
                className="rounded-xl border border-stone-200 bg-[#fdfaf3] px-2 py-3 text-center shadow-sm transition-colors hover:border-red-800/40"
              >
                <div className="text-sm font-bold text-stone-800">{d.slice(5).replace('-', '/')}</div>
                <div className="text-[10px] text-stone-400">{d.slice(0, 4)}</div>
              </button>
            ))}
            {allDates.length === 0 && (
              <div className="col-span-3 py-10 text-center text-sm text-stone-400">
                还没有记录，回到「日记」页写下今天的第一篇吧
              </div>
            )}
          </div>
        </>
      )}

      {/* 数据备份 */}
      <section className="rounded-xl border border-stone-200 bg-[#fdfaf3] p-4 shadow-sm">
        <div className="mb-3 flex items-baseline gap-2">
          <span className="inline-block h-4 w-1 rounded bg-red-800" />
          <h2 className="text-base font-bold tracking-wide text-stone-800">数据备份</h2>
          <span className="text-xs text-stone-500">换手机 / 防丢失</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadBackup}
            className="flex-1 rounded-lg bg-red-800 py-2.5 text-sm font-bold text-white shadow hover:bg-red-900"
          >
            导出全部数据
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-lg border border-red-800/50 py-2.5 text-sm font-bold text-red-800 hover:bg-red-50"
          >
            导入备份文件
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = '';
            }}
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-stone-500">
          导出会下载一个 JSON 备份文件（可存到微信文件传输助手 / 网盘）；导入时同一天的数据以较新者为准，不会丢记录。
        </p>
        {importMsg && (
          <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-stone-700">
            {importMsg}
          </div>
        )}
      </section>
    </div>
  );
}
