// ---------- Ultra görünüm ----------
// Shader modunun üstüne (kontrol paneli "Ultra görüntü"): sahne bir hedef dokuya çizilir, parlak bölgeler bulanıklaştırılıp
// geri eklenir (ışık parlaması / bloom), sinematik renk düzeltmesi yapılır; gölge haritası daha keskin, su gök ve güneşi yansıtır.

let ultraMode = false;
const ULTRA_SHADOW_MAP = 4096, ULTRA_SHADOW_SPAN = 70, BLOOM_STRENGTH = 0.55;
const postScene = new THREE.Scene(), postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
postQuad.frustumCulled = false;
postScene.add(postQuad);
const makeTarget = () => new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
const sceneTarget = makeTarget(), bloomA = makeTarget(), bloomB = makeTarget();
const POST_VERTEX = 'varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const postMaterial = (uniforms, fragmentShader) => new THREE.ShaderMaterial({ uniforms, vertexShader: POST_VERTEX, fragmentShader, depthTest: false, depthWrite: false, toneMapped: false });
// Parlak geçiren: eşik üstündeki ışık kalır
const brightPass = postMaterial({ tInput: { value: null } }, `uniform sampler2D tInput; varying vec2 vUv;
void main() { vec3 c = texture2D(tInput, vUv).rgb; float l = dot(c, vec3(0.299, 0.587, 0.114)); gl_FragColor = vec4(c * smoothstep(0.72, 0.95, l), 1.0); }`);
// Ayrılabilir 9 noktalı Gauss bulanıklığı (yatay ya da dikey)
const blurPass = postMaterial({ tInput: { value: null }, uStep: { value: new THREE.Vector2() } }, `uniform sampler2D tInput; uniform vec2 uStep; varying vec2 vUv;
void main() {
  vec3 c = texture2D(tInput, vUv).rgb * 0.227;
  c += (texture2D(tInput, vUv + uStep * 1.38).rgb + texture2D(tInput, vUv - uStep * 1.38).rgb) * 0.316;
  c += (texture2D(tInput, vUv + uStep * 3.23).rgb + texture2D(tInput, vUv - uStep * 3.23).rgb) * 0.070;
  gl_FragColor = vec4(c, 1.0);
}`);
// Birleştirme: sahne + parlama, hafif sıcak vurgular ve kontrast
const compositePass = postMaterial({ tScene: { value: sceneTarget.texture }, tBloom: { value: bloomA.texture }, uStrength: { value: BLOOM_STRENGTH } }, `uniform sampler2D tScene; uniform sampler2D tBloom; uniform float uStrength; varying vec2 vUv;
void main() {
  vec3 c = texture2D(tScene, vUv).rgb + texture2D(tBloom, vUv).rgb * uStrength * vec3(1.0, 0.95, 0.85);
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, 1.08);
  c = (c - 0.5) * 1.06 + 0.5;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`);
function runPass(material, target) {
  postQuad.material = material;
  renderer.setRenderTarget(target);
  renderer.render(postScene, postCamera);
}
const bufferSize = new THREE.Vector2();
// Dünyayı (ve gözden görünümde kolu) çizer; ultra açıksa ışık parlamasıyla. main.js her karede çağırır.
function renderWorld(withArm) {
  if (!ultraMode) {
    renderer.clear();
    renderer.render(scene, camera);
    if (withArm) { renderer.clearDepth(); renderer.render(fpScene, fpCam); }
    return;
  }
  renderer.getDrawingBufferSize(bufferSize);
  if (sceneTarget.width !== bufferSize.x || sceneTarget.height !== bufferSize.y) {
    sceneTarget.setSize(bufferSize.x, bufferSize.y);
    bloomA.setSize(bufferSize.x >> 1, bufferSize.y >> 1);
    bloomB.setSize(bufferSize.x >> 1, bufferSize.y >> 1);
  }
  renderer.setRenderTarget(sceneTarget);
  renderer.clear();
  renderer.render(scene, camera);
  if (withArm) { renderer.clearDepth(); renderer.render(fpScene, fpCam); }
  brightPass.uniforms.tInput.value = sceneTarget.texture;
  runPass(brightPass, bloomA);
  // İki tur, ikincisi daha geniş: yumuşak, geniş bir hale
  for (const spread of [1, 2.5]) {
    blurPass.uniforms.tInput.value = bloomA.texture;
    blurPass.uniforms.uStep.value.set(spread / bloomA.width, 0);
    runPass(blurPass, bloomB);
    blurPass.uniforms.tInput.value = bloomB.texture;
    blurPass.uniforms.uStep.value.set(0, spread / bloomA.height);
    runPass(blurPass, bloomA);
  }
  runPass(compositePass, null);
}
// Ultra açılınca shader modu da açılır; gölge haritası büyür ve daralır (daha keskin gölge)
function setUltraMode(on) {
  if (on && !shaderMode) setShaderMode(true);
  ultraMode = on;
  settings.ultra = on;
  const size = on ? ULTRA_SHADOW_MAP : SHADOW_MAP, span = on ? ULTRA_SHADOW_SPAN : SHADOW_SPAN;
  worldSun.shadow.mapSize.set(size, size);
  Object.assign(worldSun.shadow.camera, { left: -span, right: span, top: span, bottom: -span });
  worldSun.shadow.camera.updateProjectionMatrix();
  if (worldSun.shadow.map) { worldSun.shadow.map.dispose(); worldSun.shadow.map = null; }
  waterUltra.value = on ? 1 : 0;
  saveSettings();
  return on ? 'Ultra görüntü açık' : 'Ultra görüntü kapalı';
}
Object.assign(window.game, { setUltraMode, isUltraMode: () => ultraMode });
