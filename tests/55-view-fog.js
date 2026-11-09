// Madde 55: çok uzak görüş (200 blok), sis ve bulut düğmeleri; bulutlar y = 192'de
const g = window.game;
document.getElementById('play').click();
await wait(300);
g.openControl();
document.querySelector('[data-distance="ultra"]').click();
document.querySelector('[data-toggle="fog"]').click();
document.querySelector('[data-toggle="clouds"]').click();
const buttons = ['fog', 'clouds'].every(k => !document.querySelector(`[data-toggle="${k}"]`).classList.contains('on'));
g.closeControl();
document.getElementById('play').click();
await wait(500);
const fogFar = g.fogFar(), fogNear = scene.fog.near, camFar = camera.far;
const ultra = fogFar === 200 && fogNear >= 170 && camFar >= 300;
const cloudsHidden = !g.clouds.visible && g.clouds.position.y === 192;
setClouds(true); setFog(true);
await wait(300);
const restored = g.clouds.visible && scene.fog.near < 100;
return { ok: buttons && ultra && cloudsHidden && restored, buttons, ultra, cloudsHidden, restored, fogFar, fogNear, camFar };
