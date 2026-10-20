# InterestCalc - Minimalist Faiz & Kazanç Hesaplayıcı

Tamamen istemci taraflı (frontend-only), sade, mobil uyumlu ve çerez destekli faiz ve getiri hesaplama web aracı.

---

## ⚡ Kullanım Akışı

1. **Faiz Oranını Tanımlayın & Kaydedin:**
   - Referans anapara tutarını (örn. `10.000 ₺`) ve günlük alınan faiz miktarını (örn. `150 ₺`) girin.
   - **"Faiz Oranını Hesapla & Kaydet"** butonuna basın.
   - Günlük faiz oranı (`%1.50`) hesaplanır ve çerezlerde saklanır.

2. **O Anki Anaparanızı Girin & Anında Sonucu Görün:**
   - Sonraki tüm hesaplamalarda sadece **o anki anapara tutarınızı** yazmanız yeterlidir.
   - Sistem, önceden kaydettiğiniz faiz oranı üzerinden **30 günlük (1 ay)** ve **60 günlük (2 ay)** faiz kazancını ve ulaşılan toplam bakiyeyi anında hesaplar.

3. **Kalıcı Çerezler (Cookies):**
   - Kaydettiğiniz faiz oranı ve en son yazdığınız anapara tarayıcınızın çerezlerinde ve `localStorage` üzerinde saklanır. Sayfayı yeniden açtığınızda kaldığınız yerden devam edersiniz.

---

## 🛠️ Özellikler

- **Sade & Net Arayüz:** Gereksiz menülerden arındırılmış, doğrudan sonuca odaklı tasarım.
- **30 ve 60 Günlük Sonuç Kartları:** 1 ay ve 2 aylık net kâr tutarı, toplam bakiye ve büyüme oranı (ROI).
- **Bileşik ve Basit Faiz Seçimi:** Kazancın her gün anaparaya eklenerek katlanması veya sabit kalması seçeneği.
- **Detay Tablosu (Opsiyonel):** 60 güne kadar gün gün kazanç dökümü.
- **Mobil Uyumlu:** Telefon ve tabletlerde mükemmel dokunmatik deneyim.

---

## 🚀 Canlı Adres & Deploy

Site **[interest.engrare.com](https://interest.engrare.com)** (GitHub Pages) üzerinden otomatik olarak yayınlanmaktadır.

---

## 📄 Lisans

MIT License © [ENGRARE](https://github.com/engrare)
