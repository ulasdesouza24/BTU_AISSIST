const express = require('express');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');

module.exports = function(pool) {
  const router = express.Router();

  // OpenAI istemcisi (opsiyonel)
  let openai = null;
  try {
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here') {
      const OpenAI = require('openai');
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('OpenAI API (report.js) başarıyla bağlandı.');
    } else {
      console.warn('UYARI (report.js): OpenAI API anahtarı bulunamadı veya geçersiz. Rapor düzenleme ve bazı özellikler demo modda çalışabilir veya çalışmayabilir.');
    }
  } catch (error) {
    console.error('OpenAI API (report.js) bağlantı hatası:', error.message);
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
        const prompt = `Aşağıdaki raporu verilen talimatlara göre düzenle:\n\nOrijinal Rapor:\n${originalReport}\n\nDüzenleme Talimatları:\n${editInstructions}\n\nLütfen raporu bu talimatlara göre güncelle ve Türkçe olarak sun. Raporun genel yapısını ve profesyonel formatını koru.`;

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
          console.error('OpenAI API hatası (report.js /edit):', error);
          editedReport = generateDemoEditedReport(originalReport, editInstructions, "OpenAI API hatası nedeniyle demo modda düzenlendi.");
        }
      } else {
        editedReport = generateDemoEditedReport(originalReport, editInstructions, "OpenAI API bağlantısı kurulamadığı için demo modda düzenlendi.");
      }

      res.json({
        message: 'Rapor başarıyla düzenlendi!',
        editedReport,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Rapor düzenleme genel hatası (report.js /edit):', error);
      res.status(500).json({ 
        message: 'Rapor düzenleme sırasında genel bir hata oluştu!', 
        error: error.message 
      });
    }
  });

  function generateDemoEditedReport(originalReport, editInstructions, reason) {
    return `${originalReport}\n\n---\n\n## Düzenleme Notları (Demo Modu)\n\n**Sebep:** ${reason}\n\n**Kullanıcı Talimatları:** ${editInstructions}\n\n**Demo Düzenleme:** Bu rapor demo modunda düzenlenmiştir. Gerçek AI destekli düzenleme için OpenAI API anahtarınızı .env dosyasına doğru şekilde eklediğinizden emin olun.\n\n### Önerilen İyileştirmeler (Genel):\n1. Rapor yapısı gözden geçirilmiştir.\n2. Kullanıcı talimatları dikkate alınmıştır.\n3. Profesyonel format korunmuştur.\n\n*Not: Tam AI destekli rapor düzenleme için geçerli bir OpenAI API anahtarı gereklidir.*`;
  }

  router.post('/export/pdf', authMiddleware, async (req, res) => {
    try {
      const { reportContent, fileName } = req.body;

      if (!reportContent || typeof reportContent !== 'string') {
        return res.status(400).json({ message: 'Geçerli rapor içeriği (string) gerekli!' });
      }

      const doc = new PDFDocument({bufferPages: true});
      const safeFileName = (fileName || 'rapor').replace(/[^a-z0-9\.\-_]/gi, '_');
      const outputPath = path.join(__dirname, '../uploads', `${safeFileName}-${Date.now()}.pdf`);
      
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Türkçe karakter desteği için font ekle
      const fontPath = path.join(__dirname, '../DejaVuSans.ttf');
      if (fs.existsSync(fontPath)) {
        doc.registerFont('dejavu', fontPath);
        doc.font('dejavu');
      }

      doc.fontSize(20).text('Akıllı İçerik Analiz Raporu', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, { align: 'right' });
      doc.moveDown(2);
      doc.fontSize(12);
      
      const lines = reportContent.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          if (line.startsWith('### ')) {
            doc.fontSize(14).font('dejavu').text(line.substring(4).trim(), { continued: false });
            doc.moveDown(0.4);
          } else if (line.startsWith('## ')) {
            doc.fontSize(16).font('dejavu').text(line.substring(3).trim(), { underline: false, continued: false });
            doc.moveDown(0.5);
          } else if (line.startsWith('# ')) {
            doc.fontSize(18).font('dejavu').text(line.substring(2).trim(), { underline: true, continued: false });
            doc.moveDown(0.6);
          } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
            doc.font('dejavu').font('Helvetica-Bold').text(line.substring(2, line.length - 2).trim(), { continued: false });
            doc.font('dejavu'); 
          } else if (line.startsWith('*') && line.endsWith('*') && line.length > 2) {
            doc.font('dejavu').font('Helvetica-Oblique').text(line.substring(1, line.length - 1).trim(), { continued: false });
            doc.font('dejavu');
          } else {
            doc.font('dejavu').text(line.trim(), { align: 'justify', continued: false });
          }
          doc.moveDown(0.3);
        }
      });

      doc.end();

      stream.on('finish', () => {
        res.download(outputPath, safeFileName + '.pdf', (err) => {
          if (err) {
            console.error('PDF gönderme hatası (report.js /export/pdf):', err);
            if (!res.headersSent) {
              res.status(500).json({ message: 'PDF gönderme hatası!' });
            }
          }
          fs.unlink(outputPath, (unlinkErr) => {
            if (unlinkErr) console.error('PDF dosya silme hatası (report.js /export/pdf):', unlinkErr);
          });
        });
      });

      stream.on('error', (err) => {
        console.error('PDF stream hatası (report.js /export/pdf):', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'PDF oluşturulurken stream hatası oluştu.' });
        }
        fs.unlink(outputPath, () => {});
      });

    } catch (error) {
      console.error('PDF oluşturma genel hatası (report.js /export/pdf):', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'PDF oluşturma sırasında genel bir hata oluştu!', 
          error: error.message 
        });
      }
    }
  });

  router.post('/export/docx', authMiddleware, async (req, res) => {
    try {
      const { reportContent, fileName } = req.body;

      if (!reportContent || typeof reportContent !== 'string') {
        return res.status(400).json({ message: 'Geçerli rapor içeriği (string) gerekli!' });
      }

      const safeFileName = (fileName || 'rapor').replace(/[^a-z0-9\.\-_]/gi, '_');
      const outputPath = path.join(__dirname, '../uploads', `${safeFileName}-${Date.now()}.docx`);
      
      const children = [
        new Paragraph({
          children: [ new TextRun({ text: "Akıllı İçerik Analiz Raporu", bold: true, size: 32 }) ],
          alignment: "center",
        }),
        new Paragraph({
          children: [ new TextRun({ text: `Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, size: 20 }) ],
          alignment: "right",
        }),
        new Paragraph({ children: [new TextRun({text: ""})] })
      ];

      reportContent.split('\n').forEach(line => {
        if (line.trim()) {
          let textRunOpts = { text: line.trim().replace(/[#*]/g, ''), size: 22 }; 
          if (line.startsWith('# ')) {
            textRunOpts.text = line.substring(2).trim();
            textRunOpts.bold = true;
            textRunOpts.size = 28;
          } else if (line.startsWith('## ')) {
            textRunOpts.text = line.substring(3).trim();
            textRunOpts.bold = true;
            textRunOpts.size = 26;
          } else if (line.startsWith('### ')) {
            textRunOpts.text = line.substring(4).trim();
            textRunOpts.bold = true;
            textRunOpts.size = 24;
          } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
            textRunOpts.text = line.substring(2, line.length - 2).trim();
            textRunOpts.bold = true;
          } else if (line.startsWith('*') && line.endsWith('*') && line.length > 2) {
            textRunOpts.text = line.substring(1, line.length - 1).trim();
            textRunOpts.italics = true;
          }
          children.push(new Paragraph({ children: [new TextRun(textRunOpts)] }));
        }
      });

      const doc = new Document({
        sections: [{ properties: {}, children: children }],
      });

      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(outputPath, buffer);

      res.download(outputPath, safeFileName + '.docx', (err) => {
        if (err) {
          console.error('DOCX gönderme hatası (report.js /export/docx):', err);
          if(!res.headersSent) {
            res.status(500).json({ message: 'DOCX gönderme hatası!' });
          }
        }
        fs.unlink(outputPath, (unlinkErr) => {
            if (unlinkErr) console.error('DOCX dosya silme hatası (report.js /export/docx):', unlinkErr);
        });
      });

    } catch (error) {
      console.error('DOCX oluşturma genel hatası (report.js /export/docx):', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'DOCX oluşturma sırasında genel bir hata oluştu!', 
          error: error.message 
        });
      }
    }
  });

  // Favori raporları güncelleme endpoint'i
  router.post('/:reportId/favorite', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      const reportId = req.params.reportId;
      const { isFavorite } = req.body;
      if (typeof isFavorite !== 'boolean') {
        return res.status(400).json({ message: 'isFavorite alanı boolean olmalı.' });
      }
      const updateQuery = 'UPDATE analysis_reports SET is_favorite = ? WHERE id = ? AND user_id = ?';
      await pool.promise().query(updateQuery, [isFavorite, reportId, userId]);
      res.json({ message: isFavorite ? 'Rapor favorilere eklendi.' : 'Rapor favorilerden çıkarıldı.' });
    } catch (error) {
      console.error('Favori güncelleme hatası (report.js /:reportId/favorite):', error);
      res.status(500).json({ message: 'Favori güncellenirken hata oluştu.', error: error.message });
    }
  });

  // Raporları filtreleme ve arama endpoint'i
  router.get('/my-reports', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      const { search, onlyFavorites } = req.query;
      let query = `SELECT id, file_name, created_at, updated_at, is_favorite,
        JSON_UNQUOTE(JSON_EXTRACT(ai_analysis, '$.analiz.veriTuru')) AS veri_turu,
        SUBSTRING(JSON_UNQUOTE(JSON_EXTRACT(ai_analysis, '$.analiz.sonuc')), 1, 150) AS sonuc_ozeti_kisa 
        FROM analysis_reports WHERE user_id = ?`;
      const params = [userId];
      if (onlyFavorites === 'true') {
        query += ' AND is_favorite = TRUE';
      }
      if (search) {
        query += ' AND (file_name LIKE ? OR JSON_UNQUOTE(JSON_EXTRACT(ai_analysis, "$.analiz.veriTuru")) LIKE ? )';
        params.push(`%${search}%`, `%${search}%`);
      }
      query += ' ORDER BY created_at DESC';
      const [reports] = await pool.promise().query(query, params);
      
      // feedback_history alanı NULL ise boş dizi olarak ayarla
      reports.forEach(r => {
        if (r.feedback_history === null || typeof r.feedback_history === 'undefined') {
          r.feedback_history = [];
        } else if (typeof r.feedback_history === 'string') {
          try {
            r.feedback_history = JSON.parse(r.feedback_history);
          } catch {
            r.feedback_history = [];
          }
        }
      });

      res.json({ message: 'Geçmiş analiz raporlarınız başarıyla getirildi.', reports });
    } catch (error) {
      console.error('Geçmiş raporları SQL getirme hatası (report.js /my-reports):', error);
      res.status(500).json({ message: 'Raporlar getirilirken bir hata oluştu.', error: error.message });
    }
  });

  router.get('/:reportId', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      const reportId = req.params.reportId;
      const query = 'SELECT * FROM analysis_reports WHERE id = ? AND user_id = ?';
      const [rows] = await pool.promise().query(query, [reportId, userId]);

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Rapor bulunamadı veya erişim yetkiniz yok.' });
      }
      let report = rows[0];
      try {
          report.original_data_summary = JSON.parse(report.original_data_summary || '{}');
          report.python_analysis = JSON.parse(report.python_analysis || 'null');
          report.ai_analysis = JSON.parse(report.ai_analysis || '{}');
          report.feedback_history = JSON.parse(report.feedback_history || '[]');
      } catch(parseError) {
          console.error("Rapor JSON alanları parse hatası (report.js get /:reportId):", parseError, "Rapor ID:", reportId);
          report.original_data_summary = report.original_data_summary || {};
          report.python_analysis = report.python_analysis || null;
          report.ai_analysis = report.ai_analysis || {};
          report.feedback_history = report.feedback_history || [];
      }

      res.json({
        message: 'Rapor detayı başarıyla getirildi.',
        report: report
      });
    } catch (error) {
      console.error('Rapor detayı SQL getirme hatası (report.js get /:reportId):', error);
      res.status(500).json({ 
        message: 'Rapor detayı getirilirken bir hata oluştu.',
        error: error.message 
      });
    }
  });

  router.post('/:reportId/feedback', authMiddleware, async (req, res) => {
    const { feedbackText } = req.body;
    const { reportId } = req.params;
    const userId = req.user.id;

    if (!feedbackText || typeof feedbackText !== 'string' || feedbackText.trim() === '') {
      return res.status(400).json({ message: 'Geçerli ve boş olmayan geri bildirim metni gerekli.' });
    }

    try {
      const selectQuery = 'SELECT * FROM analysis_reports WHERE id = ? AND user_id = ?';
      const [rows] = await pool.promise().query(selectQuery, [reportId, userId]);

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Rapor bulunamadı veya bu rapor üzerinde işlem yapma yetkiniz yok.' });
      }
      let report = rows[0];
      try {
        report.ai_analysis = JSON.parse(report.ai_analysis || '{}');
        report.feedback_history = JSON.parse(report.feedback_history || '[]');
      } catch(parseError) {
          console.error("Rapor JSON parse hatası (report.js /feedback başlangıcı):", parseError, "Rapor ID:", reportId);
          return res.status(500).json({ message: 'Rapor verileri revizyon için okunurken bir sorun oluştu.' });
      }

      if (!openai) {
        console.warn('UYARI (report.js /feedback): OpenAI API kullanılamıyor. Revizyon yapılamayacak.');
        return res.status(500).json({ message: 'OpenAI istemcisi yapılandırılamadığı için analiz revize edilemiyor.'});
      }
      
      const previousAnalysisForPrompt = report.ai_analysis ? report.ai_analysis.analiz : {};
      const previousAnalysisJsonString = JSON.stringify(previousAnalysisForPrompt, null, 2);
      
      const revisionPrompt = 
      `Sen uzman bir veri bilimci ve iş analisti olarak, daha önce yaptığın bir analizi kullanıcının geri bildirimlerine göre revize edeceksin.\n\nÖNCEKİ ANALİZİN (JSON Formatında, sadece 'analiz' bölümü):\n\`\`\`json\n${previousAnalysisJsonString}\n\`\`\`\n\nKULLANICI GERİ BİLDİRİMİ / EK İSTEKLER:\n\"${feedbackText.replace(/\"/g, '\\\"')}\"\n\nLÜTFEN BU GERİ BİLDİRİMLERİ DİKKATE ALARAK ÖNCEKİ ANALİZİ GÜNCELLE VE SONUCU YİNE AŞAĞIDAKİ GİBİ **SADECE** JSON FORMATINDA DÖNDÜR.\nİstenen JSON formatı, önceki analizdeki ana başlıkları koruyarak ve sadece 'analiz' objesini içermelidir:\n\n{\n  \"analiz\": {\n    \"veriTuru\": \"...\",\n    \"genelOzet\": \"...\",\n    \"derinAnaliz\": \"...\",\n    \"veriKalitesi\": \"...\",\n    \"kritikBulgular\": [\"...\"],\n    \"kategorikAnaliz\": \"...\",\n    \"performansAnalizi\": \"...\",\n    \"makasAnalizi\": \"...\",\n    \"segmentasyonBulgulari\": \"...\",\n    \"rekabetAnalizi\": \"...\",\n    \"trendAnalizi\": \"...\",\n    \"riskFirsatAnalizi\": \"...\",\n    \"ongoruler\": [\"...\"],\n    \"aksiyonOnerileri\": [\"...\"],\n    \"sonuc\": \"...\"\n  }\n}\n`;
      
      const systemMessage = "Sen 15 yıllık deneyimli business intelligence uzmanı ve senior data analyst'sin. Bir önceki analizini kullanıcının geri bildirimlerine göre revize ediyorsun. Sadece JSON formatında yanıt ver.";

      const completion = await openai.chat.completions.create({
        model: "gpt-4o", 
        messages: [{ role: "system", content: systemMessage },{ role: "user", content: revisionPrompt }],
        max_tokens: 6000, 
        temperature: 0.7,
        response_format: { type: "json_object" } 
      });

      let revisedAiAnalysisPartial;
      try {
        revisedAiAnalysisPartial = JSON.parse(completion.choices[0].message.content);
        if (!revisedAiAnalysisPartial || !revisedAiAnalysisPartial.analiz) {
            console.error("❌ LLM revizyon JSON format hatası: 'analiz' anahtarı eksik.", revisedAiAnalysisPartial);
            throw new Error("LLM'den gelen revize analiz formatı hatalı: 'analiz' anahtarı eksik.");
        }
      } catch (parseError) {
        console.error('❌ LLM revizyon JSON parse/format hatası (report.js /feedback):', parseError.message);
        console.error('Ham Yanıt (başlangıcı):', completion.choices[0].message.content.substring(0, 500));
        return res.status(500).json({
           message: "LLM\'den gelen revize analiz formatı hatalı veya parse edilemedi.",
           rawResponsePreview: completion.choices[0].message.content.substring(0, 200) + '...'
          });
      }

      const finalAiAnalysis = {
        ...report.ai_analysis,
        analiz: revisedAiAnalysisPartial.analiz
      };

      const newFeedbackEntry = {
        userInput: feedbackText,
        revisedAiAnalysis: revisedAiAnalysisPartial,
        createdAt: new Date().toISOString()
      };
      
      const currentFeedbackHistory = Array.isArray(report.feedback_history) ? report.feedback_history : [];
      currentFeedbackHistory.push(newFeedbackEntry);

      const updateQuery = `
        UPDATE analysis_reports 
        SET ai_analysis = ?, feedback_history = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
      `;
      const valuesToUpdate = [
        JSON.stringify(finalAiAnalysis),
        JSON.stringify(currentFeedbackHistory),
        reportId,
        userId
      ];

      await pool.promise().query(updateQuery, valuesToUpdate);

      res.json({
        message: 'Geri bildiriminiz işlendi ve analiz güncellendi.',
        updatedReport: {
          id: reportId,
          aiAnalysis: finalAiAnalysis,
          feedbackHistory: currentFeedbackHistory
        }
      });

    } catch (error) {
      console.error('Geri bildirim SQL/işleme genel hatası (report.js /feedback):', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Geri bildirim işlenirken genel bir hata oluştu.',
          error: error.message 
        });
      }
    }
  });

  // Analiz raporu silme endpoint'i
  router.delete('/:reportId', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id; // Sadece kendi raporunu silebilsin diye kullanıcı ID'si alınıyor
      const reportId = req.params.reportId; // Silinecek raporun ID'si
      const deleteQuery = 'DELETE FROM analysis_reports WHERE id = ? AND user_id = ?'; // Kullanıcıya ait rapor silinir
      const [result] = await pool.promise().query(deleteQuery, [reportId, userId]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Rapor bulunamadı veya silme yetkiniz yok.' }); // Yetkisiz veya bulunamayan rapor için hata
      }
      res.json({ message: 'Rapor başarıyla silindi.' }); // Başarılı silme yanıtı
    } catch (error) {
      console.error('Rapor silme hatası (report.js /:reportId DELETE):', error); // Hata logu
      res.status(500).json({ message: 'Rapor silinirken hata oluştu.', error: error.message }); // Hata yanıtı
    }
  });

  return router;
};