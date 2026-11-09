// Madde 57: merdiven, yarım blok, çit, duvar ve demir parmaklık
const g = window.game, p = g.player, B = g.blocks;
document.getElementById('play').click();
window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyV' }));
window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyV' }));
for (let i = 0; i < 100 && !p.onGround; i++) await wait(50);
g.clock.time = 0.25;
// Üretim: 6 kırık taş -> 4 merdiven
g.inventory.fill(null);
g.addItem('cobble', 6);
g.openInventory(3);
g.clickSlot(g.inventory.findIndex(s => s && s.key === 'cobble'));
for (const i of [0, 3, 4, 6, 7, 8]) g.clickCraft(i, true);
g.clickResult(); g.clickSlot(0);
g.closeInventory();
const crafted = g.inventory[0]?.key === 'cobblestone_stairs' && g.inventory[0].count === 4;
g.openPicker();
const pickerOk = ['oak_stairs', 'stone_slab', 'oak_fence', 'cobblestone_wall', 'iron_bars'].every(k => g.pickerItems().includes(k)) && !g.pickerItems().includes('oak_stairs_north_top');
g.closeInventory();
// Düz taş zemin, üstü boş
for (let x = 30; x < 50; x++) for (let z = 30; z < 50; z++) { g.setBlock(x, 39, z, 3); for (let y = 40; y < 46; y++) g.setBlock(x, y, z, 0); }
for (let cx = 1; cx <= 3; cx++) for (let cz = 1; cz <= 3; cz++) g.rebuild(cx, cz);
const canvas = document.querySelector('#game canvas');
const right = () => { canvas.dispatchEvent(new MouseEvent('mousedown', { button: 2, bubbles: true })); window.dispatchEvent(new MouseEvent('mouseup', { button: 2 })); };
window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1' }));
// Kuzeye (-z) bakarak zemine konan merdiven kuzeye bakar ve alttadır
Object.assign(p, { x: 40.5, y: 40, z: 42.5, yaw: 0, pitch: -0.62, vx: 0, vz: 0 });
await wait(400);
right();
await wait(300);
const placed = g.getBlock(40, 40, 40) === g.shapeVariants.cobblestone_stairs.north_bottom;
// Doğuya bakınca, ters: çeşit seçimi
p.yaw = -Math.PI / 2;
const east = g.shapeVariant(B.oak_stairs, false) === g.shapeVariants.oak_stairs.east_bottom && g.shapeVariant(B.oak_stairs, true) === g.shapeVariants.oak_stairs.east_top;
const slabTop = g.shapeVariant(B.stone_slab, true) === B.stone_slab_top;
// Kutular: alt yarım blok 0,5 yüksek; merdiven iki kutu; çit komşusuna bağlanınca kol ekler
const slabBox = JSON.stringify(g.shapeBoxes(B.stone_slab, 0, 0, 0, false)) === '[[0,0,0,1,0.5,1]]';
const stairBoxes = g.shapeBoxes(g.getBlock(40, 40, 40), 40, 40, 40, false).length === 2;
g.setBlock(44, 40, 44, B.oak_fence);
const alone = g.shapeBoxes(B.oak_fence, 44, 40, 44, false).length;
g.setBlock(45, 40, 44, B.oak_fence);
const linked = g.shapeBoxes(B.oak_fence, 44, 40, 44, false).length;
const fenceTall = Math.max(...g.shapeBoxes(B.oak_fence, 44, 40, 44, true).map(b => b[4])) === 1.5;
// Yarım bloğa zıplamadan çıkılır: güneyden kuzeye yürü, önde bir sıra yarım blok
for (let x = 36; x <= 38; x++) g.setBlock(x, 40, 36, B.stone_slab);
g.rebuild(2, 2);
const walk = async (ms, code = 'KeyW') => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code }));
  await wait(ms);
  window.dispatchEvent(new KeyboardEvent('keyup', { code }));
};
Object.assign(p, { x: 37.5, y: 40, z: 38.5, yaw: 0, pitch: 0, vx: 0, vz: 0 });
for (let i = 0; i < 40 && !p.onGround; i++) await wait(50);
// Yürürken en yüksek y ve zıplanmadığı (dikey hız hep küçük) izlenir
let peakY = p.y, maxVy = 0;
window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
for (let i = 0; i < 24; i++) { await wait(50); peakY = Math.max(peakY, p.y); maxVy = Math.max(maxVy, p.vy); }
window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
const steppedUp = p.z < 36.8 && peakY > 40.45 && maxVy < 1;
// Çite (1,5 blok) yürüyerek de zıplayarak da çıkılmaz
for (let x = 30; x < 36; x++) g.setBlock(x, 40, 33, B.oak_fence);
g.rebuild(1, 2); g.rebuild(2, 2);
Object.assign(p, { x: 32.5, y: 40, z: 35.5, yaw: 0, pitch: 0, vx: 0, vz: 0 });
for (let i = 0; i < 40 && !p.onGround; i++) await wait(50);
window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
for (let i = 0; i < 6; i++) { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })); await wait(200); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' })); }
window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
const fenceBlocks = p.z > 33.9;
// Kırılan merdiven grubun eşyasını düşürür
g.inventory.fill(null);
const def = g.blocks && window.game.items.cobblestone_stairs;
const r = { crafted, pickerOk, placed, east, slabTop, slabBox, stairBoxes, alone: alone === 1, linked: linked === 3, fenceTall, steppedUp, fenceBlocks, named: def.name === 'Kırık taş merdiven' };
return { ok: Object.values(r).every(Boolean), ...r, peakY: +peakY.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2) };
