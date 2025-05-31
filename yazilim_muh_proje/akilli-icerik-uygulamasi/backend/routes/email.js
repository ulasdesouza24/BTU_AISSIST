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
    console.log('OpenAI API email bağlantı hatası:', error.message);
  }
}

// E-posta yazma endpoint'i
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { recipient, subject, content, tone, emailType, language } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'E-posta içeriği gerekli!' });
    }

    let generatedEmail;

    if (openai) {
      try {
        const toneText = tone === 'formal' ? 'resmi' : 
                        tone === 'friendly' ? 'samimi' : 
                        tone === 'business' ? 'iş' : 'normal';

        const emailTypeText = emailType === 'complaint' ? 'şikayet' :
                             emailType === 'request' ? 'talep' :
                             emailType === 'thanks' ? 'teşekkür' :
                             emailType === 'info' ? 'bilgi' : 'genel';

        const prompt = `Lütfen aşağıdaki bilgileri kullanarak profesyonel bir e-posta yaz:

Alıcı: ${recipient || 'Sayın Yetkili'}
Konu: ${subject || 'Konu belirtilmemiş'}
İçerik: ${content}
Ton: ${toneText}
E-posta Türü: ${emailTypeText}
Dil: ${language || 'Türkçe'}

Lütfen uygun bir e-posta formatında (selamlama, ana metin, kapanış) yaz.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "Sen profesyonel e-posta yazma uzmanısın. Verilen bilgilere göre uygun tonada ve formatta e-posta oluşturuyorsun."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        });

        generatedEmail = completion.choices[0].message.content;
      } catch (error) {
        console.error('OpenAI e-posta hatası:', error);
        generatedEmail = generateDemoEmail(recipient, subject, content, tone, emailType);
      }
    } else {
      generatedEmail = generateDemoEmail(recipient, subject, content, tone, emailType);
    }

    res.json({
      message: 'E-posta oluşturuldu!',
      email: {
        recipient: recipient,
        subject: subject,
        content: generatedEmail,
        tone: tone,
        emailType: emailType,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('E-posta oluşturma hatası:', error);
    res.status(500).json({ 
      message: 'E-posta oluşturma sırasında hata oluştu!', 
      error: error.message 
    });
  }
});

// Demo e-posta oluşturma fonksiyonu
function generateDemoEmail(recipient, subject, content, tone, emailType) {
  const greeting = tone === 'formal' ? 'Sayın' : 
                  tone === 'friendly' ? 'Merhaba' : 'Sayın';
  
  const closing = tone === 'formal' ? 'Saygılarımla,' : 
                 tone === 'friendly' ? 'Sevgiler,' : 'İyi çalışmalar,';

  return `${greeting} ${recipient || 'Yetkili'},

${content}

${emailType === 'request' ? 'Bu konuda yardımınızı bekliyorum.' : 
  emailType === 'thanks' ? 'Katkılarınız için teşekkür ederim.' :
  emailType === 'complaint' ? 'Bu durumun en kısa sürede çözülmesini rica ederim.' :
  'Konuyla ilgili görüşlerinizi almak isterim.'}

${closing}

[Demo Modu - Gerçek AI destekli e-posta için OpenAI API anahtarı gereklidir]`;
}

// E-posta şablonları endpoint'i
router.get('/templates', authMiddleware, (req, res) => {
  const templates = [
    {
      id: 1,
      name: 'İş Başvurusu',
      type: 'business',
      tone: 'formal',
      template: 'Sayın İnsan Kaynakları Departmanı,\n\n[Pozisyon adı] pozisyonu için başvuruda bulunmak istiyorum...'
    },
    {
      id: 2,
      name: 'Randevu Talebi',
      type: 'request',
      tone: 'formal',
      template: 'Sayın Yetkili,\n\n[Tarih] tarihinde randevu talebim bulunmaktadır...'
    },
    {
      id: 3,
      name: 'Teşekkür Mektubu',
      type: 'thanks',
      tone: 'friendly',
      template: 'Merhaba [İsim],\n\n[Yardım konusu] için çok teşekkür ederim...'
    },
    {
      id: 4,
      name: 'Şikayet Mektubu',
      type: 'complaint',
      tone: 'formal',
      template: 'Sayın Müşteri Hizmetleri,\n\n[Sorun açıklaması] konusunda şikayetim bulunmaktadır...'
    }
  ];

  res.json({
    message: 'E-posta şablonları getirildi!',
    templates: templates
  });
});

module.exports = router; 