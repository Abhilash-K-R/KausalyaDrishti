import React, { useEffect, useRef, useState } from 'react';
import { formatINR } from '../../data/centerMockData.js';
import { equipmentRollup, infraSeverity, STIPEND } from '../../services/complianceRules.js';
import { Panel, Gauge, StatChip, ThresholdLegend } from '../common/Ui.jsx';
import SanctionedEquipList from './SanctionedEquipList.jsx';

/**
 * InfraComplianceWidget
 * ---------------------------------------------------------------------------
 * Visual verdict on the centre's physical infrastructure:
 *   • Circular compliance gauge (e.g. 68% ➜ NON-COMPLIANT)
 *   • Deficit headline: 10 sewing machines sanctioned vs 6 detected = 4 missing
 *   • "Trigger Equipment Re-Scan" with a live sweeping animation across rows
 *   • Composed asset-tag table (SanctionedEquipList) as the evidence annexure
 */
export default function InfraComplianceWidget({ centre, pushToast, onScanComplete }) {
  const [scanning, setScanning] = useState(false);
  const [scanIndex, setScanIndex] = useState(-1);
  const [flagged, setFlagged] = useState([]);
  const [scanCount, setScanCount] = useState(0);
  const timerRef = useRef(null);

  const rollup = equipmentRollup(centre.equipment);
  const severity = infraSeverity(rollup.score);
  const primary = rollup.rows[0];

  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); }, []);

  const triggerScan = () => {
    if (scanning) return;
    setScanning(true);
    setScanIndex(0);
    setFlagged([]);
    timerRef.current = window.setInterval(() => {
      setScanIndex((i) => {
        const next = i + 1;
        if (next >= rollup.rows.length) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
          setScanning(false);
          setScanCount((c) => c + 1);
          setFlagged(rollup.rows.filter((r) => r.missing > 0).map((r) => r.id));
          if (typeof onScanComplete === 'function') onScanComplete(rollup);
          pushToast?.({
            tone: rollup.deficitUnits > 0 ? 'danger' : 'success',
            title: `Re-scan complete — ${rollup.detectedUnits}/${rollup.sanctionedUnits} sanctioned units verified`,
            message:
              rollup.deficitUnits > 0
                ? `${rollup.deficitUnits} asset(s) still absent · ${formatINR(rollup.valueAtRisk)} of sanctioned equipment unaccounted for.`
                : 'All sanctioned equipment physically present and QR-verified.',
          });
          return -1;
        }
        return next;
      });
    }, 260);
  };

  const savingsNote = `Each ghost trainee withheld = ${formatINR(STIPEND)} (PMKVY stipend) kept in the exchequer.`;

  return (
    <div className="infra-stack">
      <Panel
        title="Infrastructure Compliance — Sanctioned Machinery Verification"
        subtitle={`${centre.name} · ${centre.taluk} taluk · last audit ${centre.lastAuditOn} (${centre.lastAuditType})`}
        icon="🏗️"
        tone={rollup.score >= 90 ? 'ok' : rollup.score >= 75 ? 'warn' : 'danger'}
        actions={
          <button
            type="button"
            className={`btn ${scanning ? 'btn--busy' : 'btn--primary'}`}
            onClick={triggerScan}
            disabled={scanning}
          >
            {scanning ? '🔄 Scanning hall…' : scanCount > 0 ? `🔄 Re-Scan Again (${scanCount})` : '🔄 Trigger Equipment Re-Scan'}
          </button>
        }
      >
        <div className="infra-hero">
          <div className="infra-hero__gauge">
            <Gauge
              value={rollup.score}
              size={200}
              thickness={18}
              caption="C_infra"
              subCaption={severity.label}
            />
            <div className={`infra-verdict infra-verdict--${severity.key}`}>
              <span className="infra-verdict__emoji">{severity.emoji}</span>
              <div>
                <strong>{severity.label}</strong>
                <p>{severity.description}</p>
              </div>
            </div>
          </div>

          <div className="infra-hero__facts">
            <div className="fact-row">
              <span>Sanctioned units on record</span>
              <strong>{rollup.sanctionedUnits}</strong>
            </div>
            <div className="fact-row">
              <span>Units physically detected by edge AI</span>
              <strong className="is-ok">{rollup.detectedUnits}</strong>
            </div>
            <div className="fact-row">
              <span>Units absent from the premises</span>
              <strong className="is-critical">−{rollup.deficitUnits}</strong>
            </div>
            <div className="fact-row">
              <span>Sanctioned asset value</span>
              <strong>{formatINR(rollup.sanctionedValue)}</strong>
            </div>
            <div className="fact-row fact-row--emphasis">
              <span>Value of missing sanctioned assets</span>
              <strong className="is-critical">{formatINR(rollup.valueAtRisk)}</strong>
            </div>
            <div className="fact-row">
              <span>Critical safety breach</span>
              <strong className={rollup.safetyBreach ? 'is-critical' : 'is-ok'}>
                {rollup.safetyBreach ? 'YES — action required' : 'No'}
              </strong>
            </div>

            <div className="infra-headline">
              <span className="infra-headline__tag">Flagged headline</span>
              <p>
                <b>{primary.item.split('(')[0].trim()}</b>: {primary.sanctionedQty} sanctioned · {primary.detectedQty} detected ➜{' '}
                <b className="is-critical">{primary.missing} missing unit{primary.missing === 1 ? '' : 's'}</b>
                {rollup.safetyBreach && <> · <b className="is-critical">Fire Safety Extinguisher: 1 sanctioned / 0 detected — MISSING SAFETY KIT</b></>}
              </p>
            </div>
          </div>

          <div className="infra-hero__stats">
            <StatChip label="Compliance score" value={rollup.score} unit="%" tone={rollup.score >= 90 ? 'green' : rollup.score >= 75 ? 'amber' : 'red'} icon="📐" />
            <StatChip label="Deficit line items" value={rollup.deficitItems} tone={rollup.deficitItems ? 'red' : 'green'} icon="📦" />
            <StatChip label="Value at risk" value={formatINR(rollup.valueAtRisk)} tone={rollup.valueAtRisk ? 'red' : 'green'} icon="💸" />
            <StatChip label="Assets QR-verified" value={rollup.detectedUnits} tone="info" icon="🔖" hint="Asset-tag recognition, epoch-wise" />
            <StatChip
              label="Re-scan status"
              value={scanning ? 'RUNNING' : scanCount ? `DONE ×${scanCount}` : 'IDLE'}
              tone={scanning ? 'amber' : scanCount ? 'green' : 'neutral'}
              icon="🔄"
              hint={scanning ? `Verifying row ${((scanIndex % rollup.rows.length) + 1)}/${rollup.rows.length}` : 'Verification frequency: every 15 min epoch'}
            />
            <StatChip label="Scheme protection note" value="₹7,500" unit=" / trainee" tone="green" icon="🛡️" hint={savingsNote} />
          </div>
        </div>

        {rollup.safetyBreach && (
          <div className="alert-banner alert-banner--critical infra-alert">
            <span className="alert-banner__pulse">🚨</span>
            <div>
              <strong>
                SAFETY NON-COMPLIANCE: {rollup.criticalMissing.filter((r) => /fire|safety/i.test(r.item)).length} fire-safety asset(s) not
                physically detected.
              </strong>
              <p>
                Immediate 48-hour rectification window issued. Batch delivery is deemed <b>non-compliant</b> under PMKVY 4.0 Clause 9.7
                until an ISI-marked extinguisher is restored and photographed by the field auditor.
              </p>
            </div>
          </div>
        )}

        <ThresholdLegend />
      </Panel>

      <SanctionedEquipList centre={centre} scanning={scanning} scanIndex={scanIndex} highlightIds={flagged} />
    </div>
  );
}
