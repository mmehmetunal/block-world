// ---------- Bloklar ----------
// Blok tanımları (BLOCKS), kimlikler (B) ve blok sınıflandırma yardımcıları.

const AIR = 0;
const BED_DIRS = [['east', [1, 0]], ['west', [-1, 0]], ['south', [0, 1]], ['north', [0, -1]]], BED_HEIGHT = 9 / 16;
// breakTime: elle kırma süresi (sn). tool: bloğu hızlı kıran alet. needsTool: o alet olmadan kırılınca eşya düşmez.
// drop: kırılınca kendisi yerine düşen eşya.
const BLOCKS = [
  null,
  // tint: biyoma göre tonlanan yüzler ('top' ya da 'all')
  { name: 'Çimen', top: TILE.grassTop, side: TILE.grassSide, bottom: TILE.dirt, breakTime: 0.75, tool: 'shovel', tint: 'top' },
  { name: 'Toprak', top: TILE.dirt, side: TILE.dirt, bottom: TILE.dirt, breakTime: 0.75, tool: 'shovel' },
  { name: 'Taş', top: TILE.stone, side: TILE.stone, bottom: TILE.stone, breakTime: 7.5, tool: 'pickaxe', needsTool: true, drop: 'cobble' },
  { name: 'Kütük', top: TILE.logTop, side: TILE.logSide, bottom: TILE.logTop, breakTime: 3, tool: 'axe' },
  { name: 'Yaprak', top: TILE.leaves, side: TILE.leaves, bottom: TILE.leaves, breakTime: 0.3, tint: 'all' },
  { name: 'Kum', top: TILE.sand, side: TILE.sand, bottom: TILE.sand, breakTime: 0.75, tool: 'shovel' },
  { name: 'Tahta', top: TILE.planks, side: TILE.planks, bottom: TILE.planks, breakTime: 3, tool: 'axe' },
  { name: 'Tuğla', top: TILE.brick, side: TILE.brick, bottom: TILE.brick, breakTime: 7.5, tool: 'pickaxe', needsTool: true },
  { name: 'Kırık taş', top: TILE.cobble, side: TILE.cobble, bottom: TILE.cobble, breakTime: 7.5, tool: 'pickaxe', needsTool: true },
  { name: 'Çalışma masası', top: TILE.craftingTop, side: TILE.craftingSide, bottom: TILE.planks, breakTime: 3, tool: 'axe' },
  // Fırının her yanında ağız var (bloklar yön tutmuyor).
  { name: 'Fırın', top: TILE.furnaceTop, side: TILE.furnaceFront, bottom: TILE.furnaceTop, breakTime: 7.5, tool: 'pickaxe', needsTool: true },
  { name: 'Kumtaşı', top: TILE.sandstoneTop, side: TILE.sandstoneSide, bottom: TILE.sandstoneTop, breakTime: 4, tool: 'pickaxe', needsTool: true },
  { name: 'Fırın', top: TILE.furnaceTop, side: TILE.furnaceLit, bottom: TILE.furnaceTop, breakTime: 7.5, tool: 'pickaxe', needsTool: true, drop: 'furnace' },
  // cutout: saydam pikseller kesilir (opak mesh'te çizilir), arkasındaki yüzler görünür.
  { name: 'Cam', top: TILE.glass, side: TILE.glass, bottom: TILE.glass, breakTime: 0.5, transparent: true, cutout: true },
  // minTier: düşmesi için gereken en düşük alet seviyesi (1 tahta, 2 taş, 3 demir, 4 elmas)
  { name: 'Kömür cevheri', top: TILE.coalOre, side: TILE.coalOre, bottom: TILE.coalOre, breakTime: 7.5, tool: 'pickaxe', needsTool: true, drop: 'coal' },
  { name: 'Demir cevheri', top: TILE.ironOre, side: TILE.ironOre, bottom: TILE.ironOre, breakTime: 7.5, tool: 'pickaxe', needsTool: true, minTier: 2 },
  // fluid: katı değil, nişan ışını geçer. transparent: arkasındaki yüzler çizilir, ayrı saydam mesh'te çizilir.
  // Sıvılar: liquid tür, level 0 kaynak (akan seviyeler 1–7 listenin sonunda)
  { name: 'Su', top: TILE.water, side: TILE.water, bottom: TILE.water, breakTime: Infinity, fluid: true, transparent: true, hidden: true, liquid: 'water', level: 0 },
  // Meşaleler: tam blok değil (model: 'torch'), çarpışmasız (noCollide). lean: duvardan uzağa eğilme yönü [dx, dz].
  ...[[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].map(lean => ({
    name: 'Meşale', top: TILE.torch, side: TILE.torch, bottom: TILE.torch, breakTime: 0.05,
    model: 'torch', lean, noCollide: true, transparent: true, hidden: true, drop: 'torch',
  })),
  // Yatak: iki hücre (ayak ve baş), dir baş tarafının yönü. Yarım blok yüksekliğinde (height).
  ...BED_DIRS.flatMap(([, dir]) => ['foot', 'head'].map(part => ({
    name: 'Yatak', top: part === 'head' ? TILE.bedHeadTop : TILE.bedFootTop, side: TILE.bedSide, bottom: TILE.planks,
    breakTime: 0.3, tool: 'axe', model: 'bed', part, dir, height: BED_HEIGHT, transparent: true, hidden: true, drop: 'bed',
  }))),
  // Kapı: 3/16 kalınlığında levha (box). Kapalıyken baktığı yönün kenarında, açıkken sol kenarda.
  ...BED_DIRS.flatMap(([, dir]) => ['lower', 'upper'].flatMap(part => [false, true].map(open => {
    const [sx, sz] = open ? [dir[1], -dir[0]] : dir, t = 3 / 16;
    const box = sx === 1 ? [1 - t, 0, 0, 1, 1, 1] : sx === -1 ? [0, 0, 0, t, 1, 1] : sz === 1 ? [0, 0, 1 - t, 1, 1, 1] : [0, 0, 0, 1, 1, t];
    const tile = part === 'lower' ? TILE.doorLower : TILE.doorUpper;
    return { name: 'Kapı', top: tile, side: tile, bottom: tile, breakTime: 3, tool: 'axe', model: 'box', box, part, dir, open, transparent: true, hidden: true, drop: 'door' };
  }))),
  // Bitkiler: çapraz iki düzlem (model: 'cross'), çarpışmasız, anında kırılır, yerine blok konabilir (replaceable).
  ...[['Uzun ot', TILE.tallGrass], ['Gelincik', TILE.poppy], ['Karahindiba', TILE.dandelion]].map(([name, tile]) => ({
    name, top: tile, side: tile, bottom: tile, breakTime: 0.05, model: 'cross', noCollide: true, transparent: true, cutout: true,
    replaceable: true, hidden: true, noDrop: true,
  })),
  // Tarla: çapayla sürülmüş toprak; kırılınca toprak düşer
  { name: 'Tarla', top: TILE.farmland, side: TILE.dirt, bottom: TILE.dirt, breakTime: 0.75, tool: 'shovel', drop: 'dirt' },
  // Buğday 4 aşama (crop: aşama)
  ...[0, 1, 2, 3].map(stage => ({
    name: 'Buğday', top: TILE.wheat0 + stage, side: TILE.wheat0 + stage, bottom: TILE.wheat0 + stage, breakTime: 0.05,
    model: 'cross', noCollide: true, transparent: true, cutout: true, hidden: true, crop: stage,
  })),
  // Obsidyen: yalnızca demir kazmayla (tier 3) düşer; demir kazmayla 6 sn (36 / 6)
  { name: 'Obsidyen', top: TILE.obsidian, side: TILE.obsidian, bottom: TILE.obsidian, breakTime: 36, tool: 'pickaxe', needsTool: true, minTier: 3 },
  // Portal: çarpışmasız, nişan ışını geçer (fluid), chunk mesh'inde değil portal.js'teki ayrı düzlemlerle çizilir.
  // axis: düzlemin uzandığı yatay eksen
  ...['x', 'z'].map(axis => ({ name: 'Portal', top: TILE.obsidian, side: TILE.obsidian, bottom: TILE.obsidian, breakTime: Infinity, model: 'portal', axis, fluid: true, transparent: true, hidden: true, noDrop: true })),
  // Nether. selfLit: kendi ışığı var, gece/Nether karanlığından etkilenmez (ayrı malzeme).
  { name: 'Kızıl taş', top: TILE.netherrack, side: TILE.netherrack, bottom: TILE.netherrack, breakTime: 2, tool: 'pickaxe', needsTool: true },
  { name: 'Lav', top: TILE.lava, side: TILE.lava, bottom: TILE.lava, breakTime: Infinity, fluid: true, selfLit: true, hidden: true, noDrop: true, liquid: 'lava', level: 0 },
  // dropCount: düşen eşya adedi aralığı
  { name: 'Işıltı taşı', top: TILE.glowstone, side: TILE.glowstone, bottom: TILE.glowstone, breakTime: 1.5, selfLit: true, drop: 'glowstone_dust', dropCount: [2, 4] },
  { name: 'Sandık', top: TILE.chestTop, side: TILE.chestSide, bottom: TILE.chestTop, breakTime: 3.75, tool: 'axe' },
  { name: 'Elmas cevheri', top: TILE.diamondOre, side: TILE.diamondOre, bottom: TILE.diamondOre, breakTime: 15, tool: 'pickaxe', needsTool: true, minTier: 3, drop: 'diamond' },
  // Akan su (63–69) ve akan lav (70–76): seviye 1–7, üst yüzü seviyeye göre alçak çizilir (fluids.js)
  ...[1, 2, 3, 4, 5, 6, 7].map(level => ({ name: 'Su', top: TILE.water, side: TILE.water, bottom: TILE.water, breakTime: Infinity, fluid: true, transparent: true, hidden: true, noDrop: true, liquid: 'water', level })),
  ...[1, 2, 3, 4, 5, 6, 7].map(level => ({ name: 'Lav', top: TILE.lava, side: TILE.lava, bottom: TILE.lava, breakTime: Infinity, fluid: true, selfLit: true, hidden: true, noDrop: true, liquid: 'lava', level })),
  { name: 'Karlı çimen', top: TILE.snowGrassTop, side: TILE.snowGrassSide, bottom: TILE.dirt, breakTime: 0.75, tool: 'shovel', drop: 'dirt' },
  // Buz: kaygan (üstünde sürtünme az), yarı saydam; kırılınca bir şey düşmez
  { name: 'Buz', top: TILE.ice, side: TILE.ice, bottom: TILE.ice, breakTime: 0.5, tool: 'pickaxe', transparent: true, noDrop: true },
  { name: 'Kaktüs', top: TILE.cactusTop, side: TILE.cactusSide, bottom: TILE.cactusTop, breakTime: 0.4, model: 'box', box: [1 / 16, 0, 1 / 16, 15 / 16, 1, 15 / 16] },
  { name: 'Ladin kütüğü', top: TILE.logTop, side: TILE.spruceLog, bottom: TILE.logTop, breakTime: 3, tool: 'axe' },
  { name: 'Ladin yaprağı', top: TILE.spruceLeaves, side: TILE.spruceLeaves, bottom: TILE.spruceLeaves, breakTime: 0.3, noDrop: true, tint: 'all' },
  // Nether kalesi (82–83). Doğurucu: kafes, içinde dönen küçük blaze (blaze.js)
  { name: 'Nether tuğlası', top: TILE.netherBrick, side: TILE.netherBrick, bottom: TILE.netherBrick, breakTime: 10, tool: 'pickaxe', needsTool: true },
  { name: 'Blaze doğurucu', top: TILE.spawner, side: TILE.spawner, bottom: TILE.spawner, breakTime: 25, tool: 'pickaxe', needsTool: true, transparent: true, cutout: true, noDrop: true },
];
const B = { grass: 1, dirt: 2, stone: 3, log: 4, leaves: 5, sand: 6, planks: 7, brick: 8, cobble: 9, crafting_table: 10, furnace: 11, sandstone: 12, furnace_lit: 13, glass: 14, coal_ore: 15, iron_ore: 16, water: 17,
  torch_floor: 18, torch_east: 19, torch_west: 20, torch_south: 21, torch_north: 22 };
// Yatak kimlikleri 23–30: her yön için ayak ve baş
BED_DIRS.forEach(([name], i) => { B['bed_foot_' + name] = 23 + i * 2; B['bed_head_' + name] = 24 + i * 2; });
const isBed = b => b >= 23 && b <= 30;
// Kapı kimlikleri 31–46: yön × (alt, üst) × (kapalı, açık)
const DOOR_FIRST = 31;
const isDoor = b => b >= DOOR_FIRST && b < DOOR_FIRST + 16;
const doorId = (dirIndex, part, open) => DOOR_FIRST + dirIndex * 4 + (part === 'upper' ? 2 : 0) + (open ? 1 : 0);
Object.assign(B, { tall_grass: 47, poppy: 48, dandelion: 49, farmland: 50, wheat_0: 51, wheat_1: 52, wheat_2: 53, wheat_3: 54, obsidian: 55, portal_x: 56, portal_z: 57, netherrack: 58, lava: 59, glowstone: 60, chest: 61, diamond_ore: 62 });
for (let level = 1; level <= 7; level++) { B['water_flow_' + level] = 62 + level; B['lava_flow_' + level] = 69 + level; }
// Biyom blokları
Object.assign(B, { snowy_grass: 77, ice: 78, cactus: 79, spruce_log: 80, spruce_leaves: 81, nether_brick: 82, spawner: 83 });
// Sıvı yardımcıları: tür ('water', 'lava' ya da null), seviye, türe ve seviyeye göre blok
const liquidOf = b => BLOCKS[b]?.liquid || null;
const liquidBlock = (kind, level) => level === 0 ? B[kind] : B[kind + '_flow_' + level];
const isWater = b => liquidOf(b) === 'water';
const isLava = b => liquidOf(b) === 'lava';
const isPortal = b => b === B.portal_x || b === B.portal_z;
// Işık kaynağı: meşaleler, ışıltı taşı ve emitsLight blokları (lav çok sayıda olduğundan ışık kaynağı sayılmaz, yalnızca kendisi parlar)
const isLightSource = b => isTorch(b) || b === B.glowstone || !!BLOCKS[b]?.emitsLight;
const isCrop = b => b >= B.wheat_0 && b <= B.wheat_3;
const isPlant = b => BLOCKS[b]?.model === 'cross';
// Üstünden geçilebilen, zemin sayılmayan hücre (hava ya da bitki/meşale)
const passable = b => b === AIR || !!BLOCKS[b].noCollide;
BED_DIRS.forEach(([name], i) => ['lower', 'upper'].forEach(part => [false, true].forEach(open => {
  B[`door_${name}_${part}_${open ? 'open' : 'closed'}`] = doorId(i, part, open);
})));
const isTorch = b => b >= B.torch_floor && b <= B.torch_north;
// Katı blok: çarpışır, görüşü ve okları keser.
const isSolid = b => b !== AIR && !BLOCKS[b].fluid && !BLOCKS[b].noCollide;
// Nişan ışınının durduğu blok: su dışındaki her şey (meşale dahil).
const isTargetable = b => b !== AIR && !BLOCKS[b].fluid;
