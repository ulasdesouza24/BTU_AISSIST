import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  const modules = [
    {
      title: 'Veri Analizi',
      description: 'CSV, Excel, XML ve PDF dosyalarınızı analiz edin',
      icon: '📊',
      path: '/data-analysis',
      color: 'bg-blue-500'
    },
    {
      title: 'Rapor Üretimi',
      description: 'Profesyonel raporlar oluşturun ve düzenleyin',
      icon: '📋',
      path: '/reporting',
      color: 'bg-green-500'
    },
    {
      title: 'Çeviri',
      description: 'Dosya ve metin çevirisi yapın',
      icon: '🌐',
      path: '/translation',
      color: 'bg-purple-500'
    },
    {
      title: 'E-posta Yazımı',
      description: 'AI destekli profesyonel e-postalar yazın',
      icon: '✉️',
      path: '/email-writer',
      color: 'bg-orange-500'
    }
  ];

  const stats = [
    { label: 'Analiz Edilen Dosya', value: '127', color: 'text-blue-600' },
    { label: 'Oluşturulan Rapor', value: '43', color: 'text-green-600' },
    { label: 'Çevrilen Belge', value: '89', color: 'text-purple-600' },
    { label: 'Yazılan E-posta', value: '156', color: 'text-orange-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Hoş Geldin Mesajı */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Hoş Geldin, {user?.name || 'Kullanıcı'}! 👋
        </h1>
        <p className="text-gray-600">
          Akıllı İçerik Analiz ve Üretim Uygulamasına hoş geldin. Aşağıdaki modüllerden birini seçerek başlayabilirsin.
        </p>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className="text-3xl opacity-20">📈</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modüller */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Modüller</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((module, index) => (
            <Link
              key={index}
              to={module.path}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300 block group"
            >
              <div className="flex items-start space-x-4">
                <div className={`${module.color} text-white p-3 rounded-lg text-2xl group-hover:scale-110 transition-transform duration-300`}>
                  {module.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-gray-600">{module.description}</p>
                  <div className="mt-4">
                    <span className="inline-flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-800">
                      Başla
                      <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Son Aktiviteler */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Son Aktiviteler</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-blue-500">📊</div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">Satış verisi analiz edildi</p>
              <p className="text-xs text-gray-500">2 saat önce</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-green-500">📋</div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">Aylık rapor oluşturuldu</p>
              <p className="text-xs text-gray-500">5 saat önce</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-purple-500">🌐</div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">Belge çevirisi tamamlandı</p>
              <p className="text-xs text-gray-500">1 gün önce</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 