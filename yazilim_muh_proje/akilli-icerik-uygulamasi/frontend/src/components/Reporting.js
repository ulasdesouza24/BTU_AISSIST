import React, { useState } from 'react';
import axios from 'axios';

const Reporting = () => {
  const [report, setReport] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editedReport, setEditedReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const sampleReport = `# Örnek Veri Analizi Raporu

## Genel Özet
Bu rapor, sunulan verilerin detaylı analizini içermektedir.

## Ana Bulgular
- Veri seti toplam 1000 kayıt içermektedir
- En yüksek değer 95.2'dir
- Ortalama değer 67.8'dir

## Öneriler
1. Veri kalitesi geliştirilebilir
2. Eksik veriler tamamlanmalıdır
3. Düzenli güncellemeler yapılmalıdır

## Sonuç
Analiz sonuçları genel olarak pozitif eğilim göstermektedir.`;

  const handleEdit = async () => {
    if (!report.trim()) {
      setError('Lütfen düzenlenecek rapor metnini girin!');
      return;
    }

    if (!editInstructions.trim()) {
      setError('Lütfen düzenleme talimatlarını girin!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/report/edit', {
        originalReport: report,
        editInstructions: editInstructions
      });

      setEditedReport(response.data.editedReport);
    } catch (error) {
      setError(error.response?.data?.message || 'Rapor düzenleme sırasında hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    const reportToExport = editedReport || report;
    
    if (!reportToExport.trim()) {
      setError('Dışa aktarılacak rapor bulunamadı!');
      return;
    }

    try {
      const response = await axios.post(`/report/export/${format}`, {
        reportContent: reportToExport,
        fileName: fileName || 'rapor'
      }, {
        responseType: 'blob'
      });

      // Dosyayı indir
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${fileName || 'rapor'}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(`${format.toUpperCase()} dışa aktarma sırasında hata oluştu!`);
    }
  };

  const loadSampleReport = () => {
    setReport(sampleReport);
    setEditedReport('');
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Rapor Giriş Alanı */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Rapor İçeriği
          </h3>
          <button
            onClick={loadSampleReport}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Örnek Rapor Yükle
          </button>
        </div>
        
        <textarea
          value={report}
          onChange={(e) => setReport(e.target.value)}
          placeholder="Rapor içeriğinizi buraya girin veya veri analizi modülünden gelen sonuçları yapıştırın..."
          className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      {/* Düzenleme Alanı */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Rapor Düzenleme
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Düzenleme Talimatları
            </label>
            <textarea
              value={editInstructions}
              onChange={(e) => setEditInstructions(e.target.value)}
              placeholder="Raporda hangi değişiklikleri yapmak istiyorsunuz? Örnek: 'Daha teknik detaylar ekle', 'Dili daha basit yap', 'Grafik önerileri ekle'"
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            onClick={handleEdit}
            disabled={loading || !report.trim() || !editInstructions.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Düzenleniyor...' : 'Raporu Düzenle'}
          </button>
        </div>
      </div>

      {/* Düzenlenmiş Rapor */}
      {editedReport && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">✨</span>
            Düzenlenmiş Rapor
          </h3>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
              {editedReport}
            </pre>
          </div>

          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => setReport(editedReport)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Bu Versiyonu Kullan
            </button>
          </div>
        </div>
      )}

      {/* Dışa Aktarma */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Raporu Dışa Aktar
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dosya Adı
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="rapor"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => handleExport('pdf')}
              disabled={!report.trim()}
              className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="mr-2">📄</span>
              PDF olarak İndir
            </button>
            
            <button
              onClick={() => handleExport('docx')}
              disabled={!report.trim()}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="mr-2">📝</span>
              Word olarak İndir
            </button>
          </div>
        </div>
      </div>

      {/* Yardım */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">💡 Rapor Düzenleme İpuçları</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• "Daha detaylı analiz ekle" - Raporunuza daha derinlemesine analiz ekler</li>
          <li>• "Dili daha basit yap" - Teknik terimleri basitleştirir</li>
          <li>• "Grafik önerileri ekle" - Veri görselleştirme önerileri ekler</li>
          <li>• "Sonuç ve öneriler bölümünü genişlet" - Actionable öneriler ekler</li>
        </ul>
      </div>
    </div>
  );
};

export default Reporting; 