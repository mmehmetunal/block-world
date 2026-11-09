# Blok Dünyası: teknik şartname

Bu belge oyunun **şu anki** halini anlatır. Bir özellik eklendiğinde ya da bir şey değiştiğinde bu belge de aynı commit'te güncellenir. Yapılacaklar [minecraft-feature-list.md](minecraft-feature-list.md) dosyasındadır; çalışma kuralları [AGENTS.md](AGENTS.md) dosyasındadır.

## Özet

| | |
| --- | --- |
| Tür | Tarayıcıda oynanan, Minecraft'tan esinlenen tek oyunculu blok oyunu |
| Dosyalar | `index.html` (sayfa iskeleti), `css/style.css`, `js/*.js` (32 betik, sırayla yüklenir) |
| Teknoloji | Düz HTML + CSS + JavaScript, Three.js r128 (cdnjs) |
| Arayüz dili | Türkçe |
| Kod dili | İngilizce adlar, Türkçe yorumlar |
| Platform | Masaüstü tarayıcı, klavye + fare. Telefon desteklenmiyor. |
| Çalışma biçimi | GitHub Pages (`block-world.necim.dev`) ya da çift tıklanan yerel dosya. İnternet gerekir (Three.js). Artifact olarak yayınlanmaz. |

---

## Dosya yapısı

```
index.html          sayfa iskeleti: HUD ve panel öğeleri, betiklerin yükleme sırası
css/style.css       bütün stiller
js/*.js             oyun betikleri (aşağıdaki sırayla)
tools/              test ve video araçları (oyunun parçası değil); tools/video/ yapı videosu kaydedici
tests/              otomatik testler
```

- **`css/style.css`:** CSS değişkenleri `:root` bloğundadır. `[hidden] { display: none !important; }` kuralı, `display` verilmiş panellerin `hidden` ile gizlenebilmesi için gereklidir; silme.
- **`index.html`:** `<head>`'de başlık, Roboto (Google Fonts) ve `css/style.css`. `<body>` içinde HUD öğeleri:

   | id | Görevi |
   | --- | --- |
   | `game` | WebGL tuvalinin yerleştiği kap |
   | `crosshair` | Ekran ortasındaki artı işareti (önden kamerada gizlenir) |
   | `info` | Sol üstte gün, saat ve konum: `Gün 1 · 07:12 · X 48 · Y 13 · Z 48` |
   | `blockname` | Hotbar üstünde 1,5 sn görünen bildirim (blok adı, kamera adı) |
   | `hotbar` | 9 yuvalı hotbar: eşya simgesi, sol üstte yuva numarası, sağ altta adet |
   | `status` / `hearts` / `food` | Hotbar'ın üstünde, solda 10 kalp, sağda 10 but (açlık; soldan boşalır). Genişliği hotbar'la aynıdır. |
   | `sleep` | Uyurken ekranı karartan katman |
   | `underwater` | Kamera suyun içindeyken ekranı mavi tonlayan katman |
   | `hurt` | Hasar alınca 0,2 sn yanan kırmızı ekran kenarı |
   | `portal-fx` | Portalda beklerken mora dönüp kararan katman |
   | `portal-hud` | Portal geri sayımı: "Portal: 2…" |
   | `low-health` | Can 4 ve altındayken ekran kenarını koyu kırmızıya karartan katman |
   | `inventory` | E ile açılan envanter paneli: başlık (`#inv-title`) ve "Tarifler" düğmesi (`#book-toggle`), solunda tarif kitabı (`#recipe-book`), eşya seçici (`#picker-ui`), sandık ızgarası (`#chest-ui`, 27 yuva), fırın bölümü (`#furnace-ui`: girdi, alev göstergesi, yakıt, ilerleme çubuğu, çıktı), üretim bölümü (`#craft-ui`: `#craft-grid` ve `#craft-result`), çanta (`#inv-bag`, 27 yuva), hotbar satırı (`#inv-hotbar`) |
   | `held` | Envanterde farenin tuttuğu yığın, imleci izler |
   | `chat` | Sohbet: `#chat-log` satırları ve `#chat-input` (yalnızca sohbet açıkken görünür) |
   | `tooltip` | Yuvanın üzerine gelince eşya adını gösteren Minecraft ipucu kutusu |
   | `death` | "Öldün!" paneli ve "Yeniden doğ" düğmesi (`#respawn`) |
   | `overlay` | Başlangıç / duraklatma menüsü. `#menu-main`: tuş listesi (`.keys`), "Oyna" / oyun başladıktan sonra "Devam et" (`#play`, kayıt okunana kadar pasif), "Ayarlar" (`#open-settings`), "Kaydet" (`#save-now`, oyun başladıktan sonra), "Yeni dünya" (`#reset`, kırmızı), kayıt durumu (`#save-note`). `#menu-settings`: ayar denetimleri ve "Geri" |
   | `saved` | Kayıttan sonra sağ üstte 1 sn görünen "Kaydedildi" yazısı |

- **Betikler:** `<body>` sonunda önce Three.js r128, sonra `js/` altındaki oyun betikleri bu sırayla yüklenir. Bunlar ES modülü değil, klasik betiklerdir: her dosyanın üst düzey `const`/`let`/`function` tanımları bütün betiklerin paylaştığı genel kapsamdadır. Bu sayede oyun `file://` üzerinden (çift tıklayarak) da açılır.

   | Dosya | İçerik |
   | --- | --- |
   | `textures.js` | 16×16 piksellik doku atlası, `TILE` sabitleri, `tileImage()` |
   | `build-textures.js` | Yapı bloklarının dokuları (`paintTile`), 16 renk tablosu `DYES` |
   | `blocks.js` | `BLOCKS` tanımları, `B` kısaltmaları |
   | `build-blocks.js` | Yapı küpleri, şekilli blok aileleri (`SHAPE_FAMILIES`, `SHAPE_MATERIALS`), bağlanan şekiller (`addBlock`) |
   | `world-gen.js` | Chunk haritası (`worlds`, `world`, `modifiedChunks`), `get/set`, `ensureChunk()`, `ensureArea()`, gürültü fonksiyonları, biyomlar, `generateChunk()` |
   | `renderer.js` | Renderer, sahne, kamera, ışıklar (`lightRigs`), kol sahnesi, chunk mesh'leri, seçim çerçevesi |
   | `shader-mode.js` | Shader modu: ışıklı malzeme (`shadedMaterial`), gölge (`worldSun`), köşe ortam gölgesi (`cornerAO`), dalgalı su, gökyüzü kubbesi, ton eşleme (`setShaderMode`, `updateShaderMode`) |
   | `shapes.js` | Şekilli blokların geometrisi, çarpışma kutuları (`shapeBoxes`), çizimi (`addShapeModel`), konma yönü (`shapeVariant`, `mergeSlab`), simge ve eldeki model (`shapeIcon`, `shapeMesh`) |
   | `day-cycle.js` | `clock`, `daylight()`, `clockText()`, `updateDayCycle()`, güneş ve ay |
   | `sky.js` | Bulutlar (`clouds`, `cloudTexture`) ve yıldızlar (`stars`), `updateSky()` |
   | `player-model.js` | `paint()`, `buildHumanoid()` (oyuncu, zombi, iskelet ortak), oyuncu modeli ve gözden görünümdeki kol |
   | `physics.js` | Oyuncu durumu, `spawn()`, ortak AABB fiziği: `collides()`, `moveAxis()`, `stepEntity()` |
   | `input.js` | Klavye, fare, fare kilidi, kamera değiştirme, koşma |
   | `block-interaction.js` | Nişan ışını (`aim`), `raycast()`, `targetedMob()`, `attackMob()`, `breakBlockAt()`, çatlak dokuları, `updateMining()`, `placeBlock()` |
   | `hud.js` | Hotbar yuvaları (`HOTBAR_SIZE = 9`), `toast()`, `selectSlot()` |
   | `health.js` | Kalp çizimi, `renderHearts()`, `damagePlayer()`, `updateHealth()`, `die()`, yeniden doğma |
   | `portal.js` | Portal dokusu ve düzlemleri (`rebuildPortalMeshes()`), çerçeve denetimi (`portalInterior()`), `tryLightPortal()`, `extinguishPortalNear()`, portalda bekleme (`updatePortal()`) |
   | `crops.js` | `crops`, `plantCrop()`, `scanCrops()`, `updateCrops()` |
   | `doors.js` | `toggleDoor()` |
   | `bed.js` | `setSpawnNearBed()`, `useBed()`, `updateSleep()` |
   | `hunger.js` | `FOOD_SHAPE`, `renderFood()`, `hunger`, `heldFood()`, `updateHunger()` (azalma, açlıktan hasar, yemek yeme) |
   | `mob-models.js` | `box()`/`pivot()` model yardımcıları; hayvan, zombi, iskelet, örümcek ve creeper modelleri |
   | `mobs.js` | `MOB_TYPES`, `mobs`, `spawnMob()`, `removeMob()`, `rayMob()`, `hurtMob()`, hayvan ve düşman doğurma, `canSeePlayer()`, `skyAbove()`, yanma parçacıkları (`particles`), `explode()`, `updateMob()`, `renderMob()` |
   | `arrows.js` | `projectiles`, `arrowMesh()`, `shootArrow()` (iskelet), `updateProjectiles()` (iskelet ve oyuncu okları) |
   | `structures.js` | Köy planları ve üretimi: `villagePlan()`, `placeVillageParts()`, `villageNear()`; Nether kalesi: `fortressPlan()`, `placeFortressParts()`, `fortressNear()`; açılışta doğma noktasının çevresini üretir |
   | `blaze.js` | Blaze modeli ve davranışı (`updateBlaze()`), küçük ateş topu (`shootSmallFireball()`), blaze çubuğu, doğurucular (`updateBlazeSpawners()`) |
   | `villages.js` | Köylü modeli ve davranışı, zümrüt, `TRADES`, ticaret paneli (`openTrade()`, `trade()`, `tryOpenTrade()`), `updateVillages()` |
   | `chunk-loader.js` | Yürüdükçe chunk üretme, mesh kurma ve kaldırma: `updateChunks()`, `nearestChunk()` |
   | `fluids.js` | Akış: `FLUIDS`, `fluidQueues`, `desiredLiquid()`, `stepFluid()`, `quench()`, `updateFluids()`, `clearFluids()` |
   | `bucket.js` | Kova eşyaları ve tarifi, `heldBucket()`, `sourceInSight()`, `useBucket()` |
   | `bow.js` | Yay ve ip eşyaları, tarifler, `bowCharge`, `updateBow()`, `shootPlayerArrow()`, `arrowHitsMob()`, `pickUpArrow()` |
   | `items.js` | `ITEMS`, `BLOCK_ITEM`, eşya simgeleri (`ITEM_ART`, `itemIcon()`), `MOB_DROPS`, yerdeki eşyalar (`drops`, `dropItem()`, `updateDrops()`), toplama |
   | `nether-mobs.js` | Zombi domuz adam ve ghast modelleri ve türleri (`MOB_TYPES`'a eklenir), `angerPigmen()`, `updateGhast()`, ateş topu (`shootFireball()`, `updateFireball()`, `reflectFireball()`), Nether doğması (`updateNetherSpawning()`). `MOB_DROPS`'a eklediği için `items.js`'ten sonra yüklenir |
   | `debris.js` | Kırılma parçacıkları: `debris`, `spawnDebris()`, `updateDebris()` |
   | `inventory.js` | `inventory`, `maxStack()`, `addItem()`, `takeFromSlot()`, `throwSelected()`, envanter yuva öğeleri |
   | `crafting.js` | `craftGrid`, `craftSize`, `RECIPES`, `craftResult()`, üretim ızgarası yuvaları, `clickCraft()`, `clickResult()` |
   | `inventory-panel.js` | `paintSlot()`, `renderInventory()`, `clickIn()`/`clickSlot()`, `openInventory()`, `giveOrDrop()`, `closeInventory()` |
   | `furnace.js` | `furnaces`, `SMELTING`, `FUEL`, `openFurnace()`, `clickFurnace()`, `updateFurnaces()`, `removeFurnace()`, `renderFurnace()` |
   | `armor.js` | Zırh eşyaları ve tarifleri, `armor`, `armorPoints()`, `armorReduce()`, `clickArmor()`, `renderArmor()`, modeldeki parçalar (`armorMeshes`) |
   | `chest.js` | `chests`, `CHEST_SIZE`, `openChest()`, `clickChest()`, `removeChest()`, `renderChest()` |
   | `held-tool.js` | `selectedTool()`, `useTool()`, gözden ve 3. şahıs görünümde eldeki eşya (`fpTool`, `tpTool`, `fpBlock`, `tpBlock`, `updateHeldTool()`) |
   | `save.js` | IndexedDB: `openDb()`, `saveGame()`, `loadGame()`, `applySave()`, "Yeni dünya" |
   | `sound.js` | `initAudio()`, `playNoise()`, `playTone()`, `blockSound()`, `hurtSound()`, `popSound()`, `MOB_SOUNDS`, `updateMobSounds()`, `updateSteps()`, `setSound()` |
   | `settings.js` | `settings`, `VIEW_DISTANCES`, `applySettings()`, `loadSettings()`, `saveSettings()`, `showSettings()` |
   | `chat.js` | Sohbet (`chatLine()`, `openChat()`, `closeChat()`), komutlar (`COMMANDS`, `submitChat()`), sohbet dışı eylemler `game-actions.js`'te |
   | `game-actions.js` | Panel ve komutların ortak eylemleri: `godMode`, `safeMode`, `flyAllowed`, `flying`, `TIMES_OF_DAY`, `setGodMode()`, `setSafeMode()`, `setFlyAllowed()`, `healPlayer()`, `feedPlayer()`, `setTimeOfDay()`, `teleport()`, `clearInventory()`, `summonMob()`, `setSpawnHere()` |
   | `recipe-book.js` | Tarif kitabı: `setBookOpen()`, `selectRecipe()`, `fillRecipe()`, `renderBookList()`, `renderBookDetail()`. `renderInventory` yüklenirken onu çağırdığı için `held-tool.js`'ten önce yüklenir |
   | `guide.js` | Adım adım rehber: `GUIDE_STEPS`, `guideFlags`, `updateGuide()`, `renderGuide()`, `setGuideShown()` |
   | `control-panel.js` | Kontrol paneli: `controlOpen`, `openControl()`, `closeControl()`, `renderControl()` |
   | `item-picker.js` | Eşya seçici: `openPicker()`, `filterPicker()`, `clickPicker()` |
   | `nether.js` | `dimension`, `generateNetherChunk()`, `switchDimension()`, `portalLinks`, `createPortalNear()`, `travelThroughPortal()`, `updateLava()`. Yüklenirken `useBed` ve `RECIPES`'e eriştiği için `main.js`'ten hemen önce yüklenir |
   | `main.js` | `frame()`: hareket, fizik, kamera, animasyon, çizim |

---

## Dünya

- **Boyut:** Yatayda sonsuz, yükseklik `SY = 256` (yapı videoları için; arazi eskisi gibi en çok ~40 blok). Nether yalnızca alttaki `NETHER_H = 48` bloğu kullanır, üstü havadır. Dünya `CH = 16`'lık chunk'lardan oluşur; kenar duvarı yoktur.
- **Veri:** Her dünya bir chunk haritasıdır: `worlds.overworld`, `worlds.nether` = `Map<"cx,cz", Uint16Array(16 × 256 × 16)>`, hücre indeksi `(y * 16 + lz) * 16 + lx` (`cellIndex`). Değer blok kimliğidir (16 bit, en çok 65.535), `0` hava. `chunkTop(c)` dolu en üst katmanın bir üstünü verir; chunk çizimi ve meşale taraması orada durur. `world` etkin dünyanın haritasıdır.
- **Erişim:** `get(x, y, z)` yüklenmemiş chunk'ta ve `y ≥ SY`'de hava, `y < 0` için taş döndürür (altta delik görünmesin diye). `set(x, y, z, id)` yüklenmemiş chunk'ı yok sayar; üretim dışındaki her yazım chunk'ı değiştirilmiş sayar (`modifiedChunks[dimension]`) ve `onBlockSet`'i (sıvılar) çağırır. `inBounds` = yüklü chunk ve `0 ≤ y < SY`.
- **Yükleme** (`chunk-loader.js`, oyun oynanırken her karede): çizim yarıçapı görüş mesafesine bağlıdır (40 / 70 / 120 / 200 blok → 3 / 5 / 8 / 13 chunk). Oyuncunun chunk'ından halka halka dışa doğru (`nearestChunk`), karede en çok 1 chunk verisi üretilir (yarıçap + 1) ve 2 mesh kurulur; mesh, chunk ve dört komşusunun verisi hazırsa kurulur (kenar yüzleri doğru çizilsin). Yarıçap + 1 dışındaki mesh'ler sahneden kaldırılır; `max(12, yarıçap + 2)` chunk ötedeki değişmemiş veri 2 sn'de bir bellekten silinir (değiştirilmiş chunk'lar kalır).
- Açılışta doğma noktasının 3 chunk çevresi üretilir ve 2 chunk çevresi hemen çizilir; portaldan geçişte, ışınlanmada ve kayıt yüklenince de oyuncunun çevresi hemen hazırlanır (`buildAround`). Ekin ve portal taraması yalnızca değiştirilmiş chunk'lara bakar (`forEachModifiedCell`).
- **Tohum:** `SEED = 20261106`, sabit. Her açılışta aynı dünya üretilir.
- **Üretim chunk başınadır** (`generateChunk(cx, cz)`): her şey tohum ve koordinata bağlıdır, aynı chunk her zaman aynı çıkar. Chunk'a özgü rastgele üreteç `chunkRandom(cx, cz, tuz)`. Ağaçlar chunk kenarından 2 blok içeride, damarlar ve obsidyen öbekleri chunk içinde kalır (komşu chunk'a taşmaz).
- **Biyomlar** (`biomeAt(x, z)`): iki düşük frekanslı gürültü, sıcaklık `t` ve nem `m` (`BIOME_SCALE = 64`). Çöl: `t > 0,57` ve `m < 0,47`; karlı: `t < 0,42`; orman: `m > 0,56`; gerisi ova. Gürültü kaydırmaları, 96×96 başlangıç alanında dört biyomun da (~%22'şer) görüneceği ve doğma noktasının ormanda olacağı biçimde seçildi.
- **Arazi:** 4 oktavlı değer gürültüsü (`fbm`) ile `heightAt(x, z) = 6 + fbm^1.4 * 34 * (1 − 0,4 × çöllük)`; çöllük sıcaklık ve nemden sürekli hesaplandığı için biyom sınırlarında yükseklik yumuşak geçer.
  - `h ≤ 14`: üstte 3 blok kum, altı taş (kıyı ve göl tabanı).
  - Çöl: üstte 4 blok kum, altında 3 blok kumtaşı, sonra taş.
  - Karlı: üstte karlı çimen, altında 3 blok toprak. Ova ve orman: çimen ve 3 blok toprak.
- **Mağaralar:** Her sütunda `y = 2` ile yüzeyin 4 altı arasında iki 3B değer gürültüsünün (`valueNoise3`) aynı anda 0,5'e yakın olduğu hücreler (`a² + b² < CAVE_RADIUS²`, `CAVE_RADIUS = 0.075`) oyulur; kıvrımlı tüneller çıkar (yer altının ~%7'si). Tüneller yamaçlarda alçak komşu sütunlara ağız açar. Mağaralar aydınlıktır (ışık hesabı yok).
- **Obsidyen:** Chunk başına ~1 öbek: y 2–8 arasında, altı taş olan bir mağara tabanı hücresinin altındaki taş ve yanındaki 1–3 taş obsidyene döner.
- **Göller:** `y ≤ WATER_LEVEL = 12`'de arazi yüzeyinin üstünde kalan boşluklar su kaynağıyla dolar; mağaralar kuru kalır. Karlı biyomda göl yüzeyi (y = 12) buzdur.
- **Cevherler:** Chunk başına 8 kömür damarı (y 1–30) ve 4 demir damarı (y 1–20), 3–8 blokluk; 1 elmas damarı (y 1–10), 1–4 blokluk; rastgele yürüyüş, yalnızca taşın yerini alır.
- **Ağaç ve kaktüs:** Chunk başına biyoma göre deneme: orman 7 meşe, ova 1 (%60), karlı 3 ladin (6–7 blok gövde, koni biçimli yaprak), çöl 2 kaktüs (kum üstünde 1–3 blok). Meşe: 4–5 blok kütük, üstünde yaprak kümesi.
- **Bitkiler:** Üstü boş çimen sütunlarında ova %15 uzun ot ve %3 çiçek, orman %8 ve %1 (yarı yarıya gelincik ve karahindiba); çöl ve karlıda yok.
- **Biyom tonu:** Çimen üst yüzü ve yapraklar (`tint`) biyoma göre köşe rengiyle tonlanır (`BIOME_TINT`: ormanda koyu, çölde soluk sarı, karlıda soğuk).
- **Kaktüs** hücreden biraz dar bir kutudur (`box`); değen oyuncu saniyede 1 hasar alır. **Buz** kaygandır: üstündeyken yatay hız hedefe yavaşça yaklaşır (`ICE_GRIP = 1,5`), bırakınca kayılır. Hayvanlar yalnızca çimende doğduğundan çölde ve karlıda doğmaz.
- **Doğma noktası:** `SPAWN_X, SPAWN_Z = 48, 48` (eski 96×96 dünyanın ortası), sütunun en üstü.

### Bloklar

| Kimlik | Sabit (`B.`) | Ad (arayüz) | Üst / yan / alt doku |
| --- | --- | --- | --- |
| 0 | — | Hava | — |
| 1 | `grass` | Çimen | `grassTop` / `grassSide` / `dirt` |
| 2 | `dirt` | Toprak | `dirt` |
| 3 | `stone` | Taş | `stone` |
| 4 | `log` | Kütük | `logTop` / `logSide` / `logTop` |
| 5 | `leaves` | Yaprak | `leaves` |
| 6 | `sand` | Kum | `sand` |
| 7 | `planks` | Tahta | `planks` |
| 8 | `brick` | Tuğla | `brick` |
| 9 | `cobble` | Kırık taş | `cobble` |
| 10 | `crafting_table` | Çalışma masası | `craftingTop` / `craftingSide` / `planks` |
| 11 | `furnace` | Fırın | `furnaceTop` / `furnaceFront` / `furnaceTop` (blok yön tutmadığı için ağız dört yanda) |
| 12 | `sandstone` | Kumtaşı | `sandstoneTop` / `sandstoneSide` / `sandstoneTop` |
| 13 | `furnace_lit` | Fırın (yanan) | `furnaceTop` / `furnaceLit` / `furnaceTop`; yalnızca dünyada, kırılınca fırın düşer |
| 14 | `glass` | Cam | `glass`; çerçeve opak, içi saydam (`transparent`, `cutout`) |
| 15 | `coal_ore` | Kömür cevheri | `coalOre` (taş + siyah benekler) |
| 16 | `iron_ore` | Demir cevheri | `ironOre` (taş + bej benekler) |
| 17 | `water` | Su (kaynak) | `water`; `fluid`, `transparent`, `hidden` (eşya olarak alınamaz, kırılamaz), `liquid: 'water'`, `level: 0` |
| 47 | `tall_grass` | Uzun ot | `tallGrass`; `model: 'cross'`, `noCollide`, `cutout`, `replaceable`, `noDrop` (%12 buğday tohumu) |
| 48 | `poppy` | Gelincik | `poppy`; uzun ot gibi, eşya düşürmez |
| 49 | `dandelion` | Karahindiba | `dandelion`; uzun ot gibi, eşya düşürmez |
| 50 | `farmland` | Tarla | `farmland` / `dirt` / `dirt`; kırılınca toprak düşer |
| 51–54 | `wheat_0` … `wheat_3` | Buğday | `wheat0` … `wheat3`; `model: 'cross'`, `crop` (aşama 0–3) |
| 55 | `obsidian` | Obsidyen | `obsidian`; `breakTime: 36`, `pickaxe`, `minTier: 3` (demir kazmayla 6 sn, elmas kazmayla 4,5 sn) |
| 56–57 | `portal_x`, `portal_z` | Portal | `model: 'portal'` (chunk mesh'inde değil, `portal.js`), `axis`, `fluid` (çarpışmasız, nişan geçer), `noDrop` |
| 58 | `netherrack` | Kızıl taş | `netherrack`; `breakTime: 2`, `pickaxe`, `needsTool` |
| 59 | `lava` | Lav (kaynak) | `lava`; `fluid`, `selfLit` (kendi ışıklı malzeme), `hidden`, `noDrop`, `liquid: 'lava'`, `level: 0` |
| 60 | `glowstone` | Işıltı taşı | `glowstone`; `selfLit`, ışık kaynağı (`isLightSource`), kırılınca 2–4 `glowstone_dust` (`dropCount`) |
| 63–69 | `water_flow_1` … `water_flow_7` | Su (akan) | kaynakla aynı, `level` 1–7, `noDrop` |
| 70–76 | `lava_flow_1` … `lava_flow_7` | Lav (akan) | kaynakla aynı, `level` 1–7 |
| 77 | `snowy_grass` | Karlı çimen | `snowGrassTop` / `snowGrassSide` / `dirt`; kürek, toprak düşürür |
| 78 | `ice` | Buz | `ice`; yarı saydam, kaygan, kazma, bir şey düşmez |
| 79 | `cactus` | Kaktüs | `cactusTop` / `cactusSide`; dar kutu (`box`), değince hasar |
| 80 | `spruce_log` | Ladin kütüğü | `logTop` / `spruceLog`; balta, 1 → 4 tahta |
| 81 | `spruce_leaves` | Ladin yaprağı | `spruceLeaves`; bir şey düşmez |
| 82 | `nether_brick` | Nether tuğlası | `netherBrick`; kazma (`needsTool`), 10 sn |
| 83 | `spawner` | Blaze doğurucu | `spawner` (saydam zeminde demir kafes, `cutout`); kazma, 25 sn, bir şey düşmez |
| 62 | `diamond_ore` | Elmas cevheri | `diamondOre` (taş + turkuaz benekler); `breakTime: 15`, `minTier: 3`, 1 `diamond` düşürür |
| 61 | `chest` | Sandık | `chestTop` / `chestSide` (yanda koyu kilit çizgisi ve kilit); balta, 3,75 sn |
| 31–46 | `door_<yön>_<lower\|upper>_<closed\|open>` | Kapı | `doorLower` / `doorUpper`; `model: 'box'`, `box` (3/16 kalınlığında levha), `part`, `dir`, `open`, kırılınca `door` eşyası (bir kez) |
| 23–30 | `bed_foot_<yön>`, `bed_head_<yön>` (yön: `east`, `west`, `south`, `north`) | Yatak | `bedHeadTop` / `bedFootTop` / `bedSide`; `model: 'bed'`, `part`, `dir` (baş tarafı), `height: 9/16`, kırılınca `bed` eşyası (bir kez) |
| 18–22 | `torch_floor`, `torch_east`, `torch_west`, `torch_south`, `torch_north` | Meşale | `torch`; `model: 'torch'`, `lean` (eğilme yönü), `noCollide`, `transparent`, kırılınca `torch` eşyası |

Su dışındaki bütün bloklar katı ve opaktır. `isSolid(b)`: hava, `fluid` ve `noCollide` bloklar dışındakiler; çarpışma, görüş (`canSeePlayer`), gün ışığı (`skyAbove`), oklar ve kamera mesafesi bunu kullanır. `isTargetable(b)`: hava ve `fluid` dışındakiler; nişan ışını bunlarda durur (meşale kırılabilir). `y = 0` katmanı kırılamaz. Bloklar envanterden harcanır (bkz. Envanter).

**Dayanak:** Bir blok kırılınca üstündeki bitki kalkar, üstündeki yer meşalesi ve yan yüzlerine yaslanan duvar meşaleleri düşer. `passable(b)` (hava ya da `noCollide`): doğma noktası ve canlı doğurma için zemin aranırken bu hücreler atlanır. `replaceable` bloğun (bitki) yerine blok konabilir.

**Kırma:** Her blokta `breakTime` (elle kırma süresi), `tool` (hızlı kıran alet türü), gerekiyorsa `needsTool` (yalnızca o alet türüyle kırılınca düşer) ve `drop` (kendisi yerine düşen eşya) vardır. Seçili alet bloğun `tool` türündeyse süre aletin `speed` çarpanına bölünür (bkz. Aletler).

| Grup | Bloklar | Elle süre | `tool` | Elle kırınca düşer mi |
| --- | --- | --- | --- | --- |
| Yaprak | Yaprak | 0,3 sn | — | %10 |
| Toprak | Çimen, Toprak, Kum | 0,75 sn | `shovel` | Evet |
| Ahşap | Kütük, Tahta, Çalışma masası | 3 sn | `axe` | Evet |
| Taş | Taş (kırık taş düşürür, `drop`), Kırık taş, Tuğla, Fırın | 7,5 sn | `pickaxe` (`needsTool`) | Hayır |
| Cam | Cam | 0,5 sn | — | Evet |
| Cevher | Kömür cevheri (kömür düşürür), Demir cevheri (kendisi; `minTier: 2`, en az taş kazma) | 7,5 sn | `pickaxe` (`needsTool`) | Hayır |
| Kumtaşı | Kumtaşı | 4 sn | `pickaxe` (`needsTool`) | Hayır |

#### Yapı blokları ve şekiller (madde 56–57)

- `build-blocks.js` yeni blokları `addBlock(anahtar, tanım)` ile `BLOCKS` dizisinin sonuna ekler (kimlik 84'ten başlar, şu an ~900). Küpler: `BUILD_CUBES` tablosu ve 16 renk (`DYES`) için `<renk>_concrete`, `<renk>_wool`, `<renk>_stained_glass` (yarı saydam, saydam mesh'te). `emitsLight: true` olan bloklar (deniz feneri, lamba) meşale gibi ışık verir (`isLightSource`).
- **Şekilli bloklar** `model: 'shape'` ve `shape` alanını taşır; geometri `shapes.js`'tedir. Yönlü aileler `SHAPE_MATERIALS` (23 malzeme) × `SHAPE_KINDS`: `stairs` (merdiven), `slab` (yarım blok), `slope` (45° eğim), `arch` (kemer parçası: altı, bakış yönündeki alt köşeyi merkez alan çeyrek daireyle oyulmuş), `corner` (yuvarlak köşe: çeyrek silindir), `pillar` (yuvarlak sütun). Eşya anahtarı `<malzeme>_<şekil>` (ör. `stone_brick_stairs`) ailenin ilk türevidir; diğer türevler gizlidir (`<aile>_<yön><ters>`), kırılınca aile eşyası düşer. Her türev `dir` (`BED_DIRS` yönü), `flip` (üst yarı), `family`, `full` (tam blok kimliği) taşır.
- Bağlanan şekiller (tek kimlik): `fence` (çit), `pane` (demir/bronz parmaklık, cam panel), `wall` (duvar). Aynı türden komşulara ve tam opak küplere kol uzatır; komşu değişince chunk yeniden kurulduğu için kendiliğinden güncellenir.
- **Konma:** Yön oyuncunun bakış yönüdür (merdivenin yüksek tarafı, eğimin yükselen tarafı ve kemerin açıklığı o yöndedir). Bir bloğun alt yüzüne ya da yan yüzünün üst yarısına tıklanınca ters türev konur. Yarım bloğun üst yüzüne (ters yarım blokta alt yüzüne) aynı yarım blok konunca hücre tam bloğa döner (`mergeSlab`).
- **Çizim:** `addShapeModel` şeklin çokgenlerini opak mesh'e yazar; doku hücre koordinatından, yüzün normaline göre izdüşümle okunur (üst/alt/yan dokusu normalden). Hücre sınırındaki bir yüz, komşusu tam opak küpse ya da aynı kimlikteki komşuyla uzama ekseninde örtüşüyorsa çizilmez. Şekiller `transparent` sayılır, böylece yanlarındaki küplerin yüzleri çizilir.
- **Simge:** Şekilli blokların simgesi şeklin modeli izometrik açıdan küçük bir hedefe çizilerek üretilir (`shapeIcon`); elde ve yerde de aynı model (`shapeMesh`) görünür.

### Dokular

- Tek satırlık atlas: `T = 16` piksel kare, `N_TILES = 192` doku yeri, atlas `3072 × 16` piksel. İlk 52 doku `textures.js`'te, sonrakiler `build-textures.js`'te `paintTile(ad, fn)` ile sıradaki yere çizilir (şu an ~150 dolu).
- `TILE` sırası: `grassTop, grassSide, dirt, stone, logSide, logTop, leaves, sand, planks, brick, cobble, craftingTop, craftingSide, furnaceFront, furnaceTop, sandstoneTop, sandstoneSide, furnaceLit, glass, coalOre, ironOre, water, torch, bedHeadTop, bedFootTop, bedSide, doorLower, doorUpper, tallGrass, poppy, dandelion, farmland, wheat0, wheat1, wheat2, wheat3, obsidian, netherrack, lava, glowstone, chestTop, chestSide, diamondOre, snowGrassTop, snowGrassSide, ice, cactusSide, cactusTop, spruceLog, spruceLeaves, netherBrick, spawner`.
- Yeni doku `build-textures.js`'te `paintTile` ile eklenir; 192 dolarsa `N_TILES` artırılır.
- Dokular `mulberry32(1337)` ile her açılışta aynı üretilir. Filtre `NearestFilter`, mipmap yok.

---

## Çizim

- **Chunk:** `16 × SY × 16` blokluk dilimler (`CH = 16`); her chunk iki mesh'tir: opak bloklar (`material`) ve saydam bloklar (`waterMaterial`: %60 opak, derinliğe yazmaz, opaklardan sonra çizilir). Bir yüz, komşusu hava ise ya da komşusu kendisinden farklı saydam bir blok ise çizilir (`faceVisible`); böylece su altındaki zemin görünür, su–su yüzleri çizilmez.
- **Yüz gölgesi:** Işık hesabı yok, köşe rengiyle sabit gölge: üst 1,0, doğu/batı 0,8, kuzey/güney 0,65, alt 0,5.
- **Malzeme:** `MeshBasicMaterial`, atlas dokusu + köşe renkleri. `withTorchLight()` shader'a bir ek yapar: her köşede `torchLight` niteliği (0–1) vardır ve son renk `doku × köşe rengi × max(uBrightness, torchLight × (1, 0,85, 0,6))` olur. `uBrightness` (`brightnessUniform`) gün döngüsünün parlaklığıdır; böylece meşale ışığı gece karartmasından etkilenmez.
- **Meşale ışığı:** Chunk kurulurken çevresindeki (±8 blok) meşaleler toplanır (`torchesNear`); her yüzün merkezinin en yakın meşaleye uzaklığına göre `torchLight = max(0, 1 − d / TORCH_RANGE)`, `TORCH_RANGE = 7.5`. Duvarlar ışığı kesmez. Meşale konunca ya da kaldırılınca ışığın ulaştığı bütün chunk'lar yeniden kurulur (`rebuildArea`).
- **Çapraz model:** `addCrossModel` bitkileri hücrenin köşegenlerinde iki düzlem olarak çizer; arka yüzler ayrı üçgenlerle. Doku saydam arka planlıdır (alphaTest ile kesilir).
- **Kutu modeli:** `addBoxModel` hücre içindeki bir kutuyu (kapı levhası) çizer; doku yüzün ekseninde hücre koordinatından okunur. Hücre kenarındaki bir yüz, komşusu opak katı bir bloksa çizilmez.
- **Cam:** Atlas dokusunda camın içi saydamdır; dünya malzemesindeki `alphaTest: 0.5` bu pikselleri keser. Cam `cutout` olduğu için opak mesh'te çizilir ama `transparent` sayıldığından arkasındaki yüzler çizilir; cam–cam yüzleri çizilmez.
- **Yatak modeli:** `addBedModel` yarım blok yüksekliğinde bir kutu çizer; iki yarı arasındaki yüz ve alt yüz çizilmez. Üst dokuların "yukarısı" her iki yarıda da baş tarafına döner (yastık baş hücresinin uzak kenarında).
- **Meşale modeli:** Tam blok değil; 2×10 piksellik çubuk (`addTorchModel`), dokunun ortadaki iki sütunu (alt kısım tahta, üst 3 satır alev). Yerdeki meşale dik durur; duvar meşalesi duvara yakın başlar ve dışa eğilir. Meşalenin kendi yüzleri her zaman tam aydınlıktır.
- **Yeniden kurma:** Blok değişince `rebuildAround(x, z)` o chunk'ı ve gerekiyorsa komşusunu yeniden kurar.
- **Gökyüzü:** Rengi gün döngüsüne göre değişir (aşağıda); sis aynı renktedir; uzak sınırı görüş mesafesi, yakın sınırı bunun 0,43 katı (sis kapalıyken 0,85 katı). Kameranın uzak düzlemi `max(300, görüş × 1,5)`.
- **İki geçişli çizim:** `renderer.autoClear = false`. Önce dünya sahnesi, sonra gözden görünümde derinlik temizlenip kol sahnesi (`fpScene`, `fpCam`) çizilir; böylece kol duvarın içine girmez.
- **Işıklar:** Dünya ışıksızdır. Oyuncu modeli ve kol için `HemisphereLight` (`HEMI_INTENSITY = 0.8`) + `DirectionalLight` (`SUN_INTENSITY = 0.5`), `addLights()` ile iki sahneye de eklenir ve `lightRigs` dizisinde tutulur.

### Shader modu

- Kontrol panelindeki "Shader modu" anahtarı (`setShaderMode`, `settings.shader`'a yazılır). Açılıp kapanınca bütün chunk'lar yeniden kurulur.
- **Malzeme:** Opak chunk mesh'i `MeshBasicMaterial` yerine `shadedMaterial` (`MeshLambertMaterial`) ile çizilir; köşe normalleri hesaplanır, renk gök (`HemisphereLight`) ve güneş (`DirectionalLight`) ışığından gelir. Meşale ışığı sıcak bir öz ışık olarak eklenir. Yüz gölgesi yerine köşe ortam gölgesi (`cornerAO`: yüzün önündeki iki yan ve bir köşe hücresi doluysa köşe 0,45–1 arasında kararır). Şekilli bloklar da düz renkle (`flat`) yazılır.
- **Gölge:** `lightRigs[0].sun` gölge düşürür (`PCFSoftShadowMap`, 2048 piksel, oyuncu çevresinde ±90 blok). Işık yönü güneşten (gece aydan, zayıf) gelir; yoğunluk ve renk her karede gün ışığına göre ayarlanır (`updateShaderMode`).
- **Gök:** Kameraya bağlı kubbe: ufuk rengi gökyüzü/sis rengiyle aynı, tepe gündüz koyu mavi, güneş çevresi parlar. **Su:** üst yüz dalgalanır, parıltı kıpırdar, daha koyu ve %78 opak.
- **Ton:** `ACESFilmicToneMapping` (pozlama 0,95), tuvale hafif doygunluk/kontrast (`canvas.shaded`) ve kenar kararması (`#vignette`).

### Bulutlar ve yıldızlar

- **Bulutlar:** `CLOUD_HEIGHT = 192`'de (yüksek yapıları kesmesin), oyuncuyla birlikte hareket eden 768×768 blokluk düz bir katman. Doku 64×64 pikseldir, her piksel 4×4 bloğa denk gelir; döşenebilir gürültüyle şekillenir ve dünyaya sabit kalacak şekilde kaydırılır, böylece katman dünyanın dışına da uzanır. Oyun oynanırken `CLOUD_SPEED = 0.6` blok/sn doğuya (+x) kayar. Sisten etkilenmez, %85 opaktır; rengi gece `0,3 + 0,7 × daylight` oranında grileşir. `settings.clouds` kapalıyken gizlenir (kontrol panelindeki "Bulutlar").
- **Yıldızlar:** 400 nokta (`THREE.Points`), kameraya bağlı 150 yarıçaplı kürenin üst yarısında; gün döngüsüyle döner, opaklığı `1 − daylight` (gündüz görünmez).

### Gün döngüsü

- Bir gün `DAY_LENGTH = 600` sn. `clock.time` 0–1 arasıdır ve yalnızca oyun oynanırken ilerler; 1'i geçince `clock.day` bir artar. Oyun `clock.time = 0.05` (07:12) ile başlar.

  | `clock.time` | Evre | Süre |
  | --- | --- | --- |
  | 0–0,5 | Gündüz | 5 dk |
  | 0,5–0,55 | Akşam geçişi (`DUSK`) | 30 sn |
  | 0,55–0,95 | Gece | 4 dk |
  | 0,95–1 | Şafak geçişi (`DAWN`) | 30 sn |

- **Saat:** `(6 + time × 24) mod 24`; 0 → 06:00, 0,25 → 12:00, 0,5 → 18:00, 0,75 → 00:00.
- **`daylight(t)`:** gündüz 1, gece 0, geçişlerde yumuşak (smoothstep).
- **Gökyüzü ve sis rengi:** gece `#0b1026` ile gündüz `#9cc8ef` arasında `daylight` oranında karışır; geçişlerin ortasında `#e8a36a` turuncusuna doğru %60'a kadar kayar.
- **Parlaklık:** `0.25 + 0.75 × daylight`. Blok malzemesinin rengi (`material.color`) ve iki sahnedeki ışık şiddetleri bu çarpanla ölçeklenir.
- **Güneş ve ay:** Sisten etkilenmeyen kare düzlemler (güneş 16, ay 11 birim), kameradan 150 blok uzakta ve her zaman kameraya dönük. Güneş `t = 0`'da doğuda (+x) doğar, 0,25'te tepede, 0,5'te batıda batar; ay tam karşısındadır.

---

## Oyuncu

### Fizik

| Sabit | Değer | Anlamı |
| --- | --- | --- |
| `W` | 0,3 | AABB yarı genişliği (blok) |
| `H` | 1,8 | Boy |
| `EYE` | 1,62 | Göz yüksekliği |
| `GRAVITY` | 26 | Yerçekimi (blok/sn²) |
| `JUMP` | 8,4 | Zıplama hızı (yaklaşık 1,3 blok) |
| Yürüme | 4,3 | blok/sn |
| Koşma | 6,2 | blok/sn |

- **Blok kutuları:** Her katı bloğun hücre içinde bir ya da daha çok çarpışma kutusu vardır (`blockBoxes(b, x, y, z)`): şekilli bloklarda `shapeBoxes` (eğim ve kemer 4 basamakla yaklaşık), `box` (kapı levhası), `height` (yatak 9/16) ya da tam hücre.
- **Basamak:** Yerdeki varlık yatayda en çok `STEP_HEIGHT = 0,6` yüksekliğinde bir kutuya çarparsa ve üstü boşsa onun üstüne çıkar (yarım blok, merdiven, eğim, yatak). `overlappingBoxes` varlığın kesiştiği kutuları bulur; `moveAxis` çarpışınca varlığı kutunun yüzüne dayar (yere iner, tavana değer, duvara yaslanır).
- Çarpışma eksen eksen yapılır (`moveAxis(e, axis, d)`): önce x, sonra z, sonra y. `stepEntity(e, dt)` adım 0,4 bloktan büyükse alt adımlara böler ve yatayda çarpıp çarpmadığını döndürür. Aynı kod canlılar için de kullanılır; her varlık `{ x, y, z, w, h, vx, vy, vz, onGround }` taşır (`w` yarı genişlik). Kare süresi 0 ile 0,05 sn arasına sıkıştırılır.
- **Su:** Oyuncunun kutusu suya (kaynak ya da akan, `isWater`) değiyorsa yürüme hızı %50, yerçekimi 1/4, batma hızı en çok `SINK_SPEED = 3`; Boşluk basılıyken `SWIM_UP_SPEED = 3` ile yukarı yüzer. Suya düşen düşme hasarı almaz. Kamera suyun içindeyse ekran mavi tonlanır (`#underwater`) ve sis 0–8 bloğa iner. Hayvanlar suya girmez; düşmanlar suya doğmaz.
- **Geri itilme:** `player.kx`, `player.kz` hıza eklenir ve her karede `e^(-6·dt)` ile söner.

### Can

- `player.health`, en fazla `MAX_HEALTH = 20`. HUD'da 10 kalp; her kalp 2 puan (dolu, yarım, boş). Kalpler 9×9 piksellik canvas görselleridir.
- `damagePlayer(amount, sourceX, sourceZ)`: canı düşürür, 0,5 sn hasarsızlık verir, ekran kenarını 0,2 sn kırmızı yakar. Kaynak verilirse oyuncuyu kaynaktan uzağa 4 blok/sn iter ve 6 blok/sn yukarı zıplatır; kaynak verilmezse (düşme gibi) itmez. Konsoldan test için `window.damagePlayer` olarak da açıktır.
- **Geri bildirim:** Hasar alınca kamera 0,2 sn yana yatar (en çok `HURT_ROLL = 0.1` rad, yön rastgele, giderek düzelir; önden görünüm hariç). Can `LOW_HEALTH = 4` ve altındayken ekran kenarı kararır (`#low-health`) ve kalpler 0,5 sn'de bir 0,1 sn boyunca ±2 piksel titrer.
- **Yenilenme:** Can 20'den azsa, açlık en az `REGEN_FOOD = 18` ise ve son 5 sn hasar alınmadıysa, oyun duraklatılmamışken her 4 sn'de 1 puan geri gelir.

### Tarım

- **Çapa** (`wooden_hoe`, `tool: 'hoe'`, dayanıklılık 60): üstü boş çimen ya da toprağa sağ tık onu tarlaya çevirir ve çapa 1 aşınır.
- **Ekme:** Elde buğday tohumu varken tarlanın üstüne sağ tık `wheat_0` eker.
- **Büyüme:** `crops` haritası (`"x,y,z"` → kalan sn) her olgunlaşmamış ekini tutar; her aşama `CROP_STAGE_TIME = 60` sn'nin 0,6–1,4 katı sürer ve yalnızca oyun oynanırken ilerler. Aşamalar dünya dizisinde durduğu için kayda girer; kayıt yüklenince `scanCrops()` sayaçları yeniden kurar.
- **Hasat:** Olgun buğday (`wheat_3`) kırılınca 1 buğday + 1–3 tohum, olgunlaşmamışsa 1 tohum düşer. Tarla kırılınca üstündeki ekin kalkar.
- **Ekmek:** 3 yatay buğday (çalışma masasında) → ekmek, açlığa 5.

### Portal

- **Çerçeve:** Dikey, iç boşluğu tam 2×3 olan obsidyen çerçeve (alt ve üst 2'şer, yanlar 3'er obsidyen; köşeler isteğe bağlı), x ya da z ekseninde.
- **Yakma:** Elde çakmak varken çerçevenin iç tabanındaki bir obsidyenin üstüne sağ tık: iç boşluk tamamen boşsa 6 portal bloğuyla dolar, çakmak 1 aşınır.
- **Görünüm:** Portal blokları kendi dokusuyla (32×32, mor dalgalar), yarı saydam ve çift yüzlü düzlemler olarak çizilir; doku her karede yukarı kayar. Gece karartmasından etkilenmez.
- **Sönme:** Çerçeveden bir obsidyen kırılınca bitişik portal blokları ve onlara bağlı bütün portal söner.
- **Geçiş:** Oyuncu portal bloğunun içinde `PORTAL_TIME = 3` sn kesintisiz kalırsa ekran mora dönüp kararır (`#portal-fx`), HUD'da geri sayım çıkar (`#portal-hud`) ve `travelThroughPortal()` (`nether.js`) çağrılır. Oyuncu portaldan çıkmadan tekrar tetiklenmez.

### Nether

- **Dünyalar:** `worlds = { overworld, nether }` iki ayrı chunk haritası; `world` etkin olanı gösterir ve bütün `get`/`set`/chunk kodu onu kullanır. `switchDimension(to)` dünyayı değiştirir; canlılar, yerdeki eşyalar, oklar ve parçacıklar silinir, chunk mesh'leri kaldırılıp oyuncunun çevresi yeniden kurulur, portal düzlemleri ve ekin sayaçları yenilenir. Ana dünyaya dönüşte hayvanlar yeniden doğar.
- **Üretim** (`generateNetherChunk(cx, cz)`, ana dünya gibi chunk chunk, gidilince): taban `3 + fbm·12`, tavan `35 + fbm·8` kızıl taş; arada 3B gürültüyle kızıl taş sütunlar; `y ≤ LAVA_LEVEL = 10` boşluklar lav; tavandan sarkan chunk başına 1–2 ışıltı taşı öbeği (chunk içinde kalır).
- **Işık:** Lav ve ışıltı taşı üçüncü chunk tamponunda, parlaklıktan etkilenmeyen `glowMaterial` ile çizilir. Işıltı taşı meşale gibi çevresini aydınlatır; lav yalnızca kendisi parlar.
- **Ortam:** Nether'de saat durur; gökyüzü ve sis `#3a0f0f`, sis 12–40 blok, parlaklık 0,6; güneş, ay, bulut ve yıldız gizlenir. Ana dünya canlıları Nether'de doğmaz.
- **Geçiş:** Girilen portalın iç tabanının sol hücresi `portalLinks[from]`'a yazılır. Hedef dünyada bağlı portal hâlâ duruyorsa oraya, yoksa aynı X/Z yakınında (16 blok içinde) 4×5 çerçevenin ve önünün sığdığı katı zeminli bir yere yeni yanık portal kurulur (`createPortalNear`); yer bulunamazsa yer açılır. Oyuncu portalın önüne konur, "Nether'e geçtin" / "Dünyaya döndün" yazısı çıkar ve oyun kaydedilir.
- **Lav:** Su gibi yüzülür (yavaş: hız 0,35 katı); içindeyken saniyede 4 hasar, çıkınca 3 sn daha saniyede 1 hasar (yanma). Lava düşen düşme hasarı almaz.
- **Yatak:** Nether'de kullanılırsa "Burada uyuyamazsın" yazar ve 6 hasar verir. Nether'de ölen ana dünyada doğar.
- **Fırınlar:** Anahtarı dünyaya göre ayrılır (`"overworld:x,y,z"`); her dünyada yalnızca o dünyanın fırınları çalışır.

### Kapı

- Elde kapı varken bir bloğun üstüne sağ tık: alt ve üst hücreye kapalı kapı konur (iki hücre de boş olmalı); kapı oyuncunun baktığı yöne kapanır (levha hücrenin o kenarında). Kapıya sağ tık iki yarıyı birlikte açar/kapar; açıkken levha sol kenara döner ve geçilir. Bir yarı kırılınca diğeri de kalkar. Canlılar kapı açamaz (yapay zekâ kapıyı duvar sayar).

### Yatak ve doğma noktası

- **Koyma:** Elde yatak varken sağ tık: ayak bakılan hücreye, baş oyuncunun baktığı ana eksende bir sonraki hücreye konur; iki hücre de boş, altları katı olmalı. Bir yarı kırılınca diğeri de kalkar.
- **Kullanma (sağ tık):** Doğma noktası (`spawnPoint`) yatağın yanındaki, ayak basılabilen ilk hücreye taşınır (yoksa yatağın üstü). Gündüz (`daylight ≥ 0,5`) "Sadece gece uyuyabilirsin", 8 blok içinde canlı bir düşman varsa "Yakınlarda canavar var" yazar. Aksi halde ekran `SLEEP_TIME = 2` sn kararır (`#sleep`), oyuncu hareket edemez; sonra saat 06:00 (`clock.time = 0`) olur, gün sayısı artar ve "Günaydın" yazar.
- `spawn()` önce `spawnPoint`'i kullanır; yoksa dünyanın ortası. Ölünce oraya doğulur. `spawnPoint` kayda yazılır.

### Açlık

- `player.food`, en fazla `MAX_FOOD = 20`. HUD'da can barının sağında 10 but (dolu, yarım, boş; 9×9 canvas).
- `hunger.timer` her saniye 1, koşarken (hareket ederek) 2 artar; `HUNGER_INTERVAL = 30`'a ulaşınca açlık 1 azalır.
- Açlık `SPRINT_FOOD = 6` ve altındaysa koşulamaz. Açlık 0 iken her `STARVE_INTERVAL = 4` sn'de 1 hasar; can 1'in altına inmez.
- **Yemek:** Seçili yuvada `food` değeri olan bir eşya varken sağ tuş `EAT_TIME = 1.6` sn basılı tutulursa 1 tane yenir, açlık `food` kadar artar (en çok 20), kol vurur. Yemek elindeyken sağ tık blok koymaz. Ölüp yeniden doğunca açlık 20 olur.

  | Eşya | `food` |
  | --- | --- |
  | Çiğ biftek, Çiğ domuz eti | 3 |
  | Çiğ tavuk, Çürük et | 2 |
  | Elma | 4 |
  | Ekmek | 5 |
  | Pişmiş biftek, Pişmiş domuz eti | 8 |
  | Pişmiş tavuk | 6 |

- **Elma:** Kırılan yaprak %5 olasılıkla elma düşürür.
- **Düşme hasarı:** Havadayken ulaşılan en yüksek y `player.fallPeak` içinde tutulur. Yere değince düşülen yükseklik 3,5 bloğu aşıyorsa `round(yükseklik - 3)` hasar verilir: 4 blok 1 can, 10 blok 7 can.
- **Ölüm:** Can 0 olunca ya da `y < -20` olunca `die()` çalışır: oyun durur, fare kilidi bırakılır, "Öldün!" paneli açılır (başlangıç paneli gizli kalır). "Yeniden doğ" oyuncuyu `spawn()` noktasında 20 canla başlatır.

### Kontroller

| Tuş | İş |
| --- | --- |
| W A S D | Yürü |
| Fare | Bak (fare kilidiyle). Kilit reddedilirse sol tuşla sürükleyerek bak. |
| Boşluk | Zıpla |
| W-W (300 ms içinde iki kez) | Koş. W bırakılınca ya da eğilince koşma biter. Koşarken görüş alanı 75° → 85°. Ctrl kullanılmaz (tarayıcıda Ctrl+W sekmeyi kapatır). |
| Shift (basılı) | Eğil: hız ×0,3 (`CROUCH_SPEED`), göz 0,3 blok alçalır (`CROUCH_DROP`, yumuşak geçiş), model 0,15 alçalır ve kollar öne gelir. Yerdeyken bir adım ayağın altını desteksiz bırakacaksa o eksendeki hareket durur (`supported`): blok kenarından düşülmez, kenarda sarkarak blok konabilir. |
| Boşluk-Boşluk (300 ms içinde) | Uçma izni açıkken (kontrol paneli) uçuşu açar/kapatır. Uçarken yerçekimi yok; boşluk yükseltir, Shift alçaltır (`FLY_VERTICAL = 7,5` blok/sn), yatay hız ×2,5 (`FLY_SPEED`; W-W ile koşarak daha hızlı). Yere değince uçuş biter. Uçma izni açıkken düşme hasarı yok. İzin kapatılınca uçuş hemen biter. |
| Sol tık (basılı tut) | Basınca bakılan canlıya vurur; basılı tutuldukça bakılan bloğu kazar (yedek modda 6 pikselden fazla sürüklemek bakıştır, kazmayı keser) |
| Sağ tık | Seçili yuvadaki bloğu koy; meşale bir bloğun üstüne dik, yan yüzüne eğik konur (tavana konmaz) (canlıların ya da oyuncunun içine konmaz); çalışma masasına bakılıyorsa 3×3 üretimi açar; elde yemek varsa basılı tutunca yer |
| 1–9 / tekerlek | Hotbar yuvası seç |
| E | Envanteri aç / kapat (Esc de kapatır) |
| Q | Seçili yığından 1 tanesini bakılan yöne at |
| V | Kamera: arkadan → gözden → önden |
| T | Sohbeti aç |
| / | Sohbeti "/" yazılı açar (komut) |
| Esc | Duraklat (fare kilidi bırakılınca panel açılır); sohbet, envanter (masa, fırın, sandık…) ya da kontrol paneli açıksa onu kapatır. Esc ile kapanan panelden sonra fare hemen kilitlenmez (tarayıcı aynı Esc basışıyla yeni kilidi bırakıp oyunu duraklatırdı): "Devam etmek için tıkla" bildirimi çıkar, ilk tık yalnızca fareyi kilitler (`relockPointer`, `resumeOnClick`). Bu sırada Esc oyunu duraklatır. E, K ya da düğmeyle kapatınca fare hemen kilitlenir. |

### Kamera

- **Arkadan (varsayılan), omuz üstü:** Kamera, gözün `SHOULDER_OFFSET = 0.6` blok sağında ve `SHOULDER_RISE = 0.25` blok üstündeki omuz noktasından bakış yönünün tersine `CAMERA_DISTANCE = 3.5` blok geride durur; karakter ekranın solunda kalır, nişangâh boştur. Omuz noktası ya da kamera bir bloğa 0,25'ten fazla yaklaşacaksa öne alınır (`cameraClearance`): engel gelince hemen yaklaşır, açılınca yumuşakça (≈0,2 sn) geri çekilir (`cameraDistance`). Kamera 0,8 bloktan yakına gelirse karakter modeli gizlenir. Nişan ışını kameradan başlar; blok menzili `6 + cameraDistance`, canlı menzili `cameraDistance + MOB_REACH`.
- **Gözden:** Göz hizasında, sağ altta oyuncunun kolu. Nişan ışını gözden başlar, menzil 6.
- **Önden:** Gözün 3,5 blok önünde (engelde yaklaşır), oyuncuya bakar. Artı işareti gizlenir; nişan ışını gözden başlar.

### Model

- Bloklu insan: 1 piksel = `P = 0.05625` blok, toplam 32 piksel = 1,8 blok. Baş 8×8×8, gövde 8×12×4, kollar ve bacaklar 4×12×4.
- Renkler: ten `#c99a76`, saç `#4a3222`, tişört `#40598e`, pantolon `#393f4f`, ayakkabı `#212121`.
- Animasyon: yürürken kollar ve bacaklar ters fazda sallanır, baş bakışla eğilir, kırma/koymada sağ kol vurur (0,25 sn).

---

## Canlılar

- `mobs` dizisindeki her canlı: konum, hız, geri itilme (`kx`, `kz`), `yaw`, `health`, kutu (`w`, `h`), yapay zekâ durumu (`walking`, `timer`) ve modeli (`body = { root, legs }`).
- Fizik oyuncuyla aynıdır (`stepEntity`). Canlılar yalnızca oyun oynanırken güncellenir, kaydedilmez: her açılışta dünya (ya da kayıt) yüklendikten sonra yeniden doğarlar.
- **Dolaşma:** 2–5 sn rastgele bir yöne yürür, 2–4 sn durur. Önündeki hücrede 1 blokluk basamak varsa zıplar; 2 blok duvar, dünya kenarı ya da 3 bloktan derin uçurum varsa döner.
- Hayvan sınırı `MAX_ANIMALS = 16` (`ANIMAL_KINDS` türlerinin toplamı).
- **Doğma:** Açılışta her türden 4'lük bir sürü (`spawnHerd`): ilk hayvan rastgele bir çimen sütununda, diğerleri onun 8 blok çevresindeki çimenlerde. Gündüz (`daylight ≥ 0,5`) ve sınırın altındaysa her 30 sn'de oyuncudan en az 24 blok uzaktaki bir çimene rastgele türden 1 hayvan doğar.
- **`slowFall`:** düşerken (`vy < 0`) yerçekimi 1/4'e iner.
- **Kazma:** Sol tuş basılıyken (`mining`) her karede bakılan bloğun ilerlemesi `dt / breakTime` kadar artar (`miningState`). Hedef blok değişir, bir canlıya bakılır ya da tuş bırakılırsa ilerleme sıfırlanır. İlerleme 1'e ulaşınca `breakBlockAt()`. Bu sırada bloğun üstünde 0,002 büyük bir kutu, 10 aşamalı koyu çatlak dokusunu gösterir (dokular kodla, ortadan dışa yürüyen rastgele piksellerle çizilir) ve kol sürekli vurur.
- **Vurma:** Sol tuşa basıldığı anda `raycast()` (bloğun giriş uzaklığı `t`) ve `rayMob()` (canlı kutularına slab testi, menzil `aim.start + MOB_REACH`, `MOB_REACH = 3.5`) karşılaştırılır; canlı daha yakınsa blok yerine canlı vurulur. İmleç bir canlının üstündeyken blok çerçevesi gizlenir.
- **`hurtMob(m, amount, dirX, dirZ)`:** elle vuruş `FIST_DAMAGE = 1`. 0,5 sn hasarsızlık, 0,3 sn kırmızı (`emissive`), vuruş yönünde 5 blok/sn geri itilme (yerdeyse 4 blok/sn hoplama), 4 sn boyunca oyuncudan 2 kat hızla kaçma (`flee`).
- **Ölüm:** Can 0 olunca `dying = 0.5`: canlı 0,5 sn'de yana 90° devrilir, kırmızı kalır, sonra `removeMob()` ile sahneden ve diziden silinir (geometri ve malzemeler serbest bırakılır).
- **Düşmanlar (`hostile`):** Her 10 sn'de, sınır `MAX_HOSTILES = 8` dolmadıysa oyuncudan 16–32 blok uzakta doğmaya çalışır (`trySpawnHostile`): gece yarı yarıya bir sütunun en üstüne (açık hava; yaprak ya da su üstü olmaz, `surfaceSpot`), aksi halde (gündüz her zaman) o sütundaki üstü kapalı, iki blok boş, altı katı bir mağara hücresine (`caveSpot`); bir meşaleye `TORCH_SAFE = 8` bloktan yakın yerde doğmaz (`torchNearby`). `CHASE_DISTANCE = 16` blok içinde oyuncuyu görürse (`canSeePlayer`: gözden göze 0,25 blok adımlı ışın) ona yürür. Görüş kesilse de `CHASE_MEMORY = 5` sn kovalamayı sürdürür (`memory`); sonra dolaşır. Oyuncudan `DESPAWN_DISTANCE = 64` bloktan uzaklaşan düşman silinir. Düşmanlar vurulunca kaçmaz.
- **Bacak animasyonu:** çapraz bacaklar (0 ile 3, 1 ile 2) birlikte sallanır; iki bacaklılarda 0 ileri, 1 geri.

| Tür (`kind`) | Ad | Can | Kutu (`w` × `h`) | Hız | Model | Doğma |
| --- | --- | --- | --- | --- | --- | --- |
| `cow` | İnek | 10 | 0,45 × 1,2 | 1,2 | Gövde 10×8×16, baş 8×8×6, boynuz, 4 bacak 4×10×4 (P birimi); kahverengi-beyaz lekeli | Sürü, 4 |
| `pig` | Domuz | 10 | 0,4 × 0,9 | 1,1 | Gövde 10×8×14, baş 8×8×8, burun 4×3×1, kısa bacaklar 4×6×4; pembe | Sürü, 4 |
| `chicken` | Tavuk | 4 | 0,25 × 0,8 | 1,0 | Gövde 6×6×8, kanatlar, baş 4×6×3, sarı gaga, kırmızı gıdı ve ibik, 2 sarı bacak; beyaz. `slowFall` | Sürü, 4 |
| `sheep` | Koyun | 8 | 0,45 × 1,1 | 1,1 | Yünlü gövde 10×9×14, gri yüz 6×6×7, bacaklar 4×8×4 | Sürü, 4 |
| `zombie` | Zombi | 20 | 0,3 × 1,8 | 2,3 | `buildHumanoid`: yeşil ten, mavi gömlek; kollar öne uzanık (1,45 rad), vururken savrulur | Gece düşmanlarının %25'i |
| `creeper` | Creeper | 20 | 0,3 × 1,5 | 2,0 | Gövde 8×12×4, baş 8×8×8 (üzgün yüz), 4 kısa bacak 4×6×4 (önde ve arkada); yeşil benekli. `explodes` | Gece düşmanlarının %15'i |
| `spider` | Örümcek | 16 | 0,7 × 0,9 | 2,6 | Karın 12×9×12, göğüs 6×6×6, baş 8×8×8 (4 kırmızı göz), iki yanda 4'er ince bacak 14×2×2 (dışa ve aşağı açılı, yürürken salınır); siyah-koyu gri. `climbs`, `leaps` | Gece düşmanlarının %20'si |
| `skeleton` | İskelet | 20 | 0,3 × 1,8 | 2,3 | `buildHumanoid(…, 2)`: kemik beyazı, kol ve bacaklar 2 piksel; sol elde kahverengi yay; nişan alırken iki kol öne (1,4 rad). `ranged` | Gece düşmanlarının %40'ı |
| `zombie_pigman` | Zombi domuz adam | 20 | 0,3 × 1,8 | 2,3 | `buildHumanoid`: pembe ten, yeşil saç ve gömlek, sağ elde altın kılıç. `neutral` | Nether, en çok 6 |
| `ghast` | Ghast | 10 | 2 × 4 | 1,5 | 64×64×64 beyaz küp (kapalı gözler, ağız), altında 3×3 sarkan dokunaç (4×18–34, sallanır). `flies` | Nether, en çok 2 |

**İskelet saldırısı:** Kovalarken oyuncuya döner; 8,5 bloktan uzaktaysa yaklaşır, 4 bloktan yakınsa geri geri çekilir, arada durur. Her `SKELETON_SHOT_INTERVAL = 2` sn'de bir ok atar; yalnızca oyuncuyu o an görüyorsa.

**Oklar:** `projectiles` dizisinde `{ x, y, z, vx, vy, vz, stuck, life, mesh }`. Hız `ARROW_SPEED = 20` blok/sn, yerçekimi `ARROW_GRAVITY = 6`; atış, uçuş süresine göre yerçekimini telafi edecek kadar yukarı nişan alır. Her karede 4 alt adımla ilerler. Oyuncunun kutusuna girerse `ARROW_DAMAGE = 3` hasar verir ve uçuş yönünde iter; bloğa değerse takılı kalır ve 3 sn sonra silinir. Model: kahverengi gövde, gri uç, beyaz tüy; `lookAt` ile uçuş yönüne döner. Oklar kaydedilmez.

**Patlama:** `blast(x, y, z, r, maxDamage)` ortak patlamadır (creeper ve ateş topu).

**Creeper:** Kovalarken oyuncuya `CREEPER_TRIGGER = 3` blok kalınca durur ve fitil (`fuse`) yanar: beyaz yanıp söner, 1,25 katına kadar şişer. Oyuncu `CREEPER_CANCEL = 5` bloktan uzaklaşırsa fitil sıfırlanır. `CREEPER_FUSE = 1.5` sn dolunca `explode()`: merkezin `EXPLOSION_RADIUS = 3` blok yarıçaplı küresindeki bütün bloklar silinir (`y = 0` hariç), etkilenen chunk'lar yeniden kurulur, oyuncuya `round(12 × (1 − uzaklık / 6))` hasar verilir ve creeper kaybolur.

**Zombi domuz adam:** `neutral`: vurulana kadar dolaşır, oyuncuyu kovalamaz. Vurulunca kendisi ve `PIGMAN_ANGER_RANGE = 16` blok içindeki bütün domuz adamlar `PIGMAN_ANGER_TIME = 30` sn kızgın olur (`angry`) ve zombi gibi saldırır (3 hasar). Ölünce 0–1 çürük et.

**Ghast:** Yerçekimsiz uçar (`updateGhast`, yürüme yapay zekâsı yerine): 4–8 sn'de bir ±12 blok yatay, ±4 blok dikey bir hedefe `GHAST_SPEED = 1,5` blok/sn süzülür, takılınca yeni hedef seçer. Oyuncuyu `GHAST_RANGE = 20` blok içinde görünce ona döner ve `GHAST_SHOT_INTERVAL = 3` sn'de bir ateş topu atar. 64 bloktan uzaklaşınca kaybolur.

**Ateş topu:** `projectiles` içinde `fireball: true`; turuncu küp (içinde sarı çekirdek), döner, yerçekimsiz `FIREBALL_SPEED = 8` blok/sn düz gider. Oyuncuya değerse `FIREBALL_DAMAGE = 5` hasar; bloğa değerse `blast()` ile yarıçap 1'lik küçük patlama. Oyuncu ateş topuna vurursa (nişan ışınında blok ve canlıdan önce geliyorsa) bakılan yöne 1,5 kat hızla geri döner (`reflected`); geri dönen top oyuncuya zarar vermez, değdiği canlıya 10 hasar verir (ghast'ı öldürür).

**Nether doğması:** Nether'de her 5 sn'de bir, oyuncudan 24–48 blok uzakta: domuz adam sınırın altındaysa kızıl taş üstünde 2 blok boş bir hücreye; ghast sınırın altındaysa %50 olasılıkla 5×5×5 tamamen boş havaya (lav seviyesinin üstünde). Gece/gündüz bağımsızdır. Hiçbir canlı lava yürümez.

**Ölüm dumanı:** Ölen canlı devrilme bittiğinde kaybolurken kutusundan 8 gri küp yükselir (0,8 blok/sn), 1 sn'de küçülerek kaybolur (`emitSmoke`, yanma parçacıklarıyla aynı `particles` dizisi; `smoke: true`).

**Gün ışığı:** Gündüz (`daylight ≥ 0,5`) `burns` türleri (zombi, iskelet) başlarının üstündeki sütunda hiç blok yoksa (`skyAbove`; yaprak da gölge sayılır) saniyede 1 hasar alır, her yanışta 0,3 sn kırmızılaşır ve üstlerinden turuncu-kırmızı-sarı küçük küpler (0,12 blok) yükselir (saniyede ~10, 0,6 sn ömür, 1,5 blok/sn yükselir ve küçülür). `passiveByDay` türü (örümcek) gündüz saldırmaz, hayvan gibi dolaşır. Creeper etkilenmez.

**Renk:** Canlının malzemelerinin `emissive` rengi `tint` ile yönetilir: vurulunca ya da ölürken kırmızı, fitil yanarken beyaz yanıp söner.

**Örümcek saldırısı:** Önündeki hücrede blok varsa dönmek yerine `SPIDER_CLIMB_SPEED = 2` blok/sn ile dikey tırmanır (tırmanırken yerçekimi yok). Oyuncuya `SPIDER_LEAP_RANGE = 3` blok kalınca ona doğru sıçrar (6 blok/sn yukarı ve ileri, 1,5 sn bekleme); sıçrayışın 0,8 sn'lik süresinde oyuncuya değerse `SPIDER_DAMAGE = 2` hasar verir.

**Zombi saldırısı:** Oyuncuya yatayda `ZOMBIE_REACH = 1.2` blok içinde ve dikeyde 1,5 bloktan yakınsa saniyede bir `ZOMBIE_DAMAGE = 3` hasar verir ve oyuncuyu geri iter (`damagePlayer`). 0,9 bloktan yakına girmez.

## Eşyalar

- **Anahtarlar:** Her eşyanın İngilizce bir anahtarı vardır. Blok eşyalarının anahtarı `B` sabitindeki adıyla aynıdır (`dirt`, `stone` …); `ITEMS[key] = { name, block }`. `BLOCK_ITEM[blokKimliği]` bloğun eşya anahtarını verir.
- **Blok olmayan eşyalar** (`ITEM_ART`): 8×8 piksellik desenden 16×16 canvas'a çizilir; `ITEMS[key] = { name, canvas }`.

  | Anahtar | Ad |
  | --- | --- |
  | `raw_beef` | Çiğ biftek |
  | `raw_pork` | Çiğ domuz eti |
  | `raw_chicken` | Çiğ tavuk |
  | `feather` | Tüy |
  | `wool` | Yün |
  | `rotten_flesh` | Çürük et |
  | `bone` | Kemik |
  | `arrow` | Ok; tarif kırık taş + çubuk + tüy (üst üste) → 4 |
  | `string` | İp; örümcekten 0–2 düşer |
  | `bow` | Yay; tarif `.SX` / `S.X` / `.SX` (S çubuk, X ip), dayanıklılık 385 |
  | `stick` | Çubuk |
  | `torch` | Meşale (konulabilir, bkz. Bloklar) |
  | `coal` | Kömür (kömür cevherinden) |
  | `apple` | Elma |
  | `bed` | Yatak (konulabilir) |
  | `door` | Kapı (konulabilir) |
  | `diamond` | Elmas; elmas cevherinden (demir ya da elmas kazmayla) düşer |
  | `flint_and_steel` | Çakmak (dayanıklılık 64, yığılmaz) |
  | `obsidian` | Obsidyen |
  | `netherrack`, `glowstone` | Kızıl taş, ışıltı taşı (konulabilir) |
  | `glowstone_dust` | Işıltı tozu; 2×2 toz → 1 ışıltı taşı |
  | `wheat_seeds` | Buğday tohumu (uzun ottan) |
  | `wheat` | Buğday |
  | `bread` | Ekmek |
  | `wooden_hoe` | Tahta çapa (alet) |
  | `cooked_beef` | Pişmiş biftek |
  | `cooked_pork` | Pişmiş domuz eti |
  | `cooked_chicken` | Pişmiş tavuk |
  | `charcoal` | Odun kömürü |
  | `iron_ingot` | Demir külçe |

- **Simgeler (Minecraft üslubu):** `itemIcon(key)` HUD için data URL üretir. Bloklar izometrik küp olarak çizilir (`blockIcon`: atlas dokularından üst, sol ve sağ yüz; yanlar gölgeli). Diğer eşyalar 16×16'dır ve `outlineIcon` ile koyu kenar alır; aletler `drawTool(kind, head, dark)` ile çapraz sap ve türüne göre baş olarak çizilir.
- **Görünüm:** Hotbar, envanter, üretim ve fırın Minecraft gibidir (bkz. AGENTS.md "Görsel"): gri kabartmalı panel, çukur yuvalar, piksel yazı tipi (`--mc-font`). Yuvanın üzerine gelince eşya adı `#tooltip` ipucu kutusunda görünür (`dataset.name`).
- **Düşme:** Kırılan blok kendisini düşürür; yaprak yalnızca %10 olasılıkla. Ölen canlı devrilme bittikten sonra `MOB_DROPS` tablosuna göre düşürür: inek 1–3 çiğ biftek, domuz 1–3 çiğ domuz eti, tavuk 1 çiğ tavuk + 0–2 tüy, koyun 1 yün, zombi 0–2 çürük et, iskelet 0–2 kemik + 0–2 ok, zombi domuz adam 0–1 çürük et. Creeper patlayınca bir şey düşmez.
- **Yerdeki eşya** (`drops`): `{ key, x, y, z, w: 0.125, h: 0.25, vx, vy, vz, age, mesh }`. Bloklar 0,25'lik küp (atlas dokusuyla, gece kararır), diğerleri yarım blok boyunda 3B eşya modeli (`itemGeometry`, elde tutulanla aynı; geometri eşya başına önbelleklidir, atılmaz). Hafif bir sıçrayışla düşer, yerde sürtünmeyle durur, döner ve hafifçe inip kalkar. `ITEM_LIFETIME = 300` sn sonra kaybolur. Kaydedilmez.
- **Toplama:** Oyuncunun gövde merkezine `PICKUP_RANGE = 1.5` bloktan yakınsa ona doğru 6 blok/sn çekilir, 0,6 bloktan yakında envantere eklenir (`addItem`) ve "+1 Ad" bildirimi çıkar. Envantere sığmazsa yerde kalır. `pickupDelay` dolmadan toplanmaz (Q ile atılan ya da envanter kapanınca sığmayan eşyalar için 1,5 sn).

## Envanter

- `inventory`: 36 yuva; 0–8 hotbar, 9–35 çanta. Yuva `{ key, count }` ya da `null`. Yığın sınırı `maxStack(key)`: aletler ve dayanıklılığı olan eşyalar (çakmak) 1, diğerleri 64.
- Yeni oyuncu boş envanterle başlar; blok koymak için önce kazmak gerekir.
- **`addItem(key, count)`:** önce aynı türdeki dolmamış yuvalara, sonra ilk boş yuvaya koyar (hotbar önce); sığmayan adedi döndürür.
- **Blok koyma:** seçili yuvada blok eşyası varsa konur ve adet 1 azalır; 0 olunca yuva boşalır.
- **Envanter paneli (E):** Fare kilidi bırakılır ama oyun durmaz (dünya, canlılar ve zaman işler); oyuncu yürümez, dünyaya tıklanamaz. Sol tık: boş elde yığını alır; elde yığın varken boş yuvaya bırakır, aynı türse sığdığı kadar birleştirir, farklı türse yer değiştirir. Sağ tık: boş elde yığının yarısını (yukarı yuvarlayarak) alır; elde yığın varken boş ya da aynı türdeki yuvaya 1 tane bırakır. Kapanınca eldeki yığın envantere döner, sığmayan yere atılır; fare yeniden kilitlenir.
- **Q:** seçili yığından 1 tanesini bakış yönünde 5 blok/sn fırlatır.

## Fırın

- Fırına sağ tıklayınca envanter paneli "Fırın" başlığıyla açılır; üretim bölümü yerine fırın bölümü görünür. Her fırının durumu `furnaces["x,y,z"] = { x, y, z, slots: [girdi, yakıt, çıktı], burn, burnMax, progress }`; ilk açılışta oluşturulur.
- Girdi ve yakıt yuvalarına envanter gibi tıklanır; çıktıdan yalnızca alınır.
- **Pişirme** (`SMELT_TIME = 5` sn her eşya): çiğ biftek → pişmiş biftek, çiğ domuz eti → pişmiş domuz eti, çiğ tavuk → pişmiş tavuk, kum → cam, kırık taş → taş, kütük → odun kömürü, demir cevheri → demir külçe.
- **Yakıt** (`FUEL`, kaç eşya pişirir): kömür ve odun kömürü 8, kütük ve tahta 1,5. Yanma bitince ve pişecek bir şey varsa yeni yakıt tüketilir; yanma süresi `FUEL × 5` sn.
- Fırınlar oyun oynanırken her karede güncellenir (panel kapalıyken de). Yanarken blok `furnace_lit` olur (ağzında alev dokusu), sönünce `furnace`'a döner.
- Fırın kırılınca içindekiler yere düşer. Bütün fırınlar kayda yazılır.

## Sandık

- Tarif: 8 tahta, ortası boş halka (`PPP / P.P / PPP`). Sağ tıklayınca envanter paneli "Sandık" başlığıyla açılır; üretim bölümü yerine 27 yuvalı sandık ızgarası (`#chest-ui`) görünür. Yuvalar envanterle aynı tıklama kurallarını (`clickIn`) kullanır.
- Durum: `chests["dünya:x,y,z"] = { dim, x, y, z, slots[27] }` (anahtar fırınlarla aynı, `furnaceKey`); ilk açılışta oluşturulur.
- Sandık kırılınca içindekiler (aletlerin dayanıklılığı korunarak) yere saçılır, sandığın kendisi de düşer. Bütün sandıklar kayda yazılır.

## Akan sıvılar ve kova

- Sıvı yardımcıları (`blocks.js`): `liquidOf(b)` (`'water'`, `'lava'` ya da `null`), `liquidBlock(tür, seviye)`, `isWater`, `isLava`. Seviye 0 kaynak, 1–7 akan.
- **Akış** (`fluids.js`): Her tür için bir kuyruk (`fluidQueues`); bütün dünya taranmaz. `set()` her çağrıldığında (`onBlockSet`, dünya üretiminden sonra bağlanır) hücre ya da komşusu sıvıysa hücre ve 6 komşusu kuyruğa girer. Su her 0,25 sn'de, lav her 1,5 sn'de bir adım ilerler (adım başına en çok 4000 hücre); önce bütün hücrelerin yeni hali hesaplanır, sonra yazılır.
- Bir hücrenin olması gereken hali (`desiredLiquid`): kaynak kalır; üstünde aynı sıvı varsa seviye 1 (aşağı akış); değilse yandaki aynı sıvılardan, altı dolu olanların (aşağı akamayan) en düşük seviyesi + 1, en çok 7 (lav ana dünyada 3); yoksa hava (kaynağı kesilen akış sırayla çekilir). İki su kaynağına komşu, altı katı ya da su olan hücre yeni su kaynağı olur. Akış havaya ve bitkilere (`replaceable`) girer.
- Su ile lav değince (`quench`): lav kaynağı obsidyen, akan lav kırık taş olur.
- **Çizim:** Akan sıvının üst yüzü `1 − seviye / 8` yükseklikte (üstünde aynı sıvı varsa tam). Aynı sıvının komşusuna yüz çizilmez; yalnızca komşu daha alçaksa yan yüz görünür. Değişen hücrelerin chunk'ları (kenardaysa komşu chunk da) kirli işaretlenir; karede en çok 2 chunk yeniden kurulur.
- Kuyruk kaydedilmez; dünya değişince (portal) boşalır. Yarıda kalmış akış sayfa yenilenince olduğu gibi durur.
- **Kova:** Tarif `I.I` / `.I.` (demir külçe), 16'ya kadar yığılır (`maxStack`). Boş kovayla sağ tık bakış ışınındaki ilk sıvı kaynağını alır (araya katı blok girerse almaz) → su kovası / lav kovası (yığılmaz). Dolu kovayla sağ tık bakılan yüzün önüne (hava, bitki ya da akan sıvıysa) kaynak koyar ve kova boşalır. Nether'de su konamaz: "Su buharlaştı".

## Köyler ve ticaret

- **Üretim** (`structures.js`): Dünya 6×6 chunk'lık bölgelere ayrılır; her bölgenin köy planı tohumdan belirlenir (`villagePlan(rx, rz)`, önbellekli). Merkez, bölgenin iç 4×4 chunk'ından birinin ortasıdır; merkez ova ya da ormandaysa ve yüksekliği 16–29 arasındaysa köy vardır (~3 bölgede 1). Bir chunk üretilirken planın o chunk'a düşen kısmı çizilir (`placeVillageParts`, chunk sınırında kırpılır): köy hangi sırayla üretilirse üretilsin aynı çıkar.
  - Kuyu: merkezde 4×4 kırık taş kenar, ortada 2×2 ve 2 derin su, köşelerde kütük direkler, üstte kırık taş çatı.
  - 3–5 ev: merkezden 10–11 blok uzakta, 8 yönden rastgele seçilenlerde. 5×5 taban: kırık taş temel ve zemin (arazi alçaksa temel aşağı uzar, yüksekse üstü boşaltılır), köşelerde kütük, tahta duvarlar (3 blok), tahta çatı, kapının yanındaki iki duvarda cam pencere. Kapı kuyuya bakan duvarın ortasında ve açıktır (köylüler kapı açamaz); içeride bir meşale.
  - Yollar: kuyudan her evin kapısının önüne, önce x sonra z boyunca; çimen toprağa döner, üstündeki bitki kalkar.
  - `villageNear(x, z, r)`: r bölge çevresindeki en yakın köy.
- **Köylü** (`villages.js`, `MOB_TYPES.villager`): can 20, hız 1; kahverengi cüppeli insan modeli, büyük burun. Köy 64 bloktan yakına gelince (köyün chunk'ları yüklüyse) her eve bir köylü doğar; bir oturumda bir kez (canlılar kaydedilmez).
  - Gündüz köyde dolaşır; köy merkezinden 14 bloktan uzaklaşınca merkeze döner. Gece önce kapısının önüne, sonra evin ortasına yürür (`steerVillager`). Vurulunca hayvan gibi kaçar.
  - Zombi, 16 blok içindeki bir köylü oyuncudan yakınsa köylüye yürür ve vurur (`villagerTarget`, 3 hasar). Güvenli modda saldırmaz.
- **Zümrüt** (`emerald`): yalnızca ticaretle elde edilir.
- **Ticaret:** Köylüye sağ tıklamak (elde ne olursa olsun, arada blok yoksa) envanter panelini "Köylü" başlığıyla açar; üretim bölümü yerine 3 teklif satırı (`#trade-ui`): bedel → ürün yuvaları ve "Takas et" düğmesi. Bedel yetmiyorsa düğme soluk görünür ve basınca "Yeterli … yok" bildirimi çıkar. Ürün envantere (sığmazsa yere) gelir; aletler tam dayanıklılıkla.
  - Teklif tablosu (`TRADES`): 20 buğday → 1 zümrüt, 15 kömür → 1 zümrüt, 1 zümrüt → 3 ekmek, 1 zümrüt → 8 ok, 3 zümrüt → demir kazma, 5 zümrüt → demir göğüslük.
  - Her köylünün 3 teklifi köy ve ev numarasından belirlenir; bu yüzden kayda yazılmadan da her açılışta aynıdır. Çağrılmış (köysüz) köylünün teklifleri ilk ticarette rastgele seçilir.

## Nether kalesi ve blaze

- **Üretim** (`structures.js`): Nether 12×12 chunk'lık bölgelere ayrılır, her bölgede bir kale (`fortressPlan(rx, rz)`); merkez bölgenin iç 6×6 chunk'ından birinin ortası. Nether chunk'ı üretilirken kalenin o chunk'a düşen kısmı çizilir (`placeFortressParts`).
  - Köprüler: tabanı `FORTRESS_DECK = 22` yüksekliğinde, 2 kat nether tuğlası; ortada 5×5 kavşak, dört yöne 18–29 blok, 5 blok genişliğinde; kenarlarda 1 blok korkuluk; üstü 4 blok boşaltılır. Her 6 blokta kenarlardan kızıl taşa kadar inen ayaklar.
  - Odalar: 2–3 köprünün ucunda 7×7, 4 blok yüksek, tavanlı nether tuğlası oda; köprüye bakan duvarda 3 genişliğinde giriş. İlk odanın ortasında blaze doğurucu.
  - `fortressNear(x, z)`: o noktanın bölgesindeki kale.
- **Blaze doğurucu** (`spawner`): demir çubuklu kafes, içinde dönen küçük bir blaze modeli (`spawnerModels`). Oyuncu 16 blok içindeyken her 10 sn'de bir, çevresindeki 8 blokta 4'ten az blaze varsa 1 blaze doğurur. Kırılabilir (kazma, 25 sn), bir şey düşürmez; kırılınca doğurma biter.
- **Blaze** (`blaze.js`, `MOB_TYPES.blaze`): can 20; sarı-turuncu baş, çevresinde iki halka hâlinde zıt yönlere dönen 8 çubuk. Yerçekimsiz süzülür; oyuncuyu 16 blok içinde görünce ona döner, 6 bloktan uzaksa yaklaşır ve oyuncunun 3 blok üstünde durmaya çalışır. 3 sn'de bir 0,3 sn arayla 3 küçük ateş topu atar. Yalnızca vurularak (ve geri çevrilen ateş topuyla) hasar alır; güneşte yanmaz. Güvenli modda atmaz.
- **Küçük ateş topu** (`small`): ghast ateş topundan hızlı ve yarı boyda; oyuncuya değerse 5 hasar ve 3 sn yanma (saniyede 1, `burnTimer`); bloğa değince patlamaz. Geri çevrilebilir.
- Blaze ölünce 0–1 **blaze çubuğu** düşürür (şimdilik başka kullanımı yok).
- Kale merkezine 64 bloktan yakınken her 15 sn'de bir, köprülerin üstüne (oyuncudan 12+ blok uzağa) bir zombi domuz adam doğar (toplam sınır `MAX_PIGMEN`).

## Yay ve ok

- Yay seçiliyken sağ tuşa basıp basılı tutunca gerilir (her yeni basış en çok bir ok atar: `bowArmed`) (`bowCharge`, 1 sn'de 0 → 1; blok konmaz). Gerilirken görüş alanı 10°'ye kadar daralır, gözden görünümde kol geri çekilir, 3. şahısta iki kol bakış yönünde öne uzanır.
- Bırakınca (gerilme > 0,1) envanterde ok varsa bir ok atılır, yay 1 aşınır; ok yoksa "Okun yok". Hız `10 + 20 × gerilme` blok/sn, yerçekimi 20; gözden bakış yönünde çıkar.
- Oyuncu oku (`fromPlayer`) canlıya değerse hıza göre 2–9 hasar ve geri itme verir (`arrowDamage`), oyuncuya değmez. Bloğa saplanınca 60 sn kalır; oyuncu 1,3 blok yakınına gelince envantere geri alınır ("+1 Ok").
- İskelet okları aynı kodla uçar (yerçekimi 6, 3 hasar, 3 sn saplı, toplanamaz).

## Zırh

- Demir ve elmas; 4 parça (`ARMOR_PIECES`): kask, göğüslük, pantolon, bot. Anahtar `<seviye>_<parça>` (`iron_helmet`, `diamond_boots` …). Simgeler 8×8 desenden (`pixelArt`).

  | Parça | Tarif (M: demir külçe ya da elmas) | Puan (demir / elmas) |
  | --- | --- | --- |
  | Kask | `MMM` / `M.M` | 2 / 3 |
  | Göğüslük | `M.M` / `MMM` / `MMM` | 6 / 8 |
  | Pantolon | `MMM` / `M.M` / `M.M` | 5 / 6 |
  | Bot | `M.M` / `M.M` | 2 / 3 |

- Dayanıklılık: demir 165, elmas 363. Her hasarda (kaynağı olsun olmasın) giyili her parçanın dayanıklılığı 1 azalır; biten parça "… kırıldı" bildirimiyle kaybolur.
- **Azaltma:** Kaynağı olan hasar (`damagePlayer(amount, x, z)`: canlı, ok, ateş topu, patlama) `max(1, round(hasar × (1 − puan × 0,04)))` olur; düşme, lav, açlık, yatak hasarı azalmaz (`armorReduce`).
- **Yuvalar:** Oyuncu envanterinde (çalışma masasında değil) üretim ızgarasının solunda 4 dikey yuva (`#armor-ui`). Zırh yalnızca kendi yuvasına konur (`clickArmor`); yuvalar envanterle aynı tıklama kurallarını kullanır.
- **HUD:** Kalplerin üstünde 10 zırh simgesi (`#armor-bar`, her biri 2 puan, yarım simge olabilir); zırh yokken gizli. Bildirim yazısı (`#blockname`) zırh satırının üstündedir.
- **Model:** Her parça ilgili vücut kutusundan 1 piksel büyük renkli kutu (demir açık gri, elmas turkuaz): kask başta (ön yüzü açık, yüz görünür), göğüslük gövde ve kollarda, pantolon bacakların üst 9 pikselinde, bot alt 3 pikselinde.
- Kayda yazılır (`armor`); ölünce zırh kalır.

## Aletler

- 4 seviye × 4 tür = 16 alet; anahtar `<seviye>_<tür>`: `wooden_pickaxe`, `stone_sword` … Adlar Türkçe: "Tahta kazma", "Taş kılıç" vb. `ITEMS[key]` alanları: `tool` (tür), `speed`, `durability` (en yüksek), `damage`, `canvas` (8×8 desenden simge).

  | Seviye | `tier` | Malzeme | `speed` | `durability` |
  | --- | --- | --- | --- | --- |
  | `wooden` (Tahta) | 1 | tahta | ×2 | 60 |
  | `stone` (Taş) | 2 | kırık taş | ×4 | 132 |
  | `iron` (Demir) | 3 | demir külçe | ×6 | 251 |
  | `diamond` (Elmas) | 4 | elmas | ×8 | 1562 |

  Bir bloğun `minTier` değeri varsa, düşmesi için kazmanın `tier` değeri en az o kadar olmalıdır.

  | Tür | Hızlandırdığı bloklar | Hasar (tahta / taş / demir / elmas) | Tarif (M malzeme, S çubuk) |
  | --- | --- | --- | --- |
  | `pickaxe` (kazma) | taş grubu, kumtaşı; taş grubu yalnızca kazmayla düşer | 2 / 3 / 4 / 5 | `MMM` / `.S.` / `.S.` |
  | `axe` (balta) | kütük, tahta, çalışma masası, sandık | 3 / 3 / 5 / 6 | `MM` / `MS` / `.S` |
  | `shovel` (kürek) | toprak, çimen, kum | 2 / 2 / 3 / 4 | `M` / `S` / `S` |
  | `sword` (kılıç) | — | 4 / 5 / 6 / 7 | `M` / `M` / `S` |

- Elle vuruş `FIST_DAMAGE = 1`; seçili yuvada alet varsa onun `damage` değeri kullanılır.
- **Dayanıklılık:** Alet yığını `{ key, count: 1, durability }` taşır. Her blok kırışta ve her canlıya vuruşta 1 azalır; 0 olunca alet kaybolur ve "… kırıldı" bildirimi çıkar. Aşınmış aletin yuvasında altta yeşilden kırmızıya giden bir çubuk görünür. Yığınlar taşınırken, atılırken (`drop.extra`) ve kaydedilirken `durability` korunur (`extraOf`).
- **Elde görünüm:** Seçili yuvadaki her eşya elde görünür: gözden görünümde kolun ucunda, 3. şahıs modelde sağ elde. Küp bloklar gerçek dokularıyla küçük bir küp (`fpBlock` 0,3, `tpBlock` 0,25 blok); alet, yemek, meşale, bitki gibi diğerleri Minecraft'taki gibi kabartmalı 3B model (`itemGeometry`: simgenin her dolu pikseli 1 piksel kalınlığında küp, yanlar gölgeli; simgesi olmayan bitkiler kendi dokusuyla). Boyut: gözden 0,65, 3. şahısta 0,8 blok; model sapı (simgenin sol alt köşesi) elde kalacak biçimde konur. 3. şahısta eşya yassı yüzü yana bakacak, ucu öne ve biraz yukarı dönük tutulur; elinde eşya varken sağ kol 0,35 rad önde durur.

## Üretim

- Envanter panelinde 2×2, çalışma masasına sağ tıklanınca 3×3 üretim ızgarası (`openInventory(size)`). `craftGrid` her zaman 9 hücrelik dizidir (indeks `satır × 3 + sütun`); 2×2'de yalnızca sol üst dört hücre görünür ve kullanılır.
- Izgara hücrelerine envanterdeki gibi tıklanır (`clickIn`). **Sonuç yuvası:** elde ürün yoksa ya da aynı üründen yığına sığacak kadar yer varsa ürün ele gelir ve ızgaradaki her dolu hücre 1 azalır.
- Panel kapanınca ızgaradakiler ve eldeki yığın envantere döner; sığmayan oyuncunun önüne atılır (`giveOrDrop`).
- **Tarifler** (`RECIPES`, şekilli; dolu hücrelerin sınır kutusu desenle birebir eşleşmeli, ızgarada kaydırılabilir, aynalanmaz):

  | Desen | Malzeme | Ürün |
  | --- | --- | --- |
  | `L` | kütük | 4 tahta |
  | `P` / `P` (dikey) | tahta | 4 çubuk |
  | `PP` / `PP` | tahta | çalışma masası |
  | `C` / `S` | kömür ya da odun kömürü üstte, çubuk altta | 4 meşale |
  | `CCC` / `C.C` / `CCC` | kırık taş | fırın |
  | `SS` / `SS` | kum | kumtaşı |
  | `WWW` / `PPP` | yün üstte, tahta altta | yatak |
  | `PP` / `PP` / `PP` | tahta | 3 kapı |
  | `PP` / `.S` / `.S` | tahta + çubuk | tahta çapa |
  | `WWW` | buğday | ekmek |
  | `IC` ya da `I` / `C` | demir külçe + kömür | çakmak |
  | (Aletler tablosu) | tahta ya da kırık taş + çubuk | 8 alet |

## Kırılma parçacıkları

- Blok kırılınca 12, kazarken 0,2 sn'de bir 2 parça (`spawnDebris`). Parça 0,1 blokluk bir küptür ve bloğun yan dokusundan rastgele 4×4 piksellik bir kesit taşır (gece kararır).
- Rastgele hızla saçılır, yerçekimiyle düşer, katı bir bloğa değince yerde kalır, son 0,3 sn'de küçülür ve `DEBRIS_LIFE = 0.8` sn'de kaybolur. Aynı anda en çok `MAX_DEBRIS = 200` parça; fazlası en eskiden silinir.

## Ayarlar

- Duraklatma menüsündeki "Ayarlar" düğmesi ayar görünümünü açar. Her değişiklik hemen uygulanır ve kaydedilir.

  | Ayar (`settings.`) | Denetim | Varsayılan | Etkisi |
  | --- | --- | --- | --- |
  | `sensitivity` | kaydırıcı 0,001–0,006 (yüzde olarak gösterilir) | 0,0025 (%100) | Fare hareketinin bakışa çarpanı |
  | `fov` | kaydırıcı 60–100 | 75 | Kamera görüş alanı; koşarken +10 |
  | `viewDistance` | `short` / `normal` / `far` / `ultra` | `normal` | Sisin uzak sınırı 40 / 70 / 120 / 200 blok, yakın sınırı bunun 0,43 katı |
  | `fog` | kontrol paneli "Sis" | açık | Kapalıyken sis görüş mesafesinin 0,85 katında başlar (uzaklar net) |
  | `clouds` | kontrol paneli "Bulutlar" | açık | Bulut katmanı |
  | `shader` | kontrol paneli "Shader modu" | kapalı | Gerçekçi çizim (aşağıda "Shader modu") |
  | `sound` | onay kutusu | açık | Ses açık/kapalı |
  | `invertY` | onay kutusu | kapalı | Fareyi yukarı itince aşağı bakılır |
  | `guide` | onay kutusu | açık | Rehber kartı (H ve kontrol panelindeki anahtarla aynı ayar) |

- Ayarlar dünya kaydından ayrı, aynı IndexedDB deposunda `settings` anahtarıyla saklanır; "Yeni dünya" bunları silmez. Bilinmeyen alanlar yok sayılır, eksik alanlar varsayılanda kalır.

## Ses

- Tek `AudioContext`, ilk "Oyna" tıklamasında açılır (`initAudio`). Bütün sesler kodla üretilir; dosya yok.
- **Gürültü sesleri** (`playNoise`: beyaz gürültü → filtre → zarf): blok kırılınca (`break`), kazarken 0,25 sn'de bir (`dig`), koyunca (`place`), yürürken adım (`step`, 0,4 sn'de bir, koşarken 0,3; yalnızca yerde ve suyun dışında), hasar (`hurt`). Filtre frekansı bloğun malzemesine göre değişir (`blockMaterialFreq`): toprak 700 Hz, ahşap 1100, taş 2600, yaprak ve bitki 4200, cam 5200.
- **Ton sesleri** (`playTone`: osilatör, frekans kayması, isteğe bağlı vibrato ve alçak geçiren filtre): eşya toplama (`pop`), canlılar (`MOB_SOUNDS`): inek alçak "mö", domuz kısa hırıltı, tavuk tiz "gıt", koyun titreşimli "mee", zombi inleme.
- **Canlı sesleri:** her canlı 5–12 sn arayla; oyuncuya `SOUND_RANGE = 16` bloktan yakınsa çalar, ses seviyesi uzaklıkla doğrusal azalır.
- **Aç/kapat:** Ayarlardaki "Ses" kutusu (`setSound`).
- `soundLog`: son 50 sesin adı ve şiddeti (ses kapalıyken de tutulur; testler için).

## Sohbet ve komutlar

- T sohbeti, `/` sohbeti `/` yazılı açar; Enter gönderir, Esc kapatır. Sohbet açıkken fare kilidi bırakılır ama oyun durmaz; oyuncu yürümez, dünyaya tıklanamaz, oyun tuşları çalışmaz.
- Satırlar sol altta, yarı saydam siyah zeminde piksel yazıyla görünür ve `CHAT_FADE = 10` sn sonra solar; sohbet açıkken hepsi görünür. En çok 50 satır. Renkler Minecraft gibi: oyuncu mesajı beyaz (`<Oyuncu> …`), sistem sarı, hata kırmızı.
- Eşya ve canlı adları İngilizce anahtar (`stone_pickaxe`) ya da Türkçe ad (`Taş kazma`, `taş_kazma`) olarak yazılabilir; büyük/küçük harf ve alt çizgi fark etmez. Dünyada gizli bloklar verilemez.

| Komut | İş |
| --- | --- |
| `/help` | Komutları listeler |
| `/give <eşya> [adet]` | Eşya verir (aletler tam dayanıklılıkla) |
| `/give` | Eşya seçiciyi açar (aşağıda) |
| `/god` | Ölümsüzlük aç/kapat: `damagePlayer` etkisiz, açlık azalmaz |
| `/safe on\|off` | Güvenli mod (aşağıda); `/safe` tek başına durumu yazar |
| `/heal`, `/feed` | Canı / açlığı doldurur |
| `/time set day\|noon\|night\|midnight\|0–23` | Saati değiştirir (Türkçe: gündüz, öğle, gece, gece yarısı) |
| `/tp <x> <y> <z>` | Işınlar; `~` göreli (`~ ~5 ~`) |
| `/clear` | Envanteri boşaltır |
| `/summon <canlı>` | Bakılan yönde 3 blok öne canlı çağırır |
| `/spawnpoint` | Doğma noktasını buraya taşır |

- Komut sohbet kapanmadan önce çalışır; komut bir panel açtıysa sohbet kapanırken fare kilitlenmez.

### Güvenli mod

- Küçük çocuklar için: açıkken (`safeMode`) düşman canlılar dünyada durur ve dolaşır ama kovalamaz ve saldırmaz (`aggressive` her zaman yanlış): zombi ve örümcek vurmaz, iskelet ok atmaz, creeper patlamaz, domuz adamlar kızmaz, ghast ateş topu atmaz.
- Kayda yazılır (`safeMode`). Açıkken ana menüde "Güvenli mod açık" notu (`#safe-note`) görünür.

### Eşya seçici

- `/give` adsız yazılınca envanter paneli "Eşyalar" başlığıyla açılır; üretim bölümü yerine `#picker-ui` görünür: arama kutusu (`#picker-search`, açılınca odaklı) ve dünyada gizli olmayan bütün eşyaların yuvaları (`#picker-grid`, 6 satır yüksekliğinde kayar).
- Arama Türkçe ada ya da İngilizce anahtara göre anında süzer (`normalize`, içerir). Arama kutusundaki tuşlar oyuna gitmez (E yazılabilir); Esc paneli kapatır.
- Sol tık bir yığın (64; aletlerde 1, tam dayanıklılıkla), sağ tık bir tane envantere ekler. Envanter doluysa "Envanter dolu".

## Kontrol paneli

- K tuşu (oyun sırasında, sohbet kapalıyken) ve ana menüdeki "Kontrol paneli" düğmesi (oyunu başlatıp açar) `#control` panelini açar; Esc, K, "Kapat" ya da panelin dışına tıklamak kapatır. Açıkken (`controlOpen`) oyun durmaz; oyuncu yürümez, kazamaz, hotbar ve E/Q/T çalışmaz, fare kilidi bırakılır (gecikerek gelen kilit hemen bırakılır).
- Bütün özellikler bu panelden açılıp kapanır; sohbet komutları yalnızca yedektir ve menüdeki tuş listesinde gösterilmez. Oyun ekranının sol üstünde, konum bilgisinin altında sürekli bir ipucu durur (`#hint`: "K: Kontrol paneli · E: Envanter").
- Görünüm Minecraft gibidir: gri kabartma panel, koyu gömük bölümler, taş düğmeler (`.mc-btn`, üzerine gelince mavimsi). Geniş ekranda iki sütun, 640 px altında tek sütun.

  | Bölüm | Denetimler | Eylem (`game-actions.js`) |
  | --- | --- | --- |
  | Oyun modu | Güvenli mod, Ölümsüzlük, Uçma, Rehber, Ses, Shader modu, Sis, Bulutlar anahtarları (açıkken yeşil, "AÇIK") | `setSafeMode`, `setGodMode`, `setFlyAllowed`, `settings.sound` + `applySettings`/`saveSettings`, `setShaderMode`, `setFog`, `setClouds` |
  | Görünüm | Kamera: Arkadan, Gözden, Önden (V ile aynı); Görüş mesafesi: Kısa, Normal, Uzak, Çok uzak (ayarlardakiyle aynı). Seçili olan yeşil | `view`, `settings.viewDistance` + `applySettings`/`saveSettings` |
  | Saat | Sabah, Öğle, Akşam, Gece yarısı (`TIMES_OF_DAY`); başlıkta o anki saat | `setTimeOfDay` |
  | Oyuncu | Canı doldur, Karnı doyur, Doğma noktası burası, Envanteri boşalt (ikinci basışta) | `healPlayer`, `feedPlayer`, `setSpawnHere`, `clearInventory` |
  | Eşyalar | Eşya seç ve al: paneli kapatıp eşya seçiciyi açar | `openPicker` |
  | Işınlan | X, Y, Z kutuları (açılınca oyuncunun konumu; Enter ışınlar), Işınlan, Doğma noktasına git | `teleport`, `spawn` |
  | Canlı çağır | Her `MOB_TYPES` için bir düğme; düşmanlar kırmızımsı yazı | `summonMob` |

- Sohbet komutları aynı eylemleri çağırır; eylemler sonucu metin olarak döndürür (panelde bildirim, sohbette sarı satır). Yeni açılıp kapanabilen her özellik bu panele anahtar olarak eklenir.

## Tarif kitabı

- Envanter ve çalışma masası panelinin başlığındaki "Tarifler" düğmesi (açıkken yeşil) panelin solunda kitabı açar (`#recipe-book`, `recipe-book.js`); açık kalma durumu panel kapanıp açılınca hatırlanır. Sandık, fırın, eşya seçici ve ticaret ekranlarında düğme ve kitap gizlidir.
- Sekmeler: "Üretim" (tariflerin bütün çıktıları, tekrarsız, `RECIPES` sırasıyla) ve "Fırın" (`SMELTING` ürünleri). Arama kutusu Türkçe ada göre süzer (`normalize`); kutudaki tuşlar oyuna gitmez, Esc paneli kapatır. Eşyalar 6 sütunlu, kayan yuva ızgarasında, üzerine gelince ad ipucu.
- Bir eşyaya tıklayınca altta tarifi: 3×3 ızgarada malzeme simgeleri (üzerine gelince adları), ok, çıkan eşya ve adedi. Not satırı "Envanterin 2×2 ızgarasına sığar" ya da "Çalışma masası (3×3) gerekir" der, eksik malzemeleri sayar ("Eksik: 1 × Demir külçe"). Aynı eşyanın birden çok tarifi varsa (tahta: kütük ya da ladin kütüğü) "Diğer tarif" düğmesi. Fırın sekmesinde ortada girdi ve yakıt notu.
- "Izgaraya yerleştir" (malzeme yetmiyorsa soluk): üretim ızgarasındakiler envantere döner, tarifin malzemeleri envanterden birer birer alınıp ızgaranın sol üstüne desen biçiminde dizilir (`fillRecipe`). 3×3 tarif envanterin 2×2 ızgarasına dizilmez, nedeni bildirimle söylenir.

## Rehber

- Hiç Minecraft oynamamış biri için adım adım görevler (`guide.js`, `GUIDE_STEPS`). Sağ üstte Minecraft'taki ilerleme bildirimi gibi koyu bir kart (`#guide`): "Rehber · n/16", sarı başlık, nasıl yapılacağı (tuşlar, ne nereye), mavi ipucu satırı. Yalnızca oynarken ve envanter ya da kontrol paneli kapalıyken görünür.
- Adımlar (sırayla): etrafına bak ve yürü (5 blok), kütük kır, envanteri aç, tahta yap, çalışma masası yap ve koy, tahta kazma yap, taş kaz, taş kazma yap, et bul ve ye, meşale yap, yatak yap ve gece uyu, kömür ve demir bul, fırında demir erit, demir kazma ve çakmak yap, portal kur ve yak, Nether'e geç. Sonunda "Rehber tamamlandı!".
- Her adımın tamamlanma koşulu oyundaki gerçek durumdur: envanterde eşya (`hasItem`) ya da başka dosyalarda işaretlenen olay (`guideFlags`: envanter açıldı, yemek yendi, uyunuldu, çalışma masası kondu, portal yandı) ya da boyut. 0,5 sn'de bir denetlenir; tamamlanınca "Tamamlandı: …" bildirimi, kısa bir ses ve kartın yeşil çerçevesi. Önceden yapılmış adımlar art arda geçilir.
- H kartı gizler/gösterir; aynı ayar (`settings.guide`, ayarlarda "Rehber" kutusu, kontrol panelinde "Rehber" anahtarı) ayarlarla birlikte saklanır. Adım (`guideStep`) kayda yazılır.

## Test kancası

Konsoldan ve testlerden erişim için `window.game` açıktır. Nesne ilk betikte (`textures.js`) boş olarak oluşturulur, her betik kendi kancalarını `Object.assign(window.game, …)` ile ekler. Kancalar: `player`, `damagePlayer`, `clock`, `getBlock`, `setBlock`, `saveGame`, `biomeAt`, `temp`/`hum` (sıcaklık, nem), `mobs`, `projectiles`, `particles`, `spawnMob`, `drops`, `dropItem`, `inventory`, `addItem`, `openInventory`, `closeInventory`, `clickSlot`, `clickCraft`, `clickResult`, `craftGrid`, `mining`, `hunger`, `renderFood`, `getSpawnPoint()`, `isSleeping()`, `crops`, `trySpawnHostile(night)`, `settings`, `fogFar()`, `showSettings`, `soundLog`, `setSound`, `isSoundOn()`, `audioReady()`, `debris`, `spawnDebris`, `clouds`, `stars`, `cloudDrift()`, `tryLightPortal`, `rebuildPortalMeshes`, `portalTimer()`, `worlds` (chunk haritaları), `ensureArea(x, z, r, dim)`, `villagePlan(rx, rz)`, `villageNear(x, z)`, `trades`, `openTrade(m)`, `trade(k)`, `tryOpenTrade()`, `villagerTarget(m)`, `fortressPlan(rx, rz)`, `fortressNear(x, z)`, `shootSmallFireball(m)`, `spawnerModels()`, `guideSteps`, `guideFlags`, `guideStep()`, `setGuideStep(n)`, `setGuideShown(on)`, `setBookOpen(on)`, `selectRecipe(key)`, `fillRecipe()`, `bookItems()`, `setBookTab(tab)`, `chunkCount()`, `meshCount()`, `modifiedChunks`, `switchDimension`, `trySpawnNether(kind)`, `reflectFireball`, `shootFireball`, `portalLinks`, `getDimension()`, `createPortalNear`, `useBed`, `recipes`, `openChat`, `closeChat`, `submitChat`, `openPicker`, `clickPicker(key, right)`, `openControl`, `closeControl`, `isControlOpen()`, `isFlying()`, `isFlyAllowed()`, `pickerItems()`, `isGod()`, `isSafe()`, `chatLines()`, `itemIcon`, `items` (`ITEMS`), `heldView()` (`{ cube, icon }`), `furnaces`, `openFurnace`, `clickFurnace`, `armor`, `clickArmor(i, right)`, `armorPoints()`, `armorMeshes`, `renderArmor`, `bowCharge()`, `shootPlayerArrow(charge)`, `fluidQueues`, `updateFluids`, `fluidPending()`, `chests`, `openChest`, `clickChest(i, right)`, `rebuild` (`buildChunk`), `camera`, `cameraDistance()`, `raycast`, `torchNearby`, `torchLight(x, y, z)`, `shapeFamilies`, `shapeGeometry(id, x, y, z)`, `shapeIcon(id)`, `setShaderMode(on)`, `isShaderMode()`, `cameraRig` (video aracı yazar: `{ pos, look }` verilirse kamera oyuncudan bağımsız sürülür, oyuncu modeli, kol ve seçim çerçevesi gizlenir), `videoTime` (video aracı yazar: shader modundaki su bu zamanla dalgalanır) (kazma ilerlemesi), `crackVisible()` ve kayıt okunduktan sonra `true` olan `ready`. Yeni sistemler test gerektiriyorsa buraya eklenir.

## Kayıt

- Tarayıcının IndexedDB'si: veritabanı `block-world`, depo `saves`, tek kayıt anahtarı `world1`. Veri yalnızca o tarayıcıda ve o adreste durur (GitHub Pages adresi ile yerel dosyanın kayıtları ayrıdır).
- **Kayıt nesnesi** (`SAVE_VERSION = 4`; sürüm 3 kayıtlarının 48 blokluk 8 bit chunk'ları 256 blokluk 16 bit diziye kopyalanır (`upgradeChunk`, hücre indeksi aynı kaldığından dizinin başına); sürüm 1–2 kayıtlarındaki 96×96 tek dizi açılışta chunk'lara bölünür ve hepsi değiştirilmiş sayılır, `loadLegacyWorld`):

  | Alan | İçerik |
  | --- | --- |
  | `version` | `2` |
  | `chunks` | Yalnızca değiştirilmiş chunk'lar: `{ overworld: { "cx,cz": Uint16Array(65.536) }, nether: { … } }`. Değişmemiş chunk'lar tohumdan yeniden üretilir |
  | `dimension` | Oyuncunun bulunduğu dünya: `'overworld'` ya da `'nether'` |
  | `portalLinks` | `{ overworld, nether }`: her dünyadaki bağlı portal `{ x, y, z, axis }` ya da `null` |
  | `player` | `{ x, y, z, yaw, pitch }` |
  | `health` | Can (0 kaydedildiyse 20 yüklenir) |
  | `food` | Açlık (yoksa 20) |
  | `spawnPoint` | Yatakla belirlenen doğma noktası `{ x, y, z }` ya da `null` |
  | `furnaces` | Fırınların dizisi: `{ dim, x, y, z, slots, burn, burnMax, progress }` (`dim` yoksa ana dünya) |
  | `safeMode` | Güvenli mod açık mı (yoksa kapalı) |
  | `guideStep` | Rehberin kaldığı adım (yoksa 0) |
  | `flyAllowed` | Uçma izni (yoksa kapalı); uçuşun kendisi kaydedilmez |
  | `armor` | 4 zırh yuvası: `{ key, count: 1, durability }` ya da `null` |
  | `chests` | Sandıkların dizisi: `{ dim, x, y, z, slots[27] }`; alan yoksa sandık yok |
  | `selected` | Seçili hotbar yuvası (0–8) |
  | `inventory` | 36 yuva: `{ key, count }` (aletlerde `durability` da) ya da `null`; bilinmeyen anahtarlar yüklenirken atlanır |
  | `time`, `day` | `clock.time`, `clock.day` |

  Yeni özellikler kendi alanlarını bu nesneye ekler ve bu tabloya yazar. Alanların anlamı değişirse `SAVE_VERSION` artırılır; sürümü uymayan kayıt yok sayılır.
- **Ne zaman kaydedilir:** her 30 sn'de bir (oyun oynanırken), duraklatınca (`pause()`), sayfa arka plana geçince (`visibilitychange`) ve kapanırken (`pagehide`).
- **Açılış:** Kayıt, bütün betikler yüklendikten sonra `main.js`'in sonunda okunur (`loadGame()`); ardından ayarlar okunur. "Oyna" düğmesi bunlar bitene kadar pasiftir. Kayıt varsa dünya ondan yüklenir, bütün chunk'lar yeniden kurulur, oyuncu, can, hotbar ve saat geri gelir. IndexedDB açılamazsa (3 sn zaman aşımı dahil) oyun kayıtsız çalışır, panelde "Kayıt yapılamıyor" notu çıkar ve "Yeni dünya" düğmesi gizlenir.
- **Yeni dünya:** İlk basışta düğme "Emin misin? Tekrar bas" olur, ikinci basışta kayıt silinir ve sayfa yeniden yüklenir. (`confirm()` kullanılmaz; onay sayfanın kendi arayüzündedir.)

---

## Özellik durumu

Numaralar [minecraft-feature-list.md](minecraft-feature-list.md) ile aynıdır.

| # | Özellik | Durum |
| --- | --- | --- |
| — | Temel oyun: arazi, ağaçlar, yürüme, kırma/koyma, hotbar | Yapıldı |
| — | Oyuncu modeli, üç kamera, gözden kol, W-W koşma | Yapıldı |
| 1 | Can barı | Yapıldı |
| 2 | Düşme hasarı, ölüm ve yeniden doğma | Yapıldı |
| 3 | Sabah / akşam döngüsü | Yapıldı |
| 4 | İlerlemeyi IndexedDB'ye kaydetme | Yapıldı |
| 5 | Canlı altyapısı ve inek | Yapıldı |
| 6 | Domuz, tavuk ve koyun | Yapıldı |
| 7 | Canlılara vurma | Yapıldı |
| 8 | Zombi | Yapıldı |
| 9 | İskelet | Yapıldı |
| 10 | Örümcek | Yapıldı |
| 11 | Creeper | Yapıldı |
| 12 | Düşmanların gün ışığında yanması | Yapıldı |
| 13 | Eşya düşmesi ve toplama | Yapıldı |
| 14 | Sınırlı hotbar ve envanter ekranı | Yapıldı |
| 15 | Blok kırma süresi ve çatlama | Yapıldı |
| 16 | Üretim ve çalışma masası | Yapıldı |
| 17 | Aletler | Yapıldı |
| 18 | Açlık barı ve yemek | Yapıldı |
| 19 | Fırın ve pişirme | Yapıldı |
| 20 | Maden cevherleri | Yapıldı |
| 21 | Su | Yapıldı |
| 22 | Meşale ve basit ışık | Yapıldı |
| 23 | Yatak | Yapıldı |
| 24 | Kapı ve cam | Yapıldı |
| 25 | Çiçek, uzun ot ve süs bitkileri | Yapıldı |
| 26 | Buğday tarımı ve ekmek | Yapıldı |
| 27 | Mağaralar | Yapıldı |
| 28 | Ses efektleri | Yapıldı |
| 29 | Kırılma parçacıkları | Yapıldı |
| 30 | Duraklat menüsü ve ayarlar | Yapıldı |
| 31 | Bulutlar ve yıldızlar | Yapıldı |
| 32 | Hasar ve ölüm geri bildirimleri | Yapıldı |
| 33 | Obsidyen ve Nether portalı | Yapıldı |
| 34 | Nether boyutu | Yapıldı |
| 35 | Nether yaratıkları | Yapıldı |
| 36 | Sandık | Yapıldı |
| 37 | Elmas, demir ve elmas aletler | Yapıldı |
| 38 | Zırh | Yapıldı |
| 39 | Yay ve ok | Yapıldı |
| 40 | Kova, akan su ve lav | Yapıldı |
| 41 | Biyomlar | Yapıldı |
| 42 | Sonsuz dünya | Yapıldı |
| 43 | Köyler ve köylü ticareti | Yapıldı |
| 44 | Nether kalesi ve blaze | Yapıldı |
| 45 | Sohbet ve komutlar | Yapıldı |
| 46 | Adım adım rehber | Yapıldı |
| 47 | Üretim rehberi (tarif kitabı) | Yapıldı |
| 48 | Eşya seçici (`/give` paneli) | Yapıldı |
| 49 | Eldeki eşya her zaman görünür | Yapıldı |
| 50 | Güvenli mod (`/safe`) | Yapıldı |
| 51 | Kontrol paneli | Yapıldı |
| 52 | Eğilme | Yapıldı |
| 53 | Uçma | Yapıldı |
| 54 | 256 blok dünya yüksekliği | Yapıldı |
| 55 | Uzak görüş, sis ve bulut ayarları | Yapıldı |
| 56 | Yapı blokları | Yapıldı |
| 57 | Şekilli bloklar | Yapıldı |
| 58 | Shader modu | Yapıldı |
| 59 | Video aracı | Yapıldı |
| 60 | Burj Halife şablonu | Yapıldı |

## Video aracı (tools/video)

Oyunu görünmez Chrome'da açıp bir yapıyı kare kare kurarken kaydeden ve dikey mp4 üreten araç. Oyunun parçası değildir, yayında yüklenmez.

- **Kullanım:** `node tools/video/record.mjs tools/video/scenes/burj-khalifa.mjs [--gpu] [--size 720x1280] [--fps 30] [--seconds 24] [--still 0.6] [--out videos]`. Birden çok sahne verilirse sırayla kaydedilir (kuyruk). Çıktı `videos/<sahne>.mp4` (`.gitignore`'da). `--still t` video yerine o andaki tek kareyi PNG yazar (hızlı önizleme). `--gpu` ekran kartıyla çizer (SwiftShader'dan ~5 kat hızlı); 720×1280 24 sn ekran kartıyla birkaç dakika sürer. ffmpeg gerekir.
- **Akış:** Oyun açılır, "Oyna"ya basılır, arayüz gizlenir; ölümsüzlük ve güvenli mod açılır; sahnenin ayarları (görüş, sis, bulut, shader, görüş açısı) uygulanır; yapı alanının çevresi üretilir, canlılar kaldırılır, oyun dondurulur (`playing = false`: canlı, sıvı, bulut ilerlemez) ve bütün çevre çizilir. Her karede sıradaki bloklar konur (`__video.place`), değişen chunk'lar yeniden kurulur, saat ve su zamanı (`window.game.videoTime`) karenin zamanına sabitlenir, kamera `window.game.cameraRig` ile ayarlanır, iki kare beklenir ve ekran görüntüsü ffmpeg'e (libx264, yuv420p, crf 18) aktarılır. Böylece kareler gerçek çizim süresinden bağımsız, düzgün akar.
- **Zaman çizelgesi:** `prepare(ctx)` blokları (zemin düzleme, meydan) da videoda görünür: dünyadakinden farklı olan hücreler alınır (`__video.changes`) ve merkezden dışa 2 bloklık halkalarla sıralanır (halkada önce boşaltma yukarıdan aşağı, sonra doldurma). Kurulum karelerinin `prepareShare` (varsayılan 0,2) kadarı hazırlığa, kalanı `blocks` listesine ayrılır; en sondaki `hold` oranı kurulumsuz döner. Kamera kurulan en üst katı ~0,6 sn'lik üstel yumuşatmayla izler (`topY`), her yeni katta zıplamaz.
- **Giriş** (isteğe bağlı `intro: { seconds, segments, camera(t, ctx) }`): videonun başında bitmiş yapı gösterilir. Kayıt aracı yapı alanını kapsayan chunk'ların kopyasını alır (`__video.snapshot`), bütün blokları koyar, girişi çeker, sonra kopyayı geri yazar (`__video.restore`) ve kurulum baştan başlar. Her bölüm `{ until (0–1), shader, caption }`: shader modu bölümle değişir (bütün çevre yeniden kurulur), `caption` karenin üstünde piksel yazıyla görünür (`__video.caption`). Burj'da 6 sn: "Shader kapalı" → "Shader açık" → "Nasıl yapıldı?". `--intro-still t` girişin bir karesini PNG yazar.
- **Sahne dosyası** (`tools/video/scenes/*.mjs`, `export default`): `name`, `size`, `fps`, `seconds`, `hold` (sonda kurulumsuz dönen süre oranı), `prepareShare`, `time` (`clock.time`), `shader`, `fog`, `clouds`, `view`, `fov`, `center: [x, z]`, `prepare(ctx)` ve `blocks(ctx)` (blok listesi `[x, y, z, anahtar]`, kurulum sırasıyla; anahtar `B`'deki ad, `0` hava), `camera(t, ctx)` → `{ pos: [x, y, z], look: [x, y, z] }`. `ctx`: `ground` (merkezdeki arazi yüksekliği), `center`, kamerada ayrıca `progress` (yapının 0–1 ilerlemesi; hazırlıkta 0), `topY` (kurulan en yüksek bloğun yumuşatılmış değeri) ve `preparing`.
- **Yapı şablonu yardımcıları** (`tools/video/templates.mjs`): `shell({ inside, bounds, material })` içi boş kabuk (yalnızca görünen yan ve çatı hücreleri, katman katman, açıya göre sıralı), `disc`, `flatten(cx, cz, r, zemin, clear = 40)` (alanı zeminin 40 blok üstüne kadar boşaltıp altını doldurur), `orbit` (dönen kamera).
- **Örnek sahne:** `burj-khalifa.mjs`: Y planlı, üç kanadı sarmal sırayla 18 kademede kısalan, daralan çekirdekli ve demir sütunlu sivri tepeli gökdelen (~220 blok, ~16.000 blok); füme cam ve demir dikme cephe, kuvars kademe çatıları, cilalı taş meydan ve halka havuz. 6 sn giriş + 28 sn: ilk %20'si düzleme ve meydan, sonra kule, son %20'si dönerek gösterim. Shader modu açık, sis ve bulut kapalı.
- **Test:** `node tools/video/selftest.mjs`: her sahnenin blokları dünya sınırında ve aşağıdan yukarı sıralı mı, kamera geçerli mi; örnek sahnenin girişli, 1 sn kurulumlu 180×320 kaydı beklenen kare sayısında (10 fps: giriş + 10) ve oynatılabilir mi (ffprobe).
