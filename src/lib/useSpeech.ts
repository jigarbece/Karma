import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lang } from './types';
import { LOCALE } from './i18n';

/* Minimal typings: Web Speech API is not in lib.dom for all TS versions. */
interface SpeechResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechResultLike>;
}
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => RecognitionLike;

function getCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Phone browsers (Android Chrome especially) repeat words in continuous mode, so they get one utterance per tap. */
const isMobile = () => typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/**
 * Live dictation. `onText` receives the full text (existing text + new speech) on every update.
 * Audio is processed by the browser; Karma never records or stores it.
 * `error` is a Web Speech error code, or `unsupported` when the browser has no speech recognition (in-app browsers, Firefox).
 */
export function useSpeech(lang: Lang, getBase: () => string, onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<RecognitionLike | null>(null);
  const supported = getCtor() !== null;

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError('unsupported');
      return;
    }
    setError(null);
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = LOCALE[lang];
    rec.continuous = !isMobile();
    rec.interimResults = true;
    const base = getBase();
    rec.onresult = (e) => {
      // rebuild from every result each time, so repeated or re-sent results never double the text
      let spoken = '';
      for (let i = 0; i < e.results.length; i++) spoken += e.results[i][0].transcript;
      spoken = spoken.trim();
      onText(base ? `${base.trimEnd()} ${spoken}` : spoken);
    };
    rec.onerror = (e) => {
      if (e.error !== 'aborted' && e.error !== 'no-speech') setError(e.error);
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError('start-failed');
    }
  }, [lang, getBase, onText]);

  useEffect(() => () => recRef.current?.abort(), []);

  return { supported, listening, error, start, stop };
}
