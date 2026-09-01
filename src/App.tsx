import { useState, type ReactNode } from 'react';
import DiaryPage from '@/sections/DiaryPage';
import Plan24Page from '@/sections/Plan24Page';
import SearchPage from '@/sections/SearchPage';
import { todayStr } from '@/types/diary';

type Tab = 'diary' | 'plan24' | 'search';

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  {
    id: 'diary',
    label: '日记',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15Z" />
        <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
      </svg>
    ),
  },
  {
    id: 'plan24',
    label: '24时',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'search',
    label: '搜索',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('diary');
  const [date, setDate] = useState(todayStr());

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-[#f4efe3] font-serif">
      {/* 顶部题字 */}
      <header className="sticky top-0 z-10 border-b border-red-900/15 bg-[#f4efe3]/95 backdrop-blur">
        <div className="flex items-center justify-center gap-3 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-red-800 text-sm font-bold text-[#f5ecd7] shadow">
            功
          </span>
          <h1 className="text-xl font-bold tracking-[0.4em] text-stone-800">功夫日记</h1>
          <span className="flex h-8 w-8 items-center justify-center rounded bg-red-800 text-sm font-bold text-[#f5ecd7] shadow">
            行
          </span>
        </div>
      </header>

      {/* 主内容 */}
      <main className="flex-1 px-3 pt-4">
        {tab === 'diary' && <DiaryPage date={date} onDateChange={setDate} />}
        {tab === 'plan24' && <Plan24Page date={date} />}
        {tab === 'search' && (
          <SearchPage
            onOpenDate={(d) => {
              setDate(d);
              setTab('diary');
            }}
          />
        )}
      </main>

      {/* 底部导航 */}
      <nav className="sticky bottom-0 z-10 border-t border-stone-300/60 bg-[#efe8d6]/95 backdrop-blur">
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                tab === t.id ? 'font-bold text-red-800' : 'text-stone-500'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
