const express = require('express');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// OpenAI istemcisi (opsiyonel)
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
} catch (error) {
  console.log('OpenAI API anahtarı bulunamadı. Rapor düzenleme demo modda çalışacak.');
}

// Rapor düzenleme endpoint'i
router.post('/edit', authMiddleware, async (req, res) => {
  try {
    const { originalReport, editInstructions } = req.body;

    if (!originalReport || !editInstructions) {
      return res.status(400).json({ message: 'Orijinal rapor ve düzenleme talimatları gerekli!' });
    }

    let editedReport;

    if (openai) {
      const prompt = `Aşağıdaki raporu verilen talimatlara göre düzenle:

Orijinal Rapor:
${originalReport}

Düzenleme Talimatları:
${editInstructions}

Lütfen raporu bu talimatlara göre güncelle ve Türkçe olarak sun. Raporun genel yapısını ve profesyonel formatını koru.`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "Sen bir rapor editörüsün. Verilen raporları kullanıcı talimatlarına göre düzenleyip geliştiriyorsun."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        });

        editedReport = completion.choices[0].message.content;
      } catch (error) {
        console.error('OpenAI API hatası:', error);
        editedReport = generateDemoEditedReport(originalReport, editInstructions);
      }
    } else {
      // Demo düzenleme
      editedReport = generateDemoEditedReport(originalReport, editInstructions);
    }

    res.json({
      message: 'Rapor başarıyla düzenlendi!',
      editedReport,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Rapor düzenleme hatası:', error);
    res.status(500).json({ 
      message: 'Rapor düzenleme sırasında hata oluştu!', 
      error: error.message 
    });
  }
});

// Demo rapor düzenleme fonksiyonu
function generateDemoEditedReport(originalReport, editInstructions) {
  return `${originalReport}

---

## Düzenleme Notları (Demo Modu)

**Kullanıcı Talimatları:** ${editInstructions}

**Demo Düzenleme:** Bu rapor demo modunda düzenlenmiştir. Gerçek AI destekli düzenleme için OpenAI API anahtarınızı .env dosyasına ekleyin.

### Önerilen İyileştirmeler:
1. Rapor yapısı gözden geçirilmiştir
2. Kullanıcı talimatları dikkate alınmıştır
3. Profesyonel format korunmuştur

*Not: Tam AI destekli rapor düzenleme için OpenAI API anahtarı gereklidir.*`;
}

// PDF rapor oluşturma endpoint'i
router.post('/export/pdf', authMiddleware, async (req, res) => {
  try {
    const { reportContent, fileName } = req.body;

    if (!reportContent) {
      return res.status(400).json({ message: 'Rapor içeriği gerekli!' });
    }

    const doc = new PDFDocument();
    const outputPath = path.join(__dirname, '../uploads', `${fileName || 'rapor'}-${Date.now()}.pdf`);
    
    doc.pipe(fs.createWriteStream(outputPath));

    // PDF başlığı
    doc.fontSize(20).text('Akıllı İçerik Analiz Raporu', {
      align: 'center'
    });

    doc.moveDown();

    // Tarih
    doc.fontSize(12).text(`Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, {
      align: 'right'
    });

    doc.moveDown(2);

    // Rapor içeriği
    doc.fontSize(12);
    
    // Basit metin formatlaması
    const lines = reportContent.split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        if (line.startsWith('#')) {
          // Başlık formatı
          doc.fontSize(16).text(line.replace('#', '').trim(), {
            underline: true
          });
          doc.moveDown(0.5);
          doc.fontSize(12);
        } else if (line.startsWith('**')) {
          // Kalın metin
          doc.text(line.replace(/\*\*/g, ''), {
            continued: false
          });
        } else {
          // Normal metin
          doc.text(line, {
            align: 'justify'
          });
        }
        doc.moveDown(0.3);
      }
    });

    doc.end();

    // PDF oluşturma tamamlandığında dosyayı gönder
    doc.on('end', () => {
      res.download(outputPath, (err) => {
        if (err) {
          console.error('PDF gönderme hatası:', err);
          res.status(500).json({ message: 'PDF gönderme hatası!' });
        }
        // Dosyayı sil
        fs.unlinkSync(outputPath);
      });
    });

  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    res.status(500).json({ 
      message: 'PDF oluşturma sırasında hata oluştu!', 
      error: error.message 
    });
  }
});

// DOCX rapor oluşturma endpoint'i
router.post('/export/docx', authMiddleware, async (req, res) => {
  try {
    const { reportContent, fileName } = req.body;

    if (!reportContent) {
      return res.status(400).json({ message: 'Rapor içeriği gerekli!' });
    }

    // DOCX belgesi oluştur
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Akıllı İçerik Analiz Raporu",
                bold: true,
                size: 32,
              }),
            ],
            alignment: "center",
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
                size: 20,
              }),
            ],
            alignment: "right",
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "",
              }),
            ],
          }),
          ...reportContent.split('\n').map(line => 
            new Paragraph({
              children: [
                new TextRun({
                  text: line.replace(/[#*]/g, ''),
                  bold: line.startsWith('#') || line.startsWith('**'),
                  size: line.startsWith('#') ? 28 : 22,
                }),
              ],
            })
          ),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const outputPath = path.join(__dirname, '../uploads', `${fileName || 'rapor'}-${Date.now()}.docx`);
    
    fs.writeFileSync(outputPath, buffer);

    res.download(outputPath, (err) => {
      if (err) {
        console.error('DOCX gönderme hatası:', err);
        res.status(500).json({ message: 'DOCX gönderme hatası!' });
      }
      // Dosyayı sil
      fs.unlinkSync(outputPath);
    });

  } catch (error) {
    console.error('DOCX oluşturma hatası:', error);
    res.status(500).json({ 
      message: 'DOCX oluşturma sırasında hata oluştu!', 
      error: error.message 
    });
  }
});

module.exports = router; 