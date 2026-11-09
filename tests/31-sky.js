// Madde 31: bulutlar ve yıldızlar
const g = window.game, p = g.player;
document.getElementById('play').click();
for (let i = 0; i < 100 && !p.onGround; i++) await wait(50);
g.clock.time = 0.25;
await wait(300);
const atHeight = Math.abs(g.clouds.position.y - 192) < 0.01;
// Bulutlar 0,6 blok/sn doğuya kayar
const d0 = g.cloudDrift(), t0 = performance.now();
await wait(2000);
const speed = (g.cloudDrift() - d0) / ((performance.now() - t0) / 1000);
const drifting = speed > 0.2 && speed < 0.7;
const dayColor = g.clouds.material.color.r;
const dayStars = g.stars.material.opacity;
// Gece: bulutlar grileşir, yıldızlar görünür
g.clock.time = 0.75;
await wait(400);
const nightColor = g.clouds.material.color.r, nightStars = g.stars.material.opacity;
return { ok: atHeight && drifting && dayColor > 0.95 && nightColor < 0.5 && dayStars < 0.05 && nightStars > 0.95 && g.stars.geometry.attributes.position.count === 400,
  atHeight, speed: +speed.toFixed(2), dayColor, nightColor, dayStars, nightStars };
