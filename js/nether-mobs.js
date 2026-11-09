// ---------- Nether canlıları ----------
// Zombi domuz adam (vurulana kadar nötr) ve ghast (uçar, ateş topu atar). Yalnızca Nether'de doğarlar.
// Ortak canlı kodu (yürüme, kovalama, vurulma) mobs.js'tedir; burada modeller, uçuş, ateş topu ve doğma var.

const PIGMAN_ANGER_TIME = 30, PIGMAN_ANGER_RANGE = 16;
const GHAST_SPEED = 1.5, GHAST_RANGE = 20, GHAST_SHOT_INTERVAL = 3;
const FIREBALL_SPEED = 8, FIREBALL_DAMAGE = 5, FIREBALL_BLAST = 1, FIREBALL_HIT_MOB = 10;
const MAX_PIGMEN = 6, MAX_GHASTS = 2, NETHER_SPAWN_MIN = 24, NETHER_SPAWN_MAX = 48;

const PIGMAN_SKIN = { skin: '#e8a0a0', hair: '#5f8a3e', shirt: '#7a9a4e', pants: '#6b4f3a', shoe: '#4a3a2a', eye: '#ffffff', iris: '#c03030', mouth: '#a05858' };
function buildPigman() {
  const { root, armR, armL, legR, legL } = buildHumanoid(PIGMAN_SKIN);
  // Sağ elde altın kılıç: kol aşağıdayken öne uzanır
  const gold = paint(1, 1, [['#f2c94c', 0, 0, 1, 1]]), hilt = paint(1, 1, [['#6b4a2b', 0, 0, 1, 1]]);
  armR.add(box(1, 1, 10, gold, 0, -10, -6), box(3, 1, 1, hilt, 0, -10, -1));
  return { root, legs: [legR, legL], arms: [armR, armL] };
}
function buildGhast() {
  const white = '#f0f0f0', gray = '#d0d0d0';
  const skin = paint(8, 8, [[white, 0, 0, 8, 8], [gray, 1, 6, 2, 1], [gray, 5, 1, 2, 1]]);
  // Kapalı gözler ve ağız (öne bakan yüz)
  const face = paint(8, 8, [[white, 0, 0, 8, 8], ['#3a3a3a', 1, 3, 2, 1], ['#3a3a3a', 5, 3, 2, 1], ['#3a3a3a', 3, 5, 2, 2]]);
  const tentacle = paint(2, 8, [[white, 0, 0, 2, 8], [gray, 0, 6, 2, 2]]);
  const root = new THREE.Group();
  root.add(box(64, 64, 64, [skin, skin, skin, skin, skin, face], 0, 40, 0));
  // 3x3 sarkan dokunaç, boyları farklı
  const tentacles = [];
  for (let i = 0; i < 9; i++) {
    const length = 18 + ((i * 7) % 5) * 4;
    const t = pivot(-20 + (i % 3) * 20, 8, -20 + Math.floor(i / 3) * 20, box(4, length, 4, tentacle, 0, -length / 2, 0));
    t.userData.phase = i * 0.7;
    root.add(t);
    tentacles.push(t);
  }
  return { root, legs: [], tentacles };
}
MOB_TYPES.zombie_pigman = { name: 'Zombi domuz adam', health: 20, w: 0.3, h: 1.8, speed: 2.3, hostile: true, neutral: true, build: buildPigman };
MOB_TYPES.ghast = { name: 'Ghast', health: 10, w: 2, h: 4, speed: GHAST_SPEED, hostile: true, flies: true, build: buildGhast };
MOB_DROPS.zombie_pigman = [['rotten_flesh', 0, 1]];

// Vurulan domuz adam ve 16 blok içindeki bütün domuz adamlar 30 sn oyuncuya düşman olur.
function angerPigmen(m) {
  for (const other of mobs) {
    if (other.kind === 'zombie_pigman' && Math.hypot(other.x - m.x, other.y - m.y, other.z - m.z) <= PIGMAN_ANGER_RANGE) {
      other.angry = PIGMAN_ANGER_TIME;
      other.memory = CHASE_MEMORY;
    }
  }
}

// Ghast: yerçekimsiz, 4–8 sn'de bir yakındaki boş bir noktaya süzülür; oyuncuyu görünce ona döner ve 3 sn'de bir ateş topu atar.
function updateGhast(m, dt) {
  const dx = player.x - m.x, dz = player.z - m.z;
  if (Math.hypot(dx, dz) > DESPAWN_DISTANCE) { removeMob(m); return; }
  const dist = Math.hypot(dx, player.y - m.y, dz);
  const sees = !dead && dist <= GHAST_RANGE && canSeePlayer(m);
  if (!m.target || m.timer <= 0 || Math.hypot(m.target.x - m.x, m.target.y - m.y, m.target.z - m.z) < 1) {
    m.timer = 4 + Math.random() * 4;
    m.target = { x: m.x + (Math.random() * 2 - 1) * 12, y: m.y + (Math.random() * 2 - 1) * 4, z: m.z + (Math.random() * 2 - 1) * 12 };
  }
  const tx = m.target.x - m.x, ty = m.target.y - m.y, tz = m.target.z - m.z, len = Math.hypot(tx, ty, tz) || 1;
  m.vx = tx / len * GHAST_SPEED + m.kx;
  m.vy = ty / len * GHAST_SPEED;
  m.vz = tz / len * GHAST_SPEED + m.kz;
  const knockDecay = Math.exp(-dt * 6);
  m.kx *= knockDecay; m.kz *= knockDecay;
  const before = [m.x, m.y, m.z];
  stepEntity(m, dt);
  // Takılırsa yeni hedef seçer
  if (Math.hypot(m.x - before[0], m.y - before[1], m.z - before[2]) < GHAST_SPEED * dt * 0.3) m.timer = 0;
  m.yaw = sees ? Math.atan2(-dx, -dz) : Math.atan2(-tx, -tz);
  // Ateş atarken ağzı açık (kırmızı yanıp söner gibi kısa parlama)
  m.attackCooldown = Math.max(0, m.attackCooldown - dt);
  if (sees && !safeMode && m.attackCooldown <= 0) {
    shootFireball(m);
    m.attackCooldown = GHAST_SHOT_INTERVAL;
  }
  m.walkPhase += dt * 2;
  for (const t of m.body.tentacles) t.rotation.x = Math.sin(m.walkPhase + t.userData.phase) * 0.35;
}

const fireballMaterial = new THREE.MeshBasicMaterial({ color: 0xff7a1a });
const fireballCoreMaterial = new THREE.MeshBasicMaterial({ color: 0xffd23a });
function fireballMesh() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), fireballMaterial));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), fireballCoreMaterial));
  g.children[1].position.set(0.12, 0.12, -0.12);
  scene.add(g);
  return g;
}
function shootFireball(m) {
  const fx = -Math.sin(m.yaw), fz = -Math.cos(m.yaw);
  const x = m.x + fx * 2.4, y = m.y + 2.2, z = m.z + fz * 2.4;
  const dx = player.x - x, dy = player.y + 1 - y, dz = player.z - z, len = Math.hypot(dx, dy, dz) || 1;
  projectiles.push({ fireball: true, x, y, z, vx: dx / len * FIREBALL_SPEED, vy: dy / len * FIREBALL_SPEED, vz: dz / len * FIREBALL_SPEED, life: 10, mesh: fireballMesh() });
}
// Ateş topu düz gider: oyuncuya değerse 5 hasar, geri çevrilmişse canlıya değerse 10 hasar, bloğa değerse küçük patlama.
function updateFireball(a, dt) {
  const steps = Math.max(4, Math.ceil(Math.hypot(a.vx, a.vy, a.vz) * dt / 0.25));
  for (let i = 0; i < steps && a.life > 0; i++) {
    a.x += a.vx * dt / steps; a.y += a.vy * dt / steps; a.z += a.vz * dt / steps;
    if (isSolid(get(Math.floor(a.x), Math.floor(a.y), Math.floor(a.z)))) {
      // Blaze'in küçük ateş topu patlamaz
      if (!a.small) blast(a.x, a.y, a.z, FIREBALL_BLAST, FIREBALL_DAMAGE);
      a.life = 0;
      break;
    }
    const p = player;
    if (!a.reflected && !dead && a.x > p.x - p.w - 0.2 && a.x < p.x + p.w + 0.2 && a.y > p.y && a.y < p.y + p.h && a.z > p.z - p.w - 0.2 && a.z < p.z + p.w + 0.2) {
      damagePlayer(FIREBALL_DAMAGE, a.x - a.vx, a.z - a.vz);
      // Küçük ateş topu 3 sn yakar (saniyede 1)
      if (a.small && !godMode) burnTimer = BURN_TIME;
      a.life = 0;
      break;
    }
    if (a.reflected) {
      const hit = mobs.find(m => m.dying <= 0 && a.x > m.x - m.w && a.x < m.x + m.w && a.y > m.y && a.y < m.y + m.h && a.z > m.z - m.w && a.z < m.z + m.w);
      if (hit) {
        hit.invulnerable = 0;
        hurtMob(hit, FIREBALL_HIT_MOB, a.vx, a.vz);
        a.life = 0;
        break;
      }
    }
  }
  a.mesh.position.set(a.x, a.y, a.z);
  a.mesh.rotation.x += dt * 6;
  a.mesh.rotation.y += dt * 4;
}
// Sol tık: nişan ışınındaki ateş topu (blok ve canlıdan yakınsa) bakılan yöne geri çevrilir.
function reflectFireball(maxT) {
  for (const a of projectiles) {
    if (!a.fireball || a.reflected) continue;
    const t = rayBox([a.x - 0.5, a.y - 0.5, a.z - 0.5], [a.x + 0.5, a.y + 0.5, a.z + 0.5]);
    if (t === null || t > maxT) continue;
    a.vx = aim.d.x * FIREBALL_SPEED * 1.5; a.vy = aim.d.y * FIREBALL_SPEED * 1.5; a.vz = aim.d.z * FIREBALL_SPEED * 1.5;
    a.reflected = true;
    a.life = 10;
    return true;
  }
  return false;
}

// Nether'de her 5 sn'de bir, sınırın altındaysa oyuncudan 24–48 blok uzağa domuz adam ya da ghast doğar.
let netherSpawnTimer = 0;
const countKind = kind => mobs.filter(m => m.kind === kind && m.dying <= 0).length;
function netherColumn() {
  const angle = Math.random() * Math.PI * 2, distance = NETHER_SPAWN_MIN + Math.random() * (NETHER_SPAWN_MAX - NETHER_SPAWN_MIN);
  const x = Math.floor(player.x + Math.cos(angle) * distance), z = Math.floor(player.z + Math.sin(angle) * distance);
  return inBounds(x, 1, z) ? [x, z] : null;
}
// Domuz adam: kızıl taş üstünde, iki blok boş hücre
function pigmanSpot(x, z) {
  const spots = [];
  for (let y = 1; y < NETHER_H - 2; y++) if (get(x, y, z) === AIR && get(x, y + 1, z) === AIR && get(x, y - 1, z) === B.netherrack) spots.push(y);
  return spots.length ? spots[Math.floor(Math.random() * spots.length)] : null;
}
// Ghast: 5x5x5'lik tamamen boş hava
function ghastSpot(x, z) {
  for (let y = LAVA_LEVEL + 2; y < NETHER_H - 6; y++) {
    let free = true;
    for (let dx = -2; dx <= 2 && free; dx++) for (let dy = 0; dy < 5 && free; dy++) for (let dz = -2; dz <= 2 && free; dz++) {
      if (get(x + dx, y + dy, z + dz) !== AIR) free = false;
    }
    if (free) return y;
  }
  return null;
}
function trySpawnNether(kind) {
  for (let i = 0; i < 20; i++) {
    const column = netherColumn();
    if (!column) continue;
    const [x, z] = column, y = kind === 'ghast' ? ghastSpot(x, z) : pigmanSpot(x, z);
    if (y !== null) return spawnMob(kind, x + 0.5, y, z + 0.5);
  }
  return null;
}
function updateNetherSpawning(dt) {
  netherSpawnTimer += dt;
  if (netherSpawnTimer < 5) return;
  netherSpawnTimer = 0;
  if (countKind('zombie_pigman') < MAX_PIGMEN) trySpawnNether('zombie_pigman');
  if (countKind('ghast') < MAX_GHASTS && Math.random() < 0.5) trySpawnNether('ghast');
}

Object.assign(window.game, { trySpawnNether, reflectFireball, shootFireball });
