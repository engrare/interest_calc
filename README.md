# InterestCalc - Faiz & Günlük Getiri Hesaplayıcı

Tamamen istemci taraflı (frontend-only), mobil uyumlu (responsive), modern, hızlı ve duyarlı faiz ve getiri hesaplama web uygulaması.

Anaparanızı ve günlük kazancınızı (ister tutar, ister yüzde oranı olarak) girerek **30 gün (1 ay)** ve **60 gün (2 ay)** gibi kritik kilometre taşlarındaki net faiz kazancını, ulaşılan toplam bakiyeyi ve büyüme oranını (ROI) anlık olarak hesaplar.

---

## ✨ Özellikler

- **📱 %100 Mobil Uyumlu (Mobile-First):**
  - Akıllı telefonlar, tabletler ve masaüstü ekranlar için optimize edilmiş esnek düzen.
  - Mobilde kolay gezinti için yapışkan (sticky) hızlı erişim çubuğu (`Parametreler`, `30 & 60 Gün`, `Grafik`, `Döküm`).
  - Mobilde yatay kaydırılabilir tabloda ilk sütun (`Gün`) sabitlenmiştir (sticky column).
  - iOS Safari otomatik büyütmesini (auto-zoom) engelleyen dokunmatik form alanları.
- **🍪 Çerezlerde & Tarayıcıda Otomatik Saklama:**
  - Yazdığınız anapara, günlük kazanç, oran, para birimi ve tüm tercihler **çerezlerde (`cookies`) ve `localStorage` üzerinde** otomatik olarak saklanır.
  - Sayfayı yenilediğinizde veya tarayıcıyı kapatıp açtığınızda kaldığınız yerden devam edersiniz.
  - İstendiğinde "Varsayılana Sıfırla" butonu ile çerezler tek tıkla temizlenebilir.
- **⚡ Sıfır Backend (Frontend-Only):** Tüm hesaplamalar doğrudan kullanıcının tarayıcısında gerçekleştirilir. Hiçbir veri sunucuya gönderilmez, tamamen güvenli ve gizlidir.
- **🎯 30 ve 60 Günlük Özel Projeksiyon Kartları:**
  - 30. gün ve 60. gün için net faiz kârı, kümülatif bakiye ve yüzde büyüme (ROI) özel gradient vurgularıyla sunulur.
  - Ayrıca 7 gün, 14 gün, 90 gün, 180 gün ve 365 gün (1 yıl) matrisi yer alır.
- **🔄 Çift Yönlü Günlük Giriş:**
  - Günlük kazanç tutarını (örn. 150 ₺) girdiğinizde günlük faiz oranı (%) otomatik hesaplanır.
  - Günlük faiz oranını (örn. %1.5) girdiğinizde günlük kazanç tutarı anında senkronize olur.
- **📈 Bileşik ve Basit Faiz Desteği:**
  - **Bileşik Faiz (Compound):** Günlük kazanılan kâr anaparaya eklenerek katlanarak büyür.
  - **Basit Faiz (Simple):** Kazanç yalnızca başlangıç anaparası üzerinden hesaplanır.
- **📊 İnteraktif Mobil Uyumlu Grafik (Chart.js):**
  - Dokunmatik desteği olan, zaman içindeki bakiye ve kazanç gelişim eğrisi.
  - 30 ve 60 günlük kritik günler özel veri noktalarıyla işaretlenir.
- **📋 Gün Gün Detaylı Döküm Tablosu:**
  - Her bir günün başlangıç bakiyesi, o günün kârı, toplam kârı ve gün sonu bakiyesi.
  - **CSV İndir:** Tablo verilerini tek tıkla Excel/CSV formatında dışa aktarma (Türkçe karakter uyumlu UTF-8 BOM).
- **⚙️ İleri Düzey Parametreler:**
  - Stopaj / Vergi kesintisi (%) oranı.
  - Yeniden yatırım oranı (Reinvestment %0 - %100).
  - Düzenli günlük ek tasarruf/yatırım desteği.
  - Özel gün hesaplayıcı (istediğiniz herhangi bir günü girerek anında sonucu görün).
- **🔗 Bağlantı Paylaşımı (URL State):**
  - Girdiğiniz tüm parametreler URL hash'ine kaydedilir. Linki kopyalayıp başkalarıyla paylaşabilirsiniz.
- **🌐 Çoklu Para Birimi:**
  - ₺ TL, $ USD, € EUR ve USDT desteği.

---

## 🚀 Canlı Önizleme / GitHub Pages ile Yayınlama

Bu repo tamamen statik dosyalardan (`index.html`, `style.css`, `app.js`) oluştuğu için herhangi bir derleme (`build`) veya `npm install` gerektirmez.

### GitHub Pages üzerinde yayına almak için:
1. GitHub reponuzda **Settings (Ayarlar)** sekmesine gidin.
2. Sol menüden **Pages** seçeneğine tıklayın.
3. **Build and deployment > Source** kısmını **Deploy from a branch** olarak seçin.
4. Branch olarak **main** ve klasör olarak **/(root)** seçip **Save** butonuna basın.
5. Birkaç dakika içinde siteniz `https://engrare.github.io/interest_calc/` adresinde canlıya geçecektir!

---

## 💻 Yerel Olarak Çalıştırma

Dosyaları klonladıktan sonra herhangi bir statik sunucuyla veya doğrudan tarayıcıda açarak kullanabilirsiniz:

```bash
# Repoyu klonlayın
git clone https://github.com/engrare/interest_calc.git
cd interest_calc

# Doğrudan tarayıcıda açabilir veya Python ile basit bir sunucu başlatabilirsiniz:
python3 -m http.server 8080
```
Tarayıcınızda `http://localhost:8080` adresini açmanız yeterlidir.

---

## 🛠️ Kullanılan Teknolojiler

- **HTML5 & Responsive Mobile-First Web**
- **Modern JavaScript (ES6+ Vanilla)**
- **Browser Cookies API & LocalStorage API**
- **Tailwind CSS (CDN)**
- **Chart.js (CDN)**
- **Google Fonts (Plus Jakarta Sans & JetBrains Mono)**

---

## 📄 Lisans

MIT License © [ENGRARE](https://github.com/engrare)
