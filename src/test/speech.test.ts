import { act, renderHook } from '@testing-library/react';
import { useSpeech } from '../lib/useSpeech';
import type { Lang } from '../lib/types';

class FakeRecognition {
  static instances: FakeRecognition[] = [];
  lang = '';
  continuous = false;
  interimResults = false;
  onresult: ((e: unknown) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  started = false;
  aborted = false;
  constructor() {
    FakeRecognition.instances.push(this);
  }
  start() {
    this.started = true;
  }
  stop() {}
  abort() {
    this.aborted = true;
  }
}

describe('useSpeech', () => {
  beforeEach(() => {
    FakeRecognition.instances = [];
    (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition = FakeRecognition;
  });
  afterEach(() => {
    delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
  });

  const setup = (lang: Lang) => {
    const onText = vi.fn();
    return { onText, ...renderHook(({ l }) => useSpeech(l, () => '', onText), { initialProps: { l: lang } }) };
  };

  it('listens in the selected language: Gujarati, Hindi and English', () => {
    for (const [lang, tag] of [['gu', 'gu-IN'], ['hi', 'hi-IN'], ['en', 'en-IN']] as const) {
      const { result, unmount } = setup(lang);
      act(() => result.current.start());
      expect(FakeRecognition.instances.at(-1)!.lang).toBe(tag);
      expect(result.current.listening).toBe(true);
      unmount();
    }
  });

  it('stops the mic when the language is switched, then listens in the new language on the next tap', () => {
    const { result, rerender } = setup('gu');
    act(() => result.current.start());
    const gujarati = FakeRecognition.instances[0];
    expect(result.current.listening).toBe(true);

    rerender({ l: 'hi' });
    expect(gujarati.aborted).toBe(true);
    expect(result.current.listening).toBe(false);

    act(() => result.current.start());
    const hindi = FakeRecognition.instances[1];
    expect(hindi.lang).toBe('hi-IN');
    expect(result.current.listening).toBe(true);

    // a late event from the old Gujarati session must not touch the new one
    expect(gujarati.onend).toBeNull();
  });

  it('retries with the bare language code when the phone rejects the regional one', () => {
    const { result } = setup('gu');
    act(() => result.current.start());
    act(() => FakeRecognition.instances[0].onerror?.({ error: 'language-not-supported' }));
    expect(FakeRecognition.instances).toHaveLength(2);
    expect(FakeRecognition.instances[1].lang).toBe('gu');
    expect(result.current.error).toBeNull();
    expect(result.current.listening).toBe(true);
  });

  it('treats service-not-allowed (no speech model for the language) like an unsupported language, and reports it if the retry fails too', () => {
    const { result } = setup('gu');
    act(() => result.current.start());
    act(() => FakeRecognition.instances[0].onerror?.({ error: 'service-not-allowed' }));
    expect(FakeRecognition.instances[1].lang).toBe('gu');
    act(() => FakeRecognition.instances[1].onerror?.({ error: 'service-not-allowed' }));
    expect(result.current.error).toBe('service-not-allowed');
    expect(result.current.listening).toBe(false);
  });

  it('puts what was heard into the text once, without doubling', () => {
    const { result, onText } = setup('hi');
    act(() => result.current.start());
    const rec = FakeRecognition.instances[0];
    act(() => rec.onresult?.({ resultIndex: 0, results: [{ isFinal: false, 0: { transcript: 'मैंने दान किया' } }] }));
    act(() => rec.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: 'मैंने दान किया' } }, { isFinal: false, 0: { transcript: ' और मदद की' } }] }));
    expect(onText).toHaveBeenLastCalledWith('मैंने दान किया और मदद की');
  });

  describe('server transcription path (works without browser speech recognition)', () => {
    class FakeMediaRecorder {
      static instances: FakeMediaRecorder[] = [];
      static isTypeSupported = () => true;
      state: 'inactive' | 'recording' = 'inactive';
      mimeType = 'audio/webm';
      ondataavailable: ((e: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      constructor() {
        FakeMediaRecorder.instances.push(this);
      }
      start() {
        this.state = 'recording';
      }
      stop() {
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob([new Uint8Array(4000)], { type: 'audio/webm' }) });
        this.onstop?.();
      }
    }
    const trackStop = vi.fn();
    const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

    beforeEach(() => {
      FakeMediaRecorder.instances = [];
      trackStop.mockClear();
      vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: trackStop }] }) },
      });
    });
    afterEach(() => {
      vi.unstubAllGlobals();
      Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined });
    });

    const setupServer = (lang: Lang, transcribe: (b: Blob, l: Lang) => Promise<string>, base = '') => {
      const onText = vi.fn();
      return { onText, ...renderHook(({ l }) => useSpeech(l, () => base, onText, transcribe), { initialProps: { l: lang } }) };
    };

    it('Gujarati records and transcribes on the server even when the browser has speech recognition', async () => {
      const transcribe = vi.fn().mockResolvedValue('મેં દાન કર્યું');
      const { result, onText } = setupServer('gu', transcribe);
      act(() => result.current.start());
      await flush();
      expect(FakeMediaRecorder.instances).toHaveLength(1);
      expect(FakeRecognition.instances).toHaveLength(0);
      expect(result.current.listening).toBe(true);

      act(() => result.current.stop());
      await flush();
      expect(transcribe).toHaveBeenCalledWith(expect.any(Blob), 'gu');
      expect(onText).toHaveBeenCalledWith('મેં દાન કર્યું');
      expect(result.current.listening).toBe(false);
      expect(result.current.transcribing).toBe(false);
      expect(trackStop).toHaveBeenCalled(); // microphone released
    });

    it('works on a browser with no speech recognition at all, in every language', async () => {
      delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
      for (const lang of ['gu', 'hi', 'en'] as const) {
        const transcribe = vi.fn().mockResolvedValue('text');
        const { result, onText, unmount } = setupServer(lang, transcribe, 'earlier');
        expect(result.current.supported).toBe(true);
        act(() => result.current.start());
        await flush();
        act(() => result.current.stop());
        await flush();
        expect(onText).toHaveBeenCalledWith('earlier text');
        unmount();
      }
    });

    it('Hindi still uses live browser recognition when it is available', async () => {
      const { result } = setupServer('hi', vi.fn());
      act(() => result.current.start());
      await flush();
      expect(FakeRecognition.instances).toHaveLength(1);
      expect(FakeMediaRecorder.instances).toHaveLength(0);
    });

    it('falls back to the server when browser recognition has no model for Hindi or English', async () => {
      const transcribe = vi.fn().mockResolvedValue('ok');
      const { result, onText } = setupServer('hi', transcribe);
      act(() => result.current.start());
      act(() => FakeRecognition.instances[0].onerror?.({ error: 'service-not-allowed' }));
      act(() => FakeRecognition.instances[1].onerror?.({ error: 'service-not-allowed' }));
      await flush();
      expect(FakeMediaRecorder.instances).toHaveLength(1);
      expect(result.current.error).toBeNull();
      act(() => result.current.stop());
      await flush();
      expect(onText).toHaveBeenCalledWith('ok');
    });

    it('switching language drops a recording and its late result', async () => {
      let release: (t: string) => void = () => {};
      const transcribe = vi.fn().mockReturnValue(new Promise<string>((r) => { release = r; }));
      const { result, rerender, onText } = setupServer('gu', transcribe);
      act(() => result.current.start());
      await flush();
      act(() => result.current.stop());
      await flush();
      expect(result.current.transcribing).toBe(true);

      rerender({ l: 'hi' });
      expect(result.current.transcribing).toBe(false);
      await act(async () => release('late'));
      expect(onText).not.toHaveBeenCalled();
    });

    it('reports a denied microphone and a failed conversion', async () => {
      (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(Object.assign(new Error('no'), { name: 'NotAllowedError' }));
      const first = setupServer('gu', vi.fn());
      act(() => first.result.current.start());
      await flush();
      expect(first.result.current.error).toBe('not-allowed');

      const second = setupServer('gu', vi.fn().mockRejectedValue(new Error('boom')));
      act(() => second.result.current.start());
      await flush();
      act(() => second.result.current.stop());
      await flush();
      expect(second.result.current.error).toBe('transcribe-failed');
      expect(second.result.current.transcribing).toBe(false);
    });
  });

  it('reports unsupported browsers instead of hiding the problem', () => {
    delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    const { result } = setup('gu');
    act(() => result.current.start());
    expect(result.current.error).toBe('unsupported');
    expect(result.current.supported).toBe(false);
  });
});
