import React, { useState } from 'react';
import Navbar from './components/Navbar';
import CameraFeedView from './components/edge/CameraFeedView';
import AuditDashboard from './components/audit/AuditDashboard';
import MinistryConsole from './components/msde/MinistryConsole';
import { Toast } from './components/common/Ui';

export default function App() {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'audit' | 'ministry'
  const [selectedCentreId, setSelectedCentreId] = useState('KA-TUM-0417');
  const [isPrivacyOn, setIsPrivacyOn] = useState(true);
  const [toast, setToast] = useState(null);

  const pushToast = (t) => {
    setToast(t);
  };

  const handleEscalate = (centreId) => {
    if (centreId) setSelectedCentreId(centreId);
    setActiveTab('ministry');
    pushToast({
      tone: 'danger',
      title: 'Discrepancy Escalated',
      message: 'Viewing centre risk profile in Central MSDE Command Desk.',
    });
  };

  const handleJumpToCentre = (centreId, targetTab = 'audit') => {
    if (centreId) setSelectedCentreId(centreId);
    setActiveTab(targetTab);
  };

  return (
    <div className="kd-app-container">
      {/* Top Navigation & Status Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPrivacyOn={isPrivacyOn}
      />

      {/* Main Content Area */}
      <main className="kd-main-content">
        {activeTab === 'camera' && (
          <CameraFeedView
            selectedCentreId={selectedCentreId}
            isPrivacyOn={isPrivacyOn}
            setIsPrivacyOn={setIsPrivacyOn}
            pushToast={pushToast}
          />
        )}

        {activeTab === 'audit' && (
          <AuditDashboard
            selectedCentreId={selectedCentreId}
            onSelectCentre={setSelectedCentreId}
            onEscalate={handleEscalate}
            pushToast={pushToast}
          />
        )}

        {activeTab === 'ministry' && (
          <MinistryConsole
            selectedCentreId={selectedCentreId}
            onSelectCentre={setSelectedCentreId}
            onJumpToCentre={handleJumpToCentre}
            pushToast={pushToast}
          />
        )}
      </main>

      {/* Toast Notification Container */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
