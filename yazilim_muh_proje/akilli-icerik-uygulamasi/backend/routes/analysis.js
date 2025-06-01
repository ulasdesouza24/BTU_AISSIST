const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

module.exports = function(pool) {
  const router = express.Router();

  // OpenAI istemcisi
  let openai = null;
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here') {
    try {
      const OpenAI = require('openai');
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('OpenAI API başarıyla bağlandı');
    } catch (error) {
      console.log('OpenAI API bağlantı hatası:', error.message);
      // OpenAI olmadan bu servis düzgün çalışamaz, bu yüzden bir uyarı verilebilir.
    }
  } else {
    console.warn('UYARI: OpenAI API anahtarı bulunamadı. Analiz servisi LLM olmadan çalışamaz.');
  }

  // Multer konfigürasyonu
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = 'uploads/';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['csv', 'xlsx', 'xls', 'xml', 'pdf'];
      const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
      
      if (allowedTypes.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error(`Desteklenmeyen dosya türü: ${fileExtension}`));
      }
    }
  });

  // Excel/CSV dosyalarını okuma fonksiyonu
  const parseExcelFile = (filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet);
  };

  // CSV dosyasını okuma fonksiyonu
  const parseCsvFile = (filePath) => {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  };

  // PDF dosyasını okuma fonksiyonu
  const parsePdfFile = async (filePath) => {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text; // Return only the text content
  };

  // XML dosyasını okuma fonksiyonu (basit XML parsing)
  const parseXmlFile = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  };

  // Dosya analizi endpoint'i
  router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    let uploadedFilePath = null;
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Dosya yüklenmedi!' });
      }
      uploadedFilePath = req.file.path;

      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      let data; 

      switch (fileExtension) {
        case '.xlsx':
        case '.xls':
          data = parseExcelFile(uploadedFilePath);
          break;
        case '.csv':
          data = await parseCsvFile(uploadedFilePath);
          break;
        case '.pdf':
          data = await parsePdfFile(uploadedFilePath); 
          break;
        case '.xml':
          data = parseXmlFile(uploadedFilePath);
          break;
        default:
          if (uploadedFilePath) fs.unlinkSync(uploadedFilePath);
          return res.status(400).json({ message: 'Desteklenmeyen dosya türü: ' + fileExtension });
      }

      let analysisDataSummary;
      if (Array.isArray(data)) {
        analysisDataSummary = {
          type: 'table',
          headers: data.length > 0 && data[0] ? Object.keys(data[0]) : [],
          rowCount: data.length,
          sampleData: data && data.length > 0 ? data.slice(0, 5) : [], 
        };
      } else if (typeof data === 'string') {
        analysisDataSummary = {
          type: 'text',
          content: data ? data.substring(0, 2000) : '', 
        };
      } else {
        if (uploadedFilePath) fs.unlinkSync(uploadedFilePath);
        return res.status(400).json({ message: 'Dosya içeriği okunamadı veya desteklenmeyen format.' });
      }

      // Python analizi ile ilgili kısımlar kaldırıldı.
      let analysisResultFromAI = null;
      
      if (!openai) {
        if (uploadedFilePath) fs.unlinkSync(uploadedFilePath);
        return res.status(500).json({ message: 'OpenAI API yapılandırması eksik. Analiz yapılamıyor.'});
      }

      if (analysisDataSummary.type === 'table' || analysisDataSummary.type === 'text') {
        const promptHeaders = analysisDataSummary.type === 'table' && analysisDataSummary.headers ? analysisDataSummary.headers.join(', ') : 'N/A';
        const promptRowCount = analysisDataSummary.type === 'table' ? analysisDataSummary.rowCount : 'N/A';
        
        let detailedDataForPrompt;
        if (analysisDataSummary.type === 'table') {
          detailedDataForPrompt = JSON.stringify(data.slice(0, 50), null, 2); 
        } else { 
          detailedDataForPrompt = typeof data === 'string' ? data.substring(0, 5000) : '';
        }
        
        // PythonContext kaldırıldı.
        const prompt = `Sen uzman bir veri bilimci ve iş analisti olarak, aşağıdaki veriyi analiz et.

ÖNEMLİ: İlk önce verinin ne türde olduğunu belirle (satış, gelir, personel, müşteri, finansal, operasyonel vb.) ve ona göre EN UYGUN analiz yaklaşımını uygula.

HEDEF: Bu veriyi kullanacak iş insanı için EN FAYDALI içgörüleri çıkar. Verinin iş anlamını keşfet ve actionable insights sun.

Lütfen cevabını SADECE JSON formatında ver (markdown kod blokları kullanma):

{
  "analiz": {
    "veriTuru": "Veri setini inceleyerek hangi sektöre ait olduğunu (örneğin: eğitim, satış, insan kaynakları, finans, sağlık, üretim, web trafiği, stok yönetimi vb.) belirle. Gerekirse açıklayıcı şekilde alt alan (örneğin: e-ticaret satış verisi, üniversite sınav notları, çalışan memnuniyet anketi) belirt. Bu alanın iş hedefleriyle nasıl ilişkili olduğunu da kısa olarak açıkla.",
    "genelOzet": "Veri setinin genel yapısını, içerdiği başlıca sütunları ve ne tür bilgiler sunduğunu tanıt. Temel istatistikleri (ortalama, medyan, toplam, maksimum, varyans gibi) sunarak verinin iş bağlamında genel durumunu özetle. Bu verinin hangi iş süreçlerinde ya da karar destek sistemlerinde kullanılabileceğini açıkla.",
    "derinAnaliz": "Veri türüne ve bağlamına en uygun şekilde en az 300 kelimelik detaylı bir iş analizi yap. Kategoriler oluştur, segmentasyon yap, istatistiksel pattern'leri keşfet, zaman bazlı veya yapısal trendleri çıkar. Gerekirse korelasyonlar, dağılım analizi, çarpıklık ya da uç değer analizi yap. Her çıkarımı iş değeriyle ilişkilendir: örneğin, müşteri segmentasyonu ile kampanya hedeflemesi; öğrenci başarısında gelişim alanları; finansal kayıtlarla maliyet optimizasyonu. Analiz sonrasında bu veriyle hangi stratejik veya operasyonel kararlar alınabileceğini açıkla.",
    "veriKalitesi": "Verideki eksiklik, tutarsızlık, aykırı değer, veri tipi hataları gibi sorunları değerlendir. Bu veri analiz yapılabilir düzeyde mi? Güvenilirliği ne seviyede? Kullanım amaçları açısından uygunluğu nedir? Gerekirse temizlik, normalizasyon veya zenginleştirme önerilerinde bulun.",
    "kiritikBulgular": [
      "Veri türü ve bağlamı dikkate alınarak çıkarılmış en kritik 5-8 bulguyu listele.",
      "Her bulgu açık ve net şekilde yazılmalı, somut ve ölçülebilir olmalı.",
      "Her bulgunun olası iş etkisi (avantaj/risk) vurgulanmalı.",
      "Bulgular eyleme geçirilebilir nitelikte, yöneticilere sunulabilecek düzeyde yazılmalı."
    ],
    "kategorikAnaliz": "Veriyi performans, değer, risk veya davranış gibi iş anlamlı kategorilere ayır. Her kategori için kısa açıklama sun. Hangi kategoriler daha stratejik, hangileri düşük değerli, hangileri geliştirmeye açık gibi ayrımlar yap. Kategorilerin iş süreciyle ilişkilendirilmesine dikkat et.",
    "performansAnlizi": "Verideki en iyi ve en kötü performans gösteren öğeleri (kişi, ürün, zaman aralığı, departman vb.) tespit et. Her biri için neden iyi veya kötü olduğunu analiz et. Mümkünse başarı/başarısızlık örüntülerini çıkar.",
    "makasAnalizi": "Verideki en yüksek ve en düşük değerler arasındaki farkları yorumla. Bu farklar veri seti genelinde ne kadar yaygın? Eşitsizlik ölçümleri uygunsa (yüzdelik fark, yoğunlaşma oranı, Gini katsayısı vb.) kullan. Bu eşitsizlikler hangi kararları tetikleyebilir?",
    "segmentasyonBulguları": "Doğal veri segmentlerini (örneğin: sadık müşteriler, düşük not alan öğrenciler, aşırı maliyetli projeler vb.) belirle. Her segmentin karakteristik özelliklerini tanımla. Segmentler arası farklara da değin.",
    "rekabetAnalizi": "Veri setindeki öğeleri birbirleriyle kıyasla (departman, ürün, bölge, dönem vs.). Mümkünse dış benchmark'larla karşılaştır (örnek: sektör ortalamaları, geçmiş dönem kıyaslamaları). Hangi öğeler rekabet avantajı sağlıyor? Hangileri geri kalıyor?",
    "trendAnalizi": "Verideki zaman bazlı, dönemsel veya yapısal trendleri çıkar. Artan/azalan eğilimleri, mevsimsel hareketleri ya da ani değişimleri tespit et. Trendlerin geçmişe göre değişimini belirt. Bu trendler gelecekte hangi iş fırsatlarını ya da tehditleri gösterebilir?",
    "riskFirsatAnalizi": "Verinin içeriğine göre potansiyel risk ve fırsatları tanımla. Operasyonel, finansal, insan kaynağı veya müşteri ilişkileri gibi alanlarda oluşabilecek durumlara değin. Bu verinin doğru kullanımıyla hangi riskler önlenebilir, hangi fırsatlar değerlendirilebilir?",
    "ongoruler": [
      "Veri türüne göre gelecekte neler olabileceğine dair 3–5 somut öngörü üret.",
      "Tahminlerin iş süreçleriyle ilişkilendirilmiş, uygulanabilir ve açık olmasına dikkat et.",
      "Gerekirse olasılık ya da senaryo tahminleri sun."
    ],
    "aksiyonOnerileri": [
      "Analiz sonuçlarına dayanarak alınabilecek en etkili 4–6 iş stratejisi öner.",
      "Her öneri veri ile desteklenmiş, ölçülebilir ve uygulanabilir olmalı.",
      "Operasyon, pazarlama, eğitim, satış, İK veya finans gibi alanlara özel öneriler varsa belirt."
    ],
    "sonuc": "Tüm analizlerin bir özetini sun. En önemli öğrenmeleri, acil öncelikleri ve stratejik yönelimleri madde madde belirt. Yöneticiye sunulabilecek kısa ama etkili bir özet yaz."
  },
  "grafikler": [
    {
      "baslik": "Bu veri türü için en uygun grafik başlığı",
      "tip": "Bu veri türü için en mantıklı grafik tipi seç: bar/line/pie/doughnut/radar/scatter",
      "aciklama": "Bu grafik BU SPESİFİK VERİ TÜRÜ için hangi kritik iş kararını destekliyor?",
      "chartjsKodu": {
        "type": "Veri türüne en uygun Chart.js grafik tipi",
        "data": {
          "labels": ["Bu veri türü için anlamlı kategoriler/gruplar"],
          "datasets": [{
            "label": "Bu veri türü için anlamlı dataset adı",
            "data": [GERÇEK hesaplanmış değerler],
            "backgroundColor": ["veri türüne uygun renkler"],
            "borderColor": "uygun kenar rengi",
            "borderWidth": 1
          }]
        },
        "options": {
          "responsive": true,
          "plugins": {
            "title": {
              "display": true,
              "text": "Bu Veri Türü İçin Anlamlı Başlık"
            },
            "legend": {
              "display": true
            }
          },
          "scales": {
            "y": {
              "beginAtZero": true
            }
          }
        }
      },
      "veriKaynaklari": ["kullanılan sütun adları"],
      "isKarar": "Bu grafik için spesifik iş kararı ve aksiyon önerisi"
    }
  ]
}

Analiz Edilecek Veri:
Başlıklar: ${promptHeaders}
Satır Sayısı: ${promptRowCount}

DETAYLI VERİ İÇERİĞİ:
${detailedDataForPrompt}
`;

        try {
          console.log('\n🚀 OpenAI API\'ye gönderiliyor...');
          
          const systemMessage = "Sen 15 yıllık deneyimli business intelligence uzmanı ve senior data analyst'sin. Verilen verilerin teknik özelliklerini değil, İŞ ANLAMINI ve STRATEJİK İÇGÖRÜLERİNİ çıkarıyorsun. Her analiz iş kararlarını destekleyecek düzeyde detaylı olmalı.";
          
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemMessage },
              { role: "user", content: prompt }
            ],
            max_tokens: 6000,
            temperature: 0.7
          });

          const rawResponse = completion.choices[0].message.content;
          
          console.log('\n📄 OpenAI API\'den gelen ham cevap alındı');

          let cleanedResponse = rawResponse;
          if (cleanedResponse.startsWith('```json')) cleanedResponse = cleanedResponse.substring(7);
          else if (cleanedResponse.startsWith('```')) cleanedResponse = cleanedResponse.substring(3);
          if (cleanedResponse.endsWith('```')) cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
          cleanedResponse = cleanedResponse.trim();
          analysisResultFromAI = JSON.parse(cleanedResponse);
          console.log('✅ OpenAI JSON parse başarılı!');
        } catch (error) {
          console.error('❌ OpenAI API hatası (analysis.js):', error);
          // Hata durumunda akış aşağıda yönetilecek
        }
      } 
      
      if (!analysisResultFromAI) {
        if (uploadedFilePath) fs.unlinkSync(uploadedFilePath);
        return res.status(500).json({ message: 'AI (LLM) analizi gerçekleştirilemedi veya sonuç alınamadı.' });
      }

      const reportId = uuidv4();
      const userId = req.user.id;
      const originalDataForDB = analysisDataSummary.type === 'table' 
      ? { headers: analysisDataSummary.headers, rowCount: analysisDataSummary.rowCount, sampleData: analysisDataSummary.sampleData || [] } 
      : { contentSample: analysisDataSummary.content || '' };
      
      const insertQuery = `
        INSERT INTO analysis_reports 
        (id, user_id, file_name, original_data_summary, python_analysis, ai_analysis, feedback_history)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `; // python_analysis için null göndereceğiz
      const values = [
        reportId,
        userId,
        req.file.originalname,
        JSON.stringify(originalDataForDB),
        null, // python_analysis artık null
        JSON.stringify(analysisResultFromAI),
        JSON.stringify([])
      ];

      try {
        await pool.promise().query(insertQuery, values);
        console.log('📊 Analiz raporu veritabanına kaydedildi, ID:', reportId);
      } catch (dbError) {
        console.error('❌ Rapor SQL INSERT hatası:', dbError);
        // Hata oluşsa bile yüklenen dosyayı silmeyi dene
        if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
          try { fs.unlinkSync(uploadedFilePath); } catch (e) { console.error("Dosya silinemedi (DB hatası sonrası):", e);}
        }
        return res.status(500).json({ message: 'Analiz sonucu veritabanına kaydedilemedi.', error: dbError.message });
      }

      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
         fs.unlinkSync(uploadedFilePath);
      }

      res.json({
        message: 'Analiz başarıyla tamamlandı!',
        reportId: reportId,
        analysis: analysisResultFromAI,
        fileName: req.file.originalname,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Genel analiz endpoint hatası:', error);
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
      res.status(500).json({ 
        message: 'Analiz sırasında genel bir hata oluştu!', 
        error: error.message 
      });
    }
  });

  // Grafik verisi oluşturma endpoint'i (Bu kısım Python bağımlılığı olmadığı için aynı kalabilir)
  router.post('/generate-chart', authMiddleware, async (req, res) => {
    try {
      const { data, chartType } = req.body;

      if (!data || !Array.isArray(data)) {
        return res.status(400).json({ message: 'Geçerli veri gerekli!' });
      }

      // Basit grafik verisi oluşturma
      let chartData;
      const headers = Object.keys(data[0] || {});
      
      switch (chartType) {
        case 'bar':
          chartData = {
            type: 'bar',
            labels: data.slice(0, 10).map((item, index) => item[headers[0]] || `Veri ${index + 1}`),
            datasets: [{
              label: headers[1] || 'Değerler',
              data: data.slice(0, 10).map(item => parseFloat(item[headers[1]]) || 0),
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }]
          };
          break;
        
        case 'pie':
          const pieLabels = [...new Set(data.map(item => item[headers[0]]))].slice(0, 8);
          const pieData = pieLabels.map(label => 
            data.filter(item => item[headers[0]] === label).length
          );
          
          chartData = {
            type: 'pie',
            labels: pieLabels,
            datasets: [{
              data: pieData,
              backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
              ]
            }]
          };
          break;
        
        default:
          chartData = {
            type: 'line',
            labels: data.slice(0, 10).map((item, index) => item[headers[0]] || `Veri ${index + 1}`),
            datasets: [{
              label: headers[1] || 'Değerler',
              data: data.slice(0, 10).map(item => parseFloat(item[headers[1]]) || 0),
              fill: false,
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1
            }]
          };
      }

      res.json({
        message: 'Grafik verisi oluşturuldu!',
        chartData
      });

    } catch (error) {
      console.error('Grafik oluşturma hatası:', error);
      res.status(500).json({ 
        message: 'Grafik oluşturma sırasında hata oluştu!', 
        error: error.message 
      });
    }
  });

  return router;
};