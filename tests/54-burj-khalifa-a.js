// Madde 54, aşama 1: kontrol panelinden Burj Khalifa kur; ölçü, kademe ve kat denetimi; kaydet
const g = window.game, p = g.player;
document.getElementById('play').click();
for (let i = 0; i < 100 && !p.onGround; i++) await wait(50);
p.yaw = 0;
const cx = Math.floor(p.x), cz = Math.floor(p.z + 0 - 34 * Math.cos(0));
const key = code => window.dispatchEvent(new KeyboardEvent('keydown', { code }));
const q = sel => document.querySelector(sel);
key('KeyK');
const button = q('[data-action="burj"]');
button.click();
const asksConfirm = button.textContent.includes('Tekrar bas') && g.getBlock(cx, 60, cz) === 0;
button.click();
await wait(300);
const top = (() => { let y = 255; while (y > 0 && g.getBlock(cx, y, cz) === 0) y--; return y; })();
let plaza = top; while (plaza > 0 && g.getBlock(cx + 14, plaza, cz) === 0) plaza--;
// Meydan yüzü: kule tabanının hemen altındaki kumtaşı katman
let y0 = 0; for (let y = 60; y > 0; y--) if (g.getBlock(cx + 14, y, cz) === 12 && g.getBlock(cx + 14, y + 1, cz) === 0) { y0 = y + 1; break; }
const height = top - y0 + 1;
const area = h => { let n = 0; for (let x = cx - 15; x <= cx + 15; x++) for (let z = cz - 15; z <= cz + 15; z++) if (g.getBlock(x, y0 + h, z) !== 0) n++; return n; };
const widths = [3, 31, 59, 91, 119, 143].map(h => area(h));
const spanX = (() => { let lo = 99, hi = -99; for (let x = cx - 15; x <= cx + 15; x++) for (let z = cz - 15; z <= cz + 15; z++) if (g.getBlock(x, y0 + 1, z) !== 0) { lo = Math.min(lo, x - cx); hi = Math.max(hi, x - cx); } return hi - lo + 1; })();
const r = {
  asksConfirm,
  height, topGlow: g.getBlock(cx, top, cz) === 60,
  fitsWorld: top < 256,
  span: spanX,
  narrowing: widths.every((w, i) => i === 0 || w < widths[i - 1]) && widths[5] > 0,
  entrance: g.getBlock(cx, y0 + 1, cz + 12) === 0 && g.getBlock(cx, y0 + 2, cz + 12) === 0 && g.getBlock(cx, y0 + 1, cz + 8) === 0,
  glass: g.getBlock(cx + 3, y0 + 5, cz + 6) === 14 || g.getBlock(cx - 3, y0 + 5, cz + 6) === 14 || g.getBlock(cx + 4, y0 + 5, cz + 5) === 14,
  floors: g.getBlock(cx + 2, y0 + 3, cz) === 3 && g.getBlock(cx + 2, y0 + 1, cz) === 0 && g.getBlock(cx + 2, y0 + 7, cz) === 3,
  saved: false,
};
window.__burj = { cx, cz, y0, top };
g.saveGame();
await wait(600);
r.saved = !document.getElementById('saved').hidden;
sessionStorage.setItem('burj', JSON.stringify({ cx, cz, top }));
r.widths = widths;
r.p = { cx, cz, y0, top };
return { ok: r.asksConfirm && r.height === 207 && r.topGlow && r.fitsWorld && r.span >= 18 && r.span <= 28 && r.narrowing && r.entrance && r.glass && r.floors && r.saved, ...r };
