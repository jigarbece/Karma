import { corsHeaders } from '../../supabase/functions/_shared/cors.ts';

describe('corsHeaders', () => {
  const allowed = 'https://karma-828u.vercel.app, http://localhost:5173/';
  it('echoes any listed origin', () => {
    expect(corsHeaders('http://localhost:5173', allowed)['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(corsHeaders('https://karma-828u.vercel.app', allowed)['access-control-allow-origin']).toBe('https://karma-828u.vercel.app');
  });
  it('never echoes an unlisted origin', () => {
    expect(corsHeaders('https://evil.example', allowed)['access-control-allow-origin']).toBe('https://karma-828u.vercel.app');
  });
  it('falls back to the request origin when unset', () => {
    expect(corsHeaders('http://localhost:5173', undefined)['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
