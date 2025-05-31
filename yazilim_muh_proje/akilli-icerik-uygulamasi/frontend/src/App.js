import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Components
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import DataAnalysis from './components/DataAnalysis';
import Reporting from './components/Reporting';
import Translation from './components/Translation';
import EmailWriter from './components/EmailWriter';
import Layout from './components/Layout';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Axios yapılandırması
axios.defaults.baseURL = 'http://localhost:5000/api';
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Axios interceptor ekle
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API Hatası:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

function App() {
  return (
    <AuthProvider>
      <Router>
    <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/analysis" element={<ProtectedRoute><Layout><DataAnalysis /></Layout></ProtectedRoute>} />
            <Route path="/reporting" element={<ProtectedRoute><Layout><Reporting /></Layout></ProtectedRoute>} />
            <Route path="/translation" element={<ProtectedRoute><Layout><Translation /></Layout></ProtectedRoute>} />
            <Route path="/email-writer" element={<ProtectedRoute><Layout><EmailWriter /></Layout></ProtectedRoute>} />
          </Routes>
    </div>
      </Router>
    </AuthProvider>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

export default App;
