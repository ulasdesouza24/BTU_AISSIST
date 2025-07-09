import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const prevScrollY = useRef(0);
  const ticking = useRef(false);

  // Üst menüde gösterilecek sayfalar ve ikonlar
  const navigation = [
    { name: 'Dashboard', href: '/', icon: '🏠' },
    { name: 'Veri Analizi', href: '/data-analysis', icon: '📊' },
    { name: 'Raporlama', href: '/reporting', icon: '📋' },
    { name: 'Analiz Geçmişi', href: '/report-history', icon: '🕑' },
    { name: 'Çeviri', href: '/translation', icon: '🌐' },
    { name: 'E-posta Yazma', href: '/email-writer', icon: '✉️' },
  ];

  // Optimized scroll handler
  useEffect(() => {
    const updateNavbar = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < prevScrollY.current || currentScrollY < 50) {
        // Yukarı scroll veya üst kısımda - navbar'ı göster
        setVisible(true);
      } else if (currentScrollY > 100 && currentScrollY > prevScrollY.current) {
        // Aşağı scroll ve 100px'den fazla - navbar'ı gizle
        setVisible(false);
      }
      
      prevScrollY.current = currentScrollY;
      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(updateNavbar);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Aktif menü öğesini belirler
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav 
        className={`bg-white shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 transition-all duration-300 ease-in-out w-full ${
          visible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ 
          backgroundColor: 'white',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 999999,
          position: 'fixed'
        }}
      >
        <div className="w-full">
          <div className="flex justify-between h-16 px-4 sm:px-6 lg:px-8">
            
            {/* Logo ve Ana Menü */}
            <div className="flex items-center">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center mr-2">
                    <img 
                      src="/datadoodle vector logo siyah.png" 
                      alt="DataDoodle" 
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-6 h-6 bg-blue-600 rounded-lg items-center justify-center hidden">
                      <span className="text-white font-bold text-xs">DD</span>
                    </div>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">DataDoodle</h1>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:ml-8 md:flex md:space-x-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-2 text-base">{item.icon}</span>
                    <span className="hidden lg:block">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sağ taraf - Kullanıcı bilgisi ve çıkış */}
            <div className="flex items-center space-x-4">
              {/* Kullanıcı Profil Dropdown */}
              <div className="hidden md:flex md:items-center md:space-x-3">
                <div className="flex items-center space-x-3">
                  {/* Kullanıcı Avatar */}
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Kullanıcı Bilgisi */}
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  
                  {/* Çıkış Butonu */}
                  <button
                    onClick={logout}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 group"
                    title="Çıkış Yap"
                  >
                    <span className="text-lg mr-1 group-hover:scale-110 transition-transform">🚪</span>
                    <span className="hidden xl:block">Çıkış</span>
                  </button>
                </div>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                >
                  <span className="sr-only">Ana menüyü aç</span>
                  {isMobileMenuOpen ? (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white w-full">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile User Info & Logout */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center px-3 py-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Çıkış Yap"
                  >
                    <span className="text-lg">🚪</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16"></div>

      {/* Main Content */}
      <main className="flex-1 relative z-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;