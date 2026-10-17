import React, { useState } from react;
import { Building2, ShieldAlert, FileText, Ban, Calendar, CheckCircle2, Download, X } from lucide-react;

export default function MinistryConsole({ centers, selectedCenter, setSelectedCenter, districtStats }) {
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [frozenCentres, setFrozenCentres] = useState([]);
  const [toast, setToast] = useState(");

 const toggleFreeze = (id) => {
 if (frozenCentres.includes(id)) {
 setFrozenCentres(frozenCentres.filter(c => c !== id));
 setToast(ℹ️ Grant Hold lifted for );
 } else {
 setFrozenCentres([...frozenCentres, id]);
 setToast(🚫 PMKVY Grant Disbursement FROZEN for );
 }
 setTimeout(() => setToast(), 4000);
 };

 return (
 <div style={{ padding: 24px, maxWidth: 1400, margin: 0 auto }}>
 
 {/* Header */}
 <div style={{ marginBottom: 20 }}>
 <h2 style={{ fontSize: 20, fontWeight: 800, color: #ffffff }}>
 🏛️ MSDE Central Ministry Monitoring Command Desk
 </h2>
 <p style={{ fontSize: 13, color: #94a3b8 }}>
 Ministry of Skill Development & Entrepreneurship • PMKVY / DDU-GKY Anti-Fraud Operations Console
 </p>
 </div>

 {toast && (
 <div style={{ background: #991b1b, color: #fef2f2, padding: 10px 18px, borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 700 }}>
 {toast}
 </div>
 )}

 {/* Top 4 KPI Cards */}
 <div style={{ display: grid, gridTemplateColumns: repeat(4, 1fr), gap: 16, marginBottom: 24 }}>
 <div className=kd-card>
 <span style={{ fontSize: 11.5, color: #94a3b8, textTransform: uppercase }}>Monitored Centres</span>
 <strong style={{ fontSize: 26, fontWeight: 800, color: #f8fafc, display: block, marginTop: 4 }}>148</strong>
 <span style={{ fontSize: 11, color: #10b981 }}>● 100% Live Edge Nodes</span>
 </div>
 <div className=kd-card>
 <span style={{ fontSize: 11.5, color: #94a3b8, textTransform: uppercase }}>Active Training Batches</span>
 <strong style={{ fontSize: 26, fontWeight: 800, color: #38bdf8, display: block, marginTop: 4 }}>412</strong>
 <span style={{ fontSize: 11, color: #94a3b8 }}>12,360 Sanctioned Trainees</span>
 </div>
 <div className=kd-card style={{ border: 1px solid #ef4444 }}>
 <span style={{ fontSize: 11.5, color: #f87171, textTransform: uppercase }}>Ghost Trainee Alerts</span>
 <strong style={{ fontSize: 26, fontWeight: 800, color: #ef4444, display: block, marginTop: 4 }}>19 Centres</strong>
 <span style={{ fontSize: 11, color: #f87171 }}>🔴 Discrepancy > 40%</span>
 </div>
 <div className=kd-card style={{ border: 1px solid #10b981 }}>
 <span style={{ fontSize: 11.5, color: #34d399, textTransform: uppercase }}>Blocked Grant Leakage</span>
 <strong style={{ fontSize: 26, fontWeight: 800, color: #10b981, display: block, marginTop: 4 }}>₹14,80,000</strong>
 <span style={{ fontSize: 11, color: #10b981 }}>Saved from Ghost Claims</span>
 </div>
 </div>

 {/* District Compliance Grid */}
 <div className=kd-card style={{ marginBottom: 24 }}>
 <h3 style={{ fontSize: 15, fontWeight: 700, color: #ffffff, marginBottom: 14 }}>
 🗺️ Karnataka State Skilling Hubs Compliance Leaderboard
 </h3>
 <div style={{ display: grid, gridTemplateColumns: repeat(4, 1fr), gap: 14 }}>
 {districtStats.districts.map((d) => (
 <div key={d.name} style={{ background: #090d16, padding: 14, borderRadius: 8, border: 1px solid #1e293b }}>
 <div style={{ display: flex, justifyContent: space-between, alignItems: center, marginBottom: 6 }}>
 <strong style={{ fontSize: 14, color: #f8fafc }}>{d.name}</strong>
 <span className={kd-badge }>
 {d.compliance}% Score
 </span>
 </div>
 <span style={{ fontSize: 12, color: #94a3b8, display: block }}>Centres: {d.centres} | Red Alerts: <strong style={{ color: d.redAlerts > 0 ? #f87171 : #10b981 }}>{d.redAlerts}</strong></span>
 </div>
 ))}
 </div>
 </div>

 {/* Training Centres Audit & Enforcement Table */}
 <div className=kd-card>
 <h3 style={{ fontSize: 15, fontWeight: 700, color: #ffffff, marginBottom: 14 }}>
 📋 Training Centres Inspection & Enforcement Roster
 </h3>
 <table style={{ width: 100%, borderCollapse: collapse, fontSize: 13 }}>
 <thead>
 <tr style={{ borderBottom: 1px solid #334155, color: #94a3b8, textAlign: left }}>
 <th style={{ padding: 10px 8px }}>Centre Name & Taluk</th>
 <th style={{ padding: 10px 8px }}>Batch Course</th>
 <th style={{ padding: 10px 8px }}>Reported / Physical</th>
 <th style={{ padding: 10px 8px }}>Discrepancy</th>
 <th style={{ padding: 10px 8px }}>Compliance Score</th>
 <th style={{ padding: 10px 8px }}>Enforcement Action</th>
 </tr>
 </thead>
 <tbody>
 {centers.map((c) => {
 const isFrozen = frozenCentres.includes(c.centerId);
 return (
 <tr key={c.centerId} style={{ borderBottom: 1px solid #1e293b }}>
 <td style={{ padding: 12px 8px, fontWeight: 700, color: #f8fafc }}>
 {c.name}
 <span style={{ fontSize: 11, color: #94a3b8, display: block, fontWeight: 400 }}>{c.taluk}, {c.district} ({c.centerId})</span>
 </td>
 <td style={{ padding: 12px 8px, color: #38bdf8 }}>{c.batch.tradeCourse}</td>
 <td style={{ padding: 12px 8px }}>
 <span style={{ color: #38bdf8 }}>{c.batch.portalReportedAttendance}</span> / <strong style={{ color: c.liveTelemetry.status === RED_FRAUD ? #ef4444 : #10b981 }}>{c.liveTelemetry.aiVerifiedHeadcount}</strong>
 </td>
 <td style={{ padding: 12px 8px }}>
 <span className={kd-badge }>
 {c.liveTelemetry.discrepancyPercentage}% {c.liveTelemetry.discrepancyPercentage > 40 ? Fraud : Variance}
 </span>
 </td>
 <td style={{ padding: 12px 8px, fontWeight: 800, color: c.liveTelemetry.overallRating < 60 ? #ef4444 : #10b981 }}>
 {c.liveTelemetry.overallRating} / 100
 </td>
 <td style={{ padding: 12px 8px }}>
 <div style={{ display: flex, gap: 8 }}>
 <button
 onClick={() => {
 setSelectedCenter(c);
 setShowNoticeModal(true);
 }}
 className=btn-secondary
 style={{ fontSize: 11.5, padding: 5px 10px }}
 >
 <FileText size={13} /> Show-Cause Notice
 </button>
 <button
 onClick={() => toggleFreeze(c.centerId)}
 className={isFrozen ? btn-secondary : btn-danger}
 style={{ fontSize: 11.5, padding: 5px 10px }}
 >
 <Ban size={13} /> {isFrozen ? Unfreeze : Freeze Grant}
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>

 {/* Show-Cause Notice Formal Modal */}
 {showNoticeModal && (
 <div style={{ position: fixed, top: 0, left: 0, right: 0, bottom: 0, background: rgba(0,0,0,0.8), display: flex, alignItems: center, justifyContent: center, zIndex: 1000, padding: 20 }}>
 <div style={{ background: #ffffff, color: #0f172a, maxWidth: 750, width: 100%, borderRadius: 12, padding: 32, maxHeight: 90vh, overflowY: auto, position: relative }}>
 
 <button
 onClick={() => setShowNoticeModal(false)}
 style={{ position: absolute, top: 16, right: 16, background: #f1f5f9, border: none, borderRadius: 50%, width: 32, height: 32, cursor: pointer, display: flex, alignItems: center, justifyContent: center }}
 >
 <X size={18} color=#0f172a />
 </button>

 {/* Official Letterhead */}
 <div style={{ borderBottom: 2px solid #0f172a, paddingBottom: 14, marginBottom: 20, textAlign: center }}>
 <h2 style={{ fontSize: 16, fontWeight: 800, textTransform: uppercase, letterSpacing: 0.5 }}>
 Ministry of Skill Development & Entrepreneurship (MSDE)
 </h2>
 <p style={{ fontSize: 12, color: #475569 }}>
 National Skill Development Corporation (NSDC) • Skilling Compliance Enforcement Directorate
 </p>
 <span style={{ fontSize: 11, fontFamily: monospace, color: #64748b }}>
 Ref No: MSDE/COMPL/KA-TUM/2026/0417 • Date: 04-Oct-2026
 </span>
 </div>

 <div style={{ fontSize: 13, lineHeight: 1.6 }}>
 <p style={{ marginBottom: 12 }}><strong>To:</strong> The Centre In-Charge, {selectedCenter.name}, {selectedCenter.taluk}, Tumakuru District.</p>
 <p style={{ marginBottom: 12 }}><strong>SUBJECT:</strong> SHOW-CAUSE NOTICE FOR MASS ATTENDANCE DISCREPANCY & INFRASTRUCTURE DEFICIT UNDER PMKVY 4.0 SCHEME.</p>
 
 <p style={{ marginBottom: 12 }}>
 1. Continuous Edge-AI Video Verification conducted on active batch <strong>{selectedCenter.batch.batchId} ({selectedCenter.batch.tradeCourse})</strong> during sanctioned hours ({selectedCenter.batch.batchTime}) revealed that whereas your centre claimed <strong>{selectedCenter.batch.portalReportedAttendance} students present</strong> on the official portal, verified physical presence was only <strong>{selectedCenter.liveTelemetry.aiVerifiedHeadcount} students</strong> (Discrepancy: {selectedCenter.liveTelemetry.discrepancyPercentage}%).
 </p>

 <p style={{ marginBottom: 12 }}>
 2. Physical machinery scan detected <strong>4 missing Single-Needle Industrial Sewing Machines</strong> and absence of mandatory Emergency Fire Safety Extinguishers.
 </p>

 <p style={{ marginBottom: 16 }}>
 3. You are hereby called upon to show cause within <strong>7 days</strong> as to why your centre's accreditation should not be cancelled and stipend grant of <strong>₹1,50,000</strong> recovered.
 </p>

 <div style={{ background: #f8fafc, border: 1px solid #e2e8f0, padding: 12, borderRadius: 6, marginBottom: 20, fontSize: 11.5, color: #475569 }}>
 <strong>Evidence Attached:</strong> Annexure A (3 Time-stamped Keyframe Snapshots), Annexure B (Machine Deficit Ledger).
 </div>

 <div style={{ display: flex, justifyContent: space-between, alignItems: center }}>
 <span style={{ fontSize: 12, color: #64748b }}>By Order of Joint Director, MSDE</span>
 <button
 onClick={() => {
 alert(Official Notice PDF downloaded!);
 setShowNoticeModal(false);
 }}
 className=btn-primary
 >
 <Download size={14} /> Download Official Notice (PDF)
 </button>
 </div>
 </div>

 </div>
 </div>
 )}

 </div>
 );
}
