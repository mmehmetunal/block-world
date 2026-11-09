// Madde 55, aşama 1: sürüm 3 (8 bit chunk'lı) bir kaydı IndexedDB'ye elle yazar
const g = window.game;
const chunk = new Uint8Array(16 * 48 * 16);
chunk.fill(3, 0, 16 * 16 * 30); // 0–29 taş
chunk[(30 * 16 + 5) * 16 + 5] = 60; // (5, 30, 5) ışıltı taşı
const save = {
  version: 3, chunks: { overworld: { '0,0': chunk }, nether: {} }, dimension: 'overworld', portalLinks: {},
  player: { x: 8.5, y: 31, z: 8.5, yaw: 0, pitch: 0 },
};
const db = await new Promise((res, rej) => { const r = indexedDB.open('block-world', 1); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
await new Promise((res, rej) => { const tx = db.transaction('saves', 'readwrite'); tx.objectStore('saves').put(save, 'world1'); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
db.close();
return { ok: true, uint16: g.worlds.overworld.values().next().value instanceof Uint16Array };
