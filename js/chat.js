// ---------- Sohbet ve komutlar ----------
// T sohbeti, "/" sohbeti "/" ile açar; Enter gönderir, Esc kapatır. "/" ile başlayan yazılar komuttur.
// Sohbet açıkken dünya durmaz ama oyuncu hareket etmez ve dünyaya tıklanamaz.

const CHAT_FADE = 10000, CHAT_MAX_LINES = 50;
const chatEl = document.getElementById('chat');
const chatLog = document.getElementById('chat-log');
const chatInput = document.getElementById('chat-input');
// Komutlar game-actions.js'teki eylemleri çağırır (kontrol paneliyle aynı).
let chatOpen = false;

// kind: '' oyuncu mesajı, 'info' sistem (sarı), 'error' hata (kırmızı)
function chatLine(text, kind = '') {
  const line = document.createElement('div');
  line.className = 'chat-line ' + kind;
  line.textContent = text;
  chatLog.appendChild(line);
  while (chatLog.children.length > CHAT_MAX_LINES) chatLog.firstChild.remove();
  setTimeout(() => line.classList.add('faded'), CHAT_FADE);
}
function openChat(prefill = '') {
  chatOpen = true;
  for (const k in keys) keys[k] = false;
  mining = false;
  chatEl.classList.add('open');
  chatInput.hidden = false;
  chatInput.value = prefill;
  chatInput.focus();
  if (document.pointerLockElement) document.exitPointerLock();
}
function closeChat() {
  chatOpen = false;
  chatEl.classList.remove('open');
  chatInput.hidden = true;
  chatInput.blur();
  if (!inventoryOpen) relockPointer();
}
chatInput.addEventListener('keydown', e => {
  e.stopPropagation(); // oyun tuşları sohbet yazarken çalışmasın
  if (e.key === 'Enter') {
    // Önce komut çalışır: bir panel açtıysa sohbet kapanırken fare kilitlenmez.
    const text = chatInput.value.trim();
    if (text) submitChat(text);
    closeChat();
  } else if (e.key === 'Escape') closeChat();
});
chatInput.addEventListener('keyup', e => e.stopPropagation());

// Eşya ya da canlıyı İngilizce anahtarla ya da Türkçe adla bulur ("taş_kazma", "Taş kazma", "stone_pickaxe").
const normalize = text => text.toLocaleLowerCase('tr').replace(/_/g, ' ').trim();
function findItem(name) {
  const wanted = normalize(name);
  return Object.keys(ITEMS).find(key => !ITEMS[key].hidden && !BLOCKS[ITEMS[key].block]?.hidden &&
    (normalize(key) === wanted || normalize(ITEMS[key].name) === wanted));
}
const findMob = name => Object.keys(MOB_TYPES).find(kind => normalize(kind) === normalize(name) || normalize(MOB_TYPES[kind].name) === normalize(name));
// "~" göreli koordinat: "~", "~3", "~-2"
const coordinate = (text, current) => text.startsWith('~') ? current + (Number(text.slice(1)) || 0) : Number(text);

const COMMANDS = {
  help: { usage: '/help', about: 'Komutları listeler', run: () => {
    for (const cmd of Object.values(COMMANDS)) chatLine(`${cmd.usage} — ${cmd.about}`, 'info');
  } },
  give: { usage: '/give [eşya] [adet]', about: 'Envanterine eşya verir; adsız yazılırsa eşya panelini açar', run: args => {
    if (!args.length) return openPicker();
    const last = args[args.length - 1], hasCount = /^\d+$/.test(last) && args.length > 1;
    const count = hasCount ? Math.min(64 * INVENTORY_SIZE, Number(last)) : 1;
    const key = findItem((hasCount ? args.slice(0, -1) : args).join(' '));
    if (!key) return chatLine(`Böyle bir eşya yok: ${args.join(' ')}`, 'error');
    if (count < 1) return chatLine('Adet en az 1 olmalı', 'error');
    const extra = ITEMS[key].durability ? { durability: ITEMS[key].durability } : {};
    let left = count;
    // Yığılmayan eşyalar (alet) tek tek eklenir
    while (left > 0) {
      const n = Math.min(left, maxStack(key));
      if (addItem(key, n, extra) > 0) { chatLine('Envanter dolu', 'error'); break; }
      left -= n;
    }
    chatLine(`Sana ${count - Math.max(0, left)} × ${ITEMS[key].name} verildi`, 'info');
  } },
  god: { usage: '/god', about: 'Ölümsüzlük: hasar ve açlık yok (aç/kapat)', run: () => {
    chatLine(setGodMode(!godMode), 'info');
  } },
  safe: { usage: '/safe on|off', about: 'Güvenli mod: canavarlar dolaşır ama saldırmaz', run: args => {
    const value = normalize(args.join(' '));
    if (value && !['on', 'aç', 'off', 'kapat'].includes(value)) return chatLine('Kullanım: /safe on | off', 'error');
    chatLine(setSafeMode(value ? value === 'on' || value === 'aç' : safeMode), 'info');
  } },
  heal: { usage: '/heal', about: 'Canı doldurur', run: () => {
    chatLine(healPlayer(), 'info');
  } },
  feed: { usage: '/feed', about: 'Açlığı doldurur', run: () => {
    chatLine(feedPlayer(), 'info');
  } },
  time: { usage: '/time set <day|noon|night|midnight|saat>', about: 'Saati değiştirir', run: args => {
    const named = { gündüz: 0.02, öğle: 0.25, gece: 0.6, 'gece yarısı': 0.75 };
    for (const [key, [, time]] of Object.entries(TIMES_OF_DAY)) named[key] = time;
    const value = normalize(args.slice(1).join(' '));
    const hour = Number(value);
    if (args[0] !== 'set' || (!(value in named) && !(value !== '' && hour >= 0 && hour < 24))) return chatLine('Kullanım: /time set day | noon | night | midnight | 0–23', 'error');
    chatLine(setTimeOfDay(value in named ? named[value] : ((hour - 6 + 24) % 24) / 24), 'info');
  } },
  tp: { usage: '/tp <x> <y> <z>', about: 'Işınlar (~ ile göreli)', run: args => {
    const [x, y, z] = [coordinate(args[0] ?? '', player.x), coordinate(args[1] ?? '', player.y), coordinate(args[2] ?? '', player.z)];
    if (args.length !== 3 || [x, y, z].some(Number.isNaN)) return chatLine('Kullanım: /tp <x> <y> <z>', 'error');
    chatLine(teleport(x, y, z), 'info');
  } },
  clear: { usage: '/clear', about: 'Envanteri boşaltır', run: () => {
    chatLine(clearInventory(), 'info');
  } },
  summon: { usage: '/summon <canlı>', about: 'Önüne bir canlı çağırır', run: args => {
    const kind = findMob(args.join(' '));
    if (!kind) return chatLine(`Böyle bir canlı yok. Seçenekler: ${Object.values(MOB_TYPES).map(t => t.name).join(', ')}`, 'error');
    chatLine(summonMob(kind), 'info');
  } },
  burj: { usage: '/burj', about: 'Önüne 1:4 ölçekli Burj Khalifa kurar (araziyi düzler)', run: () => {
    chatLine(buildBurjKhalifa(), 'info');
  } },
  anitkabir: { usage: '/anitkabir', about: "Önüne Anıtkabir'i kurar (alanı düzler)", run: () => {
    chatLine(buildAnitkabir(), 'info');
  } },
  spawnpoint: { usage: '/spawnpoint', about: 'Doğma noktasını buraya taşır', run: () => {
    chatLine(setSpawnHere(), 'info');
  } },
};
function submitChat(text) {
  if (!text.startsWith('/')) { chatLine(`<Oyuncu> ${text}`); return; }
  const [name, ...args] = text.slice(1).split(/\s+/);
  const command = COMMANDS[name.toLocaleLowerCase('tr')];
  if (!command) { chatLine(`Bilinmeyen komut: /${name}. Komutlar için /help yaz.`, 'error'); return; }
  command.run(args);
}

Object.assign(window.game, { openChat, closeChat, submitChat, isGod: () => godMode, isSafe: () => safeMode, chatLines: () => [...chatLog.children].map(l => l.textContent) });
