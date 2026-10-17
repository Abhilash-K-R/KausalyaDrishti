import React, { useMemo } from 'react';
import {
  districtSummary,
  nationalKpi,
  enforcementHistory,
  formatINR,
  formatINRCompact,
  SCHEME_META,
} from '../../data/centerMockData.js';
import { buildDistrictReport, buildKpiSummary, buildCentreReport } from '../../services/complianceRules.js';
import { Panel, StatChip, Bar, Gauge, ProgressRing } from '../common/Ui.jsx';

/**
 * MsdeDistrictDashboard — Portal 3, governance half
 * ---------------------------------------------------------------------------
 * The Ministry's command view:
 *   • KPI cards: monitored centres, active batches, ghost alerts, blocked leakage
 *   • District compliance heatmap for the Karnataka skilling grid
 *   • Enforcement ledger (show-cause / freeze / surprise-audit actions taken)
 *   • State-level scheme roll-up with leakage recovery trajectory
 */
export default function MsdeDistrictDashboard({ allCentres, onSelectDistrict, selectedDistrict = null }) {
  const district = useMemo(() => buildDistrictReport(allCentres), [allCentres]);
  const kpi = useMemo(() => buildKpiSummary(district, allCentres), [district, allCentres]);

  const riskTone = (band) => (band === 'RED' ? 'red' : band === 'GREEN' ? 'green' : 'amber');

  const schemeRollup = useMemo(() => {
    const map = new Map();
    allCentres.forEach((c) => {
      const report = buildCentreReport(c);
      const prev = map.get(c.scheme) || { scheme: c.scheme, centres: 0, claimed: 0, physical: 0, leakage: 0, ghosts: 0, deficitUnits: 0, scoreSum: 0 };
      prev.centres += 1;
      prev.claimed += report.totalClaimed;
      prev.physical += report.totalPhysical;
      prev.leakage += report.totalLeakage;
      prev.ghosts += report.totalGhosts;
      prev.deficitUnits += report.infra.deficitUnits;
      prev.scoreSum += report.complianceScore;
      map.set(c.scheme, prev);
    });
    return Array.from(map.values()).map((s) => ({ ...s, avgScore: Number((s.scoreSum / s.centres).toFixed(1)) }));
  }, [allCentres]);

  const recoverySeries = [42, 58, 71, 84, 96, 118, 137, 148]; // ₹ lakh prevented, month-over-month

  return (
    <div className="msde-dashboard">
      {/* ------------------------- KPI CARDS ------------------------- */}
      <div className="kpi-row">
        <div className="kpi-card kpi-card--blue">
          <span className="kpi-card__icon">🏫</span>
          <span className="kpi-card__label">Total Monitored Centres</span>
          <span className="kpi-card__value">{kpi.monitoredCentres}</span>
          <span className="kpi-card__hint">
            {districtSummary.edgeNodesDeployed} edge nodes live · {kpi.liveCentres} deep-instrumented in the Tumakuru pilot
          </span>
          <Bar value={kpi.monitoredCentres} max={1500} tone="blue" height={6} />
        </div>

        <div className="kpi-card kpi-card--violet">
          <span className="kpi-card__icon">🧑‍🏭</span>
          <span className="kpi-card__label">Active Batches</span>
          <span className="kpi-card__value">{kpi.activeBatches}</span>
          <span className="kpi-card__hint">
            {district.totalClaimed} claimed attendance vs {district.totalPhysical} AI-verified, in-pilot
          </span>
          <Bar value={kpi.activeBatches} max={600} tone="violet" height={6} />
        </div>

        <div className="kpi-card kpi-card--red">
          <span className="kpi-card__icon">👻</span>
          <span className="kpi-card__label">Ghost Trainee Alerts</span>
          <span className="kpi-card__value">{kpi.ghostAlerts}</span>
          <span className="kpi-card__hint">
            {district.criticalCentres} critical · {district.flaggedCentres} flagged centres across the cluster (live)
          </span>
          <Bar value={kpi.ghostAlerts} max={40} tone="red" height={6} />
        </div>

        <div className="kpi-card kpi-card--green">
          <span className="kpi-card__icon">🛡️</span>
          <span className="kpi-card__label">Blocked Grant Leakage</span>
          <span className="kpi-card__value">{formatINRCompact(kpi.preventedLeakage)}</span>
          <span className="kpi-card__hint">
            Prevented this financial year · {formatINR(kpi.preventedLeakage)} — live exposure {formatINR(district.totalLeakage)}
          </span>
          <Bar value={kpi.preventedLeakage} max={2000000} tone="green" height={6} />
        </div>
      </div>

      <div className="msde-grid">
        {/* ------------------------- HEATMAP ------------------------- */}
        <Panel
          title="Karnataka District Compliance Heatmap"
          subtitle="Risk band = attendance integrity + infrastructure score + safety breaches across all empaneled centres"
          icon="🗺️"
          actions={<span className="chip chip--blue">State roll-up · {districtSummary.districts.length} districts</span>}
        >
          <div className="heatmap">
            {districtSummary.districts.map((d) => (
              <button
                key={d.name}
                type="button"
                className={`heat-cell heat-cell--${riskTone(d.riskBand)} ${selectedDistrict === d.name ? 'is-active' : ''}`}
                onClick={() => onSelectDistrict && onSelectDistrict(d.name)}
              >
                <header>
                  <strong>{d.name}</strong>
                  <span>{d.kannada}</span>
                </header>
                <div className="heat-cell__score">
                  <ProgressRing value={d.avgCompliance} size={56} thickness={6} />
                  <div>
                    <span className="heat-cell__band">{d.riskBand} RISK</span>
                    <span className="heat-cell__sub">{d.flaggedCentres} flagged centres</span>
                  </div>
                </div>
                <ul>
                  <li>
                    <span>Empaneled</span>
                    <b>{d.empaneledCentres}</b>
                  </li>
                  <li>
                    <span>Active batches</span>
                    <b>{d.activeBatches}</b>
                  </li>
                  <li>
                    <span>Leakage prevented</span>
                    <b>{formatINRCompact(d.preventedLeakage)}</b>
                  </li>
                </ul>
              </button>
            ))}
          </div>

          <div className="heatmap-legend">
            <span><i className="swatch swatch--red" /> RED — immediate enforcement</span>
            <span><i className="swatch swatch--amber" /> YELLOW — observation window</span>
            <span><i className="swatch swatch--green" /> GREEN — compliant</span>
            <span className="heatmap-legend__officer">Escalation owner: {districtSummary.districts[0].auditOfficer}</span>
          </div>
        </Panel>

        {/* ------------------------- STATE ROLL-UP ------------------------- */}
        <Panel
          title="National Roll-up & Scheme Protection"
          subtitle="MSDE PMKVY Division · live ingestion from state SDMS instances"
          icon="🇮🇳"
        >
          <div className="national-grid">
            <StatChip label="States live" value={nationalKpi.statesLive} tone="green" icon="🗺️" hint={`${nationalKpi.statesOnboarding} onboarding`} />
            <StatChip label="Centres monitored nationally" value={nationalKpi.monitoredCentres} tone="info" icon="🏫" />
            <StatChip label="Active batches nationally" value={nationalKpi.activeBatches} tone="violet" icon="🧑‍🏭" />
            <StatChip label="Ghost alerts this month" value={nationalKpi.ghostAlertsThisMonth} tone="red" icon="👻" />
            <StatChip label="Leakage blocked this month" value={formatINRCompact(nationalKpi.blockedLeakageThisMonth)} tone="green" icon="🛡️" />
            <StatChip label="Edge uptime" value={districtSummary.avgEdgeUptimePct} unit="%" tone="green" icon="📶" hint={`Mean verification latency ${districtSummary.avgDetectionLatencyMs} ms`} />
          </div>

          <div className="scheme-table">
            <table className="table table--compact">
              <thead>
                <tr>
                  <th>Scheme</th>
                  <th className="num">Centres</th>
                  <th className="num">Claimed</th>
                  <th className="num">AI verified</th>
                  <th className="num">Ghosts</th>
                  <th className="num">Asset deficit</th>
                  <th className="num">Avg score</th>
                  <th className="num">Exposure</th>
                </tr>
              </thead>
              <tbody>
                {schemeRollup.map((s) => (
                  <tr key={s.scheme}>
                    <td>
                      <strong>{SCHEME_META[s.scheme].shortLabel}</strong>
                      <br />
                      <span className="subtle">{SCHEME_META[s.scheme].node}</span>
                    </td>
                    <td className="num">{s.centres}</td>
                    <td className="num">{s.claimed}</td>
                    <td className="num is-ok">{s.physical}</td>
                    <td className="num is-critical">{s.ghosts}</td>
                    <td className="num is-critical">{s.deficitUnits}</td>
                    <td className="num">{s.avgScore}</td>
                    <td className="num is-critical">{formatINR(s.leakage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="recovery-block">
            <div className="recovery-block__gauge">
              <Gauge value={kpi.resolvedCompliancePct} size={150} thickness={14} caption="Resolved" subCaption="post-notice compliance" />
            </div>
            <div className="recovery-block__series">
              <h4>Leakage prevented — month-on-month trajectory (₹ lakh)</h4>
              <div className="recovery-bars">
                {recoverySeries.map((v, i) => (
                  <div key={i} className="recovery-bar" title={`₹${v} lakh prevented`}>
                    <span style={{ height: `${(v / Math.max(...recoverySeries)) * 100}%` }} />
                    <em>{v}</em>
                  </div>
                ))}
              </div>
              <p>
                Deploying KausalyaDrishti edge nodes across {districtSummary.edgeNodesDeployed} centres lifted verified attendance compliance
                from 61% to {kpi.resolvedCompliancePct}% inside two quarters, without a single rupee of additional field-officer travel.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      {/* ------------------------- ENFORCEMENT LEDGER ------------------------- */}
      <Panel
        title="Enforcement Ledger"
        subtitle="Every automated action is signed by the competent authority and mirrored to the SDMS audit log"
        icon="⚖️"
      >
        <div className="table-wrap">
          <table className="table table--compact">
            <thead>
              <tr>
                <th>Order reference</th>
                <th>Centre</th>
                <th>Action</th>
                <th>Issuing authority</th>
                <th>Issued on</th>
                <th>Status</th>
                <th className="num">SLA (days)</th>
                <th className="num">Amount at risk</th>
              </tr>
            </thead>
            <tbody>
              {enforcementHistory.map((e) => {
                const c = allCentres.find((x) => x.id === e.centreId);
                return (
                  <tr key={e.id}>
                    <td className="mono">{e.id}</td>
                    <td>{c ? c.name : e.centreId}</td>
                    <td>
                      <span className={`action-tag action-tag--${e.action === 'GRANT_FREEZE' ? 'red' : e.action === 'SHOW_CAUSE_NOTICE' ? 'amber' : 'blue'}`}>
                        {e.action === 'SHOW_CAUSE_NOTICE' ? '📄 Show-Cause Notice' : e.action === 'GRANT_FREEZE' ? '🚫 Grant Freeze' : '📅 Surprise Audit'}
                      </span>
                    </td>
                    <td>{e.authority}</td>
                    <td>{new Date(e.issuedOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>{e.status}</td>
                    <td className="num">{e.slaDays}</td>
                    <td className="num is-critical">{formatINR(e.amountAtRisk)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7}>
                  <strong>Total value under active enforcement</strong>
                </td>
                <td className="num">
                  <strong className="is-critical">{formatINR(enforcementHistory.reduce((s, e) => s + e.amountAtRisk, 0))}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}
