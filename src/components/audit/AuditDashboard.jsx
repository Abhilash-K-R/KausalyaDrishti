import React, { useState } from 'react';

function AuditDashboard() {
  const [filter, setFilter] = useState('all');

  const centers = [
    { id: 'TC-KA-BLR-042', name: 'Electronic City PMKK Hub', location: 'Bengaluru, KA', bio: 42, cctv: 38, delta: 4, infra: '94%', risk: 'HIGH', status: 'Flagged for Audit' },
    { id: 'TC-DL-NW-019', name: 'Rohini Skill Development Institute', location: 'North West Delhi, DL', bio: 30, cctv: 30, delta: 0, infra: '98%', risk: 'LOW', status: 'Compliant' },
    { id: 'TC-MH-PUN-088', name: 'Hadapsar Technical Training Center', location: 'Pune, MH', bio: 55, cctv: 41, delta: 14, infra: '72%', risk: 'CRITICAL', status: 'Grant Withheld' },
    { id: 'TC-UP-LKO-103', name: 'Gomti Nagar Skill Academy', location: 'Lucknow, UP', bio: 25, cctv: 24, delta: 1, infra: '91%', risk: 'LOW', status: 'Compliant' },
    { id: 'TC-TN-CHN-054', name: 'Guindy Vocational Training Hub', location: 'Chennai, TN', bio: 40, cctv: 33, delta: 7, infra: '86%', risk: 'MEDIUM', status: 'Warning Sent' }
  ];

  return (
    <div className="kd-tab-page">
      <div className="kd-page-header">
        <div>
          <h2>Training Center Audit & Discrepancy Register</h2>
          <p className="kd-text-muted">Automated cross-verification of Aadhaar Biometrics vs. AI Computer Vision Headcount</p>
        </div>
        <div className="kd-actions-row">
          <button className="kd-btn kd-btn-primary">📥 Export CSV Audit Report</button>
        </div>
      </div>

      <div className="kd-grid-4col kd-mb-4">
        <div className="kd-stat-box">
          <div className="kd-stat-label">Total Centers Monitored</div>
          <div className="kd-stat-value text-blue">14,820</div>
          <div className="kd-stat-desc">Across 36 States/UTs</div>
        </div>
        <div className="kd-stat-box">
          <div className="kd-stat-label">Total Verified Attendance</div>
          <div className="kd-stat-value text-green">91.4%</div>
          <div className="kd-stat-desc">Biometric Match Rate</div>
        </div>
        <div className="kd-stat-box kd-stat-danger">
          <div className="kd-stat-label">Ghost Trainees Detected</div>
          <div className="kd-stat-value text-red">3,420</div>
          <div className="kd-stat-desc">Aadhaar fraud prevented</div>
        </div>
        <div className="kd-stat-box">
          <div className="kd-stat-label">Estimated Public Funds Saved</div>
          <div className="kd-stat-value text-purple">₹ 42.8 Cr</div>
          <div className="kd-stat-desc">PMKVY Disbursement Shield</div>
        </div>
      </div>

      <div className="kd-card">
        <div className="kd-card-header kd-flex-between">
          <h3>Real-Time Center Compliance Table</h3>
          <div className="kd-filter-tabs">
            <button className={'kd-filter-btn ' + (filter === 'all' ? 'active' : '')} onClick={() => setFilter('all')}>All (5)</button>
            <button className={'kd-filter-btn ' + (filter === 'high' ? 'active' : '')} onClick={() => setFilter('high')}>High Risk Only</button>
          </div>
        </div>

        <div className="kd-table-responsive">
          <table className="kd-table">
            <thead>
              <tr>
                <th>Center ID & Name</th>
                <th>Location</th>
                <th>Aadhaar Biometric</th>
                <th>AI Head Count</th>
                <th>Discrepancy (Δ)</th>
                <th>Infra Score</th>
                <th>Risk Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {centers
                .filter(c => filter === 'all' || (filter === 'high' && (c.risk === 'HIGH' || c.risk === 'CRITICAL')))
                .map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                    <div className="kd-text-muted">{c.id}</div>
                  </td>
                  <td>{c.location}</td>
                  <td><span className="kd-pill pill-blue">{c.bio}</span></td>
                  <td><span className="kd-pill pill-purple">{c.cctv}</span></td>
                  <td>
                    {c.delta > 0 ? (
                      <span className="kd-text-danger font-bold">+{c.delta} Ghost</span>
                    ) : (
                      <span className="kd-text-green">0 (Exact)</span>
                    )}
                  </td>
                  <td><strong>{c.infra}</strong></td>
                  <td>
                    <span className={'kd-risk-tag ' + (
                      c.risk === 'CRITICAL' ? 'risk-critical' :
                      c.risk === 'HIGH' ? 'risk-high' :
                      c.risk === 'MEDIUM' ? 'risk-medium' : 'risk-low'
                    )}>
                      {c.risk}
                    </span>
                  </td>
                  <td>
                    <button className="kd-btn kd-btn-sm kd-btn-secondary">View CCTV Audit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AuditDashboard;
