// ---------- Eşyalar ----------
// Eşya tablosu (ITEMS), simgeler, aletler, yemekler, yerdeki eşyalar ve toplama.

// Eşya anahtarları İngilizcedir. Blok eşyalarının anahtarı B'deki adıyla aynıdır.
const ITEMS = {};
const BLOCK_ITEM = {};
for (const [key, id] of Object.entries(B)) { ITEMS[key] = { name: BLOCKS[id].name, block: id }; BLOCK_ITEM[id] = key; }
// Blok olmayan eşyalar: 8x8 piksel desen, 2 kat büyütülerek 16x16 çizilir.
const ITEM_ART = {
  raw_beef: ['Çiğ biftek', { r: '#c4302b', w: '#f0d0c8' }, ['..rrrr..', '.rrwrrr.', 'rrrrrwrr', 'rrwrrrrr', 'rrrrrrwr', '.rrrwrr.', '..rrrr..', '........']],
  raw_pork: ['Çiğ domuz eti', { r: '#f19a9a', w: '#ffd6d0' }, ['..rrrr..', '.rrwrrr.', 'rrrrrwrr', 'rrwrrrrr', 'rrrrrrwr', '.rrrwrr.', '..rrrr..', '........']],
  raw_chicken: ['Çiğ tavuk', { p: '#f3c7b4', w: '#f4f4f0' }, ['....pppp', '...ppppp', '..pppppp', '.ppppp..', '.pppp...', 'wpp.....', 'ww......', 'w.......']],
  feather: ['Tüy', { w: '#f4f4f0', g: '#9a9a9a' }, ['......ww', '.....www', '....www.', '...www..', '..www...', '.www....', 'gw......', 'g.......']],
  wool: ['Yün', { w: '#ececec', g: '#d6d6d6' }, ['wwwwwwww', 'wwgwwwww', 'wwwwwgww', 'wgwwwwww', 'wwwwgwww', 'wwwwwwgw', 'wwgwwwww', 'wwwwwwww']],
  rotten_flesh: ['Çürük et', { g: '#6f8a3a', b: '#8a5a3a' }, ['..gggg..', '.ggbggg.', 'gggggbgg', 'ggbggggg', 'gggggbgg', '.ggbggg.', '..gggg..', '........']],
  bone: ['Kemik', { w: '#ecebe2' }, ['......ww', '.....www', '....ww..', '...ww...', '..ww....', 'www.....', 'ww......', '........']],
  arrow: ['Ok', { b: '#6b4a2b', g: '#9a9a9a', w: '#f4f4f0' }, ['......gg', '.....ggg', '....bg..', '...b....', '..b.....', 'wb......', 'ww......', 'w.......']],
  door: ['Kapı', { b: '#96693c', d: '#5c4024', g: '#a9cbe0' }, ['..dddd..', '..dggd..', '..dggd..', '..dbbd..', '..dbbd..', '..dbbd..', '..dbbd..', '..dddd..']],
  wheat: ['Buğday', { y: '#d6b44a', d: '#a8842a' }, ['......yy', '.....yd.', '....yy..', '...yd...', '..yy....', '.d......', 'd.......', '........']],
  bread: ['Ekmek', { b: '#c8883e', d: '#8a5a24', l: '#e8b870' }, ['........', '..bbbb..', '.blblbb.', 'bbbbbbbd', 'bbbbbbbd', '.dddddd.', '........', '........']],
  wheat_seeds: ['Buğday tohumu', { g: '#5f9a3a', d: '#3f6a22' }, ['........', '..g..d..', '....g...', '.d....g.', '...g....', '.g...d..', '....g...', '........']],
  bed: ['Yatak', { w: '#ececec', r: '#a8282a', b: '#7a5a32' }, ['........', '........', 'wwrrrrrr', 'wwrrrrrr', 'bbbbbbbb', 'b......b', '........', '........']],
  stick: ['Çubuk', { b: '#6b4a2b', l: '#8f6a40' }, ['......lb', '.....lb.', '....lb..', '...lb...', '..lb....', '.lb.....', 'lb......', '........']],
  torch: ['Meşale', { b: '#6b4a2b', y: '#ffd23a', o: '#ff8a1f' }, ['...yy...', '..yooy..', '...oo...', '...bb...', '...bb...', '...bb...', '...bb...', '........']],
  cooked_beef: ['Pişmiş biftek', { r: '#7a3e22', w: '#c08a5a' }, ['..rrrr..', '.rrwrrr.', 'rrrrrwrr', 'rrwrrrrr', 'rrrrrrwr', '.rrrwrr.', '..rrrr..', '........']],
  cooked_pork: ['Pişmiş domuz eti', { r: '#b8704a', w: '#e8b88a' }, ['..rrrr..', '.rrwrrr.', 'rrrrrwrr', 'rrwrrrrr', 'rrrrrrwr', '.rrrwrr.', '..rrrr..', '........']],
  cooked_chicken: ['Pişmiş tavuk', { p: '#c8823e', w: '#f4f4f0' }, ['....pppp', '...ppppp', '..pppppp', '.ppppp..', '.pppp...', 'wpp.....', 'ww......', 'w.......']],
  glowstone_dust: ['Işıltı tozu', { y: '#ffd860', o: '#d8a030' }, ['........', '.y..o...', '...y..y.', '.o..y...', '..y...o.', '.y..y...', '...o..y.', '........']],
  flint_and_steel: ['Çakmak', { i: '#c8c8c8', d: '#8a8a8a', k: '#2a2a2a', o: '#ff8a1f' }, ['......o.', '.....o..', '..iii...', '.i...i..', '.i...i..', '..iii...', '...kk...', '...kk...']],
  iron_ingot: ['Demir külçe', { w: '#e6e6e6', g: '#b8b8b8', d: '#8a8a8a' }, ['........', '........', '..wwwww.', '.wwwwwgd', 'wggggggd', 'dddddddd', '........', '........']],
  charcoal: ['Odun kömürü', { k: '#2a2219', g: '#4a3a2a' }, ['........', '..kkkk..', '.kkgkkk.', '.kkkkgk.', '.kgkkkk.', '.kkkkkk.', '..kkkk..', '........']],
  apple: ['Elma', { r: '#d0302c', d: '#9a1f1c', g: '#4f8a2a', b: '#6b4a2b' }, ['....b...', '...bg...', '.rrrrrr.', 'rrrrrrdr', 'rrrrrrdr', 'rrrrrddr', '.rrrrdd.', '..rrrr..']],
  diamond: ['Elmas', { c: '#6ff0e0', d: '#2bb5a8', w: '#e8fffc' }, ['........', '..cccc..', '.cwcccc.', 'cwccccdc', '.cccccd.', '..cccd..', '...cd...', '........']],
  string: ['İp', { w: '#f0f0f0' }, ['........', '.w......', '..w.....', '..w.....', '...w....', '...ww...', '.....w..', '......w.']],
  coal: ['Kömür', { k: '#1e1e1e', g: '#3c3c3c' }, ['........', '..kkkk..', '.kkgkkk.', '.kkkkgk.', '.kgkkkk.', '.kkkkkk.', '..kkkk..', '........']],
};
// Minecraft simgelerindeki koyu kenar: dolu bir komşusu olan saydam pikseller o komşunun koyu tonuyla boyanır.
function outlineIcon(c) {
  const ctx = c.getContext('2d'), img = ctx.getImageData(0, 0, 16, 16), d = img.data, out = new Uint8ClampedArray(d);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const i = (y * 16 + x) * 4;
    if (d[i + 3]) continue;
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || ny < 0 || nx > 15 || ny > 15) continue;
      const j = (ny * 16 + nx) * 4;
      if (!d[j + 3]) continue;
      out[i] = d[j] * 0.3; out[i + 1] = d[j + 1] * 0.3; out[i + 2] = d[j + 2] * 0.3; out[i + 3] = 255;
      break;
    }
  }
  ctx.putImageData(new ImageData(out, 16, 16), 0, 0);
  return c;
}
// 8x8 desen 2 kat büyütülerek 16x16 çizilir; sonra koyu kenar eklenir.
function pixelArt(rows, palette) {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const ic = c.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (palette[ch]) { ic.fillStyle = palette[ch]; ic.fillRect(x * 2, y * 2, 2, 2); } }));
  return outlineIcon(c);
}
for (const [key, [name, palette, rows]] of Object.entries(ITEM_ART)) ITEMS[key] = { name, canvas: pixelArt(rows, palette) };
// Aletler: Minecraft'taki gibi sol alttan sağ üste çapraz sap ve sağ üstte baş; koyu kenarlı 16x16.
function drawTool(kind, head, dark) {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d');
  const px = (x, y, color) => { g.fillStyle = color; g.fillRect(x, y, 1, 1); };
  const stickLength = { pickaxe: 9, axe: 9, shovel: 8, hoe: 9, sword: 3 }[kind];
  for (let i = 0; i <= stickLength; i++) { px(2 + i, 13 - i, '#9a6e3e'); px(2 + i, 14 - i, '#5e4022'); }
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (kind === 'pickaxe') {
      // Sapın ucunu ortalayan yay biçimli baş
      const r = Math.hypot(x - 2, y - 13), a = Math.atan2(13 - y, x - 2) * 180 / Math.PI;
      if (r >= 9.2 && r <= 11.4 && a >= 6 && a <= 84) px(x, y, r > 10.3 ? head : dark);
    } else if (kind === 'axe') {
      // Sap ucunun solunda geniş ağız
      // Sapın ucunun sol üstünde kalın ağız: satır -> [ilk x, son x]
      const rows = { 1: [7, 9], 2: [5, 10], 3: [4, 10], 4: [4, 9], 5: [5, 8], 6: [6, 7] };
      const r = rows[y];
      if (r && x >= r[0] && x <= r[1]) px(x, y, x <= r[0] + 1 ? head : x >= 9 ? dark : head);
    } else if (kind === 'shovel') {
      // Sapın ucunda yuvarlak kürek ağzı
      if (Math.hypot(x - 12, y - 3.5) <= 3.2) px(x, y, x - y > 8 ? head : dark);
    } else if (kind === 'hoe') {
      // Sap ucundan sola uzanan yatay ağız
      if ((y === 2 && x >= 7 && x <= 12) || (y === 3 && x >= 7 && x <= 9)) px(x, y, y === 2 ? head : dark);
    } else if (kind === 'sword') {
      // Uzun çapraz bıçak, dik siper
      const t = x - 6, onBlade = t >= 0 && t <= 8 && (y === 9 - t || y === 10 - t) && x <= 14;
      if (onBlade) px(x, y, y === 9 - t ? head : dark);
      if ((x === 3 && y === 9) || (x === 4 && y === 10) || (x === 6 && y === 12) || (x === 7 && y === 13)) px(x, y, '#3a2a1a');
    }
  }
  return outlineIcon(c);
}
// Aletler: 4 seviye x 4 tür. tool: tür, speed: doğru blokta hız çarpanı, durability: kullanım hakkı, damage: vuruş hasarı.
const TOOL_TIERS = {
  wooden: { name: 'Tahta', tier: 1, head: '#c4995a', dark: '#8a6536', speed: 2, durability: 60, material: 'planks' },
  stone: { name: 'Taş', tier: 2, head: '#a5a5a5', dark: '#6e6e6e', speed: 4, durability: 132, material: 'cobble' },
  iron: { name: 'Demir', tier: 3, head: '#f0f0f0', dark: '#b4b4b4', speed: 6, durability: 251, material: 'iron_ingot' },
  diamond: { name: 'Elmas', tier: 4, head: '#6ff0e0', dark: '#2bb5a8', speed: 8, durability: 1562, material: 'diamond' },
};
// damage: seviye sırasıyla [tahta, taş, demir, elmas]. Desen: M malzeme, S çubuk.
const TOOL_KINDS = {
  pickaxe: { name: 'kazma', damage: [2, 3, 4, 5], pattern: ['MMM', '.S.', '.S.'] },
  axe: { name: 'balta', damage: [3, 3, 5, 6], pattern: ['MM', 'MS', '.S'] },
  shovel: { name: 'kürek', damage: [2, 2, 3, 4], pattern: ['M', 'S', 'S'] },
  sword: { name: 'kılıç', damage: [4, 5, 6, 7], pattern: ['M', 'M', 'S'] },
};
for (const [tierKey, tier] of Object.entries(TOOL_TIERS)) Object.entries(TOOL_KINDS).forEach(([kindKey, kind]) => {
  ITEMS[`${tierKey}_${kindKey}`] = {
    name: `${tier.name} ${kind.name}`, canvas: drawTool(kindKey, tier.head, tier.dark), tool: kindKey, speed: tier.speed,
    durability: tier.durability, damage: kind.damage[tier.tier - 1], tier: tier.tier,
  };
});
ITEMS.wooden_hoe = { name: 'Tahta çapa', canvas: drawTool('hoe', TOOL_TIERS.wooden.head, TOOL_TIERS.wooden.dark), tool: 'hoe', tier: 1, speed: 1, durability: 60, damage: 1 };
// Yemekler: doldurduğu açlık puanı
Object.assign(ITEMS.raw_beef, { food: 3 });
Object.assign(ITEMS.raw_pork, { food: 3 });
Object.assign(ITEMS.raw_chicken, { food: 2 });
Object.assign(ITEMS.cooked_beef, { food: 8 });
Object.assign(ITEMS.cooked_pork, { food: 8 });
Object.assign(ITEMS.cooked_chicken, { food: 6 });
Object.assign(ITEMS.rotten_flesh, { food: 2 });
Object.assign(ITEMS.apple, { food: 4 });
Object.assign(ITEMS.bread, { food: 5 });
Object.assign(ITEMS.flint_and_steel, { durability: 64 });
ITEMS.furnace_lit.hidden = true; // yalnızca dünyada; kırılınca fırın düşer
const extraOf = s => s.durability !== undefined ? { durability: s.durability } : {};

// HUD'da kullanılacak simge (data URL)
// Bloklar Minecraft envanterindeki gibi izometrik küp olarak çizilir: üst yüz en açık, sol yüz biraz, sağ yüz daha koyu.
// Şekilli bloklar (merdiven, yarım blok, çit, duvar) kutuları arkadan öne çizilerek; demir parmaklık düz doku olarak.
function blockIcon(def) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  if (def.shape === 'bars') { g.drawImage(atlas, def.side * T, 0, T, T, 0, 0, 64, 64); return c.toDataURL(); }
  // Hücre noktasının simgedeki yeri: küpün köşeleri üst (32, 2), sağ (62, 17), alt (32, 32), sol (2, 17); yan yüzler 30 piksel iner.
  const at = (x, y, z) => [32 + (x - z) * 30, 2 + (x + z) * 15 + (1 - y) * 30];
  // Dokunun (sx, sy, sw, sh) piksel bölgesi, iki eksen vektörüyle simgeye
  const face = (tile, [sx, sy, sw, sh], a, b, cc, d, [e, f], shadow) => {
    g.setTransform(a, b, cc, d, e, f);
    g.drawImage(atlas, tile * T + sx, sy, sw, sh, 0, 0, sw, sh);
    if (shadow) { g.fillStyle = `rgba(0, 0, 0, ${shadow})`; g.fillRect(0, 0, sw, sh); }
  };
  const boxes = def.model === 'shape' ? [...shapeIconBoxes(def)].sort((p, q) => p[0] + p[1] + p[2] - q[0] - q[1] - q[2]) : [[0, 0, 0, 1, 1, 1]];
  for (const [x0, y0, z0, x1, y1, z1] of boxes) {
    const [X0, Y0, Z0, X1, Y1, Z1] = [x0, y0, z0, x1, y1, z1].map(v => v * T);
    face(def.top, [X0, Z0, X1 - X0, Z1 - Z0], 30 / 16, 15 / 16, -30 / 16, 15 / 16, at(x0, y1, z0), 0);
    face(def.side, [X0, T - Y1, X1 - X0, Y1 - Y0], 30 / 16, 15 / 16, 0, 30 / 16, at(x0, y1, z1), 0.25);
    face(def.side, [T - Z1, T - Y1, Z1 - Z0, Y1 - Y0], 30 / 16, -15 / 16, 0, 30 / 16, at(x1, y1, z1), 0.45);
  }
  return c.toDataURL();
}
const iconCache = {};
function itemIcon(key) {
  if (!iconCache[key]) iconCache[key] = ITEMS[key].block ? blockIcon(BLOCKS[ITEMS[key].block]) : ITEMS[key].canvas.toDataURL();
  return iconCache[key];
}

// Ölen canlının düşürdükleri: [eşya, en az, en çok]
const MOB_DROPS = {
  cow: [['raw_beef', 1, 3]], pig: [['raw_pork', 1, 3]], chicken: [['raw_chicken', 1, 1], ['feather', 0, 2]],
  sheep: [['wool', 1, 1]], zombie: [['rotten_flesh', 0, 2]], skeleton: [['bone', 0, 2], ['arrow', 0, 2]],
};
function dropLoot(m) {
  for (const [key, min, max] of MOB_DROPS[m.kind] || []) {
    const count = min + Math.floor(Math.random() * (max - min + 1));
    for (let i = 0; i < count; i++) dropItem(key, m.x, m.y + 0.5, m.z);
  }
}

// Yerdeki eşyalar: 0,25'lik küp (blok) ya da yarım blokluk 3B eşya modeli; döner, hafifçe inip kalkar, 5 dk sonra kaybolur.
const ITEM_LIFETIME = 300, PICKUP_RANGE = 1.5;
const drops = [];
const dropBlockMaterial = new THREE.MeshBasicMaterial({ map: texture });
// Eşyanın 3B modeli (Minecraft'taki gibi kabartmalı): simgenin her dolu pikseli 1 piksel kalınlığında küçük bir küp.
// Model 1 blok boyunda, XY düzleminde ve ortalıdır; renkler köşe rengidir (önde tam, arkada ve yanlarda gölgeli).
const itemModelMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
const itemGeometries = {};
// Simgesi olmayan bloklar (bitkiler) kendi dokusuyla
function itemCanvas(key) {
  const item = ITEMS[key];
  if (item.canvas) return item.canvas;
  const c = document.createElement('canvas'); c.width = c.height = T;
  c.getContext('2d').drawImage(atlas, BLOCKS[item.block].side * T, 0, T, T, 0, 0, T, T);
  return c;
}
function itemGeometry(key) {
  if (itemGeometries[key]) return itemGeometries[key];
  const d = itemCanvas(key).getContext('2d').getImageData(0, 0, 16, 16).data;
  const solid = (x, y) => x >= 0 && y >= 0 && x < 16 && y < 16 && d[(y * 16 + x) * 4 + 3] > 127;
  const pos = [], col = [], idx = [], s = 1 / 16, h = s / 2;
  const quad = (pts, shade, r, g, b) => {
    const base = pos.length / 3;
    for (const p of pts) { pos.push(...p); col.push(r * shade, g * shade, b * shade); }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (!solid(x, y)) continue;
    const i = (y * 16 + x) * 4, [r, g, b] = [d[i] / 255, d[i + 1] / 255, d[i + 2] / 255];
    const x0 = x * s - 0.5, x1 = x0 + s, y1 = 0.5 - y * s, y0 = y1 - s;
    quad([[x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]], 1, r, g, b);
    quad([[x1, y0, -h], [x0, y0, -h], [x0, y1, -h], [x1, y1, -h]], 0.75, r, g, b);
    // Yan yüzler yalnızca boş komşuya bakan kenarlarda
    if (!solid(x, y - 1)) quad([[x0, y1, h], [x1, y1, h], [x1, y1, -h], [x0, y1, -h]], 0.9, r, g, b);
    if (!solid(x, y + 1)) quad([[x0, y0, -h], [x1, y0, -h], [x1, y0, h], [x0, y0, h]], 0.6, r, g, b);
    if (!solid(x - 1, y)) quad([[x0, y0, -h], [x0, y0, h], [x0, y1, h], [x0, y1, -h]], 0.7, r, g, b);
    if (!solid(x + 1, y)) quad([[x1, y0, h], [x1, y0, -h], [x1, y1, -h], [x1, y1, h]], 0.7, r, g, b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.userData.shared = true;
  return itemGeometries[key] = geo;
}
// Yerdeki eşya: blok 0,25'lik küp, diğerleri yarım blok boyunda 3B model
const DROP_ITEM_SIZE = 0.5;
function dropMesh(key) {
  const item = ITEMS[key];
  if (item.block) {
    const geo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    const def = BLOCKS[item.block], uv = geo.attributes.uv;
    // BoxGeometry yüzleri: +x, -x, +y, -y, +z, -z; her yüzde 4 köşe
    for (let f = 0; f < 6; f++) {
      const tile = f === 2 ? def.top : f === 3 ? def.bottom : def.side;
      for (let v = f * 4; v < f * 4 + 4; v++) uv.setX(v, (tile + uv.getX(v)) / N_TILES);
    }
    return new THREE.Mesh(geo, dropBlockMaterial);
  }
  const mesh = new THREE.Mesh(itemGeometry(key), itemModelMaterial);
  mesh.scale.setScalar(DROP_ITEM_SIZE);
  return mesh;
}
function dropItem(key, x, y, z) {
  const mesh = dropMesh(key);
  scene.add(mesh);
  const d = { key, x, y, z, w: 0.125, h: 0.25, vx: (Math.random() - 0.5) * 2, vy: 3, vz: (Math.random() - 0.5) * 2, onGround: false, age: 0, pickupDelay: 0, mesh };
  drops.push(d);
  return d;
}
function removeDrop(d) {
  scene.remove(d.mesh);
  // Eşya modelinin geometrisi ortaktır (önbellekte), yalnızca blok küpü atılır
  if (ITEMS[d.key].block && !d.mesh.geometry.userData.shared) d.mesh.geometry.dispose();
  drops.splice(drops.indexOf(d), 1);
}
// Envantere sığarsa toplanır; sığmazsa yerde kalır.
const collectItem = d => addItem(d.key, 1, d.extra) === 0;
function updateDrops(dt) {
  for (const d of [...drops]) {
    d.age += dt;
    if (d.age > ITEM_LIFETIME) { removeDrop(d); continue; }
    const dx = player.x - d.x, dy = player.y + 0.9 - d.y, dz = player.z - d.z, dist = Math.hypot(dx, dy, dz);
    d.pickupDelay = Math.max(0, (d.pickupDelay || 0) - dt);
    if (!dead && dist < PICKUP_RANGE && !d.pickupDelay) {
      // Oyuncuya doğru çekilir; yeterince yaklaşınca toplanır.
      if (dist < 0.6 && collectItem(d)) { toast('+1 ' + ITEMS[d.key].name); popSound(); removeDrop(d); continue; }
      d.x += dx / dist * 6 * dt; d.y += dy / dist * 6 * dt; d.z += dz / dist * 6 * dt;
    } else {
      const friction = d.onGround ? Math.exp(-dt * 8) : 1;
      d.vx *= friction; d.vz *= friction;
      d.vy = Math.max(d.vy - GRAVITY * dt, -20);
      stepEntity(d, dt);
    }
  }
}
function renderDrops() {
  for (const d of drops) {
    d.mesh.position.set(d.x, d.y + 0.15 + Math.sin(d.age * 3) * 0.05, d.z);
    d.mesh.rotation.y = d.age * 2;
  }
}
Object.assign(window.game, { drops, dropItem });

Object.assign(window.game, { itemIcon });
