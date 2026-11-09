// ---------- Ayarlar ----------
// Duraklatma menüsünün ayarlar görünümü. Ayarlar dünya kaydından ayrı, aynı veritabanında "settings" anahtarıyla saklanır;
// "Yeni dünya" ayarları silmez.

const SETTINGS_KEY = 'settings';
const VIEW_DISTANCES = { short: 40, normal: 70, far: 120, very_far: 192 };
// Bulut katmanının yüksekliği: alçak Minecraft'taki gibi, yüksek dünya tavanının hemen altında (büyük yapıları kesmez)
const CLOUD_HEIGHTS = { off: null, low: 60, high: SY - 8 };
const DEFAULT_SENSITIVITY = 0.0025;
const settings = { sensitivity: DEFAULT_SENSITIVITY, fov: 75, viewDistance: 'normal', clouds: 'low', sound: true, invertY: false, guide: true };

const menuMain = document.getElementById('menu-main');
const menuSettings = document.getElementById('menu-settings');
const settingInputs = {
  sensitivity: document.getElementById('set-sensitivity'),
  fov: document.getElementById('set-fov'),
  viewDistance: document.getElementById('set-view'),
  clouds: document.getElementById('set-clouds'),
  sound: document.getElementById('set-sound'),
  invertY: document.getElementById('set-invert'),
  guide: document.getElementById('set-guide'),
};

// Ayarları denetimlere ve oyuna yansıtır.
function applySettings() {
  const { sensitivity, fov, viewDistance, clouds, sound, invertY, guide } = settingInputs;
  sensitivity.value = settings.sensitivity;
  fov.value = settings.fov;
  viewDistance.value = settings.viewDistance;
  clouds.value = settings.clouds;
  sound.checked = settings.sound;
  invertY.checked = settings.invertY;
  guide.checked = settings.guide;
  document.getElementById('out-sensitivity').textContent = '%' + Math.round(settings.sensitivity / DEFAULT_SENSITIVITY * 100);
  document.getElementById('out-fov').textContent = settings.fov + '°';
  setSound(settings.sound);
}
function saveSettings() {
  if (!db) return;
  try { db.transaction(DB_STORE, 'readwrite').objectStore(DB_STORE).put({ ...settings }, SETTINGS_KEY); } catch (err) { /* ayar kaydı isteğe bağlı */ }
}
// Kayıttaki bilinen alanlar varsayılanların üstüne yazılır.
function loadSettings() {
  return new Promise(resolve => {
    try {
      const req = db.transaction(DB_STORE).objectStore(DB_STORE).get(SETTINGS_KEY);
      req.onsuccess = () => {
        for (const key of Object.keys(settings)) if (req.result && req.result[key] !== undefined) settings[key] = req.result[key];
        if (!(settings.viewDistance in VIEW_DISTANCES)) settings.viewDistance = 'normal';
        if (!(settings.clouds in CLOUD_HEIGHTS)) settings.clouds = 'low';
        resolve();
      };
      req.onerror = () => resolve();
    } catch (err) { resolve(); }
  });
}

for (const [key, input] of Object.entries(settingInputs)) {
  input.addEventListener(input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input', () => {
    settings[key] = input.type === 'checkbox' ? input.checked : input.tagName === 'SELECT' ? input.value : Number(input.value);
    applySettings();
    saveSettings();
  });
}
function showSettings(show) {
  menuMain.hidden = show;
  menuSettings.hidden = !show;
}
document.getElementById('open-settings').addEventListener('click', () => showSettings(true));
document.getElementById('settings-back').addEventListener('click', () => showSettings(false));
document.getElementById('save-now').addEventListener('click', saveGame);
applySettings();

Object.assign(window.game, { settings, applySettings, saveSettings, showSettings, fogFar: () => scene.fog.far });
