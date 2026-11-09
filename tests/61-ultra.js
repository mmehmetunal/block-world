// Madde 61: ultra görüntü panelden açılır (shader modunu da açar), ışık parlamalı çizim hattı çalışır, keskin gölge;
// shader kapanınca ultra da kapanır
const g = window.game;
document.getElementById('play').click();
await wait(300);
g.openControl();
document.querySelector('[data-toggle="ultra"]').click();
const buttons = ['ultra', 'shader'].every(k => document.querySelector(`[data-toggle="${k}"]`).classList.contains('on'));
g.closeControl();
document.getElementById('play').click();
await wait(800);
const on = g.isUltraMode() && g.isShaderMode() && worldSun.shadow.mapSize.x === 4096 && g.settings.ultra === true;
// Çizim hattı: sahne hedef dokuya, parlama yarı boyutta
const targets = sceneTarget.width > 1 && bloomA.width === sceneTarget.width >> 1 && waterUltra.value === 1;
// Ekrandaki görüntü boş değil (birleştirme geçişi ekrana yazdı)
const gl = renderer.getContext(), px = new Uint8Array(4);
let drawn = false;
await new Promise(r => requestAnimationFrame(() => { gl.readPixels(gl.drawingBufferWidth >> 1, gl.drawingBufferHeight >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); drawn = px[0] + px[1] + px[2] > 0; r(); }));
g.setShaderMode(false);
await wait(300);
const off = !g.isUltraMode() && worldSun.shadow.mapSize.x === 2048 && waterUltra.value === 0;
return { ok: buttons && on && targets && off, buttons, on, targets, drawn, off };
