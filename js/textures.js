// ---------- Dokular ----------
// Doku atlası: 16x16 piksellik dokular kodla çizilir.

// Konsoldan ve testlerden erişim için ortak kanca nesnesi; diğer betikler buna ekler (bkz. SPEC.md "Test kancası").
window.game = {};

// Atlas 192 dokuluk yer ayırır; 52. dokudan sonrası build-textures.js'te çizilir.
const T = 16, N_TILES = 192;
const TILE = {
  grassTop: 0, grassSide: 1, dirt: 2, stone: 3, logSide: 4, logTop: 5, leaves: 6, sand: 7, planks: 8, brick: 9, cobble: 10,
  craftingTop: 11, craftingSide: 12, furnaceFront: 13, furnaceTop: 14, sandstoneTop: 15, sandstoneSide: 16, furnaceLit: 17, glass: 18, coalOre: 19, ironOre: 20, water: 21, torch: 22, bedHeadTop: 23, bedFootTop: 24, bedSide: 25, doorLower: 26, doorUpper: 27, tallGrass: 28, poppy: 29, dandelion: 30, farmland: 31, wheat0: 32, wheat1: 33, wheat2: 34, wheat3: 35, obsidian: 36, netherrack: 37, lava: 38, glowstone: 39, chestTop: 40, chestSide: 41, diamondOre: 42, snowGrassTop: 43, snowGrassSide: 44, ice: 45, cactusSide: 46, cactusTop: 47, spruceLog: 48, spruceLeaves: 49, netherBrick: 50, spawner: 51,
};

function mulberry32(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const rnd = mulberry32(1337);
const shade = (rgb, f) => `rgb(${rgb.map(c => Math.max(0, Math.min(255, Math.round(c * f)))).join(',')})`;

const atlas = document.createElement('canvas');
atlas.width = T * N_TILES; atlas.height = T;
const g = atlas.getContext('2d');

function noisyTile(i, rgb, spread) {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    g.fillStyle = shade(rgb, 1 - spread / 2 + rnd() * spread);
    g.fillRect(i * T + x, y, 1, 1);
  }
}
const px = (i, x, y, color) => { g.fillStyle = color; g.fillRect(i * T + x, y, 1, 1); };

noisyTile(TILE.grassTop, [93, 160, 58], 0.3);
noisyTile(TILE.dirt, [134, 96, 67], 0.35);
noisyTile(TILE.grassSide, [134, 96, 67], 0.35);
for (let x = 0; x < T; x++) {
  const depth = 3 + Math.floor(rnd() * 3);
  for (let y = 0; y < depth; y++) px(TILE.grassSide, x, y, shade([93, 160, 58], 0.85 + rnd() * 0.3));
}
noisyTile(TILE.stone, [125, 125, 125], 0.25);
for (let k = 0; k < 6; k++) {
  const x = Math.floor(rnd() * 13), y = Math.floor(rnd() * 16);
  for (let d = 0; d < 3; d++) px(TILE.stone, x + d, y, shade([125, 125, 125], 0.75));
}
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  const stripe = (x % 4 === 0) ? 0.75 : 1;
  px(TILE.logSide, x, y, shade([107, 81, 48], stripe * (0.85 + rnd() * 0.3)));
  const r = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
  const ring = r > 6.5 ? [107, 81, 48] : (Math.floor(r) % 2 ? [176, 141, 87] : [154, 121, 72]);
  px(TILE.logTop, x, y, shade(ring, 0.9 + rnd() * 0.2));
}
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  px(TILE.leaves, x, y, rnd() < 0.18 ? shade([30, 70, 20], 1) : shade([62, 125, 42], 0.75 + rnd() * 0.45));
}
noisyTile(TILE.sand, [219, 211, 160], 0.15);
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  const row = Math.floor(y / 4), seam = (y % 4 === 3) || ((x + row * 5) % 16 === 0);
  px(TILE.planks, x, y, seam ? shade([120, 92, 55], 1) : shade([168, 131, 79], 0.9 + rnd() * 0.2));
}
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  const row = Math.floor(y / 4), mortar = (y % 4 === 3) || ((x + (row % 2) * 4) % 8 === 7);
  px(TILE.brick, x, y, mortar ? shade([170, 165, 155], 0.9 + rnd() * 0.15) : shade([150, 80, 63], 0.85 + rnd() * 0.3));
}
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  const cell = ((Math.floor(x / 5) * 7 + Math.floor((y + (Math.floor(x / 5) % 2) * 2) / 5) * 13) % 5);
  const edge = (x % 5 === 0) || ((y + (Math.floor(x / 5) % 2) * 2) % 5 === 0);
  px(TILE.cobble, x, y, edge ? shade([80, 80, 80], 1) : shade([130 + cell * 8, 130 + cell * 8, 130 + cell * 8], 0.85 + rnd() * 0.25));
}
// Çalışma masası: üstü ızgaralı tahta, yanları tahta üstüne asılı testere ve çekiç
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  const grid = x % 5 === 0 || y % 5 === 0 || x === 15 || y === 15;
  px(TILE.craftingTop, x, y, grid ? shade([92, 64, 38], 1) : shade([176, 138, 84], 0.9 + rnd() * 0.2));
  const rim = y < 3;
  px(TILE.craftingSide, x, y, rim ? shade([120, 88, 52], 0.9 + rnd() * 0.2) : (y % 4 === 3 ? shade([120, 92, 55], 1) : shade([168, 131, 79], 0.9 + rnd() * 0.2)));
}
for (let y = 5; y < 12; y++) { px(TILE.craftingSide, 3, y, '#8a8a8a'); px(TILE.craftingSide, 4, y, '#6a6a6a'); }
for (let x = 9; x < 13; x++) px(TILE.craftingSide, x, 5, '#7a7a7a');
for (let y = 6; y < 12; y++) px(TILE.craftingSide, 11, y, '#5a3a20');
// Fırın: taş gövde, önde kararmış ağız
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  const base = shade([118, 118, 118], 0.85 + rnd() * 0.25);
  px(TILE.furnaceTop, x, y, base);
  const mouth = x >= 4 && x <= 11 && y >= 8 && y <= 13;
  px(TILE.furnaceFront, x, y, mouth ? shade([30, 28, 28], 0.8 + rnd() * 0.4) : y === 3 ? shade([80, 80, 80], 1) : base);
  // Yanan fırın: ağızda turuncu-sarı alev
  const flame = mouth && (y >= 11 || rnd() < 0.45);
  px(TILE.furnaceLit, x, y, flame ? (rnd() < 0.5 ? '#ffb02a' : '#e8601c') : mouth ? shade([60, 30, 20], 1) : y === 3 ? shade([80, 80, 80], 1) : base);
}
// Cevherler: taş dokusunun üstüne benekler
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  const stone = shade([125, 125, 125], 0.88 + rnd() * 0.24);
  px(TILE.coalOre, x, y, stone);
  px(TILE.ironOre, x, y, stone);
  px(TILE.diamondOre, x, y, stone);
}
for (const [tile, color, light] of [[TILE.coalOre, [28, 28, 28], [55, 55, 55]], [TILE.ironOre, [196, 160, 122], [226, 196, 160]], [TILE.diamondOre, [70, 210, 200], [190, 255, 248]]]) {
  for (let k = 0; k < 7; k++) {
    const cx = 1 + Math.floor(rnd() * 12), cy = 1 + Math.floor(rnd() * 12);
    px(tile, cx, cy, shade(color, 1)); px(tile, cx + 1, cy, shade(color, 1)); px(tile, cx, cy + 1, shade(color, 1)); px(tile, cx + 1, cy + 1, shade(light, 1));
  }
}
// Meşale: ortada 2 piksel genişliğinde çubuk; 6–8. satırlar alev, altı tahta
for (let y = 6; y < T; y++) for (let x = 7; x < 9; x++) {
  px(TILE.torch, x, y, y < 8 ? (x === 7 ? '#ffe36a' : '#ffb02a') : y === 8 ? '#ff8a1f' : (x === 7 ? '#8a6238' : '#6b4a2b'));
}
// Yatak: üst dokuda yastık dokunun üst kenarına (baş tarafına) bakar.
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  const red = shade([168, 40, 42], 0.9 + rnd() * 0.15);
  px(TILE.bedHeadTop, x, y, y < 7 && x > 1 && x < 14 ? shade([236, 236, 232], 0.95 + rnd() * 0.05) : y === 7 ? shade([150, 150, 150], 1) : red);
  px(TILE.bedFootTop, x, y, y > 12 ? shade([130, 30, 32], 1) : red);
  // Yan: üstte kırmızı örtü, beyaz çarşaf şeridi, altta tahta
  px(TILE.bedSide, x, y, y < 10 ? red : y < 12 ? shade([236, 236, 232], 1) : (x < 3 || x > 12 ? shade([120, 88, 52], 1) : shade([46, 32, 24], 1)));
}
// Su: mavi dalgacıklar (saydamlık malzemeden gelir)
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  const ripple = (x + y * 3) % 7 === 0 || (x * 2 + y) % 11 === 0;
  px(TILE.water, x, y, ripple ? shade([90, 150, 230], 1) : shade([46, 98, 200], 0.92 + rnd() * 0.12));
}
// Cam: açık gri çerçeve, içi saydam (birkaç parlama pikseli hariç)
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  const edge = x === 0 || y === 0 || x === 15 || y === 15;
  const glint = (x === y + 3 || x === y + 4) && x > 4 && x < 9;
  if (edge || glint) px(TILE.glass, x, y, edge ? '#d8dee6' : '#ffffff');
}
// Bitkiler: saydam arka plan üstünde ot ve çiçek
for (let x = 1; x < 15; x += 1 + Math.floor(rnd() * 2)) {
  const h = 6 + Math.floor(rnd() * 8);
  for (let y = 16 - h; y < 16; y++) px(TILE.tallGrass, x, y, shade([88, 150, 52], 0.8 + rnd() * 0.35));
}
for (const [tile, petal, center] of [[TILE.poppy, [204, 34, 30], [30, 20, 20]], [TILE.dandelion, [244, 214, 40], [250, 236, 120]]]) {
  for (let y = 8; y < 16; y++) px(tile, 7, y, shade([70, 130, 40], 1));
  px(tile, 6, 12, shade([80, 150, 50], 1)); px(tile, 8, 11, shade([80, 150, 50], 1));
  for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) px(tile, 7 + dx, 6 + dy, shade(petal, 0.9 + rnd() * 0.15));
  px(tile, 7, 6, shade(center, 1));
}
// Tarla: koyu, nemli toprak üstünde sürülmüş çizgiler
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) px(TILE.farmland, x, y, shade(y % 4 === 0 ? [60, 38, 24] : [92, 62, 40], 0.9 + rnd() * 0.15));
// Buğday: 4 aşama, gittikçe uzayan ve sararan saplar
[[5, [96, 168, 56]], [9, [110, 170, 50]], [12, [180, 170, 60]], [14, [214, 180, 70]]].forEach(([h, color], stage) => {
  const tile = TILE.wheat0 + stage;
  for (let x = 1; x < 15; x += 2) {
    const hh = h - Math.floor(rnd() * 3);
    for (let y = 16 - hh; y < 16; y++) px(tile, x, y, shade(color, 0.85 + rnd() * 0.3));
    if (stage === 3) px(tile, x, 16 - hh, shade([150, 110, 40], 1)); // başak
  }
});
// Obsidyen: çok koyu mor-siyah, açık mor benekler
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  px(TILE.obsidian, x, y, rnd() < 0.08 ? shade([84, 56, 120], 0.9 + rnd() * 0.3) : shade([22, 16, 34], 0.8 + rnd() * 0.4));
}
// Nether: kızıl taş (koyu kırmızı benekli), lav (turuncu-sarı), ışıltı taşı (sarı, kahverengi çatlaklı)
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  px(TILE.netherrack, x, y, rnd() < 0.15 ? shade([70, 18, 18], 1) : shade([112, 36, 34], 0.8 + rnd() * 0.4));
  const swirl = Math.sin((x + y * 0.7) / 2.2) * 0.5 + 0.5;
  px(TILE.lava, x, y, shade(swirl > 0.75 ? [255, 214, 70] : swirl > 0.35 ? [244, 128, 24] : [206, 72, 14], 0.92 + rnd() * 0.16));
  px(TILE.glowstone, x, y, rnd() < 0.18 ? shade([150, 104, 40], 1) : shade([252, 214, 120], 0.88 + rnd() * 0.24));
}
// Kapı: koyu çerçeveli tahta; üst yarıda iki küçük pencere
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  const frame = x < 2 || x > 13 || y === 0 || y === 15;
  const wood = frame ? shade([92, 64, 38], 0.95 + rnd() * 0.1) : shade([150, 110, 64], 0.9 + rnd() * 0.15);
  px(TILE.doorLower, x, y, y === 7 && !frame ? shade([92, 64, 38], 1) : wood);
  const pane = !frame && y >= 3 && y <= 9 && x !== 7 && x !== 8;
  px(TILE.doorUpper, x, y, pane ? '#a9cbe0' : wood);
}
// Sandık: koyu çerçeveli tahta; yanda ortada koyu kilit çizgisi ve gümüş kilit
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  const frame = x === 0 || x === 15 || y === 0 || y === 15;
  const wood = frame ? shade([84, 56, 30], 0.95 + rnd() * 0.1) : shade([160, 112, 56], 0.88 + rnd() * 0.2);
  px(TILE.chestTop, x, y, wood);
  const lock = x >= 7 && x <= 8 && y >= 5 && y <= 8;
  px(TILE.chestSide, x, y, lock ? (y === 5 ? '#e0e0e0' : '#a8a8a8') : y === 5 ? shade([60, 40, 22], 1) : wood);
}
// Karlı çimen: beyaz üst, yanda toprak üstünde kar
noisyTile(TILE.snowGrassTop, [240, 244, 248], 0.08);
noisyTile(TILE.snowGrassSide, [134, 96, 67], 0.35);
for (let x = 0; x < T; x++) {
  const depth = 2 + Math.floor(rnd() * 3);
  for (let y = 0; y < depth; y++) px(TILE.snowGrassSide, x, y, shade([240, 244, 248], 0.92 + rnd() * 0.08));
}
// Buz: açık mavi, beyaz çizgiler
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  px(TILE.ice, x, y, (x + y * 2) % 11 === 0 ? '#e6f4ff' : shade([150, 196, 240], 0.94 + rnd() * 0.12));
}
// Kaktüs: koyu dikey şeritli yeşil, açık dikenler; üstte halka
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  const edge = x === 0 || x === 15;
  px(TILE.cactusSide, x, y, edge ? '#2f5a1c' : x % 4 === 1 ? shade([60, 112, 38], 1) : (y + x) % 5 === 0 ? '#d8e8b0' : shade([86, 150, 54], 0.92 + rnd() * 0.12));
  const r = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
  px(TILE.cactusTop, x, y, r > 6.5 ? '#2f5a1c' : r > 4.5 ? shade([86, 150, 54], 1) : shade([110, 170, 70], 0.95 + rnd() * 0.1));
}
// Ladin: koyu kahverengi kabuk, koyu yeşil yaprak
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  px(TILE.spruceLog, x, y, shade([74, 52, 32], (x % 3 === 0 ? 0.75 : 1) * (0.85 + rnd() * 0.3)));
  px(TILE.spruceLeaves, x, y, rnd() < 0.2 ? shade([20, 44, 26], 1) : shade([46, 86, 52], 0.75 + rnd() * 0.4));
}
// Nether tuğlası: koyu bordo küçük tuğlalar; doğurucu: saydam zeminde koyu demir çubuk kafes
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  const row = Math.floor(y / 4), mortar = y % 4 === 3 || (x + (row % 2) * 4) % 8 === 7;
  px(TILE.netherBrick, x, y, mortar ? shade([26, 12, 16], 1) : shade([72, 30, 38], 0.85 + rnd() * 0.3));
  if (x % 4 === 0 || y % 4 === 0 || x === 15 || y === 15) px(TILE.spawner, x, y, x % 4 === 0 && y % 4 === 0 ? '#5a626e' : '#2a2f36');
}
// Kumtaşı
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  px(TILE.sandstoneTop, x, y, shade([216, 203, 150], 0.92 + rnd() * 0.12));
  const band = y < 3 ? [230, 218, 166] : y > 12 ? [200, 186, 132] : [216, 203, 150];
  px(TILE.sandstoneSide, x, y, shade(band, 0.92 + rnd() * 0.12));
}

function tileImage(i) {
  const c = document.createElement('canvas'); c.width = c.height = T;
  c.getContext('2d').drawImage(atlas, i * T, 0, T, T, 0, 0, T, T);
  return c.toDataURL();
}
