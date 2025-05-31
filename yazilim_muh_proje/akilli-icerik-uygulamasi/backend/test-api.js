const OpenAI = require('openai');
require('dotenv').config();

async function testOpenAI() {
  try {
    // Çevre değişkenlerini kontrol et
    console.log('Çevre değişkenleri kontrol ediliyor...');
    console.log('OPENAI_API_KEY var mı:', !!process.env.OPENAI_API_KEY);
    console.log('API Key uzunluğu:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('API anahtarı kontrol ediliyor...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Sen bir test asistanısın."
        },
        {
          role: "user",
          content: "Merhaba, bu bir test mesajıdır. Lütfen 'API bağlantısı başarılı!' yanıtını ver."
        }
      ],
      max_tokens: 50
    });

    console.log('API Yanıtı:', completion.choices[0].message.content);
    console.log('API bağlantısı başarılı!');
  } catch (error) {
    console.error('API Bağlantı Hatası:', error.message);
  }
}

testOpenAI(); 