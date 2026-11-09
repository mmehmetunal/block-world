// Madde 56: yapı küpleri (metal, taş, ahşap, 16 renk beton/yün/cam); 255'ten büyük kimlikler, simgeler, eşya seçici, lamba ışığı
const g = window.game;
document.getElementById('play').click();
await wait(300);
const keys = ['iron_block', 'gold_block', 'bronze_block', 'iron_truss', 'stone_bricks', 'quartz_block', 'spruce_planks', 'white_concrete', 'black_wool', 'red_stained_glass', 'sea_lantern', 'lamp'];
const known = keys.every(k => g.items[k] && g.items[k].block > 83);
const manyIds = BLOCKS.length > 300;
// Eşya seçicide görünür, gizli şekil türevleri görünmez
g.openPicker();
const picker = g.pickerItems();
const inPicker = keys.every(k => picker.includes(k)) && !picker.some(k => /_\d\d$/.test(k));
g.closeInventory();
document.getElementById('play').click();
// 255'ten büyük kimlikli blok konur, kaydedilir ve çizilir
const highId = B.black_concrete_pillar || BLOCKS.length - 1;
for (let x = 40; x < 46; x++) for (let z = 40; z < 46; z++) g.setBlock(x, 50, z, B.iron_block);
g.setBlock(41, 51, 41, highId);
g.rebuild(2, 2);
const stored = g.getBlock(41, 51, 41) === highId && highId > 255;
// Simge: küp ve şekilli blok için boş olmayan resim
const icon = g.itemIcon('iron_block'), shapeIconUrl = g.itemIcon('stone_brick_stairs');
const icons = icon.length > 500 && shapeIconUrl.length > 500;
// Lamba çevresini aydınlatır
g.setBlock(43, 51, 43, B.lamp);
const lit = g.torchLight(43.5, 52, 45.5) > 0.5;
return { ok: known && manyIds && inPicker && stored && icons && lit, known, manyIds, count: BLOCKS.length, inPicker, stored, highId, icons, lit };
