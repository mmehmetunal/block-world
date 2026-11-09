// ---------- Shader modu ----------
// Gerçekçi görünüm (kontrol paneli "Shader modu"): güneşten gölge, köşe ortam gölgesi (AO), ışıklı malzeme,
// dalgalı su, gökyüzü geçişi, sinematik ton eşleme ve hafif renk düzeltme. Kapalıyken eski çizim değişmez.

const SHADOW_SPAN = 90, SHADOW_MAP = 2048;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// Dünyadaki güneş ışığı (lightRigs[0].sun) gölge düşürür; kamera oyuncuyu izler
const worldSun = lightRigs[0].sun, worldHemi = lightRigs[0].hemi;
worldSun.shadow.mapSize.set(SHADOW_MAP, SHADOW_MAP);
Object.assign(worldSun.shadow.camera, { left: -SHADOW_SPAN, right: SHADOW_SPAN, top: SHADOW_SPAN, bottom: -SHADOW_SPAN, near: 1, far: 400 });
worldSun.shadow.bias = -0.0004;
worldSun.shadow.normalBias = 0.04;
scene.add(worldSun.target);

// Işıklı dünya malzemesi: renk ışıklarla (gök + güneş) hesaplanır, meşale ışığı sıcak bir parıltı olarak eklenir.
const shadedMaterial = new THREE.MeshLambertMaterial({ map: texture, vertexColors: true, alphaTest: 0.5 });
shadedMaterial.onBeforeCompile = shader => {
  shader.vertexShader = 'attribute float torchLight;\nvarying float vTorch;\n' +
    shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vTorch = torchLight;');
  shader.fragmentShader = 'varying float vTorch;\n' +
    shader.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n  totalEmissiveRadiance += diffuseColor.rgb * vTorch * vec3(1.0, 0.8, 0.55) * 0.9;');
};
// Su: üst yüzde dalga, ışık kıpırtısı, daha koyu ve daha az saydam
// Ultra görünümde (waterUltra = 1) su yüzeyi gökyüzünü (fresnel) ve güneşi (parlama) yansıtır
const waterTime = { value: 0 }, waterUltra = { value: 0 }, waterSky = { value: new THREE.Color() }, waterSun = { value: new THREE.Vector3(0, 1, 0) };
const shadedWaterMaterial = withTorchLight(new THREE.MeshBasicMaterial({ map: texture, vertexColors: true, transparent: true, opacity: 0.78, depthWrite: false, color: 0x7fa8d8 }));
const baseWaterCompile = shadedWaterMaterial.onBeforeCompile;
shadedWaterMaterial.onBeforeCompile = shader => {
  baseWaterCompile(shader);
  Object.assign(shader.uniforms, { uTime: waterTime, uUltra: waterUltra, uSky: waterSky, uSun: waterSun });
  shader.vertexShader = 'uniform float uTime;\nvarying vec3 vWorld;\nvarying float vUp;\n' + shader.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\n  if (normal.y > 0.5) transformed.y += sin(position.x * 1.7 + uTime * 1.6) * 0.04 + cos(position.z * 1.3 + uTime * 1.2) * 0.04 - 0.06;\n  vWorld = position;\n  vUp = normal.y;');
  shader.fragmentShader = 'uniform float uTime;\nuniform float uUltra;\nuniform vec3 uSky;\nuniform vec3 uSun;\nvarying vec3 vWorld;\nvarying float vUp;\n' + shader.fragmentShader.replace('#include <color_fragment>',
    `#include <color_fragment>
  float glint = pow(max(0.0, sin(vWorld.x * 2.3 + uTime * 2.0) * sin(vWorld.z * 2.1 - uTime * 1.7)), 6.0);
  diffuseColor.rgb += vec3(0.35, 0.4, 0.45) * glint;
  if (uUltra > 0.5 && vUp > 0.5) {
    // Dalga eğiminden yüzey normali, bakış açısına göre gök yansıması ve güneş parlaması
    vec3 n = normalize(vec3(-0.068 * cos(vWorld.x * 1.7 + uTime * 1.6) - 0.05 * cos(vWorld.x * 4.1 + vWorld.z * 3.3 + uTime * 3.0), 1.0, 0.052 * sin(vWorld.z * 1.3 + uTime * 1.2) - 0.05 * cos(vWorld.z * 3.7 - vWorld.x * 2.9 + uTime * 2.6)));
    vec3 v = normalize(cameraPosition - vWorld);
    float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    diffuseColor.rgb = mix(diffuseColor.rgb, uSky, 0.08 + 0.6 * fresnel);
    diffuseColor.rgb += vec3(1.0, 0.92, 0.75) * pow(max(dot(reflect(-normalize(uSun), n), v), 0.0), 180.0) * 2.5;
    diffuseColor.a = mix(diffuseColor.a, 1.0, fresnel * 0.6);
  }`);
};
// Gökyüzü kubbesi: ufuk açık, tepe koyu mavi; güneşin çevresi parlar. Sis rengi ufuk rengiyle aynı kalır.
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.ShaderMaterial({
  uniforms: { uHorizon: { value: new THREE.Color() }, uZenith: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3() }, uGlow: { value: 1 } },
  vertexShader: 'varying vec3 vDir;\nvoid main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform vec3 uHorizon; uniform vec3 uZenith; uniform vec3 uSun; uniform float uGlow; varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  vec3 c = mix(uHorizon, uZenith, pow(clamp(d.y, 0.0, 1.0), 0.55));
  c += vec3(1.0, 0.85, 0.6) * pow(max(dot(d, normalize(uSun)), 0.0), 24.0) * 0.45 * uGlow;
  gl_FragColor = vec4(c, 1.0);
}`,
  side: THREE.BackSide, depthWrite: false, fog: false,
}));
skyDome.renderOrder = -1;
skyDome.visible = false;
scene.add(skyDome);
const ZENITH_DAY = new THREE.Color(0x3a7bd5), ZENITH_NIGHT = new THREE.Color(0x02040c);

// Köşe ortam gölgesi: yüzün önündeki iki yan ve bir köşe hücresi doluysa köşe kararır (shader modunda)
const AO_LEVELS = [0.45, 0.65, 0.82, 1];
const occludes = (x, y, z) => { const b = get(x, y, z); return b !== AIR && isSolid(b) && !BLOCKS[b].transparent && !BLOCKS[b].model; };
function cornerAO(x, y, z, dir, p) {
  const ox = x + dir[0], oy = y + dir[1], oz = z + dir[2];
  const axes = [0, 1, 2].filter(i => dir[i] === 0);
  const s = [0, 0, 0], t = [0, 0, 0];
  s[axes[0]] = p[axes[0]] ? 1 : -1;
  t[axes[1]] = p[axes[1]] ? 1 : -1;
  const a = occludes(ox + s[0], oy + s[1], oz + s[2]), b = occludes(ox + t[0], oy + t[1], oz + t[2]);
  const c = occludes(ox + s[0] + t[0], oy + s[1] + t[1], oz + s[2] + t[2]);
  return AO_LEVELS[a && b ? 0 : 3 - a - b - c];
}

function setShaderMode(on) {
  // Shader kapanınca ultra görünüm de kapanır
  if (!on && ultraMode) setUltraMode(false);
  shaderMode = on;
  settings.shader = on;
  renderer.toneMapping = on ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
  renderer.toneMappingExposure = 0.95;
  worldSun.castShadow = on;
  // Kapanınca ışıklar eski renklerine döner (yoğunlukları gün döngüsü verir)
  if (!on) { worldSun.color.set(0xffffff); worldHemi.color.set(0xffffff); worldHemi.groundColor.set(0x9a8f80); worldSun.position.set(0.4, 1, 0.3); worldSun.target.position.set(0, 0, 0); }
  skyDome.visible = on;
  renderer.domElement.classList.toggle('shaded', on);
  document.getElementById('vignette').hidden = !on;
  // Bütün malzemeler ton eşlemeyle yeniden derlenir; chunk'lar yeni malzeme ve AO ile yeniden kurulur
  scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { m.needsUpdate = true; }); });
  clearChunkMeshes();
  buildAround(player.x, player.z, 2);
  saveSettings();
  return on ? 'Shader modu açık' : 'Shader modu kapalı';
}
// Her karede: güneş/ay ışığı yönü, gölge kamerası, gökyüzü renkleri ve su zamanı
function updateShaderMode(dt) {
  if (!shaderMode) return;
  // Video aracı kare zamanını verir (window.game.videoTime): su her kayıtta aynı ve düzgün dalgalanır
  waterTime.value = window.game.videoTime ?? waterTime.value + dt;
  const angle = clock.time * Math.PI * 2, day = daylight(clock.time);
  const sunDir = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0.25).normalize();
  // Gece ışığı ayından gelir (güneşin tam karşısı), daha zayıf ve mavimsi
  const lightDir = sunDir.y > -0.05 ? sunDir : sunDir.clone().negate();
  const night = dimension === 'nether' ? NETHER_BRIGHTNESS : 1;
  worldSun.position.set(player.x, player.y, player.z).addScaledVector(lightDir, 200);
  worldSun.target.position.set(player.x, player.y, player.z);
  worldSun.color.setRGB(1, 0.93 + 0.07 * day, 0.82 + 0.18 * day);
  worldSun.intensity = (0.12 + 1.0 * day) * night * Math.min(1, Math.max(0, lightDir.y * 4));
  worldHemi.intensity = (0.15 + 0.4 * day) * night;
  worldHemi.color.setRGB(0.75 + 0.25 * day, 0.82 + 0.18 * day, 1);
  worldHemi.groundColor.setRGB(0.45, 0.4, 0.35);
  skyDome.position.copy(camera.position);
  skyDome.scale.setScalar(camera.far * 0.9);
  skyDome.visible = dimension === 'overworld';
  const u = skyDome.material.uniforms;
  u.uHorizon.value.copy(sky);
  u.uZenith.value.copy(ZENITH_NIGHT).lerp(ZENITH_DAY, day);
  u.uSun.value.copy(sunDir);
  u.uGlow.value = Math.max(0, sunDir.y + 0.2);
  waterSky.value.copy(sky).lerp(u.uZenith.value, 0.7);
  waterSun.value.copy(lightDir);
}
Object.assign(window.game, { setShaderMode, isShaderMode: () => shaderMode });
