// ---------- Elde alet ----------
// Seçili alet aşınması ve eldeki eşyanın görünmesi.

const selectedTool = () => inventory[selected] && ITEMS[inventory[selected].key].tool ? inventory[selected] : null;
// Alet her kırma ve vuruşta 1 aşınır; bitince kırılır.
function useTool() {
  const s = inventory[selected];
  s.durability--;
  if (s.durability <= 0) { inventory[selected] = null; toast(ITEMS[s.key].name + ' kırıldı'); }
  renderInventory();
}
// Seçili eşya gözden görünümde kolun ucunda, 3. şahıs modelde sağ elde görünür:
// bloklar gerçek dokulu küçük bir küp, diğer eşyalar (alet, yemek, bitki) Minecraft'taki gibi kabartmalı 3B model (itemGeometry).
// Model sapı (simgenin sol alt köşesi) elde kalacak biçimde ölçeklenir: 3. şahısta 0,8, gözden 0,65 blok.
const HELD_SIZE_TP = 0.8, HELD_SIZE_FP = 0.65;
// rotation: modelin kola göre duruşu; handle: sapın (simgenin sol alt köşesi) koldaki yeri. Model sap çevresinde ölçeklenir.
const heldModel = (size, handle, rotation) => {
  const m = new THREE.Mesh(itemGeometry('stick'), itemModelMaterial);
  m.rotation.copy(rotation);
  m.scale.setScalar(size);
  const grip = new THREE.Vector3(-0.5, -0.5, 0).multiplyScalar(size).applyEuler(m.rotation);
  m.position.set(handle[0] - grip.x, handle[1] - grip.y, handle[2] - grip.z);
  return m;
};
const fpTool = heldModel(HELD_SIZE_FP, [0, -0.17, 0.13], new THREE.Euler(-Math.PI / 2, Math.PI / 2, 0));
fpArm.add(fpTool);
// 3. şahıs: elde, yassı yüzü yana bakar, ucu öne ve biraz yukarı (Minecraft'taki tutuş)
const tpTool = heldModel(HELD_SIZE_TP, [0, -0.6, -0.05], new THREE.Euler(0, Math.PI / 2, -Math.PI / 4 + 0.35, 'YZX'));
armR.add(tpTool);
// Blok küpü: yüz sırası +x, -x, +y, -y, +z, -z
const blockMaterials = {};
const tileMaterial = tile => {
  const c = document.createElement('canvas'); c.width = c.height = T;
  c.getContext('2d').drawImage(atlas, tile * T, 0, T, T, 0, 0, T, T);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  return new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.5 });
};
const fpBlock = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3));
fpBlock.position.set(0, -0.42, -0.1);
fpArm.add(fpBlock);
const tpBlock = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25));
tpBlock.position.set(0, -0.62, -0.12);
armR.add(tpBlock);
// Çapraz modelli bloklar (bitkiler) ve küpü olmayan bloklar düz simge olarak tutulur; merdiven, çit gibi şekilli bloklar
// (demir parmaklık dışında) küp olarak.
const heldAsCube = s => {
  const id = ITEMS[s.key].block;
  return !!id && (!BLOCKS[id].model || (isShape(id) && BLOCKS[id].shape !== 'bars')) && !isTorch(id);
};
function updateHeldTool() {
  const s = inventory[selected];
  const cube = !!s && heldAsCube(s);
  fpTool.visible = tpTool.visible = !!s && !cube;
  fpBlock.visible = tpBlock.visible = cube;
  if (!s) return;
  if (cube) {
    const def = BLOCKS[ITEMS[s.key].block];
    if (!blockMaterials[s.key]) {
      const [side, top, bottom] = [def.side, def.top, def.bottom].map(tileMaterial);
      blockMaterials[s.key] = [side, side, top, bottom, side, side];
    }
    fpBlock.material = tpBlock.material = blockMaterials[s.key];
    return;
  }
  fpTool.geometry = tpTool.geometry = itemGeometry(s.key);
}

renderInventory();
selectSlot(0);
Object.assign(window.game, { inventory, addItem, openInventory, closeInventory, clickSlot, clickCraft, clickResult, craftGrid });
Object.assign(window.game, { mining: miningState, crackVisible: () => crackBox.visible });
Object.assign(window.game, { hunger, renderFood });
Object.assign(window.game, { getSpawnPoint: () => spawnPoint, isSleeping: () => sleepTimer > 0 });
Object.assign(window.game, { crops, trySpawnHostile });
Object.assign(window.game, { heldView: () => ({ cube: fpBlock.visible, icon: fpTool.visible }), items: ITEMS, furnaces, openFurnace, clickFurnace, rebuild: buildChunk, camera, cameraDistance: () => cameraDistance, raycast, torchNearby, torchLight: (x, y, z) => torchLightAt(torchesNear(x - 8, z - 8, x + 8, z + 8), x, y, z) });
