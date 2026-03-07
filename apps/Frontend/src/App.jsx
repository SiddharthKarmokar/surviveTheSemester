import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Prizes from './components/Prizes';
import Features from './components/Features';
import GamesList from './components/GamesList';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard/Dashboard';
import './App.css'; 

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  if (currentPath === '/dashboard') {
    return <Dashboard />;
  }

  return (
    <div className="app-container">
      <Navbar />
      <Hero />
      <About />
      <Prizes />
      <Features />
      <GamesList />
    </div>
  );
}

export default App;
