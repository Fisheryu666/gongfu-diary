// 语音输入：基于 Web Speech API（安卓 Chrome / 鸿蒙浏览器支持较好；
// iPhone Safari 需 iOS 17+，不支持时自动隐藏麦克风按钮）
import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export function speechSupported(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function useSpeech(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
      return;
    }
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setError('当前浏览器不支持语音输入，请用文字输入');
      return;
    }
    setError(null);
    const rec = new Ctor();
    rec.lang = 'zh-CN';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript;
      }
      if (text) onTextRef.current(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = (e) => {
      setListening(false);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('麦克风权限被拒绝，请在浏览器设置中允许麦克风');
      } else if (e.error === 'no-speech') {
        setError('没有听到声音，请再试一次');
      } else if (e.error) {
        setError('语音识别出错：' + e.error);
      }
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError('无法启动语音识别');
    }
  }, [listening, stop]);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return { listening, error, toggle, stop, supported: speechSupported() };
}
