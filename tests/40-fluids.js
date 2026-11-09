// Madde 40: kova, akan su (aşağı ve yanlara, en çok 7), kova geri alınınca çekilme, su + lav kaynağı = obsidyen
const g = window.game, p = g.player;
document.getElementById('play').click();
window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyV' }));
window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyV' }));
for (let i = 0; i < 100 && !p.onGround; i++) await wait(50);
g.clock.time = 0.25;
const recipe = g.recipes.some(r => r.out[0] === 'bucket');
// Düz taş zemin (y 30), üstü boş; ortada 3 blok yüksek bir sütun (tepe)
for (let x = 16; x < 64; x++) for (let z = 16; z < 64; z++) { g.setBlock(x, 30, z, 3); for (let y = 31; y < 47; y++) g.setBlock(x, y, z, 0); }
for (let y = 31; y <= 33; y++) g.setBlock(40, y, 40, 3);
for (let cx = 1; cx <= 3; cx++) for (let cz = 1; cz <= 3; cz++) g.rebuild(cx, cz);
await wait(300);
const flowing = (x, y, z) => { const b = g.getBlock(x, y, z); return b === 17 || (b >= 63 && b <= 69); };
// Bir su kaynağından boş kovayla su al: kaynak zemindeki çukurda, yanlara akamaz (akan suya çarpan nişan kovayı doldurmaz)
g.setBlock(50, 30, 50, 17);
g.inventory.fill(null);
g.inventory[0] = { key: 'bucket', count: 1 };
window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1' }));
const canvas = document.querySelector('#game canvas');
const rightClick = async () => { canvas.dispatchEvent(new MouseEvent('mousedown', { button: 2, bubbles: true })); window.dispatchEvent(new MouseEvent('mouseup', { button: 2 })); await wait(100); };
Object.assign(p, { x: 50.5, y: 31, z: 52.5, yaw: 0, pitch: -0.62, vx: 0, vz: 0 });
await wait(300);
await rightClick();
const filled = g.inventory[0]?.key === 'water_bucket' && g.getBlock(50, 30, 50) === 0;
// Tepenin üstüne dök: tepeye bak
Object.assign(p, { x: 40.5, y: 34, z: 42.5, yaw: 0, pitch: -0.6 });
await wait(300);
await rightClick();
const sources = [];
for (let x = 37; x < 44; x++) for (let z = 37; z < 44; z++) for (let y = 31; y < 37; y++) if (g.getBlock(x, y, z) === 17) sources.push([x, y, z]);
const poured = sources.length === 1 && sources[0][1] >= 33 && g.inventory[0]?.key === 'bucket';
Object.assign(p, { x: 30.5, y: 31, z: 30.5 });
for (let i = 0; i < 80 && g.fluidPending(); i++) await wait(100);
const down = flowing(41, 33, 40) || flowing(40, 33, 41) ? true : flowing(41, 34, 40) && flowing(41, 33, 40);
const reachedGround = flowing(41, 31, 40) || flowing(40, 31, 41) || flowing(39, 31, 40);
// Yerde yanlara yayılır, en çok 7 seviye
let maxDist = 0;
for (let x = 30; x < 52; x++) for (let z = 30; z < 52; z++) if (flowing(x, 31, z)) maxDist = Math.max(maxDist, Math.abs(x - 40) + Math.abs(z - 40));
const spread = maxDist >= 5 && maxDist <= 9;
// Kaynağı kovayla geri al: su çekilir
// Kaynağın ortasına bakarak hemen tıkla (beklerken oyuncu düşmesin)
const [sx, sy, sz] = sources[0];
for (let i = 0; i < 5 && g.inventory[0]?.key !== 'water_bucket'; i++) {
  Object.assign(p, { x: sx + 0.5, y: sy + 2, z: sz + 2.5, vy: 0 });
  const dx = 0, dy = sy + 0.5 - (p.y + 1.62), dz = sz + 0.5 - p.z;
  Object.assign(p, { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) });
  await wait(40);
  await rightClick();
}
const tookBack = g.inventory[0]?.key === 'water_bucket';
Object.assign(p, { x: 30.5, y: 31, z: 30.5 });
for (let i = 0; i < 120 && g.fluidPending(); i++) await wait(100);
let left = 0;
for (let x = 28; x < 54; x++) for (let z = 28; z < 54; z++) for (let y = 31; y < 36; y++) if (flowing(x, y, z)) left++;
const receded = left === 0;
// Su lav kaynağına akınca obsidyen
g.setBlock(20, 31, 20, 59);
g.setBlock(22, 31, 20, 17);
for (let i = 0; i < 60 && g.getBlock(20, 31, 20) === 59; i++) await wait(100);
const obsidian = g.getBlock(20, 31, 20) === 55;
return { ok: recipe && filled && poured && reachedGround && spread && tookBack && receded && obsidian,
  sources, recipe, filled, poured, down, reachedGround, maxDist, spread, tookBack, left, receded, obsidian };
