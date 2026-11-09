// ---------- Kontrol paneli ----------
// K ile açılan panel: komut yazmadan güvenli mod, ölümsüzlük, ses, saat, can/açlık, eşya seçici, ışınlanma ve canlı çağırma.
// Eylemler game-actions.js'tekilerle aynıdır; sonuç ekranın ortasında kısa bir bildirimle gösterilir.

const controlEl = document.getElementById('control');
let controlOpen = false;
const TOGGLES = {
  safe: { on: () => safeMode, set: setSafeMode },
  god: { on: () => godMode, set: setGodMode },
  fly: { on: () => flyAllowed, set: setFlyAllowed },
  guide: { on: () => settings.guide, set: on => setGuideShown(on) },
  sound: { on: () => settings.sound, set: on => { settings.sound = on; applySettings(); saveSettings(); return on ? 'Ses açık' : 'Ses kapalı'; } },
};
const tpInputs = ['x', 'y', 'z'].map(a => document.getElementById('tp-' + a));
let confirmClear = false, confirmBurj = false, confirmAnitkabir = false;
const ACTIONS = {
  heal: healPlayer,
  feed: feedPlayer,
  spawn: setSpawnHere,
  // Yanlışlıkla boşaltılmasın: ikinci basışta boşaltır
  clear: button => {
    if (!confirmClear) { confirmClear = true; button.textContent = 'Emin misin? Tekrar bas'; return null; }
    return clearInventory();
  },
  // Araziyi düzlediği için ikinci basışta kurar
  burj: button => {
    if (!confirmBurj) { confirmBurj = true; button.textContent = 'Araziyi düzleyecek. Tekrar bas'; return null; }
    confirmBurj = false;
    closeControl();
    return buildBurjKhalifa();
  },
  anitkabir: button => {
    if (!confirmAnitkabir) { confirmAnitkabir = true; button.textContent = 'Alanı düzleyecek. Tekrar bas'; return null; }
    confirmAnitkabir = false;
    closeControl();
    return buildAnitkabir();
  },
  items: () => { closeControl(); openPicker(); return null; },
  // Kutulardaki blok koordinatının ortasına
  tp: () => tpInputs.some(el => el.value === '') ? 'Üç koordinatı da yaz' : teleport(...tpInputs.map((el, i) => Number(el.value) + (i === 1 ? 0 : 0.5))),
  home: () => { spawn(); return 'Doğma noktasına döndün'; },
};

// Saat ve canlı düğmeleri tablolardan kurulur.
const timesEl = document.getElementById('control-times');
for (const [key, [name, time]] of Object.entries(TIMES_OF_DAY)) {
  const b = document.createElement('button');
  b.className = 'mc-btn'; b.type = 'button'; b.textContent = name; b.dataset.time = key;
  b.addEventListener('click', () => { toast(setTimeOfDay(time)); renderControl(); });
  timesEl.appendChild(b);
}
const mobsEl = document.getElementById('control-mobs');
for (const [kind, type] of Object.entries(MOB_TYPES)) {
  const b = document.createElement('button');
  b.className = 'mc-btn' + (type.hostile ? ' hostile' : ''); b.type = 'button'; b.textContent = type.name; b.dataset.mob = kind;
  b.title = type.hostile ? 'Düşman canlı' : 'Barışçıl canlı';
  b.addEventListener('click', () => toast(summonMob(kind)));
  mobsEl.appendChild(b);
}
// Görünüm: kamera (V ile de değişir) ve görüş mesafesi (ayarlardakiyle aynı)
controlEl.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
  view = Number(b.dataset.view);
  toast('Kamera: ' + VIEWS[view]);
  renderControl();
}));
controlEl.querySelectorAll('[data-distance]').forEach(b => b.addEventListener('click', () => {
  settings.viewDistance = b.dataset.distance;
  applySettings();
  saveSettings();
  toast('Görüş mesafesi: ' + b.textContent);
  renderControl();
}));
controlEl.querySelectorAll('[data-clouds]').forEach(b => b.addEventListener('click', () => {
  settings.clouds = b.dataset.clouds;
  applySettings();
  saveSettings();
  toast('Bulutlar: ' + b.textContent);
  renderControl();
}));
controlEl.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => {
  const t = TOGGLES[b.dataset.toggle];
  toast(t.set(!t.on()));
  renderControl();
}));
controlEl.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', () => {
  const text = ACTIONS[b.dataset.action](b);
  if (text) toast(text);
  renderControl();
}));
document.getElementById('control-close').addEventListener('click', () => closeControl());
// Koordinat kutularına yazılan rakamlar hotbar'ı değiştirmesin; Esc paneli kapatır.
for (const el of tpInputs) {
  el.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') closeControl(); if (e.key === 'Enter') controlEl.querySelector('[data-action="tp"]').click(); });
  el.addEventListener('keyup', e => e.stopPropagation());
}
// Panel kapalıyken arka plana tıklamak paneli kapatır.
controlEl.addEventListener('mousedown', e => { if (e.target === controlEl) closeControl(); });

function renderControl() {
  controlEl.querySelectorAll('[data-toggle]').forEach(b => {
    const on = TOGGLES[b.dataset.toggle].on();
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on);
    b.querySelector('.state').textContent = on ? 'AÇIK' : 'KAPALI';
  });
  controlEl.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('on', Number(b.dataset.view) === view));
  controlEl.querySelectorAll('[data-distance]').forEach(b => b.classList.toggle('on', b.dataset.distance === settings.viewDistance));
  controlEl.querySelectorAll('[data-clouds]').forEach(b => b.classList.toggle('on', b.dataset.clouds === settings.clouds));
  document.getElementById('control-clock').textContent = clockText().split(' · ')[1];
  if (!confirmClear) controlEl.querySelector('[data-action="clear"]').textContent = 'Envanteri boşalt';
  if (!confirmAnitkabir) controlEl.querySelector('[data-action="anitkabir"]').textContent = 'Anıtkabir kur';
  if (!confirmBurj) controlEl.querySelector('[data-action="burj"]').textContent = 'Burj Khalifa kur (1:4 ölçek)';
}
function openControl() {
  if (inventoryOpen) closeInventory();
  controlOpen = true;
  for (const k in keys) keys[k] = false;
  mining = false;
  confirmClear = false;
  confirmBurj = false;
  confirmAnitkabir = false;
  [player.x, player.y, player.z].forEach((v, i) => { tpInputs[i].value = Math.floor(v); });
  renderControl();
  controlEl.hidden = false;
  if (document.pointerLockElement) document.exitPointerLock();
}
function closeControl() {
  controlOpen = false;
  controlEl.hidden = true;
  if (!inventoryOpen) relockPointer();
}
// Ana menüden: oyunu başlatıp paneli açar.
document.getElementById('open-control').addEventListener('click', () => { start(); openControl(); });
Object.assign(window.game, { isFlying: () => flying, isFlyAllowed: () => flyAllowed, openControl, closeControl, isControlOpen: () => controlOpen });
