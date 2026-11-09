// ---------- Yapı blokları ----------
// Yapı videoları için yeni küp bloklar ve şekilli blok aileleri. Kimlikler BLOCKS dizisinin sonuna eklenir (84'ten başlar);
// dünya 16 bit kimlik tuttuğundan sınır 65.535'tir.

// Yeni blok ekler; kimliği dizideki sırasıdır
const addBlock = (key, def) => { B[key] = BLOCKS.length; BLOCKS.push(def); return B[key]; };
const tiles = (top, side = top, bottom = top) => ({ top: TILE[top], side: TILE[side], bottom: TILE[bottom] });
const STONE_LIKE = { breakTime: 7.5, tool: 'pickaxe', needsTool: true };
const WOOD_LIKE = { breakTime: 3, tool: 'axe' };
const SOFT = { breakTime: 0.8, tool: 'shovel' };

// Küp bloklar: [anahtar, ad, doku(lar), özellikler]
const BUILD_CUBES = [
  ['iron_block', 'Demir blok', ['ironBlock'], STONE_LIKE], ['gold_block', 'Altın blok', ['goldBlock'], STONE_LIKE],
  ['diamond_block', 'Elmas blok', ['diamondBlock'], STONE_LIKE], ['emerald_block', 'Zümrüt blok', ['emeraldBlock'], STONE_LIKE],
  ['lapis_block', 'Lapis blok', ['lapisBlock'], STONE_LIKE], ['redstone_block', 'Kızıltaş blok', ['redstoneBlock'], STONE_LIKE],
  ['coal_block', 'Kömür bloğu', ['coalBlock'], STONE_LIKE], ['copper_block', 'Bakır blok', ['copperBlock'], STONE_LIKE],
  ['exposed_copper', 'Yıpranmış bakır', ['exposedCopper'], STONE_LIKE], ['weathered_copper', 'Aşınmış bakır', ['weatheredCopper'], STONE_LIKE],
  ['oxidized_copper', 'Oksitlenmiş bakır', ['oxidizedCopper'], STONE_LIKE], ['bronze_block', 'Bronz blok', ['bronzeBlock'], STONE_LIKE],
  // Kafes: saydam aralıklı metal örgü (kule, köprü)
  ['iron_truss', 'Demir kafes', ['ironTruss'], { ...STONE_LIKE, transparent: true, cutout: true }],
  ['bronze_truss', 'Bronz kafes', ['bronzeTruss'], { ...STONE_LIKE, transparent: true, cutout: true }],
  ['stone_bricks', 'Taş tuğla', ['stoneBricks'], STONE_LIKE], ['mossy_stone_bricks', 'Yosunlu taş tuğla', ['mossyStoneBricks'], STONE_LIKE],
  ['chiseled_stone_bricks', 'Oymalı taş tuğla', ['chiseledStoneBricks'], STONE_LIKE], ['deepslate_bricks', 'Koyu taş tuğla', ['deepslateBricks'], STONE_LIKE],
  ['purpur_block', 'Purpur blok', ['purpurBlock'], STONE_LIKE], ['quartz_bricks', 'Kuvars tuğla', ['quartzBricks'], STONE_LIKE],
  ['granite', 'Granit', ['granite'], STONE_LIKE], ['diorite', 'Diyorit', ['diorite'], STONE_LIKE], ['andesite', 'Andezit', ['andesite'], STONE_LIKE],
  ['polished_granite', 'Cilalı granit', ['polishedGranite'], STONE_LIKE], ['polished_diorite', 'Cilalı diyorit', ['polishedDiorite'], STONE_LIKE],
  ['polished_andesite', 'Cilalı andezit', ['polishedAndesite'], STONE_LIKE], ['smooth_stone', 'Pürüzsüz taş', ['smoothStone'], STONE_LIKE],
  ['quartz_block', 'Kuvars blok', ['quartzBlock'], STONE_LIKE], ['quartz_pillar', 'Kuvars sütun', ['quartzPillarTop', 'quartzPillar'], STONE_LIKE],
  ['cut_sandstone', 'Kesme kumtaşı', ['sandstoneTop', 'cutSandstone'], STONE_LIKE], ['terracotta', 'Pişmiş kil', ['terracotta'], STONE_LIKE],
  ['prismarine', 'Prizmarin', ['prismarine'], STONE_LIKE],
  ['spruce_planks', 'Ladin tahtası', ['sprucePlanks'], WOOD_LIKE], ['birch_planks', 'Huş tahtası', ['birchPlanks'], WOOD_LIKE],
  ['dark_oak_planks', 'Koyu meşe tahtası', ['darkOakPlanks'], WOOD_LIKE], ['acacia_planks', 'Akasya tahtası', ['acaciaPlanks'], WOOD_LIKE],
  ['birch_log', 'Huş kütüğü', ['logTopLight', 'birchLog'], WOOD_LIKE], ['dark_oak_log', 'Koyu meşe kütüğü', ['logTopDark', 'darkOakLog'], WOOD_LIKE],
  ['snow_block', 'Kar bloğu', ['snowBlock'], SOFT], ['clay', 'Kil', ['clay'], SOFT], ['gravel', 'Çakıl', ['gravel'], SOFT],
  ['bookshelf', 'Kitaplık', ['planks', 'bookshelf'], { breakTime: 1.5, tool: 'axe' }],
  // Işık veren bloklar: kendi ışığı var ve çevresini meşale gibi aydınlatır (emitsLight)
  ['sea_lantern', 'Deniz feneri', ['seaLantern'], { breakTime: 0.5, selfLit: true, emitsLight: true }],
  ['lamp', 'Lamba', ['lamp'], { breakTime: 0.5, selfLit: true, emitsLight: true }],
  ['hay_block', 'Saman balyası', ['hayTop', 'haySide'], { breakTime: 0.75 }],
  // Füme cam: gökdelen cephesi için opak cam
  ['tinted_glass', 'Füme cam', ['tintedGlass'], { breakTime: 0.5 }],
];
for (const [key, name, t, props] of BUILD_CUBES) addBlock(key, { name, ...tiles(...t), ...props });
// 16 renk beton, yün ve renkli cam (yarı saydam, saydam mesh'te çizilir)
const dyeTile = (key, kind) => key.replace(/_(.)/g, (m, c) => c.toUpperCase()) + kind;
for (const [key, name] of DYES) addBlock(key + '_concrete', { name: name + ' beton', ...tiles(dyeTile(key, 'Concrete')), breakTime: 2.5, tool: 'pickaxe', needsTool: true });
for (const [key, name] of DYES) addBlock(key + '_wool', { name: name + ' yün', ...tiles(dyeTile(key, 'Wool')), breakTime: 1.2 });
for (const [key, name] of DYES) addBlock(key + '_stained_glass', { name: name + ' cam', ...tiles(dyeTile(key, 'Glass')), breakTime: 0.5, transparent: true, noDrop: true });

// Şekilli bloklar (model: 'shape', geometri shapes.js'te). Yönlü şekillerin her yönü (dir) ve tersi (flip, üst yarı)
// ayrı, gizli bir kimliktir; eşya ailenin ilk kimliğidir, konunca bakış yönüne ve tıklanan yarıya göre seçilir (placeShape).
// SHAPE_FAMILIES: eşya anahtarı -> { shape, variants: { "dirIndex,flip": kimlik } }
const SHAPE_FAMILIES = {};
const SHAPE_KINDS = {
  stairs: ['merdiven', 4, 2], slab: ['yarım blok', 1, 2], slope: ['eğim', 4, 2],
  arch: ['kemer', 4, 2], corner: ['yuvarlak köşe', 4, 1], pillar: ['yuvarlak sütun', 1, 1],
};
// Şekil verilen malzemeler: [önek, malzemenin adı, tam blok anahtarı]
const SHAPE_MATERIALS = [
  ['oak', 'Tahta', 'planks'], ['spruce', 'Ladin', 'spruce_planks'], ['birch', 'Huş', 'birch_planks'],
  ['dark_oak', 'Koyu meşe', 'dark_oak_planks'], ['acacia', 'Akasya', 'acacia_planks'], ['cobblestone', 'Kırık taş', 'cobble'],
  ['stone', 'Taş', 'stone'], ['stone_brick', 'Taş tuğla', 'stone_bricks'], ['mossy_stone_brick', 'Yosunlu taş tuğla', 'mossy_stone_bricks'],
  ['brick', 'Tuğla', 'brick'], ['sandstone', 'Kumtaşı', 'sandstone'], ['quartz', 'Kuvars', 'quartz_block'],
  ['smooth_stone', 'Pürüzsüz taş', 'smooth_stone'], ['andesite', 'Cilalı andezit', 'polished_andesite'],
  ['granite', 'Cilalı granit', 'polished_granite'], ['deepslate_brick', 'Koyu taş tuğla', 'deepslate_bricks'],
  ['nether_brick', 'Nether tuğlası', 'nether_brick'], ['iron', 'Demir', 'iron_block'], ['bronze', 'Bronz', 'bronze_block'],
  ['copper', 'Bakır', 'copper_block'], ['white_concrete', 'Beyaz beton', 'white_concrete'],
  ['gray_concrete', 'Gri beton', 'gray_concrete'], ['black_concrete', 'Siyah beton', 'black_concrete'],
];
for (const [prefix, material, full] of SHAPE_MATERIALS) {
  const base = BLOCKS[B[full]];
  for (const [shape, [label, dirs, flips]] of Object.entries(SHAPE_KINDS)) {
    const family = prefix + '_' + shape, variants = {};
    for (let d = 0; d < dirs; d++) for (let f = 0; f < flips; f++) {
      const key = d || f ? `${family}_${d}${f}` : family;
      variants[d + ',' + f] = addBlock(key, {
        name: material + ' ' + label, top: base.top, side: base.side, bottom: base.bottom, breakTime: base.breakTime, tool: base.tool,
        needsTool: base.needsTool, model: 'shape', shape, dir: BED_DIRS[d][1], flip: !!f, family, full: B[full],
        transparent: true, hidden: !!(d || f), drop: family,
      });
    }
    SHAPE_FAMILIES[family] = { shape, variants };
  }
}
// Komşularına bağlanan şekiller (tek kimlik): çit, parmaklık (pane) ve duvar
const CONNECTED = [
  ['oak_fence', 'Tahta çit', 'fence', 'planks'], ['spruce_fence', 'Ladin çit', 'fence', 'spruce_planks'],
  ['birch_fence', 'Huş çit', 'fence', 'birch_planks'], ['dark_oak_fence', 'Koyu meşe çit', 'fence', 'dark_oak_planks'],
  ['acacia_fence', 'Akasya çit', 'fence', 'acacia_planks'], ['nether_brick_fence', 'Nether tuğlası çit', 'fence', 'nether_brick'],
  ['iron_bars', 'Demir parmaklık', 'pane', null, 'ironBars'], ['glass_pane', 'Cam panel', 'pane', null, 'glass'],
  ['bronze_bars', 'Bronz parmaklık', 'pane', null, 'bronzeTruss'],
  ['cobblestone_wall', 'Kırık taş duvar', 'wall', 'cobble'], ['stone_brick_wall', 'Taş tuğla duvar', 'wall', 'stone_bricks'],
  ['mossy_stone_brick_wall', 'Yosunlu taş tuğla duvar', 'wall', 'mossy_stone_bricks'], ['brick_wall', 'Tuğla duvar', 'wall', 'brick'],
  ['sandstone_wall', 'Kumtaşı duvar', 'wall', 'sandstone'], ['deepslate_brick_wall', 'Koyu taş tuğla duvar', 'wall', 'deepslate_bricks'],
];
for (const [key, name, shape, full, tile] of CONNECTED) {
  const base = full ? BLOCKS[B[full]] : { ...tiles(tile), breakTime: 2, tool: 'pickaxe' };
  addBlock(key, { name, top: base.top, side: base.side, bottom: base.bottom, breakTime: base.breakTime, tool: base.tool,
    // tall: çit ve duvarın çarpışma kutusu 1,5 blok (Minecraft'taki gibi üstünden atlanamaz)
    model: 'shape', shape, dir: [1, 0], flip: false, transparent: true, cutout: !full, tall: shape !== 'pane' });
}
