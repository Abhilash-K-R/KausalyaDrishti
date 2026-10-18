import React, { useMemo } from 'react';
import { trainingCentres } from '../data/centerMockData.js';
import { buildTickerItems } from '../services/complianceRules.js';

export default function Navbar({ activeTab, setActiveTab, isPrivacyOn = true }) {
  const tickerItems = useMemo(() => buildTickerItems(trainingCentres), []);
  const tickerText = tickerItems.map((t) => t.text).join('  •  ');

  return (
    <header className="kd-navbar">
      <div className="kd-navbar-top">
        <div className="kd-navbar-brand">
          <div className="kd-logo-icon">🏛️</div>
          <div>
            <div className="kd-brand-row">
              <h1 className="kd-brand-title">KausalyaDrishti</h1>
              <span className="kd-brand-kannada">(ಕೌಶಲ್ಯ ದೃಷ್ಟಿ)</span>
              <span className="kd-scheme-tag">MSDE · PMKVY 4.0 / DDU-GKY</span>
            </div>
            <p className="kd-brand-subtitle">
              AI-Based Real-Time Monitoring for Attendance and Infrastructure Compliance • Problem Statement ID 26245
            </p>
          </div>
        </div>

        <nav className="kd-nav-tabs" role="tablist" aria-label="KausalyaDrishti Portals">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'camera'}
            className={'kd-tab-btn ' + (activeTab === 'camera' ? 'active' : '')}
            onClick={() => setActiveTab('camera')}
          >
            📹 Centre Edge AI Camera
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'audit'}
            className={'kd-tab-btn ' + (activeTab === 'audit' ? 'active' : '')}
            onClick={() => setActiveTab('audit')}
          >
            📊 Attendance & Infra Audit
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ministry'}
            className={'kd-tab-btn ' + (activeTab === 'ministry' ? 'active' : '')}
            onClick={() => setActiveTab('ministry')}
          >
            🏛️ MSDE Ministry Console
          </button>
        </nav>

        <div className="kd-navbar-status">
          <div className="kd-privacy-pill" title="Digital Personal Data Protection Act 2023 Compliance">
            <span className="kd-pulse-dot" />
            <span className="kd-pill-text">DPDP Privacy: Active</span>
          </div>
          <div className="kd-sync-chip">
            <span>5 KB Telemetry Sync</span>
          </div>
        </div>
      </div>

      {/* Live Compliance Ticker */}
      <div className="kd-ticker-bar" role="region" aria-label="Live Compliance Alerts" aria-live="polite">
        <span className="kd-ticker-label">🚨 LIVE MSDE ALERTS:</span>
        <div className="kd-ticker-track">
          <span className="kd-ticker-content">{tickerText}</span>
        </div>
      </div>
    </header>
  );
}
