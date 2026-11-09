// Madde 54, aşama 1: 256 blok yükseklik; y = 250'ye blok konur ve çizilir. Sonra eski (sürüm 3, 48 blok, 8 bit) bir kayıt yazılır.
const g = window.game;
document.getElementById('play').click();
await wait(300);
g.setBlock(50, 250, 50, 8);
g.rebuild(3, 3);
const high = g.getBlock(50, 250, 50) === 8 && g.getBlock(50, 255, 50) === 0;
// Otomatik kayıt sahte kaydın üstüne yazmasın
resetting = true;
const old = new Uint8Array(16 * 48 * 16);
old[(47 * 16 + 5) * 16 + 5] = 8; // chunk 3,3: (53, 47, 53) tuğla
old[(10 * 16 + 2) * 16 + 2] = 14;
await new Promise((resolve, reject) => {
  const tx = db.transaction(DB_STORE, 'readwrite');
  tx.objectStore(DB_STORE).put({ version: 3, chunks: { overworld: { '3,3': old }, nether: {} }, dimension: 'overworld', portalLinks: {},
    player: { x: 53.5, y: 49, z: 53.5, yaw: 0, pitch: 0 }, health: 20, food: 20, inventory: [], armor: [], selected: 0, time: 0.25, day: 1 }, SAVE_KEY);
  tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
});
return { ok: high, high };
