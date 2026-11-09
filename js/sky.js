// ---------- Bulutlar ve yıldızlar ----------
// Bulutlar: ayardaki yükseklikte (alçak y = 60, yüksek y = 248, kapalı) düz bir katman; her doku pikseli 4x4 bloğa denk gelir, gürültüyle şekillenir,
// doğuya (+x) 0,6 blok/sn kayar ve oyuncuyla birlikte tekrarlanır. Yıldızlar: gece görünen 400 nokta.

const CLOUD_CELL = 4, CLOUD_TEXELS = 64, CLOUD_SPEED = 0.6, CLOUD_SPAN = 384;
const cloudTexture = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = CLOUD_TEXELS;
  const cg = c.getContext('2d');
  for (let y = 0; y < CLOUD_TEXELS; y++) for (let x = 0; x < CLOUD_TEXELS; x++) {
    // Kenarları birleşen (döşenebilir) gürültü: dört köşeden okunan değerlerin karışımı
    const fx = x / CLOUD_TEXELS, fy = y / CLOUD_TEXELS;
    const n = (sample, sx, sy) => fbm((x + sx) / 9 + 300, (y + sy) / 9 + 700) * sample;
    const v = n((1 - fx) * (1 - fy), 0, 0) + n(fx * (1 - fy), -CLOUD_TEXELS, 0) + n((1 - fx) * fy, 0, -CLOUD_TEXELS) + n(fx * fy, -CLOUD_TEXELS, -CLOUD_TEXELS);
    if (v > 0.56) { cg.fillStyle = '#ffffff'; cg.fillRect(x, y, 1, 1); }
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(CLOUD_SPAN / (CLOUD_TEXELS * CLOUD_CELL), CLOUD_SPAN / (CLOUD_TEXELS * CLOUD_CELL));
  return t;
})();
const cloudMaterial = new THREE.MeshBasicMaterial({ map: cloudTexture, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, fog: false });
const clouds = new THREE.Mesh(new THREE.PlaneGeometry(CLOUD_SPAN, CLOUD_SPAN), cloudMaterial);
clouds.rotation.x = -Math.PI / 2;
scene.add(clouds);
let cloudDrift = 0;

// Yıldızlar: kameraya bağlı, yarıçapı 150 olan kürenin üst yarısında
const stars = (() => {
  const sr = mulberry32(99), pos = [];
  for (let i = 0; i < 400; i++) {
    const u = sr() * 0.95 + 0.05, th = sr() * Math.PI * 2, r = Math.sqrt(1 - u * u);
    pos.push(Math.cos(th) * r * 150, u * 150, Math.sin(th) * r * 150);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  scene.add(points);
  return points;
})();

function updateSky(dt) {
  // Nether'de bulut ve yıldız yok
  stars.visible = dimension === 'overworld';
  const cloudHeight = CLOUD_HEIGHTS[settings.clouds];
  clouds.visible = stars.visible && cloudHeight !== null;
  if (playing) cloudDrift += CLOUD_SPEED * dt;
  // Katman oyuncunun üstünde durur; doku dünyaya sabit kalacak şekilde kaydırılır.
  clouds.position.set(camera.position.x, cloudHeight ?? 0, camera.position.z);
  const tile = CLOUD_TEXELS * CLOUD_CELL;
  cloudTexture.offset.set((camera.position.x - CLOUD_SPAN / 2 - cloudDrift) / tile, -(camera.position.z + CLOUD_SPAN / 2) / tile);
  // Gece grileşir
  const light = daylight(clock.time);
  cloudMaterial.color.setScalar(0.3 + 0.7 * light);
  stars.position.copy(camera.position);
  stars.rotation.z = clock.time * Math.PI * 2;
  stars.material.opacity = 1 - light;
}

Object.assign(window.game, { clouds, stars, cloudDrift: () => cloudDrift });
