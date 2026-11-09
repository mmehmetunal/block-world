// Dev heykel: dövüş duruşunda, bir yumruğu havada kaslı bir dev (özgün tasarım). Gövde, eklemler arasındaki konik
// kapsüllerin ve elipsoitlerin birleşimidir; bakırdan, üst yüzeyleri yeşil patinalı, gözleri parlar.
// Kademeli taş kaidenin üstünde durur, çevresinde mazgallı bir sur yükselir. ~110 blok.
import { shell, disc, flatten, orbit } from '../templates.mjs';

const H = 92; // heykelin boyu (blok)
// Eklemler (boy birimiyle: x yan, y yukarı, z ileri)
const J = {
  pelvis: [0, 0.52, 0], chest: [0, 0.7, 0.01], neck: [0, 0.8, 0.02], head: [0, 0.88, 0.035],
  hipL: [-0.09, 0.5, 0], kneeL: [-0.16, 0.27, 0.07], ankleL: [-0.19, 0.04, 0.03], toeL: [-0.2, 0.015, 0.12],
  hipR: [0.09, 0.5, 0], kneeR: [0.15, 0.27, -0.06], ankleR: [0.19, 0.04, -0.11], toeR: [0.2, 0.015, -0.02],
  shoulderL: [-0.155, 0.77, 0], elbowL: [-0.25, 0.79, 0.12], fistL: [-0.19, 0.95, 0.17],
  shoulderR: [0.155, 0.77, 0], elbowR: [0.26, 0.63, -0.1], fistR: [0.2, 0.58, 0.09],
};
// Konik kapsüller: [başlangıç, bitiş, başlangıç yarıçapı, bitiş yarıçapı]
const LIMBS = [
  ['pelvis', 'chest', 0.12, 0.13], ['neck', 'head', 0.045, 0.04],
  ['hipL', 'kneeL', 0.07, 0.05], ['kneeL', 'ankleL', 0.05, 0.035], ['ankleL', 'toeL', 0.035, 0.03],
  ['hipR', 'kneeR', 0.07, 0.05], ['kneeR', 'ankleR', 0.05, 0.035], ['ankleR', 'toeR', 0.035, 0.03],
  ['shoulderL', 'elbowL', 0.055, 0.045], ['elbowL', 'fistL', 0.045, 0.04],
  ['shoulderR', 'elbowR', 0.055, 0.045], ['elbowR', 'fistR', 0.045, 0.04],
];
// Elipsoitler: [merkez, yarıçaplar] (göğüs, omuz kasları, yumruklar, baş)
const BLOBS = [
  [J.chest, [0.17, 0.1, 0.1]], [J.shoulderL, [0.075, 0.07, 0.07]], [J.shoulderR, [0.075, 0.07, 0.07]],
  [J.fistL, [0.055, 0.055, 0.055]], [J.fistR, [0.055, 0.055, 0.055]], [J.head, [0.055, 0.068, 0.06]],
];
const sub = (a, b) => a.map((v, i) => v - b[i]);
function inBody(p) {
  for (const [c, r] of BLOBS) { const d = sub(p, c); if ((d[0] / r[0]) ** 2 + (d[1] / r[1]) ** 2 + (d[2] / r[2]) ** 2 <= 1) return true; }
  for (const [a, b, ra, rb] of LIMBS) {
    const A = J[a], ab = sub(J[b], A), ap = sub(p, A);
    const t = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / (ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2)));
    const d = ap.map((v, i) => v - ab[i] * t);
    if (Math.hypot(...d) <= ra + (rb - ra) * t) return true;
  }
  return false;
}
const noise = (x, y, z) => { const h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return h - Math.floor(h); };
const baseOf = ground => Math.max(14, Math.min(34, ground));
const PEDESTAL = [[27, 3, 'stone_bricks'], [24, 4, 'polished_andesite'], [22, 2, 'chiseled_stone_bricks']]; // [yarı genişlik, kat, blok]
const WALL_R = 58, WALL_H = 14;

export default {
  name: 'giant-statue',
  size: '720x1280',
  fps: 30,
  seconds: 18,
  hold: 0.17,
  fast: 2,
  prepareShare: 0.2,
  time: 0.43,
  shader: true,
  ultra: true,
  fog: false,
  clouds: false,
  view: 'ultra',
  fov: 85,
  center: [-150, 120],
  intro: {
    seconds: 3,
    segments: [
      { until: 0.6, shader: true, ultra: true, caption: 'Ultra shader' },
      { until: 1, shader: true, ultra: true, caption: 'Nasıl yapıldı?' },
    ],
    // Surun içinden, ayağın dibinden yukarı bakan, yavaşça dönen kamera
    camera(t, { ground, center: [cx, cz] }) {
      const base = baseOf(ground), a = 1.2 + t * 0.6;
      return { pos: [cx + Math.cos(a) * 50, base + 8 + t * 8, cz + Math.sin(a) * 50], look: [cx, base + 58, cz] };
    },
  },
  prepare({ ground, center: [cx, cz] }) {
    const base = baseOf(ground);
    return [...flatten(cx, cz, 75, base), ...disc(cx, cz, 75, base, (x, z) => ((x + z) % 7 === 0 ? 'gravel' : 'smooth_stone'))];
  },
  blocks({ ground, center: [cx, cz] }) {
    const base = baseOf(ground);
    // Kaide: üst üste kare katlar, her katın üst kenarı kuvars
    let y = base + 1;
    const pedestal = [];
    for (const [half, height, key] of PEDESTAL) {
      const y0 = y;
      pedestal.push(...shell({
        inside: (x, yy, z) => yy >= y0 && yy < y0 + height && Math.abs(x - cx) <= half && Math.abs(z - cz) <= half,
        bounds: [cx - half, y0, cz - half, cx + half, y0 + height - 1, cz + half],
        material: (x, yy, z, { roof }) => (roof && (Math.abs(x - cx) === half || Math.abs(z - cz) === half) ? 'quartz_block' : key),
      }));
      y += height;
    }
    const foot = y, eyeY = foot + Math.round((J.head[1] + 0.01) * H), eyeZ = cz + Math.round((J.head[2] + 0.055) * H);
    const statue = shell({
      inside: (x, yy, z) => yy >= foot && inBody([(x - cx) / H, (yy - foot) / H, (z - cz) / H]),
      bounds: [cx - 0.4 * H, foot, cz - 0.3 * H, cx + 0.4 * H, foot + H, cz + 0.3 * H],
      material: (x, yy, z, { side, roof }) => {
        // Gözler: başın önünde iki parlak blok
        if (side && side[1] === 1 && Math.abs(yy - eyeY) <= 0 && Math.abs(Math.abs(x - cx) - 2) <= 0.5 && z >= eyeZ - 2) return 'sea_lantern';
        if (roof) return noise(x, yy, z) < 0.75 ? 'oxidized_copper' : 'weathered_copper';
        const n = noise(x, yy, z);
        return n < 0.12 ? 'weathered_copper' : n < 0.45 ? 'exposed_copper' : 'copper_block';
      },
    });
    // Sur: halka duvar, üstünde mazgallar (dişli: bir dolu bir boş)
    const wall = shell({
      inside: (x, yy, z) => { const r = Math.hypot(x - cx, z - cz); return yy > base && yy <= base + WALL_H && r >= WALL_R - 2 && r <= WALL_R; },
      bounds: [cx - WALL_R, base + 1, cz - WALL_R, cx + WALL_R, base + WALL_H, cz + WALL_R],
      material: (x, yy, z, { roof }) => (roof ? 'smooth_stone' : (yy - base) % 5 === 0 ? 'mossy_stone_bricks' : 'stone_bricks'),
    });
    for (let a = 0; a < 360; a += 3) {
      const x = Math.round(cx + Math.cos(a * Math.PI / 180) * WALL_R), z = Math.round(cz + Math.sin(a * Math.PI / 180) * WALL_R);
      wall.push([x, base + WALL_H + 1, z, 'stone_brick_wall']);
    }
    // Hepsi birlikte aşağıdan yukarı yükselir (aynı katta sıra korunur)
    return [...pedestal, ...statue, ...wall].map((b, i) => [b, i]).sort((p, q) => p[0][1] - q[0][1] || p[1] - q[1]).map(([b]) => b);
  },
  camera(t, ctx) {
    const base = baseOf(ctx.ground);
    return orbit({
      center: ctx.center, radius: 92 + 18 * ctx.progress, turns: 0.5, start: 0.9,
      height: () => base + 18 + 18 * (1 - ctx.progress) + (ctx.topY - base) * 0.35,
      look: () => base + 8 + (ctx.topY - base) * 0.5,
    })(t);
  },
};
