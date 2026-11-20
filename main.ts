// "The World in One Day" - Friday 20 November 2026.
// A newspaper front page for the make.fun news-image-20261120 bounty.
// The finished picture lives in entry.png next to this file: a 1024x1024
// front page drawn for this day only. This program does one thing: it
// checks that picture is a whole, in-limits PNG, then places that exact
// picture at /output/entry.png for the grader.
//
// Local check:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoDir = dirname(fileURLToPath(import.meta.url));
const picturePath = join(repoDir, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const outPath = join(outDir, "entry.png");

const picture = readFileSync(picturePath);

// The first eight bytes of any PNG are always these.
const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const looksLikePng =
  picture.length >= 8 &&
  pngSignature.every((byte, i) => picture[i] === byte);
if (!looksLikePng) {
  throw new Error("entry.png does not start with the PNG signature");
}

// The contest caps the file at 1 MiB and 1024 by 1024 pixels. A PNG
// stores its width at bytes 16-19 and its height at bytes 20-23.
if (picture.length > 1048576) {
  throw new Error(`entry.png is ${picture.length} bytes, over 1 MiB`);
}
const picWidth = picture.readUInt32BE(16);
const picHeight = picture.readUInt32BE(20);
if (picWidth > 1024 || picHeight > 1024) {
  throw new Error(`entry.png is ${picWidth}x${picHeight}, over 1024x1024`);
}

// A whole PNG ends with its IEND chunk: length 0, type "IEND", then the
// chunk's CRC. Refuse a file that was cut short.
const iend = Buffer.from([
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);
if (!picture.subarray(picture.length - 12).equals(iend)) {
  throw new Error("entry.png does not end with a complete IEND chunk");
}

// A plain copy, nothing else: no clock, no dice, no network, so the
// first run and the second run write byte-identical files. The picture
// is fixed at build time; nothing is generated at run time.
mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, picture);
console.log(`wrote ${outPath} (${picture.length} bytes)`);
