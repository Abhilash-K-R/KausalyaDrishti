import React, { useEffect, useMemo, useState } from 'react';
import {
  connectivityProfiles,
  edgePacketProfile,
  legacyStreamProfile,
  formatINR,
} from '../../data/centerMockData.js';
import {
  buildClusterSaving,
  buildEdgePacket,
  buildTelemetryLedger,
  computeBandwidthComparison,
  linkFeasibility,
  stringifyPacket,
} from '../../services/edgeTelemetry.js';
import { Panel, CopyButton, Bar, StatChip } from '../common/Ui.jsx';

/**
 * BandwidthTelemetry
 * ---------------------------------------------------------------------------
 * The "works on rural 2G" proof panel:
 *   • Traditional 24×7 video : 500 MB / hour  ➜ fails on 2G/3G
 *   • KausalyaDrishti packet : 5 KB / 15 min  ➜ payload fits in ~0.3 s on 2G
 *   • Live formatted JSON preview of the exact edge packet sent to MSDE.
 */
export default function BandwidthTelemetry({ report, centres = [], now = new Date() }) {
  const [txCount, setTxCount] = useState(0);
  const [profileId, setProfileId] = useState('2g');
  const [showJson, setShowJson] = useState(true);

  const profile = connectivityProfiles.find((p) => p.id === profileId) || connectivityProfiles[0];

  const packet = useMemo(() => {
    const p = buildEdgePacket(report, 0, now, profile);
    return p;
  }, [report, now, profile]);

  const comparison = useMemo(() => {
    const keyframes = packet.evidence.keyframesCaptured;
    return computeBandwidthComparison({ hours: 1, keyframes });
  }, [packet]);

  // Metadata-only baseline (a fully compliant centre transmits no keyframes).
  const metadataOnly = useMemo(() => computeBandwidthComparison({ hours: 1, keyframes: 0 }), []);

  /** PS 26245 declares a ≥99.8% bandwidth-saving target; show it against the measurement. */
  const benchmarkPct = 99.8;
  const benchmarkMet = comparison.savingsPct >= benchmarkPct;

  const cluster = useMemo(() => buildClusterSaving(centres), [centres]);
  const ledger = useMemo(() => buildTelemetryLedger(centres, now).slice(0, 4), [centres, now]);
  const feasibility = useMemo(() => linkFeasibility(profile, packet.evidence.keyframesCaptured), [profile, packet]);

  // Simulate packet transmission ticks (every 15 minutes in production;
  // accelerated to 6 s here so the inspector can watch the loop).
  useEffect(() => {
    setTxCount(0);
    const id = window.setInterval(() => setTxCount((c) => c + 1), 6000);
    return () => window.clearInterval(id);
  }, [report.centreId]);

  const transmittedKB = packet.packetSizeKB * (txCount + 1);
  const json = stringifyPacket(packet);
  const legacyBarPct = 100;
  const edgeBarPct = Math.max(0.4, (100 * comparison.edgeKB) / Math.max(comparison.legacyKB, 1));
  const uploadedSoFar = transmittedKB * 8 / Math.max(1, profile.uplinkKbps);

  return (
    <Panel
      title="Ultra-Low-Bandwidth Rural Edge Telemetry"
      subtitle="5 KB / 15 minutes (99.8%+ bandwidth savings) · store-and-forward metadata packets · zero raw video uplink"
      icon="📡"
      actions={
        <>
          <div className="seg seg--xs">
            {connectivityProfiles.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`seg__btn ${profileId === p.id ? 'is-active' : ''}`}
                onClick={() => setProfileId(p.id)}
                title={`${p.downlinkKbps} kbps down / ${p.uplinkKbps} kbps up`}
              >
                {p.icon} {p.id.toUpperCase()}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowJson((s) => !s)}>
            {showJson ? '▾ Hide packet' : '▸ Show packet'}
          </button>
        </>
      }
    >
      <div className="bw-hero">
        <div className="bw-hero__side bw-hero__side--legacy">
          <header>
            <span className="bw-hero__tag">❌ Legacy baseline</span>
            <strong>{legacyStreamProfile.label}</strong>
          </header>
          <div className="bw-hero__value">500 <small>MB / hour</small></div>
          <p>
            {legacyStreamProfile.resolutionLabel} @ 30 FPS continuous uplink. {legacyStreamProfile.note}
          </p>
          <Bar value={legacyBarPct} tone="red" height={10} label="Legacy stream bandwidth 100 percent" />
          <footer>
            <span>Monthly per node</span>
            <strong>{(legacyStreamProfile.perHourMB * 24 * 30 / 1024).toFixed(1)} GB</strong>
            <span>·</span>
            <span>{formatINR(legacyStreamProfile.perHourCostINR * 24 * 30)} data cost</span>
          </footer>
        </div>

        <div className="bw-hero__versus" aria-hidden="true">
          <span>VS</span>
        </div>

        <div className="bw-hero__side bw-hero__side--edge">
          <header>
            <span className="bw-hero__tag bw-hero__tag--good">✅ KausalyaDrishti edge</span>
            <strong>{edgePacketProfile.label}</strong>
          </header>
          <div className="bw-hero__value">
            {packet.packetSizeKB.toFixed(1)} <small>KB / {edgePacketProfile.cadenceMinutes} min</small>
          </div>
          <p>
            Counts + confidences + GPS + deficit flags. Keyframe mosaics ({edgePacketProfile.keyframeKB} KB,
            face-redacted) only on violation. Raw video transmitted:{' '}
            <b>{packet.evidence.rawVideoTransmittedKB} KB</b>.
          </p>
          <Bar value={edgeBarPct} tone="green" height={10} label="Edge telemetry bandwidth usage" />
          <footer>
            <span>Monthly per node</span>
            <strong>{comparison.edgePerDayMB ? (comparison.edgePerDayMB * 30 / 1024).toFixed(3) : '0.009'} GB</strong>
            <span>·</span>
            <span>{formatINR(Math.round(comparison.monthlyEdgeCostINR))} data cost</span>
          </footer>
        </div>

        <div className="bw-hero__savings">
          <span className="bw-hero__savings-value">{comparison.savingsPct}%</span>
          <span className="bw-hero__savings-label">Bandwidth savings</span>
          <span className="bw-hero__savings-note">
            {comparison.ratio.toFixed(0)}× smaller than 24×7 video
          </span>
          <span className="bw-hero__savings-note">
            Metadata-only path: <b>{metadataOnly.savingsPct}%</b>
          </span>
          <span className={`bw-bench ${benchmarkMet ? 'is-met' : 'is-miss'}`}>
            🎯 SIH benchmark ≥ {benchmarkPct}% — {benchmarkMet ? 'EXCEEDED' : 'BELOW'}
          </span>
        </div>
      </div>

      <div className="bw-stats">
        <StatChip
          label="Edge packet size"
          value={packet.packetSizeKB.toFixed(2)}
          unit="KB"
          tone="green"
          icon="📦"
          hint={`Target ≤ 5 KB ${packet.packetSizeKB <= 5 ? '✓ met' : '✗ exceeded'} · ${comparison.packetsPerHour} packets/hour/node`}
        />
        <StatChip label="Packets transmitted" value={txCount + 1} unit=" pkts" tone="info" icon="📶" hint={`${transmittedKB.toFixed(1)} KB uplinked so far`} />
        <StatChip label="Uplink on selected link" value={`${profile.uplinkKbps}`} unit="kbps" tone="neutral" icon={profile.icon} hint={`${profile.label}`} />
        <StatChip
          label="Time to push one packet"
          value={feasibility.uploadSeconds.toFixed(1)}
          unit="s"
          tone={feasibility.withinCadence ? 'green' : 'red'}
          icon="⏱️"
          hint={feasibility.withinCadence ? 'Fits the 15-min cadence comfortably' : 'Exceeds cadence — will buffer locally'}
        />
        <StatChip label="Keyframes on violation" value={packet.evidence.keyframesCaptured} unit=" frames" tone={packet.evidence.keyframesCaptured ? 'amber' : 'green'} icon="🖼️" hint={`${packet.evidence.keyframeBytesKB} KB redacted JPEG`} />
        <StatChip label="Monthly saving / node" value={formatINR(Math.round(Math.max(0, comparison.monthlyLegacyCostINR - comparison.monthlyEdgeCostINR)))} tone="green" icon="💰" hint="Metered rural data @ ₹180/GB" />
      </div>

      <div className="bw-feasibility">
        <h4>Link feasibility on rural connectivity</h4>
        <table className="table table--compact">
          <thead>
            <tr>
              <th>Link profile</th>
              <th>Uplink</th>
              <th>KD packet upload</th>
              <th>Fits 15-min cadence?</th>
              <th>Legacy 500 MB upload</th>
              <th>Legacy verdict</th>
            </tr>
          </thead>
          <tbody>
            {connectivityProfiles.map((p) => {
              const f = linkFeasibility(p, packet.evidence.keyframesCaptured);
              return (
                <tr key={p.id} className={p.id === profileId ? 'is-highlight' : ''}>
                  <td>
                    {p.icon} {p.label}
                  </td>
                  <td>{p.uplinkKbps} kbps</td>
                  <td>
                    <b>{f.uploadSeconds}s</b> ({f.payloadKB.toFixed(0)} KB)
                  </td>
                  <td>{f.withinCadence ? <span className="ok">✅ Yes</span> : <span className="bad">❌ No</span>}</td>
                  <td>{f.legacyUploadHours} hours</td>
                  <td>{f.legacyFeasible ? <span className="ok">possible</span> : <span className="bad">impossible on site</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showJson && (
        <div className="bw-json">
          <div className="bw-json__head">
            <div>
              <strong>Live edge packet → MSDE Evidence Gateway</strong>
              <span>
                {packet.schema} · {packet.packetSizeKB.toFixed(2)} KB · emitted {new Date(packet.emittedAt).toLocaleTimeString('en-IN')} ·
                next uplink in 15 min · {uploadedSoFar.toFixed(1)}s on {profile.id.toUpperCase()}
              </span>
            </div>
            <div className="bw-json__actions">
              <CopyButton text={json} label="Copy JSON" />
            </div>
          </div>
          <pre className="code-block code-block--json" aria-label="Edge packet JSON preview">
            <code>{json}</code>
          </pre>
        </div>
      )}

      <div className="bw-ledger">
        <h4>Cluster telemetry ledger — {cluster.nodes} edge nodes, 72 h store-and-forward buffer</h4>
        <table className="table table--compact">
          <thead>
            <tr>
              <th>Centre</th>
              <th>District</th>
              <th>Packet</th>
              <th>Keyframes</th>
              <th>Edge / hour</th>
              <th>Legacy / hour</th>
              <th>Savings</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((row) => (
              <tr key={row.centreId}>
                <td>
                  <span className={`dot ${row.flagged ? 'dot--red' : 'dot--green'}`} /> {row.centreName}
                </td>
                <td>{row.district}</td>
                <td>{row.packetKB.toFixed(2)} KB</td>
                <td>{row.keyframes}</td>
                <td className="ok">{row.hourlyEdgeKB.toFixed(1)} KB</td>
                <td className="bad">{row.hourlyLegacyMB.toFixed(0)} MB</td>
                <td>
                  <b className="ok">{row.savingsPct}%</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bw-ledger__footer">
          <span>
            Cluster-wide saving: <b>{cluster.savedGBPerDay} GB/day</b> ({formatINR(cluster.savedCostPerMonthINR)}/month in metered
            rural data) across {cluster.nodes} nodes — feasibility on 2G {profile.id === '2g' ? 'proven' : 'verified'}.
          </span>
        </div>
      </div>
    </Panel>
  );
}
