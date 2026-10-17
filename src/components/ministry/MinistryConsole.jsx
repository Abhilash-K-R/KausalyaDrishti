import React from 'react';

function MinistryConsole() {
  return (
    <div className="kd-tab-page">
      <div className="kd-page-header">
        <div>
          <h2>Ministry of Skill Development & Entrepreneurship (MSDE)</h2>
          <p className="kd-text-muted">National PMKVY Monitoring & Compliance Command Dashboard</p>
        </div>
        <div className="kd-actions-row">
          <button className="kd-btn kd-btn-success">✅ Trigger Smart Contract Payouts</button>
        </div>
      </div>

      <div className="kd-grid-3col kd-mb-4">
        <div className="kd-card">
          <div className="kd-card-header">
            <h3>State-Wise Compliance Index</h3>
          </div>
          <div className="kd-progress-list">
            <div className="kd-progress-item">
              <div className="kd-flex-between">
                <span>Karnataka</span>
                <strong>94.2%</strong>
              </div>
              <div className="kd-progress-bar"><div className="kd-progress-fill" style={{ width: '94.2%' }}></div></div>
            </div>
            <div className="kd-progress-item">
              <div className="kd-flex-between">
                <span>Maharashtra</span>
                <strong>88.5%</strong>
              </div>
              <div className="kd-progress-bar"><div className="kd-progress-fill" style={{ width: '88.5%' }}></div></div>
            </div>
            <div className="kd-progress-item">
              <div className="kd-flex-between">
                <span>Delhi NCR</span>
                <strong>96.1%</strong>
              </div>
              <div className="kd-progress-bar"><div className="kd-progress-fill" style={{ width: '96.1%' }}></div></div>
            </div>
            <div className="kd-progress-item">
              <div className="kd-flex-between">
                <span>Uttar Pradesh</span>
                <strong>82.4%</strong>
              </div>
              <div className="kd-progress-bar"><div className="kd-progress-fill" style={{ width: '82.4%', background: '#f59e0b' }}></div></div>
            </div>
          </div>
        </div>

        <div className="kd-card">
          <div className="kd-card-header">
            <h3>Fund Disbursement Safeguards</h3>
          </div>
          <div className="kd-stat-box kd-stat-danger kd-mb-3">
            <div className="kd-stat-label">Suspended Center Grants</div>
            <div className="kd-stat-value text-red">₹ 8.42 Cr</div>
            <div className="kd-stat-desc">Due to ghost student discrepancies</div>
          </div>
          <div className="kd-stat-box">
            <div className="kd-stat-label">Auto-Approved DBT Payments</div>
            <div className="kd-stat-value text-green">₹ 142.6 Cr</div>
            <div className="kd-stat-desc">100% CCTV & Bio Verified</div>
          </div>
        </div>

        <div className="kd-card">
          <div className="kd-card-header">
            <h3>DPDP Act 2023 Privacy Compliance</h3>
          </div>
          <ul className="kd-bullet-list">
            <li>🔒 <strong>Client-Side Anonymization:</strong> All facial features blurred before cloud packet creation.</li>
            <li>📦 <strong>Low Bandwidth:</strong> CCTV video stream discarded locally; only 5 KB cryptographic digest sent.</li>
            <li>📜 <strong>Immutable Audit Trails:</strong> SHA-256 hashes generated per 15-minute frame chunk.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default MinistryConsole;
