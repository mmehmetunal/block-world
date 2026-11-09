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
// Sis ve bulutlar ayarlara yazılır (kayıttan bağımsız)
function setFog(on) {
  settings.fog = on;
  saveSettings();
  return on ? 'Sis açık' : 'Sis kapalı: uzaklar net';
}
function setClouds(on) {
  settings.clouds = on;
  saveSettings();
  return on ? 'Bulutlar açık' : 'Bulutlar kapalı';
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
