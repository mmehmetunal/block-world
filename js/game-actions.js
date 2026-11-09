// ---------- Oyun eylemleri ----------
// Kontrol panelinin ve sohbet komutlarının ortak kullandığı eylemler. Her eylem sonucu anlatan bir metin döndürür.

// godMode: ölümsüzlük, safeMode: güvenli mod (canavarlar saldırmaz; kayda yazılır).
// flyAllowed: uçma izni (panel; kayda yazılır), flying: şu an uçuyor mu (iki kez boşluk).
let godMode = false, safeMode = false, flyAllowed = false, flying = false;
const TIMES_OF_DAY = { day: ['Sabah', 0.02], noon: ['Öğle', 0.25], night: ['Akşam', 0.6], midnight: ['Gece yarısı', 0.75] };

function setGodMode(on) {
  godMode = on;
  return godMode ? 'Ölümsüzlük açık' : 'Ölümsüzlük kapalı';
}
function setSafeMode(on) {
  safeMode = on;
  document.getElementById('safe-note').hidden = !on;
  return safeMode ? 'Güvenli mod açık: canavarlar saldırmaz' : 'Güvenli mod kapalı';
}
function setFlyAllowed(on) {
  flyAllowed = on;
  if (!on) flying = false;
  return on ? 'Uçma açık: iki kez boşluğa bas' : 'Uçma kapalı';
}
function healPlayer() {
  player.health = MAX_HEALTH;
  renderHearts();
  return 'Canın doldu';
}
function feedPlayer() {
  player.food = MAX_FOOD;
  renderFood();
  return 'Karnın doydu';
}
// time: günün kesri (0 = sabah 6:00)
function setTimeOfDay(time) {
  clock.time = time;
  return `Saat ${clockText().split(' · ')[1]} oldu`;
}
function teleport(x, y, z) {
  Object.assign(player, { x, y: Math.min(SY + 10, Math.max(1, y)), z, vx: 0, vy: 0, vz: 0, fallPeak: null });
  // Uzağa ışınlanınca oranın chunk'ları hemen hazırlanır
  buildAround(x, z, 1);
  return `Işınlandın: ${player.x.toFixed(1)} ${player.y.toFixed(1)} ${player.z.toFixed(1)}`;
}
// Oyuncunun 34 blok önüne 1:4 ölçekli Burj Khalifa kurar (yalnızca ana dünyada); meydan araziyi düzler.
function buildBurjKhalifa() {
  if (dimension !== 'overworld') return "Burj Khalifa yalnızca ana dünyada kurulur";
  const x = Math.floor(player.x - Math.sin(player.yaw) * 34), z = Math.floor(player.z - Math.cos(player.yaw) * 34);
  const tower = placeBurjKhalifa(x, z);
  return `Burj Khalifa kuruldu: ${tower.x} ${tower.y} ${tower.z} (1 blok = ${BURJ.scale} m, ${tower.height} blok yüksek)`;
}
// Oyuncunun önüne Anıtkabir'i kurar: Aslanlı Yol baktığı ana yönde 8 blok önden başlar (yalnızca ana dünyada); alanı düzler.
function buildAnitkabir() {
  if (dimension !== 'overworld') return "Anıtkabir yalnızca ana dünyada kurulur";
  const sx = -Math.sin(player.yaw), sz = -Math.cos(player.yaw);
  const [fx, fz] = Math.abs(sx) > Math.abs(sz) ? [Math.sign(sx), 0] : [0, Math.sign(sz)];
  const site = placeAnitkabir(Math.floor(player.x) + fx * 8, Math.floor(player.z) + fz * 8, fx, fz);
  return `Anıtkabir kuruldu: Aslanlı Yol ${site.x} ${site.y} ${site.z}, Şeref Holü ${site.hall.join(' ')}`;
}
Object.assign(window.game, { buildBurjKhalifa, buildAnitkabir });
function clearInventory() {
  inventory.fill(null);
  renderInventory();
  return 'Envanter boşaltıldı';
}
// Bakılan yönde 3 blok öne
function summonMob(kind) {
  spawnMob(kind, player.x - Math.sin(player.yaw) * 3, player.y + 0.5, player.z - Math.cos(player.yaw) * 3);
  return `${MOB_TYPES[kind].name} çağrıldı`;
}
function setSpawnHere() {
  spawnPoint = { x: player.x, y: player.y, z: player.z };
  return 'Doğma noktası buraya taşındı';
}
