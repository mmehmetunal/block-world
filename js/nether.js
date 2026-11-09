// ---------- Nether ----------
// İkinci dünya: kızıl taş tavan ve taban, aralarında 3B gürültüyle oyulmuş boşluklar, alçak yerlerde lav denizi,
// tavanda ışıltı taşı öbekleri. Chunk'lar ana dünya gibi yürüdükçe üretilir. Portaldan geçince etkin dünya (world) değişir.

const NETHER_SKY = 0x3a0f0f, NETHER_FOG_NEAR = 12, NETHER_FOG_FAR = 40, NETHER_BRIGHTNESS = 0.6;
// Lav denizi y ≤ LAVA_LEVEL (yüksekliğin yaklaşık dörtte biri)
const LAVA_LEVEL = 10, LAVA_DAMAGE = 4, BURN_TIME = 3;
let dimension = 'overworld';
// Her dünyadaki portalın iç tabanının sol hücresi ve ekseni: { x, y, z, axis }
const portalLinks = { overworld: null, nether: null };

// Nether chunk'ı: kızıl taş taban ve tavan, aradaki boşlukta kayalar, alçak yerlerde lav denizi, tavandan sarkan ışıltı taşı.
function generateNetherChunk(cx, cz) {
  const x0 = cx * CH, z0 = cz * CH;
  for (let lz = 0; lz < CH; lz++) for (let lx = 0; lx < CH; lx++) {
    const x = x0 + lx, z = z0 + lz;
    const floorTop = 3 + Math.floor(fbm(x / 20 + 500, z / 20 + 500) * 12);
    const ceilingBottom = 35 + Math.floor(fbm(x / 18 + 900, z / 18 + 900) * 8);
    for (let y = 0; y < NETHER_H; y++) {
      let b = AIR;
      if (y <= floorTop || y >= ceilingBottom) b = B.netherrack;
      // Boşluğun içinde kızıl taş sütunlar ve kayalar
      else if (valueNoise3(x / 10 + 200, y / 8, z / 10 + 200) > 0.7) b = B.netherrack;
      else if (y <= LAVA_LEVEL) b = B.lava;
      set(x, y, z, b);
    }
  }
  // Tavandan sarkan 1–2 ışıltı taşı öbeği (chunk içinde kalır)
  const nr = chunkRandom(cx, cz, 101);
  const clusters = nr() < 0.25 ? 2 : 1;
  for (let i = 0; i < clusters; i++) {
    let x = x0 + Math.floor(nr() * CH), z = z0 + Math.floor(nr() * CH), y = NETHER_H - 2;
    while (y > 12 && get(x, y, z) !== AIR) y--;
    if (y <= 12 || get(x, y + 1, z) !== B.netherrack) continue;
    const size = 3 + Math.floor(nr() * 6);
    for (let k = 0; k < size; k++) {
      if (get(x, y, z) === AIR) set(x, y, z, B.glowstone);
      const step = Math.floor(nr() * 3), dir = nr() < 0.5 ? 1 : -1;
      if (step === 0) y--;
      else if (step === 1) x = Math.max(x0, Math.min(x0 + CH - 1, x + dir));
      else z = Math.max(z0, Math.min(z0 + CH - 1, z + dir));
    }
  }
  placeFortressParts(cx, cz);
}

// Etkin dünyayı değiştirir: canlılar, yerdeki eşyalar, oklar ve parçacıklar temizlenir, chunk'lar yeniden kurulur.
function switchDimension(to) {
  dimension = to;
  world = worlds[to];
  clearFluids();
  for (const m of [...mobs]) removeMob(m);
  for (const d of [...drops]) removeDrop(d);
  for (const a of projectiles) scene.remove(a.mesh);
  projectiles.length = 0;
  for (const d of [...debris]) removeDebris(d);
  for (const pt of particles) scene.remove(pt.mesh);
  particles.length = 0;
  clearChunkMeshes();
  buildAround(player.x, player.z, 2);
  rebuildPortalMeshes();
  scanCrops();
  if (to === 'overworld') spawnInitialAnimals();
}

// Oyuncunun içinde durduğu portalın iç tabanının sol hücresi
function enteredPortal() {
  let x = Math.floor(player.x), y = Math.floor(player.y + 0.5), z = Math.floor(player.z);
  if (!isPortal(get(x, y, z))) {
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (isPortal(get(x + dx, y, z + dz))) { x += dx; z += dz; break; }
  }
  const axis = get(x, y, z) === B.portal_z ? 'z' : 'x';
  while (isPortal(get(x, y - 1, z))) y--;
  if (axis === 'x') { while (isPortal(get(x - 1, y, z))) x--; } else { while (isPortal(get(x, y, z - 1))) z--; }
  return { x, y, z, axis };
}
// (x, y, z) iç tabanın sol hücresi olarak, x ekseninde bir portal için yer uygun mu: 4x5 çerçeve düzlemi ve önü-arkası boş, altı katı
function portalSpotFree(x, y, z) {
  for (let i = -1; i <= 2; i++) for (let dz = -1; dz <= 1; dz++) {
    if (!isSolid(get(x + i, y - 1, z + dz))) return false;
    for (let dy = 0; dy <= 3; dy++) if (get(x + i, y + dy, z + dz) !== AIR) return false;
  }
  return inBounds(x - 1, y + 3, z - 1) && inBounds(x + 2, y + 3, z + 1);
}
// Etkin dünyada (x0, z0) yakınında uygun bir yere x ekseninde yanık bir portal kurar; bulamazsa yer açar.
function createPortalNear(x0, z0) {
  let spot = null;
  ensureArea(x0, z0, 2);
  for (let r = 0; r <= 16 && !spot; r++) {
    for (let dx = -r; dx <= r && !spot; dx++) for (let dz = -r; dz <= r && !spot; dz++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
      const x = x0 + dx, z = z0 + dz;
      const ys = dimension === 'nether' ? Array.from({ length: 24 }, (_, i) => 11 + i) : [surfaceY(x, z)];
      for (const y of ys) if (portalSpotFree(x, y, z)) { spot = { x, y, z }; break; }
    }
  }
  if (!spot) {
    // Yer yoksa açılır: 4x5x3 boşluk ve altına 4x3 zemin (lavın üstünde bile durulabilsin)
    const x = x0, z = z0, y = dimension === 'nether' ? 20 : surfaceY(x, z);
    for (let i = -1; i <= 2; i++) for (let dz = -1; dz <= 1; dz++) {
      set(x + i, y - 1, z + dz, dimension === 'nether' ? B.netherrack : B.cobble);
      for (let dy = 0; dy <= 3; dy++) set(x + i, y + dy, z + dz, AIR);
    }
    spot = { x, y, z };
  }
  const { x, y, z } = spot;
  for (let i = -1; i <= 2; i++) { set(x + i, y - 1, z, B.obsidian); set(x + i, y + 3, z, B.obsidian); }
  for (let dy = 0; dy < 3; dy++) {
    set(x - 1, y + dy, z, B.obsidian);
    set(x + 2, y + dy, z, B.obsidian);
    set(x, y + dy, z, B.portal_x);
    set(x + 1, y + dy, z, B.portal_x);
  }
  rebuildArea(x, z, 3);
  rebuildPortalMeshes();
  return { x, y, z, axis: 'x' };
}
// Portaldan geçiş: girilen portal hatırlanır; hedef dünyada bağlı portal varsa oraya, yoksa aynı X/Z yakınına yeni bir portal kurulur.
function travelThroughPortal() {
  const from = dimension, to = from === 'overworld' ? 'nether' : 'overworld';
  portalLinks[from] = enteredPortal();
  switchDimension(to);
  let target = portalLinks[to];
  if (!target || !isPortal(get(target.x, target.y, target.z))) {
    target = createPortalNear(portalLinks[from].x, portalLinks[from].z);
    portalLinks[to] = target;
  }
  // Portalın önüne (iç tabanın önündeki hücre)
  const front = target.axis === 'x' ? { x: target.x + 1, z: target.z + 1.5 } : { x: target.x + 1.5, z: target.z + 1 };
  Object.assign(player, front, { y: target.y, vx: 0, vy: 0, vz: 0, kx: 0, kz: 0, fallPeak: null });
  buildAround(player.x, player.z, 2);
  toast(to === 'nether' ? "Nether'e geçtin" : 'Dünyaya döndün');
  saveGame();
}

// Lav: içinde saniyede 4 hasar; çıkınca 3 sn daha yanar (saniyede 1).
let burnTimer = 0, lavaHitTimer = 0;
function updateLava(dt, inLava) {
  lavaHitTimer -= dt;
  if (inLava) {
    burnTimer = BURN_TIME;
    if (lavaHitTimer <= 0) { lavaHitTimer = 1; damagePlayer(LAVA_DAMAGE); }
  } else if (burnTimer > 0) {
    burnTimer -= dt;
    if (lavaHitTimer <= 0) { lavaHitTimer = 1; damagePlayer(1); }
  }
}

Object.assign(window.game, { worlds, switchDimension, portalLinks, getDimension: () => dimension, createPortalNear, useBed, recipes: RECIPES });
