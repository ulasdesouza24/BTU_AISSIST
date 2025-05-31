const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const nodemailer = require('nodemailer');
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
  console.log('OpenAI API anahtarı bulunamadı. Çeviri ve e-posta modülleri demo modda çalışacak.');
}

// Multer konfigürasyonu (çeviri için)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['txt', 'docx', 'pdf'];
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Desteklenmeyen dosya türü: ${fileExtension}. Sadece .txt, .docx, .pdf dosyaları desteklenir.`));
    }
  }
});

// Metin okuma fonksiyonları
const readTextFile = (filePath) => {
  return fs.readFileSync(filePath, 'utf8');
};

const readPdfFile = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

const readDocxFile = (filePath) => {
  // Basit DOCX okuma - gerçek projede mammoth gibi bir kütüphane kullanılmalı
  // Şimdilik metin olarak okuyoruz
  return fs.readFileSync(filePath, 'utf8');
};

// Çeviri endpoint'i
router.post('/translate', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    let textToTranslate = '';
    let fileName = '';

    if (req.file) {
      // Dosyadan metin oku
      const filePath = req.file.path;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      fileName = req.file.originalname;

      switch (fileExtension) {
        case '.txt':
          textToTranslate = readTextFile(filePath);
          break;
        case '.pdf':
          textToTranslate = await readPdfFile(filePath);
          break;
        case '.docx':
          textToTranslate = readDocxFile(filePath);
          break;
        default:
          throw new Error('Desteklenmeyen dosya türü');
      }

      // Geçici dosyayı sil
      fs.unlinkSync(filePath);
    } else if (req.body.text) {
      // Doğrudan metin çevirisi
      textToTranslate = req.body.text;
    } else {
      return res.status(400).json({ message: 'Çevrilecek metin veya dosya gerekli!' });
    }

    if (!textToTranslate.trim()) {
      return res.status(400).json({ message: 'Çevrilecek metin boş!' });
    }

    // Metin çok uzunsa parçalara böl
    const maxLength = 3000;
    const textChunks = [];
    
    if (textToTranslate.length > maxLength) {
      for (let i = 0; i < textToTranslate.length; i += maxLength) {
        textChunks.push(textToTranslate.substring(i, i + maxLength));
      }
    } else {
      textChunks.push(textToTranslate);
    }

    let translatedText = '';

    if (openai) {
      for (const chunk of textChunks) {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "Sen profesyonel bir çevirmensin. Verilen metni Türkçeye çevir. Çeviriyi doğal ve akıcı yap, orijinal anlamı koru."
              },
              {
                role: "user",
                content: `Lütfen aşağıdaki metni Türkçeye çevir:\n\n${chunk}`
              }
            ],
            max_tokens: 2000,
            temperature: 0.3
          });

          translatedText += completion.choices[0].message.content + '\n';
        } catch (error) {
          console.error('OpenAI çeviri hatası:', error);
          translatedText += generateDemoTranslation(chunk) + '\n';
        }
      }
    } else {
      // Demo çeviri
      for (const chunk of textChunks) {
        translatedText += generateDemoTranslation(chunk) + '\n';
      }
    }

    res.json({
      message: 'Çeviri tamamlandı!',
      originalText: textToTranslate.substring(0, 500) + (textToTranslate.length > 500 ? '...' : ''),
      translatedText: translatedText.trim(),
      fileName: fileName || 'Metin Çevirisi',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Çeviri hatası:', error);
    
    // Hata durumunda dosyayı sil
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      message: 'Çeviri sırasında hata oluştu!', 
      error: error.message 
    });
  }
});

// E-posta yazma endpoint'i
router.post('/write-email', authMiddleware, async (req, res) => {
  try {
    const { description, emailType, recipient, tone } = req.body;

    if (!description) {
      return res.status(400).json({ message: 'E-posta açıklaması gerekli!' });
    }

    const emailTone = tone || 'profesyonel';
    const type = emailType || 'genel';

    let emailContent;

    if (openai) {
      const prompt = `Aşağıdaki açıklamaya göre ${emailTone} bir e-posta yaz:

Açıklama: ${description}
E-posta Türü: ${type}
${recipient ? `Alıcı: ${recipient}` : ''}

E-postayı şu kriterlere göre oluştur:
1. ${emailTone} bir ton kullan
2. Konu başlığı dahil et
3. Uygun selamlama ve kapanış kullan
4. Açık ve net ol
5. Türkçe yaz

Format:
Konu: [konu başlığı]

[e-posta içeriği]`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "Sen profesyonel e-posta yazma uzmanısın. Verilen açıklamalara göre uygun e-postalar oluşturuyorsun."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        });

        emailContent = completion.choices[0].message.content;
      } catch (error) {
        console.error('OpenAI e-posta hatası:', error);
        emailContent = generateDemoEmail(description, type, emailTone, recipient);
      }
    } else {
      // Demo e-posta
      emailContent = generateDemoEmail(description, type, emailTone, recipient);
    }

    // Konu ve içeriği ayır
    const lines = emailContent.split('\n');
    const subjectLine = lines.find(line => line.startsWith('Konu:'));
    const subject = subjectLine ? subjectLine.replace('Konu:', '').trim() : 'E-posta';
    const body = emailContent.replace(subjectLine || '', '').trim();

    res.json({
      message: 'E-posta başarıyla oluşturuldu!',
      email: {
        subject,
        body,
        fullContent: emailContent
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('E-posta yazma hatası:', error);
    res.status(500).json({ 
      message: 'E-posta yazma sırasında hata oluştu!', 
      error: error.message 
    });
  }
});

// E-posta gönderme endpoint'i (isteğe bağlı)
router.post('/send-email', authMiddleware, async (req, res) => {
  try {
    const { to, subject, body, userEmail, userPassword } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'Alıcı, konu ve içerik gerekli!' });
    }

    if (!userEmail || !userPassword) {
      return res.status(400).json({ message: 'E-posta gönderimi için giriş bilgileri gerekli!' });
    }

    // E-posta transporter oluştur
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: userEmail,
        pass: userPassword
      }
    });

    // E-posta gönder
    const mailOptions = {
      from: userEmail,
      to: to,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    };

    const result = await transporter.sendMail(mailOptions);

    res.json({
      message: 'E-posta başarıyla gönderildi!',
      messageId: result.messageId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    res.status(500).json({ 
      message: 'E-posta gönderme sırasında hata oluştu!', 
      error: error.message 
    });
  }
});

// Metin özetleme endpoint'i
router.post('/summarize', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Özetlenecek metin gerekli!' });
    }

    const prompt = `Aşağıdaki metni özetle. Özetini Türkçe yap ve ana noktaları koru:

${text}

Özet şu kriterleri karşılamalı:
1. Ana fikirler korunmalı
2. Kısa ve öz olmalı
3. Anlaşılır olmalı
4. Önemli detayları içermeli`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Sen metin özetleme uzmanısın. Verilen metinleri etkili şekilde özetliyorsun."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.5
    });

    const summary = completion.choices[0].message.content;

    res.json({
      message: 'Metin başarıyla özetlendi!',
      originalLength: text.length,
      summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Özetleme hatası:', error);
    res.status(500).json({ 
      message: 'Özetleme sırasında hata oluştu!', 
      error: error.message 
    });
  }
});

// Demo fonksiyonları
function generateDemoTranslation(text) {
  return `[DEMO ÇEVİRİ] ${text.substring(0, 100)}... 

Bu bir demo çeviridir. Gerçek AI destekli çeviri için OpenAI API anahtarınızı .env dosyasına ekleyin.`;
}

function generateDemoEmail(description, type, tone, recipient) {
  const subjects = {
    'musteri_destegi': 'Müşteri Destek Talebi',
    'is_basvurusu': 'İş Başvurusu',
    'teklif': 'Teklif Sunumu',
    'tesekkur': 'Teşekkür',
    'ozur': 'Özür ve Açıklama',
    'davet': 'Etkinlik Daveti',
    'bilgilendirme': 'Bilgilendirme',
    'genel': 'Genel İletişim'
  };

  const subject = subjects[type] || 'E-posta';
  
  return `Konu: ${subject} (Demo Modu)

${recipient ? `Sayın ${recipient},` : 'Merhaba,'}

Bu bir demo e-postasıdır. Gerçek AI destekli e-posta oluşturma için OpenAI API anahtarınızı yapılandırın.

**Kullanıcı Açıklaması:** ${description}
**E-posta Türü:** ${type}
**Ton:** ${tone}

Demo modunda çalışıyoruz. Tam özellikli AI destekli e-posta yazımı için .env dosyasına OpenAI API anahtarınızı ekleyin.

Saygılarımla,
Demo Modu`;
}

module.exports = router; 