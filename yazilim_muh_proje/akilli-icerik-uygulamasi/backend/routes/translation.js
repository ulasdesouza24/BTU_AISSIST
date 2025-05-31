const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// OpenAI istemcisi (opsiyonel)
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here') {
  try {
    const OpenAI = require('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  } catch (error) {
    console.log('OpenAI API translation bağlantı hatası:', error.message);
  }
}

// Metin çeviri endpoint'i
router.post('/text', authMiddleware, async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Çevrilecek metin gerekli!' });
    }

    let translatedText;

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Sen profesyonel bir çevirmensin. Verilen metni ${targetLanguage || 'Türkçe'}'ye çevir. Sadece çevirilen metni döndür, başka açıklama yapma.`
            },
            {
              role: "user",
              content: text
            }
          ],
          max_tokens: 2000,
          temperature: 0.3
        });

        translatedText = completion.choices[0].message.content;
      } catch (error) {
        console.error('OpenAI çeviri hatası:', error);
        translatedText = `[Demo Modu] Bu metin çevrildi: "${text.substring(0, 100)}..."`;
      }
    } else {
      translatedText = `[Demo Modu] Bu metin ${targetLanguage || 'Türkçe'}'ye çevrildi: "${text.substring(0, 100)}..."`;
    }

    res.json({
      message: 'Çeviri tamamlandı!',
      originalText: text,
      translatedText: translatedText,
      targetLanguage: targetLanguage || 'Türkçe'
    });

  } catch (error) {
    console.error('Çeviri hatası:', error);
    res.status(500).json({ 
      message: 'Çeviri sırasında hata oluştu!', 
      error: error.message 
    });
  }
});

// Dosya çeviri endpoint'i (basit implementasyon)
router.post('/file', authMiddleware, async (req, res) => {
  try {
    const { fileContent, fileName, targetLanguage } = req.body;

    if (!fileContent) {
      return res.status(400).json({ message: 'Dosya içeriği gerekli!' });
    }

    let translatedContent;

    if (openai && fileContent.length <= 2000) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Sen profesyonel bir çevirmensin. Verilen dosya içeriğini ${targetLanguage || 'Türkçe'}'ye çevir. Format ve yapıyı koruyarak çevir.`
            },
            {
              role: "user",
              content: fileContent
            }
          ],
          max_tokens: 3000,
          temperature: 0.3
        });

        translatedContent = completion.choices[0].message.content;
      } catch (error) {
        console.error('OpenAI dosya çeviri hatası:', error);
        translatedContent = `[Demo Modu] Dosya içeriği çevrildi:\n\n${fileContent.substring(0, 500)}...`;
      }
    } else {
      translatedContent = `[Demo Modu] "${fileName}" dosyası ${targetLanguage || 'Türkçe'}'ye çevrildi:\n\n${fileContent.substring(0, 500)}...`;
    }

    res.json({
      message: 'Dosya çevirisi tamamlandı!',
      originalFile: fileName,
      translatedContent: translatedContent,
      targetLanguage: targetLanguage || 'Türkçe'
    });

  } catch (error) {
    console.error('Dosya çeviri hatası:', error);
    res.status(500).json({ 
      message: 'Dosya çevirisi sırasında hata oluştu!', 
      error: error.message 
    });
  }
});

module.exports = router; 