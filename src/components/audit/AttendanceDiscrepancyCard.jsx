import React, { useEffect, useMemo, useState } from 'react';
import { formatINR } from '../../data/centerMockData.js';
import { vacancyVerdict } from '../../services/edgePersonEngine.js';
import { Panel, Bar, SeverityBadge, ThresholdLegend, Sparkline } from '../common/Ui.jsx';

/**
 * AttendanceDiscrepancyCard
 * ---------------------------------------------------------------------------
 * The single most important screen in PS 26245: the automated cross-check of
 * the centre's portal-claimed attendance against the AI physical headcount,
 * with the estimated government grant leakage and a time-lapse carousel of
 * verification snapshots captured during the batch's declared active hours.
 *
 * Cross-check identities shown (never biometric):
 *   N_reg  — roster registered on SDMS              (sanctioned batch strength)
 *   N_portal — attendance the centre filed          (portal claim)
 *   N_ai   — aspirants physically present in frame  (edge inference)
 */
export default function AttendanceDiscrepancyCard({ centre, batch, verification, onEscalate, active = true }) {
  const snapshots = centre.auditTrail || [];
  const [index, setIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const worstIndex = useMemo(() => {
    let wi = 0;
    snapshots.forEach((s, i) => {
      if (s.aiHeadcount < snapshots[wi].aiHeadcount) wi = i;
    });
    return wi;
  }, [snapshots]);

  useEffect(() => {
    setIndex(worstIndex);
  }, [worstIndex, batch.batchId]);

  useEffect(() => {
    if (!autoPlay || snapshots.length <= 1 || !active) return undefined;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % snapshots.length), 4500);
    return () => window.clearInterval(id);
  }, [autoPlay, snapshots.length, active]);

  const current = snapshots[index] || snapshots[0] || null;
  const series = useMemo(() => snapshots.map((s) => s.aiHeadcount), [snapshots]);
  const isCritical = verification.severity.key === 'red';
  const ghostLine = `${verification.ghosts} Phantom Students Claimed (${verification.discrepancy.toFixed(1)}% Shortfall)`;

  return (
    <Panel
      title={`Automated Attendance Cross-Check — Batch ${batch.batchId.split('/').pop()}`}
      subtitle={`${batch.course} · ${batch.qpCode} · Trainer ${batch.trainer} · Declared hours ${batch.activeHours}`}
      icon="🧾"
      tone={verification.severity.key}
      actions={
        <div className="disc-actions">
          <SeverityBadge severity={verification.severity} />
          {onEscalate && (
            <button type="button" className="btn btn--danger btn--sm" onClick={() => onEscalate(centre.id)}>
              🏛️ Escalate to MSDE Console
            </button>
          )}
        </div>
      }
    >
      {/* ---------------------- roster tally ---------------------- */}
      <div className="tally">
        <div className="tally__item tally__item--neutral">
          <span className="tally__label">Registered Strength (N_reg)</span>
          <span className="tally__value">{batch.sanctionedStrength}</span>
          <Bar value={batch.sanctionedStrength} max={batch.sanctionedStrength} tone="neutral" label="Registered strength" />
          <span className="tally__note">
            Batch sanctioned on {new Date(batch.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · NSQF level 4
          </span>
        </div>

        <div className="tally__item tally__item--amber">
          <span className="tally__label">Portal Reported Attendance (N_portal)</span>
          <span className="tally__value">{batch.portalReported}</span>
          <Bar value={batch.portalReported} max={batch.sanctionedStrength} tone="amber" label="Portal claimed attendance" />
          <span className="tally__note">
            Filed by centre on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · SDMS biometric log
            {batch.trainerPortalPresent ? ' shows trainer marked present' : ' has NO trainer mark'}
          </span>
        </div>

        <div className="tally__item tally__item--red">
          <span className="tally__label">AI Physical Headcount (N_ai)</span>
          <span className="tally__value tally__value--big">{batch.aiPhysical}</span>
          <Bar value={batch.aiPhysical} max={batch.sanctionedStrength} tone="red" label="AI detected headcount" />
          <span className="tally__note">
            Edge inference across {verification.verificationEpochs} verification epochs · mean confidence {verification.aiConfidence}% · trainer{' '}
            {batch.trainerPortalPresent ? 'physically detected' : 'NOT detected in hall'}
          </span>
        </div>

        <div className={`tally__item tally__item--${isCritical ? 'red' : verification.severity.key === 'amber' ? 'amber' : 'green'}`}>
          <span className="tally__label">Differential (ghost trainees)</span>
          <span className="tally__value">{verification.ghosts}</span>
          <Bar value={verification.ghosts} max={Math.max(1, batch.portalReported)} tone={isCritical ? 'red' : 'amber'} label="Ghost trainee count" />
          <span className="tally__note">
            N_portal − N_ai = {batch.portalReported} − {batch.aiPhysical} = {verification.ghosts} unverifiable beneficiaries
          </span>
        </div>
      </div>

      {/* ---------------------- pulsing fraud banner ---------------------- */}
      {isCritical ? (
        <div className="alert-banner alert-banner--critical alert-banner--pulse">
          <span className="alert-banner__pulse">🔴</span>
          <div>
            <strong>
              CRITICAL GHOST TRAINEE FRAUD: {ghostLine}!
            </strong>
            <p>
              Est. Grant Leakage: <b>{formatINR(verification.leakage)}</b> per month at ₹{verification.perTraineeCost.toLocaleString('en-IN')} per
              candidate. Attendance integrity index {verification.attendanceIntegrity?.toFixed?.(1) ?? verification.occupancyPct}% at the AI-verified
              headcount of {batch.aiPhysical} against a claimed roster of {batch.portalReported}.
            </p>
            <div className="alert-banner__meta">
              <span>Verification ID: <b>{verification.reportId}</b></span>
              <span>Generated: <b>{new Date(verification.generatedAt).toLocaleString('en-IN')}</b></span>
              <span>Band: <b>{verification.severity.band} — {verification.severity.verdict}</b></span>
            </div>
          </div>
        </div>
      ) : (
        <div className={`alert-banner alert-banner--${verification.severity.key === 'amber' ? 'warn' : 'ok'}`}>
          <span className="alert-banner__pulse">{verification.severity.emoji}</span>
          <div>
            <strong>
              {verification.severity.verdict}: {verification.ghosts} trainee(s) unverified ({verification.discrepancy.toFixed(1)}% variance).
            </strong>
            <p>
              {verification.severity.description} Estimated exposure {formatINR(verification.leakage)} · verification ID {verification.reportId}
            </p>
          </div>
        </div>
      )}

      {/* ---------------------- formula transparency ---------------------- */}
      <div className="formula-grid">
        <div className="formula-card">
          <span className="formula-card__tag">Attendance discrepancy ratio</span>
          <code className="formula-card__math">
            D_att = ((N_portal − N_ai) / N_portal) × 100
          </code>
          <code className="formula-card__sub">
            = (({batch.portalReported} − {batch.aiPhysical}) / {batch.portalReported}) × 100 = <b>{verification.discrepancy.toFixed(2)}%</b>
          </code>
          <span className={`formula-card__verdict formula-card__verdict--${verification.severity.key}`}>
            {verification.severity.emoji} {verification.severity.verdict} — {verification.severity.band} band
          </span>
        </div>

        <div className="formula-card">
          <span className="formula-card__tag">Financial leakage calculator</span>
          <code className="formula-card__math">Leakage = Ghost_trainees × ₹{verification.perTraineeCost.toLocaleString('en-IN')}</code>
          <code className="formula-card__sub">
            = {verification.ghosts} × ₹{verification.perTraineeCost.toLocaleString('en-IN')} = <b>{formatINR(verification.leakage)}</b>
          </code>
          <span className="formula-card__hint">
            Annualised exposure {formatINR(verification.leakageAnnualised)} if the pattern persists across 12 disbursement cycles.
          </span>
        </div>

        <div className="formula-card formula-card--hist">
          <span className="formula-card__tag">Verified headcount history (this batch)</span>
          <Sparkline values={series} width={280} height={62} color="#f87171" fill="rgba(248,113,113,0.16)" max={batch.sanctionedStrength} />
          <code className="formula-card__sub">
            epochs: [{series.join(', ')}] · portal claim held constant at {batch.portalReported}
          </code>
          <span className="formula-card__hint">
            Flat vacancy across the window rules out late arrivals — a sustained absence, not a timing artefact.
          </span>
        </div>
      </div>

      <ThresholdLegend compact />

      {/* ---------------------- snapshot carousel ---------------------- */}
      <div className="carousel">
        <div className="carousel__head">
          <div>
            <h3>Time-lapse verification snapshots — classroom vacancy during active batch hours</h3>
            <p>
              Face-redacted keyframes captured by {centre.classroom.edgeNode}; the MTMO/geofence model proves the hall was filmed inside the
              declared {batch.activeHours} window.
            </p>
          </div>
          <div className="carousel__controls">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAutoPlay((a) => !a)}>
              {autoPlay ? '⏸ Pause auto-play' : '▶ Resume auto-play'}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setIndex((i) => (i - 1 + snapshots.length) % snapshots.length)} aria-label="Previous snapshot">
              ‹ Prev
            </button>
            <span className="carousel__counter">
              {snapshots.length ? index + 1 : 0} / {snapshots.length}
            </span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setIndex((i) => (i + 1) % snapshots.length)} aria-label="Next snapshot">
              Next ›
            </button>
          </div>
        </div>

        {current ? (
          <figure className="carousel__frame">
            <div className="carousel__scene">
              <div className="scene-seats" role="img" aria-label={`Seat map: ${current.aiHeadcount} of ${batch.sanctionedStrength} seats occupied`}>
                {Array.from({ length: batch.sanctionedStrength }).map((_, i) => (
                  <span
                    key={i}
                    className={`seat ${i < current.aiHeadcount ? 'seat--filled' : 'seat--vacant'}`}
                    title={i < current.aiHeadcount ? `Seat ${i + 1}: trainee detected` : `Seat ${i + 1}: VACANT`}
                  />
                ))}
              </div>
              <div className="scene-machines">
                {centre.equipment.slice(0, 6).map((eq) => (
                  <span key={eq.id} className={`machine-lane ${eq.detectedQty < eq.sanctionedQty ? 'is-deficit' : 'is-ok'}`}>
                    <b>{eq.item.split('(')[0].trim().slice(0, 22)}</b>
                    <em>
                      {eq.detectedQty}/{eq.sanctionedQty} units
                    </em>
                  </span>
                ))}
              </div>
              <span className={`scene-verdict scene-verdict--${vacancyVerdict(current.occupancyPct).tone}`}>
                {vacancyVerdict(current.occupancyPct).label} · {current.occupancyPct}% occupancy
              </span>
            </div>

            <figcaption className="carousel__caption">
              <div className="carousel__meta">
                <div>
                  <span>Captured</span>
                  <strong>
                    {new Date(current.ts).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                </div>
                <div>
                  <span>Verification window</span>
                  <strong>{current.window}</strong>
                </div>
                <div>
                  <span>Portal claimed</span>
                  <strong className="is-warn">{current.portalClaimed}</strong>
                </div>
                <div>
                  <span>AI headcount</span>
                  <strong className="is-critical">{current.aiHeadcount}</strong>
                </div>
                <div>
                  <span>Vacant seats</span>
                  <strong className="is-critical">{current.vacantSeats}</strong>
                </div>
                <div>
                  <span>Occupancy</span>
                  <strong>{current.occupancyPct}%</strong>
                </div>
                <div>
                  <span>Trainer on floor</span>
                  <strong className={current.trainerPresent ? 'is-ok' : 'is-critical'}>{current.trainerPresent ? 'Yes' : 'No'}</strong>
                </div>
                <div>
                  <span>Edge node / jitter</span>
                  <strong className="mono">{current.edgeNode} · {current.jitterMs} ms</strong>
                </div>
              </div>
              <p className="carousel__note">
                <b>Inspector note:</b> {current.note}
              </p>
            </figcaption>
          </figure>
        ) : (
          <p className="carousel__empty">No verification snapshots recorded for this batch yet.</p>
        )}

        <div className="carousel__thumbs">
          {snapshots.map((s, i) => (
            <button
              key={s.ts}
              type="button"
              className={`thumb ${i === index ? 'is-active' : ''} ${s.aiHeadcount <= batch.aiPhysical ? 'thumb--worst' : ''}`}
              onClick={() => {
                setIndex(i);
                setAutoPlay(false);
              }}
              title={`${s.window} · ${s.aiHeadcount} trainees detected`}
            >
              <span className="thumb__time">{new Date(s.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="thumb__count">{s.aiHeadcount}<small>/{s.portalClaimed}</small></span>
              <span className="thumb__occ">{s.occupancyPct}%</span>
            </button>
          ))}
        </div>
      </div>

      {/* ---------------------- leakage ledger ---------------------- */}
      <div className="leak-ledger">
        <h4>Recovery computation for this batch</h4>
        <table className="table table--compact">
          <thead>
            <tr>
              <th>Component</th>
              <th>Basis</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ghost trainee stipend recovery</td>
              <td>{verification.ghosts} unverified beneficiaries × ₹{verification.perTraineeCost.toLocaleString('en-IN')}</td>
              <td className="num is-critical">{formatINR(verification.leakage)}</td>
            </tr>
            <tr>
              <td>Assessment &amp; certification fee recovery</td>
              <td>{verification.ghosts} × ₹1,200 (NSQF assessment slab)</td>
              <td className="num is-critical">{formatINR(verification.ghosts * 1200)}</td>
            </tr>
            <tr>
              <td>Infrastructure deficit recovery</td>
              <td>Missing sanctioned units × unit cost</td>
              <td className="num is-critical">{formatINR(0)}</td>
            </tr>
            <tr className="row--total">
              <td colSpan={2}>
                <strong>Total recoverable from this batch (per cycle)</strong>
              </td>
              <td className="num">
                <strong className="is-critical">{formatINR(verification.leakage + verification.ghosts * 1200)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
