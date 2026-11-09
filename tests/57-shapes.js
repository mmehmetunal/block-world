// Madde 57: şekilli bloklar. Merdiven bakış yönüne döner, üst yarıya tıklanınca ters konur; yarım blok üstüne yarım blok tam blok olur;
// merdivene yürüyerek çıkılır; çit komşusuna bağlanır; eğim, kemer, yuvarlak köşe ve sütun çizilir ve çarpışır.
const g = window.game, p = g.player;
document.getElementById('play').click();
window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyV' }));
window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyV' }));
for (let i = 0; i < 100 && !p.onGround; i++) await wait(50);
for (let x = 30; x < 50; x++) for (let z = 30; z < 50; z++) { g.setBlock(x, 39, z, 3); for (let y = 40; y < 46; y++) g.setBlock(x, y, z, 0); }
for (let cx = 1; cx <= 3; cx++) for (let cz = 1; cz <= 3; cz++) g.rebuild(cx, cz);
const canvas = document.querySelector('#game canvas');
const right = () => { canvas.dispatchEvent(new MouseEvent('mousedown', { button: 2, bubbles: true })); window.dispatchEvent(new MouseEvent('mouseup', { button: 2 })); };
g.inventory.fill(null);
g.addItem('stone_brick_stairs', 10); g.addItem('oak_slab', 10); g.addItem('oak_fence', 10);
window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1' }));
// Kuzeye (-z) bakarak öndeki zemine merdiven: yüksek tarafı kuzeyde
Object.assign(p, { x: 40.5, y: 40, z: 42.5, yaw: 0, pitch: -0.62, vx: 0, vz: 0 });
await wait(400);
right(); await wait(300);
const stairs = BLOCKS[g.getBlock(40, 40, 40)];
const facing = stairs?.family === 'stone_brick_stairs' && stairs.dir[1] === -1 && !stairs.flip;
// Merdivene yürüyerek çık (zıplamadan)
Object.assign(p, { x: 40.5, y: 40, z: 42.5, yaw: 0, pitch: 0 });
window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
for (let i = 0; i < 40 && p.y < 40.9; i++) await wait(50);
window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
const climbed = p.y > 40.9;
// Yarım blok: zemine konur (alt yarı), üstüne bir tane daha konunca tam tahta olur
g.setBlock(40, 40, 40, 0); g.rebuild(2, 2);
Object.assign(p, { x: 40.5, y: 40, z: 42.5, yaw: 0, pitch: -0.62, vx: 0, vz: 0 });
window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit2' }));
await wait(400);
right(); await wait(300);
const slab = BLOCKS[g.getBlock(40, 40, 40)];
const slabOk = slab?.shape === 'slab' && !slab.flip;
Object.assign(p, { z: 41.2, pitch: -0.9 });
await wait(300);
right(); await wait(300);
const merged = g.getBlock(40, 40, 40) === B.planks;
// Çit: yan yana iki çit birbirine bağlanır (doğu kolu var), tek başına yalnızca direk
g.setBlock(36, 40, 36, B.oak_fence); g.setBlock(37, 40, 36, B.oak_fence); g.setBlock(36, 40, 34, B.oak_fence);
const linked = g.shapeGeometry(B.oak_fence, 36, 40, 36).boxes.length === 3 && g.shapeGeometry(B.oak_fence, 36, 40, 34).boxes.length === 1;
// Bütün şekiller geometri üretir ve çarpışma kutusu verir; chunk hatasız kurulur
const shapes = ['stairs', 'slab', 'slope', 'arch', 'corner', 'pillar'].map(s => B['bronze_' + s]);
shapes.forEach((id, i) => g.setBlock(32 + i * 2, 40, 32, id));
g.setBlock(44, 40, 32, B.iron_bars); g.setBlock(45, 40, 32, B.cobblestone_wall);
g.rebuild(2, 2);
const geometry = shapes.every(id => { const s = g.shapeGeometry(id, 0, 0, 0); return s.polys.length > 3 && s.boxes.length > 0; });
// Eğime yukarıdan düşen oyuncu tam blok yüksekliğinde değil, eğimin üstünde durur
Object.assign(p, { x: 36.2, y: 43, z: 32.5, vx: 0, vy: 0, vz: 0, onGround: false });
await wait(200);
for (let i = 0; i < 40 && !p.onGround; i++) await wait(50);
const onSlope = p.onGround && p.y > 40 && p.y < 41;
return { ok: facing && climbed && slabOk && merged && linked && geometry && onSlope, facing, climbed, y: +p.y.toFixed(2), slabOk, merged, linked, geometry, onSlope };
