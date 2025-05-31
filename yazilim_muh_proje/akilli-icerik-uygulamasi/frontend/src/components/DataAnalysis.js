import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Radar } from 'react-chartjs-2';

// Chart.js kayıt
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale
);

const DataAnalysis = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
      'text/xml': ['.xml']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        setError('');
        setAnalysis(null);
      }
    }
  });

  const handleAnalysis = async () => {
    if (!file) {
      setError('Lütfen analiz edilecek bir dosya seçin!');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/analysis/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setAnalysis(response.data.analysis);
    } catch (error) {
      setError(error.response?.data?.message || 'Analiz sırasında hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setAnalysis(null);
    setError('');
  };

  // Grafik bileşenini render et
  const renderChart = (grafik, index) => {
    const { chartjsKodu } = grafik;
    const chartProps = {
      data: chartjsKodu.data,
      options: chartjsKodu.options
    };

    switch (chartjsKodu.type) {
      case 'bar':
        return <Bar key={index} {...chartProps} />;
      case 'line':
        return <Line key={index} {...chartProps} />;
      case 'pie':
        return <Pie key={index} {...chartProps} />;
      case 'doughnut':
        return <Doughnut key={index} {...chartProps} />;
      case 'radar':
        return <Radar key={index} {...chartProps} />;
      default:
        return <Bar key={index} {...chartProps} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">📊 Akıllı Veri Analizi</h2>
        <p className="text-blue-100">
          Dosyalarınızı yükleyin, AI destekli analiz ve görsel raporlar alın
        </p>
      </div>

      {/* Dosya Yükleme Alanı */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">📁</span>
          Dosya Yükleme
        </h3>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="text-4xl">📁</div>
            {isDragActive ? (
              <p className="text-blue-600">Dosyayı buraya bırakın...</p>
            ) : (
              <div>
                <p className="text-gray-600">
                  Dosyayı sürükleyip bırakın veya seçmek için tıklayın
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Desteklenen formatlar: CSV, XLSX, XLS, PDF, XML
                </p>
              </div>
            )}
          </div>
        </div>

        {file && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📄</span>
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={resetAnalysis}
                className="text-red-500 hover:text-red-700"
              >
                🗑️
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            ❌ {error}
          </div>
        )}

        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleAnalysis}
            disabled={!file || loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analiz Ediliyor...
              </>
            ) : (
              '🚀 Analizi Başlat'
            )}
          </button>
          
          {analysis && (
            <button
              onClick={() => window.location.href = '/reporting'}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              📈 Raporlama Modülüne Git
            </button>
          )}
        </div>
      </div>

      {/* Analiz Sonuçları */}
      {analysis && analysis.aiAnalysis && (
        <div className="space-y-6">
          {/* Analiz Metni - Yeni JSON formatı */}
          {typeof analysis.aiAnalysis === 'object' && analysis.aiAnalysis.analiz ? (
            <>
              {/* Genel Bilgiler */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-2xl font-bold text-blue-600 mb-4 flex items-center">
                  🔍 {analysis.aiAnalysis.analiz.veriTuru}
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">📊 Genel Özet</h4>
                    <p className="text-blue-700">{analysis.aiAnalysis.analiz.genelOzet}</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-green-800 mb-2">🔬 Detaylı Analiz</h4>
                    <p className="text-green-700">{analysis.aiAnalysis.analiz.derinAnaliz}</p>
                  </div>
                </div>

                {/* Veri Kalitesi */}
                {analysis.aiAnalysis.analiz.veriKalitesi && (
                  <div className="mt-6 bg-indigo-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-indigo-800 mb-2">🎯 Veri Kalitesi Değerlendirmesi</h4>
                    <p className="text-indigo-700">{analysis.aiAnalysis.analiz.veriKalitesi}</p>
                  </div>
                )}

                {/* Kritik Bulgular */}
                {analysis.aiAnalysis.analiz.kiritikBulgular && (
                  <div className="mt-6 bg-red-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-red-800 mb-3">🚨 Kritik Bulgular</h4>
                    <ul className="space-y-2">
                      {analysis.aiAnalysis.analiz.kiritikBulgular.map((bulgu, index) => (
                        <li key={index} className="flex items-start text-red-700">
                          <span className="mr-2 text-red-500">⚡</span>
                          {bulgu}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Kategorik Analiz */}
                {analysis.aiAnalysis.analiz.kategorikAnaliz && (
                  <div className="mt-6 bg-violet-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-violet-800 mb-2">📊 Kategorik Segmentasyon</h4>
                    <p className="text-violet-700">{analysis.aiAnalysis.analiz.kategorikAnaliz}</p>
                  </div>
                )}

                {/* Performans Analizi */}
                {analysis.aiAnalysis.analiz.performansAnlizi && (
                  <div className="mt-6 bg-blue-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">🏆 Performans Analizi</h4>
                    <p className="text-blue-700">{analysis.aiAnalysis.analiz.performansAnlizi}</p>
                  </div>
                )}

                {/* Makas Analizi */}
                {analysis.aiAnalysis.analiz.makasAnalizi && (
                  <div className="mt-6 bg-pink-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-pink-800 mb-2">📏 Makas Analizi</h4>
                    <p className="text-pink-700">{analysis.aiAnalysis.analiz.makasAnalizi}</p>
                  </div>
                )}

                {/* Segmentasyon Bulguları */}
                {analysis.aiAnalysis.analiz.segmentasyonBulguları && (
                  <div className="mt-6 bg-emerald-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-emerald-800 mb-2">🎯 Segmentasyon Bulguları</h4>
                    <p className="text-emerald-700">{analysis.aiAnalysis.analiz.segmentasyonBulguları}</p>
                  </div>
                )}

                {/* Rekabet Analizi */}
                {analysis.aiAnalysis.analiz.rekabetAnalizi && (
                  <div className="mt-6 bg-slate-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">⚔️ Rekabet Analizi</h4>
                    <p className="text-slate-700">{analysis.aiAnalysis.analiz.rekabetAnalizi}</p>
                  </div>
                )}

                {/* Bağlantılar ve İlişkiler */}
                {analysis.aiAnalysis.analiz.baglantilarVeIliskiler && (
                  <div className="mt-6 bg-purple-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-purple-800 mb-2">🔗 Veri İlişkileri ve Bağlantılar</h4>
                    <p className="text-purple-700">{analysis.aiAnalysis.analiz.baglantilarVeIliskiler}</p>
                  </div>
                )}

                {/* Trend Analizi */}
                {analysis.aiAnalysis.analiz.trendAnalizi && (
                  <div className="mt-6 bg-cyan-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-cyan-800 mb-2">📈 Trend Analizi</h4>
                    <p className="text-cyan-700">{analysis.aiAnalysis.analiz.trendAnalizi}</p>
                  </div>
                )}

                {/* Anomali Tespiti */}
                {analysis.aiAnalysis.analiz.anomaliTespit && (
                  <div className="mt-6 bg-orange-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-orange-800 mb-2">⚠️ Anomali Tespiti</h4>
                    <p className="text-orange-700">{analysis.aiAnalysis.analiz.anomaliTespit}</p>
                  </div>
                )}

                {/* Risk ve Fırsat Analizi - Yeni format */}
                {analysis.aiAnalysis.analiz.riskFirsatAnalizi && (
                  <div className="mt-6 bg-amber-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-amber-800 mb-2">⚖️ Risk ve Fırsat Analizi</h4>
                    <p className="text-amber-700">{analysis.aiAnalysis.analiz.riskFirsatAnalizi}</p>
                  </div>
                )}

                {/* Öngörüler */}
                {analysis.aiAnalysis.analiz.ongoruler && (
                  <div className="mt-6 bg-teal-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-teal-800 mb-3">🔮 Öngörüler ve Projeksiyonlar</h4>
                    <ul className="space-y-2">
                      {analysis.aiAnalysis.analiz.ongoruler.map((onggoru, index) => (
                        <li key={index} className="flex items-start text-teal-700">
                          <span className="mr-2 text-teal-500">🎯</span>
                          {onggoru}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Aksiyon Önerileri */}
                {analysis.aiAnalysis.analiz.aksiyonOnerileri && (
                  <div className="mt-6 bg-emerald-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-emerald-800 mb-3">🚀 Aksiyon Önerileri</h4>
                    <ul className="space-y-2">
                      {analysis.aiAnalysis.analiz.aksiyonOnerileri.map((aksiyon, index) => (
                        <li key={index} className="flex items-start text-emerald-700">
                          <span className="mr-2 text-emerald-500">✅</span>
                          {aksiyon}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Riskler ve Fırsatlar - Eski format için backward compatibility */}
                {analysis.aiAnalysis.analiz.risklerveFirsatlar && (
                  <div className="mt-6 bg-amber-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-amber-800 mb-2">⚖️ Riskler ve Fırsatlar</h4>
                    <p className="text-amber-700">{analysis.aiAnalysis.analiz.risklerveFirsatlar}</p>
                  </div>
                )}

                {/* Çıkarımlar - Eski format için backward compatibility */}
                {analysis.aiAnalysis.analiz.cikarimlar && (
                  <div className="mt-6 bg-yellow-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-yellow-800 mb-3">💡 Ana Bulgular ve Öneriler</h4>
                    <ul className="space-y-2">
                      {analysis.aiAnalysis.analiz.cikarimlar.map((cikarim, index) => (
                        <li key={index} className="flex items-start text-yellow-700">
                          <span className="mr-2">✓</span>
                          {cikarim}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sonuç */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">🎯 Genel Sonuç</h4>
                  <p className="text-gray-700">{analysis.aiAnalysis.analiz.sonuc}</p>
                </div>
              </div>

              {/* Grafikler */}
              {analysis.aiAnalysis.grafikler && analysis.aiAnalysis.grafikler.length > 0 && (
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-2xl font-bold text-purple-600 mb-6 flex items-center">
                    📈 Görsel Analiz Grafikleri
                  </h3>
                  
                  <div className="grid gap-8">
                    {analysis.aiAnalysis.grafikler.map((grafik, index) => (
                      <div key={index} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200 shadow-sm">
                        <div className="mb-6">
                          <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-3">
                              Grafik {index + 1}
                            </span>
                            {grafik.baslik}
                          </h4>
                          <div className="bg-white rounded-lg p-3 mb-3">
                            <p className="text-gray-600 text-sm mb-2">
                              <span className="font-semibold">📋 Açıklama:</span> {grafik.aciklama}
                            </p>
                            <p className="text-xs text-gray-500">
                              <span className="font-semibold">📊 Veri Kaynakları:</span> {grafik.veriKaynaklari?.join(', ')}
                            </p>
                          </div>
                          
                          {/* Grafik Analiz Sonucu */}
                          {(grafik.analizSonucu || grafik.isKarar) && (
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                              {grafik.analizSonucu && (
                                <p className="text-sm text-blue-800 mb-2">
                                  <span className="font-semibold">🧠 Analiz Sonucu:</span> {grafik.analizSonucu}
                                </p>
                              )}
                              {grafik.isKarar && (
                                <p className="text-sm text-blue-800">
                                  <span className="font-semibold">💼 İş Kararı:</span> {grafik.isKarar}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-inner">
                          <div style={{ position: 'relative', height: '400px', width: '100%' }}>
                            {renderChart(grafik, index)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            // Eski metin formatı için fallback
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📊</span>
                Analiz Sonuçları
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Dosya Bilgileri</h4>
                  <p className="text-sm text-blue-800">
                    Dosya: {analysis.fileName}
                  </p>
                  <p className="text-sm text-blue-800">
                    Analiz Tarihi: {new Date(analysis.timestamp).toLocaleString('tr-TR')}
                  </p>
                </div>

                {analysis.originalData?.type === 'table' && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Veri Özeti</h4>
                    <p className="text-sm text-green-800">
                      Toplam Satır: {analysis.originalData.rowCount}
                    </p>
                    <p className="text-sm text-green-800">
                      Sütunlar: {analysis.originalData.headers?.join(', ')}
                    </p>
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">AI Analizi</h4>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {analysis.aiAnalysis}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Yardım */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">💡 İpuçları</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• En iyi sonuçlar için dosyalarınızın düzenli ve temiz olmasına dikkat edin</li>
          <li>• CSV dosyalarında başlık satırı bulunmasını sağlayın</li>
          <li>• PDF dosyalarının metin tabanlı olması gerekir (görüntü değil)</li>
          <li>• Maksimum dosya boyutu 10MB'dır</li>
          <li>• OpenAI API anahtarı ekleyerek daha detaylı analizler alabilirsiniz</li>
        </ul>
      </div>
    </div>
  );
};

export default DataAnalysis; 