// Yapı videosu kaydedici: oyunu görünmez Chrome'da açar, sahne dosyasındaki yapıyı kare kare kurarken
// sahnenin kamerasıyla görüntü alır ve ffmpeg ile dikey (9:16) mp4 yazar. Oyun dosyalarını değiştirmez;
// yalnızca window.game kancalarını (cameraRig, setShaderMode, setBlock …) kullanır.
//
// Kullanım:
//   node tools/video/record.mjs tools/video/scenes/burj-khalifa.mjs [başka-sahne.mjs …] [seçenekler]
// Seçenekler:
//   --size 720x1280   kare boyutu (varsayılan sahnenin `size` alanı ya da 720x1280)
//   --fps 30          saniyedeki kare
//   --seconds 20      süreyi sahneden bağımsız kısalt/uzat
//   --still 0.6       video yerine bu andaki (0–1) tek kareyi PNG olarak kaydet (hızlı önizleme)
//   --intro-still 0.3 girişin (scene.intro) bu andaki karesini PNG olarak kaydet
//   --gpu             SwiftShader yerine ekran kartıyla çiz (daha hızlı; makineye bağlı)
//   --out videos      çıktı klasörü
// Birden çok sahne verilirse sırayla (kuyruk) kaydedilir; her biri videos/<sahne>.mp4 olur.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, rm, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, extname, resolve, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const argv = process.argv.slice(2);
const option = (name, fallback) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : fallback; };
const flag = name => argv.includes('--' + name);
const optionNames = new Set(['size', 'fps', 'seconds', 'still', 'intro-still', 'out']);
const sceneFiles = argv.filter((a, i) => a.endsWith('.mjs') && !optionNames.has(argv[i - 1]?.slice(2)));
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
if (!sceneFiles.length) { console.error('Sahne dosyası ver: node tools/video/record.mjs tools/video/scenes/burj-khalifa.mjs'); process.exit(2); }

// Sayfaya enjekte edilen yardımcı: yapı bloklarını koyar, değişen chunk'ları yeniden kurar, kamerayı sürer.
const PAGE_HELPER = `
window.__video = {
  queue: [],
  // Bloklar [x, y, z, anahtar]; anahtar B'deki ad (ör. "stone_bricks") ya da 0 (hava)
  place(list) {
    const keys = new Set();
    for (const [x, y, z, key] of list) {
      const id = key === 0 || key === 'air' ? 0 : B[key];
      if (id === undefined) throw new Error('Bilinmeyen blok: ' + key);
      set(x, y, z, id);
      const cx = Math.floor(x / CH), cz = Math.floor(z / CH), lx = x - cx * CH, lz = z - cz * CH;
      keys.add(cx + ',' + cz);
      if (lx === 0) keys.add((cx - 1) + ',' + cz); if (lx === CH - 1) keys.add((cx + 1) + ',' + cz);
      if (lz === 0) keys.add(cx + ',' + (cz - 1)); if (lz === CH - 1) keys.add(cx + ',' + (cz + 1));
    }
    return [...keys];
  },
  // Listeden yalnızca dünyadakinden farklı olanlar (boşa hava yazılmasın)
  changes(list) { return list.filter(([x, y, z, key]) => get(x, y, z) !== (key === 0 ? 0 : B[key])); },
  rebuild(keys) { for (const key of keys) rebuildKey(key); },
  // Görünüm: shader ve ultra; shader değişirse bütün çevre yeniden kurulur
  look(shader, ultra, cx, cz) {
    if (shader !== shaderMode) { setShaderMode(shader); this.rebuildArea(cx, cz); }
    if (ultra !== ultraMode) setUltraMode(ultra);
  },
  // Görüş yarıçapındaki bütün chunk'ları kurar (açılışta ve shader modu değişince)
  rebuildArea(cx, cz) {
    const r = Math.ceil(VIEW_DISTANCES[settings.viewDistance] / CH);
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) buildChunk(Math.floor(cx / CH) + dx, Math.floor(cz / CH) + dz);
  },
  // Giriş için: chunk aralığının kopyası alınır, giriş bitince geri yazılır (kurulum baştan başlar)
  snapshot([x0, z0, x1, z1]) {
    this.saved = [];
    for (let cz = Math.floor(z0 / CH) - 1; cz <= Math.floor(z1 / CH) + 1; cz++) for (let cx = Math.floor(x0 / CH) - 1; cx <= Math.floor(x1 / CH) + 1; cx++) {
      const key = cx + ',' + cz;
      if (world.has(key)) this.saved.push([key, world.get(key).slice()]);
    }
  },
  restore() {
    for (const [key, data] of this.saved) world.get(key).set(data);
    this.rebuild(this.saved.map(([key]) => key));
  },
  // Hızlandırma rozeti (">> 2x"), opaklığı hıza göre yumuşakça açılıp kapanır
  badge(text, opacity) {
    let el = document.getElementById('video-badge');
    if (!el) {
      el = document.createElement('div');
      el.id = 'video-badge';
      el.style.cssText = 'position:fixed;right:5%;top:4%;padding:0.6vw 2vw;font:6vw var(--mc-font);color:#fff;text-shadow:0.4vw 0.4vw 0 #3f3f3f;background:rgba(0,0,0,0.35);border-radius:1.5vw;pointer-events:none';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.opacity = opacity;
  },
  // Videonun üstündeki yazı (girişte "Shader kapalı" gibi)
  caption(text) {
    let el = document.getElementById('video-caption');
    if (!el) {
      el = document.createElement('div');
      el.id = 'video-caption';
      el.style.cssText = 'position:fixed;left:0;right:0;top:4%;text-align:center;font:bold 7vw var(--mc-font);color:#fff;text-shadow:0.5vw 0.5vw 0 #3f3f3f;pointer-events:none';
      document.body.appendChild(el);
    }
    el.textContent = text;
  },
  frames: n => new Promise(r => { const step = () => (n-- > 0 ? requestAnimationFrame(step) : r()); step(); }),
};`;

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  try {
    const body = await readFile(join(root, path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const profile = await mkdtemp(join(tmpdir(), 'block-world-video-'));
const gl = flag('gpu') ? ['--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, ...gl,
  '--window-size=1280,1280', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
async function cleanup(code) {
  chrome.kill(); server.close();
  await sleep(300);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
  process.exit(code);
}

// Chrome DevTools bağlantısı (tools/browser-test.mjs ile aynı yöntem)
async function connect() {
  let devtoolsPort;
  for (let i = 0; i < 100 && !devtoolsPort; i++) {
    devtoolsPort = await readFile(join(profile, 'DevToolsActivePort'), 'utf8').then(t => t.split('\n')[0]).catch(() => null);
    if (!devtoolsPort) await sleep(100);
  }
  const targets = await (await fetch(`http://127.0.0.1:${devtoolsPort}/json/list`)).json();
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let nextId = 0;
  const pending = new Map(), errors = [];
  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise(r => { const id = ++nextId; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => {
    const { result } = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  return { send, evaluate, errors };
}

// Bir sahneyi kaydeder. Sahne: { name, size, fps, seconds, hold, time, shader, fog, clouds, fov, center, blocks(ctx), camera(t, ctx) }
async function recordScene(cdp, file) {
  const scene = (await import(pathToFileURL(resolve(file)).href)).default;
  const [width, height] = (option('size', scene.size || '720x1280')).split('x').map(Number);
  const fps = Number(option('fps', scene.fps || 30));
  const seconds = Number(option('seconds', scene.seconds || 20));
  const still = option('still', null);
  const name = scene.name || basename(file, '.mjs');
  const { send, evaluate } = cdp;
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/index.html` });
  for (let i = 0; i < 200 && !(await evaluate('document.readyState === "complete" && !!window.game?.ready').catch(() => false)); i++) await sleep(100);
  await evaluate(PAGE_HELPER);
  const [cx, cz] = scene.center || [48, 48];
  // Hazırlık: oyun başlar, arayüz gizlenir, ayarlar uygulanır, yapı alanının çevresi üretilir ve çizilir
  const ground = await evaluate(`(async () => {
    document.getElementById('play').click();
    const style = document.createElement('style');
    style.textContent = 'body > *:not(#game):not(#vignette):not(#video-caption):not(#video-badge) { display: none !important; }';
    document.head.appendChild(style);
    setGodMode(true); setSafeMode(true);
    Object.assign(settings, { viewDistance: ${JSON.stringify(scene.view || 'ultra')}, fog: ${!!scene.fog}, clouds: ${scene.clouds !== false}, fov: ${scene.fov || 70}, guide: false, sound: false });
    applySettings();
    if (${!!scene.shader} !== shaderMode) setShaderMode(${!!scene.shader});
    if (${!!scene.ultra} !== ultraMode) setUltraMode(${!!scene.ultra});
    Object.assign(player, { x: ${cx} + 0.5, y: 120, z: ${cz} + 0.5, vx: 0, vy: 0, vz: 0 });
    const r = Math.ceil(VIEW_DISTANCES[settings.viewDistance] / CH);
    ensureArea(${cx}, ${cz}, r + 1);
    return heightAt(${cx}, ${cz});
  })()`);
  const ctx = { ground, center: [cx, cz] };
  const blocks = scene.blocks(ctx);
  // Hazırlık blokları (zemin düzleme, meydan) da videoda görünür: yalnızca gerçekten değişen hücreler alınır ve
  // merkezden dışa halka halka sıralanır (aynı halkada önce boşaltma, yukarıdan aşağı; sonra doldurma).
  let prep = [];
  if (scene.prepare) {
    const list = scene.prepare(ctx);
    for (let i = 0; i < list.length; i += 50000) prep.push(...await evaluate(`__video.changes(${JSON.stringify(list.slice(i, i + 50000))})`));
    const ring = b => Math.floor(Math.hypot(b[0] - cx, b[2] - cz) / 2);
    prep.sort((p, q) => ring(p) - ring(q) || (p[3] === 0 ? 0 : 1) - (q[3] === 0 ? 0 : 1) || (p[3] === 0 ? q[1] - p[1] : p[1] - q[1]));
  }
  console.log(`${name}: ${prep.length.toLocaleString('tr-TR')} hazırlık + ${blocks.length.toLocaleString('tr-TR')} yapı bloğu, ${width}x${height}, ${fps} kare/sn, ${seconds} sn`);
  // Bütün çevre çizilir; oyun dondurulur (canlılar, sıvılar, bulutlar ilerlemez), kareler yalnızca kayıt zamanına bağlıdır
  await evaluate(`(async () => {
    while (mobs.length) removeMob(mobs[0]);
    playing = false;
    clearChunkMeshes();
    __video.rebuildArea(${cx}, ${cz});
  })()`);
  const total = Math.max(1, Math.round(seconds * fps));
  const buildFrames = Math.max(2, Math.round(total * (1 - (scene.hold ?? 0.25))));
  const prepFrames = prep.length ? Math.max(1, Math.round(buildFrames * (scene.prepareShare ?? 0.2))) : 0;
  const all = [...prep, ...blocks];
  // i. karede kurulmuş olması gereken blok sayısı (hazırlık + yapı)
  const builtAt = i => i < prepFrames ? Math.round(prep.length * (i + 1) / prepFrames)
    : prep.length + Math.round(blocks.length * Math.min(1, (i + 1 - prepFrames) / (buildFrames - prepFrames)));
  const outDir = resolve(option('out', join(root, 'videos')));
  await mkdir(outDir, { recursive: true });
  // Kamera, kurulan en üst katı yumuşatılmış olarak izler (her yeni katta zıplamasın): ~0,6 sn'lik üstel yaklaşma
  const follow = 1 - Math.exp(-1 / (fps * 0.6));
  let placed = 0, topY = ground, smoothTop = ground;
  // Bir kareyi hazırlar: o ana kadarki blokları koyar, kamerayı ve saati ayarlar, iki kare çizilmesini bekler
  // Hız: orta bölüm (fastFrom–fastTo, içerik oranı) scene.fast kat hızlı; giriş ve çıkış yarım saniyelik yumuşak rampa
  const fast = scene.fast || 1, ramp = fps * 0.5, ease = v => { const x = Math.min(1, Math.max(0, v)); return x * x * (3 - 2 * x); };
  const fastFrom = (scene.fastFrom ?? 0.06) * total, fastTo = (scene.fastTo ?? 1 - (scene.hold ?? 0.25)) * total;
  const rateAt = c => 1 + (fast - 1) * ease((c - fastFrom) / ramp) * ease((fastTo - c) / ramp);
  const prepareFrame = async (i, snap) => {
    const built = builtAt(i), batch = all.slice(placed, built);
    for (const b of batch) if (b[3] !== 0) topY = Math.max(topY, b[1]);
    placed = built;
    smoothTop = snap ? topY : smoothTop + (topY - smoothTop) * follow;
    const progress = Math.max(0, placed - prep.length) / blocks.length;
    const cam = scene.camera(i / (total - 1 || 1), { ...ctx, progress, topY: smoothTop, preparing: i < prepFrames });
    await evaluate(`(async () => {
      const keys = new Set();
      const list = ${JSON.stringify(batch)};
      for (let i = 0; i < list.length; i += 5000) for (const k of __video.place(list.slice(i, i + 5000))) keys.add(k);
      __video.rebuild(keys);
      clock.time = ${scene.time ?? 0.15};
      window.game.videoTime = ${(introTotal + i) / fps};
      window.game.cameraRig = ${JSON.stringify(cam)};
      __video.badge('>> ${fast}x', ${fast > 1 ? ((rateAt(i) - 1) / (fast - 1)).toFixed(3) : 0});
      await __video.frames(2);
    })()`);
  };
  // Giriş (isteğe bağlı, scene.intro): bitmiş yapı birkaç saniye gösterilir; bölümler shader modunu ve yazıyı değiştirir
  // (ör. "Shader kapalı" -> "Shader açık" -> "Nasıl yapıldı?"). Sonra dünya eski haline döner ve kurulum baştan başlar.
  const intro = scene.intro, introTotal = intro ? Math.round(intro.seconds * fps) : 0;
  const finalTop = blocks.reduce((m, b) => Math.max(m, b[1]), ground);
  const startIntro = async () => {
    const box = all.reduce(([x0, z0, x1, z1], [x, , z]) => [Math.min(x0, x), Math.min(z0, z), Math.max(x1, x), Math.max(z1, z)], [Infinity, Infinity, -Infinity, -Infinity]);
    await evaluate(`__video.snapshot(${JSON.stringify(box)})`);
    for (let i = 0; i < all.length; i += 20000) await evaluate(`__video.rebuild(__video.place(${JSON.stringify(all.slice(i, i + 20000))}))`);
  };
  const introFrame = async j => {
    const t = j / (introTotal - 1 || 1);
    const seg = intro.segments.find(sg => t <= sg.until) || intro.segments[intro.segments.length - 1];
    const cam = intro.camera(t, { ...ctx, progress: 1, topY: finalTop });
    await evaluate(`(async () => {
      __video.look(${!!seg.shader}, ${!!seg.ultra}, ${cx}, ${cz});
      __video.caption(${JSON.stringify(seg.caption || '')});
      clock.time = ${scene.time ?? 0.15};
      window.game.videoTime = ${j / fps};
      window.game.cameraRig = ${JSON.stringify(cam)};
      await __video.frames(2);
    })()`);
  };
  const endIntro = () => evaluate(`(async () => {
    __video.restore();
    __video.caption('');
    __video.look(${!!scene.shader}, ${!!scene.ultra}, ${cx}, ${cz});
  })()`);
  // --intro-still t: girişin t anındaki karesi (önizleme)
  const introStill = option('intro-still', null);
  if (introStill !== null && intro) {
    await startIntro();
    await introFrame(Math.round(Number(introStill) * (introTotal - 1)));
    await sleep(500);
    const { result } = await send('Page.captureScreenshot', { format: 'png' });
    const png = join(outDir, `${name}-intro.png`);
    await writeFile(png, Buffer.from(result.data, 'base64'));
    console.log('Giriş önizlemesi: ' + png);
    return png;
  }
  if (still !== null) {
    await prepareFrame(Math.round(Number(still) * (total - 1)), true);
    await sleep(500);
    const { result } = await send('Page.captureScreenshot', { format: 'png' });
    const png = join(outDir, `${name}.png`);
    await writeFile(png, Buffer.from(result.data, 'base64'));
    console.log('Önizleme: ' + png);
    return png;
  }
  const mp4 = join(outDir, `${name}.mp4`);
  const ffmpeg = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((r, j) => { ffmpeg.on('close', code => (code ? j(new Error('ffmpeg çıkış kodu ' + code)) : r())); });
  const started = Date.now();
  const capture = async () => {
    const { result } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 95 });
    if (!ffmpeg.stdin.write(Buffer.from(result.data, 'base64'))) await new Promise(r => ffmpeg.stdin.once('drain', r));
  };
  if (intro) {
    await startIntro();
    for (let j = 0; j < introTotal; j++) { await introFrame(j); await capture(); }
    await endIntro();
  }
  // Çıkış karesi başına içerikte rateAt kadar ilerlenir (2x bölümde her kare iki içerik karesi)
  let written = 0;
  for (let c = 0; c < total; c += rateAt(c)) {
    await prepareFrame(c);
    await capture();
    if (written++ % fps === 0) process.stdout.write(`\r${name}: ${Math.round(c)}/${total} içerik karesi (${Math.round((Date.now() - started) / 1000)} sn)`);
  }
  console.log(`\n${name}: ${((introTotal + written) / fps).toFixed(1)} sn video`);
  ffmpeg.stdin.end();
  await done;
  console.log(`\n${name}: ${mp4}`);
  return mp4;
}

try {
  const cdp = await connect();
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  for (const file of sceneFiles) await recordScene(cdp, file);
  if (cdp.errors.length) { console.error('Sayfa hataları:\n' + cdp.errors.join('\n')); await cleanup(1); }
  await cleanup(0);
} catch (err) {
  console.error(err);
  await cleanup(2);
}
