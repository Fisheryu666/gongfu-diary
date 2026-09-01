// 功夫日记 · 数据模型

export interface DiaryEntry {
  date: string; // YYYY-MM-DD
  aspiration: string; // 人生志向（每天早上写一段）
  shibu: string; // 十不（个人戒律，写在一个框里）
  study: string; // 读书学习（一条）
  reflection: string; // 反省改过（一条）
  action: string; // 今日行动（一条）
  summary: string; // 当日行动总结
  updatedAt: number;
}

export interface PlanSlot {
  current: string; // 原本生活真实写照
  replan: string; // 2.0 重新规划时间
  upgrade: string; // 3.0 升级生活
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  slots: Record<string, PlanSlot>;
  updatedAt: number;
}

// 引导24时 · 时间段（早上 5 点到晚上 22 点）
export const TIME_SLOTS: { id: string; label: string }[] = [
  { id: 's05', label: '5:00-6:00' },
  { id: 's06', label: '6:00-7:00' },
  { id: 's07', label: '7:00-8:00' },
  { id: 's08', label: '8:00-12:00' },
  { id: 's12', label: '12:00-14:00' },
  { id: 's14', label: '14:00-17:00' },
  { id: 's17', label: '17:00-19:00' },
  { id: 's19', label: '19:00-20:00' },
  { id: 's20', label: '20:00-22:00' },
];

export function emptyEntry(date: string): DiaryEntry {
  return {
    date,
    aspiration: '',
    shibu: '',
    study: '',
    reflection: '',
    action: '',
    summary: '',
    updatedAt: Date.now(),
  };
}

export function emptyPlan(date: string): DayPlan {
  const slots: Record<string, PlanSlot> = {};
  for (const s of TIME_SLOTS) slots[s.id] = { current: '', replan: '', upgrade: '' };
  return { date, slots, updatedAt: Date.now() };
}

export function todayStr(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function shiftDate(date: string, delta: number): string {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function cnDate(date: string): string {
  const [y, m, d] = date.split('-');
  return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`;
}

export const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
export function cnWeekday(date: string): string {
  return '星期' + WEEKDAYS[new Date(date + 'T00:00:00').getDay()];
}
