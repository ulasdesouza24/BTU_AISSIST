import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AnalysisResultView from './AnalysisResultView';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportHistory = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]); // Kullanıcıya ait raporlar
  const [search, setSearch] = useState(''); // Arama metni
  const [onlyFavorites, setOnlyFavorites] = useState(false); // Sadece favoriler filtresi
  const [loading, setLoading] = useState(false); // Liste yükleniyor mu?
  const [error, setError] = useState(''); // Listeleme hatası
  const [selectedReport, setSelectedReport] = useState(null); // Detayda gösterilecek rapor
  const [detailLoading, setDetailLoading] = useState(false); // Detay yükleniyor mu?
  const [detailError, setDetailError] = useState(''); // Detay hata mesajı

  // Raporları API'den çek
  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search; // Arama parametresi
      if (onlyFavorites) params.onlyFavorites = true; // Favori filtresi
      const res = await axios.get('/report/my-reports', { params });
      setReports(res.data.reports || []); // Gelen raporları state'e ata
    } catch (err) {
      setError('Raporlar alınırken hata oluştu.'); // Hata mesajı
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchReports();
    // eslint-disable-next-line
  }, [user, search, onlyFavorites]);

  const toggleFavorite = async (reportId, isFavorite) => {
    try {
      await axios.post(`/report/${reportId}/favorite`, { isFavorite: !isFavorite });
      setReports(reports => reports.map(r => r.id === reportId ? { ...r, is_favorite: !isFavorite } : r));
    } catch {
      setError('Favori güncellenemedi.');
    }
  };

  const handleShowDetail = async (reportId) => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const res = await axios.get(`/report/${reportId}`);
      setSelectedReport({
        id: reportId,
        analysis: res.data.report.ai_analysis
      });
    } catch (err) {
      setDetailError('Analiz detayı alınamadı.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Bu analizi silmek istediğinize emin misiniz?')) return;
    setDetailError('');
    try {
      await axios.delete(`/report/${reportId}`);
      setReports(reports => reports.filter(r => r.id !== reportId));
      setSelectedReport(null);
    } catch (err) {
      setDetailError('Analiz silinirken hata oluştu.');
    }
  };

  // Analiz detayındaki tüm canvasları PDF'e kaydet (çok sayfalı)
  const handleExportPDF = async () => {
    const detailDiv = document.querySelector('.analysis-detail-area');
    if (!detailDiv) return;
    const canvas = await html2canvas(detailDiv, {useCORS: true, scale: 2});
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let position = 0;
    let remainingHeight = pdfHeight;
    let pageNum = 0;
    const canvasHeight = canvas.height;
    const canvasWidth = canvas.width;
    const pageCanvasHeight = Math.floor((pageHeight * canvasWidth) / pageWidth);

    while (remainingHeight > 0) {
      // Her sayfa için yeni bir canvas oluştur
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasWidth;
      pageCanvas.height = Math.min(pageCanvasHeight, canvasHeight - position);
      const ctx = pageCanvas.getContext('2d');
      ctx.drawImage(
        canvas,
        0, position, canvasWidth, pageCanvas.height,
        0, 0, canvasWidth, pageCanvas.height
      );
      const pageImgData = pageCanvas.toDataURL('image/png');
      if (pageNum > 0) pdf.addPage();
      pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, (pageCanvas.height * pdfWidth) / canvasWidth);
      position += pageCanvasHeight;
      remainingHeight -= pageHeight;
      pageNum++;
    }
    pdf.save('analiz_detay.pdf');
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleFavoritesToggle = () => {
    setOnlyFavorites(prev => !prev);
  };

  const handleReportClick = (reportId) => {
    if (selectedReport && selectedReport.id === reportId) {
      setSelectedReport(null);
    } else {
      handleShowDetail(reportId);
    }
  };

  return (
    <div className="report-history-container">
      <h2>Analiz Geçmişim</h2>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Dosya adı veya veri türü ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <label>
          <input
            type="checkbox"
            checked={onlyFavorites}
            onChange={e => setOnlyFavorites(e.target.checked)}
          /> Sadece Favoriler
        </label>
      </div>
      {loading ? <div>Yükleniyor...</div> : error ? <div style={{color:'red'}}>{error}</div> : (
        <table className="report-history-table">
          <thead>
            <tr>
              <th>Favori</th>
              <th>Dosya Adı</th>
              <th>Veri Türü</th>
              <th>Özet</th>
              <th>Oluşturulma</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id} className={selectedReport && selectedReport.id === r.id ? 'active' : ''}>
                <td>
                  <button onClick={() => toggleFavorite(r.id, r.is_favorite)} style={{ color: r.is_favorite ? 'gold' : 'gray', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer' }} title={r.is_favorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}>
                    ★
                  </button>
                </td>
                <td>{r.file_name}</td>
                <td>{r.veri_turu}</td>
                <td>{r.sonuc_ozeti_kisa}</td>
                <td>{new Date(r.created_at).toLocaleString('tr-TR')}</td>
                <td>
                  <button onClick={() => handleShowDetail(r.id)} style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:4,padding:'4px 12px',cursor:'pointer', marginRight: 8}}>Görüntüle</button>
                  <button onClick={() => handleDelete(r.id)} style={{background:'#ef4444',color:'#fff',padding:'4px 12px',border:'none',borderRadius:4,cursor:'pointer'}}>Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {selectedReport && (
        <div style={{marginTop:32}} className="analysis-detail-area">
          <h3 style={{fontWeight:'bold',fontSize:20,marginBottom:16}}>Analiz Sonucu</h3>
          {detailLoading ? <div>Yükleniyor...</div> : detailError ? <div style={{color:'red'}}>{detailError}</div> : <AnalysisResultView analysis={selectedReport.analysis} />}
          <div style={{marginTop:16,display:'flex',gap:12}}>
            <button onClick={()=>setSelectedReport(null)} style={{background:'#e5e7eb',padding:'6px 18px',border:'none',borderRadius:4,cursor:'pointer'}}>Kapat</button>
            <button onClick={handleExportPDF} style={{background:'#10b981',color:'#fff',padding:'6px 18px',border:'none',borderRadius:4,cursor:'pointer'}}>PDF Olarak Kaydet</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportHistory;
