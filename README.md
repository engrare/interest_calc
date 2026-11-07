# Engrare Finans - Minimalist Faiz & Taksit Arbitraj Hesaplayıcı

Engrare Finans; tamamen istemci taraflı (frontend-only), yüksek performanslı, mobil öncelikli ve çerez destekli profesyonel bir getiri ve arbitraj hesaplama aracıdır.

---

## ⚡ Temel Modüller

### 1. 📈 Faiz & Kazanç Hesaplayıcı
- **Faiz Oranını Tanımlayın & Kaydedin:** Referans anapara tutarını (örn. `10.000 ₺`) ve günlük kazancı (örn. `150 ₺`) girerek faiz oranını sabitleyin.
- **Anlık Kazanç & Projeksiyon:** O anki anaparanızı girdiğiniz anda **30 günlük (1 ay)** ve **60 günlük (2 ay)** net kâr, nihai bakiye ve ROI oranını anında görün.
- **Bileşik & Basit Faiz Desteği:** Günlük katlanarak büyüme veya sabit kazanç seçenekleri.
- **Gün Gün Detay Tablosu:** 60 günlük simülasyon dökümü.

### 2. 🛍️ Taksit Arbitrajı & Reel Maliyet Hesaplayıcı (YENİ)
- **Arbitraj Mantığı:** Taksitli bir alışverişte toplam ürün bedelini peşin ödemek yerine faiz hesabında tutarak taksitleri aydan aya faizli bakiyeden ödeme simülasyonu.
- **Girdiler:** Toplam Alışveriş Tutarı (örn: `30.000 ₺`) ve Taksit Sayısı (örn: 2, 3, 6, 9, 12 ay veya özel ay).
- **İlk Taksit Seçeneği:** Kredi kartı ekstre döngüsüne uygun olarak ilk taksiti 30 gün sonra ödeme veya peşin ödeme tercihi.
- **Çıktılar:**
  - **Reel Cebinizden Çıkan Tutar (Gerçek Maliyet):** Faiz getirisi düşüldükten sonra cebinizden çıkan net tutar.
  - **Faiz Arbitraj Getirisi:** Bu süreçte faizden kazanılan toplam tutar (tasarruf).
  - **Reel İndirim & Tasarruf Oranı (%):** Liste fiyatına kıyasla sağlanan net indirim.
  - **Görsel Karşılaştırma Çubuğu:** Liste fiyatı ve faiz kazancı dağılımı.
  - **Ay Ay Taksit & Bakiye Akış Tablosu:** Her ayki başlangıç bakiyesi, faiz kazancı, taksit ödemesi ve kalan bakiye dökümü.

### 3. 💵 Dolar vs TL Faiz İhtimalsel Karar Motoru (YENİ)
- **Karar Problemi:** TL faizde duran parayı **hemen şimdi mi dolara/yatırıma çevirmek** mantıklı, yoksa **seçilen tarih aralığı boyunca TL faizde bekletip vade sonunda mı yatırmak** daha kârlı?
- **Girdiler:**
  - **Yatırılacak Dolar Tutarı (`$`):** Örn. `$1.000`, `$5.000` vb.
  - **Anlık USD/TRY Kuru (`₺`):** Bugün yatırmak için gereken TL anaparasını otomatik hesaplar.
  - **Yatırım Tarih Aralığı:** Başlangıç ve son yatırım tarihi (veya hızlı `7`, `15`, `30`, `45`, `60`, `90` gün seçicileri).
  - **Ortalama Aylık Dolar Artışı (`%`) & Kur Volatilitesi (`±%`):** İhtimalsel (Log-normal / Geometrik Brownian Motion) olasılık modeli için kur beklentisi ve standart sapma.
- **Çıktılar:**
  - **İhtimalsel Kazanma Oranı (`%`):** TL faizde beklemenin mi yoksa hemen yatırmanın mı yüzde kaç olasılıkla üstün geleceği.
  - **Net Beklenen Avantaj (`₺` ve `$`):** Vade sonunda hedef dolar tutarı alındıktan sonra cepte kalan ekstra TL ve USD kârı.
  - **Başabaş (Breakeven) Dolar Kuru:** Faiz getirisinin eridiği kritik dolar kuru eşiği.
  - **3 Olasılık Senaryosu (`p10`, `p50`, `p90`):** Sakin kur, ortalama beklenti ve yüksek kur şoku senaryolarında net kâr/zarar durumu.
  - **Tarih Aralığı Gün Gün Karşılaştırma Tablosu:** Seçilen tarih penceresindeki her gün için beklenen kur, başabaş kur, net avantaj ve kazanma olasılığı.

### 4. 📱 Standart Mobil Navigasyon Menüsü (Bottom Nav)
- Modern mobil uygulamalarda olduğu gibi ekranın altında sabitlenen hızlı menü çubuğu (`Faiz & Getiri`, `Taksit Arbitrajı`, `Hızlı Oran`).
- iPhone/Android güvenli alan (safe-area) desteği.
- Masaüstü ve geniş ekranlarda üst header tab geçişleri ile tam web uyumu.

---

## 🛠️ Teknik Özellikler

- **Kurumsal Engrare Tasarımı:** Engrare logosu, modern koyu (dark mode) UI, neon vurgular.
- **Kalıcı Çerezler (Cookies & LocalStorage):** Faiz oranınız, taksit tercihleriniz ve girdiğiniz tutarlar tarayıcınızda otomatik saklanır.
- **Çoklu Para Birimi:** `₺`, `$`, `€` desteği.
- **PWA & Offline Hazır:** Mobil tarayıcılarda ana ekrana eklenebilir.

---

## 🚀 Canlı Adres & Deploy

Site **[interest.engrare.com](https://interest.engrare.com)** (GitHub Pages) üzerinden otomatik olarak yayınlanmaktadır.

---

## 📄 Lisans

MIT License © [ENGRARE](https://github.com/engrare)
