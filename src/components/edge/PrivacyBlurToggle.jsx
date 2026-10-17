import React from 'react';
import { dpdpLedger } from '../../data/centerMockData.js';
import { Panel } from '../common/Ui.jsx';

/**
 * PrivacyBlurToggle
 * ---------------------------------------------------------------------------
 * Interactive [🔒 Privacy Blur: ON/OFF] control for the live edge stream.
 * When enabled, every detected person bounding box receives a real
 * in-canvas mosaic + Gaussian face redaction *before* the frame is ever
 * composed for display, storage or transmission.
 *
 * DPDP Act 2023 guarantees surfaced to the auditor:
 *   • 0 facial biometric templates stored
 *   • 0 face embeddings / hashes generated
 *   • 0 days retention of any identifiable imagery
 */
export default function PrivacyBlurToggle({ privacyOn, onChange, compact = false }) {
  const blurLabel = privacyOn ? 'ON' : 'OFF';

  return (
    <Panel
      title="DPDP Act 2023 — Trainee Privacy Control"
      subtitle="Section 7(1)(a) · State function · zero biometric retention"
      icon="🔒"
      tone="privacy"
    >
      <div
        className={`privacy-toggle ${privacyOn ? 'is-on' : 'is-off'} ${compact ? 'privacy-toggle--compact' : ''}`}
        role="group"
        aria-label="Privacy blur control"
      >
        <div className="privacy-toggle__visual">
          <div className="privacy-toggle__portrait">
            <span className={`portrait__face ${privacyOn ? 'is-blurred' : ''}`}>
              <i className="portrait__eye portrait__eye--l" />
              <i className="portrait__eye portrait__eye--r" />
              <i className="portrait__mouth" />
            </span>
            {privacyOn && <span className="portrait__shade">MOSAIC 12px</span>}
          </div>
          <div className="privacy-toggle__readout">
            <strong>Privacy Blur: {blurLabel}</strong>
            <span>
              {privacyOn
                ? 'Faces pixelated live — the unredacted frame never leaves the GPU buffer.'
                : 'Raw facial features are visible on this preview. Not permitted in field deployments.'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className={`switch ${privacyOn ? 'switch--on' : 'switch--off'}`}
          onClick={() => onChange && onChange(!privacyOn)}
          aria-pressed={privacyOn}
          aria-label={`Turn privacy blur ${privacyOn ? 'off' : 'on'}`}
        >
          <span className="switch__track">
            <span className="switch__knob" />
          </span>
          <span className="switch__label">{privacyOn ? '🔒 Blur ON' : '🔓 Blur OFF'}</span>
        </button>
      </div>

      <div className="dpdp-grid">
        <div className="dpdp-cell">
          <span className="dpdp-cell__value">{dpdpLedger.biometricEmbeddingsStored}</span>
          <span className="dpdp-cell__label">Face embeddings stored</span>
        </div>
        <div className="dpdp-cell">
          <span className="dpdp-cell__value">{dpdpLedger.faceTemplatesStored}</span>
          <span className="dpdp-cell__label">Biometric templates created</span>
        </div>
        <div className="dpdp-cell">
          <span className="dpdp-cell__value">{dpdpLedger.retentionDays} d</span>
          <span className="dpdp-cell__label">Identifiable image retention</span>
        </div>
        <div className="dpdp-cell dpdp-cell--accent">
          <span className="dpdp-cell__value">100%</span>
          <span className="dpdp-cell__label">Centroid-only tracking</span>
        </div>
      </div>

      <ul className="dpdp-principles">
        {dpdpLedger.principles.map((p) => (
          <li key={p.id}>
            <span className="dpdp-principles__tick">✔</span>
            <div>
              <strong>{p.title}</strong>
              <p>{p.detail}</p>
            </div>
            <em className="dpdp-principles__status">{p.status}</em>
          </li>
        ))}
      </ul>

      <div className="dpdp-footer">
        <div>
          <span>Lawful basis</span>
          <strong>{dpdpLedger.lawfulBasis}</strong>
        </div>
        <div>
          <span>Data fiduciary</span>
          <strong>{dpdpLedger.dataFiduciary}</strong>
        </div>
        <div>
          <span>Redaction method</span>
          <strong>{dpdpLedger.blurMethod}</strong>
        </div>
      </div>
    </Panel>
  );
}
