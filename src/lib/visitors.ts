import { useEffect, useState } from 'react';
import { supabase } from './supabase';

const KEY = 'karma.vid';

/** A random, anonymous id kept in this browser only. It identifies no one; it only stops a reload counting twice. */
export function getVisitorId(): string | null {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null; // storage blocked: count nothing rather than count every page load
  }
}

const doNotTrack = (): boolean =>
  typeof navigator !== 'undefined' && (navigator.doNotTrack === '1' || (navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl === true);

let cached: Promise<number | null> | null = null;

/**
 * Registers this browser once (unless Do Not Track is on) and returns the total unique visitors,
 * or null when the counter is unavailable (no backend, function missing, offline).
 */
export function loadVisitorCount(): Promise<number | null> {
  if (!supabase) return Promise.resolve(null);
  if (cached) return cached;
  const client = supabase;
  const id = doNotTrack() ? null : getVisitorId();
  cached = (async () => {
    try {
      const { data, error } = id ? await client.rpc('register_visit', { vid: id }) : await client.rpc('visitor_count');
      if (error || data === null || data === undefined) return null;
      const n = Number(data);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  })();
  return cached;
}

/** For tests. */
export function resetVisitorCache() {
  cached = null;
}

export function useVisitorCount(): number | null {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    loadVisitorCount().then((n) => live && setCount(n));
    return () => {
      live = false;
    };
  }, []);
  return count;
}
