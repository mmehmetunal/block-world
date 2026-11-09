// Yapı şablonu yardımcıları: sahnelerin blok listelerini üretir. Blok: [x, y, z, anahtar] (anahtar B'deki ad, 0 = hava).
// Liste kurulma sırasıdır; video bu sırayla kare kare dolar.

// İçi boş kabuk: inside(x, y, z) doğru olan hücrelerden yalnızca görünenleri (yanında ya da üstünde dışarısı olan) üretir.
// Katman katman (aşağıdan yukarı), her katmanda merkez çevresinde açıya göre sıralı. material(x, y, z, info) anahtar döndürür;
// info.side: dışarı bakan yatay yön [dx, dz] (yoksa null), info.roof: üstü açık mı.
export function shell({ inside, bounds: [x0, y0, z0, x1, y1, z1], material }) {
  const out = [];
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  for (let y = y0; y <= y1; y++) {
    const layer = [];
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (!inside(x, y, z)) continue;
      const side = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dz]) => !inside(x + dx, y, z + dz)) || null;
      const roof = !inside(x, y + 1, z);
      if (!side && !roof) continue;
      const key = material(x, y, z, { side, roof });
      if (key) layer.push([x, y, z, key]);
    }
    layer.sort((a, b) => Math.atan2(a[2] - cz, a[0] - cx) - Math.atan2(b[2] - cz, b[0] - cx));
    out.push(...layer);
  }
  return out;
}
// Dolu daire (zemin, meydan)
export function disc(cx, cz, r, y, key) {
  const out = [];
  for (let z = Math.floor(cz - r); z <= cz + r; z++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    if ((x - cx) ** 2 + (z - cz) ** 2 <= r * r) out.push([x, y, z, typeof key === 'function' ? key(x, z) : key]);
  }
  return out;
}
// Silindir biçiminde alanı zeminin `clear` blok üstüne kadar boşaltır (ağaç, tepe) ve altını doldurur: yapı düz bir meydana oturur.
export function flatten(cx, cz, r, ground, clear = 40, fill = 'stone') {
  const out = [];
  for (let z = Math.floor(cz - r); z <= cz + r; z++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    if ((x - cx) ** 2 + (z - cz) ** 2 > r * r) continue;
    for (let y = ground - 4; y < ground; y++) out.push([x, y, z, fill]);
    for (let y = ground + 1; y <= Math.min(255, ground + clear); y++) out.push([x, y, z, 0]);
  }
  return out;
}
// Yapının çevresinde dönen kamera: t 0–1, turns tur; yükseklik ve bakış noktası kurulan yüksekliği izler.
export function orbit({ center: [cx, cz], radius, turns = 0.6, start = 0, height, look }) {
  return t => {
    const a = start + t * turns * Math.PI * 2;
    return { pos: [cx + Math.cos(a) * radius, height(t), cz + Math.sin(a) * radius], look: [cx, look(t), cz] };
  };
}
