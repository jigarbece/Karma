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

  it('puts what was heard into the text once, without doubling', () => {
    const { result, onText } = setup('hi');
    act(() => result.current.start());
    const rec = FakeRecognition.instances[0];
    act(() => rec.onresult?.({ resultIndex: 0, results: [{ isFinal: false, 0: { transcript: 'मैंने दान किया' } }] }));
    act(() => rec.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: 'मैंने दान किया' } }, { isFinal: false, 0: { transcript: ' और मदद की' } }] }));
    expect(onText).toHaveBeenLastCalledWith('मैंने दान किया और मदद की');
  });

  it('reports unsupported browsers instead of hiding the problem', () => {
    delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    const { result } = setup('gu');
    act(() => result.current.start());
    expect(result.current.error).toBe('unsupported');
    expect(result.current.supported).toBe(false);
  });
});
