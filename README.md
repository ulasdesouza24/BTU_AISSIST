🚀 Akıllı İçerik Analiz ve Üretim Uygulaması

Bu uygulama, kullanıcıların dosya yükleyerek veri analizleri yaptırabildiği, bu analizlerden profesyonel raporlar oluşturabildiği ve ayrıca çeviri ya da e-posta yazımı gibi üretkenlik araçlarını kullanabildiği modüler bir sistemdir.

Proje, `akilli-icerik-uygulamasi` klasörü altında geliştirilmiştir.

## ✨ Özellikler

### 🧠 Veri Analizi Modülü
- CSV, Excel, XML, PDF dosyalarını analiz eder
- AI destekli veri analizi ve öngörüler
- Otomatik grafik önerileri
- Sürükle-bırak dosya yükleme

### 📊 Raporlama Modülü
- Analiz sonuçlarından profesyonel raporlar oluşturur
- AI ile rapor düzenleme
- PDF ve Word formatında dışa aktarma
- Özelleştirilebilir rapor şablonları

### 🌐 Çeviri Modülü
- Metin ve dosya çevirisi
- Türkçeye otomatik çeviri
- TXT, PDF, DOCX desteği
- Toplu çeviri işlemleri

### ✉️ E-posta Yazma Modülü
- AI destekli e-posta oluşturma
- Farklı ton ve türlerde e-postalar
- Otomatik konu satırı oluşturma
- E-posta uygulamasına doğrudan aktarım

### 🔐 Kullanıcı Yönetimi
- Güvenli kayıt ve giriş sistemi
- JWT token tabanlı kimlik doğrulama
- Kullanıcı profil yönetimi

## 🛠 Teknolojiler

### Frontend
- **React.js** - Modern kullanıcı arayüzü
- **TailwindCSS** - Responsive ve sade tasarım
- **React Router** - Sayfa yönlendirmeleri
- **Axios** - HTTP istekleri
- **React Dropzone** - Dosya yükleme

### Backend
- **Node.js & Express.js** - Server ve API
- **MongoDB** - Veritabanı
- **OpenAI API** - AI entegrasyonu
- **JWT** - Token tabanlı kimlik doğrulama
- **Multer** - Dosya yükleme
- **BCryptJS** - Şifre hashleme

### Dosya İşleme
- **xlsx** - Excel dosyaları
- **csv-parser** - CSV dosyaları
- **pdf-parse** - PDF dosyaları
- **pdfkit** - PDF oluşturma
- **docx** - Word belgeleri

## 🚀 Kurulum

### Gereksinimler
- Node.js (v18+)
- MongoDB
- OpenAI API anahtarı

### 1. Projeyi İndirin
```bash
git clone [repository-url]
cd yazilim_muh_proje 
```

### 2. Backend Kurulumu
```bash
cd akilli-icerik-uygulamasi/backend
npm install

# .env dosyasını oluşturun (akilli-icerik-uygulamasi/backend/.env) ve aşağıdaki değerleri ekleyin:
PORT=5000
JWT_SECRET=your_jwt_secret_key_change_this
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb://localhost:27017/akilli_icerik_db

# E-posta ayarları (isteğe bağlı)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Yükleme ayarları
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=csv,xlsx,xls,xml,pdf,txt,docx
```

### 3. Frontend Kurulumu
```bash
cd ../frontend 
# Şu anki dizin: yazilim_muh_proje/akilli-icerik-uygulamasi/frontend
npm install
```

### 4. Uygulamayı Çalıştırın

Backend\'i başlatın (`yazilim_muh_proje/akilli-icerik-uygulamasi/backend` dizininde):
```bash
npm run dev
```

Frontend\'i başlatın (yeni terminalde, `yazilim_muh_proje/akilli-icerik-uygulamasi/frontend` dizininde):
```bash
npm start
```

Uygulama şu adreslerde çalışacaktır:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📖 Kullanım Kılavuzu

### 1. Hesap Oluşturma
- Ana sayfada "Kayıt Ol" butonuna tıklayın
- Gerekli bilgileri doldurun
- Otomatik olarak giriş yapılacaktır

### 2. Veri Analizi
- Soldaki menüden "Veri Analizi"ne tıklayın
- Dosyanızı sürükle-bırak ile yükleyin
- \"Analizi Başlat\" butonuna tıklayın
- Sonuçları inceleyin

### 3. Rapor Oluşturma
- \"Raporlama\" modülüne gidin
- Analiz sonuçlarını yapıştırın veya örnek rapor yükleyin
- İstediğiniz düzenlemeleri belirtin
- PDF veya Word olarak indirin

### 4. Çeviri
- \"Çeviri\" modülüne gidin
- Metin veya dosya seçin
- Çeviri işlemini başlatın
- Sonucu kopyalayın veya indirin

### 5. E-posta Yazma
- \"E-posta Yazma\" modülüne gidin
- E-posta türü ve tonunu seçin
- Açıklama yazın
- Oluşturulan e-postayı kullanın

## 🔧 Geliştirme

### Backend Endpoints

API endpoint\'leri `akilli-icerik-uygulamasi/backend/routes/` altında tanımlanmıştır.

#### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/verify` - Token doğrulama

#### Analysis
- `POST /api/analysis/upload` - Dosya analizi
- `POST /api/analysis/generate-chart` - Grafik oluşturma

#### Reporting
- `POST /api/report/edit` - Rapor düzenleme
- `POST /api/report/export/pdf` - PDF dışa aktarma
- `POST /api/report/export/docx` - Word dışa aktarma

#### Shortcuts
- `POST /api/shortcuts/translate` - Çeviri
- `POST /api/shortcuts/write-email` - E-posta yazma
- `POST /api/shortcuts/send-email` - E-posta gönderme
- `POST /api/shortcuts/summarize` - Metin özetleme

### Proje Yapısı
```
yazilim_muh_proje/
├── akilli-icerik-uygulamasi/
│   ├── backend/
│   │   ├── routes/          # API endpoint\'leri
│   │   │   ├── models/          # Veritabanı modelleri
│   │   │   ├── middleware/      # Kimlik doğrulama vs.
│   │   │   ├── uploads/         # Yüklenen dosyalar
│   │   │   └── utils/           # Yardımcı fonksiyonlar
│   │   ├── frontend/
│   │   │   ├── src/
│   │   │   │   ├── components/  # React bileşenleri
│   │   │   │   ├── context/     # Context API
│   │   │   │   └── utils/       # Yardımcı fonksiyonlar
│   │   │   └── public/          # Statik dosyalar
│   │   └── README.md            # Uygulamaya özel detaylı README
│   ├── .gitignore
│   ├── package.json             # Proje genelinde (belki workspace için)
│   ├── package-lock.json
│   ├── prd.md                   # Product Hunt launch/requirements dosyası olabilir
│   ├── src/                     # Belki genel konfigürasyon veya scriptler için
│   └── README.md                # Bu dosya (Ana README)
```

## 🔒 Güvenlik

- JWT token tabanlı kimlik doğrulama
- Şifre hashleme (bcrypt)
- Dosya türü ve boyut kontrolü
- CORS koruması
- Input validasyonu

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/YeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -am \'Yeni özellik eklendi\'`)
4. Branch\'inizi push edin (`git push origin feature/YeniOzellik`)
5. Pull Request oluşturun

## 📞 Destek

Sorularınız için lütfen issue açın veya [email] adresinden iletişime geçin.

## 🎯 Gelecek Özellikler

- [ ] Grafik görselleştirme entegrasyonu
- [ ] Toplu dosya işleme
- [ ] API key yönetimi
- [ ] Daha fazla dil desteği
- [ ] Veri setlerini kaydetme
- [ ] Analiz geçmişi
- [ ] Tema özelleştirme
- [ ] Mobil uygulama

---

⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın! 
