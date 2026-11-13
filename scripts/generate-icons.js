import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Draws the extension icon (dark rounded tile with a white lens ring and dot) at 16, 48 and 128 px
// and writes real RGBA PNGs to icons/ and public/icons/. No dependencies: shapes are rendered with
// 4x4 supersampling and encoded with node's zlib.

const BG = [17, 17, 17];
const FG = [245, 245, 245];
const SAMPLES = 4;

function coverage(size, x, y) {
  // Returns [tileAlpha, foregroundAlpha] for one pixel, in 0..1.
  let tile = 0;
  let fg = 0;
  const radius = size * 0.22;
  const c = size / 2;
  const ringOuter = size * 0.34;
  const ringInner = size * 0.25;
  const dot = size * 0.1;
  for (let sy = 0; sy < SAMPLES; sy++) {
    for (let sx = 0; sx < SAMPLES; sx++) {
      const px = x + (sx + 0.5) / SAMPLES;
      const py = y + (sy + 0.5) / SAMPLES;
      const dx = Math.max(radius - px, px - (size - radius), 0);
      const dy = Math.max(radius - py, py - (size - radius), 0);
      if (dx * dx + dy * dy > radius * radius) continue;
      tile++;
      const d = Math.hypot(px - c, py - c);
      if ((d <= ringOuter && d >= ringInner) || d <= dot) fg++;
    }
  }
  const n = SAMPLES * SAMPLES;
  return [tile / n, fg / n];
}

function crc32(buf) {
  let crc = ~0;
  for (const byte of buf) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function renderPng(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [tile, fg] = coverage(size, x, y);
      const mix = tile > 0 ? fg / tile : 0;
      const i = row + 1 + x * 4;
      for (let ch = 0; ch < 3; ch++) raw[i + ch] = Math.round(BG[ch] + (FG[ch] - BG[ch]) * mix);
      raw[i + 3] = Math.round(tile * 255);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const dir of ['icons', 'public/icons']) {
  fs.mkdirSync(path.resolve(dir), { recursive: true });
}

for (const size of [16, 48, 128]) {
  const png = renderPng(size);
  fs.writeFileSync(path.resolve('icons', `icon-${size}.png`), png);
  fs.writeFileSync(path.resolve('public/icons', `icon-${size}.png`), png);
}

console.log('Icons generated: 16, 48, 128 px');
