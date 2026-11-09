# AGENTS.md

Bu depo, tarayıcıda çalışan Minecraft tarzı bir blok oyunudur: **Blok Dünyası**. Oyun `index.html`, `css/style.css` ve `js/` altındaki küçük betiklerden oluşur. Bu dosya, bu depoda çalışan her yapay zekâ ajanı için kuralları ve çalışma düzenini anlatır.

Önce şunları oku:

1. **[SPEC.md](SPEC.md):** Oyunun şu anki hali: mimari, veri modeli, sabitler, kontroller.
2. **[minecraft-feature-list.md](minecraft-feature-list.md):** Yapılacak özelliklerin numaralı listesi. Her maddede kabul ölçütü ve bağımlılıklar var.

---

## Değişmez kurallar

### Teknik

- **Dosya yapısı.** `index.html` yalnızca sayfa iskeleti ve betik sırasıdır; stiller `css/style.css`, oyun kodu `js/` altındadır. Her betik tek bir konuyu taşır (dokular, bloklar, canlılar, envanter…); tam liste SPEC.md "Dosya yapısı" bölümünde.
- **Build yok.** npm, bundler, derleme adımı yok. Dosyalar tarayıcıya olduğu gibi gider.
- **Klasik betikler, ES modülü değil.** Betikler `<script src>` ile sırayla yüklenir ve üst düzey tanımları (`const`, `let`, `function`) ortak genel kapsamı paylaşır. `import`/`export` ya da `type="module"` kullanma: oyun `file://` üzerinden çift tıklanarak da açılabilmeli.
  - **Yükleme sırası önemlidir.** Bir betik, yüklenirken (üst düzeyde hemen çalışan kodda) yalnızca kendisinden önce yüklenen betiklerin tanımlarını kullanabilir. Fonksiyonların içinden daha sonraki betiklerin tanımlarına erişmek serbesttir (fonksiyon çağrıldığında hepsi yüklenmiş olur).
  - **Ad çakışması.** Üst düzey adlar bütün betiklerde tektir; aynı adı iki dosyada tanımlama. Tarayıcının kendi genel adlarını (`top`, `self`, `name`, `status`, `parent`, `length`, `location`, `history`, `event` vb.) üst düzey değişken adı olarak kullanma.
  - **Yeni dosya** açarsan `index.html`'deki doğru yere `<script src="js/….js">` satırını ekle ve SPEC.md'deki dosya tablosuna yaz. Bir dosya ~300 satırı geçerse konuya göre böl.
- **Tek dış kütüphane: Three.js r128,** cdnjs'ten yüklenir: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`. Yeni kütüphane ekleme, sürümü değiştirme.
- **Dış dosya yok.** Resim, model ve ses dosyası kullanılmaz. Dokular 16×16 pikselde canvas ile kodla çizilir (mevcut atlas düzenine eklenir). Sesler WebAudio API ile kodla üretilir.
- **Tarayıcı kısıtları.** Oyun hem GitHub Pages'te (HTTPS) hem de çift tıklanan yerel dosya (`file://`) olarak çalışmalı.
  - `alert()`, `confirm()` ve `prompt()` kullanma; oyun içi arayüzün (Minecraft görünümü) dışında kalırlar. Onay gereken her adımı sayfanın kendi arayüzüyle yap (örnek: düğmeye ikinci kez basınca onaylanır).
  - Fare kilidi, IndexedDB ve `localStorage` reddedilebilir. Hepsini `try/catch` ile sar, reddedilince oyun yine oynanabilir kalsın.
  - Ses yalnızca kullanıcı bir yere tıkladıktan sonra başlayabilir (`AudioContext` ilk "Oyna" tıklamasında açılır).

### Dil

- **Dosya ve klasör adları İngilizce.**
- **Koddaki bütün adlar İngilizce:** değişken, fonksiyon, sabit, sınıf, CSS sınıfı ve id, IndexedDB veritabanı/depo/anahtar adları, kayıt nesnesindeki alanlar.
- **Oyuncunun gördüğü her yazı Türkçe:** paneller, düğmeler, bildirimler, blok ve eşya adları, ölüm mesajları.
- Kod yorumları ve bölüm başlıkları Türkçe olabilir, mevcut dosya öyle yazılmış.
- Türkçe sayı ve saat biçimi: `4.250`, `%78,3`, `06:30`.

### Görsel

- **Oyun içi arayüz Minecraft'taki gibi görünür** (kullanıcının açık isteği; oynarken aynı his). Hotbar, envanter, üretim, fırın, ipucu kutusu, sohbet ve bundan sonra eklenecek her oyun içi panel:
  - Panel: açık gri `#c6c6c6`, siyah dış çizgi, sol üstte beyaz, sağ altta koyu gri (`#555`) iç kabartma.
  - Yuva: `#8b8b8b`, çukur görünüm (sol üst kenar `#373737`, sağ alt kenar beyaz); üzerine gelince açılır. Hotbar yuvaları yarı saydam koyu, seçili yuva kalın beyaz çerçeveli.
  - Yazı: piksel yazı tipi `var(--mc-font)` (Pixelify Sans); adetler ve başlıklar beyaz/gri, `2px 2px 0 #3f3f3f` gölgeli.
  - **İpucu:** eşya taşıyan her yuvanın üzerine gelince eşyanın adı Minecraft ipucu kutusunda (koyu mor zemin, mor çerçeve) görünür. Yuvaya `dataset.name` yazılır, `#tooltip` bunu gösterir; yeni yuva türleri de bunu kullanmalı.
  - Düğme: `.mc-btn` (taş gri, kabartma kenar, beyaz gölgeli piksel yazı, üzerine gelince mavimsi). Açılıp kapanan ayar: `.mc-btn.toggle` (açıkken yeşil, sağda "AÇIK"/"KAPALI").
- **Her özellik arayüzden kullanılabilir** (kullanıcının açık isteği): komut yazmak zorunlu olmamalı. Açılıp kapanan ya da hile niteliğindeki her yeni özellik kontrol paneline (`control-panel.js`, K) eklenir; eylem `game-actions.js`'te yazılır, komut da aynı eylemi çağırır.
- **Eşya ve blok simgeleri Minecraft'taki gibidir:** bloklar izometrik küp (`blockIcon`), diğer eşyalar 16×16 piksel, Minecraft'taki şekline benzeyen ve koyu kenarlı çizimler (`outlineIcon`; aletler `drawTool`). Yeni eşya eklerken bu üsluba uy.
- Başlangıç, duraklatma ve ayarlar menüleri Elektraweb marka renklerini kullanır; dosyanın başındaki CSS değişkenlerini kullan (`--ew-primary`, `--ew-secondary`, `--ew-text` vb.). Yeni sabit renk yazma, gerekiyorsa `:root` bloğuna yeni değişken ekle.
- Oyun dünyasının renkleri (dokular, gökyüzü, canlılar) Minecraft'a benzer doğal renklerdir.
- Emoji kullanma. Simgeler canvas ile piksel piksel çizilir (kalpler, et simgesi gibi).

### Kod düzeni

- Her betik `// ---------- Başlık ----------` satırı ve bir satırlık açıklamayla başlar. Yeni kodu konusuna uyan dosyaya koy; uygun dosya yoksa yeni dosya aç.
- Mevcut kodun üslubuna uy: kısa fonksiyonlar, `const` öncelikli, ok fonksiyonları, iki boşluk girinti, noktalı virgül.
- Gereksiz soyutlama ekleme. Bir özellik için gereken en az kodu yaz; ilgisiz kodu düzeltme ya da yeniden düzenleme.
- Yeni bir tuş eklersen başlangıç panelindeki tuş listesine (`.keys`) Türkçe açıklamasıyla ekle.

---

## Bir özellik maddesini yapma düzeni

Her madde ayrı bir iş ve ayrı bir commit'tir. Bir istekte birden çok madde verilse de her biri için bu adımları ayrı ayrı uygula.

1. **Oku.** Maddeyi, bağımlılıklarını ve SPEC.md'nin ilgili bölümünü oku. Bağımlılıklar yapılmamışsa önce onları yap ya da kullanıcıya sor.
2. **Yap.** Yalnızca o maddenin istediğini ekle. Mevcut özellikler bozulmayacak: yürüme, zıplama, koşma (W-W), eğilme (Shift), çarpışma, blok kırma/koyma, 1–9 ve tekerlekle blok seçme, V ile üç kamera, Esc ile duraklatma, fare kilitlenemeyince sürükleyerek bakma.
3. **Sözdizimini denetle.** Her betiği Node ile kontrol et:

   ```bash
   for f in js/*.js; do node --check "$f" || echo "HATA: $f"; done
   ```

4. **Test yaz ve çalıştır.** Maddenin kabul ölçütünü `tests/NN-kisa-ad.js` dosyasında otomatik teste çevir ve görünmez Chrome'da çalıştır (bkz. "Test"). Test geçmeli, konsolda hata olmamalı. Görsel bir değişiklikse ekran görüntüsü alıp bak.
5. **Belgeleri güncelle.**
   - SPEC.md'de değişen veya eklenen şeyleri yaz: yeni bloklar, sabitler, tuşlar, kayıt alanları, bölümler.
   - SPEC.md'deki "Özellik durumu" tablosunda maddeyi `Yapıldı` olarak işaretle.
6. **Commit at.** Commit mesajları **İngilizce** yazılır. Biçim:

   ```
   feat(#5): mob framework and cow

   - shared AABB physics for player and mobs
   - cow model and wandering AI
   ```

   - Başlık: `feat(#<madde no>): <kısa İngilizce özet>`, küçük harfle başlar, sonda nokta yok. Hata düzeltmesi `fix:`, yalnızca belge `docs:`, test `test:`, diğer işler `chore:`.
   - Gövdede yapılanları 2–5 madde halinde, İngilizce yaz.
   - Eski commit'ler Türkçedir; geçmiş yeniden yazılmaz.
   - Gövdede yapılanları 2–5 madde halinde yaz.
   - Commit mesajına `Co-Authored-By` satırı ekleme.
   - Uzak depoya (`origin`, GitHub) yalnızca kullanıcı isterse push yap.

Bir maddenin bir kısmını bilerek yapmadıysan (örneğin tarayıcı kısıtı yüzünden), bunu hem commit gövdesine hem SPEC.md'deki tabloya not olarak yaz.

---

## Test

### Otomatik test (önerilen)

`tools/browser-test.mjs`, oyunu görünmez (headless) Chrome'da açar, bir test dosyasını sayfada çalıştırır ve sonucu JSON olarak yazar. Yerel sunucu ve tarayıcı paneli gerekmez.

```bash
node tools/browser-test.mjs tests/02-fall-damage.js
node tools/browser-test.mjs tests/02-fall-damage.js /tmp/ekran.png   # ekran görüntüsüyle
```

- Test dosyası, async bir fonksiyonun gövdesidir. `wait(ms)` ve `window.game` (bkz. SPEC.md "Test kancası") kullanılabilir. Sonunda `{ ok: true | false, ...ayrıntılar }` döndürür.
- Testin başında `document.getElementById('play').click()` ile oyunu başlat. Görünmez Chrome'da fare kilidi alınamaz, oyun sürükleyerek bakma moduna geçer.
- Nişan alan testler (kazma, vurma, sağ tık) başta V ile gözden görünüme geçer: arkadan kamerada omuz kayması olduğu için nişangâh oyuncunun tam önünden geçmez.
- Görünmez Chrome'da kare hızı düşük ve düzensizdir (yazılımla WebGL). Sabit sürelere değil, duruma göre bekle: örneğin oyuncu yere değene kadar `p.onGround` kontrol et.
- Araç, testten önce `window.game.ready` olmasını (kaydın okunmasını) bekler.
- Sayfa yenilemeyi gerektiren testler aşamalara bölünür ve birlikte verilir: `node tools/browser-test.mjs tests/04-save-a.js tests/04-save-b.js ...`. Her aşamadan önce sayfa yeniden açılır, IndexedDB korunur. Aşama dosyalarının adı `-a.js`, `-b.js` … ile biter.
- Çıkış kodu: `0` geçti, `1` test başarısız ya da sayfada hata, `2` araç hatası.
- **Video aracı:** `tools/video/` değişirse `node tools/video/selftest.mjs` çalıştır (ayrıntı SPEC.md "Video aracı").
- **Bütün testler:** `node tools/run-tests.mjs` (ad filtresi verilebilir: `node tools/run-tests.mjs 14`). Aşamalı testler adlarının sonundaki `-a.js`, `-b.js` … ile gruplanıp birlikte çalışır. Her madde bittiğinde bütün testleri çalıştır.

### Elle deneme

Oyunu yerel bir sunucuyla aç:

```bash
python3 -m http.server 8765
```

Sonra tarayıcıda `http://localhost:8765/index.html` adresine git.

Bilinen tuzaklar:

- **Arka plandaki sekme durur.** Tarayıcı paneli gizliyken `requestAnimationFrame` çalışmaz ya da çok yavaşlar. Bu yüzden oyun ilerlemez ve ekran görüntüsü eski kareyi gösterir. Test ederken panelin görünür olduğundan emin ol.
- **WebGL ekran görüntüsü.** Tuvali okumak için `requestAnimationFrame` içinde, oyunun kendi karesi çizildikten hemen sonra `drawImage` ile 2B bir tuvale kopyala; kare bittikten sonra okunan WebGL tuvali boş gelir.
- **Kodla girdi.** Tuşları `window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }))` ile, bakışı tuval üzerinde `mousedown` → `document` üzerinde `mousemove` (`movementX/Y`) → `mouseup` ile verebilirsin. Nişan ışını bir sonraki karede güncellenir; bakışı değiştirdikten sonra tıklamadan önce bir kare bekle.
- **macOS dosya adları büyük/küçük harfe duyarsızdır.** `Index.html` ile `index.html` aynı dosyadır. Yalnızca harf büyüklüğü farklı bir adla yazarsan asıl dosyanın üzerine yazarsın.

---

## Yayınlama

- **GitHub Pages (tek yayın yeri):** Depo `origin` (GitHub) üzerinden GitHub Pages ile yayınlanır; özel alan adı `CNAME` dosyasındadır (`block-world.necim.dev`). Kullanıcı push'layınca yayın güncellenir; agent push'lamaz.
  - Pages kök dizindeki `index.html` dosyasını açtığı için oyun dosyasının adı `index.html` olarak kalmalıdır; `CNAME` dosyasını silme ya da değiştirme.
  - Bütün yollar göreli olmalı (`css/style.css`, `js/….js`); kök `/` ile başlayan yol yazma.
  - Derleme adımı yok: depodaki dosyalar olduğu gibi yayınlanır. `tests/` ve `tools/` de yayına girer ama oyun onları yüklemez.
- Artifact olarak yayınlanmaz (kullanıcının kararı).
- **Yerel açma:** Klasör bütün olarak kopyalanırsa `index.html` çift tıklanarak açılır (`css/` ve `js/` yanında olmalı). Three.js internetten yüklendiği için oyun internet bağlantısı ister.
