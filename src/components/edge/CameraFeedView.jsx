import React, { useState, useRef, useEffect } from 'react';

function CameraFeedView() {
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isPrivacyOn, setIsPrivacyOn] = useState(true);
  const [cameraError, setCameraError] = useState(null);

  // Live AI Telemetry States
  const [biometricCount, setBiometricCount] = useState(42);
  const [aiDetectedCount, setAiDetectedCount] = useState(38);
  const [ghostTrainees, setGhostTrainees] = useState(4);
  const [infraScore, setInfraScore] = useState(94);
  const [lastHeartbeat, setLastHeartbeat] = useState(new Date().toLocaleTimeString());

  // Start / Stop Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Camera permission denied or camera not found. Please allow webcam access in browser.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLastHeartbeat(new Date().toLocaleTimeString());
    }, 3000);
    return () => {
      clearInterval(interval);
      stopCamera();
    };
  }, []);

  return (
    <div className="kd-tab-page">
      <div className="kd-page-header">
        <div>
          <h2>Edge Camera Live Stream & AI Detection</h2>
          <p className="kd-text-muted">TC-KA-BLR-042 • Electronic City PMKK Hub, Bengaluru • Room 102 (Electrician Batch)</p>
        </div>
        <div className="kd-actions-row">
          {!isCameraActive ? (
            <button className="kd-btn kd-btn-primary" onClick={startCamera}>
              📹 Turn ON Laptop Camera
            </button>
          ) : (
            <button className="kd-btn kd-btn-danger" onClick={stopCamera}>
              ⏹ Turn OFF Camera
            </button>
          )}
          <button 
            className={'kd-btn ' + (isPrivacyOn ? 'kd-btn-success' : 'kd-btn-secondary')}
            onClick={() => setIsPrivacyOn(!isPrivacyOn)}
          >
            {isPrivacyOn ? '🛡️ Privacy Blur: ON (DPDP 2023)' : '🔓 Privacy Blur: OFF'}
          </button>
        </div>
      </div>

      {cameraError && (
        <div className="kd-alert kd-alert-danger">
          ⚠️ {cameraError}
        </div>
      )}

      {/* Discrepancy Banner */}
      {ghostTrainees > 0 && (
        <div className="kd-alert kd-alert-warning kd-alert-pulse">
          <div className="kd-alert-content">
            <span className="kd-alert-icon">🚨</span>
            <div>
              <strong>Attendance Discrepancy Detected (D_att = 9.5%):</strong>{' '}
              Aadhaar Biometric logged {biometricCount} students, but Edge AI detected only {aiDetectedCount} heads present in Room 102.{' '}
              <span className="kd-text-danger font-bold">Possible {ghostTrainees} Ghost Trainees!</span>
            </div>
          </div>
          <button className="kd-btn kd-btn-sm kd-btn-warning">Flag to MSDE</button>
        </div>
      )}

      <div className="kd-grid-2col">
        {/* Left Column: Video Container */}
        <div className="kd-card kd-video-card">
          <div className="kd-card-header">
            <div className="kd-flex-between">
              <span className="kd-badge kd-badge-live">● LIVE RTSP/CCTV STREAM</span>
              <span className="kd-text-muted">Resolution: 720p • FPS: 15 (Edge Throttled)</span>
            </div>
          </div>

          <div className="kd-video-viewport">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={'kd-video-element ' + (isPrivacyOn ? 'kd-privacy-filter' : '')}
            />

            {!isCameraActive && (
              <div className="kd-video-placeholder">
                <div className="kd-placeholder-content">
                  <div className="kd-placeholder-icon">📹</div>
                  <h3>Webcam is Currently Inactive</h3>
                  <p>Click "Turn ON Laptop Camera" above to test real-time edge processing.</p>
                  <button className="kd-btn kd-btn-primary kd-mt-3" onClick={startCamera}>
                    Enable Live Camera Feed
                  </button>
                </div>
              </div>
            )}

            {isCameraActive && (
              <div className="kd-video-overlay">
                <div className="kd-overlay-tag top-left">
                  <span>TC-042 [CAM-01] • 15 FPS</span>
                </div>
                <div className="kd-overlay-tag top-right">
                  <span className={'kd-badge ' + (isPrivacyOn ? 'badge-green' : 'badge-red')}>
                    {isPrivacyOn ? '🔒 DPDP Face-Masked' : '⚠️ Raw Stream'}
                  </span>
                </div>
                <div className="kd-overlay-tag bottom-left">
                  <span>AI Heads Detected: {aiDetectedCount}</span>
                </div>
              </div>
            )}
          </div>

          <div className="kd-card-footer kd-flex-between">
            <div><strong>Payload Size:</strong> 4.8 KB (Metadata JSON only - No raw video uploaded)</div>
            <div><strong>Last Heartbeat:</strong> {lastHeartbeat}</div>
          </div>
        </div>

        {/* Right Column: AI Edge Telemetry */}
        <div className="kd-column-stack">
          {/* Quick Stat Cards */}
          <div className="kd-grid-2x2">
            <div className="kd-stat-box">
              <div className="kd-stat-label">Biometric (Aadhaar) Log</div>
              <div className="kd-stat-value text-blue">{biometricCount}</div>
              <div className="kd-stat-desc">Smart Attendance Portal</div>
            </div>

            <div className="kd-stat-box">
              <div className="kd-stat-label">CCTV Visual Head Count</div>
              <div className="kd-stat-value text-purple">{aiDetectedCount}</div>
              <div className="kd-stat-desc">YOLO-Edge Detector</div>
            </div>

            <div className="kd-stat-box kd-stat-danger">
              <div className="kd-stat-label">Ghost Trainees Discrepancy</div>
              <div className="kd-stat-value text-red">+{ghostTrainees}</div>
              <div className="kd-stat-desc">Unverified Biometrics</div>
            </div>

            <div className="kd-stat-box">
              <div className="kd-stat-label">Infra Compliance (C_infra)</div>
              <div className="kd-stat-value text-green">{infraScore}%</div>
              <div className="kd-stat-desc">Equipment & Safety Active</div>
            </div>
          </div>

          {/* Infrastructure Inspection Checklist */}
          <div className="kd-card">
            <div className="kd-card-header">
              <h3>Equipment & Safety Compliance (Mandatory)</h3>
            </div>
            <div className="kd-checklist">
              <div className="kd-check-item">
                <span className="kd-check-icon text-green">✅</span>
                <div className="kd-check-info">
                  <div className="kd-check-title">Electrician Training Workbench & Multimeters</div>
                  <div className="kd-check-sub">6/6 Benches Detected & Active</div>
                </div>
                <span className="kd-badge badge-green">100% OK</span>
              </div>

              <div className="kd-check-item">
                <span className="kd-check-icon text-green">✅</span>
                <div className="kd-check-info">
                  <div className="kd-check-title">Fire Extinguisher & First-Aid Station</div>
                  <div className="kd-check-sub">Visible in Room 102 Corner B</div>
                </div>
                <span className="kd-badge badge-green">Verified</span>
              </div>

              <div className="kd-check-item">
                <span className="kd-check-icon text-green">✅</span>
                <div className="kd-check-info">
                  <div className="kd-check-title">Certified Trainer In-Frame</div>
                  <div className="kd-check-sub">Trainer ID: TR-8921 (Rajesh Kumar)</div>
                </div>
                <span className="kd-badge badge-green">Present</span>
              </div>

              <div className="kd-check-item">
                <span className="kd-check-icon text-green">✅</span>
                <div className="kd-check-info">
                  <div className="kd-check-title">Camera Lens Tamper & Anti-Spoof</div>
                  <div className="kd-check-sub">No lens cover or freeze frame loop</div>
                </div>
                <span className="kd-badge badge-green">Normal</span>
              </div>
            </div>
          </div>

          {/* Edge Payload Preview */}
          <div className="kd-card">
            <div className="kd-card-header kd-flex-between">
              <h3>Edge JSON Payload (Bandwidth-Safe: &lt;5 KB)</h3>
              <span className="kd-badge badge-blue">MQTT / HTTPS Sync</span>
            </div>
            <pre className="kd-code-block">
{`{
  "center_id": "TC-KA-BLR-042",
  "room_id": "ROOM_102",
  "timestamp": "${new Date().toISOString()}",
  "biometric_claimed": ${biometricCount},
  "cctv_heads_detected": ${aiDetectedCount},
  "discrepancy_delta": ${ghostTrainees},
  "infra_score": ${infraScore},
  "dpdp_privacy_applied": ${isPrivacyOn},
  "signature_sha256": "8f3b...e71c"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraFeedView;
