import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const L = [
  "0001101",
  "0011001",
  "0010011",
  "0111101",
  "0100011",
  "0110001",
  "0101111",
  "0111011",
  "0110111",
  "0001011",
];
const G = [
  "0100111",
  "0110011",
  "0011011",
  "0100001",
  "0011101",
  "0111001",
  "0000101",
  "0010001",
  "0001001",
  "0010111",
];
const R = [
  "1110010",
  "1100110",
  "1101100",
  "1000010",
  "1011100",
  "1001110",
  "1010000",
  "1000100",
  "1001000",
  "1110100",
];
const PARITY = [
  "LLLLLL",
  "LLGLGG",
  "LLGGLG",
  "LLGGGL",
  "LGLLGG",
  "LGGLLG",
  "LGGGLL",
  "LGLGLG",
  "LGLGGL",
  "LGGLGL",
];

export function ean13Modules(code: string) {
  const d = [...code].map(Number);
  let bits = "101";
  for (let i = 1; i <= 6; i++)
    bits += (PARITY[d[0]][i - 1] === "L" ? L : G)[d[i]];
  bits += "01010";
  for (let i = 7; i <= 12; i++) bits += R[d[i]];
  return bits + "101";
}

export function writeBarcodeVideo(code: string, dir: string) {
  const W = 640;
  const H = 480;
  const bits = ean13Modules(code);
  const bar = 4;
  const left = Math.floor((W - bits.length * bar) / 2);
  const y = Buffer.alloc(W * H, 255);
  for (let row = 140; row < 340; row++)
    for (let i = 0; i < bits.length; i++)
      if (bits[i] === "1")
        y.fill(0, row * W + left + i * bar, row * W + left + (i + 1) * bar);
  const chroma = Buffer.alloc((W / 2) * (H / 2) * 2, 128);
  const frame = Buffer.concat([Buffer.from("FRAME\n"), y, chroma]);
  const header = Buffer.from(`YUV4MPEG2 W${W} H${H} F10:1 Ip A1:1 C420jpeg\n`);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `barcode-${code}.y4m`);
  writeFileSync(file, Buffer.concat([header, ...Array(10).fill(frame)]));
  return file;
}
