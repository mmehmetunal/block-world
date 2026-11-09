// ---------- Anıtkabir ----------
// 1 blok ≈ 1,5 m ölçekli Anıtkabir: Aslanlı Yol (24 aslan), giriş kuleleri, tören meydanı ve revaklar, on kule,
// basamaklı kaide üstünde sütunlu Şeref Holü, yarıya inmiş bayrak. Oyuncunun isteğiyle kurulur (game-actions.js: buildAnitkabir).

// Yerel koordinat: a oyuncunun baktığı yönde ileri, b sağa, h zeminden yukarı (h = 0 zeminin üstündeki ilk katman).
const ANITKABIR = {
  scale: 1.5,                      // 1 blok = 1,5 m
  road: 175,                       // Aslanlı Yol uzunluğu (262 m)
  roadHalf: 6,                     // yolun yarı genişliği
  plaza: [176, 232, -26, 60],      // tören meydanı a0, a1, b0, b1 (84 × 129 m)
  podium: [184, 224, 61, 108],     // Şeref Holü kaidesi (üç kademe, 6 blok yüksek: 42 basamak)
  hall: [191, 217, 68, 102],       // Şeref Holü
  area: [-10, 262, -52, 128],      // düzlenen alanın sınırları: yol boyunca yalnızca ±22 blokluk şerit
};
// Meydanı çevreleyen sekiz kule (a0, b0; 8×8) ve yolun başındaki iki kule (Hürriyet, İstiklal)
const ANITKABIR_TOWERS = [[4, -17], [4, 10], [172, -30], [172, -17], [172, 10], [172, 53], [229, -30], [229, -5], [229, 21], [229, 53]];

// Düzlenen alana uzaklık (0 içinde): Aslanlı Yol şeridi (±22) ve meydan + hol bölgesi; dışında 12 blokluk şev
const ANITKABIR_SLOPE = 12;
function anitkabirSiteDistance(a, b) {
  const [A0, A1, B0, B1] = ANITKABIR.area;
  const rect = (a0, a1, b0, b1) => Math.max(a0 - a, a - a1, b0 - b, b - b1, 0);
  return Math.min(rect(A0, 166, -22, 22), rect(166, A1, B0, B1));
}
// Yerel çerçeve: (a, b) -> dünya (x, z); merdiven çeşidi yerel yönden (da, db: yüksek arka yarının yönü) seçilir.
function anitkabirFrame(x0, z0, y0, fx, fz) {
  const rx = -fz, rz = fx;
  const at = (a, b) => [x0 + a * fx + b * rx, z0 + a * fz + b * rz];
  const put = (a, h, b, id) => { const [x, z] = at(a, b); set(x, y0 + h, z, id); };
  const box = (a0, a1, h0, h1, b0, b1, id) => {
    for (let a = a0; a <= a1; a++) for (let h = h0; h <= h1; h++) for (let b = b0; b <= b1; b++) put(a, h, b, id);
  };
  // Merdiven türevi: yüksek tarafın dünya yönü (BED_DIRS sırası) ve ters (üst yarı) mı (build-blocks.js SHAPE_FAMILIES)
  const dirIndex = (da, db) => {
    const wx = da * fx + db * rx, wz = da * fz + db * rz;
    return BED_DIRS.findIndex(([, [dx, dz]]) => dx === wx && dz === wz);
  };
  const stairs = (group, da, db, top) => SHAPE_FAMILIES[group].variants[dirIndex(da, db) + ',' + (top ? 1 : 0)];
  return { at, put, box, stairs };
}

// Tören meydanı döşemesi: 7×7'lik halı desenleri (kırmızı, siyah, sarı, beyaz traverten), aralarda beyaz derz
function plazaTile(a, b) {
  const u = (a - ANITKABIR.plaza[0]) % 7, v = (b - ANITKABIR.plaza[2]) % 7;
  if (u === 0 || v === 0) return B.stone;
  const d = Math.abs(u - 3.5) + Math.abs(v - 3.5);
  return d < 1.5 ? B.brick : d < 2.5 ? B.nether_brick : B.sandstone;
}
// Aslan: taş kaide üstünde yatan aslan; başı yola döner (side: yolun hangi yanında, -1 sol, 1 sağ)
function placeLion(f, a, b, side) {
  f.box(a, a + 2, 0, 0, b, b, B.stone);
  f.put(a, 1, b, B.sandstone_slab);
  f.box(a + 1, a + 2, 1, 1, b, b, B.sandstone);
  f.put(a + 2, 2, b, f.stairs('sandstone_stairs', 0, side, false));
}
// Ladin: 6 blok gövde, koni yaprak
function placeAnitkabirTree(f, a, b) {
  for (let h = 0; h < 6; h++) f.put(a, h, b, B.spruce_log);
  // Katman başına yaprak yarıçapı (alttan üste daralır)
  [[2, 3], [3, 2], [4, 2], [5, 1], [6, 1], [7, 0]].forEach(([h, r]) => {
    for (let da = -r; da <= r; da++) for (let db = -r; db <= r; db++) {
      if (Math.abs(da) + Math.abs(db) <= r + 1 && (h > 5 || da || db)) f.put(a + da, h, b + db, B.spruce_leaves);
    }
  });
}
// Kule (8×8): dolu gövde, ortasında parmaklıklı pencere bandı, üstte sütunlu açık kat, basamaklı çatı
function placeTower(f, a0, b0) {
  const a1 = a0 + 7, b1 = b0 + 7;
  f.box(a0, a1, 0, 0, b0, b1, B.sandstone);
  for (let h = 1; h <= 10; h++) for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) {
    const edge = a === a0 || a === a1 || b === b0 || b === b1;
    if (!edge) { f.put(a, h, b, h === 10 ? B.sandstone : AIR); continue; }
    const along = a === a0 || a === a1 ? b - b0 : a - a0, corner = (a === a0 || a === a1) && (b === b0 || b === b1);
    // 7–9: köşe ve orta sütunlu açık kat
    if (h >= 7 && h <= 9) f.put(a, h, b, corner || along === 3 || along === 4 ? B.sandstone : AIR);
    else if (h >= 3 && h <= 4 && (along === 3 || along === 4)) f.put(a, h, b, B.iron_bars);
    else f.put(a, h, b, B.sandstone);
  }
  f.box(a0, a1, 6, 6, b0, b1, B.sandstone);
  f.box(a0 + 1, a1 - 1, 7, 9, b0 + 1, b1 - 1, AIR);
  // Çatı: kenarda taş yarım blok, içe doğru iki kademe
  f.box(a0, a1, 11, 11, b0, b1, B.stone_slab);
  f.box(a0 + 1, a1 - 1, 11, 11, b0 + 1, b1 - 1, B.sandstone);
  f.box(a0 + 2, a1 - 2, 12, 12, b0 + 2, b1 - 2, B.sandstone_slab);
}
// Revak: dış duvar (outer), içte üç blokta bir sütun, düz çatı ve taş saçak; yönü (da, db) meydana doğru
function placeColonnade(f, a0, a1, b0, b1, inward) {
  for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) {
    const depth = inward[0] ? (inward[0] > 0 ? a - a0 : a1 - a) : (inward[1] > 0 ? b - b0 : b1 - b);
    const along = inward[0] ? b : a;
    f.put(a, 0, b, B.sandstone_slab);
    for (let h = 1; h <= 5; h++) f.put(a, h, b, depth === 0 || (depth === 4 && ((along % 3) + 3) % 3 === 0) ? B.sandstone : AIR);
    if (depth === 4) f.put(a, 0, b, B.sandstone);
    f.put(a, 6, b, B.sandstone);
    f.put(a, 7, b, depth === 4 || depth === 0 ? B.stone_slab : AIR);
  }
}
// Şeref Holü: çevresi kare sütunlu (peristil), içte kapalı salon (sella); ön yüzde kapı ve parmaklıklı büyük pencere, ortada lahit
function placeHall(f) {
  const [a0, a1, b0, b1] = ANITKABIR.hall, H = 6;
  for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) {
    const ring = Math.min(a - a0, a1 - a, b - b0, b1 - b);
    f.put(a, H - 1, b, B.stone);
    for (let h = H; h <= H + 8; h++) {
      let id = AIR;
      // Dış sıra: 3 blokta bir kare sütun
      if (ring === 0) id = ((a === a0 || a === a1) ? b - b0 : a - a0) % 3 === 0 ? B.sandstone : AIR;
      // Salon duvarı
      else if (ring === 3) {
        id = B.sandstone;
        const front = b === b0 + 3, mid = Math.abs(a - (a0 + a1) / 2);
        if (front && mid <= 1 && h <= H + 2) id = AIR;            // kapı
        else if (front && mid <= 5 && h >= H + 4 && h <= H + 7) id = B.iron_bars; // pencere
        else if (!front && h >= H + 4 && h <= H + 6 && ((a + b) % 4 === 0)) id = B.iron_bars;
      }
      if (ring > 3 && h === H + 8) id = (a + b) % 5 === 0 ? B.glowstone : B.sandstone; // tavan, ışıklı
      f.put(a, h, b, id);
    }
    // Saçaklık, üstte kademeli çatı (atik)
    f.put(a, H + 9, b, B.sandstone);
    f.put(a, H + 10, b, ring === 0 ? B.stone_slab : B.sandstone);
    if (ring >= 2) f.put(a, H + 11, b, ring === 2 ? B.sandstone_slab : B.sandstone);
    if (ring >= 4) f.put(a, H + 12, b, B.stone_slab);
  }
  // Lahit
  const ca = Math.round((a0 + a1) / 2), cb = Math.round((b0 + b1) / 2);
  f.box(ca - 1, ca + 1, H, H, cb, cb + 1, B.nether_brick);
  f.box(ca - 1, ca + 1, H + 1, H + 1, cb, cb + 1, B.nether_brick_slab);
}
// Kaide: üç kademe (2'şer blok) ve meydandan hole çıkan geniş merdiven
function placePodium(f) {
  const [a0, a1, b0, b1] = ANITKABIR.podium;
  for (let step = 0; step < 3; step++) {
    const i = step * 2;
    f.box(a0 + i, a1 - i, i, i + 1, b0 + i, b1 - i, B.sandstone);
    f.box(a0 + i, a1 - i, i + 1, i + 1, b0 + i, b0 + i, B.stone_slab);
  }
  // Merdiven: b0'dan başlayıp her blokta bir katman yükselir (yüksek yarı hole doğru)
  const mid = Math.round((ANITKABIR.hall[0] + ANITKABIR.hall[1]) / 2);
  for (let k = 0; k <= 5; k++) for (let a = mid - 7; a <= mid + 7; a++) {
    const b = b0 + k;
    for (let h = 0; h < k; h++) f.put(a, h, b, B.sandstone);
    f.put(a, k, b, f.stairs('sandstone_stairs', 0, 1, false));
    for (let h = k + 1; h <= 6; h++) f.put(a, h, b, AIR);
  }
  // Merdiven yanakları
  for (let k = 0; k <= 5; k++) for (const a of [mid - 8, mid + 8]) for (let h = 0; h <= k; h++) f.put(a, h, b0 + k, B.sandstone);
}

// Oyuncunun önüne (yolun başı (x0, z0), bakış yönü (fx, fz) dört ana yönden biri) Anıtkabir'i kurar; ana dünyada etkin olmalı.
// Dönüş: { x, y, z, hall: [x, y, z] } (y: zemin üstü).
function placeAnitkabir(x0, z0, fx, fz) {
  const probe = anitkabirFrame(x0, z0, 0, fx, fz);
  const [cx, cz] = probe.at(115, 38);
  ensureArea(cx, cz, 10);
  const y0 = Math.min(Math.max(heightAt(x0, z0), WATER_LEVEL) + 1, SY - 40);
  const f = anitkabirFrame(x0, z0, y0, fx, fz);
  const [A0, A1, BB0, BB1] = ANITKABIR.area, S = ANITKABIR_SLOPE;
  generatingChunk = true;
  try {
    // Alan düzlenir: altı taş, yüzü çimen, üstü temizlenir. Kenarda arazi şevle yükselir ya da alçalır (kesik duvar kalmasın).
    for (let a = A0 - S; a <= A1 + S; a++) for (let b = BB0 - S; b <= BB1 + S; b++) {
      const d = anitkabirSiteDistance(a, b);
      if (d > S) continue;
      const [x, z] = f.at(a, b), ground = heightAt(x, z);
      const top = d === 0 ? y0 - 1 : Math.round(y0 - 1 + (ground - (y0 - 1)) * d / (S + 1));
      if (d > 0 && top === ground) continue;
      for (let y = Math.max(0, Math.min(ground, top - 1)); y <= top - 1; y++) set(x, y, z, B.stone);
      set(x, top, z, B.grass);
      for (let y = top + 1; y <= Math.max(ground + 16, y0 + 26); y++) set(x, y, z, AIR);
    }
    // Aslanlı Yol: traverten döşeme, iki yanda 12'şer aslan, çim şerit ve ladin sıraları
    const R = ANITKABIR.roadHalf;
    for (let a = -6; a <= ANITKABIR.road; a++) for (let b = -R; b <= R; b++) f.put(a, -1, b, a % 8 === 0 || Math.abs(b) >= R - 1 ? B.stone : B.sandstone);
    for (let i = 0; i < 12; i++) for (const side of [-1, 1]) placeLion(f, 14 + i * 13, side * (R + 1), -side);
    for (let a = 16; a <= ANITKABIR.road - 4; a += 9) for (const side of [-1, 1]) placeAnitkabirTree(f, a, side * (R + 7));
    // Tören meydanı ve revaklar (holün karşısındaki üç yanda; yol ağzı açık)
    const [pa0, pa1, pb0, pb1] = ANITKABIR.plaza;
    for (let a = pa0; a <= pa1; a++) for (let b = pb0; b <= pb1; b++) f.put(a, -1, b, plazaTile(a, b));
    placeColonnade(f, pa0, pa0 + 4, pb0, -R - 2, [1, 0]);
    placeColonnade(f, pa0, pa0 + 4, R + 2, pb1, [1, 0]);
    placeColonnade(f, pa1 - 4, pa1, pb0, pb1, [-1, 0]);
    placeColonnade(f, pa0, pa1, pb0, pb0 + 4, [0, 1]);
    for (const [a, b] of ANITKABIR_TOWERS) placeTower(f, a, b);
    // Bayrak direği: yarıya inmiş kırmızı bayrak (10 Kasım)
    f.box(pa0 + 9, pa0 + 11, 0, 0, pb0 + 9, pb0 + 11, B.stone);
    for (let h = 1; h <= 22; h++) f.put(pa0 + 10, h, pb0 + 10, B.cobblestone_wall);
    f.box(pa0 + 10, pa0 + 10, 12, 15, pb0 + 11, pb0 + 16, B.brick);
    // Barış Parkı: meydan ve holün çevresinde ladin halkası
    for (let a = 168; a <= 256; a += 8) for (const b of [-46, 122]) placeAnitkabirTree(f, a, b);
    for (let b = -38; b <= 114; b += 8) placeAnitkabirTree(f, 256, b);
    placePodium(f);
    placeHall(f);
  } finally { generatingChunk = false; }
  const keys = new Set();
  for (let a = A0 - S; a <= A1 + S; a += 4) for (let b = BB0 - S; b <= BB1 + S; b += 4) {
    const [x, z] = f.at(a, b);
    keys.add(chunkKey(Math.floor(x / CH), Math.floor(z / CH)));
  }
  for (const [a, b] of [[A1 + S, BB0 - S], [A1 + S, BB1 + S], [A0 - S, BB1 + S]]) { const [x, z] = f.at(a, b); keys.add(chunkKey(Math.floor(x / CH), Math.floor(z / CH))); }
  keys.forEach(k => modifiedChunks.overworld.add(k));
  for (const k of keys) rebuildKey(k);
  const [hx, hz] = f.at(Math.round((ANITKABIR.hall[0] + ANITKABIR.hall[1]) / 2), ANITKABIR.hall[2]);
  return { x: x0, y: y0, z: z0, hall: [hx, y0 + 6, hz] };
}

Object.assign(window.game, { placeAnitkabir, ANITKABIR });
