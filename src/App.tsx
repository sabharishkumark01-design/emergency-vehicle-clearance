import { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { DriverDashboard } from './pages/DriverDashboard';

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'driver'>('landing');

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/driver') {
        setCurrentPage('driver');
      } else {
        setCurrentPage('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);

    const initialPath = window.location.pathname;
    if (initialPath === '/driver') {
      setCurrentPage('driver');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (page: 'landing' | 'driver') => {
    setCurrentPage(page);
    window.history.pushState({}, '', page === 'landing' ? '/' : '/driver');
  };

  return (
    <div className="w-full h-screen">
      {currentPage === 'landing' ? (
        <LandingPage onNavigate={navigate} />
      ) : (
        <DriverDashboard onNavigate={navigate} />
      )}
    </div>
  );
}

export default App;
