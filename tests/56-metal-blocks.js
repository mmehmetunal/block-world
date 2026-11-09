// Madde 56: demir, altın ve elmas bloğu; 9 külçe/elmas ile üretilir, geri 9'a çözülür, simgeleri metal renginde
const g = window.game, B = g.blocks;
document.getElementById('play').click();
for (let i = 0; i < 100 && !g.player.onGround; i++) await wait(50);
const craft = (key, cells) => {
  g.inventory.fill(null);
  g.addItem(key, cells.length);
  g.openInventory(3);
  g.clickSlot(g.inventory.findIndex(s => s && s.key === key));
  for (const i of cells) g.clickCraft(i, true);
  g.clickResult(); g.clickSlot(0);
  g.closeInventory();
  return { slot: g.inventory[0] };
};
const all = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const iron = craft('iron_ingot', all), diamond = craft('diamond', all), back = craft('iron_block', [4]);
const names = ['iron_block', 'gold_block', 'diamond_block'].map(k => g.items[k].name);
// Simgenin ortasındaki üst yüz pikseli: demir gri, altın sarı, elmas turkuaz
const color = async key => {
  const img = new Image(); img.src = g.itemIcon(key); await img.decode();
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  return [...x.getImageData(32, 14, 1, 1).data].slice(0, 3);
};
g.openPicker();
const inPicker = ['iron_block', 'gold_block', 'diamond_block'].every(k => g.pickerItems().includes(k));
g.closeInventory();
const [ci, cg, cd] = [await color('iron_block'), await color('gold_block'), await color('diamond_block')];
const colors = Math.abs(ci[0] - ci[2]) < 20 && ci[0] > 170 && cg[0] > 200 && cg[2] < 120 && cd[2] > 170 && cd[0] < 140;
const r = {
  ironBlock: iron.slot?.key === 'iron_block' && iron.slot.count === 1,
  diamondBlock: diamond.slot?.key === 'diamond_block' && diamond.slot.count === 1,
  ingots: back.slot?.key === 'iron_ingot' && back.slot.count === 9,
  names: names.join(',') === 'Demir bloğu,Altın bloğu,Elmas bloğu',
  inPicker,
  colors,
};
return { ok: Object.values(r).every(Boolean), ...r, ci, cg, cd };
