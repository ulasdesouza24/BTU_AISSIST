import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Saati güncelle
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi öğleden sonra';
    return 'İyi akşamlar';
  };

  const modules = [
    {
      title: 'Veri Analizi',
      description: 'CSV, Excel, XML ve PDF dosyalarınızı kolayca analiz edin ve anlamlı veriler çıkarın',
      icon: '📊',
      path: '/data-analysis',
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'from-blue-600 to-blue-700',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      features: ['CSV İşleme', 'Excel Analizi', 'PDF Okuma']
    },
    {
      title: 'Rapor Üretimi',
      description: 'Profesyonel raporlar oluşturun, düzenleyin ve PDF formatında indirin',
      icon: '📋',
      path: '/reporting',
      gradient: 'from-green-500 to-green-600',
      hoverGradient: 'from-green-600 to-green-700',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      features: ['PDF Üretimi', 'Grafik Ekleme', 'Şablon Sistemi']
    },
    {
      title: 'Çeviri',
      description: 'Dosya ve metin çevirisi yapın, 50+ dil desteği ile hızlı çeviri',
      icon: '🌐',
      path: '/translation',
      gradient: 'from-purple-500 to-purple-600',
      hoverGradient: 'from-purple-600 to-purple-700',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      features: ['50+ Dil', 'Dosya Çevirisi', 'Anlık Çeviri']
    },
    {
      title: 'E-posta Yazımı',
      description: 'AI destekli profesyonel e-postalar yazın ve şablonlarınızı kaydedin',
      icon: '✉️',
      path: '/email-writer',
      gradient: 'from-orange-500 to-orange-600',
      hoverGradient: 'from-orange-600 to-orange-700',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      features: ['AI Yardımı', 'Şablon Yönetimi', 'Kişiselleştirme']
    }
  ];

  const stats = [
    { 
      label: 'Analiz Edilen Dosya', 
      value: '127', 
      icon: '📊', 
      gradient: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-600',
      iconBg: 'bg-blue-500',
      change: '+12%',
      changeColor: 'text-green-600'
    },
    { 
      label: 'Oluşturulan Rapor', 
      value: '43', 
      icon: '📋', 
      gradient: 'from-green-50 to-green-100',
      textColor: 'text-green-600',
      iconBg: 'bg-green-500',
      change: '+8%',
      changeColor: 'text-green-600'
    },
    { 
      label: 'Çevrilen Belge', 
      value: '89', 
      icon: '🌐', 
      gradient: 'from-purple-50 to-purple-100',
      textColor: 'text-purple-600',
      iconBg: 'bg-purple-500',
      change: '+15%',
      changeColor: 'text-green-600'
    },
    { 
      label: 'Yazılan E-posta', 
      value: '156', 
      icon: '✉️', 
      gradient: 'from-orange-50 to-orange-100',
      textColor: 'text-orange-600',
      iconBg: 'bg-orange-500',
      change: '+23%',
      changeColor: 'text-green-600'
    }
  ];

  const recentActivities = [
    {
      title: 'Satış verisi analiz edildi',
      time: '2 saat önce',
      icon: '📊',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      type: 'Analiz'
    },
    {
      title: 'Aylık rapor oluşturuldu',
      time: '5 saat önce',
      icon: '📋',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      type: 'Rapor'
    },
    {
      title: 'Belge çevirisi tamamlandı',
      time: '1 gün önce',
      icon: '🌐',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      type: 'Çeviri'
    },
    {
      title: 'E-posta şablonu oluşturuldu',
      time: '2 gün önce',
      icon: '✉️',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      type: 'E-posta'
    }
  ];

  const quickActions = [
    { title: 'Yeni Dosya Yükle', icon: '📁', action: '/data-analysis' },
    { title: 'Rapor Oluştur', icon: '📄', action: '/reporting' },
    { title: 'Çeviri Yap', icon: '🔄', action: '/translation' },
    { title: 'E-posta Yaz', icon: '✍️', action: '/email-writer' }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Ana Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="space-y-6 md:space-y-8">
          
          {/* Hoş Geldin Bölümü */}
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl shadow-xl overflow-hidden">
            {/* Arka plan efektleri */}
            <div className="absolute inset-0 bg-black bg-opacity-10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-5 rounded-full transform translate-x-32 -translate-y-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white bg-opacity-5 rounded-full transform -translate-x-24 translate-y-24"></div>
            
            {/* İçerik */}
            <div className="relative z-0 px-6 md:px-8 py-8 md:py-12">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Sol taraf - Metin içeriği */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl md:text-4xl">👋</span>
                    <h1 className="text-2xl md:text-4xl font-bold text-white">
                      {getGreeting()}, {user?.name || 'Ulaş Taylan Met'}!
                    </h1>
                  </div>
                  
                  <p className="text-blue-100 text-lg md:text-xl leading-relaxed mb-6 max-w-3xl">
                    DataDoodle Analiz ve Üretim Uygulamasına hoş geldin. 
                    Güçlü AI araçlarımızla işlerini kolaylaştır.
                  </p>
                  
                  <div className="flex items-center gap-6 text-blue-200">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📅</span>
                      <span className="text-sm md:text-base">
                        {currentTime.toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🕐</span>
                      <span className="text-sm md:text-base">
                        {currentTime.toLocaleTimeString('tr-TR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Sağ taraf - Roket ikonu */}
                <div className="hidden lg:block flex-shrink-0">
                  <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-6xl">🚀</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hızlı Eylemler - Sadece mobilde */}
          <div className="block lg:hidden">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">⚡</span>
              Hızlı İşlemler
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.action}
                  className="flex flex-col items-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group"
                >
                  <span className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {action.icon}
                  </span>
                  <span className="text-sm font-medium text-gray-700 text-center">
                    {action.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* İstatistikler */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center">
              <span className="mr-3">📈</span>
              Aktivite Özeti
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group cursor-pointer`}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -mr-8 -mt-8"></div>
                  <div className="relative p-4 md:p-6">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <div className={`${stat.iconBg} p-2 md:p-3 rounded-lg shadow-sm`}>
                        <span className="text-lg md:text-2xl text-white">{stat.icon}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl md:text-3xl font-bold ${stat.textColor} group-hover:scale-110 transition-transform duration-300`}>
                          {stat.value}
                        </div>
                        <div className={`text-xs ${stat.changeColor} font-medium`}>
                          {stat.change}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 font-medium text-xs md:text-sm">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modüller */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center">
              <span className="mr-3">🛠️</span>
              Ana Modüller
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {modules.map((module, index) => (
                <Link
                  key={index}
                  to={module.path}
                  className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative p-6 md:p-8">
                    <div className="flex items-start space-x-4 md:space-x-6">
                      <div className={`${module.iconBg} p-3 md:p-4 rounded-2xl shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110 flex-shrink-0`}>
                        <span className={`text-2xl md:text-3xl ${module.iconColor}`}>{module.icon}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 md:mb-3 group-hover:text-blue-600 transition-colors duration-300">
                          {module.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed mb-4 md:mb-6 text-sm md:text-base">
                          {module.description}
                        </p>
                        
                        {/* Özellikler */}
                        <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                          {module.features.map((feature, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-3 md:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300 group-hover:shadow-lg">
                            Başla
                            <svg 
                              className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover border effect */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 rounded-2xl transition-colors duration-300"></div>
                </Link>
              ))}
            </div>
          </div>

          {/* Son Aktiviteler */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 md:px-8 py-4 md:py-6 border-b border-gray-100">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center">
                <span className="mr-3">⚡</span>
                Son Aktiviteler
              </h3>
            </div>
            
            <div className="p-6 md:p-8">
              <div className="space-y-3 md:space-y-4">
                {recentActivities.map((activity, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center space-x-3 md:space-x-4 p-3 md:p-4 ${activity.bgColor} rounded-xl hover:shadow-md transition-all duration-300 hover:scale-102 group cursor-pointer`}
                  >
                    <div className={`p-2 md:p-3 bg-white rounded-lg shadow-sm ${activity.color} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                      <span className="text-lg md:text-xl">{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-gray-800 font-medium group-hover:text-gray-900 transition-colors text-sm md:text-base truncate">
                          {activity.title}
                        </p>
                        <span className={`text-xs px-2 py-1 ${activity.bgColor} rounded-full font-medium ${activity.color} hidden md:inline`}>
                          {activity.type}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs md:text-sm">
                        {activity.time}
                      </p>
                    </div>
                    <div className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0">
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline transition-all duration-300">
                  Tüm aktiviteleri görüntüle
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 