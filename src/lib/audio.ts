/** Recording helpers for voice typing in browsers whose built-in speech recognition cannot do the language. */

/** Longest single recording, in seconds. It stops by itself so a forgotten mic never runs on. */
export const MAX_RECORD_SECONDS = 60;

/** True when this browser can record from the microphone at all (Android 5+ Chrome, iOS 14.5+ Safari, all current desktops). */
export function canRecord(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
}

/** First recording format this browser supports; undefined lets the browser choose. */
export function pickRecorderMime(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/aac'];
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return undefined;
  return candidates.find((m) => MediaRecorder.isTypeSupported(m));
}

/** Base64 of a blob, without the "data:...;base64," prefix. FileReader is available in every browser that can record. */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('read_failed'));
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.readAsDataURL(blob);
  });
}
