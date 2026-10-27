import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lang } from './types';
import { LOCALE } from './i18n';
import { canRecord, MAX_RECORD_SECONDS, pickRecorderMime } from './audio';

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

/** One recording that is being captured or sent for transcription. */
interface Recording {
  mr: MediaRecorder;
  stream: MediaStream;
  timer: number;
  cancelled: boolean;
}

export type Transcribe = (audio: Blob, lang: Lang) => Promise<string>;

/**
 * Voice typing in three languages that works on any phone.
 *
 * - Hindi and English use the browser's own speech recognition (live text, no upload).
 * - Gujarati, and any browser or phone whose speech recognition is missing or cannot do the language, record a short
 *   clip instead and `transcribe` turns it into text on the server. That path needs only a microphone and
 *   MediaRecorder (Android 5+ Chrome, iOS 14.5+ Safari, every current desktop browser). The clip is never stored.
 *
 * `onText` receives the full text (existing text + new speech). `error` is a Web Speech error code, `unsupported`,
 * `transcribe-failed` or `no-speech-heard`. Changing `lang` stops whatever is running.
 */
export function useSpeech(lang: Lang, getBase: () => string, onText: (text: string) => void, transcribe?: Transcribe) {
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<RecognitionLike | null>(null);
  const recordingRef = useRef<Recording | null>(null);
  const tokenRef = useRef(0);
  const supported = getCtor() !== null || (!!transcribe && canRecord());

  const stop = useCallback(() => {
    recRef.current?.stop();
    const r = recordingRef.current;
    if (r && r.mr.state === 'recording') r.mr.stop();
  }, []);

  /** Ends whatever is running at once and makes it ignore anything it still reports. */
  const kill = useCallback(() => {
    tokenRef.current++;
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
    const r = recordingRef.current;
    recordingRef.current = null;
    if (r) {
      r.cancelled = true;
      window.clearTimeout(r.timer);
      try {
        if (r.mr.state !== 'inactive') r.mr.stop();
      } catch {
        /* already stopped */
      }
      r.stream.getTracks().forEach((t) => t.stop());
    }
    setListening(false);
    setTranscribing(false);
  }, []);

  /** Record a clip and have the server turn it into text. */
  const record = useCallback(async () => {
    if (!transcribe) return;
    const token = ++tokenRef.current;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const name = (e as { name?: string }).name;
      setError(name === 'NotAllowedError' || name === 'SecurityError' ? 'not-allowed' : 'audio-capture');
      return;
    }
    if (tokenRef.current !== token) {
      // the language was switched while the permission prompt was open
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    const mime = pickRecorderMime();
    let mr: MediaRecorder;
    try {
      mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      setError('unsupported');
      return;
    }
    const rec: Recording = { mr, stream, timer: 0, cancelled: false };
    recordingRef.current = rec;
    const chunks: Blob[] = [];
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    mr.onstop = async () => {
      window.clearTimeout(rec.timer);
      stream.getTracks().forEach((t) => t.stop());
      if (rec.cancelled) return;
      setListening(false);
      const blob = new Blob(chunks, { type: mr.mimeType || mime || 'audio/webm' });
      if (blob.size < 1200) {
        recordingRef.current = null;
        setError('no-speech-heard');
        return;
      }
      setTranscribing(true);
      try {
        const text = (await transcribe(blob, lang)).trim();
        if (rec.cancelled) return;
        if (text) {
          // append to whatever is in the box now, in case the user typed while this was converting
          const base = getBase();
          onText(base ? `${base.trimEnd()} ${text}` : text);
        } else setError('no-speech-heard');
      } catch {
        if (!rec.cancelled) setError('transcribe-failed');
      } finally {
        if (!rec.cancelled) {
          recordingRef.current = null;
          setTranscribing(false);
        }
      }
    };
    mr.start();
    setListening(true);
    rec.timer = window.setTimeout(() => {
      if (mr.state === 'recording') mr.stop();
    }, MAX_RECORD_SECONDS * 1000);
  }, [lang, getBase, onText, transcribe]);

  const start = useCallback(() => {
    setError(null);
    kill();
    const Ctor = getCtor();
    const server = !!transcribe && canRecord();
    // Gujarati is not reliably available in the browsers' own recognition, so it always goes through the server
    if (server && (lang === 'gu' || !Ctor)) {
      void record();
      return;
    }
    if (!Ctor) {
      setError('unsupported');
      return;
    }
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
        // (the microphone permission itself is fine, English works): try the bare code, then the server
        if (e.error === 'language-not-supported' || e.error === 'service-not-allowed') {
          if (attempt + 1 < tags.length) {
            recRef.current = null;
            begin(attempt + 1);
            return;
          }
          if (server) {
            recRef.current = null;
            setListening(false);
            void record();
            return;
          }
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
  }, [lang, getBase, onText, kill, record, transcribe]);

  // switching language stops the mic first; the next tap starts listening in the new language
  useEffect(() => {
    kill();
    setError(null);
  }, [lang, kill]);

  useEffect(() => kill, [kill]);

  return { supported, listening, transcribing, error, start, stop };
}
