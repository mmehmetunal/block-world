// ---------- Canlılar ----------
// Canlılar: türler, doğma, yapay zekâ, vurma, patlama, yanma. Modeller mob-models.js içinde.

const MAX_ANIMALS = 16;

// slowFall: düşerken yerçekimi 1/4 (tavuk kanat çırpar). hostile: gece doğar, oyuncuya saldırır.
// ranged: uzaktan ok atar. climbs: önündeki duvara tırmanır. leaps: yakından oyuncuya sıçrar.
// explodes: yaklaşıp patlar. burns: gündüz açık havada yanar. passiveByDay: gündüz saldırmaz, dolaşır.
// neutral: vurulana kadar saldırmaz. flies: yerçekimsiz uçar (nether-mobs.js). Nether türleri nether-mobs.js'te eklenir.
const MOB_TYPES = {
  cow: { name: 'İnek', health: 10, w: 0.45, h: 1.2, speed: 1.2, build: buildCow },
  pig: { name: 'Domuz', health: 10, w: 0.4, h: 0.9, speed: 1.1, build: buildPig },
  chicken: { name: 'Tavuk', health: 4, w: 0.25, h: 0.8, speed: 1.0, slowFall: true, build: buildChicken },
  sheep: { name: 'Koyun', health: 8, w: 0.45, h: 1.1, speed: 1.1, build: buildSheep },
  zombie: { name: 'Zombi', health: 20, w: 0.3, h: 1.8, speed: 2.3, hostile: true, burns: true, build: buildZombie },
  skeleton: { name: 'İskelet', health: 20, w: 0.3, h: 1.8, speed: 2.3, hostile: true, ranged: true, burns: true, build: buildSkeleton },
  creeper: { name: 'Creeper', health: 20, w: 0.3, h: 1.5, speed: 2.0, hostile: true, explodes: true, build: buildCreeper },
  spider: { name: 'Örümcek', health: 16, w: 0.7, h: 0.9, speed: 2.6, hostile: true, climbs: true, leaps: true, passiveByDay: true, build: buildSpider },
};
const ANIMAL_KINDS = ['cow', 'pig', 'chicken', 'sheep'];
const mobs = [];

function spawnMob(kind, x, y, z) {
  const type = MOB_TYPES[kind];
  const body = type.build();
  scene.add(body.root);
  const mob = {
    kind, type, body, x, y, z, w: type.w, h: type.h, vx: 0, vy: 0, vz: 0, kx: 0, kz: 0,
    yaw: Math.random() * Math.PI * 2, onGround: false, health: type.health,
    walking: false, timer: Math.random() * 3, walkPhase: 0,
    invulnerable: 0, hurt: 0, flee: 0, dying: 0, materials: [], attackCooldown: 0, swing: 0, leapTimer: 0, memory: 0, fuse: 0, tint: '', burning: false, burnTimer: 0,
  };
  // Her canlının kendi malzemeleri var; vurulunca kırmızılaştırmak için toplanır.
  body.root.traverse(o => { if (o.material) mob.materials.push(...[].concat(o.material)); });
  mobs.push(mob);
  return mob;
}
function removeMob(m) {
  scene.remove(m.body.root);
  m.body.root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  for (const mat of new Set(m.materials)) { mat.map?.dispose(); mat.dispose(); }
  mobs.splice(mobs.indexOf(m), 1);
}

// Nişan ışınının bir kutuya giriş uzaklığı (slab yöntemi); kesmiyorsa null.
function rayBox(min, max) {
  const o = [aim.o.x, aim.o.y, aim.o.z], d = [aim.d.x, aim.d.y, aim.d.z];
  let t0 = 0, t1 = aim.start + MOB_REACH;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) {
      if (o[i] < min[i] || o[i] > max[i]) return null;
      continue;
    }
    let a = (min[i] - o[i]) / d[i], b = (max[i] - o[i]) / d[i];
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return null;
  }
  return t0;
}
// Menzil içindeki en yakın canlı: { mob, t } ya da null.
function rayMob() {
  let best = null;
  for (const m of mobs) {
    if (m.dying > 0) continue;
    const t = rayBox([m.x - m.w, m.y, m.z - m.w], [m.x + m.w, m.y + m.h, m.z + m.w]);
    if (t !== null && (!best || t < best.t)) best = { mob: m, t };
  }
  return best;
}
// Vuruş: 0,5 sn hasarsızlık, 0,3 sn kırmızılık, 5 blok/sn geri itilme; hayvan 4 sn kaçar.
function hurtMob(m, amount, dirX, dirZ) {
  if (m.invulnerable > 0 || m.dying > 0) return;
  m.health -= amount;
  m.invulnerable = 0.5;
  m.hurt = 0.3;
  const len = Math.hypot(dirX, dirZ) || 1;
  m.kx = dirX / len * 5;
  m.kz = dirZ / len * 5;
  if (m.onGround) m.vy = 4;
  if (!m.type.hostile) m.flee = 4;
  if (m.type.neutral) angerPigmen(m);
  if (m.health <= 0) m.dying = 0.5;
}
function surfaceY(x, z) {
  let y = columnTop(x, z);
  while (y > 0 && passable(get(x, y - 1, z))) y--;
  return y;
}
// Uygun bir çimen sütunu arar: accept(x, z) koşulunu sağlayan ilk yer; bulamazsa null.
function findGrass(pick, accept = () => true) {
  for (let i = 0; i < 60; i++) {
    const [x, z] = pick();
    if (!inBounds(x, 1, z) || !accept(x, z)) continue;
    const y = surfaceY(x, z);
    if (get(x, y - 1, z) === B.grass) return [x + 0.5, y, z + 0.5];
  }
  return null;
}
// Oyuncunun 48 blok çevresinde rastgele sütun
const randomColumn = () => [Math.floor(player.x + (Math.random() * 2 - 1) * 48), Math.floor(player.z + (Math.random() * 2 - 1) * 48)];
const animalCount = () => mobs.filter(m => ANIMAL_KINDS.includes(m.kind)).length;

// Sürü: aynı türden count tane, ilk hayvanın 8 blok çevresinde.
function spawnHerd(kind, count, accept) {
  const center = findGrass(randomColumn, accept);
  if (!center) return;
  for (let i = 0; i < count && animalCount() < MAX_ANIMALS; i++) {
    const spot = i === 0 ? center : findGrass(() => [
      Math.floor(center[0] + (Math.random() * 2 - 1) * 8), Math.floor(center[2] + (Math.random() * 2 - 1) * 8)]);
    if (spot) spawnMob(kind, ...spot);
  }
}
// Açılışta her türden 4'lük sürü: toplam sınır olan 16'yı doldurur.
function spawnInitialAnimals() {
  for (const kind of ANIMAL_KINDS) spawnHerd(kind, 4);
}
// Gündüz, sınırın altındaysa her 30 sn'de oyuncudan 24+ blok uzağa 1 hayvan.
let animalSpawnTimer = 0;
// Düşmanlar: gece her 10 sn'de oyuncudan 16–32 blok uzakta, açık havada doğar (en çok 8).
const MAX_HOSTILES = 8, CHASE_DISTANCE = 16, DESPAWN_DISTANCE = 64, ZOMBIE_REACH = 1.2, ZOMBIE_DAMAGE = 3;
const TORCH_SAFE = 8; // meşaleye bu kadar yakın düşman doğmaz
const torchNearby = (x, y, z) => torchesNear(x - TORCH_SAFE, z - TORCH_SAFE, x + TORCH_SAFE, z + TORCH_SAFE)
  .some(([tx, ty, tz]) => Math.hypot(tx - x - 0.5, ty - y, tz - z - 0.5) <= TORCH_SAFE);
const SPIDER_CLIMB_SPEED = 2, SPIDER_LEAP_RANGE = 3, SPIDER_DAMAGE = 2, CHASE_MEMORY = 5;
const CREEPER_FUSE = 1.5, CREEPER_TRIGGER = 3, CREEPER_CANCEL = 5, EXPLOSION_RADIUS = 3, EXPLOSION_DAMAGE = 12;
let hostileSpawnTimer = 0;
const hostileCount = () => mobs.filter(m => m.type.hostile && m.dying <= 0).length;
// Gece açık havaya, her zaman mağaraya (gökyüzü görmeyen, meşalesiz boşluğa) doğabilir.
function updateHostileSpawning(dt) {
  hostileSpawnTimer += dt;
  if (hostileSpawnTimer < 10) return;
  hostileSpawnTimer = 0;
  trySpawnHostile(daylight(clock.time) < 0.5);
}
function trySpawnHostile(night) {
  if (hostileCount() >= MAX_HOSTILES) return null;
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2, distance = 16 + Math.random() * 16;
    const x = Math.floor(player.x + Math.cos(angle) * distance), z = Math.floor(player.z + Math.sin(angle) * distance);
    if (!inBounds(x, 1, z)) continue;
    const spot = (night && Math.random() < 0.5 ? surfaceSpot(x, z) : null) || caveSpot(x, z);
    if (!spot || torchNearby(x, spot, z)) continue;
    // Düşmanlar: %40 iskelet, %20 örümcek, %15 creeper, kalanı zombi
    const roll = Math.random();
    return spawnMob(roll < 0.4 ? 'skeleton' : roll < 0.6 ? 'spider' : roll < 0.75 ? 'creeper' : 'zombie', x + 0.5, spot, z + 0.5);
  }
  return null;
}
// Sütunun en üstü (açık hava); uygun değilse null
function surfaceSpot(x, z) {
  const y = surfaceY(x, z), ground = get(x, y - 1, z);
  return y < SY - 2 && isSolid(ground) && ground !== B.leaves ? y : null;
}
// Sütunda, üstü kapalı (mağara) ve iki blok boş, altı katı rastgele bir hücre; yoksa null
function caveSpot(x, z) {
  const spots = [];
  for (let y = 2; y < surfaceY(x, z) - 2; y++) {
    if (get(x, y, z) === AIR && get(x, y + 1, z) === AIR && isSolid(get(x, y - 1, z))) spots.push(y);
  }
  return spots.length ? spots[Math.floor(Math.random() * spots.length)] : null;
}
// Canlının gözünden oyuncunun gözüne 0,25 blok adımlarla bakar; arada blok varsa görmez.
function canSeePlayer(m) {
  const ax = m.x, ay = m.y + m.h * 0.9, az = m.z;
  const bx = player.x, by = player.y + EYE, bz = player.z;
  const steps = Math.ceil(Math.hypot(bx - ax, by - ay, bz - az) / 0.25);
  for (let i = 1; i < steps; i++) {
    const f = i / steps;
    if (isSolid(get(Math.floor(ax + (bx - ax) * f), Math.floor(ay + (by - ay) * f), Math.floor(az + (bz - az) * f)))) return false;
  }
  return true;
}

function updateAnimalSpawning(dt) {
  animalSpawnTimer += dt;
  if (animalSpawnTimer < 30) return;
  animalSpawnTimer = 0;
  if (daylight(clock.time) < 0.5 || animalCount() >= MAX_ANIMALS) return;
  const far = (x, z) => Math.hypot(x + 0.5 - player.x, z + 0.5 - player.z) >= 24;
  const kind = ANIMAL_KINDS[Math.floor(Math.random() * ANIMAL_KINDS.length)];
  const spot = findGrass(randomColumn, far);
  if (spot) spawnMob(kind, ...spot);
}

// Dolaşma: 2–5 sn rastgele yöne yürü, 2–4 sn dur. Önde 1 blokluk basamak varsa zıpla,
// 2 blok duvar ya da 3 bloktan derin uçurum varsa dön.
function updateMob(m, dt) {
  // Ölüm: 0,5 sn yana devrilir, sonra kaybolur.
  if (m.dying > 0) {
    m.dying -= dt;
    if (m.dying <= 0) { dropLoot(m); emitSmoke(m); removeMob(m); }
    return;
  }
  m.invulnerable = Math.max(0, m.invulnerable - dt);
  m.hurt = Math.max(0, m.hurt - dt);
  m.flee = Math.max(0, m.flee - dt);
  m.attackCooldown = Math.max(0, m.attackCooldown - dt);
  m.swing = Math.max(0, m.swing - dt);
  m.leapTimer = Math.max(0, m.leapTimer - dt);
  m.timer -= dt;
  m.angry = Math.max(0, (m.angry || 0) - dt);
  if (m.type.flies) { updateGhast(m, dt); return; }
  if (m.type.blaze) { updateBlaze(m, dt); return; }
  const dx = player.x - m.x, dz = player.z - m.z, dist = Math.hypot(dx, dz);
  if (m.type.hostile && dist > DESPAWN_DISTANCE) { removeMob(m); return; }
  // Gördüğü oyuncuyu, görüş kesilse de CHASE_MEMORY sn kovalar.
  const day = daylight(clock.time) >= 0.5;
  // Güvenli modda hiçbir canlı kovalamaz ve saldırmaz.
  const aggressive = m.type.hostile && !dead && !safeMode && !(m.type.passiveByDay && day) && !(m.type.neutral && m.angry <= 0);
  const sees = aggressive && dist <= CHASE_DISTANCE && canSeePlayer(m);
  m.memory = sees ? CHASE_MEMORY : aggressive ? Math.max(0, m.memory - dt) : 0;
  const chasing = aggressive && dist <= CHASE_DISTANCE && m.memory > 0;
  let prey = null;
  // Zombi ve iskelet gündüz başının üstü açıksa saniyede 1 hasar alır.
  m.burning = m.type.burns && day && skyAbove(m);
  if (m.burning) {
    m.burnTimer += dt;
    emitFlames(m, dt);
    if (m.burnTimer >= 1) {
      m.burnTimer = 0;
      m.health -= 1;
      m.hurt = 0.3;
      if (m.health <= 0) { m.dying = 0.5; return; }
    }
  } else m.burnTimer = 0;
  m.aiming = chasing && m.type.ranged;
  if (m.aiming) {
    // İskelet: 8 blok mesafede durmaya çalışır, 4 bloktan yakında geri çekilir, 2 sn'de bir ok atar.
    m.walking = true;
    m.yaw = Math.atan2(-dx, -dz);
    if (sees && m.attackCooldown <= 0) {
      shootArrow(m);
      m.attackCooldown = SKELETON_SHOT_INTERVAL;
    }
  } else if (chasing && m.type.explodes) {
    // Creeper: 3 blokta durur, 1,5 sn yanıp söner ve patlar; oyuncu 5 bloktan uzaklaşırsa vazgeçer.
    m.walking = true;
    m.yaw = Math.atan2(-dx, -dz);
    if (m.fuse > 0 || dist <= CREEPER_TRIGGER) m.fuse += dt;
    if (dist > CREEPER_CANCEL) m.fuse = 0;
    if (m.fuse >= CREEPER_FUSE) { explode(m); return; }
  } else if (chasing && m.type.leaps) {
    // Örümcek: 3 blok içinde oyuncuya doğru sıçrar; sıçrarken değerse 2 hasar.
    m.walking = true;
    m.yaw = Math.atan2(-dx, -dz);
    if (dist <= SPIDER_LEAP_RANGE && m.onGround && m.attackCooldown <= 0) {
      m.vy = 6;
      m.kx = dx / dist * 6;
      m.kz = dz / dist * 6;
      m.leapTimer = 0.8;
      m.attackCooldown = 1.5;
    }
    if (m.leapTimer > 0 && dist < m.w + player.w + 0.3 && Math.abs(player.y - m.y) < 1.2) {
      damagePlayer(SPIDER_DAMAGE, m.x, m.z);
      m.leapTimer = 0;
    }
  } else if (m.kind === 'zombie' && aggressive && (prey = villagerTarget(m)) && (!chasing || Math.hypot(prey.x - m.x, prey.z - m.z) < dist)) {
    // Zombi yakındaki köylüye de saldırır (oyuncudan yakınsa)
    const px = prey.x - m.x, pz = prey.z - m.z;
    m.walking = true;
    m.yaw = Math.atan2(-px, -pz);
    if (Math.hypot(px, pz) <= ZOMBIE_REACH && m.attackCooldown <= 0) {
      hurtMob(prey, ZOMBIE_DAMAGE, px, pz);
      m.attackCooldown = 1;
      m.swing = 0.3;
    }
  } else if (chasing) {
    // Oyuncuya yürü; 1,2 blok içindeyse saniyede bir vur.
    m.walking = true;
    m.yaw = Math.atan2(-dx, -dz);
    if (dist <= ZOMBIE_REACH && Math.abs(player.y - m.y) < 1.5 && m.attackCooldown <= 0) {
      damagePlayer(ZOMBIE_DAMAGE, m.x, m.z);
      m.attackCooldown = 1;
      m.swing = 0.3;
    }
  } else if (m.flee > 0) {
    // Oyuncudan uzağa, 2 kat hızla
    m.walking = true;
    m.yaw = Math.atan2(m.x - player.x, m.z - player.z) + Math.PI;
  } else if (m.type.villager && m.home && steerVillager(m, day)) {
    // köylü yönünü kendisi seçti
  } else if (m.timer <= 0) {
    m.walking = !m.walking;
    m.timer = m.walking ? 2 + Math.random() * 3 : 2 + Math.random() * 2;
    if (m.walking) m.yaw = Math.random() * Math.PI * 2;
  }
  let speed = m.walking ? m.type.speed * (m.flee > 0 ? 2 : 1) : 0;
  if (chasing && dist < 0.9) speed = 0;
  if (m.fuse > 0) speed = 0;
  if (!chasing) m.fuse = 0;
  if (m.aiming) speed = dist > 8.5 ? m.type.speed : dist < 4 ? -m.type.speed : 0;
  let climbing = false;
  if (speed > 0) {
    const fx = -Math.sin(m.yaw), fz = -Math.cos(m.yaw);
    const ax = Math.floor(m.x + fx * (m.w + 0.3)), az = Math.floor(m.z + fz * (m.w + 0.3)), fy = Math.floor(m.y);
    const wall = solid(ax, fy, az) ? (solid(ax, fy + 1, az) ? 2 : 1) : 0;
    let drop = 0;
    if (!wall) while (drop <= 3 && !solid(ax, fy - 1 - drop, az)) drop++;
    // Hayvanlar suya, hiçbir canlı lava girmez
    if (!m.type.hostile && (isWater(get(ax, fy, az)) || isWater(get(ax, fy - 1, az)))) drop = 99;
    if (isLava(get(ax, fy, az)) || isLava(get(ax, fy - 1, az))) drop = 99;
    if (wall && m.type.climbs) climbing = true;
    else if (wall === 2 || drop > 3) { m.yaw += Math.PI * (0.5 + Math.random()); speed = 0; }
    else if (wall === 1 && m.onGround) m.vy = JUMP;
  }
  m.vx = -Math.sin(m.yaw) * speed + m.kx;
  m.vz = -Math.cos(m.yaw) * speed + m.kz;
  const knockDecay = Math.exp(-dt * 6);
  m.kx *= knockDecay; m.kz *= knockDecay;
  const gravity = m.type.slowFall && m.vy < 0 ? GRAVITY / 4 : GRAVITY;
  // Tırmanırken yerçekimi yok, sabit hızla yukarı çıkar.
  m.vy = climbing ? SPIDER_CLIMB_SPEED : Math.max(m.vy - gravity * dt, -40);
  stepEntity(m, dt);
  m.walkPhase += dt * Math.hypot(m.vx, m.vz) * 4;
}
function renderMob(m) {
  const { root, legs } = m.body;
  root.position.set(m.x, m.y, m.z);
  root.rotation.y = m.yaw;
  root.rotation.z = m.dying > 0 ? (1 - m.dying / 0.5) * Math.PI / 2 : 0;
  // Vurulunca kırmızı; creeper fitili yanarken beyaz yanıp söner ve şişer.
  const tint = m.hurt > 0 || m.dying > 0 ? 'red' : m.fuse > 0 && Math.sin(m.fuse * 25) > 0 ? 'white' : '';
  if (tint !== m.tint) {
    m.tint = tint;
    for (const mat of m.materials) mat.emissive.setRGB(tint ? 0.6 : 0, tint === 'white' ? 0.6 : 0, tint === 'white' ? 0.6 : 0);
  }
  const swell = 1 + 0.25 * Math.min(1, m.fuse / CREEPER_FUSE);
  root.scale.set(swell, swell, swell);
  const swing = Math.sin(m.walkPhase) * 0.6 * Math.min(1, Math.hypot(m.vx, m.vz) / m.type.speed);
  // Çapraz bacaklar birlikte sallanır (2 bacaklılarda 0 ileri, 1 geri).
  legs.forEach((leg, i) => { leg.rotation.x = (i === 0 || i === 3 ? 1 : -1) * swing; });
  // Zombi kolları öne uzanık; vururken bir kez savrulur.
  if (m.body.arms) for (const arm of m.body.arms) arm.rotation.x = 1.45 + Math.sin(m.swing / 0.3 * Math.PI) * 0.6;
  // İskelet nişan alırken iki kolunu da öne kaldırır.
  if (m.body.bowArms) m.body.bowArms.forEach((arm, i) => { arm.rotation.x = m.aiming ? 1.4 : (i ? swing : -swing); });
  if (m.body.spiderLegs) m.body.spiderLegs.forEach((leg, i) => { leg.rotation.y = leg.userData.baseYaw + (i % 2 ? 1 : -1) * swing * 0.6; });
}
// Başının üstündeki sütunda hiç blok yoksa (yaprak da gölge sayılır) gökyüzünü görür.
function skyAbove(m) {
  for (let y = Math.floor(m.y + m.h), top = columnTop(m.x, m.z); y <= top; y++) if (isSolid(get(Math.floor(m.x), y, Math.floor(m.z)))) return false;
  return true;
}
// Yanma parçacıkları: canlının üstünde yükselip küçülen turuncu-kırmızı küpler.
const particles = [];
const particleGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);
const flameMaterials = [0xff9a1f, 0xe8401c, 0xffd23a].map(color => new THREE.MeshBasicMaterial({ color }));
const smokeMaterials = [0x8a8a8a, 0xa8a8a8, 0x6e6e6e].map(color => new THREE.MeshBasicMaterial({ color }));
function emitFlames(m, dt) {
  if (Math.random() > dt * 10) return;
  const mesh = new THREE.Mesh(particleGeometry, flameMaterials[Math.floor(Math.random() * flameMaterials.length)]);
  mesh.position.set(m.x + (Math.random() - 0.5) * m.w * 2, m.y + Math.random() * m.h, m.z + (Math.random() - 0.5) * m.w * 2);
  scene.add(mesh);
  particles.push({ mesh, life: 0.6, maxLife: 0.6, rise: 1.5 });
}
// Ölüm dumanı: canlının kutusundan 8 gri küp yükselir, büyüyüp kaybolur.
function emitSmoke(m) {
  for (let i = 0; i < 8; i++) {
    const mesh = new THREE.Mesh(particleGeometry, smokeMaterials[i % smokeMaterials.length]);
    mesh.position.set(m.x + (Math.random() - 0.5) * m.w * 2, m.y + Math.random() * m.h, m.z + (Math.random() - 0.5) * m.w * 2);
    mesh.scale.setScalar(1.5);
    scene.add(mesh);
    particles.push({ mesh, life: 1, maxLife: 1, rise: 0.8, smoke: true });
  }
}
function updateParticles(dt) {
  for (const pt of [...particles]) {
    pt.life -= dt;
    pt.mesh.position.y += dt * pt.rise;
    pt.mesh.scale.setScalar(Math.max(0.01, (pt.smoke ? 2.5 : 1) * pt.life / pt.maxLife));
    if (pt.life <= 0) { scene.remove(pt.mesh); particles.splice(particles.indexOf(pt), 1); }
  }
}

// Patlama: yarıçap içindeki blokları siler (y = 0 hariç), oyuncuya uzaklığa göre en çok maxDamage hasar.
function explode(m) {
  blast(m.x, m.y + 0.5, m.z, EXPLOSION_RADIUS, EXPLOSION_DAMAGE);
  removeMob(m);
}
function blast(x, y, z, r, maxDamage) {
  const cx = Math.floor(x), cy = Math.floor(y), cz = Math.floor(z);
  for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) {
    if (dx * dx + dy * dy + dz * dz <= r * r && cy + dy > 0) set(cx + dx, cy + dy, cz + dz, AIR);
  }
  rebuildArea(cx, cz, r + 1);
  const distance = Math.hypot(player.x - x, player.y + 0.9 - (y + 0.25), player.z - z);
  const damage = Math.round(maxDamage * (1 - distance / (r * 2)));
  if (damage > 0) damagePlayer(damage, x, z);
}
