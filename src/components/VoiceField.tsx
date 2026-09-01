// 带语音输入的文本框
import { useSpeech } from '@/hooks/useSpeech';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  compact?: boolean;
}

export default function VoiceField({ value, onChange, placeholder, rows = 2, compact }: Props) {
  const { listening, error, toggle, supported } = useSpeech((text) => {
    const joined = value ? value.replace(/[，。；\s]*$/, '') + '，' + text : text;
    onChange(joined);
  });

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full resize-y rounded-lg border border-stone-300 bg-white/80 px-3 py-2 leading-relaxed text-stone-800 placeholder-stone-400 outline-none focus:border-red-800/60 focus:ring-1 focus:ring-red-800/30 ${
          compact ? 'text-sm' : 'text-[15px]'
        } ${supported ? 'pr-10' : ''}`}
      />
      {supported && (
        <button
          type="button"
          onClick={toggle}
          title={listening ? '停止语音输入' : '开始语音输入'}
          className={`absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            listening
              ? 'animate-pulse bg-red-700 text-white'
              : 'bg-stone-200/80 text-stone-600 hover:bg-red-100 hover:text-red-800'
          }`}
        >
          {listening ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <rect x="7" y="7" width="10" height="10" rx="2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" strokeLinecap="round" />
            </svg>
          )}
        </button>
      )}
      {listening && (
        <div className="pointer-events-none absolute -top-6 right-0 rounded bg-red-700 px-2 py-0.5 text-xs text-white">
          正在聆听… 说完点红色按钮停止
        </div>
      )}
      {error && <div className="mt-1 text-xs text-red-700">{error}</div>}
    </div>
  );
}
