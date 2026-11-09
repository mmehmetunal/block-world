// ---------- Dünya üretimi ----------
// Dünya dizisi, gürültü fonksiyonları, biyomlar ve chunk başına dünya üretimi (arazi, mağara, göl, cevher, ağaç, bitki).

// SY: dünya yüksekliği (yapı videoları için 256). Nether yalnızca alttaki NETHER_H bloğu kullanır.
const SY = 256, NETHER_H = 48, CH = 16, SEED = 20261106;
// Doğma noktası: başlangıç alanının (ilk 96×96 blok) ortası
const SPAWN_X = 48, SPAWN_Z = 48;
// Sonsuz dünya: chunk haritası "cx,cz" -> Uint16Array(CH × SY × CH) (blok kimliği 16 bit), hücre indeksi (y * CH + lz) * CH + lx.
// Etkin dünya (world) ana dünyanın ya da Nether'in haritasıdır; portaldan geçince değişir (nether.js).
const worlds = { overworld: new Map(), nether: new Map() };
let world = worlds.overworld;
// Oyuncunun değiştirdiği chunk'lar: kayda yazılır ve bellekten silinmez.
const modifiedChunks = { overworld: new Set(), nether: new Set() };
const chunkKey = (cx, cz) => cx + ',' + cz;
const chunkAt = (x, z) => world.get(chunkKey(Math.floor(x / CH), Math.floor(z / CH)));
const cellIndex = (x, y, z) => (y * CH + (z - Math.floor(z / CH) * CH)) * CH + (x - Math.floor(x / CH) * CH);
// Yüklü bir chunk'ın içinde mi
const inBounds = (x, y, z) => y >= 0 && y < SY && !!chunkAt(x, z);
// Chunk dizisinde dolu olan en yüksek katman + 1 (çizim ve meşale taraması üstteki boş havayı atlar).
// Değer dizinin "top" alanında önbelleklenir; set() yükseltir, kırılan blok düşürmez (fazladan tarama zararsız).
function chunkTop(c) {
  if (c.top === undefined) {
    let i = c.length - 1;
    while (i >= 0 && !c[i]) i--;
    c.top = i < 0 ? 0 : Math.floor(i / (CH * CH)) + 1;
  }
  return c.top;
}
// (x, z) sütununda bunun üstü boştur (chunk yoksa dünyanın tepesi)
const columnTop = (x, z) => { const c = chunkAt(x, z); return c ? chunkTop(c) : SY; };
// Yüklenmemiş chunk hava döner; y < 0 taş (altta delik görünmesin).
function get(x, y, z) {
  if (y < 0) return B.stone;
  if (y >= SY) return AIR;
  const c = chunkAt(x, z);
  return c ? c[cellIndex(x, y, z)] : AIR;
}
// onBlockSet: dünya üretildikten sonra fluids.js bağlar (değişen hücrenin çevresindeki sıvılar yeniden hesaplanır).
let onBlockSet = null, generatingChunk = false;
function set(x, y, z, v) {
  if (y < 0 || y >= SY) return;
  const c = chunkAt(x, z);
  if (!c) return;
  c[cellIndex(x, y, z)] = v;
  if (v !== AIR && c.top !== undefined && y >= c.top) c.top = y + 1;
  if (generatingChunk) return;
  modifiedChunks[dimension].add(chunkKey(Math.floor(x / CH), Math.floor(z / CH)));
  if (onBlockSet) onBlockSet(x, y, z);
}
// Chunk yoksa üretir (dim verilmezse etkin dünyada). Üretildiyse true.
function ensureChunk(cx, cz, dim) {
  const map = dim ? worlds[dim] : world, key = chunkKey(cx, cz);
  if (map.has(key)) return false;
  const previous = world;
  world = map;
  map.set(key, new Uint16Array(CH * SY * CH));
  generatingChunk = true;
  (map === worlds.nether ? generateNetherChunk : generateChunk)(cx, cz);
  generatingChunk = false;
  world = previous;
  return true;
}
// (x, z) bloğunun chunk'ı ve r chunk çevresi
function ensureArea(x, z, r, dim) {
  const pcx = Math.floor(x / CH), pcz = Math.floor(z / CH);
  for (let cz = pcz - r; cz <= pcz + r; cz++) for (let cx = pcx - r; cx <= pcx + r; cx++) ensureChunk(cx, cz, dim);
}

function hash(x, z) {
  let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263) + SEED) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function valueNoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
}
// 3B değer gürültüsü (mağaralar için): köşe değerleri arasında yumuşak üç doğrusal karışım
function hash3(x, y, z) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 1442695041) + Math.imul(z, 668265263) + SEED) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function valueNoise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const s = t => t * t * (3 - 2 * t);
  const fx = s(x - xi), fy = s(y - yi), fz = s(z - zi);
  const lerp = (a, b, t) => a + (b - a) * t;
  const corner = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
  const plane = dy => lerp(lerp(corner(0, dy, 0), corner(1, dy, 0), fx), lerp(corner(0, dy, 1), corner(1, dy, 1), fx), fz);
  return lerp(plane(0), plane(1), fy);
}
function fbm(x, z) {
  let sum = 0, amp = 0.5, freq = 1;
  for (let o = 0; o < 4; o++) { sum += valueNoise(x * freq, z * freq) * amp; amp *= 0.5; freq *= 2; }
  return sum / 0.9375;
}

// ---------- Biyomlar ----------
// Düşük frekanslı iki gürültü: sıcaklık ve nem. Çöl sıcak ve kuru, karlı soğuk, orman nemli, gerisi ova.
const BIOME_SCALE = 64;
// Kaydırmalar, 96×96 başlangıç alanında dört biyomun da görüneceği ve doğma noktasının ova/orman olacağı biçimde seçildi.
const temperatureAt = (x, z) => fbm(x / BIOME_SCALE + 1138.8, z / BIOME_SCALE + 483.6);
const humidityAt = (x, z) => fbm(x / BIOME_SCALE - 700, z / BIOME_SCALE - 700);
function biomeAt(x, z) {
  const t = temperatureAt(x, z), m = humidityAt(x, z);
  if (t > 0.57 && m < 0.47) return 'desert';
  if (t < 0.42) return 'snowy';
  if (m > 0.56) return 'forest';
  return 'plains';
}
const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
// Yükseklik bütün biyomlarda aynı gürültüden gelir; çöl sürekli bir çarpanla düzleşir, böylece sınırlar yumuşak geçer.
function heightAt(x, z) {
  const desertness = smooth(0.52, 0.62, temperatureAt(x, z)) * smooth(0.52, 0.42, humidityAt(x, z));
  return Math.floor(6 + Math.pow(fbm(x / 36, z / 36), 1.4) * 34 * (1 - 0.4 * desertness));
}
// Çimen ve yaprak tonu (köşe rengi çarpanı)
const BIOME_TINT = { plains: [1, 1, 1], forest: [0.8, 0.9, 0.78], desert: [1.1, 1.04, 0.74], snowy: [0.85, 0.95, 0.95] };

// Göller: y ≤ 12'de, arazi yüzeyinin üstünde kalan boşluklar suyla dolar (mağaralar kuru kalır); karlıda yüzey buz.
const WATER_LEVEL = 12;
// Mağaralar: iki 3B gürültünün aynı anda 0,5'e yakın olduğu yerler kıvrımlı tüneller oluşturur.
// y = 2 ile yüzeyin 4 altı arasında oyulur; yamaçlarda alçak komşu sütunlara ağız açar.
const CAVE_RADIUS = 0.075;
// Chunk'a özgü, tohum ve koordinattan belirlenen rastgele sayı üreteci
const chunkRandom = (cx, cz, salt) => mulberry32(Math.floor(hash(cx * 7919 + salt, cz * 104729 - salt) * 4294967296));

// Bir chunk'ı üretir. Her şey tohum ve koordinata bağlıdır: aynı chunk her zaman aynı çıkar.
// Ağaçlar ve damarlar chunk'ın içinde kalır (komşu chunk'a taşmaz).
function generateChunk(cx, cz) {
  const x0 = cx * CH, z0 = cz * CH;
  const heights = new Int16Array(CH * CH), biomes = [];
  for (let lz = 0; lz < CH; lz++) for (let lx = 0; lx < CH; lx++) {
    const x = x0 + lx, z = z0 + lz, h = heightAt(x, z), biome = biomeAt(x, z);
    heights[lz * CH + lx] = h;
    biomes[lz * CH + lx] = biome;
    for (let y = 0; y <= h; y++) {
      let b = B.stone;
      if (h <= 14) b = y > h - 3 ? B.sand : B.stone;
      else if (biome === 'desert') b = y > h - 4 ? B.sand : y > h - 7 ? B.sandstone : B.stone;
      else if (y === h) b = biome === 'snowy' ? B.snowy_grass : B.grass;
      else if (y > h - 4) b = B.dirt;
      set(x, y, z, b);
    }
    for (let y = 2; y <= h - 4; y++) {
      const a = valueNoise3(x / 14, y / 9, z / 14) - 0.5, c = valueNoise3(x / 14 + 57, y / 9 + 31, z / 14 + 83) - 0.5;
      if (a * a + c * c < CAVE_RADIUS * CAVE_RADIUS) set(x, y, z, AIR);
    }
  }
  const local = (lx, lz) => [x0 + lx, z0 + lz];
  // Obsidyen: ~1 öbek, y ≤ 8'deki mağara tabanlarında 2–4 blok
  const obsidianRnd = chunkRandom(cx, cz, 13);
  for (let attempt = 0; attempt < 20; attempt++) {
    const [x, z] = local(Math.floor(obsidianRnd() * CH), Math.floor(obsidianRnd() * CH));
    const y = 2 + Math.floor(obsidianRnd() * 7);
    if (get(x, y, z) !== AIR || get(x, y - 1, z) !== B.stone) continue;
    const size = 2 + Math.floor(obsidianRnd() * 3);
    for (let i = 0, ox = x, oz = z; i < size; i++) {
      if (get(ox, y - 1, oz) === B.stone && get(ox, y, oz) === AIR) set(ox, y - 1, oz, B.obsidian);
      const step = obsidianRnd() < 0.5 ? 1 : -1;
      if (obsidianRnd() < 0.5) ox = Math.max(x0, Math.min(x0 + CH - 1, ox + step)); else oz = Math.max(z0, Math.min(z0 + CH - 1, oz + step));
    }
    break;
  }
  for (let lz = 0; lz < CH; lz++) for (let lx = 0; lx < CH; lx++) {
    const [x, z] = local(lx, lz);
    for (let y = heights[lz * CH + lx] + 1; y <= WATER_LEVEL; y++) {
      if (get(x, y, z) === AIR) set(x, y, z, y === WATER_LEVEL && biomes[lz * CH + lx] === 'snowy' ? B.ice : B.water);
    }
  }
  // Cevher damarları: kömür ~8 (y ≤ 30), demir ~4 (y ≤ 20), 3–8 blokluk; elmas ~1 (y ≤ 10), 1–4 blokluk. Yalnızca taşın içinde.
  const oreRnd = chunkRandom(cx, cz, 7);
  const vein = (ore, maxY, minSize = 3, maxSize = 8) => {
    let x = x0 + Math.floor(oreRnd() * CH), y = 1 + Math.floor(oreRnd() * maxY), z = z0 + Math.floor(oreRnd() * CH);
    const size = minSize + Math.floor(oreRnd() * (maxSize - minSize + 1));
    for (let i = 0; i < size; i++) {
      if (get(x, y, z) === B.stone) set(x, y, z, ore);
      const axis = Math.floor(oreRnd() * 3), step = oreRnd() < 0.5 ? -1 : 1;
      if (axis === 0) x = Math.max(x0, Math.min(x0 + CH - 1, x + step));
      else if (axis === 1) y = Math.max(1, Math.min(maxY, y + step));
      else z = Math.max(z0, Math.min(z0 + CH - 1, z + step));
    }
  };
  for (let i = 0; i < 8; i++) vein(B.coal_ore, 30);
  for (let i = 0; i < 4; i++) vein(B.iron_ore, 20);
  vein(B.diamond_ore, 10, 1, 4);
  // Ağaç ve kaktüs: biyoma göre deneme sayısı; chunk kenarından 2 blok içeride
  const treeRnd = chunkRandom(cx, cz, 1);
  const TREES = { forest: 7, plains: 1, snowy: 3, desert: 2 };
  for (let attempt = 0; attempt < 8; attempt++) {
    const lx = 2 + Math.floor(treeRnd() * (CH - 4)), lz = 2 + Math.floor(treeRnd() * (CH - 4)), roll = treeRnd();
    const biome = biomes[lz * CH + lx], h = heights[lz * CH + lx], [x, z] = local(lx, lz);
    if (attempt >= TREES[biome] || h > SY - 10) continue;
    const ground = get(x, h, z);
    if (biome === 'desert') {
      if (ground !== B.sand || get(x, h + 1, z) !== AIR) continue;
      const tall = 1 + Math.floor(roll * 3);
      for (let y = 1; y <= tall; y++) set(x, h + y, z, B.cactus);
    } else if (biome === 'snowy') {
      if (ground !== B.snowy_grass) continue;
      // Ladin: 6–7 blok gövde, aşağıdan yukarı daralan koni
      const trunk = 6 + Math.floor(roll * 2);
      for (let y = 1; y <= trunk; y++) set(x, h + y, z, B.spruce_log);
      for (let dy = 2; dy <= trunk + 1; dy++) {
        const r = dy > trunk ? 0 : dy >= trunk - 1 ? 1 : (trunk - dy) % 2 ? 2 : 1;
        for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
          if (r && Math.abs(dx) === r && Math.abs(dz) === r) continue;
          if (get(x + dx, h + dy, z + dz) === AIR) set(x + dx, h + dy, z + dz, B.spruce_leaves);
        }
      }
    } else {
      if (ground !== B.grass || (biome === 'plains' && roll > 0.6)) continue;
      const trunk = 4 + Math.floor(roll * 2);
      for (let y = 1; y <= trunk; y++) set(x, h + y, z, B.log);
      const top = h + trunk;
      for (let dy = -2; dy <= 1; dy++) {
        const r = dy >= 0 ? 1 : 2;
        for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) === r && Math.abs(dz) === r && treeRnd() < 0.5) continue;
          if (get(x + dx, top + dy, z + dz) === AIR) set(x + dx, top + dy, z + dz, B.leaves);
        }
      }
      set(x, top + 2, z, B.leaves);
    }
  }
  // Ot ve çiçek: ovada %15 uzun ot ve %3 çiçek, ormanda %8 ve %1
  const PLANTS = { plains: [0.15, 0.18], forest: [0.08, 0.09] };
  for (let lz = 0; lz < CH; lz++) for (let lx = 0; lx < CH; lx++) {
    const chance = PLANTS[biomes[lz * CH + lx]];
    if (!chance) continue;
    const [x, z] = local(lx, lz);
    // Ağaç ve köy yapılarının üstünden başlar (256 blokluk sütunun tamamını taramaz)
    let y = Math.min(SY - 1, heights[lz * CH + lx] + 16);
    while (y > 0 && get(x, y - 1, z) === AIR) y--;
    if (get(x, y - 1, z) !== B.grass || get(x, y, z) !== AIR) continue;
    const r = hash(x * 3 + 11, z * 5 - 7);
    if (r < chance[0]) set(x, y, z, B.tall_grass);
    else if (r < chance[1]) set(x, y, z, hash(x, z * 3) < 0.5 ? B.poppy : B.dandelion);
  }
  placeVillageParts(cx, cz);
}
