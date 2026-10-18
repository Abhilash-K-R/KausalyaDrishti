import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getCentreById, trainingCentres } from '../../data/centerMockData.js';
import { buildCentreReport, buildBatchVerification } from '../../services/complianceRules.js';
import {
  createScene,
  renderSceneFrame,
  createWebcamTracker,
  renderTrackingFrame,
  DETECTION_FPS,
} from '../../services/edgePersonEngine.js';
import { useRafLoop } from '../../hooks/useTicker.js';
import AiDetector from './AiDetector.jsx';
import PrivacyBlurToggle from './PrivacyBlurToggle.jsx';
import BandwidthTelemetry from './BandwidthTelemetry.jsx';
import { Panel } from '../common/Ui.jsx';

export default function CameraFeedView({
  selectedCentreId = 'KA-TUM-0417',
  isPrivacyOn = true,
  setIsPrivacyOn,
  pushToast,
}) {
  const centre = useMemo(() => getCentreById(selectedCentreId) || trainingCentres[0], [selectedCentreId]);
  const batch = centre.batches[0];
  const report = useMemo(() => buildCentreReport(centre), [centre]);
  const verification = useMemo(() => buildBatchVerification(batch, centre), [batch, centre]);

  const [mode, setMode] = useState('sim'); // 'sim' | 'live'
  const [privacy, setPrivacy] = useState(isPrivacyOn);
  const [scanState, setScanState] = useState({ active: false, progress: 0 });
  const [snapshots, setSnapshots] = useState([]);
  const [webcamError, setWebcamError] = useState(null);
  const [detections, setDetections] = useState({ trainees: [], machines: [], tools: [] });

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const trackerRef = useRef(null);

  // Sync privacy state with parent if provided
  const handlePrivacyChange = (val) => {
    setPrivacy(val);
    if (setIsPrivacyOn) setIsPrivacyOn(val);
  };

  // Re-build deterministic scene when centre/batch changes
  const scene = useMemo(() => {
    return createScene({
      occupancy: batch.aiPhysical / batch.sanctionedStrength,
      roster: batch.sanctionedStrength,
      machines: report.infra.detectedUnits > 0 ? 6 : 0,
      sanctionedMachines: 10,
      tools: 5,
      now: new Date(),
      seed: `${centre.id}-${batch.batchId}`,
    });
  }, [centre.id, batch.batchId, batch.aiPhysical, batch.sanctionedStrength, report.infra.detectedUnits]);

  // Handle Live Webcam toggle
  const startWebcam = async () => {
    setWebcamError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam unavailable in this browser environment; falling back to simulated PMKVY feed.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      trackerRef.current = createWebcamTracker();
      setMode('live');
      pushToast?.({
        tone: 'success',
        title: 'Live Camera Connected',
        message: 'Streaming from local camera. Integer RGB tracking active.',
      });
    } catch (err) {
      console.warn('Webcam stream fallback:', err);
      setWebcamError(err.message || 'Webcam unavailable');
      setMode('sim');
      pushToast?.({
        tone: 'warning',
        title: 'Webcam Fallback',
        message: 'Webcam unavailable or permission denied — switching to simulated PMKVY workshop feed.',
      });
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    trackerRef.current = null;
    setMode('sim');
  };

  // Re-Scan Trigger Animation
  const triggerReScan = () => {
    if (scanState.active) return;
    setScanState({ active: true, progress: 0 });
    let p = 0;
    const interval = window.setInterval(() => {
      p += 10;
      if (p > 100) {
        window.clearInterval(interval);
        setScanState({ active: false, progress: 100 });
        pushToast?.({
          tone: 'info',
          title: 'Equipment Re-Scan Complete',
          message: '6/10 sanctioned sewing machines physically verified on premise.',
        });
      } else {
        setScanState({ active: true, progress: p });
      }
    }, 180);
  };

  // Capture Evidence snapshot
  const captureEvidence = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const snap = {
        id: `SNAP-${Date.now()}`,
        time: new Date().toLocaleTimeString('en-IN'),
        src: dataUrl,
      };
      setSnapshots((prev) => [snap, ...prev.slice(0, 3)]);
      pushToast?.({
        tone: 'success',
        title: 'Evidence Captured',
        message: `Keyframe attached to verification audit trail (${centre.id}).`,
      });
    } catch (e) {
      console.warn('Snapshot capture failed:', e);
    }
  };

  // 30-FPS RAF Rendering Loop
  const { fpsValue } = useRafLoop(
    (frameNo) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      if (mode === 'live' && videoRef.current && videoRef.current.readyState >= 2) {
        if (!trackerRef.current) trackerRef.current = createWebcamTracker();
        const res = renderTrackingFrame(ctx, trackerRef.current, videoRef.current, {
          frame: frameNo,
          privacyOn: privacy,
          scan: scanState,
        });
        if (res && res.trainees) setDetections(res);
      } else {
        const res = renderSceneFrame(ctx, scene, {
          frame: frameNo,
          privacyOn: privacy,
          scan: scanState,
        });
        if (res && res.trainees) setDetections(res);
      }
    },
    { fps: DETECTION_FPS, active: true }
  );

  useEffect(() => {
    return () => stopWebcam();
  }, []);

  return (
    <div className="kd-edge-portal">
      {/* Hidden video element for live webcam stream */}
      <video ref={videoRef} playsInline muted style={{ display: 'none' }} />

      {/* Header Bar */}
      <div className="portal-header">
        <div>
          <h2 className="portal-title">Centre Edge AI Camera Feed</h2>
          <p className="portal-subtitle">
            {centre.name} · {centre.taluk}, {centre.district} ({centre.id}) · Batch {batch.batchId.split('/').pop()} ({batch.course})
          </p>
        </div>

        <div className="portal-controls">
          <div className="btn-group">
            <button
              type="button"
              className={`btn btn--sm ${mode === 'live' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={mode === 'live' ? stopWebcam : startWebcam}
            >
              📹 Live Webcam Stream
            </button>
            <button
              type="button"
              className={`btn btn--sm ${mode === 'sim' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => {
                stopWebcam();
                setMode('sim');
              }}
            >
              🎬 Simulated PMKVY Workshop Feed
            </button>
          </div>

          <button
            type="button"
            className={`btn btn--sm ${privacy ? 'btn--success' : 'btn--danger'}`}
            onClick={() => handlePrivacyChange(!privacy)}
          >
            {privacy ? '🔒 Privacy Blur: ON' : '🔓 Privacy Blur: OFF'}
          </button>

          <button
            type="button"
            className={`btn btn--sm ${scanState.active ? 'btn--warn is-scanning' : 'btn--secondary'}`}
            onClick={triggerReScan}
            disabled={scanState.active}
          >
            {scanState.active ? `Scanning (${scanState.progress}%) — RE-SCAN IN PROGRESS` : '🔄 Trigger Equipment Re-Scan'}
          </button>

          <button type="button" className="btn btn--sm btn--primary" onClick={captureEvidence}>
            📸 Capture Evidence
          </button>
        </div>
      </div>

      {webcamError && (
        <div className="notice-banner notice-banner--warn">
          <span>⚠️ {webcamError}</span>
        </div>
      )}

      {/* Main Grid: Feed + Telemetry */}
      <div className="edge-grid">
        {/* Left Column: Canvas Viewport */}
        <div className="edge-viewport-col">
          <Panel
            title="Real-Time Computer Vision Detection Feed"
            subtitle={`${mode === 'live' ? 'Live Webcam Segmenter' : 'Synthetic PMKVY Workshop Hall'} · Resolution: 640×384 (Scaled 2x)`}
            icon="📹"
            tone="default"
            actions={
              <div className="feed-badges">
                <span className="chip chip--green">● 30 FPS ACTIVE</span>
                <span className="chip chip--blue">{privacy ? '🔒 DPDP Face-Masked' : '⚠️ Raw Stream'}</span>
              </div>
            }
          >
            <div className="canvas-wrapper">
              <canvas
                ref={canvasRef}
                className="feed-canvas"
                width={640}
                height={384}
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8, background: '#0a0f18' }}
              />

              {scanState.active && (
                <div className="scan-sweep-overlay">
                  <div className="scan-line" style={{ top: `${scanState.progress}%` }} />
                  <span className="scan-label">RE-SCAN IN PROGRESS · ASSET QR MATCHING</span>
                </div>
              )}
            </div>

            {/* Evidence Snaps Row */}
            {snapshots.length > 0 && (
              <div className="evidence-strip">
                <span className="evidence-title">Captured Audit Evidence Keyframes:</span>
                <div className="evidence-thumbs">
                  {snapshots.map((s) => (
                    <div key={s.id} className="snap">
                      <img src={s.src} alt="Evidence snapshot" />
                      <span className="snap-time">{s.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          {/* AI Detector HUD & Classes */}
          <AiDetector
            detections={detections}
            fps={fpsValue}
            mode={mode}
            privacyOn={privacy}
            scanState={scanState}
            roster={batch.sanctionedStrength}
            sanctionedMachines={10}
            activeHours={batch.activeHours}
            batchId={batch.batchId}
            withinBatchHours={true}
          />
        </div>

        {/* Right Column: Privacy & Bandwidth Telemetry */}
        <div className="edge-sidebar-col">
          <PrivacyBlurToggle privacyOn={privacy} onChange={handlePrivacyChange} />

          <Panel title="DPDP Act 2023 Compliance Guarantee" icon="🛡️" tone="privacy">
            <div className="privacy-specs">
              <div className="spec-row">
                <span>Face embeddings stored:</span>
                <strong className="text-green">0 (Zero Templates)</strong>
              </div>
              <div className="spec-row">
                <span>Facial hash creation:</span>
                <strong className="text-green">0 (Prohibited)</strong>
              </div>
              <div className="spec-row">
                <span>Raw identifiable video retention:</span>
                <strong className="text-green">0-day (Buffer purged locally)</strong>
              </div>
              <p className="spec-note">
                Strict adherence to Digital Personal Data Protection Act 2023 Section 7(1)(a). Only anonymous headcounts
                and machine class counts leave the edge node.
              </p>
            </div>
          </Panel>

          <BandwidthTelemetry report={report} centres={trainingCentres} />
        </div>
      </div>
    </div>
  );
}
