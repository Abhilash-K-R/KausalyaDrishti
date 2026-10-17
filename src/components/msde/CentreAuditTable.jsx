import React, { useMemo, useState } from 'react';
import { formatINR, SCHEME_META } from '../../data/centerMockData.js';
import { enforcementEligibility, buildDistrictReport } from '../../services/complianceRules.js';
import { Panel, SeverityBadge, ProgressRing, Bar } from '../common/Ui.jsx';

/**
 * CentreAuditTable
 * ---------------------------------------------------------------------------
 * The leaderboard of every training centre visible to the Ministry, with
 * compliance scores (0-100%), fraud-risk badges and one-click enforcement:
 *   [📄 Generate Show-Cause Notice]
 *   [🚫 Freeze PMKVY Grant Disbursement]
 *   [📅 Order Surprise Physical Audit]
 *
 * Enforcement eligibility is gated by the rule engine so an officer cannot
 * freeze a compliant centre by accident.
 */
export default function CentreAuditTable({ allCentres, selectedCentreId, onSelectCentre, onEnforce, pushToast }) {
  const [sortKey, setSortKey] = useState('score');
  const [sortAsc, setSortAsc] = useState(true);
  const [districtFilter, setDistrictFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const rows = useMemo(() => {
    const district = buildDistrictReport(allCentres);
    return district.reports.map((r) => ({
      ...r,
      raw: allCentres.find((c) => c.id === r.centreId),
      eligibility: enforcementEligibility(r),
    }));
  }, [allCentres]);

  const filtered = useMemo(() => {
    let out = rows;
    if (districtFilter !== 'all') out = out.filter((r) => r.district === districtFilter);
    if (severityFilter !== 'all') out = out.filter((r) => r.risk.key === severityFilter || (severityFilter === 'safety' && r.safetyFlag));
    const dir = sortAsc ? 1 : -1;
    return [...out].sort((a, b) => {
      switch (sortKey) {
        case 'claimed':
          return (a.totalClaimed - b.totalClaimed) * dir;
        case 'physical':
          return (a.totalPhysical - b.totalPhysical) * dir;
        case 'ghosts':
          return (a.totalGhosts - b.totalGhosts) * dir;
        case 'infra':
          return (a.infra.score - b.infra.score) * dir;
        case 'exposure':
          return (a.totalLeakage - b.totalLeakage) * dir;
        case 'name':
          return a.centreName.localeCompare(b.centreName) * dir;
        case 'score':
        default:
          return (a.complianceScore - b.complianceScore) * dir;
      }
    });
  }, [rows, sortKey, sortAsc, districtFilter, severityFilter]);

  const districts = Array.from(new Set(rows.map((r) => r.district)));

  const th = (key, label, numeric = false) => (
    <th
      className={numeric ? 'num th-sortable' : 'th-sortable'}
      onClick={() => {
        if (sortKey === key) setSortAsc((a) => !a);
        else {
          setSortKey(key);
          setSortAsc(true);
        }
      }}
    >
      {label} {sortKey === key ? (sortAsc ? '▲' : '▼') : '↕'}
    </th>
  );

  return (
    <Panel
      title="Training Centre Leaderboard — Compliance & Fraud Risk"
      subtitle={`${filtered.length} of ${rows.length} instrumented centres · sorted by ${
        { score: 'compliance score', claimed: 'claimed attendance', physical: 'AI physical headcount', ghosts: 'ghost trainees', infra: 'infrastructure score', exposure: 'financial exposure', name: 'centre name' }[sortKey]
      } (${sortAsc ? 'ascending' : 'descending'})`}
      icon="🏆"
      actions={
        <div className="filters">
          <label className="field field--inline">
            <span>District</span>
            <select className="select" value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)}>
              <option value="all">All districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="field field--inline">
            <span>Risk</span>
            <select className="select" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
              <option value="all">All bands</option>
              <option value="red">🔴 Critical fraud</option>
              <option value="amber">🟡 Suspicious</option>
              <option value="green">🟢 Compliant</option>
              <option value="safety">🔥 Safety breach</option>
            </select>
          </label>
        </div>
      }
    >
      <div className="table-wrap">
        <table className="table table--leaderboard">
          <thead>
            <tr>
              <th>Rank</th>
              {th('name', 'Training centre')}
              <th>District / taluk</th>
              <th>Scheme</th>
              <th>TC status</th>
              {th('claimed', 'Claimed', true)}
              {th('physical', 'AI physical', true)}
              {th('ghosts', 'Ghosts', true)}
              {th('infra', 'C_infra', true)}
              {th('score', 'Score', true)}
              {th('exposure', 'Exposure', true)}
              <th>Risk</th>
              <th>Enforcement actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr
                key={r.centreId}
                className={`${r.centreId === selectedCentreId ? 'is-highlight' : ''} ${r.risk.key === 'red' ? 'row--deficit' : r.risk.key === 'amber' ? 'row--warn' : 'row--ok'}`}
                onClick={() => onSelectCentre && onSelectCentre(r.centreId)}
              >
                <td>
                  <span className={`rank rank--${i < 3 ? 'top' : 'std'}`}>{i + 1}</span>
                </td>
                <td>
                  <strong>{r.centreName}</strong>
                  <br />
                  <span className="mono subtle">{r.centreId}</span>
                  {r.safetyFlag && <span className="inline-flag">🔥 safety breach</span>}
                </td>
                <td>
                  {r.district}
                  <br />
                  <span className="subtle">{r.taluk}</span>
                </td>
                <td>{SCHEME_META[r.scheme].shortLabel}</td>
                <td>
                  <span className={`tc-status ${r.tcStatus === 'Active' ? 'is-ok' : 'is-warn'}`}>{r.tcStatus}</span>
                </td>
                <td className="num">{r.totalClaimed}</td>
                <td className="num">
                  <strong className={r.totalPhysical < r.totalClaimed ? 'is-critical' : 'is-ok'}>{r.totalPhysical}</strong>
                </td>
                <td className="num">
                  {r.totalGhosts > 0 ? <span className="badge badge--red">{r.totalGhosts}</span> : <span className="badge badge--green">0</span>}
                </td>
                <td className="num">
                  <div className="inline-score">
                    <Bar value={r.infra.score} tone={r.infra.score >= 90 ? 'green' : r.infra.score >= 60 ? 'amber' : 'red'} height={6} />
                    <span>{r.infra.score}%</span>
                  </div>
                </td>
                <td className="num">
                  <div className="score-cell">
                    <ProgressRing value={r.complianceScore} size={40} />
                  </div>
                </td>
                <td className="num is-critical">{formatINR(r.totalLeakage)}</td>
                <td>
                  <SeverityBadge severity={r.risk} size="sm" showVerdict={false} />
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="action-row">
                    <button
                      type="button"
                      className="btn btn--warn btn--xs"
                      disabled={!r.eligibility.noticeEligible}
                      title={r.eligibility.noticeEligible ? 'Generate a digitally signed show-cause notice' : 'Not eligible — variance within tolerance'}
                      onClick={() => onEnforce(r.centreId, 'notice')}
                    >
                      📄 Show-Cause
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--xs"
                      disabled={!r.eligibility.freezeEligible}
                      title={
                        r.eligibility.freezeEligible
                          ? `Freeze ${formatINR(r.totalLeakage)} of PMKVY disbursement`
                          : 'Freeze gated: requires >40% shortfall together with material leakage / safety breach'
                      }
                      onClick={() => onEnforce(r.centreId, 'freeze')}
                    >
                      🚫 Freeze Grant
                    </button>
                    <button
                      type="button"
                      className="btn btn--primary btn--xs"
                      disabled={!r.eligibility.auditEligible}
                      title="Order a surprise physical audit within 48 hours"
                      onClick={() => onEnforce(r.centreId, 'audit')}
                    >
                      📅 Surprise Audit
                    </button>
                  </div>
                  {!r.eligibility.freezeEligible && (
                    <p className="action-why">Freeze gated: {r.eligibility.reasons.join(' · ') || 'no disqualifying finding'}</p>
                  )}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={13} className="empty-row">
                  No centres match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="leaderboard-notes">
        <div className="leaderboard-note leaderboard-note--red">
          <strong>🔴 Critical band (D_att &gt; 40%)</strong>
          <span>Automatic show-cause + recovery; grant freeze enabled when exposure ≥ ₹1,00,000 or a safety asset is missing.</span>
        </div>
        <div className="leaderboard-note leaderboard-note--amber">
          <strong>🟡 Suspicious band (15–40%)</strong>
          <span>7-day observation window with every epoch logged; surprise audit recommended before the next instalment.</span>
        </div>
        <div className="leaderboard-note leaderboard-note--green">
          <strong>🟢 Compliant band (&lt; 15%)</strong>
          <span>No action. Centre is eligible for the quarterly performance-linked incentive under PMKVY 4.0.</span>
        </div>
      </div>
    </Panel>
  );
}
