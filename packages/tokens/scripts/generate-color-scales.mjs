// Generates an 11-step (50-950) tint/shade scale for each of the palette's core colors,
// anchored so the given hex reproduces exactly at the 500 step. Ramps lightness in OKLCH
// (Björn Ottosson's color space) rather than sRGB/HSL, which keeps steps perceptually even
// and avoids the muddy midtones a naive RGB/HSL mix produces. Chroma tapers linearly to 0
// at the 50/950 extremes so the scale settles into near-white/near-black rather than
// clipping out of the sRGB gamut.
import { writeFileSync } from 'node:fs';

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// Generic lightness "position" for each step on a 0 (darkest) - 1 (lightest) axis.
// 500's generic position (0.60) is never used directly as a target L -- it's only the
// interpolation anchor; the actual L500 always comes from the input color.
const POSITION = { 50: 0.99, 100: 0.96, 200: 0.9, 300: 0.82, 400: 0.71, 500: 0.6, 600: 0.47, 700: 0.34, 800: 0.22, 900: 0.1, 950: 0.0 };

function srgbToLinear(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToSrgb(c) {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return v * 255;
}

function hexToLinearRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [srgbToLinear((n >> 16) & 255), srgbToLinear((n >> 8) & 255), srgbToLinear(n & 255)];
}

function linearRgbToOklab([r, g, b]) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
  ];
}

function oklabToLinearRgb([L, A, B]) {
  const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = L - 0.0894841775 * A - 1.291485548 * B;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ];
}

function oklabToOklch([L, A, B]) {
  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}
function oklchToOklab([L, C, H]) {
  const hRad = (H * Math.PI) / 180;
  return [L, C * Math.cos(hRad), C * Math.sin(hRad)];
}

function inGamut([r, g, b]) {
  return r >= -1e-6 && r <= 1 + 1e-6 && g >= -1e-6 && g <= 1 + 1e-6 && b >= -1e-6 && b <= 1 + 1e-6;
}

function oklchToHex(L, C, H) {
  // Binary-search chroma down if the requested L/C/H falls outside sRGB gamut.
  let lo = 0;
  let hi = C;
  let best = [0, 0, 0];
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const rgb = oklabToLinearRgb(oklchToOklab([L, mid, H]));
    if (inGamut(rgb)) {
      best = rgb;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  const [r, g, b] = best;
  const toHex = (v) => Math.round(Math.min(255, Math.max(0, linearToSrgb(v))))
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Eases the dark-side (600-950) progression: steps just past 500 move slowly, so 600/700
// stay close in lightness to 500, and the descent toward 950 backloads toward the end
// instead of dropping steeply right after the anchor. 1.0 = linear (the original behavior);
// >1.0 flattens the early dark steps. Endpoints (500 and 950) are unaffected either way --
// only how quickly the steps between them get there changes.
const DARK_EASE = 1.7;

function generateScale(baseHex) {
  const [L500, C500, H] = oklabToOklch(linearRgbToOklab(hexToLinearRgb(baseHex)));
  const pos500 = POSITION[500];
  const scale = {};

  for (const step of STEPS) {
    if (step === 500) {
      scale[step] = baseHex.toUpperCase();
      continue;
    }
    const pos = POSITION[step];
    const lighter = pos > pos500;
    const extremePos = lighter ? POSITION[50] : POSITION[950];
    const extremeL = lighter ? 0.99 : 0.12;
    const fraction = (pos - pos500) / (extremePos - pos500);
    const easedFraction = lighter ? fraction : Math.pow(fraction, DARK_EASE);
    const L = L500 + easedFraction * (extremeL - L500);
    // Taper chroma toward the extremes but keep a floor (15% of C500) so every color's
    // 50/950 step still reads as a tint/shade of that color, not a neutral gray.
    const C = C500 * (1 - easedFraction * 0.85);
    scale[step] = oklchToHex(L, C, H);
  }
  return scale;
}

// One-word working names for the palette's six core colors (originally named
// Cloud Dancer, Nordic Breeze, Duranta Yellow, Light Violet, Intergalactic Highway,
// and Tetsu-Kon Blue).
const bases = {
  linen: '#F0EEE9',
  mist: '#D3DDE7',
  citron: '#D8E63C',
  lilac: '#D6B4FC',
  indigo: '#273287',
  midnight: '#17184B'
};

const result = {};
for (const [name, hex] of Object.entries(bases)) {
  result[name] = generateScale(hex);
}

writeFileSync(new URL('./generated-color-scales.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
