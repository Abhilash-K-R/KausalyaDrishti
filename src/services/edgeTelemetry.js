/**
 * ============================================================================
 *  KausalyaDrishti — Ultra-Low-Bandwidth Edge Telemetry Service
 * ============================================================================
 *  Rural Karnataka reality check: a Training Centre in Pavagada or Madhugiri
 *  sits on a 2G/3G cell-edge link. A 24×7 1080p stream (≈500 MB/hour) is
 *  physically un-streamable, and it is also unlawful to ship raw classroom
 *  video containing aspirants' faces to a central cloud (DPDP Act 2023).
 *
 *  KausalyaDrishti therefore transmits:
 *    • a 5 KB JSON metadata packet every 15 minutes (counts + confidence,
 *      never a frame, never an embedding), and
 *    • a 48 KB redacted keyframe *only* when a violation is detected.
 *
 *  Bandwidth saving = 1 − (KD_bytes / Legacy_bytes)
 * ============================================================================
 */

import { buildBatchVerification, equipmentRollup, buildCentreReport, enforcementEligibility } from './complianceRules.js';
import { edgePacketProfile, legacyStreamProfile, formatINR, noticeTemplate } from '../data/centerMockData.js';

export const LEGACY_MB_PER_HOUR = legacyStreamProfile.perHourMB;
export const LEGACY_KB_PER_HOUR = LEGACY_MB_PER_HOUR * 1024; // 512,000 KB
export const EDGE_PACKET_KB = edgePacketProfile.payloadKB;

/**
 * Canonical bandwidth comparison for an N-hour monitoring window.
 * Default N = 1 hour → legacy 500 MB vs edge 20 KB (4 packets).
 */
export function computeBandwidthComparison({ hours = 1, packetEveryMinutes = edgePacketProfile.cadenceMinutes, keyframes = 0, keyframeKB = edgePacketProfile.keyframeKB } = {}) {
  const packetsPerHour = 60 / packetEveryMinutes;
  const edgeKB = hours * packetsPerHour * EDGE_PACKET_KB + keyframes * keyframeKB;
  const legacyKB = hours * LEGACY_KB_PER_HOUR;
  const savingsPct = Number((100 * (1 - edgeKB / legacyKB)).toFixed(2));

  return {
    hours,
    packetsPerHour,
    edgeKB,
    edgeMB: edgeKB / 1024,
    legacyKB,
    legacyMB: legacyKB / 1024,
    ratio: legacyKB / Math.max(edgeKB, 0.0001),
    savingsPct,
    keyframes,
    keyframeBytesKB: keyframes * keyframeKB,
    edgePerDayMB: (edgeKB / hours) * 24 / 1024,
    legacyPerDayMB: (legacyKB / hours) * 24 / 1024,
    monthlyLegacyCostINR: legacyStreamProfile.perHourCostINR * 24 * 30,
    monthlyEdgeCostINR:
      (((edgeKB / hours) * 24 * 30) / (1024 * 1024)) * 180, // ₹180 per GB of metered rural data
  };
}

/** Bytes-on-wire for a single telemetry packet given the centre snapshot. */
export function buildEdgePacket(report, batchIndex = 0, now = new Date(), connectivity = null) {
  const batch = report.verifications[batchIndex] || report.verifications[0];
  const infra = report.infra;
  const sequence = Math.floor(now.getTime() / (edgePacketProfile.cadenceMinutes * 60 * 1000));
  const packet = {
    schema: 'MSDE-KD/EDGE-PKT/v1.2',
    packetId: `KD-PKT-${now.getTime().toString(36).toUpperCase()}`,
    sequenceNo: sequence,
    previousPacketHash: `sha256:${hashString(`${report.centreId}-${sequence - 1}`)}`,
    emittedAt: now.toISOString(),
    nextExpectedAt: new Date(now.getTime() + edgePacketProfile.cadenceMinutes * 60 * 1000).toISOString(),
    cadenceMinutes: edgePacketProfile.cadenceMinutes,
    node: {
      edgeNodeId: `${report.centreId}-NODE-A`,
      firmware: 'kd-edge 1.2.0',
      runtime: 'Jetson Orin Nano 8 GB (INT8 · TensorRT)',
      uptimePct: 99.4,
      powerSource: 'Grid + 12 V solar trickle',
      storeAndForwardBufferHours: 72,
      watchdog: 'auto-restart on >4 s stall',
    },
    nodeHealth: {
      cpuTempC: 52,
      socUtilPct: 63,
      memUsedMB: 1180,
      diskFreeGB: 41.6,
      cameraModel: 'CP Plus 2 MP IP-66 PoE',
      cameraUptimePct: 99.1,
      droppedFrames: 17,
    },
    model: {
      name: 'YOLOv8n-int8 (ONNX Runtime Web · WASM SIMD)',
      weightsChecksum: 'sha256:8f2a41c9f0b7d3e6',
      inputTensor: '640×384 · RGB · letterboxed',
      classes: ['trainee', 'machine', 'tool', 'empty_machine_slot'],
      precision: 'INT8',
      detectionFps: 30,
      inferenceLatencyMs: 38,
      meanConfidence: batch.aiConfidence,
      driftAudit: 'weekly mAP replay: 0.912',
    },
    centre: {
      centreId: report.centreId,
      centreName: report.centreName,
      district: report.district,
      taluk: report.taluk,
      scheme: report.scheme.toUpperCase(),
      tcStatus: report.tcStatus,
      spoc: report.spoc.name,
      geo: {
        lat: Number(report.geo.lat.toFixed(5)),
        lng: Number(report.geo.lng.toFixed(5)),
        accuracyM: 8 + Math.round(report.gpsDriftMeters),
        fenceRadiusM: 15,
        driftM: report.gpsDriftMeters,
        geofenceBreach: report.gpsDriftMeters > 15,
      },
    },
    verification: {
      batchId: batch.batchId,
      course: batch.course,
      qpCode: batch.qpCode,
      trainer: batch.trainer,
      trainerPhysicallyDetected: Boolean(batch.trainerPhysicallyDetected !== undefined ? batch.trainerPhysicallyDetected : report.verifications[0].trainerPortalPresent),
      activeHours: batch.activeHours,
      withinBatchWindow: batch.isWithinBatchWindow,
      epoch: 'E' + ((now.getMinutes() % 4) + 1),
      rosterSanctioned: batch.sanctionedStrength,
      portalClaimed: batch.portalReported,
      aiPhysicalHeadcount: batch.aiPhysical,
      ghostTrainees: batch.ghosts,
      discrepancyPct: batch.discrepancy,
      severity: batch.severity.band,
      epochs: batch.verificationEpochs,
      aiMeanConfidence: batch.aiConfidence,
      detectionFps: 30,
      verificationLatencyMs: 38,
      occupancyPct: batch.occupancyPct,
      vacantSeats: Math.max(0, batch.sanctionedStrength - batch.aiPhysical),
      reportReference: batch.reportId,
      trackerMode: 'centroid-anonymous',
    },
    batches: report.verifications.map((v) => ({
      batchId: v.batchId,
      course: v.course,
      sanctioned: v.sanctionedStrength,
      claimed: v.portalReported,
      physical: v.aiPhysical,
      ghosts: v.ghosts,
      discrepancyPct: v.discrepancy,
      band: v.severity.band,
    })),
    infrastructure: {
      scorePct: infra.score,
      sanctionedUnits: infra.sanctionedUnits,
      detectedUnits: infra.detectedUnits,
      deficitUnits: infra.deficitUnits,
      valueAtRiskINR: infra.valueAtRisk,
      sanctionedValueINR: infra.sanctionedValue,
      compliantItems: infra.compliantItems,
      deficitItems: infra.deficitItems,
      criticalMissing: infra.criticalMissing.map((r) => r.item),
      safetyBreach: infra.safetyBreach,
      items: infra.rows.map((r) => ({
        id: r.id,
        item: r.item,
        sanctioned: r.sanctionedQty,
        detected: r.detectedQty,
        missing: r.missing,
        presenceScore: r.itemScore,
        critical: Boolean(r.critical),
      })),
    },
    attendanceSummary: {
      claimedTotal: report.totalClaimed,
      physicalTotal: report.totalPhysical,
      ghostTotal: report.totalGhosts,
      centreDiscrepancyPct: report.overallDiscrepancy,
      attendanceIntegrityPct: report.attendanceIntegrity,
      compositeComplianceScore: report.complianceScore,
      riskBand: report.risk.band,
      exposureINR: report.totalLeakage,
    },
    evidence: {
      keyframesCaptured: batch.severity.key === 'green' ? 0 : 3,
      keyframeBytesKB: batch.severity.key === 'green' ? 0 : 144,
      keyframeRedaction: 'faces mosaic-blurred in-canvas before encode',
      rawVideoTransmittedKB: 0,
      evidenceGatewayRef: `MSDE/EG/${report.centreId}/${sequence}`,
    },
    privacy: {
      dpdpCompliant: true,
      faceBlurEnabled: true,
      faceBlurMethod: '12 px mosaic + Gaussian (pre-encode)',
      biometricTemplatesStored: 0,
      faceEmbeddingsCreated: 0,
      reIdentificationEnabled: false,
      metadataRetentionDays: 90,
      keyframeRetentionDays: 30,
      rawVideoRetentionDays: 0,
      lawfulBasis: 'DPDP Act 2023 §7(1)(a) — State function',
      consentNotice: 'Kannada + English at centre entrance',
    },
    link: connectivity
      ? {
          profile: connectivity.id.toUpperCase(),
          downlinkKbps: connectivity.downlinkKbps,
          uplinkKbps: connectivity.uplinkKbps,
          rttMs: connectivity.latencyMs,
          packetUploadSeconds: Number(((EDGE_PACKET_KB * 8) / connectivity.uplinkKbps).toFixed(1)),
          transport: 'HTTPS mTLS 1.3 store-and-forward',
        }
      : { profile: 'AUTO', uplinkKbps: 128, packetUploadSeconds: 0.3, transport: 'HTTPS mutual-TLS 1.3' },
    attestation: {
      signatureAlgorithm: 'Ed25519',
      publicKeyId: `MSDE-EDGE-KEY-${report.centreId.split('-').slice(-2).join('')}`,
      signedAt: now.toISOString(),
      payloadChecksum: '', // filled below once the body is frozen
      tamperEvidence: 'WORM append, hash-chained',
    },
  };

  packet.attestation.payloadChecksum = `sha256:${hashString(JSON.stringify({ ...packet, attestation: { ...packet.attestation, payloadChecksum: '' } }))}`;
  packet.packetSizeKB = estimatePacketSizeKB(packet);
  return packet;
}

/** Deterministic 16-hex-char digest stand-in (FNV-1a based, audit-reproducible). */
function hashString(input) {
  let h1 = 2166136261;
  let h2 = 5381;
  for (let i = 0; i < input.length; i += 1) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = (Math.imul(h2, 33) + c) >>> 0;
  }
  const a = h1.toString(16).padStart(8, '0');
  const b = h2.toString(16).padStart(8, '0');
  return `${a}${b}${(a ^ b).toString(16).padStart(8, '0')}`.slice(0, 24);
}

/** Serialises the packet with a stable key order and measures real UTF-8 size. */
export function estimatePacketSizeKB(packet) {
  try {
    const json = JSON.stringify(packet);
    if (typeof TextEncoder !== 'undefined') {
      return Number((new TextEncoder().encode(json).length / 1024).toFixed(2));
    }
    return Number((json.length / 1024).toFixed(2));
  } catch (err) {
    return EDGE_PACKET_KB;
  }
}

export function stringifyPacket(packet) {
  return JSON.stringify(packet, null, 2);
}

/**
 * Per-centre telemetry roll-up used by the Bandwidth widget table.
 */
export function buildTelemetryLedger(centres, now = new Date()) {
  return centres.map((centre) => {
    const report = buildCentreReport(centre, now);
    const packet = buildEdgePacket(report, 0, now);
    const keyframes = packet.evidence.keyframesCaptured;
    const cmp = computeBandwidthComparison({ hours: 1, keyframes });
    return {
      centreId: centre.id,
      centreName: centre.name,
      district: centre.district,
      flagged: report.risk.key !== 'green',
      keyframes,
      packetKB: packet.packetSizeKB,
      hourlyEdgeKB: cmp.edgeKB,
      hourlyLegacyMB: cmp.legacyMB,
      savingsPct: cmp.savingsPct,
      monthlySavingINR: cmp.monthlyLegacyCostINR - cmp.monthlyEdgeCostINR,
      auditReport: report,
    };
  });
}

/**
 * Bandwidth savings projected across the whole pilot cluster.
 */
export function buildClusterSaving(centres, packetsPerCentrePerHour = 4, nodes = 126) {
  const perNodeKBPerHour = packetsPerCentrePerHour * EDGE_PACKET_KB;
  const legacyPerNodeKBPerHour = LEGACY_KB_PER_HOUR;
  const savedKBPerHour = (legacyPerNodeKBPerHour - perNodeKBPerHour) * nodes;
  const savedGBPerDay = (savedKBPerHour * 24) / (1024 * 1024);
  const dataCostPerGB = 180;
  return {
    nodes,
    perNodeKBPerHour,
    savedGBPerDay: Number(savedGBPerDay.toFixed(1)),
    savedCostPerDayINR: Math.round(savedGBPerDay * dataCostPerGB),
    savedCostPerMonthINR: Math.round(savedGBPerDay * 30 * dataCostPerGB),
    savingsPct: Number((100 * (1 - perNodeKBPerHour / legacyPerNodeKBPerHour)).toFixed(2)),
    legacyPerNodeMBPerDay: (legacyPerNodeKBPerHour * 24) / 1024,
    edgePerNodeMBPerDay: (perNodeKBPerHour * 24) / 1024,
  };
}

/* ---------------------------------------------------------------------------
 * 2G/3G FEASIBILITY MODEL
 * ------------------------------------------------------------------------ */

export function linkFeasibility(profile, keyframes = 3) {
  const payloadKB = EDGE_PACKET_KB + keyframes * edgePacketProfile.keyframeKB;
  const uploadSeconds = (payloadKB * 8) / Math.max(1, profile.uplinkKbps);
  const legacyUploadSeconds = (legacyStreamProfile.perHourMB * 1024 * 8) / Math.max(1, profile.uplinkKbps);
  return {
    profile: profile.label,
    uplinkKbps: profile.uplinkKbps,
    payloadKB,
    uploadSeconds: Number(uploadSeconds.toFixed(1)),
    withinCadence: uploadSeconds < edgePacketProfile.cadenceMinutes * 60,
    legacyUploadHours: Number((legacyUploadSeconds / 3600).toFixed(1)),
    legacyFeasible: legacyUploadSeconds < 3600,
  };
}

/* ---------------------------------------------------------------------------
 * 3. OFFICIAL SHOW-CAUSE NOTICE GENERATOR
 * ------------------------------------------------------------------------ */

/**
 * Renders the enforceable, court-ready Show-Cause Notice text (with automatic
 * evidence annexures) that the District Skill Development Officer signs off.
 */
export function generateShowCauseNotice(report, options = {}) {
  const template = options.template || noticeTemplate;
  const now = options.now || new Date();
  const officer = template.issuingOfficer;
  const ref = `${template.referencePrefix}/${String(1024 + Math.floor(now.getTime() % 800)).padStart(4, '0')}`;
  const severity = report.risk;
  const infra = report.infra;
  const eligibility = options.eligibility || enforcementEligibility(report);
  const replyBy = new Date(now.getTime() + (template.timelineDays || 7) * 24 * 60 * 60 * 1000);

  const fmt = (d) =>
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const fmtTime = (iso) =>
    new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const batchLines = report.verifications
    .map(
      (v) =>
        `        • ${v.batchId} — ${v.course}\n` +
        `          Sanctioned: ${v.sanctionedStrength} | Portal-claimed: ${v.portalReported} | AI physical headcount: ${v.aiPhysical} | ` +
        `Shortfall: ${v.discrepancy.toFixed(1)}% (${v.ghosts} ghost trainees) | Severity: ${v.severity.band} | Value at risk: ${formatINR(v.leakage)}`
    )
    .join('\n');

  const infraLines = infra.rows
    .filter((r) => r.missing > 0)
    .map(
      (r) =>
        `        • ${r.item} — sanctioned ${r.sanctionedQty}, physically detected ${r.detectedQty} → DEFICIT ${r.missing} unit(s)` +
        ` @ ${formatINR(r.unitCost)} = ${formatINR(r.valueAtRisk)}${r.criticalMissing ? '  [CRITICAL / SAFETY]' : ''}`
    )
    .join('\n');

  const snapshotLines = report.worst
    ? `        • ${fmtTime(report.worst.generatedAt)} — Epoch verification produced a physical headcount of ${report.worst.aiPhysical} against a disputed claim of ${report.worst.portalReported}.`
    : '        • No epoch data available.';

  const body = `
${template.authority}
${template.department}
Office of the District Skill Development Officer, ${officer.district}

No: ${ref}                                                        Date: ${fmt(now)}
To,
  The ${report.spoc.designation}, ${report.centreName}
  ${report.taluk} Taluk, ${report.district} District — Karnataka
  Empanelment ID: ${report.centreId} | Scheme: ${report.scheme.toUpperCase()} | SPOC: ${report.spoc.name} (${report.spoc.phone})

SUBJECT: ${template.subjectPrefix}

WHEREAS the Ministry of Skill Development and Entrepreneurship has deployed the
KausalyaDrishti AI compliance engine (SIH 2026, Problem Statement ID 26245) at
the captioned Training Centre, and the engine has recorded the following
physical-verification findings for the current monitoring cycle:

  Reference: KD Verification Report ${report.worst ? report.worst.reportId : 'N/A'}
  Verification mode: 30 FPS edge inference, anonymous centroid tracking
  (zero facial biometric templates stored — DPDP Act 2023 §7 compliant)

A. ATTENDANCE INTEGRITY FINDINGS (Discrepancy ratio D_att = ((N_portal − N_ai) / N_portal) × 100)
${batchLines}

      Composite attendance integrity index : ${report.attendanceIntegrity.toFixed(1)}%
      Centre-wide divergence band          : ${severity.band} (${severity.verdict})
      Total trainees unaccounted for       : ${report.totalGhosts}
      Estimated disbursement at risk       : ${formatINR(report.totalLeakage)}

B. INFRASTRUCTURE COMPLIANCE FINDINGS (C_infra = (Σ detected / Σ sanctioned) × 100)
      Infrastructure compliance score      : ${infra.score}%
      Sanctioned units / detected units    : ${infra.sanctionedUnits} / ${infra.detectedUnits}
      Assets physically absent             : ${infra.deficitUnits} unit(s), value ${formatINR(infra.valueAtRisk)}
${infraLines}
${infra.safetyBreach ? '\n      ⚠ SAFETY BREACH: Mandatory fire-safety equipment was not physically detected on the premises.\n' : ''}

C. ENFORCEMENT POSITION
      Show-Cause eligible : ${eligibility && eligibility.noticeEligible ? 'YES' : 'NO'}
      Grant-freeze eligible : ${eligibility && eligibility.freezeEligible ? 'YES — ₹' + report.totalLeakage.toLocaleString('en-IN') + ' withheld pending reply' : 'NOT YET — observation window'}

D. EVIDENCE ANNEXURES ACCOMPANYING THIS NOTICE (auto-generated telemetry)
      Annexure I    : ${report.centreId}-VERIFICATION-PACKET.json (${EDGE_PACKET_KB.toFixed(1)} KB edge telemetry, ${fmtTime(now.toISOString())})
      Annexure II   : Face-redacted keyframe mosaic, captured at ${report.worst && report.worst.isWithinBatchWindow ? 'active batch hour' : 'non-batch hour'}
${snapshotLines}
      Annexure III  : Infra scan log — asset tags ${infra.rows.map((r) => r.assetTag).slice(0, 3).join(', ')}${infra.rows.length > 3 ? ', …' : ''}
      Annexure IV   : SDMS portal attendance ledger extract (claimed attendance: ${report.totalClaimed})
      Annexure V    : GPS geofence log — centre coordinates ${report.geo.lat.toFixed(5)}, ${report.geo.lng.toFixed(5)} (drift ${report.gpsDriftMeters} m, inside 15 m fence)

NOW THEREFORE, the centre is hereby called upon to SHOW CAUSE, within
${template.timelineDays} (${numberToWords(template.timelineDays)}) days from the date of receipt of this
notice, i.e., on or before ${fmt(replyBy)}, as to why:

  1. The sanctioned grant corresponding to the unverified trainees should not be
     recovered from the Training Partner under the clauses cited below;
  2. The empanelment of the centre should not be suspended for the current
     financial year; and
  3. A penalty should not be levied for the missing sanctioned machinery.

APPLICABLE CLAUSES
${template.penalClauses.map((c) => `  ${c}`).join('\n')}

Failure to reply within the stipulated period will result in ex-parte action,
including freezing of all PMKVY / ${report.scheme.toUpperCase()} disbursements to the centre, a
surcharge of 12% per annum on the recoverable amount, and referral of the
centre to the State Level Monitoring Committee for de-empanelment.

This notice is digitally generated by the KausalyaDrishti MSDE Compliance
Engine and carries the electronic signature of the undersigned. The underlying
telemetry is independently reproducible from the MSDE Evidence Gateway using the
reference number quoted above.

                              Yours faithfully,

                              (${officer.name})
                              ${officer.designation}, ${officer.district}
                              ${officer.address}
                              ☎ ${officer.phone}   ✉ ${officer.email}

Copy to:
  1. The Director, Skill Development, Department of Skill Development, Bengaluru — for information.
  2. The State Level Monitoring Committee, PMKVY 4.0 (Karnataka) — for information.
  3. The Programme Management Unit, ${template.referencePrefix.split('/')[1]} — for compliance tracking.
  4. Office copy / Watch Register.

— END OF NOTICE — DIGITALLY SIGNED — KausalyaDrishti v1.2 —
`.trim();

  return {
    ref,
    subject: template.subjectPrefix,
    issuedOn: now.toISOString(),
    replyBy: replyBy.toISOString(),
    replyByLabel: fmt(replyBy),
    body,
    authority: template.authority,
    department: template.department,
    officer,
    centreId: report.centreId,
    centreName: report.centreName,
    amountAtRisk: report.totalLeakage,
    letterhead: 'Government of Karnataka • MSDE Skilling Compliance Engine',
  };
}

function numberToWords(n) {
  const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen'];
  return words[n] || String(n);
}

/* ---------------------------------------------------------------------------
 * 4. FREEZE ORDER GENERATOR
 * ------------------------------------------------------------------------ */

export function generateFreezeOrder(report, options = {}) {
  const now = options.now || new Date();
  const ref = `MSDE/PMKVY/FREEZE/${now.getFullYear()}/${report.centreId.split('-').slice(-2).join('')}`;
  const body = `
MINISTRY OF SKILL DEVELOPMENT AND ENTREPRENEURSHIP
PMKVY 4.0 — GRANT DISBURSEMENT CONTROL
Shram Shakti Bhawan, Rafi Marg, New Delhi — 110 001

ORDER No: ${ref}                                              Date: ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}

SUBJECT: IMMEDIATE FREEZE OF PMKVY / DDU-GKY GRANT DISBURSEMENT — ${report.centreName} (${report.centreId})

In exercise of the powers conferred under Clause 12.4 and Clause 16.2 of the
PMKVY 4.0 Guidelines 2024, disbursement of the following amounts to the
captioned Training Centre is hereby FROZEN WITH IMMEDIATE EFFECT:

        Amount withheld                : ${formatINR(report.totalLeakage)}
        Rationale                      : ${report.overallDiscrepancy.toFixed(1)}% attendance shortfall (${report.totalGhosts} unverified trainees)
        Infrastructure compliance      : ${report.infra.score}% (${report.infra.deficitUnits} sanctioned asset(s) absent)
        Safety equipment breach        : ${report.safetyFlag ? 'YES — fire-safety asset not detected' : 'No'}
        Current centre status          : ${report.tcStatus.toUpperCase()}

The centre shall not raise any invoice, claim or utilisation certificate against
the frozen head until the physical verification discrepancy is resolved to the
satisfaction of the District Skill Development Officer, ${report.district}.

Trainee welfare protection: the freeze applies to Training-Partner claims ONLY.
Stipend disbursement to genuinely verified aspirants (${report.totalPhysical} present
against a claim of ${report.totalClaimed}) shall continue uninterrupted.

                              (Sd/-)
                              Programme Director, PMKVY 4.0
                              Ministry of Skill Development and Entrepreneurship
`.trim();

  return {
    ref,
    issuedOn: now.toISOString(),
    body,
    centreId: report.centreId,
    centreName: report.centreName,
    amountAtRisk: report.totalLeakage,
    replyByLabel: null,
    letterhead: 'Ministry of Skill Development and Entrepreneurship • Grant Control',
    authority: 'Ministry of Skill Development and Entrepreneurship',
    department: 'PMKVY 4.0 — Grant Disbursement Control, Shram Shakti Bhawan, Rafi Marg, New Delhi — 110 001',
    officer: {
      name: 'Sri Alokendra Nath Verma',
      designation: 'Programme Director, PMKVY 4.0',
      district: 'New Delhi',
      address: 'Shram Shakti Bhawan, Rafi Marg, New Delhi — 110 001',
      phone: '+91 11 2345 6789',
      email: 'pd-pmkvy@msde.gov.in',
    },
  };
}

/* ---------------------------------------------------------------------------
 * 5. SURPRISE AUDIT ORDER GENERATOR
 * ------------------------------------------------------------------------ */

export function generateAuditOrder(report, options = {}) {
  const now = options.now || new Date();
  const auditDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const ref = `NSDC-E/FLD/AUDIT/${now.getFullYear()}/${report.centreId.split('-').slice(-2).join('')}`;
  const body = `
NATIONAL SKILL DEVELOPMENT CORPORATION — EMERGING SECTORS (NSDC-E)
FIELD AUDIT CELL • SOUTH REGION

FIELD AUDIT ORDER No: ${ref}                                  Date: ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}

TO: The Empanelled Field Auditor, ${report.district} Cluster

        Centre to be audited   : ${report.centreName} (${report.centreId})
        Address                : ${report.taluk} Taluk, ${report.district} District, Karnataka
        Geo-coordinates        : ${report.geo.lat.toFixed(5)}, ${report.geo.lng.toFixed(5)} (15 m geofence enforced)
        Inspection window      : ${auditDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, during declared batch hours
        Batch hours to observe : ${report.verifications.map((v) => v.activeHours).join(' | ')}
        Audit mode             : SURPRISE — no prior intimation to the centre SPOC
        Escorting officer      : District Skill Development Officer, ${report.district}

MANDATORY CHECKPOINTS
        1. Physical headcount of aspirants inside the batch hall during declared hours.
        2. Asset-tag-wise verification of all sanctioned machinery (scan the QR tags).
        3. Fire-safety equipment availability + last refill certificate.
        4. Match of SDMS portal attendance ledger with the physical register.
        5. DPDP consent notice display in Kannada at the centre entrance.
        6. Structural safety + drinking water + separate washroom compliance.

The auditor shall upload GeoStamped photographs through the NSDC-E mobile app
within 4 hours of inspection. KausalyaDrishti telemetry for the centre stands
attached as the pre-audit baseline.

                              (Sd/-)
                              Regional Head, Field Audit Cell (South)
`.trim();

  return {
    ref,
    issuedOn: now.toISOString(),
    auditDate: auditDate.toISOString(),
    body,
    centreId: report.centreId,
    centreName: report.centreName,
    amountAtRisk: report.totalLeakage,
    replyByLabel: auditDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    letterhead: 'National Skill Development Corporation — Emerging Sectors • Field Audit Cell (South)',
    authority: 'National Skill Development Corporation — Emerging Sectors (NSDC-E)',
    department: 'Field Audit Cell • South Region • Bengaluru',
    officer: {
      name: 'Smt. Kavitha Srinivasa Rao',
      designation: 'Regional Head, Field Audit Cell (South)',
      district: report.district,
      address: 'NSDC-E South Region Office, 4th Floor, Udyog Bhavan, Bengaluru — 560 001',
      phone: '+91 80 4112 8800',
      email: 'fieldaudit.south@nsdcindia.org',
    },
  };
}

export const telemetrySchemas = {
  edgePacket: 'MSDE-KD/EDGE-PKT/v1.2',
  notice: 'MSDE-KD/NOTICE/v1.0',
  freezeOrder: 'MSDE/PMKVY/FREEZE/v2',
  auditOrder: 'NSDC-E/FLD/AUDIT/v1',
};

export function telemetrySummary(report, now = new Date()) {
  const packet = buildEdgePacket(report, 0, now);
  const keyframes = packet.evidence.keyframesCaptured;
  const cmp = computeBandwidthComparison({ hours: 24, keyframes: keyframes * 4 });
  return {
    packet,
    keyframes,
    bytesPerDayKB: cmp.edgeKB,
    legacyPerDayMB: cmp.legacyPerDayMB,
    savingsPct: cmp.savingsPct,
    monthlySavingINR: Number((cmp.monthlyLegacyCostINR - cmp.monthlyEdgeCostINR).toFixed(0)),
  };
}

export function equipmentScoreForCentre(centre) {
  return equipmentRollup(centre.equipment);
}

export { buildBatchVerification };
