import React, { useState } from 'react';
import Navbar from './components/Navbar';
import CameraFeedView from './components/edge/CameraFeedView';
import AuditDashboard from './components/audit/AuditDashboard';
import MinistryConsole from './components/ministry/MinistryConsole';

function App() {
  const [activeTab, setActiveTab] = useState('camera');

  return (
    <div className="kd-app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="kd-main-content">
        {activeTab === 'camera' && <CameraFeedView />}
        {activeTab === 'audit' && <AuditDashboard />}
        {activeTab === 'ministry' && <MinistryConsole />}
      </main>
    </div>
  );
}

export default App;
