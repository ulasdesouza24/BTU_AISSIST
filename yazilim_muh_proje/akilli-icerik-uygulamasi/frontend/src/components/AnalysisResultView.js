import React from 'react';
import {
  Bar, Line, Pie, Doughnut, Radar
} from 'react-chartjs-2';

// Grafik tipine göre uygun Chart.js bileşenini render eden yardımcı fonksiyon
const renderChart = (grafik, index) => {
  const { chartjsKodu } = grafik;
  // Savunmacı kontrol: chartjsKodu ve chartjsKodu.data/labels mevcut mu?
  if (!chartjsKodu || !chartjsKodu.data || !Array.isArray(chartjsKodu.data.labels)) {
    return (
      <div key={index} className="bg-red-100 text-red-700 p-3 rounded mb-2 border border-red-300">
        Grafik verisi eksik veya hatalı. Lütfen sistem yöneticisine başvurun.
      </div>
    );
  }
  const chartProps = {
    data: chartjsKodu.data,
    options: chartjsKodu.options
  };
  switch (chartjsKodu.type) {
    case 'bar': return <Bar key={index} {...chartProps} />; // Bar chart
    case 'line': return <Line key={index} {...chartProps} />; // Line chart
    case 'pie': return <Pie key={index} {...chartProps} />; // Pie chart
    case 'doughnut': return <Doughnut key={index} {...chartProps} />; // Doughnut chart
    case 'radar': return <Radar key={index} {...chartProps} />; // Radar chart
    default: return <Bar key={index} {...chartProps} />; // Varsayılan olarak bar chart
  }
};

const AnalysisResultView = ({ analysis }) => {
  if (!analysis || !analysis.analiz) return null;

  // Grafiklerin başlıklarla eşleşmesini kolaylaştırmak için türüne göre grupla
  const grafikGruplari = {
    genel: [],
    kategorik: [],
    segmentasyon: [],
    trend: [],
    performans: [],
    makas: [],
    rekabet: [],
    risk: [],
    diger: []
  };
  if (analysis.grafikler && Array.isArray(analysis.grafikler)) {
    analysis.grafikler.forEach(grafik => {
      const tur = (grafik.tur || grafik.baslik || '').toLowerCase();
      if (tur.includes('genel')) grafikGruplari.genel.push(grafik);
      if (tur.includes('kategorik')) grafikGruplari.kategorik.push(grafik);
      if (tur.includes('segment')) grafikGruplari.segmentasyon.push(grafik);
      if (tur.includes('trend')) grafikGruplari.trend.push(grafik);
      if (tur.includes('performans')) grafikGruplari.performans.push(grafik);
      if (tur.includes('makas')) grafikGruplari.makas.push(grafik);
      if (tur.includes('rekabet')) grafikGruplari.rekabet.push(grafik);
      if (tur.includes('risk') || tur.includes('fırsat')) grafikGruplari.risk.push(grafik);
      if (!(
        tur.includes('genel') || tur.includes('kategorik') || tur.includes('segment') || tur.includes('trend') || tur.includes('performans') || tur.includes('makas') || tur.includes('rekabet') || tur.includes('risk') || tur.includes('fırsat')
      )) {
        grafikGruplari.diger.push(grafik);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* 1. Genel Özet */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-2xl font-bold text-blue-600 mb-4 flex items-center">
          🔍 {analysis.analiz.veriTuru}
        </h3>
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h4 className="text-lg font-semibold text-blue-800 mb-2">📊 Genel Özet</h4>
          <p className="text-blue-700">{analysis.analiz.genelOzet}</p>
        </div>
        {/* Genel dağılım grafiği */}
        {grafikGruplari.genel.length > 0 && (
          <div className="mb-6">
            <h5 className="text-md font-semibold text-blue-700 mb-2">Genel Dağılım Grafiği</h5>
            {grafikGruplari.genel.map((grafik, i) => (
              <div key={i} className="mb-4">{renderChart(grafik, i)}</div>
            ))}
          </div>
        )}
        {/* 2. Veri Kalitesi */}
        {analysis.analiz.veriKalitesi && (
          <div className="mt-6 bg-indigo-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-indigo-800 mb-2">🎯 Veri Kalitesi Değerlendirmesi</h4>
            <p className="text-indigo-700">{analysis.analiz.veriKalitesi}</p>
          </div>
        )}
        {/* 3. Kategorik Segmentasyon */}
        {analysis.analiz.kategorikAnaliz && (
          <div className="mt-6 bg-violet-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-violet-800 mb-2">📊 Kategorik Segmentasyon</h4>
            <p className="text-violet-700">{analysis.analiz.kategorikAnaliz}</p>
            {/* Pie/bar chart */}
            {grafikGruplari.kategorik.length > 0 && (
              <div className="mt-4">
                <h5 className="text-md font-semibold text-violet-700 mb-2">Kategorik Dağılım Grafiği</h5>
                {grafikGruplari.kategorik.map((grafik, i) => (
                  <div key={i} className="mb-4">{renderChart(grafik, i)}</div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* 4. Segmentasyon Bulguları */}
        {analysis.analiz.segmentasyonBulguları && (
          <div className="mt-6 bg-emerald-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-emerald-800 mb-2">🏆 Segmentasyon Bulguları</h4>
            <p className="text-emerald-700">{analysis.analiz.segmentasyonBulguları}</p>
            {/* Segmentasyon grafiği */}
            {grafikGruplari.segmentasyon.length > 0 && (
              <div className="mt-4">
                <h5 className="text-md font-semibold text-emerald-700 mb-2">Segmentasyon Grafiği</h5>
                {grafikGruplari.segmentasyon.map((grafik, i) => (
                  <div key={i} className="mb-4">{renderChart(grafik, i)}</div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* 5. Detaylı Analiz */}
        <div className="mt-6 bg-green-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-green-800 mb-2">🔬 Detaylı Analiz</h4>
          <p className="text-green-700">{analysis.analiz.derinAnaliz}</p>
        </div>
        {/* 6. Trend Analizi */}
        {analysis.analiz.trendAnalizi && (
          <div className="mt-6 bg-cyan-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-cyan-800 mb-2">📈 Trend Analizi</h4>
            <p className="text-cyan-700">{analysis.analiz.trendAnalizi}</p>
            {/* Line chart */}
            {grafikGruplari.trend.length > 0 && (
              <div className="mt-4">
                <h5 className="text-md font-semibold text-cyan-700 mb-2">Trend Grafiği</h5>
                {grafikGruplari.trend.map((grafik, i) => (
                  <div key={i} className="mb-4">{renderChart(grafik, i)}</div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* 7. Performans Analizi */}
        {analysis.analiz.performansAnlizi && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-blue-800 mb-2">🏅 Performans Analizi</h4>
            <p className="text-blue-700">{analysis.analiz.performansAnlizi}</p>
            {grafikGruplari.performans.length > 0 && (
              <div className="mt-4">
                <h5 className="text-md font-semibold text-blue-700 mb-2">Performans Grafiği</h5>
                {grafikGruplari.performans.map((grafik, i) => (
                  <div key={i} className="mb-4">{renderChart(grafik, i)}</div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* 8. Makas Analizi */}
        {analysis.analiz.makasAnalizi && (
          <div className="mt-6 bg-pink-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-pink-800 mb-2">📑 Makas Analizi</h4>
            <p className="text-pink-700">{analysis.analiz.makasAnalizi}</p>
            {grafikGruplari.makas.length > 0 && (
              <div className="mt-4">
                <h5 className="text-md font-semibold text-pink-700 mb-2">Makas Grafiği</h5>
                {grafikGruplari.makas.map((grafik, i) => (
                  <div key={i} className="mb-4">{renderChart(grafik, i)}</div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* 9. Rekabet Analizi */}
        {analysis.analiz.rekabetAnalizi && (
          <div className="mt-6 bg-slate-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-slate-800 mb-2">⚔️ Rekabet Analizi</h4>
            <p className="text-slate-700">{analysis.analiz.rekabetAnalizi}</p>
            {grafikGruplari.rekabet.length > 0 && (
              <div className="mt-4">
                <h5 className="text-md font-semibold text-slate-700 mb-2">Rekabet Grafiği</h5>
                {grafikGruplari.rekabet.map((grafik, i) => (
                  <div key={i} className="mb-4">{renderChart(grafik, i)}</div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* 10. Risk ve Fırsat Analizi */}
        {analysis.analiz.riskFirsatAnalizi && (
          <div className="mt-6 bg-amber-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-amber-800 mb-2">⚖️ Risk ve Fırsat Analizi</h4>
            <p className="text-amber-700">{analysis.analiz.riskFirsatAnalizi}</p>
            {grafikGruplari.risk.length > 0 && (
              <div className="mt-4">
                <h5 className="text-md font-semibold text-amber-700 mb-2">Risk/Fırsat Grafiği</h5>
                {grafikGruplari.risk.map((grafik, i) => (
                  <div key={i} className="mb-4">{renderChart(grafik, i)}</div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* 11. Kritik Bulgular */}
        {analysis.analiz.kiritikBulgular && (
          <div className="mt-6 bg-red-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-red-800 mb-3">🚨 Kritik Bulgular</h4>
            <ul className="space-y-2">
              {analysis.analiz.kiritikBulgular.map((bulgu, index) => (
                <li key={index} className="flex items-start text-red-700">
                  <span className="mr-2 text-red-500">⚡</span>
                  {bulgu}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* 12. Öngörüler ve Projeksiyonlar */}
        {analysis.analiz.ongoruler && (
          <div className="mt-6 bg-teal-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-teal-800 mb-3">🔮 Öngörüler ve Projeksiyonlar</h4>
            <ul className="space-y-2">
              {analysis.analiz.ongoruler.map((onggoru, index) => (
                <li key={index} className="flex items-start text-teal-700">
                  <span className="mr-2 text-teal-500">🎯</span>
                  {onggoru}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* 13. Aksiyon Önerileri */}
        {analysis.analiz.aksiyonOnerileri && (
          <div className="mt-6 bg-emerald-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-emerald-800 mb-3">🚀 Aksiyon Önerileri</h4>
            <ul className="space-y-2">
              {analysis.analiz.aksiyonOnerileri.map((aksiyon, index) => (
                <li key={index} className="flex items-start text-emerald-700">
                  <span className="mr-2 text-emerald-500">✅</span>
                  {aksiyon}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* 14. Genel Sonuç */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-2">🎯 Genel Sonuç</h4>
          <p className="text-gray-700">{analysis.analiz.sonuc}</p>
        </div>
      </div>
      {/* Diğer grafikler (eşleşmeyenler) */}
      {grafikGruplari.diger.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-2xl font-bold text-purple-600 mb-6 flex items-center">
            📈 Diğer Analiz Grafikleri
          </h3>
          <div className="grid gap-8">
            {grafikGruplari.diger.map((grafik, index) => (
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
                      <span className="font-semibold">Açıklama:</span> {grafik.aciklama}
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold">📊 Veri Kaynakları:</span> {grafik.veriKaynaklari?.join(', ')}
                    </p>
                  </div>
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
    </div>
  );
};

export default AnalysisResultView;
// Bu bileşen analiz detaylarını ve grafiklerini modern ve okunabilir şekilde gösterir.
