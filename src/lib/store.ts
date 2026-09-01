// 本地存储：所有数据只保存在本机浏览器 localStorage，不上传任何服务器
import { useCallback, useEffect, useState } from 'react';
import {
  type DiaryEntry,
  type DayPlan,
  emptyEntry,
  emptyPlan,
  shiftDate,
  todayStr,
} from '@/types/diary';

const ENTRY_KEY = 'gongfu-diary:entries:v1';
const PLAN_KEY = 'gongfu-diary:plans:v1';

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- 日记 ----------
export function loadEntries(): Record<string, DiaryEntry> {
  return readJSON(ENTRY_KEY, {});
}

export function loadEntry(date: string): DiaryEntry {
  const all = loadEntries();
  const e = all[date] as (DiaryEntry & {
    studies?: string[];
    reflections?: string[];
    actions?: string[];
  }) | undefined;
  if (!e) return emptyEntry(date);
  // 兼容旧版数据：学习/反省/行动由多条合并为一条
  const joinOld = (single: unknown, arr: unknown) =>
    typeof single === 'string' && single
      ? single
      : Array.isArray(arr)
        ? arr.filter((s) => String(s ?? '').trim()).join('；')
        : String(single ?? '');
  // 十不：兼容旧的十条数组格式，合并为一个文本
  const shibu = Array.isArray(e.shibu)
    ? (e.shibu as unknown[]).filter((s) => String(s ?? '').trim()).join('；')
    : String(e.shibu ?? '');
  return {
    date,
    aspiration: e.aspiration ?? '',
    shibu,
    study: joinOld(e.study, e.studies),
    reflection: joinOld(e.reflection, e.reflections),
    action: joinOld(e.action, e.actions),
    summary: e.summary ?? '',
    updatedAt: e.updatedAt ?? Date.now(),
  };
}

export function saveEntry(entry: DiaryEntry) {
  const all = loadEntries();
  all[entry.date] = { ...entry, updatedAt: Date.now() };
  writeJSON(ENTRY_KEY, all);
}

export function deleteEntry(date: string) {
  const all = loadEntries();
  delete all[date];
  writeJSON(ENTRY_KEY, all);
}

// ---------- 引导24时 ----------
export function loadPlans(): Record<string, DayPlan> {
  return readJSON(PLAN_KEY, {});
}

export function loadPlan(date: string): DayPlan {
  const all = loadPlans();
  return all[date] ?? emptyPlan(date);
}

export function savePlan(plan: DayPlan) {
  const all = loadPlans();
  all[plan.date] = { ...plan, updatedAt: Date.now() };
  writeJSON(PLAN_KEY, all);
}

// ---------- 搜索 ----------
export interface SearchHit {
  date: string;
  section: string;
  text: string;
}

export function searchEntries(keyword: string): SearchHit[] {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return [];
  const hits: SearchHit[] = [];
  const all = loadEntries();
  const plans = loadPlans();

  const push = (date: string, section: string, text: string) => {
    if (text && text.toLowerCase().includes(kw)) hits.push({ date, section, text });
  };

  for (const raw of Object.values(all)) {
    const e = loadEntry(raw.date); // 走迁移逻辑，兼容旧数据
    push(e.date, '人生志向', e.aspiration);
    push(e.date, '十不', e.shibu);
    push(e.date, '读书学习', e.study);
    push(e.date, '反省改过', e.reflection);
    push(e.date, '今日行动', e.action);
    push(e.date, '当日总结', e.summary);
  }
  for (const p of Object.values(plans)) {
    for (const [slotId, slot] of Object.entries(p.slots)) {
      push(p.date, `24时·原本 ${slotId}`, slot.current);
      push(p.date, `24时·2.0 ${slotId}`, slot.replan);
      push(p.date, `24时·3.0 ${slotId}`, slot.upgrade);
    }
  }
  hits.sort((a, b) => (a.date < b.date ? 1 : -1));
  return hits;
}

// ---------- 连续填写天数 ----------
export function entryHasContent(e: DiaryEntry): boolean {
  return !!(
    e.aspiration.trim() ||
    e.shibu.trim() ||
    e.study.trim() ||
    e.reflection.trim() ||
    e.action.trim() ||
    e.summary.trim()
  );
}

// 从今天（或昨天，若今天还没写）往前数连续有记录的天数
export function computeStreak(): number {
  const all = loadEntries();
  const has = (date: string) => {
    const raw = all[date];
    return raw ? entryHasContent(loadEntry(date)) : false;
  };
  let cursor = todayStr();
  if (!has(cursor)) cursor = shiftDate(cursor, -1); // 今天还没写，从昨天算起
  let n = 0;
  while (has(cursor)) {
    n++;
    cursor = shiftDate(cursor, -1);
  }
  return n;
}

// ---------- 数据导出 / 导入 ----------
export interface BackupFile {
  app: 'gongfu-diary';
  version: 1;
  exportedAt: string;
  entries: Record<string, DiaryEntry>;
  plans: Record<string, DayPlan>;
}

export function exportData(): BackupFile {
  // 导出前统一走迁移，保证备份是新格式
  const entries: Record<string, DiaryEntry> = {};
  for (const date of Object.keys(loadEntries())) entries[date] = loadEntry(date);
  return {
    app: 'gongfu-diary',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
    plans: loadPlans(),
  };
}

export function downloadBackup() {
  const data = exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `功夫日记备份-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  ok: boolean;
  message: string;
  entryCount?: number;
  planCount?: number;
}

// 合并策略：同一天以 updatedAt 较新者为准，不丢数据
export function importData(json: string): ImportResult {
  let data: Partial<BackupFile>;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, message: '文件不是有效的 JSON，请选择正确的备份文件' };
  }
  if (data.app !== 'gongfu-diary' || typeof data.entries !== 'object' || !data.entries) {
    return { ok: false, message: '文件格式不正确，请选择「功夫日记」导出的备份文件' };
  }
  const entries = loadEntries();
  const plans = loadPlans();
  let ec = 0;
  let pc = 0;
  for (const [date, e] of Object.entries(data.entries)) {
    const old = entries[date] as { updatedAt?: number } | undefined;
    if (!old || (e.updatedAt ?? 0) >= (old.updatedAt ?? 0)) {
      entries[date] = e as DiaryEntry;
      ec++;
    }
  }
  if (data.plans && typeof data.plans === 'object') {
    for (const [date, p] of Object.entries(data.plans)) {
      const old = plans[date];
      if (!old || (p.updatedAt ?? 0) >= (old.updatedAt ?? 0)) {
        plans[date] = p;
        pc++;
      }
    }
  }
  writeJSON(ENTRY_KEY, entries);
  writeJSON(PLAN_KEY, plans);
  return { ok: true, message: '导入成功', entryCount: ec, planCount: pc };
}

// ---------- React Hook：自动保存 ----------
export function usePersistentState<T>(
  load: () => T,
  save: (v: T) => void,
  deps: unknown[]
): [T, (updater: (prev: T) => T) => void] {
  const [value, setValue] = useState<T>(load);

  // 切换日期等 deps 变化时重新加载
  useEffect(() => {
    setValue(load());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const update = useCallback(
    (updater: (prev: T) => T) => {
      setValue((prev) => {
        const next = updater(prev);
        save(next);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  return [value, update];
}
