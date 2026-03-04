import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Prizes from './components/Prizes';
import Features from './components/Features';
import GamesList from './components/GamesList';
import Footer from './components/Footer';
import './App.css'; 


function App() {
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
