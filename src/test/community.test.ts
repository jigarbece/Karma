import { chase, demoBoard, maskName } from '../lib/community';

describe('half-masked names', () => {
  it('keeps the first half of every word', () => {
    expect(maskName('Jigar Pandya')).toBe('Jig** Pan***');
    expect(maskName('Om')).toBe('O*');
    expect(maskName('A')).toBe('A');
    expect(maskName('  ')).toBe('Karma friend');
    expect(maskName('')).toBe('Karma friend');
  });
  it('works on Gujarati and Hindi', () => {
    expect(maskName('જીગર પંડ્યા')).toMatch(/\*/);
    expect(maskName('मीरा शाह')).toMatch(/^.+ .+$/u);
    expect(maskName('જીગર')).not.toBe('જીગર');
  });
  it('never returns a full multi-letter name', () => {
    for (const n of ['Aarav Shah', 'Meera', 'Kavya Joshi']) expect(maskName(n)).not.toBe(n);
  });
});

describe('beat the leader', () => {
  it('says you lead when you are first', () => {
    const b = demoBoard('Jigar Pandya', 200);
    expect(b.me?.rank).toBe(1);
    expect(chase(b).state).toBe('leading');
  });
  it('tells you how many points pass the leader and the next person up', () => {
    const b = demoBoard('Jigar Pandya', 60); // between 64 and 52
    const c = chase(b);
    expect(b.me?.rank).toBe(4);
    expect(c.state).toBe('chasing');
    expect(c.toLead).toBe(96 - 60 + 1);
    expect(c.toNext).toBe(64 - 60 + 1);
  });
  it('invites someone with no points yet to join', () => {
    const b = demoBoard('Jigar Pandya', 0);
    expect(b.me).toBeNull();
    expect(chase(b)).toMatchObject({ state: 'new', toLead: 97 });
  });
  it('lists only the top 5, with masked names and no paap or act data', () => {
    const b = demoBoard('Jigar Pandya', 30);
    expect(b.leaders).toHaveLength(5);
    expect(JSON.stringify(b)).not.toMatch(/Aarav Shah|Meera Patel|paap|summary/);
    expect(b.week_total).toBeGreaterThan(b.leaders[0].points);
  });
});
