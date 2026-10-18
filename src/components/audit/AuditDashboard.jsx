import React, { useMemo, useState } from 'react';
import { trainingCentres, getCentreById, formatINR } from '../../data/centerMockData.js';
import { buildCentreReport, buildBatchVerification } from '../../services/complianceRules.js';
import AttendanceDiscrepancyCard from './AttendanceDiscrepancyCard.jsx';
import InfraComplianceWidget from './InfraComplianceWidget.jsx';
import SanctionedEquipList from './SanctionedEquipList.jsx';
import { Panel, SeverityBadge } from '../common/Ui.jsx';

export default function AuditDashboard({
  selectedCentreId = 'KA-TUM-0417',
  onSelectCentre,
  onEscalate,
  pushToast,
}) {
  const [centreId, setCentreId] = useState(selectedCentreId);
  const centre = useMemo(() => getCentreById(centreId) || trainingCentres[0], [centreId]);
  
  const [batchId, setBatchId] = useState(centre.batches[0]?.batchId);

  // If centre changes, reset active batch to first batch of selected centre
  const activeBatch = useMemo(() => {
    return centre.batches.find((b) => b.batchId === batchId) || centre.batches[0];
  }, [centre, batchId]);

  const report = useMemo(() => buildCentreReport(centre), [centre]);
  const verification = useMemo(() => buildBatchVerification(activeBatch, centre), [activeBatch, centre]);

  const handleSelectCentre = (id) => {
    setCentreId(id);
    const newCentre = getCentreById(id);
    if (newCentre && newCentre.batches.length > 0) {
      setBatchId(newCentre.batches[0].batchId);
    }
    if (onSelectCentre) onSelectCentre(id);
  };

  return (
    <div className="kd-audit-portal">
      {/* Page Header */}
      <div className="portal-header">
        <div>
          <h2 className="portal-title">Training Centre Compliance & Discrepancy Audit Register</h2>
          <p className="portal-subtitle">
            Cross-Verification of SDMS Portal Claims vs. Computer Vision Physical Presence & Asset Inventory
          </p>
        </div>
        <div className="portal-controls">
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => onEscalate && onEscalate(centre.id)}
          >
            🏛️ Escalate to MSDE Console
          </button>
        </div>
      </div>

      {/* Centre Selection Cards Carousel / Grid */}
      <Panel title="Monitored Skilling Centres — Karnataka Grid" icon="🏢" tone="default">
        <div className="centre-cards-grid">
          {trainingCentres.map((c) => {
            const cReport = buildCentreReport(c);
            const isSelected = c.id === centre.id;
            return (
              <div
                key={c.id}
                className={`centre-card ${isSelected ? 'is-selected' : ''} centre-card--${cReport.risk.key}`}
                onClick={() => handleSelectCentre(c.id)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
              >
                <div className="centre-card__head">
                  <strong className="centre-card__name">{c.name}</strong>
                  <SeverityBadge severity={cReport.risk} size="sm" showVerdict={false} />
                </div>
                <span className="centre-card__sub">{c.taluk}, {c.district} ({c.id})</span>
                <div className="centre-card__stats">
                  <span>Claimed: <b>{cReport.totalClaimed}</b></span>
                  <span>Physical: <b className={cReport.totalGhosts > 0 ? 'text-red' : 'text-green'}>{cReport.totalPhysical}</b></span>
                  <span>Ghosts: <b className={cReport.totalGhosts > 0 ? 'text-red' : ''}>{cReport.totalGhosts}</b></span>
                </div>
                <div className="centre-card__infra">
                  <span>Infra Score: <b>{cReport.infra.score}%</b></span>
                  <span>Leakage: <b>{formatINR(cReport.totalLeakage)}</b></span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Batch Switcher Tabs */}
      <div className="batch-tabs-bar">
        <span className="batch-tabs-label">Active Training Batches for {centre.name}:</span>
        <div className="batch-tabs-list">
          {centre.batches.map((b) => {
            const bVerif = buildBatchVerification(b, centre);
            const isBatchSelected = b.batchId === activeBatch.batchId;
            const shortCode = b.batchId.split('/').pop();
            return (
              <button
                key={b.batchId}
                type="button"
                className={`batch-tab-btn ${isBatchSelected ? 'active' : ''} batch-tab-btn--${bVerif.severity.key}`}
                onClick={() => setBatchId(b.batchId)}
              >
                <span className="batch-tab-code">{shortCode}</span>
                <span className="batch-tab-course">{b.course}</span>
                <span className="batch-tab-badge">{bVerif.severity.verdict}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Attendance Discrepancy Card */}
      <AttendanceDiscrepancyCard
        centre={centre}
        batch={activeBatch}
        verification={verification}
        onEscalate={onEscalate}
        active={true}
      />

      {/* Infrastructure Verification Section */}
      <div className="kd-infra-audit-row">
        <InfraComplianceWidget centre={centre} pushToast={pushToast} />
      </div>
    </div>
  );
}
