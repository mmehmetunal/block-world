// Burj Halife esinli gökdelen: Y planlı gövde (120° arayla üç kanat ve ortada çekirdek), kanatlar sarmal sırayla
// kademe kademe kısalır, üstte daralan çekirdek ve yuvarlak sütunlu sivri tepe. Cephe füme cam ve demir dikmeler;
// kademe çatıları kuvars. Çevresinde cilalı taş meydan ve havuz. Yükseklik ~220 blok (256 blok dünyaya sığar).
import { shell, disc, flatten, orbit } from '../templates.mjs';

const WING_LENGTH = 30, WING_HALF = 7, CORE = 9, SETBACKS = 18;
const WINGS = [90, 210, 330].map(deg => [Math.cos(deg * Math.PI / 180), Math.sin(deg * Math.PI / 180)]);

// base: meydanın yüksekliği; gövde base + 1'den başlar
function plan(base) {
  const top = 252 - base, coreTop = Math.round(top * 0.8), spireFrom = Math.round(top * 0.8);
  const step = (coreTop * 0.72) / SETBACKS;
  // Kanat k'nın y yüksekliğindeki uzunluğu: kendi sırası gelen her kademede kısalır (k, k+3, k+6 …)
  const wingLength = (k, h) => {
    let cuts = 0;
    for (let i = k; i < SETBACKS; i += 3) if (h > 6 + i * step) cuts++;
    return WING_LENGTH - cuts * (WING_LENGTH - CORE) / (SETBACKS / 3);
  };
  // Çekirdek yarıçapı: kanatlar bitince yukarı doğru daralır
  const coreRadius = h => h < coreTop * 0.72 ? CORE : Math.max(2.5, CORE - (h - coreTop * 0.72) / (coreTop * 0.28) * (CORE - 2.5));
  const inside = (x, h, z) => {
    if (h < 1 || h > coreTop) return false;
    if (x * x + z * z <= coreRadius(h) ** 2) return true;
    return WINGS.some(([dx, dz], k) => {
      const a = x * dx + z * dz, b = -x * dz + z * dx, len = wingLength(k, h);
      if (len <= CORE + 0.5 || a < 0) return false;
      if (Math.abs(b) <= WING_HALF && a <= len - WING_HALF) return true;
      return (a - (len - WING_HALF)) ** 2 + b * b <= WING_HALF * WING_HALF; // yuvarlak kanat ucu
    });
  };
  return { top, coreTop, spireFrom, inside };
}

export default {
  name: 'burj-khalifa',
  size: '720x1280',
  fps: 30,
  // İçerik 18 sn; kurulumun ortası 2x oynar, giriş (3 sn) ile birlikte video ~14 sn
  seconds: 18,
  hold: 0.17,
  fast: 2,
  // Kurulumun ilk %20'si zemin düzleme ve meydan (videoda görünür)
  prepareShare: 0.2,
  time: 0.17,
  shader: true,
  ultra: true,
  fog: false,
  clouds: false,
  view: 'ultra',
  fov: 85,
  center: [48, 48],
  // Giriş: bitmiş kule ultra görünümde; ardından "Nasıl yapıldı?" ile kuruluma geçilir
  intro: {
    seconds: 3,
    segments: [
      { until: 0.6, shader: true, ultra: true, caption: 'Ultra shader' },
      { until: 1, shader: true, ultra: true, caption: 'Nasıl yapıldı?' },
    ],
    // Alttan, yukarı bakan ve yavaşça yükselen kamera; bütün kule kadrajda
    camera(t, { ground, center: [cx, cz] }) {
      const base = Math.max(14, Math.min(34, ground)), a = 2.2 + t * 0.9;
      return { pos: [cx + Math.cos(a) * 105, base + 20 + t * 25, cz + Math.sin(a) * 105], look: [cx, base + 75 + t * 15, cz] };
    },
  },
  prepare({ ground, center: [cx, cz] }) {
    const base = Math.max(14, Math.min(34, ground));
    return [
      ...flatten(cx, cz, 70, base),
      ...disc(cx, cz, 70, base, (x, z) => ((x + z) % 8 === 0 ? 'smooth_stone' : 'polished_andesite')),
      // Havuz: kulenin çevresinde halka biçiminde, bir blok derin
      ...disc(cx, cz, 52, base, (x, z) => { const r = Math.hypot(x - cx, z - cz); return r > 40 ? 'water' : r > 38 ? 'quartz_block' : 'polished_andesite'; }),
    ];
  },
  blocks({ ground, center: [cx, cz] }) {
    const base = Math.max(14, Math.min(34, ground));
    const { top, coreTop, inside } = plan(base);
    const body = shell({
      inside: (x, y, z) => inside(x - cx, y - base, z - cz),
      bounds: [cx - WING_LENGTH - 1, base + 1, cz - WING_LENGTH - 1, cx + WING_LENGTH + 1, base + coreTop, cz + WING_LENGTH + 1],
      material: (x, y, z, { side, roof }) => {
        if (roof) return 'quartz_block';
        // Dikey demir dikmeler: cepheye paralel eksende her üç hücrede bir; her 12 katta bir açık bant
        if ((y - base) % 12 === 0) return 'polished_diorite';
        const along = side[0] ? z : x;
        return ((along % 3) + 3) % 3 === 0 ? 'iron_block' : 'tinted_glass';
      },
    });
    // Tepe: daralan demir gövde, yuvarlak sütunlar, en uçta parmaklık
    const spire = [];
    for (let y = base + coreTop + 1; y <= base + top; y++) {
      const h = y - base - coreTop, span = top - coreTop;
      if (h < span * 0.25) for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) spire.push([cx + dx, y, cz + dz, 'iron_block']);
      else spire.push([cx, y, cz, h < span * 0.92 ? 'iron_pillar' : 'iron_bars']);
    }
    return [...body, ...spire];
  },
  // Kurulurken kamera yükselen kat yüksekliğini izleyerek döner ve geri çekilir; sis sınırının (170 blok) içinde kalır
  camera(t, ctx) {
    const base = Math.max(14, Math.min(34, ctx.ground));
    const cam = orbit({
      center: ctx.center, radius: 95 + 27 * ctx.progress, turns: 0.55, start: 0.4,
      // Başta (düzleme) 20 blok daha yukarıdan bakar, kurulum ilerledikçe iner
      height: () => Math.min(250, base + 15 + 20 * (1 - ctx.progress) + (ctx.topY - base) * 0.5),
      look: () => base + (ctx.topY - base) * 0.5,
    });
    return cam(t);
  },
};
