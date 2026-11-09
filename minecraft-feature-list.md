# Blok Dünyası: Minecraft tarzı özellik listesi

Bu liste, `index.html` oyununa bir yapay zekâ asistanına **tek tek** yaptırılacak özellikleri sıralar. Her madde tek bir istekle yapılabilecek boyuttadır. Maddeleri sırayla ver; her birinden sonra oyunu açıp kabul ölçütünü kontrol et, sonra sonrakine geç.

---

## Ortak talimat (her isteğin başına bunu ekle)

> Bu depo bir tarayıcı oyunu (`index.html`, `css/style.css`, `js/*.js`). Önce AGENTS.md ve SPEC.md'yi oku. Aşağıdaki **tek** maddeyi ekle, başka bir şeye dokunma.
>
> - Kod `js/` altında konusuna göre ayrılmış klasik betiklerde durur (ES modülü değil); yeni kod uygun dosyaya, gerekiyorsa yeni bir dosyaya. Build adımı ve npm yok.
> - Dış kütüphane olarak yalnızca zaten yüklü olan Three.js r128 (cdnjs) kullanılacak. Yeni kütüphane ekleme.
> - Dış resim, model veya ses dosyası yok. Dokular mevcut atlas gibi canvas ile kodla çizilecek (16×16 piksel). Sesler WebAudio API ile kodla üretilecek.
> - Dil kuralı: dosya adları ve koddaki tüm adlar (değişken, fonksiyon, sabit, sınıf, CSS sınıfı ve id, IndexedDB veritabanı, depo ve anahtar adları) İngilizce olacak. Yalnızca oyuncunun gördüğü arayüz yazıları Türkçe olacak.
> - Arayüzdeki tüm yazılar Türkçe olacak.
> - Oyun içi arayüz (hotbar, envanter, paneller, ipuçları, sohbet) ve eşya simgeleri Minecraft'taki gibi görünür: gri kabartmalı paneller, çukur yuvalar, piksel yazı tipi, üzerine gelince ad ipucu; bloklar izometrik küp, eşyalar koyu kenarlı 16×16 piksel. Ayrıntılar AGENTS.md "Görsel" bölümünde. Başlangıç/ayarlar menüleri marka renklerinde kalır.
> - Mevcut özellikler bozulmayacak: yürüme, zıplama, koşma (W-W), eğilme (Shift, madde 52), çarpışma, blok kırma/koyma, 1–9 hotbar, tekerlek, V ile üç kamera, Esc ile duraklatma, fare kilitlenemeyince sürükleyerek bakma.
> - Kodu mevcut düzene uy: her betik `// ---------- Başlık ----------` satırıyla başlar, sabitler ilgili dosyanın başında.
> - Yeni bir tuş eklersen başlangıç panelindeki tuş listesine de ekle.
> - Bitince neyi değiştirdiğini ve nasıl test edeceğimi 3–5 satırda yaz.

---

## 1. Temel sistemler (kullanıcının istekleri)

### 1. Can barı
- **Minecraft'ta:** Oyuncunun 20 can puanı vardır, hotbar'ın üstünde 10 kalp olarak görünür; hasar alınca azalır, zamanla yenilenir.
- **Bu oyunda:**
  - `player.health` = 20, en fazla 20. HUD'da hotbar'ın hemen üstünde, solda 10 kalp (her kalp 2 puan; dolu, yarım, boş). Kalpler canvas ile 9×9 piksel çizilir.
  - `damagePlayer(miktar, kaynakX, kaynakZ)` fonksiyonu: canı düşürür, 0,5 sn hasarsızlık süresi verir, ekranı 0,2 sn kırmızıya boyar, oyuncuyu kaynaktan uzağa 4 birim/sn hızla iter ve 6 birim/sn yukarı zıplatır.
  - Can 20'den azsa ve son 5 sn hasar alınmadıysa her 4 sn'de 1 puan yenilenir (açlık sistemi gelene kadar).
  - Test için geçici değil, kalıcı bir yol: düşme hasarı (madde 2) bu fonksiyonu kullanacak.
- **Kabul ölçütü:** Ekranda 10 kalp görünüyor; tarayıcı konsolunda hasar fonksiyonu çağrılınca kalpler azalıyor, ekran kırmızı yanıp sönüyor, bir süre sonra kalpler geri doluyor.
- **Bağımlılık:** yok

### 2. Düşme hasarı, ölüm ve yeniden doğma
- **Minecraft'ta:** 3 bloktan yüksekten düşünce her ek blok için 1 can gider; can bitince "Öldün!" ekranı çıkar ve oyuncu doğma noktasında yeniden doğar.
- **Bu oyunda:**
  - Havadayken en yüksek Y'yi takip et; yere değince `düşülen yükseklik - 3` kadar hasar ver (3 blok ve altı hasarsız).
  - Can 0 olunca oyunu durdur, "Öldün!" başlıklı bir panel ve "Yeniden doğ" düğmesi göster. Düğmeye basınca oyuncu `spawn()` noktasında 20 canla doğar.
  - Dünyanın altına düşünce (y < -20) mevcut ışınlama yerine ölüm ekranı çıksın.
- **Kabul ölçütü:** 4 blok yüksekten atlayınca yarım kalp, 10 bloktan atlayınca 3,5 kalp gidiyor; yeterince yüksekten düşünce ölüm paneli çıkıyor ve yeniden doğunca canlar tam.
- **Bağımlılık:** 1

### 3. Sabah / akşam döngüsü
- **Minecraft'ta:** Bir gün 20 dakikadır; güneş ve ay gökyüzünde döner, gece gökyüzü ve dünya kararır.
- **Bu oyunda:**
  - Bir gün 10 dakika: gündüz 5 dk, akşam geçişi 30 sn, gece 4 dk, şafak geçişi 30 sn. `time` değeri 0–1 arası, oyun duraklatılınca ilerlemez. Oyun sabah (`time` = 0,05) başlar.
  - Gökyüzü rengi ve sis rengi gündüz `#9cc8ef`, gün batımında turuncumsu `#e8a36a`, gece `#0b1026` arasında yumuşak geçsin.
  - Dünya parlaklığı: blok malzemesinin (`material.color`) çarpanı gündüz 1,0, gece 0,25. Model ve kol sahnelerindeki ışıkların şiddeti de aynı oranla azalsın.
  - Gökyüzünde kodla çizilmiş kare güneş (sarı) ve ay (açık gri) döner; her zaman kameraya göre uzakta, sisten etkilenmeyecek şekilde.
  - Sol üstteki bilgi kutusuna saat eklensin: `Gün 1 · 06:00` biçiminde.
- **Kabul ölçütü:** Beklerken gökyüzü turuncuya sonra laciverte dönüyor, dünya kararıyor, ay görünüyor; birkaç dakika sonra sabah oluyor ve gün sayısı artıyor.
- **Bağımlılık:** yok

### 4. İlerlemeyi IndexedDB'ye kaydetme
- **Minecraft'ta:** Dünya ve oyuncu durumu otomatik kaydedilir; oyuna geri dönünce her şey bırakıldığı gibidir.
- **Bu oyunda:**
  - Not: "index.db'ye kaydet" isteğinin karşılığı budur. Tek HTML dosyası tarayıcıda çalıştığı için diske gerçek bir `index.db` dosyası yazamaz; tarayıcının kendi veritabanı **IndexedDB** kullanılacak. Veri yalnızca o tarayıcıda, o adreste durur.
  - Veritabanı adı `block-world`, depo adı `saves`, tek kayıt anahtarı `world1`. Saklananlar: tüm dünya dizisi (`Uint8Array`, ~442 KB, olduğu gibi), oyuncu konumu ve bakış yönü (`x, y, z, yaw, pitch`), can, seçili hotbar yuvası, saat ve gün sayısı; envanter, açlık, doğma noktası gibi alanlar ileride eklendikçe aynı kayda yazılacak (kayıtta `version: 1` alanı olsun).
  - Kayıt zamanları: her 30 sn'de bir, Esc ile duraklatınca ve sayfa kapanırken/arka plana geçerken (`visibilitychange`). Kaydederken sağ üstte 1 sn "Kaydedildi" yazısı.
  - Açılışta kayıt varsa dünya ondan yüklenir ve chunk'lar yeniden kurulur; yoksa mevcut üretim çalışır. Başlangıç paneline "Yeni dünya" düğmesi eklenir: onay ister (`confirm()` kullanılmaz, onay sayfanın kendisinde: ilk basışta düğme "Emin misin? Tekrar bas" olur), kaydı siler ve sayfayı yeniden yükler.
  - IndexedDB açılamazsa (gizli pencere vb.) oyun kayıtsız çalışmaya devam eder, panelde "Kayıt yapılamıyor" notu çıkar.
- **Kabul ölçütü:** Birkaç blok kırıp/koyup, biraz yürüyüp sayfayı yenileyince aynı yerde, aynı can ve saatle başlıyor ve yapılan değişiklikler duruyor. "Yeni dünya" ile her şey sıfırlanıyor.
- **Bağımlılık:** 1, 3 (can ve saat kayda girsin diye; sonraki maddeler kendi alanlarını ekler)

---

## 2. Canlılar

### 5. Canlı altyapısı ve inek
- **Minecraft'ta:** Hayvanlar çimenlerde rastgele dolaşır, ara sıra durur, engelden atlayıp geçer.
- **Bu oyunda:**
  - Ortak bir `mobs` dizisi ve canlı yapısı: konum, hız, yön, can, kutu boyu (genişlik/yükseklik), oyuncuyla aynı AABB çarpışma ve yerçekimi kodu (mevcut `collides`/`moveAxis` mantığını canlıya göre genelleştir, oyuncu davranışını değiştirme).
  - Basit yapay zekâ: 2–5 sn rastgele bir yöne 1,2 blok/sn yürü, 2–4 sn dur; önü 1 blok yüksekse zıpla, 2 blok ve daha yüksekse dön; su veya 3 bloktan derin uçuruma yürüme.
  - İnek: oyuncu modeli gibi kutulardan (gövde 10×8×16, baş, 4 bacak, P = 0,05625), kahverengi-beyaz lekeli doku, yürürken bacak sallanır. Can 10.
  - Dünya kurulurken çimen üstüne 6 inek koy; toplam hayvan sınırı 16.
- **Kabul ölçütü:** Çimenlik alanlarda inekler bacaklarını sallayarak dolaşıyor, bloklardan geçmiyor, 1 blokluk basamağı çıkıyor.
- **Bağımlılık:** yok

### 6. Domuz, tavuk ve koyun
- **Minecraft'ta:** Her hayvanın kendine özgü görünüşü ve boyu vardır; tavuk düşerken kanat çırparak yavaş iner.
- **Bu oyunda:**
  - Domuz (pembe, kısa bacaklı, burun çıkıntısı, can 10), tavuk (küçük, beyaz, sarı gaga, kırmızı ibik, can 4, düşüşte yerçekimi 1/4), koyun (beyaz yünlü gövde, gri yüz, can 8).
  - Her türden 4–6 tane, sürüler halinde (aynı türler 8 blok içinde) doğsun. Toplam sınır 16 korunur.
  - Gündüz, oyuncudan 24+ blok uzakta, çimen üstünde sayı sınırın altına düşünce her 30 sn'de bir yeni hayvan doğabilir.
- **Kabul ölçütü:** Dünyada dört farklı tür hayvan görülüyor; tavuk yüksekten süzülerek iniyor.
- **Bağımlılık:** 5

### 7. Canlılara vurma
- **Minecraft'ta:** Sol tıkla canlıya vurulur; canlı kırmızı yanıp söner, geri savrulur, canı bitince ölür ve eşya düşürür.
- **Bu oyunda:**
  - Nişan ışını önce canlıların kutularına bakar; blokta daha yakın bir canlı varsa blok yerine canlı vurulur. Menzil 3,5 blok.
  - Elle vuruş 1 hasar (alet gelince değişir), 0,5 sn hasarsızlık. Canlı 0,3 sn kırmızılaşır, 5 birim/sn geri itilir; vurulan hayvan 4 sn boyunca 2 kat hızla kaçar.
  - Can 0 olunca canlı 0,5 sn yana devrilip kaybolur. (Eşya düşürme madde 13'te.)
  - İmleç bir canlının üstündeyken blok çerçevesi gizlenir.
- **Kabul ölçütü:** İneğe birkaç kez vurunca kırmızı yanıp sönüp kaçıyor, 10 vuruşta devrilip yok oluyor.
- **Bağımlılık:** 5

### 8. Zombi
- **Minecraft'ta:** Geceleri karanlıkta doğar, oyuncuyu görünce peşine düşer ve yakın dövüşle vurur.
- **Bu oyunda:**
  - Görünüş: oyuncu modelinin yeşil tenli, mavi gömlekli hali; kollar öne uzanık. Can 20.
  - Gece (madde 3) her 10 sn'de oyuncudan 16–32 blok uzakta, açık havada doğabilir; düşman sınırı 8.
  - 16 blok içinde oyuncuyu görürse 2,3 blok/sn ile üstüne yürür; 1,2 blok içindeyse saniyede bir 3 hasar (1,5 kalp) verir ve oyuncuyu geri iter.
  - Oyuncudan 64 bloktan uzaklaşan düşmanlar silinir.
- **Kabul ölçütü:** Gece olunca zombiler çıkıyor, oyuncuyu kovalıyor, yaklaşınca kalpler gidiyor; zombi vurularak öldürülebiliyor.
- **Bağımlılık:** 1, 3, 7

### 9. İskelet
- **Minecraft'ta:** Gece doğar, uzaktan yayla ok atar, oyuncuya belli bir mesafede durmaya çalışır.
- **Bu oyunda:**
  - Görünüş: ince, kemik beyazı kutulardan (kol ve bacak 2 piksel kalınlığında), elinde kahverengi yay. Can 20.
  - Oyuncu 16 blok içinde ve arada blok yoksa (ışınla kontrol) oyuncuya 8 blok mesafede durmaya çalışır; 4 bloktan yakına gelirse geri çekilir.
  - Her 2 sn'de bir ok atar: ok küçük bir çubuk modeli, 20 blok/sn hız, hafif yerçekimi; oyuncuya değerse 3 hasar, bloğa değerse 3 sn takılı kalıp kaybolur.
  - Doğma kuralı zombiyle aynı; gece doğan düşmanların %40'ı iskelet.
- **Kabul ölçütü:** Gece iskelet uzaktan ok atıyor, oklar uçarken görünüyor, değince can gidiyor; bir duvarın arkasına saklanınca atış duruyor.
- **Bağımlılık:** 8

### 10. Örümcek
- **Minecraft'ta:** Gece saldırgandır, duvarlara tırmanır ve oyuncuya atlayarak saldırır.
- **Bu oyunda:**
  - Görünüş: siyah-koyu gri, yassı ve geniş gövde (1,4 × 0,9 blok), 8 ince bacak, kırmızı gözler. Can 16.
  - Önünde blok varsa 2 blok/sn ile dikey tırmanır.
  - 3 blok içine girince oyuncuya doğru sıçrar; değerse 2 hasar.
  - Gece doğan düşmanların %20'si örümcek.
- **Kabul ölçütü:** Örümcek bir duvara tırmanıp oyuncuya ulaşıyor ve sıçrayarak vuruyor.
- **Bağımlılık:** 8

### 11. Creeper (patlayan yaratık)
- **Minecraft'ta:** Sessizce yaklaşır, tıslayıp yanıp söner ve patlayarak blokları ve oyuncuyu yaralar.
- **Bu oyunda:**
  - Görünüş: yeşil benekli uzun gövde, 4 kısa bacak, kodla çizilmiş üzgün yüz. Can 20.
  - Oyuncuya 3 blok kalınca durur, 1,5 sn beyaz yanıp söner ve şişer; oyuncu 5 bloktan uzaklaşırsa iptal eder.
  - Patlama: 3 blok yarıçapında küre içindeki blokları siler (y = 0 tabanı hariç), ilgili chunk'ları yeniden kurar; oyuncuya merkezden uzaklığa göre en çok 12 hasar.
  - Gece doğan düşmanların %15'i creeper.
- **Kabul ölçütü:** Creeper yaklaşınca yanıp sönüyor, kaçılmazsa patlayıp yerde krater açıyor ve can gidiyor.
- **Bağımlılık:** 8

### 12. Düşmanların gün ışığında yanması
- **Minecraft'ta:** Zombi ve iskelet sabah açık havada kalırsa yanar ve ölür.
- **Bu oyunda:**
  - Gündüz başında, başının üstünde blok olmayan (sütun boyunca hava) zombi ve iskelet her saniye 1 hasar alır.
  - Yanarken üstünde basit turuncu-kırmızı kutu parçacıklar yükselir.
  - Örümcek gündüz saldırganlığını bırakır, hayvan gibi dolaşır; creeper etkilenmez.
- **Kabul ölçütü:** Sabah olunca açıktaki zombi ve iskeletler alev parçacıklarıyla yanıp ölüyor, ağaç altındakiler yaşıyor.
- **Bağımlılık:** 9, 10

---

## 3. Envanter ve üretim

### 13. Eşya düşmesi ve toplama
- **Minecraft'ta:** Kırılan blok küçük, dönen bir eşya olarak yere düşer; yaklaşınca oyuncu onu toplar.
- **Bu oyunda:**
  - Blok kırılınca yerine 0,25 boyunda, yavaşça dönen ve hafifçe inip kalkan mini küp düşer (aynı dokuyla). Yaprak kırılınca %10 olasılıkla düşer, yoksa hiçbir şey.
  - Ölen hayvan eşya düşürür: inek 1–3 çiğ biftek, domuz 1–3 çiğ domuz eti, tavuk 1 çiğ tavuk + 0–2 tüy, koyun 1 yün. Zombi 0–2 çürük et, iskelet 0–2 kemik + 0–2 ok. Eşya dokuları kodla çizilir.
  - Oyuncu 1,5 blok içine girince eşya ona doğru çekilir ve toplanır (madde 14 gelene kadar sadece sayaç olarak tutulur). 5 dakika toplanmayan eşya kaybolur.
- **Kabul ölçütü:** Kırılan blok yerde dönen küçük küp olarak duruyor, üstünden geçince kayboluyor; ölen inekten biftek düşüyor.
- **Bağımlılık:** 7

### 14. Sınırlı hotbar ve envanter ekranı
- **Minecraft'ta:** Eşyalar sayılı tutulur (bir yuvada en çok 64), E ile 9 hotbar + 27 yuvalık envanter açılır, eşyalar sürüklenip taşınır.
- **Bu oyunda:**
  - Sınırsız blok kalkar: hotbar 9 yuva + 27 yuvalık çanta. Her yuva `{tür, adet}`; bloklar 64'e, aletler 1'e kadar yığılır. Yuvada adet sağ altta yazar.
  - Blok koyunca adet 1 azalır, 0 olunca yuva boşalır. Toplanan eşya önce aynı türdeki yuvaya, sonra ilk boş yuvaya gider; yer yoksa yerde kalır.
  - E tuşu envanter panelini açar/kapatır (fare kilidi bırakılır, oyun dünyası durmaz). Tıklayarak eşya al/bırak; sağ tıkla yarısını al. Q ile seçili eşyadan 1 tane öne atılır.
  - Yeni oyuncu boş envanterle başlar. Kayıt (madde 4) envanteri de saklar.
- **Kabul ölçütü:** Toprak kazınca hotbar'da "Toprak 5" gibi sayı artıyor, koyunca azalıyor; E ile açılan ekranda eşyalar yuvalar arasında taşınabiliyor; sayfa yenileyince envanter duruyor.
- **Bağımlılık:** 4, 13

### 15. Blok kırma süresi ve çatlama
- **Minecraft'ta:** Blok, sol tık basılı tutulunca türüne göre bir sürede kırılır; bu sırada üstünde çatlaklar büyür.
- **Bu oyunda:**
  - Elle kırma süreleri: yaprak 0,3 sn, toprak/çimen/kum 0,75 sn, tahta/kütük 3 sn, taş/kırık taş/tuğla 7,5 sn (aletle madde 17'de kısalır). Taş grubu elle kırılınca eşya düşürmez.
  - Basılı tutarken hedef bloğun üstünde 10 aşamalı, kodla çizilmiş koyu çatlak dokusu (bloktan 0,002 büyük kaplama kutu). Hedef değişirse ya da tuş bırakılırsa ilerleme sıfırlanır.
  - Kol vurma animasyonu basılı tutulduğu sürece tekrar eder.
- **Kabul ölçütü:** Toprak yarım saniyede, taş uzun sürede kırılıyor ve çatlaklar giderek büyüyor; elle kırılan taş envantere gelmiyor.
- **Bağımlılık:** 14

### 16. Üretim (crafting) ve çalışma masası
- **Minecraft'ta:** Envanterdeki 2×2 ızgarada ve çalışma masasındaki 3×3 ızgarada malzemeler tarife göre dizilip yeni eşya üretilir.
- **Bu oyunda:**
  - Envanter ekranına 2×2 üretim ızgarası ve sonuç yuvası. Sağ tıkla konulan çalışma masası bloğu (yeni doku: üstü ızgaralı tahta) 3×3 ızgara açar.
  - Tarifler (şekilli, kaydırılabilir): 1 kütük → 4 tahta; 2 dikey tahta → 4 çubuk; 2×2 tahta → çalışma masası; çubuk üstüne kömür → 4 meşale; 3×3 çerçeve kırık taş → fırın; 4 kum → kumtaşı (yeni blok); aletler madde 17'deki tariflerle.
  - Sonuç yuvasına tıklayınca malzemeler birer azalır. Panel kapanınca ızgaradakiler envantere döner.
- **Kabul ölçütü:** Kütükten tahta, tahtadan çalışma masası üretilip yere konuluyor; masaya sağ tıklayınca 3×3 ızgara açılıyor.
- **Bağımlılık:** 14

### 17. Aletler: kazma, balta, kürek, kılıç
- **Minecraft'ta:** Aletler doğru blok türünü hızlı kırar, kılıç daha fazla hasar verir; aletlerin dayanıklılığı vardır.
- **Bu oyunda:**
  - Tahta ve taş seviyeleri, 4 tür = 8 alet. Klasik tarifler (ör. kazma: üst sırada 3 malzeme, ortada 2 çubuk). Dokular kodla çizilir; elde tutulunca kol modelinde ve 3. şahıs modelinde görünür.
  - Hız çarpanı: tahta ×2, taş ×4 (kazma → taş grubu, balta → tahta/kütük, kürek → toprak/kum/çimen). Taş grubu yalnızca kazmayla eşya düşürür.
  - Kılıç hasarı: tahta 4, taş 5; diğer aletler 2–3. Dayanıklılık tahta 60, taş 132 kullanım; yuvada küçük yeşil-kırmızı çubuk gösterir, bitince alet kırılır.
- **Kabul ölçütü:** Tahta kazmayla taş kırılıp kırık taş envantere geliyor; taş kılıçla zombi 4 vuruşta ölüyor; alet kullanıldıkça dayanıklılık çubuğu azalıyor.
- **Bağımlılık:** 15, 16

### 18. Açlık barı ve yemek
- **Minecraft'ta:** 20 puanlık açlık barı hareketle azalır; yemek yiyerek doldurulur; açlık doluysa can yenilenir, sıfırsa can azalır.
- **Bu oyunda:**
  - Can barının sağında 10 but simgesi (`player.food` = 20). Her 30 sn'de 1, koşarken her 15 sn'de 1 azalır.
  - Can yenilenmesi (madde 1) artık açlık ≥ 18 iken çalışır; açlık 0 ise her 4 sn'de 1 hasar (can 1'in altına inmez). Açlık ≤ 6 iken koşulamaz.
  - Eldeki yemekle sağ tık 1,6 sn basılı tutulunca yenir: çiğ et 2–3, pişmiş et 6–8, ekmek 5, elma 4 puan. Yaprak kırılınca %5 elma düşsün.
  - Açlık kayda yazılır.
- **Kabul ölçütü:** Koştukça butlar azalıyor; eti yiyince doluyor; açlık sıfırken kalpler yavaşça gidiyor.
- **Bağımlılık:** 14

### 19. Fırın ve pişirme
- **Minecraft'ta:** Fırına yakıt ve hammadde konur; bir süre sonra pişmiş et, cam veya taş çıkar.
- **Bu oyunda:**
  - Fırın bloğu (ön yüzü ağızlı, yanarken turuncu ışıklı doku). Sağ tıkla 3 yuvalı panel: girdi, yakıt, çıktı ve ilerleme oku.
  - Tarifler, her biri 5 sn: çiğ et → pişmiş et, kum → cam, kırık taş → taş, kütük → odun kömürü. Yakıt: kömür 8, kütük/tahta 1,5 eşya pişirir.
  - Panel kapalıyken de pişirme sürer; fırın içerikleri kayda yazılır.
- **Kabul ölçütü:** Fırına kum ve kömür konunca bir süre sonra çıktı yuvasında cam beliriyor; çiğ et pişmiş ete dönüşüyor.
- **Bağımlılık:** 16

---

## 4. Dünya

### 20. Maden cevherleri
- **Minecraft'ta:** Taşın içinde kömür, demir ve daha değerli madenler damarlar halinde bulunur.
- **Bu oyunda:**
  - Yeni bloklar: kömür cevheri (taş + siyah benekler), demir cevheri (taş + bej benekler). Dünya üretiminde taş içine 3–8 bloklık damarlar halinde: kömür y ≤ 30, chunk başına ~8 damar; demir y ≤ 20, chunk başına ~4 damar.
  - Kömür cevheri kazmayla kırılınca 1 kömür düşürür; demir cevheri taş kazmayla kırılınca kendisi düşer, fırında demir külçeye erir.
  - Yeni dünyada uygulanır; kayıtlı dünyalar etkilenmez.
- **Kabul ölçütü:** Yamaçlarda ve kazınca taş içinde kömür ve demir benekli bloklar görülüyor; kömür kazınca envantere kömür geliyor.
- **Bağımlılık:** 17 (kömür ve külçe kullanımı için 16, 19)

### 21. Su
- **Minecraft'ta:** Alçak yerlerde göller ve deniz vardır; su yarı saydamdır, içinde yüzülür ve yavaş hareket edilir.
- **Bu oyunda:**
  - Yeni blok: su (mavi, %60 opak, ayrı saydam malzeme ve ayrı mesh). Dünya üretiminde y ≤ 12 olan tüm boşluklar suyla dolar (kumlu alçak bölgeler göl olur).
  - Su katı değildir: çarpışmaya girmez ama nişan ışını içinden geçer. Su yüzeyinde komşu su yüzü çizilmez.
  - Suyun içinde yerçekimi 1/4, hız %50; Boşluk basılıyken yukarı yüzülür. Kafa su içindeyse ekran mavi tonlanır, sis 8 bloğa iner.
  - Akan su yok: konulan su bloğu durduğu yerde kalır (kova ileride).
- **Kabul ölçütü:** Alçak yerlerde göller var; suya girince yavaşlanıyor, Boşlukla yüzeye çıkılıyor, su altındayken görüş maviye dönüyor.
- **Bağımlılık:** yok

### 22. Meşale ve basit ışık
- **Minecraft'ta:** Meşale yere ya da duvara konur, çevresini aydınlatır ve yakınında canavar doğmaz.
- **Bu oyunda:**
  - Meşale bloğu: küçük çubuk + alevli tepe modeli (tam blok değil, çarpışmasız), yere ya da duvara yaslanır.
  - Aydınlatma: chunk mesh kurulurken her yüzün vertex rengi, 7 blok içindeki en yakın meşaleye uzaklığa göre gece karanlığından bağımsız olarak aydınlanır (sıcak sarı ton). Gece karartmasında (madde 3) meşale ışığı karartılmaz.
  - Meşaleye 8 blok mesafede düşman doğmaz.
- **Kabul ölçütü:** Gece meşale konan yerin çevresi sarımsı aydınlık kalıyor, uzak yerler karanlık; meşalenin yanında zombi doğmuyor.
- **Bağımlılık:** 3, 16 (tarifteki kömür için 19 ya da 20)

### 23. Yatak
- **Minecraft'ta:** Gece yatakta uyunca sabaha atlanır ve doğma noktası yatağın yanı olur.
- **Bu oyunda:**
  - Tarif: 3 yün + 3 tahta. Yatak 2 blok uzunluğunda, yarım blok yüksekliğinde kırmızı-beyaz model.
  - Gece sağ tıklanınca ekran 2 sn kararır, saat sabaha (06:00) atlar. Gündüz tıklanırsa "Sadece gece uyuyabilirsin", 8 blok içinde düşman varsa "Yakınlarda canavar var" yazar.
  - Yatağa tıklanınca doğma noktası yatağın yanı olur ve kayda yazılır; ölünce oraya doğulur.
- **Kabul ölçütü:** Gece yatağa tıklayınca sabah oluyor; ölünce yatağın yanında doğuluyor.
- **Bağımlılık:** 2, 6, 16

### 24. Kapı ve cam
- **Minecraft'ta:** Tahta kapı sağ tıkla açılıp kapanır; cam saydam yapı bloğudur.
- **Bu oyunda:**
  - Kapı: 2 blok yüksekliğinde, 3/16 kalınlığında; tarif 6 tahta → 3 kapı. Sağ tıkla 90° döner; kapalıyken çarpışır, açıkken geçilir. Düşmanlar kapıyı açamaz.
  - Cam: fırında kumdan çıkar (madde 19); kenarları açık gri çerçeveli, içi saydam doku; arkadaki bloklar görünür (saydam blokların yüzleri komşu katı blokları gizlememeli).
- **Kabul ölçütü:** Kapılı bir ev yapılıp kapı açılıp kapanabiliyor; cam pencereden dışarısı görünüyor.
- **Bağımlılık:** 16 (cam için 19)

### 25. Çiçek, uzun ot ve süs bitkileri
- **Minecraft'ta:** Çimen üstünde uzun otlar ve renkli çiçekler bulunur; tek vuruşta kırılır.
- **Bu oyunda:**
  - Yeni bloklar: uzun ot, gelincik (kırmızı), karahindiba (sarı). Çapraz iki düzlem (X şeklinde) olarak çizilir, çarpışmasız, saydam arka plan.
  - Dünya üretiminde çimenlerin %12'sine uzun ot, %2'sine çiçek.
  - Anında kırılır; uzun ot %12 olasılıkla buğday tohumu düşürür (madde 26 için).
- **Kabul ölçütü:** Çimenlik alanlar ot ve çiçeklerle dolu, içlerinden geçilebiliyor, tek tıkla kırılıyor.
- **Bağımlılık:** yok

### 26. Buğday tarımı ve ekmek
- **Minecraft'ta:** Çapayla toprak sürülür, tohum ekilir, buğday zamanla büyür; 3 buğdaydan ekmek yapılır.
- **Bu oyunda:**
  - Tahta çapa (2 tahta + 2 çubuk); çimen/toprağa sağ tıkla tarla bloğu (koyu, çizgili üst doku) olur.
  - Tarlaya tohum ekilir; 4 büyüme aşaması, her aşama ortalama 60 sn (oyun açıkken). Olgun buğday kırılınca 1 buğday + 1–3 tohum, olgunlaşmamışsa yalnızca tohum.
  - 3 yatay buğday → ekmek (açlığa 5).
  - Ekin aşamaları kayda yazılır.
- **Kabul ölçütü:** Tohum ekilip birkaç dakika beklenince buğday sararıyor, toplanıp ekmeğe dönüşüyor ve yeniyor.
- **Bağımlılık:** 18, 25

### 27. Mağaralar
- **Minecraft'ta:** Yerin altında kıvrımlı mağaralar ve açık maden alanları vardır.
- **Bu oyunda:**
  - Dünya üretiminde 3B gürültüyle (mevcut `valueNoise` mantığını 3B'ye genişlet) y = 2 ile yüzeyin 4 altı arasında tüneller oyulur; bazıları yamaçta ağız açar.
  - Mağara içinde gece/gündüz fark etmeksizin düşman doğabilir (gökyüzü görünmeyen, meşalesiz yerler).
  - Yeni dünyada uygulanır.
- **Kabul ölçütü:** Yeni dünyada yamaçlarda mağara ağızları var, içeride tüneller ve duvarlarda cevherler görünüyor.
- **Bağımlılık:** 20 (düşman doğması için 8)

---

## 5. Görsel, ses ve arayüz

### 28. Ses efektleri (WebAudio)
- **Minecraft'ta:** Kırma, koyma, adım, hasar ve hayvanların kendi sesleri vardır.
- **Bu oyunda:**
  - Tek `AudioContext` (ilk "Oyna" tıklamasında açılır). Hepsi kodla üretilir: gürültü + filtre ile kırma/koyma (bloğun türüne göre farklı filtre frekansı), adım sesi (0,4 sn'de bir, koşarken 0,3), hasar sesi, eşya toplama "pop" sesi.
  - Hayvan sesleri osilatörle: inek alçak "mö", domuz kısa hırıltı, tavuk tiz "gıt", koyun titreşimli "mee"; zombi inleme. 16 blok içindekiler, uzaklıkla azalan ses seviyesi.
  - Duraklat panelinde ses aç/kapa düğmesi (ayar kayda yazılır).
- **Kabul ölçütü:** Yürürken adım, kırarken çıtırtı sesi geliyor; ineğe yaklaşınca böğürüyor, uzaklaşınca ses kısılıyor.
- **Bağımlılık:** 5 (hayvan sesleri için 6, 8)

### 29. Kırılma parçacıkları
- **Minecraft'ta:** Blok kırılırken ve kırılınca bloğun dokusundan küçük parçalar saçılır.
- **Bu oyunda:**
  - Blok kırılınca 12 parça: 0,1 boyunda, bloğun dokusundan rastgele bir kesit taşıyan küçük kareler; rastgele hızla saçılır, yerçekimiyle düşer, 0,8 sn'de kaybolur.
  - Kırma sırasında (madde 15) her 0,2 sn'de 2 küçük parça.
  - Aynı anda en çok 200 parça (eskiler silinir).
- **Kabul ölçütü:** Çimen kırınca yeşil-kahverengi, taş kırınca gri parçalar saçılıyor.
- **Bağımlılık:** yok (kırma sırasındaki parçalar için 15)

### 30. Duraklat menüsü ve ayarlar
- **Minecraft'ta:** Esc ile oyun durur; ayarlar, görüş mesafesi, fare hassasiyeti ve kaydedip çıkma seçenekleri vardır.
- **Bu oyunda:**
  - Oyun başladıktan sonra Esc paneli "Devam et", "Ayarlar", "Kaydet", "Yeni dünya" düğmelerini gösterir.
  - Ayarlar: fare hassasiyeti (kaydırıcı, varsayılan mevcut 0,0025), görüş alanı FOV 60–100, sis/görüş mesafesi (kısa 40, normal 70, uzak 120 blok), ses açık/kapalı, Y eksenini ters çevir.
  - Ayarlar kayıttan ayrı olarak IndexedDB'de (aynı veritabanı, anahtar `settings`) saklanır; "Yeni dünya" ayarları silmez.
- **Kabul ölçütü:** Fare hassasiyeti ve görüş mesafesi değiştirilince hemen etkili oluyor; sayfa yenilenince ayarlar korunuyor.
- **Bağımlılık:** 4

### 31. Bulutlar ve yıldızlar
- **Minecraft'ta:** Gökyüzünde yavaşça kayan blok blok bulutlar, gece ise yıldızlar vardır.
- **Bu oyunda:**
  - y = 60'ta, 4×4 bloğa denk gelen beyaz düz kutulardan bulut katmanı; gürültüyle şekillenir, 0,6 blok/sn hızla doğuya kayar, oyuncuyla birlikte tekrarlanır (dünyanın dışına da uzanır). Gece grileşir.
  - Gece 400 noktalık yıldız katmanı (`THREE.Points`), gün doğumunda solar.
- **Kabul ölçütü:** Gündüz bulutlar yavaşça kayıyor; gece gökyüzünde yıldızlar görünüyor.
- **Bağımlılık:** 3

### 32. Hasar ve ölüm geri bildirimleri
- **Minecraft'ta:** Hasar alınca kamera sarsılır, can azken kalpler titrer; canlılar ölünce duman çıkar.
- **Bu oyunda:**
  - Oyuncu hasar alınca kamera 0,2 sn yana yatar (roll ±0,1 rad).
  - Can ≤ 4 iken kalpler her 0,5 sn hafifçe titrer, ekran kenarları kırmızımsı karanlık olur.
  - Canlı ölünce 8 gri duman parçacığı yükselip kaybolur.
- **Kabul ölçütü:** Zombi vurunca ekran sarsılıyor; canın azken kalpler titriyor; öldürülen hayvandan duman çıkıyor.
- **Bağımlılık:** 7 (parçacıklar için 29)

---

## 6. Nether

Bu üç madde, ana dünya ve kayıt sistemi oturduktan sonra yapılmalı. Nether, ana dünyayla aynı boyutta (96×96×48) ikinci bir dünya dizisi olarak tutulur; iki dünya arasında geçiş, aynı sahnedeki chunk mesh'lerini silip diğer dünyadan yeniden kurmakla yapılır.

### 33. Obsidyen ve Nether portalı
- **Minecraft'ta:** Obsidyenden 4×5'lik bir çerçeve kurulur, çakmakla yakılınca içi mor portal olur; içinde birkaç saniye durunca Nether'e geçilir.
- **Bu oyunda:**
  - Yeni blok: obsidyen (çok koyu mor-siyah doku). Dünya üretiminde y ≤ 8 seviyesinde, mağara tabanlarına 2–4 blokluk küçük öbekler (chunk başına ~1). Yalnızca demir kazmayla (madde 17'ye "demir kazma: 3 demir külçe + 2 çubuk" eklenir) 6 sn'de kırılır, kendisi düşer.
  - Yeni eşya: çakmak (1 demir külçe + 1 kömür, basitleştirilmiş tarif). Çakmak eldeyken obsidyen çerçevenin iç tabanına sağ tıklanınca: iç boşluğu tam 2×3 olan, köşeleri isteğe bağlı dikey bir obsidyen çerçeve varsa iç kısım portal bloklarıyla dolar.
  - Portal bloğu: yarı saydam mor, dokusu zamanla kayan (UV her karede kaydırılır), çarpışmasız, ince (dikey düzlem). Çerçevenin bir obsidyeni kırılınca portal kaybolur.
  - Oyuncu portal bloğunun içinde 3 sn kesintisiz durursa ekran mora dönüp kararır ve diğer dünyaya geçer (madde 34). Bu sürede HUD'da "Portal: 2…" gibi geri sayım görünür.
- **Kabul ölçütü:** Mağarada obsidyen bulunup demir kazmayla kazılıyor; 4×5'lik çerçeve kurulup çakmakla yakılınca mor, dalgalanan portal oluşuyor; içinde 3 sn durunca ekran kararıyor.
- **Bağımlılık:** 4, 16, 17, 19, 27

### 34. Nether boyutu
- **Minecraft'ta:** Kızıl taştan (netherrack) oluşan, lav denizleri ve parlayan taşlar barındıran, gökyüzü olmayan sıcak bir boyuttur.
- **Bu oyunda:**
  - İkinci dünya dizisi `nether`, ayrı bir tohumla üretilir: tavan (y 40–47) ve taban (y 0–10) netherrack; arası 3B gürültüyle oyulmuş büyük boşluklar; y ≤ 10'daki boşluklar lav.
  - Yeni bloklar: netherrack (koyu kırmızı benekli), lav (turuncu-sarı, kendi ışığı olan, ışıktan etkilenmeyen malzeme; çarpışmasız, içine girince saniyede 4 hasar ve oyuncu yanar), ışıltı taşı (glowstone; tavanda öbekler, sarı, kendi ışığı olan; kırılınca 2–4 ışıltı tozu düşer, 4 toz → 1 ışıltı taşı).
  - Ortam: gökyüzü ve sis koyu kırmızı (#3a0f0f), sis 12–40 blok; gece/gündüz döngüsü Nether'de durur, bulut ve yıldız gizlenir. Yatak Nether'de kullanılırsa patlar (madde 23'e not; basit hali: "Burada uyuyamazsın" yazısı ve 6 hasar).
  - Geçiş: ana dünyadaki portaldan girince Nether'de aynı X/Z'ye en yakın uygun boşluğa yeni bir obsidyen çerçeveli yanık portal kurulur ve oyuncu onun önüne konur. Nether'deki portal da ana dünyaya, girilen portala döndürür. (Minecraft'taki 8:1 ölçek yok.)
  - Kayıt: Nether dünyası, oyuncunun hangi dünyada olduğu ve iki portalın konumu IndexedDB kaydına eklenir (`version` artırılır).
- **Kabul ölçütü:** Portaldan geçince kırmızı, karanlık, lav denizli bir mağara dünyası açılıyor; tavanda parlayan ışıltı taşları görülüyor; lava girince can gidiyor; aynı portaldan ana dünyaya dönülüyor ve sayfa yenilenince oyuncu kaldığı dünyada açılıyor.
- **Bağımlılık:** 33 (lav ışığı için 22)

### 35. Nether yaratıkları
- **Minecraft'ta:** Nether'de domuz adam zombileri (vurulmadıkça saldırmaz), havada uçup ateş topu atan ghast'lar ve ateş saçan blaze'ler bulunur.
- **Bu oyunda (basit hali):**
  - **Zombi domuz adam:** pembe-yeşil bloklu insan modeli (madde 8'deki zombi modelini yeniden kullan), elinde altın kılıç rengi kutu. Nötr: vurulana kadar dolaşır; vurulunca o ve 16 blok içindekiler 30 sn boyunca oyuncuya saldırır (3 hasar). Can 20, ölünce 0–1 çürük et.
  - **Ghast:** 4×4×4 beyaz küp, altında 9 sarkan dokunaç (ince kutular, sallanır). Boşlukta yavaşça uçar; oyuncuyu 20 blok içinde görünce her 3 sn'de bir ateş topu atar. Ateş topu: turuncu küp, 8 blok/sn düz gider; oyuncuya değerse 5 hasar, bloğa değerse küçük bir patlama (madde 11'deki creeper patlamasını yarıçap 1 ile yeniden kullan). Ateş topuna vurulursa geri döner. Can 10.
  - Doğma: yalnızca Nether'de, gece/gündüz bağımsız; aynı anda en çok 6 zombi domuz adam ve 2 ghast; oyuncuya 24 bloktan yakın yerde doğmaz.
  - Blaze ve Nether kalesi bu maddede yok.
- **Kabul ölçütü:** Nether'de zombi domuz adamlar dolaşıyor, biri vurulunca grup saldırıyor; ghast uzaktan ateş topu atıyor, top bloklarda küçük delik açıyor, vurulunca geri dönüyor.
- **Bağımlılık:** 34, 7, 8, 11

---

## 7. Gelişmiş özellikler

Bu maddeler listenin geri kalanından sonra gelir; her biri öncekilerden biraz daha büyüktür. **42. madde (sonsuz dünya) dünyanın veri yapısını baştan değiştirir.** Ne kadar geç yapılırsa o kadar çok mevcut kodun (üretim, kayıt, canlı doğması, Nether) uyarlanması gerekir. İstersen 42'yi 4'ten hemen sonra yaptırabilirsin; o zaman sonraki maddelere "dünya chunk haritasında tutuluyor" diye not düş.

### 36. Sandık
- **Minecraft'ta:** Sandık 27 yuvalı bir depolama bloğudur; sağ tıkla açılır.
- **Bu oyunda:**
  - Tarif: 8 tahta, ortası boş halka. Model: kahverengi, ortasında koyu kilit çizgisi olan tam blok.
  - Sağ tıkla açılır: envanter ekranının (madde 14) üstünde 27 yuvalı sandık paneli çıkar; eşyalar envanterle aynı tıklama/taşıma kurallarıyla iki panel arasında taşınır.
  - Sandık kırılınca içindekiler yere eşya olarak saçılır (madde 13).
  - İçerikler konumla anahtarlanıp (`"x,y,z"`) kayda yazılır.
- **Kabul ölçütü:** Sandığa eşya konup sayfa yenilenince eşyalar hâlâ içinde; sandık kırılınca eşyalar yere saçılıyor.
- **Bağımlılık:** 4, 13, 14, 16

### 37. Elmas, demir ve elmas aletler
- **Minecraft'ta:** Elmas derinlerde nadir bulunur; demir ve elmas aletler daha hızlı kırar, daha çok hasar verir ve daha dayanıklıdır.
- **Bu oyunda:**
  - Yeni blok: elmas cevheri (taş + açık turkuaz benekler). Dünya üretiminde y ≤ 10, chunk başına ~1 damar, 1–4 blok. Yalnızca demir ya da elmas kazmayla kırılınca 1 elmas düşer.
  - Madde 17'deki aletlere demir (madde 33'teki demir kazma dahil 4 alet, malzeme demir külçe) ve elmas seviyesi eklenir; tarif desenleri aynıdır.
  - Hız çarpanı: tahta ×2, taş ×4, demir ×6, elmas ×8. Kılıç hasarı: demir 6, elmas 7. Dayanıklılık: demir 251, elmas 1562 kullanım.
  - Obsidyen artık elmas kazmayla da kırılır (elmasla 4,5 sn: 36 / 8).
- **Kabul ölçütü:** Derinde elmas cevheri bulunuyor; taş kazmayla kırılınca bir şey düşmüyor, demir kazmayla elmas düşüyor; elmas kazma taşı gözle görülür hızda kırıyor.
- **Bağımlılık:** 17, 20, 33

### 38. Zırh
- **Minecraft'ta:** Kask, göğüslük, pantolon ve bottan oluşan zırh alınan hasarı azaltır ve karakterin üstünde görünür.
- **Bu oyunda:**
  - Demir ve elmas zırh (deri ve altın yok). Tarifler Minecraft deseninde: kask 5, göğüslük 8, pantolon 7, bot 4 külçe ya da elmas.
  - Envanter ekranında 4 zırh yuvası; zırh yalnızca kendi yuvasına konur.
  - Zırh puanı: demir 2/6/5/2 (toplam 15), elmas 3/8/6/3 (toplam 20). Canlılardan gelen hasar `hasar × (1 − puan × 0,04)` olur; düşme ve lav hasarı azalmaz. HUD'da kalplerin üstünde 10 zırh simgesi (her simge 2 puan).
  - Her hasar alındığında giyili her parçanın dayanıklılığı 1 azalır (demir 165, elmas 363), bitince parça kırılır.
  - Oyuncu modelinde parçalar, ilgili vücut kutusundan 1 piksel büyük renkli kutular olarak görünür (demir açık gri, elmas turkuaz).
- **Kabul ölçütü:** Demir göğüslük giyince karakterin gövdesi gri görünüyor, HUD'da zırh simgeleri çıkıyor, zombi vuruşu daha az can götürüyor.
- **Bağımlılık:** 1, 14, 16, 19, 37

### 39. Yay ve ok
- **Minecraft'ta:** Yay basılı tutularak gerilir, bırakılınca ok atılır; ne kadar gerilirse ok o kadar hızlı gider.
- **Bu oyunda:**
  - Yeni eşyalar: ip (örümcekten 0–2 düşer, madde 10'a eklenir), tüy (tavuktan 0–2 düşer, madde 6'ya eklenir). Yay: 3 çubuk + 3 ip. Ok: 1 kırık taş + 1 çubuk + 1 tüy → 4 ok (Minecraft'taki çakmaktaşı yerine kırık taş).
  - Yay eldeyken sağ tık basılı tutulunca 1 sn'ye kadar gerilir: FOV hafifçe daralır, gözden görünümde kol geri çekilir, 3. şahısta iki kol öne uzanır. Bırakınca envanterde ok varsa bir ok atılır: hız gerilmeye göre 10–30 blok/sn, yerçekimi 20.
  - Ok canlıya değerse hıza göre 2–9 hasar ve geri itme verir; bloğa saplanır, 60 sn kalır, oyuncu üstüne yürürse envantere geri alınır.
  - Madde 9'daki iskelet okları aynı ok koduna taşınır (iskelet okları toplanamaz).
- **Kabul ölçütü:** Yay gerilip bırakılınca ok kavis çizerek uçuyor; tam gerilmiş ok ineği bir-iki vuruşta öldürüyor; duvara saplanan ok yürüyerek toplanabiliyor.
- **Bağımlılık:** 6, 7, 9, 10, 13, 16

### 40. Kova, akan su ve lav
- **Minecraft'ta:** Kovayla su ve lav taşınır; su ve lav yayılarak akar, birleşince taşa ya da obsidyene dönüşür.
- **Bu oyunda:**
  - Kova: 3 demir külçe, V şeklinde. Boş kovayla su ya da lav kaynağına sağ tıklanınca dolu kova olur; dolu kovayla sağ tıklanınca hedef yüzün önüne kaynak bloğu konur ve kova boşalır.
  - Her sıvı bloğunun seviyesi vardır: 0 kaynak, 1–7 akan. Su her 0,25 sn'de bir adım akar: altı boşsa aşağı (seviye 1), değilse dört yana seviye + 1 (en çok 7). Lav aynı kuralla 1,5 sn'de bir akar; ana dünyada en çok 3, Nether'de 7 seviyeye yayılır.
  - Kaynağı kesilen akan bloklar sırayla çekilir. İki su kaynağına komşu boşluk yeni su kaynağı olur.
  - Su lav kaynağına değerse obsidyen, akan lava değerse kırık taş oluşur.
  - Akan sıvının üst yüzü seviyesi kadar alçak çizilir.
  - Performans: güncellemeler yalnızca değişen blokların çevresinde bir kuyrukla yapılır, bütün dünya taranmaz; bir karede en çok 2 chunk yeniden kurulur.
- **Kabul ölçütü:** Kovayla alınan su bir tepeye dökülünce aşağı ve yanlara akıyor; kova geri alınınca su çekiliyor; su lava akınca obsidyen oluşuyor ve böylece portal yapılabiliyor.
- **Bağımlılık:** 19, 21, 34

### 41. Biyomlar
- **Minecraft'ta:** Dünya ova, orman, çöl, karlı bölge gibi farklı görünen ve farklı canlılar barındıran biyomlara ayrılır.
- **Bu oyunda:**
  - Düşük frekanslı iki gürültüyle (sıcaklık ve nem) 4 biyom: ova (az ağaç, çok ot ve çiçek), orman (sık ağaç), çöl (kum yüzey, altında 3 blok kum taşı, ağaç yerine 1–3 blok kaktüs, hayvan doğmaz), karlı (üstü beyaz karlı çimen, koyu yapraklı ladin ağaçları, göl yüzeyi buz).
  - Yeni bloklar: kum taşı, kaktüs (değince saniyede 1 hasar), karlı çimen, buz (kaygan: üzerinde sürtünme az), ladin kütüğü ve yaprağı.
  - Biyom sınırlarında yükseklik yumuşak geçer. Çimen ve yaprak tepe dokusu biyoma göre vertex rengiyle hafifçe tonlanır (çölde soluk, ormanda koyu).
  - Yeni dünyada uygulanır; 42 yapıldıysa chunk üretimine de bağlanır.
- **Kabul ölçütü:** Yeni bir dünyada yürürken çöl, orman, karlı alan ve ova görülüyor; çölde kaktüse değince can gidiyor; buzun üstünde kayılıyor.
- **Bağımlılık:** 5, 25 (göl buzu için 21)

### 42. Sonsuz dünya
- **Minecraft'ta:** Dünya oyuncu yürüdükçe chunk chunk üretilir; sınırı yoktur.
- **Bu oyunda:**
  - Sabit `world` dizisi yerine `Map<"cx,cz", Uint8Array(16 × 48 × 16)>`; `get` ve `set` bu haritaya yönlendirilir. Dünya kenarındaki görünmez duvar kalkar.
  - Oyuncunun çevresindeki 5 chunk yarıçapı (madde 30'daki görüş ayarına bağlanır) yüklü tutulur. Her karede en çok 1 chunk üretilir ve 2 mesh kurulur; görüşten çıkan chunk mesh'leri sahneden kaldırılır, 12 chunk ötesindeki değişmemiş chunk verileri bellekten silinir.
  - Üretim chunk başına deterministik olur: aynı tohum ve koordinat her zaman aynı chunk'ı verir (yükseklik, ağaç, cevher, mağara, biyom). Ağaçlar chunk kenarından 2 blok içeride üretilir ki komşu chunk'a taşmasın.
  - Kayıt yalnızca oyuncunun değiştirdiği chunk'ları saklar (`version` artırılır; eski tek dizili kayıt açılışta yeni yapıya dönüştürülür).
  - Canlılar yalnızca yüklü chunk'larda doğar ve güncellenir. Nether de aynı yapıya taşınır.
- **Kabul ölçütü:** Aynı yöne 3 dakika koşunca dünya bitmiyor ve oyun takılmıyor; geri dönünce kırılan bloklar yerinde; sayfa yenilenince uzaktaki değişiklikler de korunuyor.
- **Bağımlılık:** 4 (o ana kadar yapılmış tüm üretim maddeleri chunk başına üretime uyarlanır)

### 43. Köyler ve köylü ticareti
- **Minecraft'ta:** Ovalarda evleri, yolları ve kuyusu olan köyler vardır; köylüler zümrüt karşılığında eşya takas eder.
- **Bu oyunda:**
  - Ova biyomunda (yoksa düz çimenlik alanlarda) yaklaşık her 6 chunk'ta 1 köy: 3–5 ev (5×5 taban, tahta ve kırık taş duvar, kapı, cam pencere), aralarında toprak yollar, ortada su kuyusu.
  - Her evde 1 köylü: kahverengi cüppeli, büyük burunlu bloklu model. Gündüz köyde dolaşır, gece kendi evine yürür. Zombiler köylülere de saldırır.
  - Yeni eşya: zümrüt (yalnızca ticaretle elde edilir).
  - Köylüye sağ tıklanınca ticaret paneli açılır; her köylünün şu tablodan rastgele seçilmiş 3 teklifi olur ve kayda yazılır: 20 buğday → 1 zümrüt, 15 kömür → 1 zümrüt, 1 zümrüt → 3 ekmek, 1 zümrüt → 8 ok, 3 zümrüt → demir kazma, 5 zümrüt → demir göğüslük.
- **Kabul ölçütü:** Dünyada evleri ve kuyusu olan bir köy bulunuyor; köylüye buğday verip zümrüt, zümrütle ekmek alınabiliyor; gece zombi köylüye saldırıyor.
- **Bağımlılık:** 8, 14, 24, 26, 41 (ok ve zırh teklifleri için 38, 39)

### 44. Nether kalesi ve blaze
- **Minecraft'ta:** Nether'de koyu tuğladan köprülü, koridorlu kaleler vardır; içinde ateş topu atan blaze'ler doğar ve blaze çubuğu düşürür.
- **Bu oyunda:**
  - Yeni blok: Nether tuğlası (koyu bordo tuğla dokusu). Nether üretiminde dünya başına 1 kale (42 yapıldıysa yaklaşık her 12 chunk'ta 1): 5 blok genişliğinde yüksek köprüler ve 2–3 kapalı oda.
  - Odalardan birinde blaze doğurucu (demir çubuklu kafes bloğu, içinde dönen küçük blaze): oyuncu 16 blok içindeyken her 10 sn'de 1 blaze doğurur, çevresinde en çok 4 blaze.
  - Blaze: sarı-turuncu kafa, etrafında dönen 8 çubuk; havada süzülür, oyuncuyu görünce 3'lü ateş topu atar (her biri 5 hasar ve oyuncuyu 3 sn yakar: saniyede 1 hasar). Can 20; yalnızca vurulunca hasar alır.
  - Ölünce 0–1 blaze çubuğu düşer (şimdilik başka kullanımı yok).
  - Madde 35'teki zombi domuz adamlar kale çevresinde de doğar.
- **Kabul ölçütü:** Nether'de koyu tuğlalı köprüler ve odalar bulunuyor; doğurucunun yanında blaze'ler çıkıp üçlü ateş topu atıyor; öldürülen blaze'den çubuk düşüyor.
- **Bağımlılık:** 7, 34, 35

---

## 8. Sohbet ve rehberler

### 45. Sohbet ve komutlar
- **Minecraft'ta:** T ile sohbet açılır; `/` ile başlayan komutlarla eşya alınır, saat değiştirilir, ışınlanılır.
- **Bu oyunda:**
  - T sohbeti, `/` sohbeti `/` yazılı olarak açar; Enter gönderir, Esc kapatır. Sohbet açıkken oyun durmaz ama oyuncu hareket etmez. Mesajlar sol altta, Minecraft gibi yarı saydam satırlarda görünür ve 10 sn sonra solar (sohbet açıkken hepsi görünür).
  - Komutlar: `/help`, `/give <eşya> [adet]`, `/god` (hasar ve açlık yok, aç/kapat), `/heal`, `/feed`, `/time set day|night|noon|midnight`, `/tp <x> <y> <z>`, `/clear`, `/summon <canlı>`, `/spawnpoint`. Eşya ve canlı adları İngilizce anahtar ya da Türkçe ad olarak yazılabilir. Hatalı komutta açıklayıcı Türkçe mesaj.
- **Kabul ölçütü:** `/give diamond`… gibi bilinmeyen eşyada hata, `/give stone_pickaxe` ile kazma geliyor; `/god` açıkken zombi vurunca can gitmiyor.
- **Bağımlılık:** 14

### 46. Adım adım rehber
- **Minecraft'ta:** Yeni başlayanlar için oyun içi ipuçları ve ilerleme hedefleri vardır.
- **Bu oyunda:**
  - Hiç Minecraft oynamamış birine oyunu adım adım öğreten, oyunla bütünleşik bir rehber: sağ üstte Minecraft tarzı küçük bir görev kartı, o anki adımı ve nasıl yapılacağını (hangi tuş, ne nereye) Türkçe anlatır.
  - Adımlar oyundaki gerçek olaylarla otomatik ilerler (ör. "Bir ağaca bak ve sol tuşu basılı tutarak bir kütük kır" → kütük envantere girince tamamlanır). Önerilen sıra: etrafa bak ve yürü, kütük kır, envanteri aç (E), tahta yap, çalışma masası yap ve koy, çubuk ve tahta kazma yap, taş kaz, taş kazma yap, hayvandan et al ve ye, meşale yap, yatak yap ve gece uyu, kömür ve demir bul, fırında demir erit, demir kazma ve çakmak yap, obsidyen bul ve portal kur, Nether'e geç.
  - Her adımda kısa bir ipucu satırı; tamamlanınca küçük "Tamamlandı" bildirimi ve ses. Rehber H tuşuyla gizlenip gösterilir; ayarlardan kapatılabilir. İlerleme kayda yazılır.
- **Kabul ölçütü:** Yeni dünyada rehber ilk adımı gösteriyor; kütük kırınca bir sonraki adıma geçiyor; sayfa yenilenince kaldığı adımdan devam ediyor.
- **Bağımlılık:** 4, 14, 16 (sonraki adımlar ilgili maddelere)

### 47. Üretim rehberi (tarif kitabı)
- **Minecraft'ta:** Envanterdeki tarif kitabı yapılabilecek eşyaları listeler ve tarifi gösterir.
- **Bu oyunda:**
  - Envanter panelinde (ve çalışma masasında) bir "Tarifler" düğmesi; açılınca tariflerle yapılabilen bütün eşyalar simgeleriyle bir ızgarada listelenir (Minecraft tarzı yuvalar, üzerine gelince ad ipucu). Fırında pişirilenler de "Fırın" sekmesinde listelenir.
  - Bir eşyaya tıklayınca tarifi 3×3 ızgarada (2×2'ye sığıyorsa bunu da belirterek) malzeme simgeleriyle ve çıkan adetle gösterilir; malzemelerin üzerine gelince adları görünür. Envanterde malzemeler yeterliyse "Izgaraya yerleştir" düğmesi malzemeleri üretim ızgarasına diz.
  - Arama kutusu: Türkçe ada göre süzer.
- **Kabul ölçütü:** Tarifler açılınca bütün üretilebilir eşyalar görünüyor; demir kazmaya tıklayınca 3 demir külçe ve 2 çubuğun dizilişi görünüyor; malzemeler varken tek tıkla ızgaraya diziliyor.
- **Bağımlılık:** 16

---

## 9. Sonradan eklenenler

Bu maddeler 37'den hemen sonra yapılır.

### 48. Eşya seçici (`/give` paneli)
- **Minecraft'ta:** Yaratıcı modda bütün eşyalar aranabilir bir panelde listelenir.
- **Bu oyunda:**
  - `/give` adsız yazılınca (ya da sohbet `/give ` ile açılıp Enter'a basılınca) Minecraft tarzı bir eşya paneli açılır: bütün eşyalar simgeleriyle yuvalarda, üzerine gelince adı.
  - Üstte arama kutusu: Türkçe ada ya da İngilizce anahtara göre anında süzer; panel açılınca imleç arama kutusundadır.
  - Sol tık: 1 yığın (aletlerde 1 tane), sağ tık: 1 tane envantere ekler. Esc ya da E paneli kapatır.
  - `/give <eşya> [adet]` eskisi gibi çalışır.
- **Kabul ölçütü:** `/give` yazınca panel açılıyor; "elmas" yazınca elmas ve elmas aletler kalıyor; elmas kazmaya tıklayınca envantere geliyor.
- **Bağımlılık:** 14, 45

### 49. Eldeki eşya her zaman görünür
- **Minecraft'ta:** Elde ne tutuluyorsa (blok, eşya, alet) gözden görünümde ve karakterin elinde görünür.
- **Bu oyunda:**
  - Alet olmayan eşyalar da (et, kömür, meşale …) aletler gibi düz simge olarak elde görünür.
  - Bloklar elde küçük bir küp olarak, gerçek blok dokularıyla görünür (gözden görünümde sağ alt köşede, 3. şahısta sağ elde).
- **Kabul ölçütü:** Hotbar'da toprak seçilince elde küçük toprak küpü, kömür seçilince kömür simgesi görünüyor.
- **Bağımlılık:** 14, 17

### 50. Güvenli mod (`/safe`)
- **Neden:** Küçük bir çocuk oynarken korkmasın diye.
- **Bu oyunda:**
  - Kontrol panelindeki (madde 51) anahtarla ya da `/safe on` ve `/safe off` komutlarıyla (`/safe` tek başına durumu söyler). Açıkken düşman canlılar dünyada durur, dolaşır ama hiçbir şekilde saldırmaz: zombi ve örümcek vurmaz, iskelet ok atmaz, creeper patlamaz, ghast ateş topu atmaz, domuz adamlar kızmaz.
  - Durum kayda yazılır; açıkken sohbette ve menüde "Güvenli mod açık" yazar.
- **Kabul ölçütü:** `/safe on` açıkken zombi yanında durunca can gitmiyor, creeper patlamıyor; `/safe off` ile eski hale dönüyor; sayfa yenilenince durum korunuyor.
- **Bağımlılık:** 8–11, 35, 45

### 51. Kontrol paneli
- **Neden:** Her şey komut yazmadan, düğmelerle yapılabilsin; özellikler arayüzden açılıp kapansın.
- **Bu oyunda:**
  - K tuşu ve ana menüdeki "Kontrol paneli" düğmesi Minecraft görünümlü bir panel açar; Esc, K ya da "Kapat" kapatır. Panel açıkken oyun durmaz ama oyuncu yürümez, dünyaya tıklanamaz.
  - Oyun modu anahtarları (AÇIK/KAPALI): güvenli mod, ölümsüzlük, ses.
  - Saat: sabah, öğle, akşam, gece yarısı. Oyuncu: canı doldur, karnı doyur, doğma noktası burası, envanteri boşalt (ikinci basışta). Eşyalar: eşya seçiciyi açar (madde 48). Işınlan: X, Y, Z kutuları ve doğma noktasına dön. Canlı çağır: her canlı için bir düğme (düşmanlar kırmızımsı yazıyla).
  - Komutlar yedek olarak çalışmaya devam eder; ikisi aynı eylemleri kullanır.
  - **Bundan sonraki her açılıp kapanabilen özellik** (ör. rehber) bu panele de anahtar olarak eklenir.
- **Kabul ölçütü:** K ile panel açılıyor; güvenli mod tek tıkla açılıp kapanıyor; saat, can, ışınlanma ve canlı çağırma düğmeleri çalışıyor; hiç komut yazmadan bütün özellikler kullanılabiliyor.
- **Bağımlılık:** 45, 48, 50

### 52. Eğilme
- **Minecraft'ta:** Shift basılıyken karakter eğilir, yavaş yürür ve blok kenarından düşmez; köprü ve kenar yapmak için kullanılır.
- **Bu oyunda:**
  - Shift basılıyken eğilir: hız %30, kamera 0,3 blok alçalır, modelde gövde öne eğilir ve baş alçalır.
  - Eğilirken yerdeyse ayağın altındaki blok kenarından düşülmez: bir adım oyuncuyu desteksiz bırakacaksa o eksendeki hareket durur (Minecraft gibi kenarda durur, sarkarak blok konabilir).
  - Koşma yalnızca W-W olur (Shift artık eğilme). Ctrl kullanılmaz: tarayıcıda Ctrl+W sekmeyi kapatır.
- **Kabul ölçütü:** Shift basılıyken bir platformun kenarına yürüyünce düşmüyor; kenardan aşağıya bakıp yan yüze blok konabiliyor; Shift bırakınca düşülüyor.
- **Bağımlılık:** 3

### 53. Uçma
- **Minecraft'ta:** Yaratıcı modda boşluğa iki kez hızlıca basınca uçulur; boşluk yükseltir, Shift alçaltır; yine iki kez basınca iniş.
- **Bu oyunda:**
  - Kontrol panelinde (madde 51) "Uçma" anahtarı; kayda yazılır. Yalnızca açıkken uçulabilir.
  - Boşluğa 0,3 sn içinde iki kez basınca uçuş açılır/kapanır. Uçarken yerçekimi yok; boşluk yukarı, Shift aşağı (saniyede 7,5 blok), yatay hız yürümenin 2,5 katı, W-W ile daha hızlı. Yere değince uçuş biter. Uçma izni açıkken düşme hasarı yok.
  - Anahtar kapatılınca uçuş hemen biter.
- **Kabul ölçütü:** Panelden uçma açılınca iki kez boşlukla havalanılıyor, boşluk/Shift ile yükselip alçalınıyor; yere inince düşme hasarı yok; anahtar kapalıyken iki kez boşluk sadece zıplatıyor.
- **Bağımlılık:** 3, 51

### 54. Burj Khalifa (1:4 ölçek)
- **Neden:** Gerçek bir yapının oyuncunun önünde ölçekli olarak kurulması; dünya yüksekliğini sınayan büyük bir yapı.
- **Bu oyunda:**
  - Kontrol panelindeki "Burj Khalifa kur" düğmesi (ikinci basışta) ve `/burj`: oyuncunun 34 blok önüne 207 blok yüksekliğinde (1 blok = 4 m, 828 m) kule kurar; üç kanatlı Y plan, sarmal geri çekilmeler, çekirdek, cam kabuk, katlar ve çelik ibre.
  - Bunun için dünya yüksekliği 48'den 256'ya çıktı; Nether eskisi gibi 48 katlı. Kayıtlar boş üst katmanlar atılarak saklanır, eski kayıtlar açılır.
- **Kabul ölçütü:** Düğme ikinci basışta kuleyi kuruyor; yükseklik 207, tepe ışıltı taşı; kademeler yukarı doğru daralıyor; giriş açık; her 4. katman tavan; kayıttan sonra kule yerinde.
- **Bağımlılık:** 51, 53

### 55. 16 bit blok kimliği
- **Neden:** Chunk dizisi 8 bitti (`Uint8Array`), en çok 255 blok türü sığıyordu; şekilli bloklar çeşitleriyle bu sınıra yaklaştırır.
- **Bu oyunda:** Chunk'lar `Uint16Array` (`newChunk()`); kayıt sürümü 4. Sürüm 3 kayıtları açılırken 8 bitlik chunk'lar 16 bite kopyalanır.
- **Kabul ölçütü:** Sürüm 3 kaydı açılıyor ve blokları yerinde; chunk'lar 16 bit; 255'ten büyük değer saklanabiliyor; kimliği 86'nın üstündeki bloklar kaydedilip geri geliyor.
- **Bağımlılık:** 4, 54

### 56. Metal bloklar
- **Neden:** Kule, köprü gibi büyük yapılarda metal görünümlü blok yoktu (kütükle idare ediliyordu).
- **Bu oyunda:** Demir bloğu (9 demir külçe ↔ 1), altın bloğu (yalnızca eşya seçiciden; altın cevheri yok), elmas bloğu (9 elmas ↔ 1). Kazmayla kırılır; demir en az taş, altın ve elmas demir kazma ister.
- **Kabul ölçütü:** Tarifler çalışıyor ve geri çözülüyor; adlar Türkçe; simgeler gri, sarı, turkuaz; eşya seçicide görünüyorlar.
- **Bağımlılık:** 16, 20, 37

### 57. Şekilli bloklar
- **Minecraft'ta:** Merdiven, yarım blok, çit, duvar ve demir parmaklık; yapılarda kemer, çatı, korkuluk ve kafes için.
- **Bu oyunda:**
  - 6 malzemeden (tahta, kırık taş, taş, tuğla, kumtaşı, Nether tuğlası) merdiven (6 → 4) ve yarım blok (3 → 6); tahta çit (tahta + çubuk → 3), Nether tuğlası çit, kırık taş duvar (6 → 6), demir parmaklık (6 külçe → 16).
  - Merdiven bakılan yöne konur; bloğun altına ya da yan yüzün üst yarısına konunca ters. Çit, duvar ve parmaklık yanındaki aynı şekle ve tam bloklara bağlanır.
  - Yarım blok ve merdiven basamağına zıplamadan çıkılır (0,6 blok basamak); çit ve duvarın üstünden atlanmaz (1,5 blok).
- **Kabul ölçütü:** Tarif çalışıyor; sağ tıkla bakılan yöne merdiven konuyor; ters çeşit seçiliyor; çit komşusuna bağlanıyor; yarım bloğa yürüyerek çıkılıyor; çite zıplayarak bile çıkılamıyor; çeşitler eşya seçicide görünmüyor.
- **Bağımlılık:** 14, 16, 55

### 58. Çok uzak görüş ve bulut yüksekliği
- **Neden:** En uzak görüş 120 bloktu ve bulutlar 60. katmanda sabitti; büyük yapılar sisli görünüyor, bulut katmanı uzun yapıları kesiyordu.
- **Bu oyunda:** Görüş mesafesine "Çok uzak" (192 blok, 12 chunk) eklendi; bulutlar Kapalı / Alçak (60) / Yüksek (248) seçilebilir. İkisi de ayarlarda ve kontrol panelinin Görünüm bölümünde.
- **Kabul ölçütü:** Çok uzakta sis 192 blokta biter ve 12 chunk çevresi çizilir; yüksek bulut 248'de, kapalıyken görünmez; ayar kaydedilir.
- **Bağımlılık:** 30, 31, 51, 54

### 59. Anıtkabir
- **Neden:** Yeni şekilli blokları (merdiven, yarım blok, duvar, parmaklık) büyük bir yapıda sınamak ve video çekmek.
- **Bu oyunda:** Kontrol panelinde "Anıtkabir kur" (ikinci basışta) ve `/anitkabir`: oyuncunun önünden başlayan Aslanlı Yol (24 aslan), on kule, desenli tören meydanı ve revaklar, basamaklı kaide üstünde sütunlu Şeref Holü ve lahit, yarıya inmiş bayrak. 1 blok ≈ 1,5 m.
- **Kabul ölçütü:** Düğme ikinci basışta kuruyor; 24 aslan; meydan döşemesi; holde sütunlar ve lahit; kaideye merdivenle çıkılıyor; bayrak ve kule çatıları yerinde; chunk'lar kayda giriyor.
- **Bağımlılık:** 51, 57

---

## İleride (şimdilik yapılmayacak)

Büyü, iksirler, redstone, End, çok oyunculu mod.
