// Madde 59: kontrol panelinden (ikinci basışta) Anıtkabir; yol oyuncunun baktığı yönde başlar
const g = window.game, p = g.player, B = g.blocks;
document.getElementById('play').click();
for (let i = 0; i < 100 && !p.onGround; i++) await wait(50);
p.yaw = 0; // kuzeye (-z) bakar: a ileri = -z, b sağ = +x
const q = sel => document.querySelector(sel);
window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK' }));
const btn = q('[data-action="anitkabir"]');
btn.click();
const asked = btn.textContent.includes('Tekrar bas') && g.isControlOpen();
btn.click();
const x0 = Math.floor(p.x), z0 = Math.floor(p.z) - 8, y0 = g.ANITKABIR && (() => { for (let y = 120; y > 0; y--) if (g.getBlock(x0, y, z0 - 20) !== 0) return y + 1; })();
const at = (a, h, b) => g.getBlock(x0 + b, y0 + h, z0 - a);
// 24 aslan: kaide taş, başı merdiven
let lions = 0;
for (let i = 0; i < 12; i++) for (const side of [-1, 1]) if (at(14 + i * 13, 0, side * 7) === B.stone && g.blocks && at(16 + i * 13, 2, side * 7) !== 0) lions++;
const plaza = [3, 8, 82, 12].includes(at(190, -1, 0)) && at(176, -1, 30) !== 0;
const hallA = 204, hall = at(191, 6, 68) === B.sandstone && at(192, 6, 68) === 0 && at(204, 6, 85) === B.nether_brick;
const stairsUp = g.items[Object.keys(B).find(k => B[k] === at(204, 0, 61))]?.name === 'Kumtaşı merdiven';
const flag = at(186, 22, -16) === B.cobblestone_wall && at(186, 13, -14) === B.brick;
const towers = at(8, 11, -17) === B.stone_slab && at(176, 11, 53) === B.stone_slab;
const saved = g.modifiedChunks.overworld.has(`${Math.floor((x0 + 90) / 16)},${Math.floor((z0 - 204) / 16)}`);
const r = { asked, closed: !g.isControlOpen(), lions: lions === 24, plaza, hall, stairsUp, flag, towers, saved };
return { ok: Object.values(r).every(Boolean), ...r, y0, lionCount: lions, hallA };
