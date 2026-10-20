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

### 3. 📱 Standart Mobil Navigasyon Menüsü (Bottom Nav)
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
