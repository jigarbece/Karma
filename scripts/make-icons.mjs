// Generates public/icon-192.png and icon-512.png (indigo tile with a gold ghada) with no dependencies.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};

function render(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      let [r, g, b] = [30, 27, 75]; // deep indigo
      // pot body
      const bx = (u - 0.5) / 0.27, by = (v - 0.6) / 0.27;
      const body = bx * bx + by * by <= 1;
      const neck = Math.abs(u - 0.5) < 0.1 && v > 0.22 && v < 0.4;
      const rim = ((u - 0.5) / 0.14) ** 2 + ((v - 0.24) / 0.035) ** 2 <= 1;
      const flame = ((u - 0.5) / 0.05) ** 2 + ((v - 0.15) / 0.075) ** 2 <= 1;
      if (body || neck || rim) {
        const t = Math.min(1, Math.max(0, (v - 0.3) / 0.6));
        [r, g, b] = [Math.round(245 - 60 * t), Math.round(190 - 70 * t), Math.round(80 - 40 * t)];
      }
      if (flame) [r, g, b] = [242, 140, 40];
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public', { recursive: true });
for (const s of [192, 512]) writeFileSync(`public/icon-${s}.png`, render(s));
console.log('icons written');
