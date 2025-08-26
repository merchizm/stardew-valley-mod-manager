# Stardew Valley Mod Yöneticisi

Tauri ve TypeScript ile geliştirilmiş, pixel-art stilinde modern bir Stardew Valley mod yönetim uygulaması.

[🇺🇸 English README](README.md)

## ✨ Özellikler

- **🎮 Oyun Entegrasyonu**: Stardew Valley kurulumunu otomatik algılar
- **📦 Mod Yönetimi**: Modları yükle, etkinleştir, devre dışı bırak ve sil
- **🔍 SMAPI Desteği**: SMAPI'yi otomatik algılar ve uyumlu çalışır
- **🎨 Çoklu Tema**: 4 pixel-art teması arasından seç (Varsayılan, Barbie, Karanlık, Minecraft)
- **🌍 Çok Dilli**: İngilizce ve Türkçe desteği
- **⚡ Hızlı ve Güvenli**: Performans ve güvenlik için Rust backend
- **🖥️ Platformlar Arası**: Windows, macOS ve Linux desteği

## 🚀 Kurulum

### Gereksinimler

- Steam üzerinden yüklenmiş **Stardew Valley**
- **SMAPI** (modlar için gerekli) - [Resmi siteden indir](https://smapi.io/)

### İndirme

1. [Sürümler](../../releases) sayfasına git
2. İşletim sisteminiz için kurulum dosyasını indirin:
   - **Windows**: `stardew-valley-mod-manager_x.x.x_x64-setup.exe`
   - **macOS**: `stardew-valley-mod-manager_x.x.x_x64.dmg`
   - **Linux**: `stardew-valley-mod-manager_x.x.x_amd64.AppImage`
3. Uygulamayı kurun ve çalıştırın

## 📖 Nasıl Kullanılır

### İlk Başlatma

1. **Oyun Algılama**: Uygulama Stardew Valley kurulumunuzu otomatik algılar
2. **SMAPI Kontrolü**: SMAPI'nin kurulu ve düzgün yapılandırılmış olup olmadığını kontrol eder
3. **Mod Tarama**: Mods klasörünüzdeki mevcut modları otomatik tarar

### Mod Yönetimi

#### 📥 Mod Kurulumu

1. [Nexus Mods](https://www.nexusmods.com/stardewvalley)'dan mod dosyalarını (`.zip` veya klasörler) indirin
2. Mod klasörlerini `Stardew Valley/Mods/` dizinine çıkarın
3. Yeni modları taramak için uygulamada **Yenile** butonuna tıklayın
4. Geçerli modlar **Etkin Modlar** bölümünde görünecek

#### ✅ Modları Etkinleştirme/Devre Dışı Bırakma

- **Etkin Modlar**: `Mods/` klasöründe bulunur - oyunda çalışırlar
- **Devre Dışı Modlar**: `DeactivatedMods/` klasöründe bulunur - devre dışıdırlar
- Modları durumlar arasında taşımak için **Devre Dışı Bırak** veya **Etkinleştir** butonlarına tıklayın
- Değişiklikler oyunu bir sonraki başlatışınızda etkili olur

#### 🗑️ Mod Silme

- Herhangi bir modda **Sil** butonuna tıklayın
- Modlar geçici bir klasöre taşınır (kurtarılabilir)
- Açılır penceredeki silme işlemini onaylayın

#### 📋 Mod Detayları

- Mod bilgilerini görüntülemek için **Detaylar** butonuna tıklayın
- Sürüm, yazar, açıklama ve dosya detaylarını görün
- Bağımlılıkları ve değişiklikleri görüntüleyin (mevcut olduğunda)

### Navigasyon

#### 🏠 Ana Sayfa
- Mod kurulumunuza genel bakış
- SMAPI durum göstergesi
- Hızlı istatistikler (mod sayısı, çakışmalar)
- Hızlı başlatma butonları

#### 📦 Modlar
- Kapsamlı mod yönetim arayüzü
- Modları duruma göre filtrele: Tümü, Etkin, Devre Dışı
- Sıralama ve arama işlevselliği
- Toplu işlemler

#### ⚠️ Çakışmalar
- Mod çakışmalarını ve uyumluluk sorunlarını algıla
- Çözüm önerileri
- Yükleme sırası yönetimi

#### ⚙️ Ayarlar
- Dili değiştir (İngilizce/Türkçe)
- Tema değiştir
- Oyun yollarını yapılandır
- **Profil yönetimi** (🚧 Geliştirme Aşamasında)

### Oyun Başlatma

- **Modlarla Oyna**: Tüm etkin modlarla oyunu SMAPI üzerinden başlatır
- **Vanilla Oyna**: Modsuz temel oyunu başlatır
- **Klasörleri Aç**: Mods ve oyun dizinlerine hızlı erişim

## 🎨 Temalar

4 güzel pixel-art teması arasından seçin:

- **🌿 Varsayılan**: Klasik Stardew Valley yeşil teması
- **💖 Barbie**: Pembe ve mor renk şeması
- **🌙 Karanlık**: Gece oyunları için modern karanlık tema
- **🟫 Minecraft**: Minecraft'tan esinlenen toprak tonları

## 🌍 Dil Desteği

- **İngilizce** (EN)
- **Türkçe** (TR)

Dil Ayarlar'dan değiştirilebilir. Arayüz yeniden başlatma olmadan anında güncellenir.

## 🛠️ Geliştiriciler İçin

### Kaynak Koddan Derleme

```bash
# Gereksinimler
# - Node.js 16+
# - Rust
# - Tauri CLI

# Depoyu klonla
git clone https://github.com/kullanici-adiniz/stardew-valley-mod-manager
cd stardew-valley-mod-manager

# Bağımlılıkları yükle
npm install

# Geliştirme modu
npm run tauri dev

# Üretim için derle
npm run tauri build
```

### Teknoloji Yığını

- **Frontend**: TypeScript, Vite, HTML5, CSS3
- **Backend**: Rust, Tauri
- **UI**: Özel pixel-art CSS framework
- **İkonlar**: Özel pixel-art ikon seti

## 🚧 Bilinen Sorunlar ve Yol Haritası

### Geliştirme Aşamasında
- **👤 Profil Sistemi**: Farklı mod yapılandırmalarını kaydet ve değiştir


### Belki Gelecekte
- **🔄 Otomatik Güncellemeler**: Nexus Mods'dan otomatik mod güncellemeleri
- **🔗 Mod Mağazası Entegrasyonu**: Uygulamadan doğrudan modlara göz at ve yükle

## 📋 Sistem Gereksinimleri

- **İS**: Windows 10+, macOS 10.15+, veya Linux (Ubuntu 18.04+)
- **Bellek**: Minimum 4GB RAM, 8GB önerilen
- **Depolama**: Uygulama için 100MB + mod depolama alanı
- **Stardew Valley**: Steam sürümü önerilen

## 🆘 Destek

### Yardım Alma

1. **Belgeleri Kontrol Et**: Bu README'yi ve uygulama içi yardımı inceleyin
2. **Sorunları Ara**: [Mevcut sorunlara](../../issues) göz atın
3. **Sorun Oluştur**: Hataları bildir veya özellik talep et
4. **Topluluk**: [Tartışmalarda](../../discussions) konuşmalara katılın

### Hata Bildirme

Sorunları bildirirken lütfen şunları dahil edin:
- İşletim sisteminiz
- Uygulama sürümü
- Sorunu yeniden üretme adımları
- Varsa ekran görüntüleri
- Hata mesajları (konsol loglarını kontrol edin)

## 📜 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır - ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.

## 🙏 Teşekkürler

- **Stardew Valley**: ConcernedApe
- **SMAPI**: Pathoschild ve katkıda bulunanlar
- **İkonlar**: Özel pixel-art tasarımları
- **Topluluk**: Mod yazarları ve test ediciler

## 🔗 Bağlantılar

- **Stardew Valley**: [Resmi Website](https://stardewvalley.net/)
- **SMAPI**: [Resmi Website](https://smapi.io/)
- **Nexus Mods**: [Stardew Valley Modları](https://www.nexusmods.com/stardewvalley)
- **Discord**: [Stardew Valley Topluluğu](https://discord.gg/stardewvalley)

---

Stardew Valley topluluğu için ❤️ ile yapıldı