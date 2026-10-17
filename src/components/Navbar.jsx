import React from 'react';

function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="kd-navbar">
      <div className="kd-navbar-brand">
        <div className="kd-logo-icon">🏛️</div>
        <div>
          <h1 className="kd-brand-title">KausalyaDrishti (कौशल्य दृष्टि)</h1>
          <p className="kd-brand-subtitle">AI-Based Real-Time Monitoring • Ministry of Skill Development (MSDE)</p>
        </div>
      </div>

      <nav className="kd-nav-tabs">
        <button 
          className={'kd-tab-btn ' + (activeTab === 'camera' ? 'active' : '')}
          onClick={() => setActiveTab('camera')}
        >
          📷 1. Edge Camera Feed & AI Scan
        </button>
        <button 
          className={'kd-tab-btn ' + (activeTab === 'audit' ? 'active' : '')}
          onClick={() => setActiveTab('audit')}
        >
          📊 2. Center Audit & Discrepancies
        </button>
        <button 
          className={'kd-tab-btn ' + (activeTab === 'ministry' ? 'active' : '')}
          onClick={() => setActiveTab('ministry')}
        >
          🇮🇳 3. National Command Console
        </button>
      </nav>

      <div className="kd-status-indicator">
        <span className="kd-pulse-dot"></span>
        <span>Edge Active • 5KB Sync</span>
      </div>
    </header>
  );
}

export default Navbar;
