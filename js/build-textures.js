// ---------- Yapı dokuları ----------
// Yapı bloklarının dokuları (metal, taş, ahşap, beton, yün, renkli cam, parmaklık); atlasın 52. dokusundan sonrasına çizilir.

let nextTile = 52;
// Yeni doku yeri ayırır ve fn(x, y) renkleriyle boyar
function paintTile(name, fn) {
  TILE[name] = nextTile++;
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const color = fn(x, y);
    if (color) px(TILE[name], x, y, color);
  }
}
const grain = (rgb, spread) => shade(rgb, 1 - spread / 2 + rnd() * spread);
const edgeOf = (x, y) => x === 0 || y === 0 || x === 15 || y === 15;

// Metal ve maden blokları: koyu kenar, sol üstte parlak iç kabartma, hafif parıltı
const metalTile = (name, rgb, gem) => paintTile(name, (x, y) => {
  if (edgeOf(x, y)) return shade(rgb, 0.68);
  if (x === 1 || y === 1) return shade(rgb, 1.18);
  if (x === 14 || y === 14) return shade(rgb, 0.85);
  if (gem && (x + y) % 6 === 0 && x > 2 && x < 13) return shade(rgb, 1.25);
  return grain(rgb, gem ? 0.12 : 0.06);
});
metalTile('ironBlock', [216, 216, 216]);
metalTile('goldBlock', [246, 204, 58], true);
metalTile('diamondBlock', [98, 226, 218], true);
metalTile('emeraldBlock', [44, 196, 92], true);
metalTile('lapisBlock', [38, 70, 150], true);
metalTile('redstoneBlock', [170, 26, 10], true);
metalTile('coalBlock', [30, 30, 32]);
metalTile('copperBlock', [192, 108, 78]);
metalTile('exposedCopper', [160, 124, 102]);
metalTile('weatheredCopper', [106, 160, 110]);
metalTile('oxidizedCopper', [80, 160, 132]);
// Bronz: Eyfel Kulesi'nin koyu kahve metal rengi
metalTile('bronzeBlock', [104, 80, 62]);
// Kafes: saydam zeminde çerçeve ve çapraz destekler (kule ve köprü örgüsü)
const trussTile = (name, rgb) => paintTile(name, (x, y) => {
  if (edgeOf(x, y) || x === 1 || y === 1 || x === 14 || y === 14) return shade(rgb, x < 2 || y < 2 ? 1.1 : 0.8);
  if (Math.abs(x - y) <= 0.5 || Math.abs(x + y - 15) <= 0.5) return shade(rgb, 0.95);
  return null;
});
trussTile('ironTruss', [200, 200, 204]);
trussTile('bronzeTruss', [104, 80, 62]);
// Demir parmaklık: saydam zeminde dikey çubuklar, üstte ve altta yatay şerit
paintTile('ironBars', (x, y) => (y <= 1 || y >= 14) ? (y === 0 || y === 15 ? '#4a4a4a' : '#8f8f8f')
  : (x % 4 === 1) ? '#9a9a9a' : (x % 4 === 2) ? '#5e5e5e' : null);

// Taşlar
const brickTile = (name, rgb, mortar, rowH, brickW, extra) => paintTile(name, (x, y) => {
  const row = Math.floor(y / rowH), offset = row % 2 ? brickW / 2 : 0;
  if (y % rowH === rowH - 1 || (x + offset) % brickW === brickW - 1) return shade(mortar, 0.95 + rnd() * 0.1);
  return (extra && extra(x, y)) || grain(rgb, 0.18);
});
brickTile('stoneBricks', [124, 124, 124], [74, 74, 74], 8, 16);
brickTile('mossyStoneBricks', [124, 124, 124], [74, 74, 74], 8, 16, () => rnd() < 0.3 ? grain([86, 116, 56], 0.3) : null);
brickTile('deepslateBricks', [72, 72, 76], [36, 36, 40], 4, 8);
brickTile('purpurBlock', [170, 124, 170], [130, 92, 132], 8, 8);
brickTile('quartzBricks', [236, 230, 222], [196, 188, 180], 8, 8);
paintTile('chiseledStoneBricks', (x, y) => {
  if (edgeOf(x, y)) return shade([74, 74, 74], 1);
  const r = Math.hypot(x - 7.5, y - 7.5);
  return r > 3 && r < 4.6 ? shade([90, 90, 90], 1) : grain([124, 124, 124], 0.16);
});
const polishedTile = (name, rgb, spread) => paintTile(name, (x, y) => {
  if (edgeOf(x, y)) return shade(rgb, x === 0 || y === 0 ? 1.08 : 0.8);
  return grain(rgb, spread);
});
paintTile('granite', (x, y) => rnd() < 0.2 ? grain([180, 132, 112], 0.2) : grain([150, 104, 86], 0.25));
paintTile('diorite', (x, y) => rnd() < 0.25 ? grain([120, 120, 122], 0.2) : grain([196, 196, 198], 0.12));
paintTile('andesite', (x, y) => rnd() < 0.2 ? grain([110, 110, 112], 0.2) : grain([138, 138, 140], 0.18));
polishedTile('polishedGranite', [154, 106, 89], 0.08);
polishedTile('polishedDiorite', [192, 192, 194], 0.06);
polishedTile('polishedAndesite', [132, 134, 134], 0.08);
polishedTile('smoothStone', [160, 160, 160], 0.06);
polishedTile('quartzBlock', [236, 230, 222], 0.04);
polishedTile('cutSandstone', [218, 206, 154], 0.1);
polishedTile('terracotta', [152, 94, 68], 0.08);
paintTile('quartzPillar', (x, y) => x === 0 || x === 15 ? shade([190, 182, 172], 1) : x % 5 === 2 ? shade([214, 208, 200], 1) : grain([236, 230, 222], 0.04));
paintTile('quartzPillarTop', (x, y) => {
  const r = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
  return r > 6.5 ? shade([190, 182, 172], 1) : Math.floor(r) === 4 ? shade([214, 208, 200], 1) : grain([236, 230, 222], 0.04);
});
paintTile('prismarine', (x, y) => grain(rnd() < 0.3 ? [76, 140, 130] : [100, 170, 156], 0.2));

// Ahşap: tahtalar ve kütükler
const planksTile = (name, rgb) => paintTile(name, (x, y) => {
  const row = Math.floor(y / 4), seam = y % 4 === 3 || (x + row * 5) % 16 === 0;
  return seam ? shade(rgb, 0.7) : grain(rgb, 0.2);
});
planksTile('sprucePlanks', [116, 86, 50]);
planksTile('birchPlanks', [198, 180, 124]);
planksTile('darkOakPlanks', [68, 44, 22]);
planksTile('acaciaPlanks', [170, 92, 52]);
paintTile('birchLog', (x, y) => (rnd() < 0.08 || (y % 5 === 2 && x % 7 < 3)) ? shade([46, 44, 40], 1) : grain([218, 216, 210], 0.1));
paintTile('darkOakLog', (x, y) => shade([62, 46, 28], (x % 3 === 0 ? 0.75 : 1) * (0.85 + rnd() * 0.3)));
paintTile('logTopLight', (x, y) => {
  const r = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
  return r > 6.5 ? shade([200, 196, 186], 1) : grain(Math.floor(r) % 2 ? [206, 186, 132] : [186, 166, 112], 0.15);
});
paintTile('logTopDark', (x, y) => {
  const r = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
  return r > 6.5 ? shade([62, 46, 28], 1) : grain(Math.floor(r) % 2 ? [92, 66, 36] : [76, 54, 28], 0.15);
});

// Diğer yapı blokları
paintTile('snowBlock', () => grain([246, 248, 252], 0.05));
paintTile('clay', () => grain([160, 166, 180], 0.12));
paintTile('gravel', () => grain(rnd() < 0.3 ? [100, 92, 90] : rnd() < 0.5 ? [150, 142, 140] : [126, 120, 118], 0.2));
paintTile('bookshelf', (x, y) => {
  if (y < 1 || y > 14 || y === 7 || y === 8) return shade([168, 131, 79], y === 7 || y === 8 ? 0.7 : 1);
  const book = Math.floor(x / 2), colors = [[140, 40, 40], [50, 70, 130], [60, 110, 50], [150, 120, 50], [100, 50, 110], [140, 40, 40], [50, 70, 130], [60, 110, 50]];
  return x % 2 ? shade(colors[(book + (y > 7 ? 3 : 0)) % 8], 0.7) : shade(colors[(book + (y > 7 ? 3 : 0)) % 8], 1);
});
paintTile('seaLantern', (x, y) => edgeOf(x, y) ? '#9bc6bc' : (x === y || x === 15 - y) ? '#f4fffb' : grain([196, 228, 220], 0.1));
paintTile('lamp', (x, y) => edgeOf(x, y) || x === 7 || y === 7 ? shade([110, 70, 40], 1) : grain([250, 200, 110], 0.15));
paintTile('haySide', (x, y) => y === 3 || y === 12 ? shade([120, 80, 20], 1) : grain([200, 166, 40], 0.25));
paintTile('hayTop', () => grain([190, 156, 36], 0.3));
// Füme cam: opak, gök yansıtan koyu mavi-gri cephe camı; ince açık çerçeve ve çapraz parlama
paintTile('tintedGlass', (x, y) => edgeOf(x, y) ? '#9aa6b2' : (x + y === 12 || x + y === 13) && x > 3 ? '#b8d0e6' : shade([58, 78, 100], 0.9 + y / 80 + rnd() * 0.06));

// 16 renk: beton (düz), yün (dokulu), renkli cam (yarı saydam, çerçeveli)
const DYES = [
  ['white', 'Beyaz', [208, 214, 216], [234, 236, 237]], ['orange', 'Turuncu', [224, 98, 2], [240, 118, 20]],
  ['magenta', 'Eflatun', [170, 48, 160], [190, 68, 180]], ['light_blue', 'Açık mavi', [36, 138, 200], [58, 176, 218]],
  ['yellow', 'Sarı', [240, 176, 22], [248, 198, 40]], ['lime', 'Açık yeşil', [94, 170, 24], [112, 186, 26]],
  ['pink', 'Pembe', [214, 102, 144], [238, 142, 172]], ['gray', 'Gri', [56, 58, 62], [62, 68, 72]],
  ['light_gray', 'Açık gri', [126, 126, 116], [142, 142, 134]], ['cyan', 'Camgöbeği', [22, 120, 136], [22, 138, 146]],
  ['purple', 'Mor', [100, 32, 156], [122, 42, 172]], ['blue', 'Mavi', [46, 48, 144], [54, 58, 158]],
  ['brown', 'Kahverengi', [96, 60, 32], [114, 72, 40]], ['green', 'Yeşil', [74, 92, 36], [84, 110, 28]],
  ['red', 'Kırmızı', [142, 34, 34], [162, 40, 34]], ['black', 'Siyah', [10, 12, 16], [22, 22, 26]],
];
for (const [key, , concrete, wool] of DYES) {
  paintTile(key + 'Concrete', () => grain(concrete, 0.04));
  paintTile(key + 'Wool', (x, y) => grain(wool, (x + y * 3) % 5 === 0 ? 0.35 : 0.14));
  paintTile(key + 'Glass', (x, y) => edgeOf(x, y) ? shade(wool, 0.85) : (x === y + 3 && x > 4 && x < 9) ? shade(wool, 1.3) : shade(wool, 1));
}
