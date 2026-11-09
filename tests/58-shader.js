// Madde 58: shader modu panelden açılıp kapanır; açıkken ışıklı malzeme, gölge, AO ve ton eşleme; kapalıyken eski çizim
const g = window.game;
document.getElementById('play').click();
await wait(300);
const meshMaterial = () => [...chunkMeshes.values()][0][0].material.type;
const before = meshMaterial() === 'MeshBasicMaterial' && renderer.toneMapping === THREE.NoToneMapping;
g.openControl();
document.querySelector('[data-toggle="shader"]').click();
const button = document.querySelector('[data-toggle="shader"]').classList.contains('on');
g.closeControl();
document.getElementById('play').click();
await wait(800);
const on = g.isShaderMode() && meshMaterial() === 'MeshLambertMaterial' && worldSun.castShadow && renderer.toneMapping === THREE.ACESFilmicToneMapping && !document.getElementById('vignette').hidden;
// Köşe ortam gölgesi: duvarın dibindeki zemin köşesi kararır
for (let x = 40; x < 44; x++) for (let z = 40; z < 44; z++) { g.setBlock(x, 50, z, B.stone); g.setBlock(x, 51, z, 0); g.setBlock(x, 52, z, 0); }
g.setBlock(41, 51, 40, B.stone);
const ao = cornerAO(41, 50, 41, [0, 1, 0], [0, 1, 0]) < 1 && cornerAO(42, 50, 42, [0, 1, 0], [1, 1, 1]) === 1;
const saved = g.settings.shader === true;
g.setShaderMode(false);
await wait(300);
const off = !g.isShaderMode() && meshMaterial() === 'MeshBasicMaterial' && !worldSun.castShadow && renderer.toneMapping === THREE.NoToneMapping;
return { ok: before && button && on && ao && saved && off, before, button, on, ao, saved, off };
