// ---------- Chunk yükleme ----------
// Sonsuz dünya: oyuncu yürüdükçe çevresindeki chunk'lar üretilir ve çizilir, uzaktakiler kaldırılır.

// Çizim yarıçapı görüş mesafesine bağlı (40 / 70 / 120 / 192 blok -> 3 / 5 / 8 / 12 chunk). Veri bir chunk fazla tutulur ki
// kenar chunk'ların yüzleri doğru çizilsin. Değişmemiş chunk verisi 12 chunk (görüş daha uzaksa yarıçap + 3) ötede bellekten silinir.
const DATA_KEEP_RADIUS = 12;
const viewChunks = () => Math.ceil(VIEW_DISTANCES[settings.viewDistance] / CH);
// Oyuncunun chunk'ından halka halka dışa doğru, test(cx, cz) doğru olan ilk chunk
function nearestChunk(radius, test) {
  const pcx = Math.floor(player.x / CH), pcz = Math.floor(player.z / CH);
  for (let r = 0; r <= radius; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dz)) === r && test(pcx + dx, pcz + dz)) return [pcx + dx, pcz + dz];
  }
  return null;
}
const hasData = (cx, cz) => world.has(chunkKey(cx, cz));
// Mesh, chunk'ın kendisi ve dört komşusunun verisi hazırsa kurulur.
const meshReady = (cx, cz) => !chunkMeshes.has(chunkKey(cx, cz)) && [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => hasData(cx + dx, cz + dz));
let unloadTimer = 0;
// Her karede en çok 1 chunk üretilir ve 2 mesh kurulur.
function updateChunks(dt) {
  const r = viewChunks(), pcx = Math.floor(player.x / CH), pcz = Math.floor(player.z / CH);
  const missing = nearestChunk(r + 1, (cx, cz) => !hasData(cx, cz));
  if (missing) ensureChunk(...missing);
  for (let i = 0; i < 2; i++) {
    const next = nearestChunk(r, meshReady);
    if (!next) break;
    buildChunk(...next);
  }
  const far = (key, limit) => { const [cx, cz] = key.split(',').map(Number); return Math.max(Math.abs(cx - pcx), Math.abs(cz - pcz)) > limit; };
  for (const key of [...chunkMeshes.keys()]) if (far(key, r + 1)) removeChunkMesh(key);
  unloadTimer -= dt;
  if (unloadTimer > 0) return;
  unloadTimer = 2;
  for (const key of [...world.keys()]) if (far(key, Math.max(DATA_KEEP_RADIUS, r + 3)) && !modifiedChunks[dimension].has(key)) world.delete(key);
}
Object.assign(window.game, { villagePlan, villageNear, ensureArea, updateChunks, chunkCount: () => world.size, meshCount: () => chunkMeshes.size, modifiedChunks });
