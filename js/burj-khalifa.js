// ---------- Burj Khalifa ----------
// 1:4 ölçekli Burj Khalifa maketi (828 m = 207 blok): altıgen çekirdek ve üç kanatlı "Y" plan, kanatların sarmal geri çekilmesi,
// 585 m'de biten gövde ve üstünde çelik ibre. Oyuncunun isteğiyle kurulur (game-actions.js: buildBurjKhalifa), dünya üretimine karışmaz.

const BURJ = {
  scale: 4,         // 1 blok = 4 m
  height: 207,      // 828 m
  bodyTop: 146,     // 585 m: gövde bu katmanda biter, üstü ibre (243 m)
  wingReach: 12,    // kanat ucunun merkeze uzaklığı (48 m)
  wingHalf: 3.3,    // kanat yarı genişliği (13 m)
  plaza: 16,        // meydanın yarı genişliği
  floor: 4,         // kat yüksekliği (16 m); her 4. katman tavan
};
// Üç kanat 120° arayla; kanatlar sırayla geri çekilir (24 kademe, 54 m'den 22 m arayla) ve çekirdeğin kendisi iki kez daralır: 26 kademe
const BURJ_WING_ANGLES = [90, 210, 330].map(d => d * Math.PI / 180);
const BURJ_SETBACKS = Array.from({ length: 24 }, (_, i) => Math.round((54 + i * 22) / BURJ.scale));
// h. katmanda w. kanadın kaç kez geri çekildiği
const burjSteps = (w, h) => BURJ_SETBACKS.filter((at, i) => i % 3 === w && at <= h).length;
// Çekirdek altıgeninin çevre yarıçapı
const burjCoreRadius = h => h < 100 ? 3.4 : h < 130 ? 3.0 : 2.6;

// (px, pz) hücresi (merkez hücreye göre), h. katmandaki gövde kesitinin içinde mi
function burjInBody(px, pz, h) {
  const rc = burjCoreRadius(h), ax = Math.abs(px), az = Math.abs(pz);
  if (az <= rc * 0.866 && ax * 0.866 + az * 0.5 <= rc * 0.866) return true;
  for (let w = 0; w < 3; w++) {
    const j = burjSteps(w, h), reach = BURJ.wingReach - 1.3 * j, half = BURJ.wingHalf - 0.3 * j;
    const dx = Math.cos(BURJ_WING_ANGLES[w]), dz = Math.sin(BURJ_WING_ANGLES[w]);
    const along = px * dx + pz * dz, perp = -px * dz + pz * dx;
    if (along < 0 || Math.abs(perp) > half) continue;
    // Düz gövde, ucunda yarım daire burun
    if (along <= reach - half || Math.hypot(along - (reach - half), perp) <= half) return true;
  }
  return false;
}
// İbre: 3×3, sonra artı, sonra tek blok
function burjInSpire(px, pz, h) {
  const up = h - BURJ.bodyTop;
  if (up < 14) return Math.abs(px) <= 1 && Math.abs(pz) <= 1;
  if (up < 24) return Math.abs(px) + Math.abs(pz) <= 1;
  return px === 0 && pz === 0;
}

// Kuleyi (cx, cz) merkezli kurar; ana dünyada etkin olmalı. Dönüş: { x, y, z, height } (y: zemin katın tabanı).
function placeBurjKhalifa(cx, cz) {
  ensureArea(cx, cz, 2);
  const y0 = Math.min(Math.max(heightAt(cx, cz), WATER_LEVEL) + 1, SY - 2 - BURJ.height);
  const R = BURJ.plaza;
  // Çok sayıda blok yazılır: set() sıvı ve kayıt işlerini atlasın (üretim kipi), kayıt işareti sonda toplu konur.
  generatingChunk = true;
  try {
    // Meydan: arazi y0 - 1'e kadar doldurulur ya da kesilir, üstü temizlenir (ağaçlar dahil), yüzü kumtaşı
    for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) {
      const x = cx + dx, z = cz + dz, ground = heightAt(x, z);
      for (let y = Math.max(0, Math.min(ground, y0 - 2)); y <= y0 - 2; y++) set(x, y, z, B.stone);
      set(x, y0 - 1, z, B.sandstone);
      for (let y = y0; y <= Math.max(ground, y0) + 16; y++) set(x, y, z, AIR);
    }
    for (let h = 0; h < BURJ.height; h++) {
      const y = y0 + h, body = h < BURJ.bodyTop;
      for (let dx = -R + 1; dx < R; dx++) for (let dz = -R + 1; dz < R; dz++) {
        if (body ? !burjInBody(dx, dz, h) : !burjInSpire(dx, dz, h)) continue;
        set(cx + dx, y, cz + dz, burjBlock(dx, dz, h));
      }
    }
  } finally { generatingChunk = false; }
  for (let kx = Math.floor((cx - R) / CH); kx <= Math.floor((cx + R) / CH); kx++) {
    for (let kz = Math.floor((cz - R) / CH); kz <= Math.floor((cz + R) / CH); kz++) modifiedChunks.overworld.add(chunkKey(kx, kz));
  }
  rebuildArea(cx, cz, R + CH);
  return { x: cx, y: y0, z: cz, height: BURJ.height };
}
// h. katmandaki gövde hücresinin bloğu: tavan ve teraslar taş, dış kabuk cam, ortada taş çekirdek, geri kalan boş
function burjBlock(dx, dz, h) {
  if (h >= BURJ.bodyTop) return h === BURJ.height - 1 ? B.glowstone : B.stone;
  if (h === BURJ.bodyTop - 1 || h % BURJ.floor === BURJ.floor - 1 || !burjInBody(dx, dz, h + 1)) return B.stone;
  const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ax, az]) => !burjInBody(dx + ax, dz + az, h));
  if (!edge) return Math.abs(dx) <= 1 && Math.abs(dz) <= 1 ? B.stone : AIR;
  // Giriş: zemin katta, ilk kanadın ucunda 3 geniş kapı boşluğu
  if (h < 3 && Math.abs(dx) <= 1 && dz >= BURJ.wingReach - 2) return AIR;
  return B.glass;
}

Object.assign(window.game, { placeBurjKhalifa, BURJ });
