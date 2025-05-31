import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const Translation = () => {
  const [textToTranslate, setTextToTranslate] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [translationMode, setTranslationMode] = useState('text'); // 'text' or 'file'

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        setError('');
        setTranslatedText('');
      }
    }
  });

  const handleTextTranslation = async () => {
    if (!textToTranslate.trim()) {
      setError('Lütfen çevrilecek metni girin!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/translation/text', {
        text: textToTranslate,
        targetLanguage: 'tr'
      });

      setTranslatedText(response.data.translatedText);
    } catch (error) {
      setError(error.response?.data?.message || 'Çeviri sırasında hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const handleFileTranslation = async () => {
    if (!file) {
      setError('Lütfen çevrilecek dosyayı seçin!');
      return;
    }

    setLoading(true);
    setError('');

    // Dosya içeriğini okuyup text olarak gönder
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const response = await axios.post('/translation/file', {
          fileContent: e.target.result,
          fileName: file.name,
          targetLanguage: 'tr'
        });

        setTranslatedText(response.data.translatedContent);
      } catch (error) {
        setError(error.response?.data?.message || 'Çeviri sırasında hata oluştu!');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
    // Kopyalandı bildirimi gösterilebilir
  };

  const clearAll = () => {
    setTextToTranslate('');
    setTranslatedText('');
    setFile(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Çeviri Modu Seçimi */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Çeviri Türünü Seçin
        </h3>
        <div className="flex space-x-4">
          <button
            onClick={() => setTranslationMode('text')}
            className={`px-6 py-3 rounded-lg transition-colors ${
              translationMode === 'text'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📝 Metin Çevirisi
          </button>
          <button
            onClick={() => setTranslationMode('file')}
            className={`px-6 py-3 rounded-lg transition-colors ${
              translationMode === 'file'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📄 Dosya Çevirisi
          </button>
        </div>
      </div>

      {/* Metin Çevirisi */}
      {translationMode === 'text' && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Metin Çevirisi
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Çevrilecek Metin
              </label>
              <textarea
                value={textToTranslate}
                onChange={(e) => setTextToTranslate(e.target.value)}
                placeholder="Çevirmek istediğiniz metni buraya yazın..."
                className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                Karakter sayısı: {textToTranslate.length}
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={handleTextTranslation}
                disabled={!textToTranslate.trim() || loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Çevriliyor...' : 'Çeviri Yap'}
              </button>
              
              <button
                onClick={clearAll}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Temizle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dosya Çevirisi */}
      {translationMode === 'file' && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Dosya Çevirisi
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
              <div className="text-4xl">📄</div>
              {isDragActive ? (
                <p className="text-blue-600">Dosyayı buraya bırakın...</p>
              ) : (
                <div>
                  <p className="text-gray-600">
                    Dosyayı sürükleyip bırakın veya seçmek için tıklayın
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Desteklenen formatlar: TXT, PDF, DOCX
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
                  onClick={() => setFile(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  🗑️
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mt-6 flex space-x-4">
            <button
              onClick={handleFileTranslation}
              disabled={!file || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Çevriliyor...' : 'Dosyayı Çevir'}
            </button>
            
            <button
              onClick={clearAll}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Temizle
            </button>
          </div>
        </div>
      )}

      {/* Çeviri Sonucu */}
      {translatedText && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🌟</span>
            Çeviri Sonucu
          </h3>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="whitespace-pre-wrap text-gray-700">
                {translatedText}
              </div>
            </div>
            
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
                  const file = new Blob([translatedText], { type: 'text/plain' });
                  element.href = URL.createObjectURL(file);
                  element.download = 'ceviri.txt';
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                💾 TXT olarak İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yardım */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-800 mb-2">💡 Çeviri İpuçları</h4>
        <ul className="text-sm text-purple-700 space-y-1">
          <li>• En iyi sonuçlar için kısa paragraflar halinde çevirin</li>
          <li>• Teknik terimler için context sağlayın</li>
          <li>• PDF dosyalarının metin tabanlı olması gerekir</li>
          <li>• Uzun metinler otomatik olarak parçalara bölünür</li>
        </ul>
      </div>
    </div>
  );
};

export default Translation; 