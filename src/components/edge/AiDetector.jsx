import React, { useMemo } from 'react';
import { CLASS_META, visionEngineInfo, vacancyVerdict } from '../../services/edgePersonEngine.js';
import { Panel, Bar, StatChip } from '../common/Ui.jsx';

/**
 * AiDetector
 * ---------------------------------------------------------------------------
 * The inspection console for the edge inference stage. Everything shown here
 * is derived from the live FrameResult emitted by `edgePersonEngine`, never
 * from a hardcoded figure:
 *   • Physical headcount of trainees present in the hall right now
 *   • Machinery detected vs sanctioned (asset-presence compliance)
 *   • Per-class confidence breakdown + anonymous track IDs
 *   • Model card: architecture, input tensor, runtime, latency, DPDP posture
 */
export default function AiDetector({
  detections,
  fps = 30,
  mode = 'sim',
  privacyOn = true,
  scanState = { active: false, progress: 0 },
  roster = 30,
  sanctionedMachines = 10,
  activeHours = '',
  batchId = '',
  withinBatchHours = true,
}) {
  const trainees = detections?.trainees || [];
  const machines = detections?.machines || [];
  const tools = detections?.tools || [];

  const occupancy = roster > 0 ? (trainees.length / roster) * 100 : 0;
  const verdict = vacancyVerdict(occupancy);

  const meanConfidence = useMemo(() => {
    const all = [...trainees, ...machines, ...tools];
    if (!all.length) return 0;
    return (all.reduce((s, d) => s + (d.confidence || 0), 0) / all.length) * 100;
  }, [trainees, machines, tools]);

  const machineryStatus = machines.length >= sanctionedMachines ? 'green' : machines.length / Math.max(1, sanctionedMachines) >= 0.7 ? 'amber' : 'red';

  return (
    <Panel
      title="AI Detection Stage — Person & Machinery"
      subtitle={`${visionEngineInfo.name} · ${visionEngineInfo.input}`}
      icon="🧠"
      actions={<span className={`live-tag ${fps > 0 ? 'is-live' : ''}`}><i className="pulse-dot" />{mode === 'live' ? 'WEBCAM' : 'SCENE'} · {fps} FPS</span>}
    >
      <div className="hud detector-hud">
        <div className="detector-hud__primary">
          <span className="detector-hud__label">Physical Headcount</span>
          <span className="detector-hud__value">
            {trainees.length} <small>Trainees</small>
          </span>
          <span className={`detector-hud__delta detector-hud__delta--${verdict.tone}`}>
            {occupancy.toFixed(1)}% of sanctioned {roster} · {verdict.label}
          </span>
        </div>
        <div className="detector-hud__primary">
          <span className="detector-hud__label">Machinery Detected</span>
          <span className="detector-hud__value">
            {machines.length}
            <small>/{sanctionedMachines} Active</small>
          </span>
          <span className={`detector-hud__delta detector-hud__delta--${machineryStatus}`}>
            {machines.length >= sanctionedMachines
              ? 'All sanctioned assets physically present'
              : `${sanctionedMachines - machines.length} sanctioned asset(s) absent from the hall`}
          </span>
        </div>
        <div className="detector-hud__primary">
          <span className="detector-hud__label">AI Detection FPS</span>
          <span className="detector-hud__value">
            {fps} <small>FPS</small>
          </span>
          <span className="detector-hud__delta detector-hud__delta--green">
            Edge Runtime · {visionEngineInfo.latencyMs} ms/frame NPU budget
          </span>
        </div>
      </div>

      <div className="detector-bars">
        <div className="detector-bar">
          <span className="detector-bar__name" style={{ color: CLASS_META.trainee.color }}>
            ● Trainees (green boxes)
          </span>
          <Bar value={trainees.length} max={Math.max(roster, trainees.length, 1)} tone="green" />
          <span className="detector-bar__val">{trainees.length}</span>
        </div>
        <div className="detector-bar">
          <span className="detector-bar__name" style={{ color: CLASS_META.machine.color }}>
            ● Machinery (blue boxes)
          </span>
          <Bar value={machines.length} max={Math.max(sanctionedMachines, machines.length, 1)} tone="blue" />
          <span className="detector-bar__val">{machines.length}</span>
        </div>
        <div className="detector-bar">
          <span className="detector-bar__name" style={{ color: CLASS_META.tool.color }}>
            ● Workshop tools (violet tags)
          </span>
          <Bar value={tools.length} max={Math.max(8, tools.length)} tone="violet" />
          <span className="detector-bar__val">{tools.length}</span>
        </div>
      </div>

      <div className="detector-chips">
        <StatChip label="Mean detection confidence" value={meanConfidence.toFixed(1)} unit="%" tone={meanConfidence > 90 ? 'green' : 'amber'} icon="🎯" />
        <StatChip label="Boundary boxes this epoch" value={trainees.length + machines.length + tools.length} tone="info" icon="▣" />
        <StatChip label="Batch window" value={withinBatchHours ? 'ACTIVE' : 'OUTSIDE'} tone={withinBatchHours ? 'green' : 'amber'} icon="🕘" hint={activeHours} />
        <StatChip label="Privacy posture" value={privacyOn ? 'Face-blur ON' : 'Face-blur OFF'} tone={privacyOn ? 'green' : 'red'} icon="🔒" />
      </div>

      <div className="detector-lists">
        <div className="detector-list">
          <h4>Trainee tracks — anonymous centroids</h4>
          <ul>
            {trainees.slice(0, 12).map((t) => (
              <li key={t.id}>
                <span className="detector-list__id">{t.id}</span>
                <span className="detector-list__bar">
                  <Bar value={t.confidence * 100} tone="green" height={6} />
                </span>
                <span className="detector-list__conf">{(t.confidence * 100).toFixed(0)}%</span>
                <span className="detector-list__lock" title="No biometric identity stored">
                  🔒
                </span>
              </li>
            ))}
            {!trainees.length && <li className="detector-list__empty">No trainees detected in frame — classroom vacant.</li>}
          </ul>
        </div>

        <div className="detector-list">
          <h4>Machinery tracks — asset tags</h4>
          <ul>
            {machines.slice(0, 12).map((m) => (
              <li key={m.id}>
                <span className="detector-list__id detector-list__id--blue">{m.id}</span>
                <span className="detector-list__label">{m.label}</span>
                <span className="detector-list__conf">{(m.confidence * 100).toFixed(0)}%</span>
                <span className={`detector-list__state ${m.operational ? 'ok' : 'bad'}`} title={m.operational ? 'Powered / in use' : 'Present but idle'}>
                  {m.operational ? '●' : '○'}
                </span>
              </li>
            ))}
            {!machines.length && <li className="detector-list__empty">No machinery detected in frame.</li>}
          </ul>
        </div>
      </div>

      {scanState && scanState.active && (
        <div className="scan-banner">
          <i className="pulse-dot" /> RE-SCAN IN PROGRESS — sweeping the hall, epoch {Math.round(scanState.progress * 100)}% ·
          verifying asset tags & seat occupancy
        </div>
      )}

      <div className="model-card">
        <div className="model-card__row">
          <span>Model</span>
          <strong>{visionEngineInfo.name}</strong>
        </div>
        <div className="model-card__row">
          <span>Input tensor</span>
          <strong>{visionEngineInfo.input}</strong>
        </div>
        <div className="model-card__row">
          <span>Classes</span>
          <strong>{visionEngineInfo.classes.join(' · ')}</strong>
        </div>
        <div className="model-card__row">
          <span>Runtime</span>
          <strong>{visionEngineInfo.runtime}</strong>
        </div>
        <div className="model-card__row">
          <span>Privacy</span>
          <strong>{visionEngineInfo.privacy}</strong>
        </div>
        <div className="model-card__row">
          <span>Monitoring</span>
          <strong>{batchId || 'No batch selected'}</strong>
        </div>
      </div>
    </Panel>
  );
}
