// Sanity harness for the KausalyaDrishti rule + telemetry engines.
import { trainingCentres, getCentreById, formatINR, SCHEME_META } from './src/data/centerMockData.js';
import {
  attendanceDiscrepancyRate, classifySeverity, ghostTraineeCount, leakageEstimate,
  infraComplianceScore, equipmentRollup, buildCentreReport, buildBatchVerification,
  buildTickerItems, buildKpiSummary, buildDistrictReport, enforcementEligibility, parseActiveHours,
} from './src/services/complianceRules.js';
import { buildEdgePacket, computeBandwidthComparison, linkFeasibility, generateShowCauseNotice, stringifyPacket } from './src/services/edgeTelemetry.js';
import { noticeTemplate, connectivityProfiles } from './src/data/centerMockData.js';
import { createScene, renderSceneFrame } from './src/services/edgePersonEngine.js';

const centre = getCentreById('KA-TUM-0417');
const batch = centre.batches[0];
const v = buildBatchVerification(batch, centre);

console.log('--- FLAGSHIP BATCH (PS 26245 reference numbers) ---');
console.log('batch              :', batch.batchId);
console.log('N_reg/N_portal/N_ai:', batch.sanctionedStrength, batch.portalReported, batch.aiPhysical);
console.log('D_att              :', v.discrepancy, '% ->', v.severity.band, v.severity.verdict);
console.log('ghost trainees     :', v.ghosts);
console.log('leakage            :', formatINR(v.leakage));
console.log('report id          :', v.reportId);

console.log('\n--- SEVERITY MATRIX ---');
[0, 10, 14.9, 15, 40, 40.1, 71.43].forEach((d) => {
  const s = classifySeverity(d);
  console.log(`D_att=${String(d).padEnd(6)} -> ${s.emoji} ${s.label}`);
});

console.log('\n--- INFRASTRUCTURE ---');
const roll = equipmentRollup(centre.equipment);
console.log('C_infra            :', roll.score, '% |', roll.detectedUnits, '/', roll.sanctionedUnits, 'units | deficit', roll.deficitUnits);
console.log('value at risk      :', formatINR(roll.valueAtRisk), '| safety breach:', roll.safetyBreach);
roll.rows.forEach((r) => console.log(`  ${r.item.slice(0, 44).padEnd(46)} ${r.sanctionedQty} sanctioned / ${r.detectedQty} detected -> ${r.status} (${r.itemScore}%)`));

console.log('\n--- ACTIVE HOURS PARSER ---');
console.log(parseActiveHours('09:00 AM - 01:00 PM'), parseActiveHours('02:00 PM - 06:00 PM'));

console.log('\n--- CENTRE REPORT ---');
const cr = buildCentreReport(centre);
console.log('compliance score   :', cr.complianceScore, '| attendance integrity', cr.attendanceIntegrity, '% | risk', cr.risk.band);
console.log('claimed/physical   :', cr.totalClaimed, '/', cr.totalPhysical, '| ghosts', cr.totalGhosts, '| leakage', formatINR(cr.totalLeakage));
console.log('eligibility        :', enforcementEligibility(cr));

console.log('\n--- TICKER ---');
buildTickerItems(trainingCentres).slice(0, 3).forEach((t) => console.log(` [${t.level}] ${t.text}`));

console.log('\n--- BANDWIDTH ---');
const cmp = computeBandwidthComparison({ hours: 1, keyframes: 3 });
console.log('legacy:', cmp.legacyMB, 'MB/h | edge:', cmp.edgeKB, 'KB/h | savings:', cmp.savingsPct, '% | ratio', cmp.ratio.toFixed(0) + 'x');
const pkt = buildEdgePacket(cr, 0, new Date('2026-10-04T10:16:00+05:30'), connectivityProfiles[0]);
console.log('edge packet size   :', pkt.packetSizeKB, 'KB | keyframes', pkt.evidence.keyframesCaptured, '| biometric templates', pkt.privacy.biometricTemplatesStored);
console.log('packet JSON bytes  :', stringifyPacket(pkt).length, 'chars (pretty-printed)');
connectivityProfiles.forEach((p) => {
  const f = linkFeasibility(p, 3);
  console.log(`  ${p.id.toUpperCase()}: upload ${f.uploadSeconds}s within cadence=${f.withinCadence} | legacy needs ${f.legacyUploadHours}h`);
});

console.log('\n--- DISTRICT KPI ---');
const dr = buildDistrictReport(trainingCentres);
console.log(buildKpiSummary(dr, trainingCentres));
console.log('district:', { flagged: dr.flaggedCentres, critical: dr.criticalCentres, avgCompliance: dr.avgCompliance, avgInfra: dr.avgInfraScore, exposure: formatINR(dr.totalLeakage) });

console.log('\n--- SCENE GEOMETRY CONSISTENCY (headcount must equal data) ---');
trainingCentres.forEach((c) => {
  c.batches.forEach((b) => {
    const eq = c.equipment[0];
    const w = parseActiveHours(b.activeHours);
    const scene = createScene({
      occupancy: b.aiPhysical / b.sanctionedStrength,
      roster: b.sanctionedStrength,
      machines: eq.detectedQty,
      sanctionedMachines: eq.sanctionedQty,
      now: new Date('2026-10-04T10:15:00+05:30'),
      hourStart: Math.floor(w.startMinutes / 60),
      hourEnd: Math.floor(w.endMinutes / 60),
      seed: `${c.id}-${b.batchId}`,
    });
    const ok = scene.trainees.length === b.aiPhysical && scene.machines.length === eq.detectedQty && scene.emptySeats.length === b.sanctionedStrength - b.aiPhysical;
    console.log(
      `${ok ? 'OK ' : 'BAD'} ${b.batchId.padEnd(30)} headcount ${scene.trainees.length}/${b.aiPhysical}  machines ${scene.machines.length}/${eq.detectedQty}  emptySeats ${scene.emptySeats.length}`
    );
  });
});

console.log('\n--- NOTICE GENERATION ---');
const notice = generateShowCauseNotice(cr, { template: noticeTemplate, eligibility: enforcementEligibility(cr), now: new Date('2026-10-04T11:00:00+05:30') });
console.log('ref:', notice.ref, '| reply by:', notice.replyByLabel, '| chars:', notice.body.length);
console.log(notice.body.split('\n').slice(0, 12).join('\n'));
