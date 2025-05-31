Elbette. Aşağıda uygulaman için tüm modülleri ve kullanıcı giriş/kayıt ekranlarını kapsayan **tek parça halinde** bir **PRD metni** sunuyorum. Bu metin, hem teknik ekibe hem de tasarım ekibine referans olması için yeterli detaydadır ancak aşırı teknik karmaşıklıktan kaçınır.

---

# ✅ Ürün Gereksinim Dokümanı (PRD)

## Proje Adı: **Akıllı İçerik Analiz ve Üretim Uygulaması**

---

## 🎯 Amaç

Bu uygulama, kullanıcıların dosya yükleyerek veri analizleri yaptırabildiği, bu analizlerden profesyonel raporlar oluşturabildiği ve ayrıca çeviri ya da e-posta yazımı gibi üretkenlik araçlarını kullanabildiği modüler bir sistem sunar. Kullanıcı dostu bir arayüz ile desteklenen bu sistemde, OpenAI, Deepseek gibi LLM servislerinden faydalanılır.

---

## 🧩 MODÜLLERİN DETAYLI AÇIKLAMASI

---

### 🧠 1. Veri Analizi Modülü

#### Amaç

Kullanıcının yüklediği yapısal dosyaları (CSV, Excel, XML, sayısal içerikli PDF) analiz ederek, anlamlı öngörüler ve isteğe bağlı grafikler üretmek.

#### Girdi Türleri

* `.csv`, `.xlsx`, `.xls`, `.xml` dosyaları
* İçeriği sadece sayısal verilerden oluşan `.pdf` dosyaları

#### İşleyiş

1. Dosya sürükle-bırak yoluyla yüklenir.
2. Dosya, backend tarafından okunur ve tablo haline getirilir.
3. Bu veriler, başlıklarıyla birlikte LLM'e gönderilir.
4. LLM'den aşağıdakiler istenir:

   * Öne çıkan verilerin analizi
   * Gerekirse grafik önerileri
   * Mantıklı çıkarımlar (örn. “X ürününden daha çok gelir elde ediliyor.”)
5. Kullanıcıya sonuçlar gösterilir.
6. Eğer grafik önerildiyse, bar chart, pie chart gibi grafikler frontend'de üretilir.
7. İşlem sonrası pop-up:

   * “Analiz tamamlandı. Raporlama modülüne geçmek ister misiniz?”

---

### 📊 2. Raporlama Modülü

#### Amaç

Veri analizinden gelen çıktılar, kullanıcıya profesyonelce sunulan, gerektiğinde düzenlenebilir ve dışa aktarılabilir bir rapor haline getirilir.

#### İşleyiş

1. LLM analiz çıktıları + grafikler bir ön izleme ekranında gösterilir.
2. Kullanıcı, metni okuyarak hatalı/gereksiz gördüğü bölümleri düzenleme kutusuna yazar.
3. Düzenleme prompt'u tekrar LLM'e gönderilir.
4. LLM yeni versiyonu oluşturur, kullanıcıya gösterilir.
5. Onaylanan rapor, `.pdf` veya `.docx` formatında dışa aktarılabilir.
6. Belge meta verileri (tarih, başlık, kullanıcı) otomatik eklenir.

---

### ⚡ 3. Kısayollar Modülü

#### Alt Modül 1: Çeviri Modülü

* Kullanıcı bir `.txt`, `.docx` veya `.pdf` dosyası yükler.
* Sistem dosyayı Türkçeye çevirir.
* Çeviri, ekranda gösterilir ve kullanıcı yüklediği formatta çıktısını alabilir.

#### Alt Modül 2: Mail Yazma Modülü

* Kullanıcı, bir açıklama girer: “müşteri desteğine mail yazacağım”.
* LLM bu açıklamayı, profesyonel bir e-postaya dönüştürür.
* E-posta kopyalanabilir olarak gösterilir.
* (Opsiyonel) Kullanıcı SMTP bilgileriyse doğrudan mail gönderebilir.

---

## 🔐 Giriş ve Kayıt Modülü

### 🟢 Giriş Ekranı

* E-posta ve şifre alanı
* “Beni Hatırla” kutusu
* “Şifremi Unuttum” bağlantısı
* “Giriş” butonu
* Altında: “Henüz hesabın yok mu? Kayıt Ol”

### 🔵 Kayıt Ol Ekranı

* Ad soyad
* E-posta
* Şifre ve Şifre Tekrar
* KVKK ve kullanıcı sözleşmesi onayı
* “Kayıt Ol” butonu
* Başarılı kayıt sonrası otomatik giriş veya giriş sayfasına yönlendirme

### 👤 Kullanıcı Paneli (Dashboard)

* Kullanıcının önceki analiz raporları
* Dosya geçmişi
* Son kullanımlar
* Rapor indir geçmişi
* Yeni analiz başlat butonu
* Hesap ayarları ve çıkış seçeneği

---

## 💡 Kullanılan Teknolojiler

### Frontend

* **React.js** veya **Vue.js** (tercihe bağlı)
* TailwindCSS (responsive ve sade tasarım)
* Chart.js veya Recharts (grafik üretimi)
* FilePond (sürükle bırak dosya yükleme)

### Backend

* **Node.js + Express.js**
* Dosya okuma: `xlsx`, `csv-parser`, `pdf-parse` gibi kütüphaneler
* LLM ile etkileşim: OpenAI API (`gpt-4-turbo`), Deepseek, Claude gibi alternatifler kullanılabilir
* E-posta gönderimi: `nodemailer` (opsiyonel)

### LLM Prompt Mantığı

* Her modüle özel prompt yapıları tasarlanacaktır
* Maksimum token sınırına dikkat edilir
* Gerekirse dosya uzunluğu parçalanarak gönderilir

### Diğer

* Auth: JWT token sistemi
* Veri saklama: Geçici olarak `MongoDB` veya `Firebase`
* Export işlemleri için: `pdfkit`, `docx` gibi kütüphaneler

---

Bu PRD belgesi, geliştirme sürecine doğrudan başlayabilecek düzeydedir. Dilersen bunun üzerinden iş akış diyagramı, kullanıcı senaryoları ya da mockup tasarımlar da çıkarabiliriz.


