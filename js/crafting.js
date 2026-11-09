// ---------- Üretim ----------
// Üretim ızgarası ve tarifler.

// Izgara her zaman 3x3 dizidir (indeks satır * 3 + sütun); envanterde yalnızca sol üst 2x2 kullanılır.
const craftGrid = new Array(9).fill(null);
let craftSize = 2;
// Şekilli tarifler: desen satırları, harf -> eşya anahtarı. Desen ızgarada kaydırılabilir.
const RECIPES = [
  { pattern: ['L'], keys: { L: 'log' }, out: ['planks', 4] },
  { pattern: ['L'], keys: { L: 'spruce_log' }, out: ['planks', 4] },
  { pattern: ['P', 'P'], keys: { P: 'planks' }, out: ['stick', 4] },
  { pattern: ['PP', 'PP'], keys: { P: 'planks' }, out: ['crafting_table', 1] },
  { pattern: ['C', 'S'], keys: { C: 'coal', S: 'stick' }, out: ['torch', 4] },
  { pattern: ['C', 'S'], keys: { C: 'charcoal', S: 'stick' }, out: ['torch', 4] },
  { pattern: ['CCC', 'C.C', 'CCC'], keys: { C: 'cobble' }, out: ['furnace', 1] },
  { pattern: ['SS', 'SS'], keys: { S: 'sand' }, out: ['sandstone', 1] },
  { pattern: ['WWW', 'PPP'], keys: { W: 'wool', P: 'planks' }, out: ['bed', 1] },
  { pattern: ['PP', 'PP', 'PP'], keys: { P: 'planks' }, out: ['door', 3] },
];
RECIPES.push(
  { pattern: ['PP', '.S', '.S'], keys: { P: 'planks', S: 'stick' }, out: ['wooden_hoe', 1] },
  { pattern: ['WWW'], keys: { W: 'wheat' }, out: ['bread', 1] },
  // Çakmak (basitleştirilmiş): demir külçe ve kömür yan yana ya da üst üste
  { pattern: ['IC'], keys: { I: 'iron_ingot', C: 'coal' }, out: ['flint_and_steel', 1] },
  { pattern: ['DD', 'DD'], keys: { D: 'glowstone_dust' }, out: ['glowstone', 1] },
  { pattern: ['PPP', 'P.P', 'PPP'], keys: { P: 'planks' }, out: ['chest', 1] },
  { pattern: ['I', 'C'], keys: { I: 'iron_ingot', C: 'coal' }, out: ['flint_and_steel', 1] },
);
// Şekilli bloklar ve metal bloklar
for (const [prefix, src] of SHAPE_MATERIALS) {
  const M = BLOCK_ITEM[src];
  RECIPES.push(
    { pattern: ['M..', 'MM.', 'MMM'], keys: { M }, out: [prefix + '_stairs', 4] },
    { pattern: ['..M', '.MM', 'MMM'], keys: { M }, out: [prefix + '_stairs', 4] },
    { pattern: ['MMM'], keys: { M }, out: [prefix + '_slab', 6] },
  );
}
RECIPES.push(
  { pattern: ['PSP', 'PSP'], keys: { P: 'planks', S: 'stick' }, out: ['oak_fence', 3] },
  { pattern: ['NNN', 'NNN'], keys: { N: 'nether_brick' }, out: ['nether_brick_fence', 6] },
  { pattern: ['CCC', 'CCC'], keys: { C: 'cobble' }, out: ['cobblestone_wall', 6] },
  { pattern: ['III', 'III'], keys: { I: 'iron_ingot' }, out: ['iron_bars', 16] },
  { pattern: ['III', 'III', 'III'], keys: { I: 'iron_ingot' }, out: ['iron_block', 1] },
  { pattern: ['B'], keys: { B: 'iron_block' }, out: ['iron_ingot', 9] },
  { pattern: ['DDD', 'DDD', 'DDD'], keys: { D: 'diamond' }, out: ['diamond_block', 1] },
  { pattern: ['B'], keys: { B: 'diamond_block' }, out: ['diamond', 9] },
);
for (const [tierKey, tier] of Object.entries(TOOL_TIERS)) for (const [kindKey, kind] of Object.entries(TOOL_KINDS)) {
  RECIPES.push({ pattern: kind.pattern, keys: { M: tier.material, S: 'stick' }, out: [`${tierKey}_${kindKey}`, 1] });
}
// Izgaradaki dolu hücrelerin sınır kutusunu desenle karşılaştırır.
function craftResult() {
  const cells = [];
  for (let r = 0; r < craftSize; r++) for (let c = 0; c < craftSize; c++) if (craftGrid[r * 3 + c]) cells.push([r, c]);
  if (!cells.length) return null;
  const top = Math.min(...cells.map(([r]) => r)), left = Math.min(...cells.map(([, c]) => c));
  const height = Math.max(...cells.map(([r]) => r)) - top + 1, width = Math.max(...cells.map(([, c]) => c)) - left + 1;
  for (const recipe of RECIPES) {
    const { pattern, keys: map } = recipe;
    if (pattern.length !== height || pattern[0].length !== width) continue;
    let match = true;
    for (let r = 0; r < height && match; r++) for (let c = 0; c < width && match; c++) {
      const want = pattern[r][c] === '.' ? null : map[pattern[r][c]];
      const have = craftGrid[(top + r) * 3 + left + c];
      match = want ? have?.key === want : !have;
    }
    if (match) {
      const [key, count] = recipe.out;
      return ITEMS[key].durability ? { key, count, durability: ITEMS[key].durability } : { key, count };
    }
  }
  return null;
}
const craftSlotEls = [];
for (let i = 0; i < 9; i++) {
  const el = document.createElement('div');
  el.className = 'inv-slot';
  el.innerHTML = '<span class="count"></span><span class="dur"></span>';
  el.addEventListener('mousedown', e => { e.preventDefault(); clickCraft(i, e.button === 2); });
  el.addEventListener('contextmenu', e => e.preventDefault());
  document.getElementById('craft-grid').appendChild(el);
  craftSlotEls[i] = el;
}
const resultEl = document.getElementById('craft-result');
resultEl.addEventListener('mousedown', e => { e.preventDefault(); clickResult(); });
resultEl.addEventListener('contextmenu', e => e.preventDefault());

const clickCraft = (i, right) => clickIn(craftGrid, i, right);
// Sonuç yuvası: elde aynı türden yer varsa ürün eline gelir, ızgaradaki her malzeme 1 azalır.
function clickResult() {
  const result = craftResult();
  if (!result) return;
  if (held && (held.key !== result.key || held.count + result.count > maxStack(result.key))) return;
  held = held ? { key: held.key, count: held.count + result.count } : { ...result };
  for (let i = 0; i < 9; i++) if (craftGrid[i]) { craftGrid[i].count--; if (!craftGrid[i].count) craftGrid[i] = null; }
  renderInventory();
}
