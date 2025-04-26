import React, { useEffect, useState } from 'react';
import './Preloader.css';

const Preloader: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev < 100) {
          return prev + 1;
        }
        clearInterval(interval);
        // Start fade out animation when progress reaches 100%
        setFadeOut(true);
        return 100;
      });
    }, 20);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className={`preloader-container ${fadeOut ? 'fade-out' : ''}`}>
      <div className="app-name">FUEL Manager</div>
      
      <div className="fuel-drop">
        <div className="drop-body">
          <div className="wave"></div>
        </div>
        <div className="drop-shadow"></div>
      </div>
      
      <div className="fuel-gauge">
        <div className="gauge-body">
          <div className="gauge-fill" style={{ width: `${progress}%` }}></div>
          <div className="gauge-cover"></div>
        </div>
        <div className="gauge-text">{progress}%</div>
      </div>
      
      <div className="loading-text">
        <span>L</span>
        <span>o</span>
        <span>a</span>
        <span>d</span>
        <span>i</span>
        <span>n</span>
        <span>g</span>
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </div>
    </div>
  );
};

export default Preloader; 