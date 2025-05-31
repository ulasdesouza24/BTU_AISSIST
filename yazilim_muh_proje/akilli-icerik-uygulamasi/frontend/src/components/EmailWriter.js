import React, { useState } from 'react';
import axios from 'axios';

const EmailWriter = () => {
  const [formData, setFormData] = useState({
    description: '',
    emailType: 'genel',
    recipient: '',
    tone: 'profesyonel'
  });
  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailTypes = [
    { value: 'genel', label: 'Genel E-posta' },
    { value: 'musteri_destegi', label: 'Müşteri Desteği' },
    { value: 'is_basvurusu', label: 'İş Başvurusu' },
    { value: 'teklif', label: 'Teklif/Öneri' },
    { value: 'tesekkur', label: 'Teşekkür' },
    { value: 'ozur', label: 'Özür/Açıklama' },
    { value: 'davet', label: 'Davet' },
    { value: 'bilgilendirme', label: 'Bilgilendirme' }
  ];

  const tones = [
    { value: 'profesyonel', label: 'Profesyonel' },
    { value: 'samimi', label: 'Samimi' },
    { value: 'formal', label: 'Formal' },
    { value: 'dostane', label: 'Dostane' },
    { value: 'ikna_edici', label: 'İkna Edici' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generateEmail = async () => {
    if (!formData.description.trim()) {
      setError('Lütfen e-posta açıklamasını girin!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/email/generate', {
        content: formData.description,
        recipient: formData.recipient,
        emailType: formData.emailType,
        tone: formData.tone
      });
      setGeneratedEmail(response.data.email);
    } catch (error) {
      setError(error.response?.data?.message || 'E-posta oluşturma sırasında hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const emailText = `${generatedEmail.subject}\n\n${generatedEmail.body}`;
    navigator.clipboard.writeText(emailText);
  };

  const clearForm = () => {
    setFormData({
      description: '',
      emailType: 'genel',
      recipient: '',
      tone: 'profesyonel'
    });
    setGeneratedEmail(null);
    setError('');
  };

  const sampleDescriptions = [
    'Müşteri hizmetlerine ürün iadesi hakkında bilgi almak istiyorum',
    'İş başvurusu için teşekkür e-postası yazmak istiyorum',
    'Toplantı daveti göndermek istiyorum',
    'Proje tesliminde gecikme hakkında özür dilemek istiyorum',
    'Yeni ürün lansmanı hakkında bilgilendirme yapmak istiyorum'
  ];

  return (
    <div className="space-y-6">
      {/* E-posta Form */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          E-posta Oluştur
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* E-posta Türü */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-posta Türü
            </label>
            <select
              name="emailType"
              value={formData.emailType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {emailTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ton */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-posta Tonu
            </label>
            <select
              name="tone"
              value={formData.tone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {tones.map(tone => (
                <option key={tone.value} value={tone.value}>
                  {tone.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Alıcı (Opsiyonel) */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alıcı (İsteğe bağlı)
          </label>
          <input
            type="text"
            name="recipient"
            value={formData.recipient}
            onChange={handleChange}
            placeholder="Örn: Sayın Müdür, Ahmet Bey, vb."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Açıklama */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            E-posta Açıklaması
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Ne hakkında e-posta yazacağınızı detaylı olarak açıklayın..."
            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        {/* Örnek Açıklamalar */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Örnek açıklamalar:</p>
          <div className="flex flex-wrap gap-2">
            {sampleDescriptions.map((desc, index) => (
              <button
                key={index}
                onClick={() => setFormData(prev => ({ ...prev, description: desc }))}
                className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                {desc.substring(0, 50)}...
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mt-6 flex space-x-4">
          <button
            onClick={generateEmail}
            disabled={!formData.description.trim() || loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Oluşturuluyor...' : 'E-posta Oluştur'}
          </button>
          
          <button
            onClick={clearForm}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Temizle
          </button>
        </div>
      </div>

      {/* Oluşturulan E-posta */}
      {generatedEmail && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">✉️</span>
            Oluşturulan E-posta
          </h3>
          
          <div className="space-y-4">
            {/* Konu */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <label className="block text-sm font-medium text-blue-900 mb-1">
                Konu:
              </label>
              <p className="text-blue-800 font-medium">{generatedEmail.subject}</p>
            </div>

            {/* E-posta İçeriği */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                E-posta İçeriği:
              </label>
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {generatedEmail.body}
              </div>
            </div>

            {/* Aksiyonlar */}
            <div className="flex space-x-4">
              <button
                onClick={copyToClipboard}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                📋 Kopyala
              </button>
              
              <button
                onClick={() => {
                  const element = document.createElement('a');
                  const file = new Blob([`Konu: ${generatedEmail.subject}\n\n${generatedEmail.body}`], { type: 'text/plain' });
                  element.href = URL.createObjectURL(file);
                  element.download = 'email.txt';
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                💾 TXT olarak İndir
              </button>
              
              <button
                onClick={() => {
                  const subject = encodeURIComponent(generatedEmail.subject);
                  const body = encodeURIComponent(generatedEmail.body);
                  window.open(`mailto:?subject=${subject}&body=${body}`);
                }}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                📧 E-posta Uygulamasında Aç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* İpuçları */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="font-medium text-orange-800 mb-2">💡 E-posta Yazma İpuçları</h4>
        <ul className="text-sm text-orange-700 space-y-1">
          <li>• Ne istediğinizi mümkün olduğunca açık ve detaylı belirtin</li>
          <li>• Context sağlayın - kim için, ne amaçla yazıyorsunuz</li>
          <li>• Özel durumlar için ton seçimini uygun yapın</li>
          <li>• Oluşturulan e-postayı göndermeden önce gözden geçirin</li>
        </ul>
      </div>
    </div>
  );
};

export default EmailWriter; 