import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; // Create this next
import SitesTable from './pages/SitesTable';
import { ThemeProviderWrapper } from './components/ThemeProviderWrapper';
import Layout from './components/layout/Layout';
import SiteDetails from './pages/SiteDetails';
import FiscalRevenue from './pages/FiscalRevenue'; 
import RevenueSectionFY from './components/RevenueSectionFY';

function App() {
  const [token, setToken] = useState(null);
  const [loadingToken, setLoadingToken] = useState(true);

  const onLoginSuccess = (jwtToken) => {
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    setToken(savedToken);
    setLoadingToken(false);
  }, []);

  if (loadingToken) return <div>Loading...</div>;

  if (!token)
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={onLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );

  return (
    <ThemeProviderWrapper>
    <Router>
      <Layout onLogout={logout}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <PrivateRoute token={token}>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/sites"
            element={
              <PrivateRoute token={token}>
                <SitesTable />
              </PrivateRoute>
            }
          />
                    <Route
            path="/revenue"
            element={
              <PrivateRoute token={token}>
                <RevenueSectionFY />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          // in App.js routes
<Route
  path="/sites/:id"
  element={
    <PrivateRoute token={token}>
      <SiteDetails />
    </PrivateRoute>
  }
/>

        </Routes>
      </Layout>
    </Router>
      </ThemeProviderWrapper>
  );
}

export default App;
