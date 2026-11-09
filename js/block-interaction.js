// ---------- Blok kırma / koyma ----------
// Nişan ışını, kazma, blok kırma ve sağ tık etkileşimleri (koyma, masa, fırın, yatak, kapı).

// Nişan ışını her karede kameraya göre güncellenir (aim).
// start: ışının başlangıcından gözlere uzaklık (arkadan kamerada kamera mesafesi), canlı menzili buna eklenir.
const aim = { o: new THREE.Vector3(), d: new THREE.Vector3(), max: 6, start: 0 };
const MOB_REACH = 3.5, FIST_DAMAGE = 1;
let punch = 0;
function raycast() {
  const { o, d, max: maxDist } = aim;
  let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
  const sx = Math.sign(d.x), sy = Math.sign(d.y), sz = Math.sign(d.z);
  const tdx = sx ? Math.abs(1 / d.x) : Infinity, tdy = sy ? Math.abs(1 / d.y) : Infinity, tdz = sz ? Math.abs(1 / d.z) : Infinity;
  let tmx = sx > 0 ? (x + 1 - o.x) * tdx : sx < 0 ? (o.x - x) * tdx : Infinity;
  let tmy = sy > 0 ? (y + 1 - o.y) * tdy : sy < 0 ? (o.y - y) * tdy : Infinity;
  let tmz = sz > 0 ? (z + 1 - o.z) * tdz : sz < 0 ? (o.z - z) * tdz : Infinity;
  let px = x, py = y, pz = z, t = 0;
  while (t <= maxDist) {
    if (isTargetable(get(x, y, z))) return { x, y, z, px, py, pz, t };
    px = x; py = y; pz = z;
    if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; }
    else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; }
    else { z += sz; t = tmz; tmz += tdz; }
  }
  return null;
}
// Bakılan şey bloktan daha yakın bir canlıysa döner (vuruş ve kazma bunu kullanır).
function targetedMob(hit) {
  const mobHit = rayMob();
  return mobHit && (!hit || mobHit.t < hit.t) ? mobHit.mob : null;
}
// Sol tuşa basınca: canlıya bakılıyorsa vurur.
function attackMob() {
  punch = 0.25;
  // Ateş topuna vurmak onu geri çevirir (bloktan ve canlıdan yakınsa)
  const hit = raycast(), mobHit = rayMob();
  if (reflectFireball(Math.min(hit ? hit.t : Infinity, mobHit ? mobHit.t : Infinity))) return;
  const mob = targetedMob(hit);
  if (!mob) return;
  const tool = selectedTool();
  hurtMob(mob, tool ? ITEMS[tool.key].damage : FIST_DAMAGE, aim.d.x, aim.d.z);
  if (tool) useTool();
}
function breakBlockAt(hit) {
  const broken = get(hit.x, hit.y, hit.z);
  set(hit.x, hit.y, hit.z, AIR);
  blockSound(broken, 'break');
  spawnDebris(broken, hit.x, hit.y, hit.z, 12);
  // Bu bloğa dayanan meşaleler düşer
  // Kapının diğer yarısı da kalkar
  if (isDoor(broken)) {
    const oy = BLOCKS[broken].part === 'lower' ? hit.y + 1 : hit.y - 1;
    if (isDoor(get(hit.x, oy, hit.z))) set(hit.x, oy, hit.z, AIR);
  }
  // Yatağın diğer yarısı da kalkar (eşya bir kez düşer)
  if (isBed(broken)) {
    const def = BLOCKS[broken], sign = def.part === 'foot' ? 1 : -1;
    const ox = hit.x + def.dir[0] * sign, oz = hit.z + def.dir[1] * sign;
    if (isBed(get(ox, hit.y, oz))) { set(ox, hit.y, oz, AIR); rebuildAround(ox, oz); }
  }
  let torchChanged = isTorch(broken);
  // Üstündeki bitki de kalkar
  if (isPlant(get(hit.x, hit.y + 1, hit.z))) set(hit.x, hit.y + 1, hit.z, AIR);
  for (const [dx, dy, dz, id] of [[0, 1, 0, B.torch_floor], [1, 0, 0, B.torch_east], [-1, 0, 0, B.torch_west], [0, 0, 1, B.torch_south], [0, 0, -1, B.torch_north]]) {
    if (get(hit.x + dx, hit.y + dy, hit.z + dz) === id) {
      set(hit.x + dx, hit.y + dy, hit.z + dz, AIR);
      dropItem('torch', hit.x + dx + 0.5, hit.y + dy + 0.3, hit.z + dz + 0.5);
      torchChanged = true;
    }
  }
  if (torchChanged) rebuildArea(hit.x, hit.z, Math.ceil(TORCH_RANGE) + 1);
  else rebuildAround(hit.x, hit.z);
  // Yaprak %10 olasılıkla düşer; alet isteyen bloklar doğru alet olmadan kırılınca düşmez.
  const def = BLOCKS[broken], tool = selectedTool();
  if (tool) useTool();
  if (broken === B.furnace || broken === B.furnace_lit) removeFurnace(hit.x, hit.y, hit.z);
  if (broken === B.chest) removeChest(hit.x, hit.y, hit.z);
  // Çerçeveden obsidyen kırılınca bitişik portal söner
  if (broken === B.obsidian) extinguishPortalNear(hit.x, hit.y, hit.z);
  // Bitkiler eşya düşürmez; uzun ot %12 olasılıkla buğday tohumu verir.
  // Buğday: olgunsa 1 buğday + 1–3 tohum, değilse 1 tohum
  if (isCrop(broken)) {
    crops.delete(furnaceKey(hit.x, hit.y, hit.z));
    const mature = broken === B.wheat_3, seeds = mature ? 1 + Math.floor(Math.random() * 3) : 1;
    if (mature) dropItem('wheat', hit.x + 0.5, hit.y + 0.3, hit.z + 0.5);
    for (let n = 0; n < seeds; n++) dropItem('wheat_seeds', hit.x + 0.5, hit.y + 0.3, hit.z + 0.5);
    return;
  }
  if (def.noDrop) {
    if (broken === B.tall_grass && Math.random() < 0.12) dropItem('wheat_seeds', hit.x + 0.5, hit.y + 0.3, hit.z + 0.5);
    return;
  }
  if (def.needsTool && (!tool || ITEMS[tool.key].tool !== def.tool || ITEMS[tool.key].tier < (def.minTier || 1))) return;
  if (def.dropCount) {
    const [min, max] = def.dropCount, n = min + Math.floor(Math.random() * (max - min + 1));
    for (let i = 0; i < n; i++) dropItem(def.drop, hit.x + 0.5, hit.y + 0.3, hit.z + 0.5);
    return;
  }
  if (broken !== B.leaves || Math.random() < 0.1) dropItem(def.drop || BLOCK_ITEM[broken], hit.x + 0.5, hit.y + 0.3, hit.z + 0.5);
  if (broken === B.leaves && Math.random() < 0.05) dropItem('apple', hit.x + 0.5, hit.y + 0.3, hit.z + 0.5);
}

// Kazma ilerlemesi: aynı bloğa basılı tutuldukça dolar; hedef değişir ya da tuş bırakılırsa sıfırlanır.
const CRACK_STAGES = 10;
const crackTextures = (() => {
  // Ortadan dışa yürüyen rastgele çatlak pikselleri; her aşama öncekilere yenilerini ekler.
  const cr = mulberry32(77), pixels = [];
  for (let walk = 0; walk < 6; walk++) {
    let x = 7 + Math.floor(cr() * 3), y = 7 + Math.floor(cr() * 3);
    for (let i = 0; i < 22; i++) {
      pixels.push([x, y]);
      x = Math.max(0, Math.min(15, x + Math.floor(cr() * 3) - 1));
      y = Math.max(0, Math.min(15, y + Math.floor(cr() * 3) - 1));
    }
  }
  return Array.from({ length: CRACK_STAGES }, (_, stage) => {
    const c = document.createElement('canvas'); c.width = c.height = T;
    const cg = c.getContext('2d');
    cg.fillStyle = 'rgba(0, 0, 0, 0.7)';
    for (const [x, y] of pixels.slice(0, Math.round(pixels.length * (stage + 1) / CRACK_STAGES))) cg.fillRect(x, y, 1, 1);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = t.minFilter = THREE.NearestFilter;
    return t;
  });
})();
const crackMaterial = new THREE.MeshBasicMaterial({ map: crackTextures[0], transparent: true, depthWrite: false });
const crackBox = new THREE.Mesh(new THREE.BoxGeometry(1.002, 1.002, 1.002), crackMaterial);
crackBox.visible = false;
scene.add(crackBox);
const miningState = { key: '', progress: 0 };
// Doğru alet süreyi hız çarpanına böler.
function breakTimeOf(block) {
  const def = BLOCKS[block], tool = selectedTool();
  return tool && ITEMS[tool.key].tool === def.tool ? def.breakTime / ITEMS[tool.key].speed : def.breakTime;
}
function updateMining(dt, hit) {
  const target = mining && hit && hit.y > 0 && !targetedMob(hit) ? hit : null;
  if (!target) { miningState.key = ''; miningState.progress = 0; crackBox.visible = false; return; }
  const key = target.x + ',' + target.y + ',' + target.z;
  if (key !== miningState.key) { miningState.key = key; miningState.progress = 0; }
  miningState.progress += dt / breakTimeOf(get(target.x, target.y, target.z));
  // Kazarken 0,25 sn'de bir çıtırtı
  miningState.digTimer = (miningState.digTimer || 0) - dt;
  if (miningState.digTimer <= 0) { miningState.digTimer = 0.25; blockSound(get(target.x, target.y, target.z), 'dig'); }
  // Kazarken 0,2 sn'de bir 2 küçük parça
  miningState.debrisTimer = (miningState.debrisTimer || 0) - dt;
  if (miningState.debrisTimer <= 0) { miningState.debrisTimer = 0.2; spawnDebris(get(target.x, target.y, target.z), target.x, target.y, target.z, 2, 1.5); }
  if (punch <= 0) punch = 0.25; // kol vurmaya devam eder
  if (miningState.progress >= 1) {
    breakBlockAt(target);
    miningState.key = '';
    miningState.progress = 0;
    crackBox.visible = false;
    return;
  }
  crackMaterial.map = crackTextures[Math.min(CRACK_STAGES - 1, Math.floor(miningState.progress * CRACK_STAGES))];
  crackBox.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
  crackBox.visible = true;
}
function placeBlock() {
  punch = 0.25;
  if (heldBucket()) { useBucket(); return; }
  const hit = raycast();
  if (!hit) return;
  // Çalışma masasına sağ tık 3x3 üretim ızgarasını açar.
  if (get(hit.x, hit.y, hit.z) === B.crafting_table && !targetedMob(hit)) { openInventory(3); return; }
  if (isBed(get(hit.x, hit.y, hit.z)) && !targetedMob(hit)) { useBed(hit.x, hit.y, hit.z); return; }
  if (isDoor(get(hit.x, hit.y, hit.z)) && !targetedMob(hit)) { toggleDoor(hit.x, hit.y, hit.z); return; }
  if ((get(hit.x, hit.y, hit.z) === B.furnace || get(hit.x, hit.y, hit.z) === B.furnace_lit) && !targetedMob(hit)) {
    openFurnace(hit.x, hit.y, hit.z);
    return;
  }
  if (get(hit.x, hit.y, hit.z) === B.chest && !targetedMob(hit)) { openChest(hit.x, hit.y, hit.z); return; }
  const { px: x, py: y, pz: z } = hit;
  // Yarım bloğun üstüne aynısı konunca tam blok olur
  if (inventory[selected] && mergeSlab(hit, inventory[selected].key)) {
    blockSound(get(hit.x, hit.y, hit.z), 'place');
    rebuildAround(hit.x, hit.z);
    takeFromSlot(selected, 1);
    return;
  }
  if (!inBounds(x, y, z) || (isTargetable(get(x, y, z)) && !BLOCKS[get(x, y, z)].replaceable)) return;
  const p = player;
  const overlapsPlayer = x < p.x + W && x + 1 > p.x - W && y < p.y + H && y + 1 > p.y && z < p.z + W && z + 1 > p.z - W;
  if (overlapsPlayer) return;
  const slot = inventory[selected];
  // Çakmak: obsidyen çerçevenin iç tabanına tıklanınca portalı yakar
  if (slot?.key === 'flint_and_steel') {
    if (get(hit.x, hit.y, hit.z) === B.obsidian && y - hit.y === 1 && tryLightPortal(x, y, z)) useTool();
    return;
  }
  // Çapa: üstü boş çimen ya da toprağı tarlaya çevirir
  if (slot?.key === 'wooden_hoe') {
    const target = get(hit.x, hit.y, hit.z);
    if ((target === B.grass || target === B.dirt) && y - hit.y === 1) {
      set(hit.x, hit.y, hit.z, B.farmland);
      rebuildAround(hit.x, hit.z);
      useTool();
    }
    return;
  }
  // Tohum yalnızca tarlanın üstüne ekilir
  if (slot?.key === 'wheat_seeds') {
    if (get(hit.x, hit.y, hit.z) !== B.farmland || y - hit.y !== 1) return;
    set(x, y, z, B.wheat_0);
    plantCrop(x, y, z);
    rebuildAround(x, z);
    takeFromSlot(selected, 1);
    return;
  }
  if (slot?.key === 'door') {
    // Kapı bir bloğun üstüne konur: alt ve üst hücre boş olmalı; oyuncunun baktığı yöne kapanır.
    if (y - hit.y !== 1 || !inBounds(x, y + 1, z) || isTargetable(get(x, y + 1, z))) return;
    const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
    const i = BED_DIRS.findIndex(([, [ax, az]]) => Math.abs(fx) > Math.abs(fz) ? ax === Math.sign(fx) : az === Math.sign(fz));
    set(x, y, z, doorId(i, 'lower', false));
    set(x, y + 1, z, doorId(i, 'upper', false));
    rebuildAround(x, z);
    takeFromSlot(selected, 1);
    return;
  }
  if (slot?.key === 'bed') {
    // Ayak bakılan hücreye, baş oyuncunun baktığı eksende bir sonraki hücreye; ikisinin altı da dolu olmalı.
    const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
    const [name, [dx, dz]] = BED_DIRS.find(([, [ax, az]]) => Math.abs(fx) > Math.abs(fz) ? ax === Math.sign(fx) : az === Math.sign(fz));
    const hx = x + dx, hz = z + dz;
    if (!inBounds(hx, y, hz) || isTargetable(get(hx, y, hz)) || !isSolid(get(x, y - 1, z)) || !isSolid(get(hx, y - 1, hz))) return;
    set(x, y, z, B['bed_foot_' + name]);
    set(hx, y, hz, B['bed_head_' + name]);
    rebuildAround(x, z);
    rebuildAround(hx, hz);
    takeFromSlot(selected, 1);
    return;
  }
  if (slot?.key === 'torch') {
    // Meşale: üste konunca dik, yan yüze konunca duvardan dışa eğik; tavana konmaz.
    const dx = x - hit.x, dy = y - hit.y, dz = z - hit.z;
    if (dy < 0) return;
    const id = dy > 0 ? B.torch_floor : dx === 1 ? B.torch_east : dx === -1 ? B.torch_west : dz === 1 ? B.torch_south : B.torch_north;
    set(x, y, z, id);
    rebuildArea(x, z, Math.ceil(TORCH_RANGE) + 1);
    takeFromSlot(selected, 1);
    return;
  }
  if (!slot || !ITEMS[slot.key].block) return;
  if (mobs.some(m => x < m.x + m.w && x + 1 > m.x - m.w && y < m.y + m.h && y + 1 > m.y && z < m.z + m.w && z + 1 > m.z - m.w)) return;
  // Şekilli bloklar bakış yönüne ve tıklanan yarıya göre döner
  set(x, y, z, SHAPE_FAMILIES[slot.key] ? shapeVariant(slot.key, hit) : ITEMS[slot.key].block);
  if (slot.key === 'crafting_table') guideFlags.table = true;
  blockSound(ITEMS[slot.key].block, 'place');
  rebuildAround(x, z);
  takeFromSlot(selected, 1);
}
