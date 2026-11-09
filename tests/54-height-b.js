// Madde 54, aşama 2: sürüm 3 kaydı 256 yüksekliğe ve 16 bit kimliğe çevrilerek yüklenir
const g = window.game;
const brick = g.getBlock(53, 47, 53) === 8, glass = g.getBlock(50, 10, 50) === 14, above = g.getBlock(53, 48, 53) === 0;
const wide = worlds.overworld.get('3,3') instanceof Uint16Array && worlds.overworld.get('3,3').length === 16 * 256 * 16;
// Yeni kayıt 16 bit kimlik tutabilir
g.setBlock(53, 200, 53, 300);
const big = g.getBlock(53, 200, 53) === 300;
return { ok: brick && glass && above && wide && big, brick, glass, above, wide, big };
