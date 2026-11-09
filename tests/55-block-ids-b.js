// Madde 55, aşama 2: eski kayıt 16 bit chunk'a çevrilip açılır; 255'ten büyük kimlik saklanabilir ve kayda girer
const g = window.game, B = g.blocks;
const c = g.worlds.overworld.get('0,0');
const loaded = document.getElementById('save-note').textContent.startsWith('Kayıt yüklendi') && c instanceof Uint16Array && g.getBlock(5, 30, 5) === 60 && g.getBlock(5, 29, 5) === 3;
document.getElementById('play').click();
// Ham dizide 8 bitin taşacağı bir değer (kimlik tablosu dışında, yalnızca saklama denemesi; çizilmez)
c[(200 * 16 + 1) * 16 + 1] = 300;
const holds = c[(200 * 16 + 1) * 16 + 1] === 300;
c[(200 * 16 + 1) * 16 + 1] = 0;
// En büyük blok kimliği 8 biti aşmasa da şekilli bloklar 86'nın üstünde
g.setBlock(6, 30, 5, B.iron_bars);
g.setBlock(7, 30, 5, B.oak_stairs_north_top);
g.saveGame();
await wait(500);
const maxId = Math.max(...Object.values(B));
return { ok: loaded && holds && !document.getElementById('saved').hidden, loaded, holds, maxId };
