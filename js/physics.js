// ---------- Oyuncu ve fizik ----------
// Oyuncu durumu, doğma noktası ve ortak AABB fiziği.

const W = 0.3, H = 1.8, EYE = 1.62, GRAVITY = 26, JUMP = 8.4, MAX_HEALTH = 20, MAX_FOOD = 20;
// kx/kz: geri itilme hızı, her karede söner. fallPeak: havadayken ulaşılan en yüksek y.
// w/h: çarpışma kutusunun yarı genişliği ve boyu (canlılarla ortak fizik bunları kullanır).
const player = { x: SPAWN_X + 0.5, y: 0, z: SPAWN_Z + 0.5, w: W, h: H, vx: 0, vy: 0, vz: 0, kx: 0, kz: 0, yaw: 0, pitch: 0, onGround: false, health: MAX_HEALTH, food: MAX_FOOD, fallPeak: null };
// Yatakla belirlenen doğma noktası; yoksa dünyanın ortası.
let spawnPoint = null;
function spawn() {
  if (spawnPoint) {
    Object.assign(player, spawnPoint, { vx: 0, vy: 0, vz: 0, kx: 0, kz: 0, fallPeak: null });
    return;
  }
  const x = SPAWN_X, z = SPAWN_Z;
  let y = Math.min(SY - 1, columnTop(x, z));
  while (y > 0 && passable(get(x, y - 1, z))) y--;
  Object.assign(player, { x: x + 0.5, y: y, z: z + 0.5, vx: 0, vy: 0, vz: 0, kx: 0, kz: 0, fallPeak: null });
}
spawn();

const solid = (x, y, z) => isSolid(get(x, y, z));
// Varlığın kutusu verilen blok türüyle (ya da test işleviyle, ör. isWater) kesişiyor mu
function overlapsBlock(e, block) {
  const test = typeof block === 'function' ? block : b => b === block;
  for (let bx = Math.floor(e.x - e.w); bx <= Math.floor(e.x + e.w); bx++)
    for (let by = Math.floor(e.y); by <= Math.floor(e.y + e.h - 0.001); by++)
      for (let bz = Math.floor(e.z - e.w); bz <= Math.floor(e.z + e.w); bz++)
        if (test(get(bx, by, bz))) return true;
  return false;
}
// Oyuncu ve canlılar için ortak AABB fiziği: e = { x, y, z, w, h, vx, vy, vz, onGround }
// Bloğun hücre içindeki çarpışma kutuları [x0, y0, z0, x1, y1, z1]: şekil (shapes.js), kapı levhası (box), alçak blok (height) ya da tam hücre.
// tall bloklarda (çit, duvar) kutular 1,5 bloğa uzar.
const blockBoxes = (b, x, y, z) => BLOCKS[b].model !== 'shape' ? [BLOCKS[b].box || [0, 0, 0, 1, BLOCKS[b].height || 1, 1]]
  : BLOCKS[b].tall ? shapeBoxes(b, x, y, z).map(([x0, y0, z0, x1, , z1]) => [x0, y0, z0, x1, 1.5, z1]) : shapeBoxes(b, x, y, z);
// e kutusu (x, y, z) konumundayken kesiştiği blok kutuları, dünya koordinatında. Dünya kenarı duvardır.
function overlappingBoxes(e, x, y, z) {
  const boxes = [];
  for (let bx = Math.floor(x - e.w); bx <= Math.floor(x + e.w); bx++)
    // Bir alttaki hücreye de bakılır: 1,5 blokluk çit ve duvar üst hücreye taşar
    for (let by = Math.floor(y) - 1; by <= Math.floor(y + e.h - 0.001); by++)
      for (let bz = Math.floor(z - e.w); bz <= Math.floor(z + e.w); bz++) {
        const b = get(bx, by, bz);
        if (!isSolid(b) || (by < Math.floor(y) && !BLOCKS[b].tall)) continue;
        for (const [x0, y0, z0, x1, y1, z1] of blockBoxes(b, bx, by, bz)) {
          const box = [bx + x0, by + y0, bz + z0, bx + x1, by + y1, bz + z1];
          if (x - e.w < box[3] && x + e.w > box[0] && y < box[4] && y + e.h > box[1] && z - e.w < box[5] && z + e.w > box[2]) boxes.push(box);
        }
      }
  return boxes;
}
const collides = (e, x, y, z) => overlappingBoxes(e, x, y, z).length > 0;
// Yerdeyken en çok bu kadar yüksek bir basamağa (yarım blok, merdiven, eğim) kendiliğinden çıkılır.
const STEP_HEIGHT = 0.6;
// Çarpışma olduysa varlığı çarptığı kutunun yüzüne dayar ve true döner.
function moveAxis(e, axis, d, grounded) {
  if (!d) return false;
  e[axis] += d;
  const boxes = overlappingBoxes(e, e.x, e.y, e.z);
  if (!boxes.length) return false;
  // Yatay çarpışmada alçak basamağın üstüne çık (üstü boşsa)
  if (axis !== 'y' && grounded) {
    const rise = Math.max(...boxes.map(b => b[4])) - e.y;
    if (rise > 0 && rise <= STEP_HEIGHT && !collides(e, e.x, e.y + rise + 0.001, e.z)) { e.y += rise + 0.001; return false; }
  }
  const i = { x: 0, y: 1, z: 2 }[axis];
  if (axis === 'y') {
    if (d < 0) { e.y = Math.max(...boxes.map(b => b[4])); e.onGround = true; }
    else e.y = Math.min(...boxes.map(b => b[1])) - e.h - 0.001;
    e.vy = 0;
  } else {
    e[axis] = d > 0 ? Math.min(...boxes.map(b => b[i])) - e.w - 0.001 : Math.max(...boxes.map(b => b[i + 3])) + e.w + 0.001;
  }
  return true;
}
// Hızı dt boyunca uygular; adım 0,4 bloktan büyükse alt adımlara böler. Yatayda çarptıysa true döner.
function stepEntity(e, dt) {
  const steps = Math.ceil(Math.max(Math.abs(e.vx), Math.abs(e.vy), Math.abs(e.vz)) * dt / 0.4) || 1;
  let blocked = false;
  for (let i = 0; i < steps; i++) {
    const grounded = e.onGround;
    e.onGround = false;
    blocked = moveAxis(e, 'x', e.vx * dt / steps, grounded) || blocked;
    blocked = moveAxis(e, 'z', e.vz * dt / steps, grounded) || blocked;
    moveAxis(e, 'y', e.vy * dt / steps);
  }
  return blocked;
}
