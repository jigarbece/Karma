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

  /** Ends the current session at once and makes it ignore anything it still reports. */
  const kill = useCallback(() => {
    const old = recRef.current;
    recRef.current = null;
    if (old) {
      old.onresult = null;
      old.onerror = null;
      old.onend = null;
      try {
        old.abort();
      } catch {
        /* already stopped */
      }
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError('unsupported');
      return;
    }
    setError(null);
    kill();
    const base = getBase();
    const continuous = !isMobile();
    // some Android builds only know the bare code ("gu") and reject "gu-IN", so retry once with it
    const tags = [LOCALE[lang], LOCALE[lang].split('-')[0]];

    const begin = (attempt: number) => {
      const rec = new Ctor();
      rec.lang = tags[attempt];
      rec.continuous = continuous;
      rec.interimResults = true;
      rec.onresult = (e) => {
        if (recRef.current !== rec) return;
        // rebuild from every result each time, so repeated or re-sent results never double the text
        let spoken = '';
        for (let i = 0; i < e.results.length; i++) spoken += e.results[i][0].transcript;
        spoken = spoken.trim();
        onText(base ? `${base.trimEnd()} ${spoken}` : spoken);
      };
      rec.onerror = (e) => {
        if (recRef.current !== rec) return;
        // "service-not-allowed" is what Chrome reports when the speech service has no model for this language
        // (the microphone permission itself is fine, English works): try the bare code before giving up
        if ((e.error === 'language-not-supported' || e.error === 'service-not-allowed') && attempt + 1 < tags.length) {
          recRef.current = null;
          begin(attempt + 1);
          return;
        }
        if (e.error !== 'aborted' && e.error !== 'no-speech') setError(e.error);
        setListening(false);
      };
      rec.onend = () => {
        if (recRef.current === rec) setListening(false);
      };
      recRef.current = rec;
      try {
        rec.start();
        setListening(true);
      } catch {
        recRef.current = null;
        setListening(false);
        setError('start-failed');
      }
    };
    begin(0);
  }, [lang, getBase, onText, kill]);

  // switching language stops the mic first; the next tap starts listening in the new language
  useEffect(() => {
    kill();
    setError(null);
  }, [lang, kill]);

  useEffect(() => kill, [kill]);

  return { supported, listening, error, start, stop };
}
