// ---------- Blok şekilleri ----------
// Merdiven, yarım blok, çit, duvar ve demir parmaklık: hücre içinde birkaç kutudan oluşan bloklar (model: 'shape').

// Kutular hücre koordinatındadır: [x0, y0, z0, x1, y1, z1]. Çeşitler BLOCKS'un sonuna eklenir (kimlik 87'den başlar).
// Her şekil grubunun (eşya anahtarı) çeşitleri: SHAPE_VARIANTS[grup][çeşit] = blok kimliği
const SHAPE_VARIANTS = {};
// Eşyanın kendisi olan çeşit görünür, diğerleri gizlidir; hepsi kırılınca grubun eşyasını düşürür.
function addShapeBlock(key, group, variant, def) {
  B[key] = BLOCKS.length;
  BLOCKS.push({ model: 'shape', transparent: true, group, drop: group, hidden: key !== group, ...def });
  (SHAPE_VARIANTS[group] ||= {})[variant] = B[key];
}
// Kaynak bloğun dokusu ve kırılma bilgileri (düşen eşya şekildir)
const shapeMaterial = src => {
  const { top, side, bottom, breakTime, tool, needsTool, minTier } = BLOCKS[src];
  return { top, side, bottom, breakTime, tool, needsTool, minTier };
};
const SLAB_BOXES = { bottom: [0, 0, 0, 1, 0.5, 1], top: [0, 0.5, 0, 1, 1, 1] };
// Merdiven: yarım blok + yüksek arka yarı. dir arka yarının yönü (konarken oyuncunun baktığı yön), half 'top' ters merdiven.
function stairBoxes([dx, dz], half) {
  const low = half === 'bottom';
  const back = [dx === 1 ? 0.5 : 0, low ? 0.5 : 0, dz === 1 ? 0.5 : 0, dx === -1 ? 0.5 : 1, low ? 1 : 0.5, dz === -1 ? 0.5 : 1];
  return [SLAB_BOXES[half], back];
}
// Merdiven ve yarım blok yapılan malzemeler: [anahtar öneki, kaynak blok]
const SHAPE_MATERIALS = [['oak', B.planks], ['cobblestone', B.cobble], ['stone', B.stone], ['brick', B.brick], ['sandstone', B.sandstone], ['nether_brick', B.nether_brick]];
for (const [prefix, src] of SHAPE_MATERIALS) {
  const mat = shapeMaterial(src), name = BLOCKS[src].name;
  // Eşyanın kendisi batıya bakan alt merdiven (simgede basamak görünür)
  for (const [dirName, dir] of BED_DIRS) for (const half of ['bottom', 'top']) {
    const group = prefix + '_stairs', key = dirName === 'west' && half === 'bottom' ? group : `${group}_${dirName}_${half}`;
    addShapeBlock(key, group, dirName + '_' + half, { name: name + ' merdiven', ...mat, shape: 'stairs', dir, half, boxes: stairBoxes(dir, half) });
  }
  for (const half of ['bottom', 'top']) {
    const group = prefix + '_slab';
    addShapeBlock(half === 'bottom' ? group : group + '_top', group, half, { name: name + ' yarım blok', ...mat, shape: 'slab', half, boxes: [SLAB_BOXES[half]] });
  }
}
// Komşusuna bağlanan bloklar: aynı şekle ya da tam bir küpe değen yana kol uzatır. tall: çarpışma kutusu 1,5 blok (üstünden atlanmaz).
addShapeBlock('oak_fence', 'oak_fence', 'post', { name: 'Tahta çit', ...shapeMaterial(B.planks), shape: 'fence', tall: true });
addShapeBlock('nether_brick_fence', 'nether_brick_fence', 'post', { name: 'Nether tuğlası çit', ...shapeMaterial(B.nether_brick), shape: 'fence', tall: true });
addShapeBlock('cobblestone_wall', 'cobblestone_wall', 'post', { name: 'Kırık taş duvar', ...shapeMaterial(B.cobble), shape: 'wall', tall: true });
addShapeBlock('iron_bars', 'iron_bars', 'post', {
  name: 'Demir parmaklık', top: TILE.ironBlock, side: TILE.ironBars, bottom: TILE.ironBlock, breakTime: 25, tool: 'pickaxe', needsTool: true, cutout: true, shape: 'bars',
});
// post: direğin yarı genişliği, arm: kolun yarı genişliği, rails: kolun dikey aralıkları (çitte iki kiriş)
const CONNECT_SHAPES = {
  fence: { post: 2 / 16, arm: 1 / 16, rails: [[6 / 16, 9 / 16], [12 / 16, 15 / 16]] },
  wall: { post: 4 / 16, arm: 3 / 16, rails: [[0, 14 / 16]] },
  bars: { post: 1 / 16, arm: 1 / 16, rails: [[0, 1]] },
};
const LINK_SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isShape = b => BLOCKS[b]?.model === 'shape';
const connectsTo = (def, n) => n !== AIR && (BLOCKS[n].shape === def.shape || (!BLOCKS[n].model && isSolid(n)));
// Direk ve bağlandığı yönlere (links) uzanan kollar. Çarpışmada kollar tam boy ve 1,5 blok yüksektir.
function connectedBoxes(def, links, collision) {
  const { post, arm, rails } = CONNECT_SHAPES[def.shape], height = collision && def.tall ? 1.5 : 1;
  const boxes = [[0.5 - post, 0, 0.5 - post, 0.5 + post, height, 0.5 + post]];
  for (const [dx, dz] of links) {
    const x0 = dx === 1 ? 0.5 + post : dx === -1 ? 0 : 0.5 - arm, x1 = dx === 1 ? 1 : dx === -1 ? 0.5 - post : 0.5 + arm;
    const z0 = dz === 1 ? 0.5 + post : dz === -1 ? 0 : 0.5 - arm, z1 = dz === 1 ? 1 : dz === -1 ? 0.5 - post : 0.5 + arm;
    for (const [y0, y1] of collision ? [[0, height]] : rails) boxes.push([x0, y0, z0, x1, y1, z1]);
  }
  return boxes;
}
// (x, y, z) hücresindeki şekilli bloğun kutuları: çizim için ya da çarpışma için (collision)
function shapeBoxes(b, x, y, z, collision) {
  const def = BLOCKS[b];
  return def.boxes || connectedBoxes(def, LINK_SIDES.filter(([dx, dz]) => connectsTo(def, get(x + dx, y, z + dz))), collision);
}
// Simgede çit ve duvar doğu–batı yönünde bağlı çizilir
const shapeIconBoxes = def => def.boxes || connectedBoxes(def, [[1, 0], [-1, 0]], false);
// Konulacak çeşit: merdiven oyuncunun baktığı yöne döner; merdiven ve yarım blok, tıklanan yüzün üst yarısına
// ya da bir bloğun altına konunca ters (üst) çeşit olur (upper).
function shapeVariant(id, upper) {
  const def = BLOCKS[id], half = upper ? 'top' : 'bottom';
  if (def.shape === 'slab') return SHAPE_VARIANTS[def.group][half];
  if (def.shape !== 'stairs') return id;
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
  const [dirName] = BED_DIRS.find(([, [ax, az]]) => Math.abs(fx) > Math.abs(fz) ? ax === Math.sign(fx) : az === Math.sign(fz));
  return SHAPE_VARIANTS[def.group][dirName + '_' + half];
}
Object.assign(window.game, { blocks: B, shapeBoxes, shapeVariant, shapeVariants: SHAPE_VARIANTS });
