// ---------- Oyun döngüsü ----------
// Oyun döngüsü: her karede hareket, fizik, kamera, animasyon ve çizim.

let last = performance.now(), walkPhase = 0, walkAmp = 0;
// Eğilme (Shift): hız çarpanı, kameranın alçalması; crouch 0–1 arası yumuşak geçiş
const CROUCH_SPEED = 0.3, CROUCH_DROP = 0.3;
// Uçma: yatay hız çarpanı ve dikey hız (blok/sn)
const FLY_SPEED = 2.5, FLY_VERTICAL = 7.5;
// Buz tutuşu (küçük: kaygan) ve kaktüs hasarı (saniyede 1)
const ICE_GRIP = 1.5;
let cactusTimer = 0;
// Oyuncu kutusu (0,1 genişletilmiş) bir kaktüsün dar kutusuna değiyor mu
function touchingCactus(p) {
  const m = 0.1;
  for (let x = Math.floor(p.x - p.w - m); x <= Math.floor(p.x + p.w + m); x++)
    for (let y = Math.floor(p.y); y <= Math.floor(p.y + p.h); y++)
      for (let z = Math.floor(p.z - p.w - m); z <= Math.floor(p.z + p.w + m); z++) {
        if (get(x, y, z) !== B.cactus) continue;
        const [x0, , z0, x1, , z1] = BLOCKS[B.cactus].box;
        if (p.x - p.w - m < x + x1 && p.x + p.w + m > x + x0 && p.z - p.w - m < z + z1 && p.z + p.w + m > z + z0) return true;
      }
  return false;
}
let crouching = false, crouch = 0;
// Eğilirken ayağın altında (x, z) konumunda destek var mı
const supported = (p, x, z) => collides({ w: W, h: 0.05 }, x, p.y - 0.06, z);
// Su: yukarı yüzme hızı ve en yüksek batma hızı (blok/sn)
const SWIM_UP_SPEED = 3, SINK_SPEED = 3;
const underwaterEl = document.getElementById('underwater');
// Arkadan kamera: omuz kayması, uzaklık ve engellere göre yumuşatılmış anlık uzaklık
const CAMERA_DISTANCE = 3.5, SHOULDER_OFFSET = 0.6, SHOULDER_RISE = 0.25;
let cameraDistance = CAMERA_DISTANCE;
// from noktasından dir yönünde, bloğa 0,25'ten fazla yaklaşmadan gidilebilecek en uzak mesafe (en çok max).
function cameraClearance(from, dir, max) {
  const q = new THREE.Vector3();
  for (let d = 0.05; d <= max; d += 0.05) {
    q.copy(from).addScaledVector(dir, d);
    const blocked = [[0, 0, 0], [0.25, 0, 0], [-0.25, 0, 0], [0, 0.25, 0], [0, -0.25, 0], [0, 0, 0.25], [0, 0, -0.25]]
      .some(([ox, oy, oz]) => isSolid(get(Math.floor(q.x + ox), Math.floor(q.y + oy), Math.floor(q.z + oz))));
    if (blocked) return Math.max(0, d - 0.05);
  }
  return max;
}
function frame(now) {
  // rAF zaman damgası, betiğin başladığı andan önce olabilir; negatif dt fiziği ters çevirir.
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
  last = now;
  const p = player;

  const inWater = overlapsBlock(p, isWater);
  const inLava = overlapsBlock(p, isLava);
  const onIce = p.onGround && get(Math.floor(p.x), Math.floor(p.y - 0.05), Math.floor(p.z)) === B.ice;
  if (playing) updateSleep(dt);
  if (playing && !inventoryOpen && !chatOpen && !controlOpen && sleepTimer <= 0) {
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    const rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
    let mx = 0, mz = 0;
    if (keys.KeyW) { mx += fx; mz += fz; }
    if (keys.KeyS) { mx -= fx; mz -= fz; }
    if (keys.KeyD) { mx += rx; mz += rz; }
    if (keys.KeyA) { mx -= rx; mz -= rz; }
    const len = Math.hypot(mx, mz);
    if (!keys.KeyW) sprinting = false;
    if (p.food <= SPRINT_FOOD) sprinting = false;
    // Uçarken Shift alçaltır, eğilmez.
    crouching = !flying && !!(keys.ShiftLeft || keys.ShiftRight);
    if (crouching) sprinting = false;
    const sprintNow = sprinting && p.food > SPRINT_FOOD;
    const speed = (sprintNow ? 6.2 : 4.3) * (inWater ? 0.5 : inLava ? 0.35 : 1) * (crouching ? CROUCH_SPEED : 1) * (flying ? FLY_SPEED : 1);
    updateHunger(dt, sprintNow && len > 0);
    updateSteps(dt, len > 0 && !inWater, sprintNow);
    const targetVx = (len ? mx / len * speed : 0) + p.kx, targetVz = (len ? mz / len * speed : 0) + p.kz;
    // Buzda kayar: hız hedefe yavaşça yaklaşır
    if (onIce) { const k = Math.min(1, dt * ICE_GRIP); p.vx += (targetVx - p.vx) * k; p.vz += (targetVz - p.vz) * k; }
    else { p.vx = targetVx; p.vz = targetVz; }
    if (flying) p.vy = ((keys.Space ? 1 : 0) - (keys.ShiftLeft || keys.ShiftRight ? 1 : 0)) * FLY_VERTICAL;
    else if (keys.Space && (inWater || inLava)) p.vy = SWIM_UP_SPEED;
    else if (keys.Space && p.onGround) { p.vy = JUMP; p.onGround = false; }
  } else { p.vx = p.vz = 0; crouching = false; if (flying) p.vy = 0; }
  crouch += ((crouching ? 1 : 0) - crouch) * Math.min(1, dt * 12);
  const knockDecay = Math.exp(-dt * 6);
  p.kx *= knockDecay; p.kz *= knockDecay;
  updateHealth(dt);

  // Suda yerçekimi 1/4, batma hızı sınırlı; uçarken yerçekimi yok
  if (!flying) p.vy = inWater || inLava ? Math.max(p.vy - GRAVITY / 4 * dt, -SINK_SPEED) : Math.max(p.vy - GRAVITY * dt, -40);
  // Eğilirken blok kenarından düşülmez: adım desteksiz bırakacaksa o eksendeki hareket durur.
  if (crouching && p.onGround) {
    if (!supported(p, p.x + p.vx * dt, p.z)) p.vx = 0;
    if (!supported(p, p.x + p.vx * dt, p.z + p.vz * dt)) p.vz = 0;
  }
  stepEntity(p, dt);
  // Yere değince uçuş biter
  if (flying && p.onGround) flying = false;
  if (playing) {
    for (const m of mobs) updateMob(m, dt);
    if (dimension === 'overworld') {
      updateAnimalSpawning(dt);
      updateHostileSpawning(dt);
    } else updateNetherSpawning(dt);
    updateBlazeSpawners(dt);
    updateGuide(dt);
    updateBow(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateDrops(dt);
    updateFurnaces(dt);
    updateFluids(dt);
    updateChunks(dt);
    updateVillages(dt);
    updateCrops(dt);
    updateMobSounds(dt);
    updateDebris(dt);
    updatePortal(dt);
    updateLava(dt, inLava);
    // Kaktüse değen oyuncu saniyede 1 hasar alır
    cactusTimer -= dt;
    if (cactusTimer <= 0 && touchingCactus(p)) { cactusTimer = 1; damagePlayer(1); }
  }
  for (const m of mobs) renderMob(m);
  renderDrops();
  // Düşme hasarı: 3 bloğun üstündeki her blok 1 can
  if (playing) {
    // Suya düşen ve uçma açıkken düşen hasar almaz
    if (inWater || inLava || flyAllowed) p.fallPeak = null;
    else if (!p.onGround) p.fallPeak = Math.max(p.fallPeak ?? p.y, p.y);
    else if (p.fallPeak !== null) {
      const fall = p.fallPeak - p.y;
      p.fallPeak = null;
      if (fall > 3.5) damagePlayer(Math.round(fall - 3));
    }
    if (p.y < -20) die();
  }

  // Kamera: 0 arkadan, 1 gözden, 2 önden. Arkada/önde duvar varsa kamera yaklaşır.
  const eye = new THREE.Vector3(p.x, p.y + EYE - crouch * CROUCH_DROP, p.z);
  const dir = new THREE.Vector3(-Math.sin(p.yaw) * Math.cos(p.pitch), Math.sin(p.pitch), -Math.cos(p.yaw) * Math.cos(p.pitch));
  aim.o.copy(eye); aim.d.copy(dir); aim.max = 6; aim.start = 0;
  if (view === 1) {
    camera.position.copy(eye);
    camera.rotation.set(p.pitch, p.yaw, rollSign * HURT_ROLL * cameraRoll / 0.2);
  } else if (view === 0) {
    // Omuz üstü: kamera sağ omzun üstündeki noktadan geriye çekilir; karakter ekranın solunda kalır, nişangâh boş kalır.
    const right = new THREE.Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
    const shoulderDir = right.multiplyScalar(SHOULDER_OFFSET).add(new THREE.Vector3(0, SHOULDER_RISE, 0));
    const shoulderLen = shoulderDir.length();
    shoulderDir.normalize();
    const shoulder = eye.clone().addScaledVector(shoulderDir, cameraClearance(eye, shoulderDir, shoulderLen));
    const back = dir.clone().negate();
    const target = cameraClearance(shoulder, back, CAMERA_DISTANCE);
    // Engel yaklaşınca hemen öne gelir, açılınca yumuşakça geri çekilir.
    cameraDistance = target < cameraDistance ? target : cameraDistance + (target - cameraDistance) * Math.min(1, dt * 5);
    camera.position.copy(shoulder).addScaledVector(back, cameraDistance);
    camera.rotation.set(p.pitch, p.yaw, rollSign * HURT_ROLL * cameraRoll / 0.2);
    aim.o.copy(camera.position); aim.max = 6 + cameraDistance; aim.start = cameraDistance;
  } else {
    const dist = cameraClearance(eye, dir, CAMERA_DISTANCE);
    camera.position.copy(eye).addScaledVector(dir, dist);
    camera.lookAt(eye);
  }
  // Koşarken genişler, yay gerilirken daralır
  const fov = settings.fov + ((sprinting && playing && Math.hypot(p.vx, p.vz) > 0.1) ? 10 : 0) - bowCharge * 10;
  if (Math.abs(camera.fov - fov) > 0.1) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 10); camera.updateProjectionMatrix(); }

  // Model ve yürüme animasyonu
  const speedH = Math.hypot(p.vx, p.vz);
  walkAmp += ((speedH > 0.1 ? Math.min(1, speedH / 4.3) : 0) - walkAmp) * Math.min(1, dt * 10);
  walkPhase += dt * speedH * 2.4;
  const swing = Math.sin(walkPhase) * 0.8 * walkAmp;
  punch = Math.max(0, punch - dt);
  const pk = Math.sin(punch / 0.25 * Math.PI);
  // Kamera karakterin içine girecek kadar yaklaşınca model gizlenir.
  model.visible = view === 2 || (view === 0 && cameraDistance > 0.8);
  // Eğilince model alçalır, kollar öne gelir
  model.position.set(p.x, p.y - crouch * 0.15, p.z);
  model.rotation.y = p.yaw;
  head.rotation.x = p.pitch;
  legR.rotation.x = swing; legL.rotation.x = -swing;
  // Elinde eşya varken sağ kol biraz önde durur (Minecraft'taki gibi), eşya gövdenin önünde kaybolmaz
  const holding = tpTool.visible || tpBlock.visible ? 0.35 : 0;
  armL.rotation.x = swing - crouch * 0.4; armR.rotation.x = -swing + pk * 1.4 - crouch * 0.4 + holding;
  // Yay gerilirken iki kol öne uzanır
  if (bowCharge > 0) armL.rotation.x = armR.rotation.x = Math.PI / 2 + p.pitch;

  // Yay gerilirken kol geri çekilir
  fpArm.position.set(0.45 + Math.sin(walkPhase) * 0.03 * walkAmp, -0.42 + Math.abs(Math.cos(walkPhase)) * 0.03 * walkAmp + pk * 0.12, -0.75 - pk * 0.25 + bowCharge * 0.25);
  fpArm.rotation.set(1.75 + pk * 0.4, 0.35, 0);

  document.getElementById('crosshair').hidden = view === 2;
  const hit = playing ? raycast() : null;
  const mobHit = playing ? rayMob() : null;
  updateMining(playing && !inventoryOpen && !controlOpen ? dt : 0, playing && !inventoryOpen && !controlOpen ? hit : null);
  // İmleç bir canlının üstündeyse blok çerçevesi gizlenir.
  highlight.visible = !!hit && !(mobHit && mobHit.t < hit.t);
  if (hit) highlight.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);

  // Video aracı (tools/video): kamera dışarıdan sürülür { pos, look }; oyuncu modeli, kol ve seçim çerçevesi gizlenir (gök ve güneş yeni kameraya göre konsun diye gün döngüsünden önce)
  const rig = window.game.cameraRig;
  if (rig) {
    camera.position.set(...rig.pos);
    camera.lookAt(...rig.look);
    model.visible = highlight.visible = false;
  }
  updateDayCycle(dt);
  updateSky(dt);
  updateShaderMode(dt);
  // Kamera suyun içindeyse ekran mavi tonlanır, sis 8 bloğa iner.
  const cameraInWater = isWater(get(Math.floor(camera.position.x), Math.floor(camera.position.y), Math.floor(camera.position.z)));
  underwaterEl.hidden = !cameraInWater;
  const viewDistance = VIEW_DISTANCES[settings.viewDistance];
  // Sis kapalıyken yalnızca görüş sınırındaki chunk kenarlarını gizler
  scene.fog.near = cameraInWater ? 0 : dimension === 'nether' ? NETHER_FOG_NEAR : viewDistance * (settings.fog ? 0.43 : 0.85);
  // Kamera uzak düzlemi görüş mesafesi ve bulutlar (y = 192) çizilecek kadar geride
  const far = Math.max(300, viewDistance * 1.5);
  if (camera.far !== far) { camera.far = far; camera.updateProjectionMatrix(); }
  scene.fog.far = cameraInWater ? 8 : dimension === 'nether' ? NETHER_FOG_FAR : viewDistance;
  if (cameraInWater) scene.fog.color.setRGB(0.1, 0.25, 0.5).multiplyScalar(brightnessUniform.value);
  info.textContent = `${clockText()} · X ${Math.floor(p.x)} · Y ${Math.floor(p.y)} · Z ${Math.floor(p.z)}`;
  renderWorld(view === 1 && !rig);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Kayıt, bütün betikler yüklendikten sonra okunur (yükleme sırasında başka betiğin tanımı eksik kalmasın).
loadGame();
