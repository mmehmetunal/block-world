// Madde 58: "çok uzak" görüş (192 blok) ve bulut yüksekliği (kapalı / alçak / yüksek), kontrol panelinden
const g = window.game, p = g.player;
document.getElementById('play').click();
for (let i = 0; i < 100 && !p.onGround; i++) await wait(50);
const q = sel => document.querySelector(sel);
window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK' }));
q('[data-distance="very_far"]').click();
q('[data-clouds="high"]').click();
g.closeControl();
await wait(500);
const far = g.settings.viewDistance === 'very_far' && g.fogFar() === 192 && g.camera.far >= 300;
const high = g.clouds.visible && g.clouds.position.y === 248;
// Çok uzak görüşte 12 chunk çevresi çizilir (yavaş tarayıcıda birkaç saniye)
for (let i = 0; i < 200 && g.meshCount() < 300; i++) await wait(100);
const meshes = g.meshCount();
window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK' }));
q('[data-clouds="off"]').click();
const offOn = q('[data-clouds="off"]').classList.contains('on');
g.closeControl();
await wait(300);
const off = !g.clouds.visible;
const select = q('#set-clouds').value === 'off' && [...q('#set-view').options].some(o => o.value === 'very_far');
// Geri al (sonraki testler normal ayarla başlasın)
g.settings.viewDistance = 'normal'; g.settings.clouds = 'low'; g.applySettings(); g.saveSettings();
await wait(300);
const low = g.clouds.visible && g.clouds.position.y === 60;
const r = { far, high, meshes: meshes >= 300, offOn, off, select, low };
return { ok: Object.values(r).every(Boolean), ...r, meshCount: meshes };
