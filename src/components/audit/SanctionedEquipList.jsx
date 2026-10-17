import React from 'react';
import { formatINR } from '../../data/centerMockData.js';
import { equipmentRollup } from '../../services/complianceRules.js';
import { Panel, Bar } from '../common/Ui.jsx';

/**
 * SanctionedEquipList
 * ---------------------------------------------------------------------------
 * Asset-tag-wise verification table for the centre's sanctioned tool-kit.
 * Each row is judged by the rule engine (not by hand-coded statuses), so the
 * Compliant / Deficit flag, the per-item score and the value-at-risk all move
 * together when the Ministry changes a sanctioned quantity.
 */
export default function SanctionedEquipList({ centre, scanning = false, scanIndex = -1, highlightIds = [] }) {
  const rollup = equipmentRollup(centre.equipment);

  return (
    <Panel
      title="Sanctioned Infrastructure Inventory — Physical Verification"
      subtitle={`${centre.id} · asset QR / visual tag recognition · C_infra = (Σ detected / Σ sanctioned) × 100`}
      icon="🧰"
      actions={
        <span className={`chip ${rollup.score >= 90 ? 'chip--green' : rollup.score >= 75 ? 'chip--amber' : 'chip--red'}`}>
          {rollup.detectedUnits}/{rollup.sanctionedUnits} units on floor · {rollup.score}%
        </span>
      }
    >
      <div className="table-wrap">
        <table className="table table--equip">
          <thead>
            <tr>
              <th style={{ width: '32%' }}>Sanctioned item</th>
              <th>Asset tag</th>
              <th className="num">Sanctioned</th>
              <th className="num">AI detected</th>
              <th className="num">Deficit</th>
              <th className="num">Unit cost</th>
              <th className="num">Value at risk</th>
              <th>Presence score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rollup.rows.map((row, idx) => {
              const isScanningRow = scanning && idx === scanIndex % rollup.rows.length;
              const isNewlyFlagged = highlightIds.includes(row.id);
              return (
                <tr
                  key={row.id}
                  className={`${row.missing > 0 ? 'row--deficit' : 'row--ok'} ${isScanningRow ? 'row--scanning' : ''} ${isNewlyFlagged ? 'row--flagged' : ''}`}
                >
                  <td>
                    <div className="equip-name">
                      <span className={`equip-dot ${row.severity}`} />
                      <div>
                        <strong>{row.item}</strong>
                        {row.critical && <em className="equip-critical" title="Critical / safety-relevant asset">CRITICAL ASSET</em>}
                      </div>
                    </div>
                  </td>
                  <td className="mono">{row.assetTag}</td>
                  <td className="num">{row.sanctionedQty}</td>
                  <td className="num">
                    <strong className={row.detectedQty < row.sanctionedQty ? 'is-critical' : 'is-ok'}>{row.detectedQty}</strong>
                  </td>
                  <td className="num">
                    {row.missing > 0 ? <span className="badge badge--red">−{row.missing}</span> : <span className="badge badge--green">0</span>}
                  </td>
                  <td className="num">{formatINR(row.unitCost)}</td>
                  <td className="num">{row.valueAtRisk > 0 ? <strong className="is-critical">{formatINR(row.valueAtRisk)}</strong> : '—'}</td>
                  <td>
                    <div className="equip-score">
                      <Bar value={row.itemScore} tone={row.severity === 'green' ? 'green' : row.severity === 'amber' ? 'amber' : 'red'} height={8} />
                      <span>{row.itemScore}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill status-pill--${row.severity}`}>
                      {row.missing === 0 ? '🟢 Compliant' : row.criticalMissing ? '🔴 Missing (Safety)' : `🔴 ${row.missing} Deficit`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>
                <strong>Totals</strong>
              </td>
              <td className="num"><strong>{rollup.sanctionedUnits}</strong></td>
              <td className="num"><strong>{rollup.detectedUnits}</strong></td>
              <td className="num"><strong className="is-critical">−{rollup.deficitUnits}</strong></td>
              <td className="num">{formatINR(rollup.sanctionedValue)}</td>
              <td className="num"><strong className="is-critical">{formatINR(rollup.valueAtRisk)}</strong></td>
              <td colSpan={2}>
                <strong>{rollup.score}% infrastructure compliance</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="equip-notes">
        <div className="equip-note">
          <span>Compliant line items</span>
          <strong className="is-ok">
            {rollup.compliantItems}/{rollup.rows.length}
          </strong>
        </div>
        <div className="equip-note">
          <span>Items in deficit</span>
          <strong className="is-critical">{rollup.deficitItems}</strong>
        </div>
        <div className="equip-note">
          <span>Critical assets missing</span>
          <strong className="is-critical">{rollup.criticalMissing.length}</strong>
        </div>
        <div className="equip-note">
          <span>Safety compliance</span>
          <strong className={rollup.safetyBreach ? 'is-critical' : 'is-ok'}>
            {rollup.safetyBreach ? '❌ BREACH — fire safety kit absent' : '✅ Compliant'}
          </strong>
        </div>
      </div>

      {rollup.safetyBreach && (
        <div className="alert-banner alert-banner--critical">
          <span className="alert-banner__pulse">🔥</span>
          <div>
            <strong>SAFETY EQUIPMENT BREACH — Fire extinguisher sanctioned but NOT physically detected.</strong>
            <p>
              Training delivery must be suspended until an ISI-marked CO₂ extinguisher with a valid refill certificate is placed on
              the shop floor. Violation reported under the Factories Act 1948 read with PMKVY 4.0 Clause 9.7.
            </p>
          </div>
        </div>
      )}
    </Panel>
  );
}
