// ---------- Blok şekilleri ----------
// Tam küp olmayan yapı bloklarının geometrisi: merdiven, yarım blok, eğim, kemer, yuvarlak köşe, sütun, çit, parmaklık, duvar.
// Her şekil hücre içinde çokgenler (çizim) ve kutular (çarpışma) olarak tanımlanır; yerleştirme ve simge de buradadır.

// Kanonik çerçeve: u bakış yönü (dir) boyunca 0 -> 1, v yükseklik, w yan eksen. flip: üst yarı (v ters çevrilir).
function toCell([u, v, w], dir, flip) {
  const vv = flip ? 1 - v : v;
  if (dir[0] === 1) return [u, vv, w];
  if (dir[0] === -1) return [1 - u, vv, 1 - w];
  if (dir[1] === 1) return [1 - w, vv, u];
  return [w, vv, 1 - u];
}
// Kutu [u0, v0, w0, u1, v1, w1] -> altı yüz ({ pts, n }) kanonik çerçevede
function boxPolys([a, b, c, d, e, f]) {
  return [
    { pts: [[a, b, c], [a, b, f], [a, e, f], [a, e, c]], n: [-1, 0, 0] }, { pts: [[d, b, c], [d, e, c], [d, e, f], [d, b, f]], n: [1, 0, 0] },
    { pts: [[a, b, c], [d, b, c], [d, b, f], [a, b, f]], n: [0, -1, 0] }, { pts: [[a, e, c], [a, e, f], [d, e, f], [d, e, c]], n: [0, 1, 0] },
    { pts: [[a, b, c], [a, e, c], [d, e, c], [d, b, c]], n: [0, 0, -1] }, { pts: [[a, b, f], [d, b, f], [d, e, f], [a, e, f]], n: [0, 0, 1] },
  ];
}
const ARC_STEPS = 8;
const arc = (fn, steps = ARC_STEPS) => Array.from({ length: steps + 1 }, (_, i) => fn(i / steps * Math.PI / 2));
// Kanonik şekiller: { polys, boxes }. Kesit u-v düzleminde, w boyunca uzar (kemer, eğim) ya da v boyunca (köşe, sütun).
const CANONICAL = {
  stairs: () => {
    const boxes = [[0, 0, 0, 1, 0.5, 1], [0.5, 0.5, 0, 1, 1, 1]];
    return { boxes, polys: boxes.flatMap(boxPolys) };
  },
  slab: () => ({ boxes: [[0, 0, 0, 1, 0.5, 1]], polys: boxPolys([0, 0, 0, 1, 0.5, 1]) }),
  // Bakış yönüne doğru yükselen 45° eğim
  slope: () => ({
    polys: [
      { pts: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], n: [0, -1, 0] },
      { pts: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], n: [1, 0, 0] },
      { pts: [[0, 0, 0], [0, 0, 1], [1, 1, 1], [1, 1, 0]], n: [-Math.SQRT1_2, Math.SQRT1_2, 0] },
      { pts: [[0, 0, 0], [1, 1, 0], [1, 0, 0]], n: [0, 0, -1] },
      { pts: [[0, 0, 1], [1, 0, 1], [1, 1, 1]], n: [0, 0, 1] },
    ],
    boxes: [0, 1, 2, 3].map(i => [i / 4, 0, 0, (i + 1) / 4, (i + 1) / 4, 1]),
  }),
  // Kemer parçası: altı, bakış yönündeki alt köşeyi merkez alan çeyrek daireyle oyulmuş. İki parça karşılıklı konunca kemer olur.
  arch: () => {
    const curve = arc(a => [1 - Math.cos(a), Math.sin(a)]); // (0,0) -> (1,1)
    const polys = [
      { pts: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]], n: [0, 1, 0] },
      { pts: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], n: [-1, 0, 0] },
    ];
    for (let i = 0; i < ARC_STEPS; i++) {
      const [u0, v0] = curve[i], [u1, v1] = curve[i + 1], a = (i + 0.5) / ARC_STEPS * Math.PI / 2;
      polys.push({ pts: [[u0, v0, 0], [u1, v1, 0], [u1, v1, 1], [u0, v0, 1]], n: [Math.cos(a), -Math.sin(a), 0] });
    }
    // Uç yüzler: (0,1) köşesinden yelpaze (eğri bu köşeden bütünüyle görünür)
    for (const w of [0, 1]) polys.push({ pts: [[0, 1, w], ...curve.map(([u, v]) => [u, v, w]), [1, 1, w]], n: [0, 0, w ? 1 : -1] });
    const carve = u => Math.sqrt(Math.max(0, 1 - (1 - u) * (1 - u)));
    return { polys, boxes: [0, 1, 2, 3].map(i => [i / 4, carve((i + 0.5) / 4), 0, (i + 1) / 4, 1, 1]) };
  },
  // Yuvarlak köşe: (u=0, w=0) köşesini merkez alan çeyrek silindir
  corner: () => {
    const ring = arc(a => [Math.cos(a), Math.sin(a)]);
    const polys = [
      { pts: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], n: [-1, 0, 0] },
      { pts: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]], n: [0, 0, -1] },
    ];
    for (let i = 0; i < ARC_STEPS; i++) {
      const [u0, w0] = ring[i], [u1, w1] = ring[i + 1], a = (i + 0.5) / ARC_STEPS * Math.PI / 2;
      polys.push({ pts: [[u0, 0, w0], [u1, 0, w1], [u1, 1, w1], [u0, 1, w0]], n: [Math.cos(a), 0, Math.sin(a)] });
    }
    for (const v of [0, 1]) polys.push({ pts: [[0, v, 0], ...ring.map(([u, w]) => [u, v, w])], n: [0, v ? 1 : -1, 0] });
    const reach = u => Math.sqrt(Math.max(0, 1 - u * u));
    return { polys, boxes: [0, 1, 2, 3].map(i => [i / 4, 0, 0, (i + 1) / 4, 1, reach((i + 0.5) / 4)]) };
  },
  // Yuvarlak sütun: hücreye oturan silindir
  pillar: () => {
    const steps = 16, ring = Array.from({ length: steps + 1 }, (_, i) => i / steps * Math.PI * 2);
    const at = a => [0.5 + Math.cos(a) / 2, 0.5 + Math.sin(a) / 2];
    const polys = [];
    for (let i = 0; i < steps; i++) {
      const [u0, w0] = at(ring[i]), [u1, w1] = at(ring[i + 1]), a = (ring[i] + ring[i + 1]) / 2;
      polys.push({ pts: [[u0, 0, w0], [u1, 0, w1], [u1, 1, w1], [u0, 1, w0]], n: [Math.cos(a), 0, Math.sin(a)] });
    }
    for (const v of [0, 1]) polys.push({ pts: [[0.5, v, 0.5], ...ring.map(a => { const [u, w] = at(a); return [u, v, w]; })], n: [0, v ? 1 : -1, 0] });
    return { polys, boxes: [[0.15, 0, 0.15, 0.85, 1, 0.85]] };
  },
};
// Bağlanan şekiller: [direk kutusu, kol yarı genişliği, kolların [alt, üst] yükseklikleri]
const CONNECTORS = {
  fence: [[6 / 16, 0, 6 / 16, 10 / 16, 1, 10 / 16], 1 / 16, [[6 / 16, 9 / 16], [12 / 16, 15 / 16]]],
  pane: [[7 / 16, 0, 7 / 16, 9 / 16, 1, 9 / 16], 1 / 16, [[0, 1]]],
  wall: [[4 / 16, 0, 4 / 16, 12 / 16, 1, 12 / 16], 3 / 16, [[0, 13 / 16]]],
};
// Tam, opak küp: şekiller ona bağlanır ve ona dayanan yüzlerini çizmez
const isFullCube = n => n !== AIR && isSolid(n) && !BLOCKS[n].transparent && !BLOCKS[n].model && !BLOCKS[n].box && !BLOCKS[n].height;
function connectsTo(def, n) {
  const other = BLOCKS[n];
  return isFullCube(n) || (!!other && other.model === 'shape' && other.shape === def.shape);
}
// Bağlanan şeklin kutuları (hücre çerçevesinde). x verilmezse (simge) doğu-batı bağlı çizilir.
function connectedBoxes(def, x, y, z) {
  const [post, hw, rails] = CONNECTORS[def.shape], boxes = [post];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const linked = x === undefined ? dx !== 0 : connectsTo(def, get(x + dx, y, z + dz));
    if (!linked) continue;
    for (const [y0, y1] of rails) {
      const lo = 0.5 - hw, hi = 0.5 + hw;
      if (dx === 1) boxes.push([0.5, y0, lo, 1, y1, hi]);
      else if (dx === -1) boxes.push([0, y0, lo, 0.5, y1, hi]);
      else if (dz === 1) boxes.push([lo, y0, 0.5, hi, y1, 1]);
      else boxes.push([lo, y0, 0, hi, y1, 0.5]);
    }
  }
  return boxes;
}
// Yönlü şekillerin hücre çerçevesindeki geometrisi kimlik başına bir kez hesaplanır.
const shapeCache = new Map();
function shapeGeometry(b, x, y, z) {
  const def = BLOCKS[b];
  if (CONNECTORS[def.shape]) {
    const boxes = connectedBoxes(def, x, y, z);
    return { boxes, polys: boxes.flatMap(boxPolys) };
  }
  if (shapeCache.has(b)) return shapeCache.get(b);
  const { polys, boxes } = CANONICAL[def.shape]();
  const t = p => toCell(p, def.dir, def.flip), o = t([0, 0, 0]);
  const geo = {
    polys: polys.map(({ pts, n }) => ({ pts: pts.map(t), n: t(n).map((c, i) => c - o[i]) })),
    boxes: boxes.map(([a, b2, c, d, e, f]) => {
      const p = t([a, b2, c]), q = t([d, e, f]);
      return [0, 1, 2].map(i => Math.min(p[i], q[i])).concat([0, 1, 2].map(i => Math.max(p[i], q[i])));
    }),
  };
  shapeCache.set(b, geo);
  return geo;
}
// Çarpışma kutuları (physics.js)
const shapeBoxes = (b, x, y, z) => shapeGeometry(b, x, y, z).boxes;

// Yüzün ışık payı (renderer.js FACES ile aynı: üst 1, alt 0,5, x 0,8, z 0,65)
const faceShade = ([nx, ny, nz]) => nx * nx * 0.8 + nz * nz * 0.65 + ny * ny * (ny > 0 ? 1 : 0.5);
// Çokgeni tampona yazar: dışa bakan sıraya çevirir, doku hücre koordinatından normale göre izdüşümle okunur.
function emitPoly(buf, pts, n, def, ox, oy, oz, lit) {
  const [a, b, c] = pts;
  const cross = [(b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])];
  const list = cross[0] * n[0] + cross[1] * n[1] + cross[2] * n[2] < 0 ? [pts[0], ...pts.slice(1).reverse()] : pts;
  const [nx, ny, nz] = n.map(Math.abs);
  const tile = n[1] > 0.7 ? def.top : n[1] < -0.7 ? def.bottom : def.side, shadeLight = buf.flat ? 1 : faceShade(n);
  const clamp = v => Math.min(1 - EPS, Math.max(EPS, v));
  const base = buf.pos.length / 3;
  for (const [px2, py2, pz2] of list) {
    buf.pos.push(ox + px2, oy + py2, oz + pz2);
    const [u, v] = ny >= nx && ny >= nz ? [px2, pz2] : nx >= nz ? [pz2, py2] : [px2, py2];
    buf.uv.push((tile + clamp(u)) / N_TILES, clamp(v));
    buf.col.push(shadeLight, shadeLight, shadeLight);
    buf.light.push(lit);
  }
  for (let i = 1; i < list.length - 1; i++) buf.idx.push(base, base + i, base + i + 1);
}
// Çokgen hücre sınırındaysa o yöndeki komşu: [dx, dy, dz] ya da null
function boundaryOf(pts) {
  for (let axis = 0; axis < 3; axis++) for (const side of [0, 1]) {
    if (pts.every(p => Math.abs(p[axis] - side) < 1e-6)) return [0, 1, 2].map(i => i === axis ? (side ? 1 : -1) : 0);
  }
  return null;
}
// Aynı kimlikteki komşuyla tam örtüşen kesit yüzleri (uzama ekseni) çizilmez
const extrudeAxis = def => def.shape === 'pillar' || def.shape === 'corner' ? 1 : def.shape === 'slab' ? -1 : def.dir[0] ? 2 : 0;
function addShapeModel(buf, b, x, y, z, def, torches) {
  const axis = extrudeAxis(def);
  for (const { pts, n } of shapeGeometry(b, x, y, z).polys) {
    const side = boundaryOf(pts);
    if (side) {
      const nb = get(x + side[0], y + side[1], z + side[2]);
      if (isFullCube(nb)) continue;
      if (nb === b && (axis === -1 ? side[1] === 0 : side[axis] !== 0)) continue;
    }
    const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);
    const lit = torches.length ? torchLightAt(torches, x + c[0] + n[0] * 0.3, y + c[1] + n[1] * 0.3, z + c[2] + n[2] * 0.3) : 0;
    emitPoly(buf, pts, n, def, x, y, z, lit);
  }
}

// Konma: bakış yönü (kapı gibi) ve tıklanan yarı (alt yüze ya da yan yüzün üst yarısına tıklanınca ters/üst yarı)
function shapeVariant(family, hit) {
  const { variants } = SHAPE_FAMILIES[family];
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
  const d = BED_DIRS.findIndex(([, [ax, az]]) => Math.abs(fx) > Math.abs(fz) ? ax === Math.sign(fx) : az === Math.sign(fz));
  const hitY = aim.o.y + aim.d.y * hit.t;
  const flip = hit.py < hit.y || (hit.py === hit.y && hitY - Math.floor(hitY) > 0.5) ? 1 : 0;
  return variants[d + ',' + flip] ?? variants[d + ',0'] ?? variants['0,' + flip] ?? variants['0,0'];
}
// Yarım bloğun üstüne (ya da üst yarım bloğun altına) aynı yarım blok konunca tam blok olur. Olduysa true.
function mergeSlab(hit, key) {
  const target = get(hit.x, hit.y, hit.z), def = BLOCKS[target];
  if (def?.family !== key || def.shape !== 'slab' || hit.px !== hit.x || hit.pz !== hit.z) return false;
  if (hit.py !== hit.y + (def.flip ? -1 : 1)) return false;
  set(hit.x, hit.y, hit.z, def.full);
  return true;
}

// Simge ve eldeki model: şeklin geometrisi ortalanmış BufferGeometry olarak (kimlik başına önbellekte)
const shapeMeshes = {};
const shapeIconMaterial = new THREE.MeshBasicMaterial({ map: texture, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
function shapeMesh(b) {
  if (shapeMeshes[b]) return shapeMeshes[b];
  const buf = { pos: [], uv: [], col: [], light: [], idx: [] }, def = BLOCKS[b];
  const geo0 = CONNECTORS[def.shape] ? { polys: connectedBoxes(def).flatMap(boxPolys) } : shapeGeometry(b);
  for (const { pts, n } of geo0.polys) emitPoly(buf, pts, n, def, -0.5, -0.5, -0.5, 0);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(buf.pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(buf.uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(buf.col, 3));
  geo.setIndex(buf.idx);
  geo.userData.shared = true;
  return shapeMeshes[b] = geo;
}
// Envanter simgesi: şekil izometrik açıdan küçük bir hedefe çizilip okunur
let iconRig = null;
function shapeIcon(b) {
  if (!iconRig) {
    const cam = new THREE.OrthographicCamera(-0.85, 0.85, 0.85, -0.85, 0.1, 10);
    cam.position.set(2, 1.64, 2);
    cam.lookAt(0, 0, 0);
    iconRig = { scene: new THREE.Scene(), cam, target: new THREE.WebGLRenderTarget(64, 64) };
  }
  const mesh = new THREE.Mesh(shapeMesh(b), shapeIconMaterial);
  // Simgede doğu yönlü parça soldan görünsün
  mesh.rotation.y = Math.PI / 2;
  iconRig.scene.add(mesh);
  const clear = renderer.getClearColor(new THREE.Color()), alpha = renderer.getClearAlpha();
  renderer.setRenderTarget(iconRig.target);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  renderer.render(iconRig.scene, iconRig.cam);
  const pixels = new Uint8Array(64 * 64 * 4);
  renderer.readRenderTargetPixels(iconRig.target, 0, 0, 64, 64, pixels);
  renderer.setRenderTarget(null);
  renderer.setClearColor(clear, alpha);
  iconRig.scene.remove(mesh);
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const img = c.getContext('2d').createImageData(64, 64);
  for (let row = 0; row < 64; row++) img.data.set(pixels.subarray((63 - row) * 256, (64 - row) * 256), row * 256);
  c.getContext('2d').putImageData(img, 0, 0);
  return c.toDataURL();
}
Object.assign(window.game, { shapeFamilies: SHAPE_FAMILIES, shapeGeometry, shapeIcon });
