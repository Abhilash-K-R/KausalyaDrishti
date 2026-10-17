/**
 * ============================================================================
 *  KausalyaDrishti — Compliance Rule Engine   (PS 26245 core intelligence)
 * ============================================================================
 *  Every number the inspector sees is derived here. The engine is deliberately
 *  a set of *pure functions* so that it can be unit-tested, replayed against
 *  historical SDMS ledgers and audited by MSDE without a running browser.
 *
 *  FORMULAE IMPLEMENTED
 *  --------------------
 *  1. Attendance discrepancy ratio
 *        D_att = ((N_portal − N_ai) / N_portal) × 100
 *
 *  2. Severity classification
 *        D_att > 40%        ➜ 🔴 RED     — Critical Fraud
 *        15% ≤ D_att ≤ 40%  ➜ 🟡 YELLOW  — Suspicious
 *        D_att < 15%        ➜ 🟢 GREEN   — Compliant
 *
 *  3. Infrastructure compliance score
 *        C_infra = (Σ detected quantity / Σ sanctioned quantity) × 100
 *
 *  4. Financial leakage
 *        Leakage = Ghost Trainees × ₹7,500  (PMKVY per-candidate stipend)
 *
 *  5. Equipment deficit & value at risk
 *        Deficit_qty = Σ max(0, sanctioned − detected)
 *        ValueAtRisk = Σ (deficit_qty × unit_cost)
 * ============================================================================
 */

import { STIPEND_PER_TRAINEE, districtSummary, nationalKpi, formatINR } from '../data/centerMockData.js';

export const STIPEND = STIPEND_PER_TRAINEE;

/* ---------------------------------------------------------------------------
 * 1. ATTENDANCE DISCREPANCY
 * ------------------------------------------------------------------------ */

/**
 * D_att = ((N_portal − N_ai) / N_portal) × 100
 * Negative values (AI sees MORE than claimed) are clamped to 0 — that is a
 * ledger under-report, not a ghost-trainee fraud.
 */
export function attendanceDiscrepancyRate(portalReported, aiPhysical) {
  const portal = Number(portalReported) || 0;
  const ai = Number(aiPhysical) || 0;
  if (portal <= 0) return 0;
  const ratio = ((portal - ai) / portal) * 100;
  return Math.max(0, Number(ratio.toFixed(2)));
}

/** 0–1 normalised ghost-trainee ratio (used for gauges / sparkline bars). */
export function discrepancyFraction(portalReported, aiPhysical) {
  return attendanceDiscrepancyRate(portalReported, aiPhysical) / 100;
}

export function ghostTraineeCount(portalReported, aiPhysical) {
  return Math.max(0, (Number(portalReported) || 0) - (Number(aiPhysical) || 0));
}

/**
 * Severity classification per the PS 26245 grading matrix.
 * @returns {{key:'red'|'amber'|'green', label:string, emoji:string, verdict:string,
 *            band:string, risk:string, color:string, description:string}}
 */
export function classifySeverity(discrepancyPct) {
  const d = Number(discrepancyPct) || 0;
  if (d > 40) {
    return {
      key: 'red',
      label: 'CRITICAL FRAUD',
      emoji: '🔴',
      band: 'RED',
      risk: 'Critical',
      verdict: 'CRITICAL FRAUD',
      color: '#e02424',
      description: 'Attendance ledger materially inflated. Automatic recovery + show-cause recommended.',
    };
  }
  if (d >= 15) {
    return {
      key: 'amber',
      label: 'SUSPICIOUS',
      emoji: '🟡',
      band: 'YELLOW',
      risk: 'Suspicious',
      verdict: 'SUSPICIOUS',
      color: '#d97706',
      description: 'Material variance — 7-day observation window and surprise audit advised.',
    };
  }
  return {
    key: 'green',
    label: 'COMPLIANT',
    emoji: '🟢',
    band: 'GREEN',
    risk: 'Low',
    verdict: 'COMPLIANT',
    color: '#138808',
    description: 'Variance inside statistical tolerance for biometric-gate + manual rosters.',
  };
}

/* ---------------------------------------------------------------------------
 * 2. INFRASTRUCTURE COMPLIANCE
 * ------------------------------------------------------------------------ */

/** C_infra = (Σ detected / Σ sanctioned) × 100 */
export function infraComplianceScore(equipment = []) {
  const sanctioned = equipment.reduce((s, e) => s + (Number(e.sanctionedQty) || 0), 0);
  const detected = equipment.reduce((s, e) => s + (Number(e.detectedQty) || 0), 0);
  if (sanctioned <= 0) return 100;
  return Number(((detected / sanctioned) * 100).toFixed(1));
}

export function equipmentDeficit(equipment = []) {
  return equipment.map((e) => {
    const sanctioned = Number(e.sanctionedQty) || 0;
    const detected = Number(e.detectedQty) || 0;
    const missing = Math.max(0, sanctioned - detected);
    const ratio = sanctioned > 0 ? (detected / sanctioned) * 100 : 100;
    const itemScore = Number(ratio.toFixed(1));
    return {
      ...e,
      missing,
      itemScore,
      status: missing === 0 ? 'Compliant' : 'Deficit',
      severity: missing === 0 ? 'green' : itemScore >= 60 ? 'amber' : 'red',
      criticalMissing: Boolean(e.critical) && missing > 0,
      valueAtRisk: missing * (Number(e.unitCost) || 0),
      detectedValue: detected * (Number(e.unitCost) || 0),
      sanctionedValue: sanctioned * (Number(e.unitCost) || 0),
    };
  });
}

export function equipmentRollup(equipment = []) {
  const rows = equipmentDeficit(equipment);
  const sanctionedUnits = rows.reduce((s, r) => s + r.sanctionedQty, 0);
  const detectedUnits = rows.reduce((s, r) => s + r.detectedQty, 0);
  const deficitUnits = rows.reduce((s, r) => s + r.missing, 0);
  const valueAtRisk = rows.reduce((s, r) => s + r.valueAtRisk, 0);
  const sanctionedValue = rows.reduce((s, r) => s + r.sanctionedValue, 0);
  return {
    rows,
    sanctionedUnits,
    detectedUnits,
    deficitUnits,
    valueAtRisk,
    sanctionedValue,
    score: infraComplianceScore(equipment),
    deficitItems: rows.filter((r) => r.missing > 0).length,
    criticalMissing: rows.filter((r) => r.criticalMissing),
    compliantItems: rows.filter((r) => r.missing === 0).length,
    safetyBreach: rows.some((r) => r.criticalMissing && /fire|extinguisher|safety/i.test(r.item)),
  };
}

export function infraSeverity(score) {
  if (score >= 90) return classifySeverity(0);
  if (score >= 75) {
    return { key: 'amber', label: 'MINOR DEFICIT', emoji: '🟡', band: 'YELLOW', risk: 'Moderate', verdict: 'MINOR DEFICIT', color: '#d97706', description: 'Infrastructure largely present with repairable shortfalls.' };
  }
  if (score >= 60) {
    return { key: 'amber', label: 'NON-COMPLIANT', emoji: '🟠', band: 'ORANGE', risk: 'High', verdict: 'NON-COMPLIANT', color: '#ea580c', description: 'Material equipment missing — training quality and safety impacted.' };
  }
  return { key: 'red', label: 'CRITICAL DEFICIT', emoji: '🔴', band: 'RED', risk: 'Critical', verdict: 'CRITICAL DEFICIT', color: '#e02424', description: 'Training centre cannot legally deliver this batch with current assets.' };
}

/* ---------------------------------------------------------------------------
 * 3. FINANCIAL LEAKAGE
 * ------------------------------------------------------------------------ */

export function leakageEstimate(ghostTrainees, perTraineeCost = STIPEND) {
  const ghosts = Math.max(0, Number(ghostTrainees) || 0);
  const rate = Number(perTraineeCost) || STIPEND;
  return {
    ghosts,
    perTraineeCost: rate,
    amount: ghosts * rate,
    annualised: ghosts * rate * 12,
  };
}

/* ---------------------------------------------------------------------------
 * 4. FULL PER-BATCH VERIFICATION REPORT
 * ------------------------------------------------------------------------ */

/**
 * Produces the canonical verification record for a single batch.
 * This is what renders on `<AttendanceDiscrepancyCard />` and what is sliced
 * out for the 5 KB edge packet transmitted to MSDE.
 */
export function buildBatchVerification(batch, centre, now = new Date()) {
  const discrepancy = attendanceDiscrepancyRate(batch.portalReported, batch.aiPhysical);
  const severity = classifySeverity(discrepancy);
  const ghosts = ghostTraineeCount(batch.portalReported, batch.aiPhysical);
  const perTraineeCost = (centre && centre.classroom && centre.classroom.perTraineeCost) || STIPEND;
  const leak = leakageEstimate(ghosts, perTraineeCost);
  const withinBatchWindow = isWithinBatchWindow(batch, now);
  const confidencePct = Number(((batch.aiConfidence || 0.9) * 100).toFixed(1));

  return {
    batchId: batch.batchId,
    course: batch.course,
    qpCode: batch.qpCode,
    trade: batch.trade,
    trainer: batch.trainer,
    trainerPortalPresent: batch.trainerPortalPresent,
    activeHours: batch.activeHours,
    startDate: batch.startDate,
    endDate: batch.endDate,
    centreId: centre.id,
    centreName: centre.name,
    district: centre.district,
    scheme: centre.scheme,
    sanctionedStrength: batch.sanctionedStrength,
    portalReported: batch.portalReported,
    aiPhysical: batch.aiPhysical,
    aiConfidence: confidencePct,
    discrepancy,
    severity,
    ghosts,
    perTraineeCost,
    leakage: leak.amount,
    leakageAnnualised: leak.annualised,
    occupancyPct: batch.sanctionedStrength > 0 ? Number(((batch.aiPhysical / batch.sanctionedStrength) * 100).toFixed(1)) : 0,
    activeHoursCompliant: withinBatchWindow,
    isWithinBatchWindow: withinBatchWindow,
    verificationEpochs: withinBatchWindow ? 3 : 6,
    reportId: `KD/VER/${centre.id.split('-').slice(-2).join('')}/${batch.batchId.split('/').pop()}/${stamp(now)}`,
    generatedAt: now.toISOString(),
  };
}

/** True when `now` falls inside the batch's declared active-hours window. */
export function isWithinBatchWindow(batch, now = new Date()) {
  const parsed = parseActiveHours(batch && batch.activeHours);
  if (!parsed) return false;
  const localMinutes = now.getHours() * 60 + now.getMinutes();
  return localMinutes >= parsed.startMinutes && localMinutes <= parsed.endMinutes;
}

/** "09:00 AM - 01:00 PM" ➜ {startMinutes: 540, endMinutes: 780, ...} */
export function parseActiveHours(label) {
  if (!label || typeof label !== 'string') return null;
  const parts = label.split(/\s*[-–]\s*/);
  if (parts.length !== 2) return null;
  const start = toMinutes(parts[0]);
  const end = toMinutes(parts[1]);
  if (start == null || end == null) return null;
  return {
    startMinutes: start,
    endMinutes: end,
    startLabel: parts[0].trim(),
    endLabel: parts[1].trim(),
    durationHours: Number(((end - start) / 60).toFixed(1)),
  };
}

function toMinutes(token) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(String(token).trim());
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const mer = m[3] ? m[3].toUpperCase() : null;
  if (mer === 'PM' && hh !== 12) hh += 12;
  if (mer === 'AM' && hh === 12) hh = 0;
  return hh * 60 + mm;
}

function stamp(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}${m}${date.getFullYear()}`;
}

/* ---------------------------------------------------------------------------
 * 5. CENTRE-LEVEL & DISTRICT-LEVEL AGGREGATION
 * ------------------------------------------------------------------------ */

export function buildCentreReport(centre, now = new Date()) {
  const verifications = centre.batches.map((b) => buildBatchVerification(b, centre, now));
  const infra = equipmentRollup(centre.equipment);
  const worst = verifications.reduce(
    (acc, v) => (v.discrepancy > acc.discrepancy ? v : acc),
    verifications[0]
  );
  const totalClaimed = verifications.reduce((s, v) => s + v.portalReported, 0);
  const totalPhysical = verifications.reduce((s, v) => s + v.aiPhysical, 0);
  const totalGhosts = verifications.reduce((s, v) => s + v.ghosts, 0);
  const totalLeakage = verifications.reduce((s, v) => s + v.leakage, 0);
  const criticalBatches = verifications.filter((v) => v.severity.key === 'red').length;
  const suspiciousBatches = verifications.filter((v) => v.severity.key === 'amber').length;
  const safetyFlag = infra.safetyBreach;
  const safetyPenalty = safetyFlag ? 12 : 0;

  // Composite centre compliance score (0-100):
  //   55% attendance integrity + 45% infrastructure, minus a safety cap penalty.
  const attendanceIntegrity = totalClaimed > 0 ? (totalPhysical / totalClaimed) * 100 : 100;
  const composite = Math.max(0, Math.min(100, attendanceIntegrity * 0.55 + infra.score * 0.45 - safetyPenalty));
  const complianceScore = Number(composite.toFixed(1));
  const risk = classifySeverity(worst.discrepancy);
  const infraRisk = infraSeverity(infra.score);

  return {
    centreId: centre.id,
    centreName: centre.name,
    kannadaName: centre.kannadaName,
    district: centre.district,
    taluk: centre.taluk,
    scheme: centre.scheme,
    tcStatus: centre.tcStatus,
    spoc: centre.spoc,
    geo: centre.geo,
    lastAuditOn: centre.lastAuditOn,
    lastAuditType: centre.lastAuditType,
    verifications,
    infra,
    worst,
    totalClaimed,
    totalPhysical,
    totalGhosts,
    totalLeakage,
    overallDiscrepancy: attendanceDiscrepancyRate(totalClaimed, totalPhysical),
    criticalBatches,
    suspiciousBatches,
    compliantBatches: verifications.length - criticalBatches - suspiciousBatches,
    attendanceIntegrity: Number(attendanceIntegrity.toFixed(1)),
    complianceScore,
    risk,
    infraRisk,
    safetyFlag,
    safetyPenalty,
    batchCount: centre.batches.length,
    gpsDriftMeters: computeGpsDrift(centre.id),
  };
}

/** Deterministic pseudo-random GPS jitter so the console looks alive but stable. */
function computeGpsDrift(id) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 997;
  return Number((h / 997 * 6.4).toFixed(1));
}

export function buildDistrictReport(centres, now = new Date()) {
  const reports = centres.map((c) => buildCentreReport(c, now));
  const totalClaimed = reports.reduce((s, r) => s + r.totalClaimed, 0);
  const totalPhysical = reports.reduce((s, r) => s + r.totalPhysical, 0);
  const totalLeakage = reports.reduce((s, r) => s + r.totalLeakage, 0);
  const flagged = reports.filter((r) => r.risk.key !== 'green' || r.safetyFlag);
  return {
    reports,
    totalClaimed,
    totalPhysical,
    totalLeakage,
    flaggedCentres: flagged.length,
    criticalCentres: reports.filter((r) => r.risk.key === 'red').length,
    avgCompliance: Number((reports.reduce((s, r) => s + r.complianceScore, 0) / Math.max(1, reports.length)).toFixed(1)),
    avgInfraScore: Number((reports.reduce((s, r) => s + r.infra.score, 0) / Math.max(1, reports.length)).toFixed(1)),
    flagged,
  };
}

/* ---------------------------------------------------------------------------
 * 6. ALERT TICKER BUILDER (drives the Navbar marquee)
 * ------------------------------------------------------------------------ */

export function buildTickerItems(centres, now = new Date()) {
  const items = [];
  centres.forEach((centre) => {
    centre.batches.forEach((batch) => {
      const v = buildBatchVerification(batch, centre, now);
      if (v.severity.key === 'red') {
        items.push({
          id: `TK-${v.batchId}`,
          level: 'critical',
          text: `${v.ghosts} Ghost Trainees detected in Batch ${batch.batchId.split('/').pop()} (${centre.name}) — ${v.discrepancy.toFixed(1)}% shortfall, ${formatINR(v.leakage)} at risk`,
          centreId: centre.id,
        });
      } else if (v.severity.key === 'amber') {
        items.push({
          id: `TK-${v.batchId}`,
          level: 'warning',
          text: `${v.ghosts} aspirants unaccounted in Batch ${batch.batchId.split('/').pop()} (${centre.name}) — ${v.discrepancy.toFixed(1)}% variance under observation`,
          centreId: centre.id,
        });
      }
    });
    const infra = equipmentRollup(centre.equipment);
    if (infra.deficitUnits > 0) {
      items.push({
        id: `TK-INFRA-${centre.id}`,
        level: infra.criticalMissing.length ? 'critical' : 'warning',
        text: `${infra.deficitUnits} sanctioned asset(s) physically absent at ${centre.name} — infra score ${infra.score}%`,
        centreId: centre.id,
      });
    }
  });
  if (!items.some((i) => i.level === 'info')) {
    items.push({
      id: 'TK-INFO-BW',
      level: 'info',
      text: 'Edge telemetry operating at 99.8% bandwidth savings — 5 KB / 15 min metadata packets, zero facial biometrics stored (DPDP Act 2023 compliant)',
      centreId: centres[0].id,
    });
  }
  return items;
}

/* ---------------------------------------------------------------------------
 * 7. KPI ROLL-UP (Ministry console cards)
 * ------------------------------------------------------------------------ */

export function buildKpiSummary(districtReport, centres) {
  const infraDeficits = districtReport.reports.reduce((s, r) => s + r.infra.deficitUnits, 0);
  return {
    monitoredCentres: districtSummary.totalEmpaneledCentres,
    activeBatches: districtSummary.activeBatches,
    ghostAlerts: districtSummary.fraudFlags,
    preventedLeakage: districtSummary.preventedLeakage,
    liveCentres: centres.length,
    liveFlaggedCentres: districtReport.flaggedCentres,
    infraDeficits,
    nationalGhostAlerts: nationalKpi.ghostAlertsThisMonth,
    blockedLeakageNational: nationalKpi.blockedLeakageThisMonth,
    edgeNodes: districtSummary.edgeNodesDeployed,
    avgDetectionLatencyMs: districtSummary.avgDetectionLatencyMs,
    avgEdgeUptimePct: districtSummary.avgEdgeUptimePct,
  };
}

/* ---------------------------------------------------------------------------
 * 8. ENFORCEMENT ELIGIBILITY GATE
 * ------------------------------------------------------------------------ */

export function enforcementEligibility(report) {
  const redAttendance = report.risk.key === 'red';
  const safety = report.safetyFlag;
  const infraCritical = report.infra.score < 60;
  const freezeEligible = redAttendance && (report.totalLeakage >= 100000 || safety || infraCritical);
  return {
    noticeEligible: redAttendance || safety,
    freezeEligible,
    auditEligible: report.risk.key !== 'green' || safety || infraCritical,
    reasons: [
      redAttendance ? `Attendance shortfall ${report.overallDiscrepancy.toFixed(1)}% (>40% critical band)` : null,
      safety ? 'Critical safety equipment missing on premises' : null,
      infraCritical ? `Infrastructure compliance ${report.infra.score}% (<60%)` : null,
    ].filter(Boolean),
  };
}
