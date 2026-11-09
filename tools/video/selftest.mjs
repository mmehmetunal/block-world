// Video aracının testi: sahnelerin blok listelerini denetler (dünya sınırı, sıra) ve küçük bir kayıt alıp mp4'ü ffprobe ile doğrular.
// Kullanım: node tools/video/selftest.mjs   (çıkış kodu 0 geçti, 1 kaldı)
import { readdirSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const here = import.meta.dirname, scenesDir = join(here, 'scenes');
const results = {};
// 1. Her sahne: bloklar 0 ≤ y < 256 içinde, anahtar metin ya da 0, kurulum aşağıdan yukarı
for (const file of readdirSync(scenesDir).filter(f => f.endsWith('.mjs'))) {
  const scene = (await import(pathToFileURL(join(scenesDir, file)).href)).default;
  const ctx = { ground: 20, center: scene.center || [48, 48] };
  const blocks = scene.blocks(ctx);
  const inWorld = blocks.every(([, y]) => y >= 0 && y < 256);
  const keys = blocks.every(b => typeof b[3] === 'string' || b[3] === 0);
  const upward = blocks.every((b, i) => i === 0 || b[1] >= blocks[i - 1][1]);
  const cam = scene.camera(0.5, { ...ctx, progress: 0.5, topY: 100 });
  results[file] = { blocks: blocks.length, inWorld, keys, upward, camera: cam.pos.length === 3 && cam.look.length === 3 };
}
// 2. Örnek sahnenin girişli, 1 sn kurulumlu küçük kaydı: bütün bloklar konur (bilinmeyen anahtar sayfada hata verir), mp4 oynatılabilir
const out = mkdtempSync(join(tmpdir(), 'block-world-video-test-'));
const run = spawnSync('node', [join(here, 'record.mjs'), join(scenesDir, 'burj-khalifa.mjs'), '--seconds', '1', '--fps', '10', '--size', '180x320', '--out', out], { encoding: 'utf8' });
const mp4 = join(out, 'burj-khalifa.mp4');
const burj = (await import(pathToFileURL(join(scenesDir, 'burj-khalifa.mjs')).href)).default;
const expectedFrames = 10 + Math.round((burj.intro?.seconds || 0) * 10); // giriş + 1 sn kurulum
const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=width,height,nb_read_frames', '-of', 'csv=p=0', mp4], { encoding: 'utf8' });
const [w, h, frames] = probe.stdout.trim().split(',').map(Number);
results.recording = { exit: run.status, width: w, height: h, frames, bytes: run.status === 0 ? statSync(mp4).size : 0, log: run.status ? (run.stderr || run.stdout).slice(-500) : undefined };
rmSync(out, { recursive: true, force: true });

const ok = Object.entries(results).every(([k, r]) => k === 'recording'
  ? r.exit === 0 && r.width === 180 && r.height === 320 && r.frames === expectedFrames && r.bytes > 1000
  : r.blocks > 0 && r.inWorld && r.keys && r.upward && r.camera);
console.log(JSON.stringify({ ok, ...results }, null, 2));
process.exit(ok ? 0 : 1);
