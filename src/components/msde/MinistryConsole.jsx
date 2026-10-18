import React, { useState } from 'react';
import { trainingCentres, getCentreById } from '../../data/centerMockData.js';
import { buildCentreReport } from '../../services/complianceRules.js';
import {
  generateShowCauseNotice,
  generateFreezeOrder,
  generateAuditOrder,
} from '../../services/edgeTelemetry.js';
import MsdeDistrictDashboard from './MsdeDistrictDashboard.jsx';
import CentreAuditTable from './CentreAuditTable.jsx';
import ShowCauseNoticeModal from './ShowCauseNoticeModal.jsx';

export default function MinistryConsole({
  allCentres = trainingCentres,
  selectedCentreId = 'KA-TUM-0417',
  onSelectCentre,
  onJumpToCentre,
  pushToast,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);
  const [activeReport, setActiveReport] = useState(null);

  const handleEnforce = (arg1, arg2) => {
    const isObj = typeof arg1 === 'object' && arg1 !== null;
    const type = isObj ? arg1.type : arg2;
    const centreId = isObj ? (arg1.centre?.id || arg1.centreId) : arg1;
    const centreObj = (isObj && arg1.centre) || getCentreById(centreId) || allCentres[0];
    const cReport = (isObj && arg1.report) || buildCentreReport(centreObj);

    let doc = null;
    if (type === 'notice') {
      doc = generateShowCauseNotice(cReport);
      pushToast?.({
        tone: 'danger',
        title: 'Show-Cause Notice Issued',
        message: `Digitally signed notice generated for ${cReport.centreName} (${cReport.centreId}).`,
      });
    } else if (type === 'freeze') {
      doc = generateFreezeOrder(cReport);
      pushToast?.({
        tone: 'danger',
        title: 'Grant Disbursement Frozen',
        message: `PMKVY grant freeze order issued for ${cReport.centreName}.`,
      });
    } else if (type === 'audit') {
      doc = generateAuditOrder(cReport);
      pushToast?.({
        tone: 'info',
        title: 'Surprise Audit Dispatched',
        message: `Field audit team deployed to ${cReport.taluk}, ${cReport.district}.`,
      });
    }

    if (doc) {
      setActiveDoc(doc);
      setActiveReport(cReport);
      setModalOpen(true);
    }
  };

  return (
    <div className="kd-ministry-portal">
      {/* Page Header */}
      <div className="portal-header">
        <div>
          <h2 className="portal-title">Central Command Dashboard — Ministry of Skill Development</h2>
          <p className="portal-subtitle">
            National PMKVY 4.0 / DDU-GKY / NAPS Real-Time Skilling Governance & Anti-Fraud Operations Desk
          </p>
        </div>
      </div>

      {/* District & KPI Analytics */}
      <MsdeDistrictDashboard allCentres={allCentres} />

      {/* Leaderboard & Actionable Table */}
      <div className="kd-leaderboard-section">
        <CentreAuditTable
          allCentres={allCentres}
          selectedCentreId={selectedCentreId}
          onSelectCentre={onSelectCentre}
          onEnforce={handleEnforce}
          pushToast={pushToast}
        />
      </div>

      {/* Formal Document Modal */}
      <ShowCauseNoticeModal
        open={modalOpen}
        doc={activeDoc}
        report={activeReport}
        onClose={() => setModalOpen(false)}
        onJumpToCentre={onJumpToCentre}
      />
    </div>
  );
}
