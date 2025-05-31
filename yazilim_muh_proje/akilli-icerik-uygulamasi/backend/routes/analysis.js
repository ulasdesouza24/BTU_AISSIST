const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const { spawn } = require('child_process');

const router = express.Router();

// OpenAI istemcisi (opsiyonel)
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
  }
} else {
  console.log('OpenAI API anahtarı bulunamadı. Python analiz modu aktif.');
}

// Python analiz servisini çağır
const callPythonAnalysis = (filePath) => {
  return new Promise((resolve, reject) => {
    console.log('🐍 Python analiz servisi çağrılıyor:', filePath);
    
    // Python script'inin path'i
    const pythonScriptPath = path.join(__dirname, '../python_analysis_service.py');
    
    // Python komutu
    const pythonProcess = spawn('python', [pythonScriptPath, filePath]);
    
    let outputData = '';
    let errorData = '';
    
    // Stdout verilerini topla
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    // Stderr verilerini topla
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error('Python stderr:', data.toString());
    });
    
    // Process tamamlandığında
    pythonProcess.on('close', (code) => {
      console.log(`Python process çıkış kodu: ${code}`);
      
      if (code === 0) {
        try {
          const result = JSON.parse(outputData);
          console.log('✅ Python analizi başarıyla tamamlandı');
          resolve(result);
        } catch (parseError) {
          console.error('❌ Python JSON parse hatası:', parseError);
          console.error('Raw output:', outputData);
          reject(new Error('Python çıktısı geçerli JSON formatında değil'));
        }
      } else {
        console.error('❌ Python process hatası:', errorData);
        reject(new Error(`Python analiz hatası: ${errorData || 'Bilinmeyen hata'}`));
      }
    });
    
    // Timeout (30 saniye)
    setTimeout(() => {
      pythonProcess.kill('SIGTERM');
      reject(new Error('Python analizi zaman aşımına uğradı'));
    }, 30000);
  });
};

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
  return data.text;
};

// XML dosyasını okuma fonksiyonu (basit XML parsing)
const parseXmlFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  // Basit XML parsing - gerçek projede xml2js gibi bir kütüphane kullanılmalı
  return content;
};

// Dosya analizi endpoint'i
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Dosya yüklenmedi!' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let data;

    // Dosya türüne göre parsing
    switch (fileExtension) {
      case '.xlsx':
      case '.xls':
        data = parseExcelFile(filePath);
        break;
      case '.csv':
        data = await parseCsvFile(filePath);
        break;
      case '.pdf':
        data = await parsePdfFile(filePath);
        break;
      case '.xml':
        data = parseXmlFile(filePath);
        break;
      default:
        throw new Error('Desteklenmeyen dosya türü');
    }

    // Veriyi analiz için hazırlama
    let analysisData;
    if (Array.isArray(data)) {
      analysisData = {
        type: 'table',
        headers: Object.keys(data[0] || {}),
        rowCount: data.length,
        sampleData: data.slice(0, 5),
        data: data
      };
    } else {
      analysisData = {
        type: 'text',
        content: data.substring(0, 2000),
        fullContent: data
      };
    }

    // Python ile detaylı analiz
    let pythonAnalysis = null;
    let analysis = null;
    
    try {
      console.log('🐍 Python analizi başlatılıyor...');
      pythonAnalysis = await callPythonAnalysis(filePath);
      console.log('✅ Python analizi tamamlandı');
    } catch (pythonError) {
      console.error('❌ Python analiz hatası:', pythonError.message);
      // Python hatası olursa devam et, sadece OpenAI analizi yap
    }

    // OpenAI ile analiz (eğer mevcut ise)
    if (openai && analysisData.type === 'table') {
      // OpenAI analizi için prompt hazırla
      const prompt = `Sen uzman bir veri bilimci ve iş analisti olarak, aşağıdaki veriyi analiz et. 

ÖNEMLİ: İlk önce verinin ne türde olduğunu belirle (satış, gelir, personel, müşteri, finansal, operasyonel vb.) ve ona göre EN UYGUN analiz yaklaşımını uygula.

HEDEF: Bu veriyi kullanacak iş insanı için EN FAYDALI içgörüleri çıkar. Verinin iş anlamını keşfet ve actionable insights sun.

${pythonAnalysis && pythonAnalysis.success ? `
PYTHON ANALİZ SONUÇLARI MEVCUT:
- Dosya Bilgisi: ${pythonAnalysis.file_info.rows} satır, ${pythonAnalysis.file_info.columns} kolon
- Veri Kalitesi: ${pythonAnalysis.statistics?.data_quality?.completeness_score || 'N/A'}% eksiksizlik
- İş Alanı: ${pythonAnalysis.insights?.data_type_assessment || 'Belirsiz'}
- Anahtar Bulgular: ${pythonAnalysis.insights?.key_findings?.join(', ') || 'Yok'}
- Risk Faktörleri: ${pythonAnalysis.insights?.risk_factors?.join(', ') || 'Yok'}
- Fırsatlar: ${pythonAnalysis.insights?.opportunities?.join(', ') || 'Yok'}

Bu Python analiz sonuçlarını da dikkate alarak daha detaylı iş odaklı analiz yap.
` : ''}

Lütfen cevabını SADECE JSON formatında ver (markdown kod blokları kullanma):

{
  "analiz": {
    "veriTuru": "Veriyi inceleyerek belirle: Bu hangi iş alanına ait?",
    "genelOzet": "Verinin iş bağlamında genel durumu ve en önemli sayıları bu verinini çıkarımlarının ne gibi yerlerde kullanılabileceğini belirt",
    "derinAnaliz": "ÇOKKK DETAYLI İŞ ANALİZİ: Veri türüne göre en uygun analiz yap. Kategoriler oluştur, segmentasyon yap, pattern'leri keşfet, trend'leri belirle. En az 300 kelime. Bu veri ile hangi iş kararları alınabilir? veriler arasındaki korelasyonları belirt ve analiz ederken verilerin iş anlamını da belirt,",
    "veriKalitesi": "İş güvenilirliği ve kullanılabilirlik değerlendirmesi",
    "kiritikBulgular": ["Bu veri türü için en kritik 5-8 bulgu. Her biri aksiyon alınabilir nitelikte olmalı."],
    "kategorikAnaliz": "Veriyi iş anlamlı kategorilere böl (performansa, değere, riske göre vb.)",
    "performansAnlizi": "En iyi/kötü performans gösteren elementler ve sebepleri",
    "makasAnalizi": "En yüksek vs en düşük değerler arasındaki farklar ve eşitsizlik ölçümleri",
    "segmentasyonBulguları": "Doğal gruplar/segmentler ve bunların karakteristikleri",
    "rekabetAnalizi": "Benchmark değerler ve karşılaştırmalar (eğer çıkarılabilirse)",
    "trendAnalizi": "Veri türüne uygun trend analizi (zaman bazlı, dönemsel, büyüme vb.)",
    "riskFirsatAnalizi": "Bu veri türü için spesifik riskler ve fırsatlar",
    "ongoruler": ["Veri türüne uygun gelecek öngörüleri - somut ve uygulanabilir"],
    "aksiyonOnerileri": ["Bu veri türü için spesifik iş stratejisi eylem planları"],
    "sonuc": "Bu veri türü için en önemli çıkarımlar ve öncelikler"
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
Başlıklar: ${analysisData.headers.join(', ')}
Satır Sayısı: ${analysisData.rowCount}

DETAYLI VERİ İÇERİĞİ:
${JSON.stringify(analysisData.data.slice(0, 50), null, 2)}`;

      try {
        console.log('\n🚀 OpenAI API\'ye gönderiliyor...');
        
        const systemMessage = "Sen 15 yıllık deneyimli business intelligence uzmanı ve senior data analyst'sin. Verilen verilerin teknik özelliklerini değil, İŞ ANLAMINI ve STRATEJİK İÇGÖRÜLERİNİ çıkarıyorsun. Her analiz iş kararlarını destekleyecek düzeyde detaylı olmalı. Python analiz sonuçları varsa bunları da entegre ederek daha kapsamlı analiz yap.";
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: systemMessage
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 6000,
          temperature: 0.7
        });

        // JSON response'u parse et
        const rawResponse = completion.choices[0].message.content;
        
        console.log('\n📄 OpenAI API\'den gelen ham cevap alındı');

        try {
          // Markdown etiketlerini temizle
          let cleanedResponse = rawResponse;
          
          // ```json ile başlıyorsa kaldır
          if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/^```json\s*/, '');
          }
          
          // ``` ile bitiyorsa kaldır
          if (cleanedResponse.endsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/\s*```$/, '');
          }
          
          // Başka markdown formatları da temizle
          cleanedResponse = cleanedResponse.replace(/^```\w*\s*/, '').replace(/\s*```$/, '');
          
          analysis = JSON.parse(cleanedResponse);
          console.log('✅ OpenAI JSON parse başarılı!');
        } catch (parseError) {
          console.error('❌ OpenAI JSON parse hatası:', parseError);
          console.error('Ham cevap (ilk 200 char):', rawResponse.substring(0, 200) + '...');
          
          // Parse hatası olursa basit bir analiz oluştur
          analysis = {
            analiz: {
              veriTuru: "Genel Veri Analizi",
              genelOzet: "Veri analizi tamamlandı ancak detaylı OpenAI analizi parse edilemedi.",
              derinAnaliz: "Veri başarıyla yüklendi ve temel istatistikler hesaplandı. Python analiz sonuçları mevcutsa bunları kullanabilirsiniz.",
              veriKalitesi: "Standart",
              kiritikBulgular: ["Veri başarıyla işlendi"],
              sonuc: "Analiz tamamlandı"
            },
            grafikler: []
          };
        }
      } catch (error) {
        console.error('❌ OpenAI API hatası:', error);
        
        // OpenAI hatası olursa basit bir analiz oluştur
        analysis = {
          analiz: {
            veriTuru: "Genel Veri Analizi",
            genelOzet: "Veri analizi tamamlandı. OpenAI servisi kullanılamadı.",
            derinAnaliz: "Temel veri analizi yapıldı. Detaylı sonuçlar için Python analiz çıktılarını kontrol edin.",
            veriKalitesi: "Standart",
            kiritikBulgular: ["Veri başarıyla işlendi"],
            sonuc: "Analiz tamamlandı"
          },
          grafikler: []
        };
      }
    } else {
      // OpenAI yoksa Python sonuçlarından basit bir analiz oluştur
      analysis = {
        analiz: {
          veriTuru: pythonAnalysis?.insights?.data_type_assessment || "Genel Veri Analizi",
          genelOzet: `${analysisData.rowCount} satır ve ${analysisData.headers.length} kolondan oluşan veri seti analiz edildi.`,
          derinAnaliz: pythonAnalysis?.insights?.key_findings?.join('. ') || "Temel istatistiksel analiz tamamlandı.",
          veriKalitesi: pythonAnalysis?.statistics?.data_quality ? 
            `Veri kalitesi: %${pythonAnalysis.statistics.data_quality.completeness_score?.toFixed(1)} eksiksizlik` : "Standart",
          kiritikBulgular: pythonAnalysis?.insights?.key_findings || ["Veri başarıyla işlendi"],
          sonuc: "Python tabanlı analiz tamamlandı"
        },
        grafikler: pythonAnalysis?.visualizations?.recommended_charts || []
      };
    }

    // Geçici dosyayı sil
    fs.unlinkSync(filePath);

    // Birleştirilmiş sonucu döndür
    const finalResult = {
      message: 'Analiz başarıyla tamamlandı!',
      analysis: {
        originalData: analysisData,
        pythonAnalysis: pythonAnalysis || null,
        aiAnalysis: analysis,
        fileName: req.file.originalname,
        timestamp: new Date().toISOString(),
        analysisType: pythonAnalysis ? (openai ? 'hybrid' : 'python_only') : (openai ? 'openai_only' : 'basic')
      }
    };

    console.log('🎉 Analiz tamamlandı:', finalResult.analysis.analysisType);
    res.json(finalResult);

  } catch (error) {
    console.error('Analiz hatası:', error);
    
    // Hata durumunda dosyayı sil
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      message: 'Analiz sırasında hata oluştu!', 
      error: error.message 
    });
  }
});

// Grafik verisi oluşturma endpoint'i
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

// Python analiz servisi test endpoint'i
router.get('/test-python', authMiddleware, async (req, res) => {
  try {
    // Test dosyası oluştur
    const testData = [
      { id: 1, name: 'Test1', value: 100, category: 'A' },
      { id: 2, name: 'Test2', value: 200, category: 'B' },
      { id: 3, name: 'Test3', value: 150, category: 'A' }
    ];
    
    const testFilePath = path.join(__dirname, '../uploads/test.json');
    fs.writeFileSync(testFilePath, JSON.stringify(testData, null, 2));
    
    // Python analizi çağır
    const result = await callPythonAnalysis(testFilePath);
    
    // Test dosyasını sil
    fs.unlinkSync(testFilePath);
    
    res.json({
      message: 'Python analiz servisi test edildi!',
      result: result
    });
    
  } catch (error) {
    console.error('Python test hatası:', error);
    res.status(500).json({
      message: 'Python test hatası!',
      error: error.message
    });
  }
});

module.exports = router; 