// ---------- Kayıt ----------
// IndexedDB kaydı: kaydetme, yükleme, yeni dünya.

// Tarayıcının IndexedDB'sine tek bir kayıt yazılır. Açılamazsa oyun kayıtsız çalışır.
const DB_NAME = 'block-world', DB_STORE = 'saves', SAVE_KEY = 'world1', SAVE_VERSION = 4, AUTOSAVE_MS = 30000;
const playButton = document.getElementById('play');
const resetButton = document.getElementById('reset');
const saveNote = document.getElementById('save-note');
const savedEl = document.getElementById('saved');
let db = null, resetting = false, confirmReset = false, savedTimer;

function openDb() {
  const open = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  // Bazı ortamlarda istek hiç yanıt vermez; oyunu bekletme.
  return Promise.race([open, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))]);
}
function readSave() {
  return new Promise((resolve, reject) => {
    const req = db.transaction(DB_STORE).objectStore(DB_STORE).get(SAVE_KEY);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function saveGame() {
  if (!db || resetting) return;
  try {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put({
      version: SAVE_VERSION,
      // Yalnızca oyuncunun değiştirdiği chunk'lar: { overworld: { "cx,cz": Uint16Array }, nether: { … } }
      chunks: Object.fromEntries(['overworld', 'nether'].map(d => [d, Object.fromEntries([...modifiedChunks[d]].filter(k => worlds[d].has(k)).map(k => [k, trimChunk(worlds[d].get(k))]))])),
      dimension,
      portalLinks,
      player: { x: player.x, y: player.y, z: player.z, yaw: player.yaw, pitch: player.pitch },
      health: player.health,
      food: player.food,
      furnaces: Object.values(furnaces).map(f => ({ ...f, slots: f.slots.map(st => st && { ...st }) })),
      chests: Object.values(chests).map(c => ({ ...c, slots: c.slots.map(st => st && { ...st }) })),
      spawnPoint,
      safeMode,
      guideStep,
      flyAllowed,
      selected,
      inventory: inventory.map(s => s && { key: s.key, count: s.count, ...extraOf(s) }),
      armor: armor.map(s => s && { key: s.key, count: 1, ...extraOf(s) }),
      time: clock.time,
      day: clock.day,
    }, SAVE_KEY);
    tx.oncomplete = () => {
      savedEl.hidden = false;
      clearTimeout(savedTimer);
      savedTimer = setTimeout(() => { savedEl.hidden = true; }, 1000);
    };
  } catch (err) { /* kayıt yapılamazsa oyun sürer */ }
}
// Sürüm 1–3 kayıtları 48 blok yüksekliğinde ve 8 bit blok kimlikliydi; sürüm 4 chunk'ları kırpılmıştır. Hücre indeksi (y * CH + lz) * CH + lx olduğundan
// eski chunk dizisi yeni dizinin başına olduğu gibi kopyalanır; üstü hava kalır.
const LEGACY_HEIGHT = 48;
// Kayıtta chunk'ın boş üst katmanları atılır (katmanlar y sırasıyla dizildiğinden dizi bir önektir); yüklerken tam boya tamamlanır.
const upgradeChunk = data => { const c = new Uint16Array(CH * SY * CH); c.set(data.subarray(0, c.length)); return c; };
const trimChunk = c => c.slice(0, chunkTop(c) * CH * CH);
// Sürüm 1–2 kayıtlarındaki 96×96×48 tek dizi: indeks (y * 96 + z) * 96 + x. Chunk'lara bölünür, hepsi değiştirilmiş sayılır.
const LEGACY_SIZE = 96;
function loadLegacyWorld(data, dim) {
  for (let cz = 0; cz < LEGACY_SIZE / CH; cz++) for (let cx = 0; cx < LEGACY_SIZE / CH; cx++) {
    const c = new Uint16Array(CH * SY * CH);
    for (let y = 0; y < LEGACY_HEIGHT; y++) for (let lz = 0; lz < CH; lz++) for (let lx = 0; lx < CH; lx++) {
      c[(y * CH + lz) * CH + lx] = data[(y * LEGACY_SIZE + cz * CH + lz) * LEGACY_SIZE + cx * CH + lx];
    }
    worlds[dim].set(chunkKey(cx, cz), c);
    modifiedChunks[dim].add(chunkKey(cx, cz));
  }
}
function applySave(save) {
  if (save.version >= 3) {
    for (const dim of ['overworld', 'nether']) for (const [key, data] of Object.entries(save.chunks?.[dim] || {})) {
      worlds[dim].set(key, upgradeChunk(data));
      modifiedChunks[dim].add(key);
    }
  } else {
    loadLegacyWorld(save.world, 'overworld');
    // Sürüm 1 kayıtlarında Nether yok: yeni üretilir
    if (save.nether?.length === LEGACY_SIZE * LEGACY_HEIGHT * LEGACY_SIZE) loadLegacyWorld(save.nether, 'nether');
  }
  dimension = save.dimension === 'nether' ? 'nether' : 'overworld';
  world = worlds[dimension];
  Object.assign(portalLinks, save.portalLinks || {});
  Object.assign(player, save.player, { vx: 0, vy: 0, vz: 0, kx: 0, kz: 0, fallPeak: null });
  clearChunkMeshes();
  buildAround(player.x, player.z, 2);
  player.health = save.health > 0 ? save.health : MAX_HEALTH;
  player.food = save.food ?? MAX_FOOD;
  for (const f of save.furnaces || []) furnaces[(f.dim || 'overworld') + ':' + f.x + ',' + f.y + ',' + f.z] = { dim: 'overworld', ...f };
  // Bilinmeyen eşya anahtarları (eski kayıt) atlanır.
  for (const c of save.chests || []) chests[c.dim + ':' + c.x + ',' + c.y + ',' + c.z] = { ...c, slots: c.slots.map(st => st && ITEMS[st.key] ? st : null) };
  spawnPoint = save.spawnPoint || null;
  setSafeMode(!!save.safeMode);
  guideStep = save.guideStep || 0;
  setFlyAllowed(!!save.flyAllowed);
  scanCrops();
  rebuildPortalMeshes();
  renderHearts();
  renderFood();
  // Bilinmeyen eşya anahtarları (eski kayıt) atlanır.
  (save.inventory || []).forEach((s, i) => { inventory[i] = s && ITEMS[s.key] ? { key: s.key, count: s.count, ...extraOf(s) } : null; });
  (save.armor || []).forEach((s, i) => { armor[i] = s && ITEMS[s.key] ? { ...s } : null; });
  renderInventory();
  selectSlot(save.selected);
  clock.time = save.time;
  clock.day = save.day;
}
async function loadGame() {
  try {
    db = await openDb();
    const save = await readSave();
    const valid = save && ([3, SAVE_VERSION].includes(save.version) || ([1, 2].includes(save.version) && save.world?.length === LEGACY_SIZE * LEGACY_HEIGHT * LEGACY_SIZE));
    if (valid) applySave(save);
    saveNote.textContent = valid ? 'Kayıt yüklendi. Oyun otomatik kaydedilir.' : 'Oyun otomatik kaydedilir.';
  } catch (err) {
    db = null;
    saveNote.textContent = 'Kayıt yapılamıyor: bu tarayıcı veri saklamaya izin vermiyor.';
    resetButton.hidden = true;
  }
  // Canlılar kaydedilmez; dünya yüklendikten sonra yeniden doğar.
  if (dimension === 'overworld') spawnInitialAnimals();
  if (db) await loadSettings();
  applySettings();
  playButton.disabled = false;
  window.game.ready = true;
}

resetButton.addEventListener('click', () => {
  if (!confirmReset) {
    confirmReset = true;
    resetButton.textContent = 'Emin misin? Tekrar bas';
    return;
  }
  resetting = true;
  const tx = db.transaction(DB_STORE, 'readwrite');
  tx.objectStore(DB_STORE).delete(SAVE_KEY);
  tx.oncomplete = tx.onerror = () => location.reload();
});
setInterval(() => { if (playing) saveGame(); }, AUTOSAVE_MS);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
window.addEventListener('pagehide', saveGame);
Object.assign(window.game, { getBlock: get, setBlock: set, saveGame, biomeAt, temp: temperatureAt, hum: humidityAt });
