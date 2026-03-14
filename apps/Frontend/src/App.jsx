import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Prizes from './components/Prizes';
import Features from './components/Features';
import GamesList from './components/GamesList';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard/Dashboard';
import Puzzle15Page from './pages/Games/Puzzle15/Puzzle15Page';
import CanonGamePage from './pages/Games/CanonGame/CanonGamePage';
import MathTugPage from './pages/Games/MathTug/MathTugPage';
import BinarySudokuPage from './pages/Games/BinarySudoku/BinarySudokuPage';
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

  if (currentPath.startsWith('/puzzle')) {
    return <Puzzle15Page />;
  }

  if (currentPath.startsWith('/canon')) {
    return <CanonGamePage />;
  }

  if (currentPath.startsWith('/mathtug')) {
    return <MathTugPage />;
  }

  if (currentPath.startsWith('/binarysudoku')) {
    return <BinarySudokuPage />;
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
