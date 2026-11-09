// ---------- Three.js sahnesi ----------
// Three.js sahnesi, kamera, ışıklar, malzemeler ve chunk mesh kurulumu.

const container = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.autoClear = false;
container.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const sky = new THREE.Color(0x9cc8ef);
scene.background = sky;
scene.fog = new THREE.Fog(sky, 30, 70);
const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 200);
camera.rotation.order = 'YXZ';
const HEMI_INTENSITY = 0.8, SUN_INTENSITY = 0.5;
function addLights(s) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0x9a8f80, HEMI_INTENSITY);
  const sun = new THREE.DirectionalLight(0xffffff, SUN_INTENSITY);
  sun.position.set(0.4, 1, 0.3);
  s.add(hemi, sun);
  return { hemi, sun };
}
const lightRigs = [addLights(scene)];

// Gözden görünümde kol ayrı bir sahnede, dünyanın üstüne çizilir (duvara girmesin diye).
const fpScene = new THREE.Scene();
lightRigs.push(addLights(fpScene));
const fpCam = new THREE.PerspectiveCamera(70, 1, 0.01, 10);

function resize() {
  const w = container.clientWidth, h = container.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = fpCam.aspect = w / h;
  camera.updateProjectionMatrix(); fpCam.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const texture = new THREE.CanvasTexture(atlas);
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
texture.generateMipmaps = false;
// Dünya malzemeleri: gece karartması (uBrightness) ile meşale ışığı (torchLight köşe niteliği) birleşir;
// meşale ışığı karartmadan etkilenmez: renk × max(parlaklık, meşale × sıcak sarı).
const brightnessUniform = { value: 1 };
function withTorchLight(mat) {
  mat.onBeforeCompile = shader => {
    shader.uniforms.uBrightness = brightnessUniform;
    shader.vertexShader = 'attribute float torchLight;\nvarying float vTorch;\n' +
      shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vTorch = torchLight;');
    shader.fragmentShader = 'uniform float uBrightness;\nvarying float vTorch;\n' +
      shader.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\n  diffuseColor.rgb *= max(vec3(uBrightness), vTorch * vec3(1.0, 0.85, 0.6));');
  };
  return mat;
}
// alphaTest: camın saydam pikselleri kesilir
const material = withTorchLight(new THREE.MeshBasicMaterial({ map: texture, vertexColors: true, alphaTest: 0.5 }));

const FACES = [
  { dir: [-1, 0, 0], light: 0.8, corners: [[[0, 1, 0], [0, 1]], [[0, 0, 0], [0, 0]], [[0, 1, 1], [1, 1]], [[0, 0, 1], [1, 0]]] },
  { dir: [1, 0, 0], light: 0.8, corners: [[[1, 1, 1], [0, 1]], [[1, 0, 1], [0, 0]], [[1, 1, 0], [1, 1]], [[1, 0, 0], [1, 0]]] },
  { dir: [0, -1, 0], light: 0.5, corners: [[[1, 0, 1], [1, 0]], [[0, 0, 1], [0, 0]], [[1, 0, 0], [1, 1]], [[0, 0, 0], [0, 1]]] },
  { dir: [0, 1, 0], light: 1.0, corners: [[[0, 1, 1], [1, 1]], [[1, 1, 1], [0, 1]], [[0, 1, 0], [1, 0]], [[1, 1, 0], [0, 0]]] },
  { dir: [0, 0, -1], light: 0.65, corners: [[[1, 0, 0], [0, 0]], [[0, 0, 0], [1, 0]], [[1, 1, 0], [0, 1]], [[0, 1, 0], [1, 1]]] },
  { dir: [0, 0, 1], light: 0.65, corners: [[[0, 0, 1], [0, 0]], [[1, 0, 1], [1, 0]], [[0, 1, 1], [0, 1]], [[1, 1, 1], [1, 1]]] },
];
const EPS = 0.001;

// Saydam bloklar (su) ayrı, yarı saydam bir malzemeyle ve ayrı mesh'te çizilir.
// Kendi ışığı olan bloklar (lav, ışıltı taşı): karanlıktan etkilenmez
const glowMaterial = new THREE.MeshBasicMaterial({ map: texture, vertexColors: true });
const waterMaterial = withTorchLight(new THREE.MeshBasicMaterial({ map: texture, vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false }));
// Meşale ışığı: 7,5 blokta sıfıra iner.
const TORCH_RANGE = 7.5;
function torchesNear(x0, z0, x1, z1) {
  const list = [];
  [x0, z0, x1, z1] = [x0, z0, x1, z1].map(Math.floor);
  // Alanın değdiği her yüklü chunk'ın dizisi doğrudan taranır
  for (let cz = Math.floor(z0 / CH); cz <= Math.floor(z1 / CH); cz++) for (let cx = Math.floor(x0 / CH); cx <= Math.floor(x1 / CH); cx++) {
    const c = world.get(chunkKey(cx, cz));
    if (!c) continue;
    const zs = Math.max(z0, cz * CH), ze = Math.min(z1, cz * CH + CH - 1), xs = Math.max(x0, cx * CH), xe = Math.min(x1, cx * CH + CH - 1);
    for (let y = 0, top = chunkTop(c); y < top; y++) for (let z = zs; z <= ze; z++) for (let x = xs; x <= xe; x++) {
      if (isLightSource(c[(y * CH + z - cz * CH) * CH + x - cx * CH])) list.push([x + 0.5, y + 0.6, z + 0.5]);
    }
  }
  return list;
}
function torchLightAt(torches, x, y, z) {
  let light = 0;
  for (const [tx, ty, tz] of torches) light = Math.max(light, 1 - Math.hypot(tx - x, ty - y, tz - z) / TORCH_RANGE);
  return light;
}
// Çapraz bitki: hücrenin köşegenlerinde iki düzlem, her biri iki yüzlü (arka yüz ayrı üçgenlerle).
function addCrossModel(buf, x, y, z, def, torches) {
  const lit = torches.length ? torchLightAt(torches, x + 0.5, y + 0.5, z + 0.5) : 0;
  const u0 = (def.side + EPS) / N_TILES, u1 = (def.side + 1 - EPS) / N_TILES;
  const planes = [[[0.15, 0.15], [0.85, 0.85]], [[0.15, 0.85], [0.85, 0.15]]];
  for (const [[ax, az], [bx, bz]] of planes) for (const flip of [false, true]) {
    const [p0, p1] = flip ? [[bx, bz], [ax, az]] : [[ax, az], [bx, bz]];
    const base = buf.pos.length / 3;
    for (const [[px2, pz2], uu, vv] of [[p0, u0, 0], [p1, u1, 0], [p0, u0, 1], [p1, u1, 1]]) {
      buf.pos.push(x + px2, y + vv * 0.9, z + pz2);
      buf.uv.push(flip ? u0 + u1 - uu : uu, vv ? 1 - EPS : EPS);
      buf.col.push(0.9, 0.9, 0.9);
      buf.light.push(lit);
    }
    buf.idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
  }
}
// Hücre içindeki bir kutu (kapı levhası); hücre kenarındaki yüz komşu opak blokla çakışıyorsa çizilmez.
function addBoxModel(buf, x, y, z, def, torches) {
  const [x0, y0, z0, x1, y1, z1] = def.box;
  for (const f of FACES) {
    const [fx, fy, fz] = f.dir;
    const onEdge = (fx === 1 && x1 === 1) || (fx === -1 && x0 === 0) || (fy === 1 && y1 === 1) || (fy === -1 && y0 === 0) || (fz === 1 && z1 === 1) || (fz === -1 && z0 === 0);
    const n = get(x + fx, y + fy, z + fz);
    if (onEdge && n !== AIR && !BLOCKS[n].transparent && isSolid(n)) continue;
    const tile = def.side;
    const lit = torches.length ? torchLightAt(torches, x + 0.5 + fx * 0.5, y + 0.5 + fy * 0.5, z + 0.5 + fz * 0.5) : 0;
    const base = buf.pos.length / 3;
    for (const [p] of f.corners) {
      const lx = p[0] ? x1 : x0, ly = p[1] ? y1 : y0, lz = p[2] ? z1 : z0;
      buf.pos.push(x + lx, y + ly, z + lz);
      // Doku yüzün ekseninde hücre koordinatından okunur
      const [u, v] = fx ? [lz, ly] : fz ? [lx, ly] : [lx, lz];
      buf.uv.push((tile + Math.min(1 - EPS, Math.max(EPS, u))) / N_TILES, Math.min(1 - EPS, Math.max(EPS, v)));
      buf.col.push(f.light, f.light, f.light);
      buf.light.push(lit);
    }
    buf.idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
  }
}
// Yatak hücresi: yarım blok yüksekliğinde kutu; iki yarı arasındaki yüz ve alt yüz çizilmez.
// Üst dokunun "yukarısı" (v = 1) her iki yarıda da baş tarafına döner.
function addBedModel(buf, x, y, z, def, torches) {
  const [dx, dz] = def.dir, other = def.part === 'foot' ? [dx, dz] : [-dx, -dz];
  const clamp = v => Math.min(1 - EPS, Math.max(EPS, v));
  for (const f of FACES) {
    if (f.dir[1] === -1 || (f.dir[1] === 0 && f.dir[0] === other[0] && f.dir[2] === other[1])) continue;
    const top = f.dir[1] === 1, tile = top ? def.top : def.side;
    const lit = torches.length ? torchLightAt(torches, x + 0.5 + f.dir[0] * 0.5, y + BED_HEIGHT, z + 0.5 + f.dir[2] * 0.5) : 0;
    const base = buf.pos.length / 3;
    for (const [p, t] of f.corners) {
      buf.pos.push(x + p[0], y + p[1] * BED_HEIGHT, z + p[2]);
      let u = t[0], v = t[1] * BED_HEIGHT;
      if (top) { const rx = p[0] - 0.5, rz = p[2] - 0.5; v = rx * dx + rz * dz + 0.5; u = rz * dx - rx * dz + 0.5; }
      buf.uv.push((tile + clamp(u)) / N_TILES, clamp(v));
      buf.col.push(f.light, f.light, f.light);
      buf.light.push(lit);
    }
    buf.idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
  }
}
// Meşale çubuğu: 2x10 piksellik kutu; duvar meşalesi duvara yakın başlar ve dışa eğilir.
function addTorchModel(buf, x, y, z, def) {
  const [lx, lz] = def.lean, wall = lx || lz;
  const bx = x + 0.5 - lx * 0.38, by = y + (wall ? 0.2 : 0), bz = z + 0.5 - lz * 0.38;
  const w = 1 / 16, h = 10 / 16;
  const u0 = (def.side + 7 / 16) / N_TILES, u1 = (def.side + 9 / 16) / N_TILES;
  const vertex = (ox, oy, oz) => [bx + ox + oy * 0.6 * lx, by + oy, bz + oz + oy * 0.6 * lz];
  // Her yüz: 4 köşe (sol alt, sağ alt, sol üst, sağ üst) ve doku v aralığı
  const quads = [
    [[-w, 0, w], [w, 0, w], [-w, h, w], [w, h, w]], [[w, 0, -w], [-w, 0, -w], [w, h, -w], [-w, h, -w]],
    [[w, 0, w], [w, 0, -w], [w, h, w], [w, h, -w]], [[-w, 0, -w], [-w, 0, w], [-w, h, -w], [-w, h, w]],
    [[-w, h, w], [w, h, w], [-w, h, -w], [w, h, -w]],
  ];
  quads.forEach((quad, i) => {
    const top = i === 4, base = buf.pos.length / 3;
    const v0 = top ? 8 / 16 : 0, v1 = top ? 10 / 16 : 10 / 16;
    quad.forEach(([ox, oy, oz], k) => {
      buf.pos.push(...vertex(ox, oy, oz));
      buf.uv.push(k % 2 ? u1 : u0, (k < 2 ? v0 : v1));
      buf.col.push(1, 1, 1);
      buf.light.push(1);
    });
    buf.idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
  });
}
// Shader modu (shader-mode.js) açıkken chunk'lar ışıklı malzemeyle, AO'lu ve gölgeli kurulur.
let shaderMode = false;
const chunkMeshes = new Map();
// Yüz, komşu hava ise ya da komşu kendisinden farklı saydam bir bloksa çizilir.
const faceVisible = (b, n) => n === AIR || (n !== b && BLOCKS[n].transparent);
// Sıvının üst yüz yüksekliği: kaynak ve üstünde aynı sıvı olan hücre tam, akan sıvı seviyesi kadar alçak.
function liquidTop(x, y, z) {
  const def = BLOCKS[get(x, y, z)];
  return liquidOf(get(x, y + 1, z)) === def.liquid ? 1 : 1 - def.level / 8;
}
function buildChunk(cx, cz) {
  // 0 opak, 1 saydam, 2 kendi ışıklı. flat: yüz gölgesi yok (shader modunda ışıklar verir)
  const buffers = [0, 1, 2].map(() => ({ pos: [], uv: [], col: [], light: [], idx: [], flat: shaderMode }));
  const range = Math.ceil(TORCH_RANGE);
  const torches = torchesNear(cx * CH - range, cz * CH - range, cx * CH + CH - 1 + range, cz * CH + CH - 1 + range);
  // Biyom tonu sütun başına bir kez hesaplanır
  const tints = new Map();
  const tintAt = (x, z) => tints.get(x * 4096 + z) || tints.set(x * 4096 + z, BIOME_TINT[biomeAt(x, z)]).get(x * 4096 + z);
  const data = world.get(chunkKey(cx, cz)), topY = data ? chunkTop(data) : 0;
  for (let y = 0; y < topY; y++) for (let z = cz * CH; z < cz * CH + CH; z++) for (let x = cx * CH; x < cx * CH + CH; x++) {
    const b = get(x, y, z);
    if (b === AIR) continue;
    const def = BLOCKS[b];
    if (def.model === 'torch') { addTorchModel(buffers[0], x, y, z, def); continue; }
    if (def.model === 'bed') { addBedModel(buffers[0], x, y, z, def, torches); continue; }
    if (def.model === 'box') { addBoxModel(buffers[0], x, y, z, def, torches); continue; }
    if (def.model === 'cross') { addCrossModel(buffers[0], x, y, z, def, torches); continue; }
    if (def.model === 'shape') { addShapeModel(buffers[0], b, x, y, z, def, torches); continue; }
    if (def.model === 'portal') continue; // portal.js ayrı çizer
    const buf = buffers[def.selfLit ? 2 : def.transparent && !def.cutout ? 1 : 0];
    const { pos, uv, col, light, idx } = buf;
    const top = def.liquid ? liquidTop(x, y, z) : 1;
    for (const f of FACES) {
      const n = get(x + f.dir[0], y + f.dir[1], z + f.dir[2]);
      // Aynı sıvının komşusuna yüz çizilmez; yalnızca komşu daha alçaksa yan yüzün açık kalan kısmı görünür.
      if (def.liquid && liquidOf(n) === def.liquid) {
        if (f.dir[1] !== 0 || liquidTop(x + f.dir[0], y, z + f.dir[2]) >= top) continue;
      } else if (!faceVisible(b, n)) continue;
      const tile = f.dir[1] === 1 ? def.top : f.dir[1] === -1 ? def.bottom : def.side;
      const u0 = tile / N_TILES + EPS, u1 = (tile + 1) / N_TILES - EPS;
      const base = pos.length / 3;
      // Yüzün meşale ışığı: yüz merkezinin en yakın meşaleye uzaklığı
      const lit = torches.length ? torchLightAt(torches, x + 0.5 + f.dir[0] * 0.5, y + 0.5 + f.dir[1] * 0.5, z + 0.5 + f.dir[2] * 0.5) : 0;
      // Çimen üstü ve yapraklar biyoma göre tonlanır
      const tint = def.tint === 'all' || (def.tint === 'top' && f.dir[1] === 1) ? tintAt(x, z) : null;
      for (const [p, t] of f.corners) {
        pos.push(x + p[0], y + p[1] * top, z + p[2]);
        uv.push(u0 + (u1 - u0) * t[0], t[1] ? 1 - EPS : EPS);
        // Shader modunda yüz gölgesi yerine köşe ortam gölgesi
        const shadeLight = shaderMode ? cornerAO(x, y, z, f.dir, p) : f.light;
        if (tint) col.push(shadeLight * tint[0], shadeLight * tint[1], shadeLight * tint[2]);
        else col.push(shadeLight, shadeLight, shadeLight);
        light.push(lit);
      }
      idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
    }
  }
  const key = cx + ',' + cz;
  const old = chunkMeshes.get(key);
  const geos = buffers.map(({ pos, uv, col, light, idx }) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('torchLight', new THREE.Float32BufferAttribute(light, 1));
    geo.setIndex(idx);
    if (shaderMode) geo.computeVertexNormals();
    return geo;
  });
  if (old) {
    old.forEach((m, i) => { m.geometry.dispose(); m.geometry = geos[i]; });
  } else {
    const meshes = [new THREE.Mesh(geos[0], shaderMode ? shadedMaterial : material), new THREE.Mesh(geos[1], shaderMode ? shadedWaterMaterial : waterMaterial), new THREE.Mesh(geos[2], glowMaterial)];
    meshes[1].renderOrder = 1;
    meshes[0].castShadow = meshes[0].receiveShadow = shaderMode;
    scene.add(...meshes);
    chunkMeshes.set(key, meshes);
  }
  // Boş tampon (su ya da ışıklı blok yoksa) çizilmez
  chunkMeshes.get(key).forEach((m, i) => { m.visible = buffers[i].idx.length > 0; });
}
function removeChunkMesh(key) {
  for (const m of chunkMeshes.get(key) || []) { scene.remove(m); m.geometry.dispose(); }
  chunkMeshes.delete(key);
}
function clearChunkMeshes() { for (const key of [...chunkMeshes.keys()]) removeChunkMesh(key); }
// Yalnızca mesh'i kurulmuş chunk'lar yeniden kurulur (diğerleri sırası gelince kurulur, chunk-loader.js).
const rebuildKey = key => { if (chunkMeshes.has(key)) buildChunk(...key.split(',').map(Number)); };
// Meşale konunca ya da kırılınca ışığın yettiği bütün chunk'lar yeniden kurulur.
function rebuildArea(x, z, r) {
  for (let cx = Math.floor((x - r) / CH); cx <= Math.floor((x + r) / CH); cx++)
    for (let cz = Math.floor((z - r) / CH); cz <= Math.floor((z + r) / CH); cz++) rebuildKey(chunkKey(cx, cz));
}
function rebuildAround(x, z) {
  const done = new Set();
  for (const [dx, dz] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const key = chunkKey(Math.floor((x + dx) / CH), Math.floor((z + dz) / CH));
    if (!done.has(key)) { done.add(key); rebuildKey(key); }
  }
}
// Verisi yoksa üretip (r + 1 çevresiyle) r chunk çevresindeki mesh'leri hemen kurar (açılış, portal, ışınlanma).
function buildAround(x, z, r) {
  ensureArea(x, z, r + 1);
  const pcx = Math.floor(x / CH), pcz = Math.floor(z / CH);
  for (let cz = pcz - r; cz <= pcz + r; cz++) for (let cx = pcx - r; cx <= pcx + r; cx++) buildChunk(cx, cz);
}
buildAround(SPAWN_X, SPAWN_Z, 2);

const highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004)),
  new THREE.LineBasicMaterial({ color: 0x212121 })
);
highlight.visible = false;
scene.add(highlight);
