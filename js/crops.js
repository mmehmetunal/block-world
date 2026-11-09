// ---------- Ekinler ----------
// Ekinlerin büyümesi.

// Her ekin, ortalama 60 sn'de bir sonraki aşamaya geçer (oyun oynanırken). Aşama dünya dizisinde durur, kayda girer.
const CROP_STAGE_TIME = 60;
const crops = new Map(); // "x,y,z" -> sonraki aşamaya kalan sn
const nextStageTime = () => CROP_STAGE_TIME * (0.6 + Math.random() * 0.8);
function plantCrop(x, y, z) { crops.set(x + ',' + y + ',' + z, nextStageTime()); }
// Yüklenen dünyadaki olgunlaşmamış ekinleri bulur (ekin yalnızca oyuncunun değiştirdiği chunk'larda olabilir)
function scanCrops() {
  crops.clear();
  forEachModifiedCell(b => isCrop(b) && b !== B.wheat_3, plantCrop);
}
// Etkin dünyanın değiştirilmiş chunk'larında test(b) doğru olan her hücre için fn(x, y, z, b)
function forEachModifiedCell(test, fn) {
  for (const key of modifiedChunks[dimension]) {
    const c = world.get(key);
    if (!c) continue;
    const [cx, cz] = key.split(',').map(Number);
    for (let i = 0, end = (chunkTop(c) + 1) * CH * CH; i < end; i++) {
      if (!test(c[i])) continue;
      fn(cx * CH + i % CH, Math.floor(i / (CH * CH)), cz * CH + Math.floor(i / CH) % CH, c[i]);
    }
  }
}
function updateCrops(dt) {
  for (const [key, left] of crops) {
    if (left - dt > 0) { crops.set(key, left - dt); continue; }
    const [x, y, z] = key.split(',').map(Number);
    const b = get(x, y, z);
    if (!isCrop(b) || b === B.wheat_3) { crops.delete(key); continue; }
    set(x, y, z, b + 1);
    rebuildAround(x, z);
    if (b + 1 === B.wheat_3) crops.delete(key); else crops.set(key, nextStageTime());
  }
}
