// Madde 63: şekilli ve metal blok tarifleri; çit 1,5 blok yüksek (üstünden atlanmaz), cam panel değil
const g = window.game, p = g.player;
document.getElementById('play').click();
for (let i = 0; i < 100 && !p.onGround; i++) await wait(50);
const has = out => RECIPES.some(r => r.out[0] === out);
const recipes = ['stone_brick_stairs', 'oak_slab', 'iron_slab', 'oak_fence', 'nether_brick_fence', 'cobblestone_wall', 'iron_bars', 'glass_pane', 'iron_block', 'diamond_block'].every(has);
// Masada 6 tahta -> 6 tahta yarım blok
g.inventory.fill(null);
g.addItem('planks', 3);
g.openInventory(3);
g.clickSlot(g.inventory.findIndex(s => s && s.key === 'planks'));
for (const i of [6, 7, 8]) g.clickCraft(i, true);
g.clickResult(); g.clickSlot(20);
const crafted = g.inventory[20]?.key === 'oak_slab' && g.inventory[20].count === 6;
g.closeInventory();
document.getElementById('play').click();
// Çit duvarına zıplayarak geçilemez; cam panelin üstüne çıkılmaz ama çarpışma 1 blok
for (let x = 30; x < 50; x++) for (let z = 30; z < 50; z++) { g.setBlock(x, 39, z, 3); for (let y = 40; y < 46; y++) g.setBlock(x, y, z, 0); }
for (let x = 30; x < 50; x++) g.setBlock(x, 40, 38, B.oak_fence);
for (let cx = 1; cx <= 3; cx++) for (let cz = 1; cz <= 3; cz++) g.rebuild(cx, cz);
Object.assign(p, { x: 40.5, y: 40, z: 40.5, yaw: 0, pitch: 0, vx: 0, vy: 0, vz: 0 });
await wait(300);
const key = (code, down = true) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code }));
key('KeyW');
for (let i = 0; i < 6; i++) { key('Space'); await wait(250); key('Space', false); await wait(150); }
key('KeyW', false);
const blocked = p.z > 38.6; // çitin direğine dayanır (38,625 + 0,3), geçemez
const tallBox = blockBoxes(B.oak_fence, 40, 40, 38).every(b => b[4] === 1.5) && blockBoxes(B.iron_bars, 40, 40, 38).every(b => b[4] === 1);
return { ok: recipes && crafted && blocked && tallBox, recipes, crafted, blocked, z: +p.z.toFixed(2), tallBox };
