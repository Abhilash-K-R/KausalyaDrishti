/**
 * ============================================================================
 *  KausalyaDrishti — Mock Data Layer
 *  Realistic PMKVY 4.0 / DDU-GKY / NAPS data for the Tumakuru Skilling Cluster,
 *  Karnataka. Shaped exactly like the payloads returned by the MSDE
 *  "Kaushal Bharat" centre-management APIs (SDMS-inspired schema).
 *
 *  Every centre below carries:
 *    • Active batches  (batch id, trade, sanctioned strength, portal attendance)
 *    • Sanctioned equipment list (sanctioned vs AI-detected quantity + unit cost)
 *    • AI physical headcount (edge CV headcount consolidated across epoch windows)
 *    • Historical audit trail (time-stamped classroom vacancy snapshots)
 *    • Geo coordinates, SPOC, scheme, empanelment + last-audit metadata
 *
 *  Consumption model: read-only reference data. All runtime mutations
 *  (re-scan, enforcement, telemetry ticks) are layered on top by React state
 *  or by `src/services/complianceRules.js` — this module is never mutated.
 * ============================================================================
 */

/* ---------------------------------------------------------------------------
 * 1. CONSTANTS / GOVERNMENT SCHEME CONFIGURATION
 * ------------------------------------------------------------------------ */

export const PILOT_REGION = 'Tumakuru Skilling Cluster, Karnataka';

export const SCHEME_META = {
  pmkvy: {
    code: 'PMKVY',
    label: 'Pradhan Mantri Kaushal Vikas Yojana 4.0',
    shortLabel: 'PMKVY 4.0',
    node: 'MSDE — PMKVY Division',
    grantPerCandidate: 7500,
    accent: '#138808',
  },
  ddugky: {
    code: 'DDU-GKY',
    label: 'Deen Dayal Upadhyaya Grameen Kaushalya Yojana',
    shortLabel: 'DDU-GKY',
    node: 'MoRD — DDU-GKY National Unit',
    grantPerCandidate: 25000,
    accent: '#0b3d91',
  },
  naps: {
    code: 'NAPS',
    label: 'National Apprenticeship Promotion Scheme',
    shortLabel: 'NAPS',
    node: 'MSDE — Apprenticeship Division',
    grantPerCandidate: 9000,
    accent: '#9a3412',
  },
};

/** Standard PMKVY training stipend used for leakage estimation (₹/candidate). */
export const STIPEND_PER_TRAINEE = SCHEME_META.pmkvy.grantPerCandidate;

export const SECTOR_COUNCILS = {
  'AMH/Q0301': 'Apparel, Made-ups & Home Furnishing Sector Skill Council',
  'IIS/Q0102': 'Infrastructure Equipment Sector Skill Council',
  'ASC/Q1401': 'Automotive Skills Development Council',
  'ELE/Q4607': 'Electronics Sector Skills Council of India',
  'AGR/Q1205': 'Agriculture Skill Council of India',
};

/* ---------------------------------------------------------------------------
 * 2. TRAINING CENTRES — TUM & NEIGHBOURING DISTRICTS
 * ------------------------------------------------------------------------ */

export const trainingCentres = [
  /* ======================= CENTRE 1 — CRITICAL (FLAGSHIP DEMO) =========== */
  {
    id: 'KA-TUM-0417',
    name: 'Tumakuru Skill Academy',
    kannadaName: 'ತುಮಕೂರು ಕೌಶಲ್ಯ ಅಕಾಡೆಮಿ',
    district: 'Tumakuru',
    taluk: 'Tumakuru',
    address: 'No. 14, B.H. Road, Sira Gate, Tumakuru — 572 101, Karnataka',
    pincode: '572101',
    geo: { lat: 13.3379, lng: 77.1173 },
    scheme: 'pmkvy',
    sectors: ['Apparel & Home Furnishing', 'Electronics & Hardware'],
    spoc: { name: 'Smt. Nagaveni R. Hegde', designation: 'Centre Head', phone: '+91 94480 11234' },
    empaneledOn: '2023-06-12',
    tcStatus: 'Active',
    lastAuditOn: '2026-08-19',
    lastAuditType: 'Physical (NSDC-E)',
    averagePortalAttendance: 28,

    batches: [
      {
        batchId: 'PMKVY/KA/TUM-0417/B04',
        course: 'Apparel & Sewing Machine Operator',
        qpCode: 'AMH/Q0301',
        trade: 'Apparel & Home Furnishing',
        trainer: 'Shivakumar Gowda',
        trainerPortalPresent: true,
        sanctionedStrength: 30,
        portalReported: 28,
        aiPhysical: 8,
        aiConfidence: 0.962,
        activeHours: '09:00 AM - 01:00 PM',
        startDate: '2026-07-06',
        endDate: '2026-10-30',
        durationHours: 400,
        attendanceLocked: true,
      },
      {
        batchId: 'PMKVY/KA/TUM-0417/B07',
        course: 'Electronics Hardware Assembly & Repair',
        qpCode: 'ELE/Q4607',
        trade: 'Electronics & Hardware',
        trainer: 'Prakash M. Jain',
        trainerPortalPresent: false,
        sanctionedStrength: 25,
        portalReported: 22,
        aiPhysical: 14,
        aiConfidence: 0.914,
        activeHours: '02:00 PM - 06:00 PM',
        startDate: '2026-08-03',
        endDate: '2026-12-18',
        durationHours: 350,
        attendanceLocked: true,
      },
      {
        batchId: 'PMKVY/KA/TUM-0417/B09',
        course: 'Solar PV Installation Technician',
        qpCode: 'IIS/Q0102',
        trade: 'Green Energy',
        trainer: 'Yallappa S. Kuruba',
        trainerPortalPresent: true,
        sanctionedStrength: 30,
        portalReported: 21,
        aiPhysical: 19,
        aiConfidence: 0.903,
        activeHours: '09:00 AM - 01:00 PM',
        startDate: '2026-09-01',
        endDate: '2027-01-22',
        durationHours: 420,
        attendanceLocked: false,
      },
    ],

    // Σ sanctioned = 50 units · Σ detected = 34 units  ➜  C_infra = 68.0% (non-compliant)
    equipment: [
      { id: 'EQ-01', item: 'Industrial Sewing Machine (Single Needle Lock Stitch)', assetTag: 'AMH-SM-01..10', sanctionedQty: 10, detectedQty: 6, unitCost: 24500, critical: true },
      { id: 'EQ-02', item: 'Student Workbench (4 ft)', assetTag: 'WB-TUM-01..15', sanctionedQty: 15, detectedQty: 15, unitCost: 8600, critical: false },
      { id: 'EQ-03', item: 'Fabric Cutting Station', assetTag: 'CUT-TUM-01..02', sanctionedQty: 2, detectedQty: 2, unitCost: 62000, critical: false },
      { id: 'EQ-04', item: 'Fire Safety Extinguisher (CO₂ 4.5 kg)', assetTag: 'FIRE-TUM-01', sanctionedQty: 1, detectedQty: 0, unitCost: 4200, critical: true },
      { id: 'EQ-05', item: 'Overlock Machine (5-thread)', assetTag: 'AMH-OL-01..05', sanctionedQty: 5, detectedQty: 3, unitCost: 31500, critical: true },
      { id: 'EQ-06', item: 'LED CCTV Surveillance Camera', assetTag: 'CCTV-TUM-01..04', sanctionedQty: 4, detectedQty: 2, unitCost: 5400, critical: false },
      { id: 'EQ-07', item: 'Digital Smart Board (55")', assetTag: 'SB-TUM-01', sanctionedQty: 1, detectedQty: 1, unitCost: 78000, critical: false },
      { id: 'EQ-08', item: 'Multimeter — Digital', assetTag: 'ELE-MM-01..12', sanctionedQty: 12, detectedQty: 5, unitCost: 1650, critical: false },
    ],

    auditTrail: [
      { ts: '2026-10-04T09:02:11+05:30', day: '2026-10-04', window: '09:00–09:15', portalClaimed: 28, aiHeadcount: 12, vacantSeats: 18, occupancyPct: 40, trainerPresent: true, edgeNode: 'TUM-0417-NODE-A', jitterMs: 184, note: 'Gate-video epoch 1 — arrivals still in progress' },
      { ts: '2026-10-04T09:31:48+05:30', day: '2026-10-04', window: '09:15–09:30', portalClaimed: 28, aiHeadcount: 9, vacantSeats: 21, occupancyPct: 30, trainerPresent: true, edgeNode: 'TUM-0417-NODE-A', jitterMs: 197, note: 'Roster lock verified against SDMS biometric log' },
      { ts: '2026-10-04T10:14:03+05:30', day: '2026-10-04', window: '10:00–10:15', portalClaimed: 28, aiHeadcount: 8, vacantSeats: 22, occupancyPct: 27, trainerPresent: true, edgeNode: 'TUM-0417-NODE-A', jitterMs: 176, note: 'Zero arrival delta for 43 consecutive minutes' },
      { ts: '2026-10-04T11:47:26+05:30', day: '2026-10-04', window: '11:45–12:00', portalClaimed: 28, aiHeadcount: 8, vacantSeats: 22, occupancyPct: 27, trainerPresent: true, edgeNode: 'TUM-0417-NODE-A', jitterMs: 208, note: 'No tardy arrivals — attendance anomaly sustained' },
      { ts: '2026-10-04T12:38:59+05:30', day: '2026-10-04', window: '12:30–12:45', portalClaimed: 28, aiHeadcount: 8, vacantSeats: 22, occupancyPct: 27, trainerPresent: true, edgeNode: 'TUM-0417-NODE-A', jitterMs: 191, note: 'Batch dismissed early; 22 workbenches idle' },
    ],

    classroom: { aspect: 1.6, startHour: 9, endHour: 13, edgeNode: 'TUM-0417-NODE-A', perTraineeCost: 7500 },
  },

  /* ======================= CENTRE 2 — SUSPICIOUS (YELLOW) ================ */
  {
    id: 'KA-TUM-0588',
    name: 'Pavagada Rural Vocations Centre',
    kannadaName: 'ಪಾವಗಡ ಗ್ರಾಮೀಣ ಕೌಶಲ್ಯ ಕೇಂದ್ರ',
    district: 'Tumakuru',
    taluk: 'Pavagada',
    address: 'Survey 112/3, Near KSRTC Bus Stand, Pavagada — 561 202, Karnataka',
    pincode: '561202',
    geo: { lat: 14.0999, lng: 77.2793 },
    scheme: 'ddugky',
    sectors: ['Agriculture', 'Apparel & Home Furnishing'],
    spoc: { name: 'Sri Hanumantarao B. Patil', designation: 'Project Coordinator', phone: '+91 98861 45902' },
    empaneledOn: '2022-11-04',
    tcStatus: 'Active',
    lastAuditOn: '2026-07-28',
    lastAuditType: 'Desk review',
    averagePortalAttendance: 18,

    batches: [
      {
        batchId: 'DDUGKY/KA/TUM-0588/B02',
        course: 'Mushroom Cultivation & Post-Harvest Processing',
        qpCode: 'AGR/Q1205',
        trade: 'Agriculture',
        trainer: 'Lakshmidevi H. S.',
        trainerPortalPresent: true,
        sanctionedStrength: 30,
        portalReported: 24,
        aiPhysical: 18,
        aiConfidence: 0.931,
        activeHours: '10:00 AM - 02:00 PM',
        startDate: '2026-08-10',
        endDate: '2026-11-28',
        durationHours: 300,
        attendanceLocked: true,
      },
      {
        batchId: 'DDUGKY/KA/TUM-0588/B05',
        course: 'Tailoring & Garment Construction',
        qpCode: 'AMH/Q0301',
        trade: 'Apparel & Home Furnishing',
        trainer: 'Renuka B. Gandhi',
        trainerPortalPresent: true,
        sanctionedStrength: 30,
        portalReported: 25,
        aiPhysical: 22,
        aiConfidence: 0.922,
        activeHours: '02:30 PM - 06:30 PM',
        startDate: '2026-09-15',
        endDate: '2027-01-10',
        durationHours: 320,
        attendanceLocked: false,
      },
    ],

    // Σ 46 sanctioned / Σ 44 detected ➜ 95.7% compliant (minor deficit)
    equipment: [
      { id: 'EQ-01', item: 'Domestic Sewing Machine', assetTag: 'DDU-SM-01..20', sanctionedQty: 20, detectedQty: 18, unitCost: 14500, critical: false },
      { id: 'EQ-02', item: 'Mushroom Cultivation Cold Storage Unit', assetTag: 'AGR-CS-01..02', sanctionedQty: 2, detectedQty: 2, unitCost: 92000, critical: false },
      { id: 'EQ-03', item: 'Student Workbench (4 ft)', assetTag: 'DDU-WB-01..12', sanctionedQty: 12, detectedQty: 11, unitCost: 8600, critical: false },
      { id: 'EQ-04', item: 'Fire Safety Extinguisher (CO₂ 4.5 kg)', assetTag: 'FIRE-PVG-01', sanctionedQty: 2, detectedQty: 1, unitCost: 4200, critical: true },
      { id: 'EQ-05', item: 'Digital Smart Board (55")', assetTag: 'DDU-SB-01', sanctionedQty: 1, detectedQty: 1, unitCost: 78000, critical: false },
      { id: 'EQ-06', item: 'Solar Lantern Assembly Toolkit', assetTag: 'AGR-SK-01..06', sanctionedQty: 6, detectedQty: 6, unitCost: 4900, critical: false },
    ],

    auditTrail: [
      { ts: '2026-10-03T10:07:41+05:30', day: '2026-10-03', window: '10:00–10:15', portalClaimed: 24, aiHeadcount: 21, vacantSeats: 9, occupancyPct: 70, trainerPresent: true, edgeNode: 'PVG-0588-NODE-A', jitterMs: 231, note: 'Seasonal harvesting absenteeism (self-reported)' },
      { ts: '2026-10-03T11:33:12+05:30', day: '2026-10-03', window: '11:15–11:30', portalClaimed: 24, aiHeadcount: 19, vacantSeats: 11, occupancyPct: 63, trainerPresent: true, edgeNode: 'PVG-0588-NODE-A', jitterMs: 244, note: 'Two aspirants departed for field practicum visit' },
      { ts: '2026-10-03T13:44:55+05:30', day: '2026-10-03', window: '13:30–13:45', portalClaimed: 24, aiHeadcount: 18, vacantSeats: 12, occupancyPct: 60, trainerPresent: true, edgeNode: 'PVG-0588-NODE-A', jitterMs: 219, note: 'Post-lunch dip within tolerance band' },
    ],

    classroom: { aspect: 1.6, startHour: 10, endHour: 14, edgeNode: 'PVG-0588-NODE-A', perTraineeCost: 25000 },
  },

  /* ======================= CENTRE 3 — CLEAN (GREEN) ====================== */
  {
    id: 'KA-TUM-0702',
    name: 'Madhugiri Government ITI Skilling Wing',
    kannadaName: 'ಮಧುಗಿರಿ ಸರ್ಕಾರಿ ಐಟಿಐ ಕೌಶಲ್ಯ ವಿಭಾಗ',
    district: 'Tumakuru',
    taluk: 'Madhugiri',
    address: 'Govt. ITI Campus, NH-48 Bypass Road, Madhugiri — 572 132, Karnataka',
    pincode: '572132',
    geo: { lat: 13.6604, lng: 77.2095 },
    scheme: 'naps',
    sectors: ['Automotive', 'Infrastructure Equipment'],
    spoc: { name: 'Sri Basavaraj S. Kulkarni', designation: 'Principal & NAPS Nodal Officer', phone: '+91 94810 77320' },
    empaneledOn: '2021-02-18',
    tcStatus: 'Active',
    lastAuditOn: '2026-09-30',
    lastAuditType: 'Surprise physical (joint team)',
    averagePortalAttendance: 26,

    batches: [
      {
        batchId: 'NAPS/KA/TUM-0702/B11',
        course: 'Automotive Service Technician (Two-Wheeler)',
        qpCode: 'ASC/Q1401',
        trade: 'Automotive',
        trainer: 'Mahesh T. Reddy',
        trainerPortalPresent: true,
        sanctionedStrength: 28,
        portalReported: 27,
        aiPhysical: 26,
        aiConfidence: 0.968,
        activeHours: '09:30 AM - 01:30 PM',
        startDate: '2026-06-15',
        endDate: '2026-12-05',
        durationHours: 420,
        attendanceLocked: true,
      },
      {
        batchId: 'NAPS/KA/TUM-0702/B13',
        course: 'Excavator & Heavy Equipment Operator',
        qpCode: 'IIS/Q0102',
        trade: 'Infrastructure Equipment',
        trainer: 'Shanta Kumari B.',
        trainerPortalPresent: true,
        sanctionedStrength: 20,
        portalReported: 19,
        aiPhysical: 19,
        aiConfidence: 0.957,
        activeHours: '02:00 PM - 06:00 PM',
        startDate: '2026-09-20',
        endDate: '2027-03-14',
        durationHours: 500,
        attendanceLocked: false,
      },
    ],

    equipment: [
      { id: 'EQ-01', item: 'Two-Wheeler Service Bay Lift', assetTag: 'ASC-BL-01..06', sanctionedQty: 6, detectedQty: 6, unitCost: 185000, critical: false },
      { id: 'EQ-02', item: 'Automotive Diagnostic Scanner (OBD-II Pro)', assetTag: 'ASC-DS-01..04', sanctionedQty: 4, detectedQty: 4, unitCost: 68000, critical: false },
      { id: 'EQ-03', item: 'Engine Mock-Up Trainer Stand', assetTag: 'ASC-EM-01..08', sanctionedQty: 8, detectedQty: 8, unitCost: 42500, critical: false },
      { id: 'EQ-04', item: 'Student Workbench (6 ft Heavy Duty)', assetTag: 'ITI-WB-01..16', sanctionedQty: 16, detectedQty: 16, unitCost: 12400, critical: false },
      { id: 'EQ-05', item: 'Fire Safety Extinguisher (CO₂ 4.5 kg)', assetTag: 'FIRE-MDG-01..03', sanctionedQty: 3, detectedQty: 3, unitCost: 4200, critical: true },
      { id: 'EQ-06', item: 'Excavator Simulator (VR)', assetTag: 'IIS-VR-01', sanctionedQty: 1, detectedQty: 1, unitCost: 420000, critical: false },
    ],

    auditTrail: [
      { ts: '2026-10-02T09:34:20+05:30', day: '2026-10-02', window: '09:30–09:45', portalClaimed: 27, aiHeadcount: 26, vacantSeats: 2, occupancyPct: 93, trainerPresent: true, edgeNode: 'MDG-0702-NODE-A', jitterMs: 96, note: 'Single sanctioned leave — attendance consistent' },
      { ts: '2026-10-02T11:16:44+05:30', day: '2026-10-02', window: '11:00–11:15', portalClaimed: 27, aiHeadcount: 26, vacantSeats: 2, occupancyPct: 93, trainerPresent: true, edgeNode: 'MDG-0702-NODE-A', jitterMs: 88, note: 'No discrepancy across three verification epochs' },
      { ts: '2026-10-02T13:02:09+05:30', day: '2026-10-02', window: '12:45–13:00', portalClaimed: 27, aiHeadcount: 26, vacantSeats: 2, occupancyPct: 93, trainerPresent: true, edgeNode: 'MDG-0702-NODE-A', jitterMs: 103, note: 'Batch closes with full practical demonstration log' },
    ],

    classroom: { aspect: 1.6, startHour: 9, endHour: 13, edgeNode: 'MDG-0702-NODE-A', perTraineeCost: 9000 },
  },

  /* ======================= CENTRE 4 — SUSPICIOUS (YELLOW) ================= */
  {
    id: 'KA-TUM-0813',
    name: 'Gubbi Skilling Centre',
    kannadaName: 'ಗುಬ್ಬಿ ಕೌಶಲ್ಯ ಕೇಂದ್ರ',
    district: 'Tumakuru',
    taluk: 'Gubbi',
    address: 'Plot 7, Industrial Estate Road, Gubbi — 572 216, Karnataka',
    pincode: '572216',
    geo: { lat: 13.3122, lng: 76.9441 },
    scheme: 'pmkvy',
    sectors: ['Electronics & Hardware'],
    spoc: { name: 'Sri Fayaz Ahmed B.', designation: 'Training Partner Representative', phone: '+91 97405 33218' },
    empaneledOn: '2023-01-27',
    tcStatus: 'Under review',
    lastAuditOn: '2026-06-11',
    lastAuditType: 'Desk review (SDMS log)',
    averagePortalAttendance: 22,

    batches: [
      {
        batchId: 'PMKVY/KA/TUM-0813/B03',
        course: 'Consumer Electronics & LED Assembly',
        qpCode: 'ELE/Q4607',
        trade: 'Electronics & Hardware',
        trainer: 'Nagaraj V. Bhat',
        trainerPortalPresent: true,
        sanctionedStrength: 30,
        portalReported: 27,
        aiPhysical: 23,
        aiConfidence: 0.926,
        activeHours: '09:00 AM - 01:00 PM',
        startDate: '2026-07-20',
        endDate: '2026-11-15',
        durationHours: 360,
        attendanceLocked: true,
      },
      {
        batchId: 'PMKVY/KA/TUM-0813/B06',
        course: 'Solar Panel Installation Assistant',
        qpCode: 'IIS/Q0102',
        trade: 'Green Energy',
        trainer: 'Shafiulla Khan',
        trainerPortalPresent: true,
        sanctionedStrength: 25,
        portalReported: 23,
        aiPhysical: 21,
        aiConfidence: 0.918,
        activeHours: '02:00 PM - 06:00 PM',
        startDate: '2026-08-25',
        endDate: '2026-12-30',
        durationHours: 340,
        attendanceLocked: false,
      },
    ],

    equipment: [
      { id: 'EQ-01', item: 'SMT Soldering & Rework Station', assetTag: 'ELE-SMT-01..08', sanctionedQty: 8, detectedQty: 8, unitCost: 27500, critical: false },
      { id: 'EQ-02', item: 'ESD-Safe Assembly Workbench', assetTag: 'ELE-WB-01..14', sanctionedQty: 14, detectedQty: 13, unitCost: 11200, critical: false },
      { id: 'EQ-03', item: 'Digital Storage Oscilloscope', assetTag: 'ELE-OS-01..04', sanctionedQty: 4, detectedQty: 4, unitCost: 46800, critical: false },
      { id: 'EQ-04', item: 'Fire Safety Extinguisher (CO₂ 4.5 kg)', assetTag: 'FIRE-GBB-01..02', sanctionedQty: 2, detectedQty: 2, unitCost: 4200, critical: true },
      { id: 'EQ-05', item: 'LED Panel Assembly Fixture', assetTag: 'ELE-LF-01..10', sanctionedQty: 10, detectedQty: 9, unitCost: 9800, critical: false },
      { id: 'EQ-06', item: 'Function Generator (2 MHz)', assetTag: 'ELE-FG-01..03', sanctionedQty: 3, detectedQty: 3, unitCost: 19400, critical: false },
    ],

    auditTrail: [
      { ts: '2026-10-01T09:21:33+05:30', day: '2026-10-01', window: '09:00–09:15', portalClaimed: 27, aiHeadcount: 24, vacantSeats: 6, occupancyPct: 80, trainerPresent: true, edgeNode: 'GBB-0813-NODE-A', jitterMs: 267, note: 'Minor shortfall — late arrivals under observation' },
      { ts: '2026-10-01T10:52:18+05:30', day: '2026-10-01', window: '10:30–10:45', portalClaimed: 27, aiHeadcount: 23, vacantSeats: 7, occupancyPct: 77, trainerPresent: true, edgeNode: 'GBB-0813-NODE-A', jitterMs: 288, note: 'Four aspirants absent post tea-break, unmarked in SDMS' },
      { ts: '2026-10-01T12:19:47+05:30', day: '2026-10-01', window: '12:00–12:15', portalClaimed: 27, aiHeadcount: 23, vacantSeats: 7, occupancyPct: 77, trainerPresent: true, edgeNode: 'GBB-0813-NODE-A', jitterMs: 274, note: 'Marked for 7-day compliance observation window' },
    ],

    classroom: { aspect: 1.6, startHour: 9, endHour: 13, edgeNode: 'GBB-0813-NODE-A', perTraineeCost: 7500 },
  },

  /* ======================= NEIGHBOURING DISTRICT CENTRES ================= */
  {
    id: 'KA-BLR-1102',
    name: 'Devanahalli Rural Skills Institute',
    kannadaName: 'ದೇವನಹಳ್ಳಿ ಗ್ರಾಮೀಣ ಕೌಶಲ್ಯ ಸಂಸ್ಥೆ',
    district: 'Bengaluru Rural',
    taluk: 'Devanahalli',
    address: 'Sy. No. 44, Airport Road, Devanahalli — 562 110, Karnataka',
    pincode: '562110',
    geo: { lat: 13.2437, lng: 77.7132 },
    scheme: 'ddugky',
    sectors: ['Construction', 'Apparel & Home Furnishing'],
    spoc: { name: 'Smt. Shalini S. Raju', designation: 'Centre Director', phone: '+91 99021 66547' },
    empaneledOn: '2022-05-09',
    tcStatus: 'Active',
    lastAuditOn: '2026-09-08',
    lastAuditType: 'Physical (joint team)',
    averagePortalAttendance: 25,

    batches: [
      {
        batchId: 'DDUGKY/KA/BLR-1102/B08',
        course: 'Masonry & Concrete Technician',
        qpCode: 'CON/Q0101',
        trade: 'Construction',
        trainer: 'Rajanna M. Urs',
        trainerPortalPresent: true,
        sanctionedStrength: 30,
        portalReported: 29,
        aiPhysical: 19,
        aiConfidence: 0.938,
        activeHours: '09:00 AM - 01:00 PM',
        startDate: '2026-07-14',
        endDate: '2026-11-20',
        durationHours: 380,
        attendanceLocked: true,
      },
      {
        batchId: 'DDUGKY/KA/BLR-1102/B10',
        course: 'Industrial Tailoring & Upholstery',
        qpCode: 'AMH/Q0301',
        trade: 'Apparel & Home Furnishing',
        trainer: 'Zubeida Begum',
        trainerPortalPresent: true,
        sanctionedStrength: 25,
        portalReported: 25,
        aiPhysical: 24,
        aiConfidence: 0.951,
        activeHours: '02:00 PM - 06:00 PM',
        startDate: '2026-09-12',
        endDate: '2027-01-09',
        durationHours: 300,
        attendanceLocked: false,
      },
    ],

    equipment: [
      { id: 'EQ-01', item: 'Concrete Mixer (Small Batch)', assetTag: 'CON-CM-01..02', sanctionedQty: 2, detectedQty: 2, unitCost: 78000, critical: false },
      { id: 'EQ-02', item: 'Masonry Practice Platform', assetTag: 'CON-MP-01..04', sanctionedQty: 4, detectedQty: 3, unitCost: 26400, critical: false },
      { id: 'EQ-03', item: 'Bar Bending & Cutting Machine', assetTag: 'CON-BB-01..03', sanctionedQty: 3, detectedQty: 1, unitCost: 88000, critical: true },
      { id: 'EQ-04', item: 'Industrial Sewing Machine (Single Needle Lock Stitch)', assetTag: 'AMH-BLR-SM-01..12', sanctionedQty: 12, detectedQty: 12, unitCost: 24500, critical: false },
      { id: 'EQ-05', item: 'Fire Safety Extinguisher (CO₂ 4.5 kg)', assetTag: 'FIRE-BLR-01..02', sanctionedQty: 2, detectedQty: 2, unitCost: 4200, critical: true },
      { id: 'EQ-06', item: 'Safety PPE Locker (ISI-marked)', assetTag: 'SAFE-BLR-01..06', sanctionedQty: 6, detectedQty: 6, unitCost: 7400, critical: false },
    ],

    auditTrail: [
      { ts: '2026-09-30T09:12:58+05:30', day: '2026-09-30', window: '09:00–09:15', portalClaimed: 29, aiHeadcount: 19, vacantSeats: 11, occupancyPct: 63, trainerPresent: true, edgeNode: 'BLR-1102-NODE-A', jitterMs: 156, note: '10 aspirants migrated to Bengaluru construction sites (unreported)' },
      { ts: '2026-09-30T10:58:31+05:30', day: '2026-09-30', window: '10:45–11:00', portalClaimed: 29, aiHeadcount: 19, vacantSeats: 11, occupancyPct: 63, trainerPresent: true, edgeNode: 'BLR-1102-NODE-A', jitterMs: 149, note: 'Portal ledger not reconciled for 12 days' },
      { ts: '2026-09-30T12:44:07+05:30', day: '2026-09-30', window: '12:30–12:45', portalClaimed: 29, aiHeadcount: 19, vacantSeats: 11, occupancyPct: 63, trainerPresent: true, edgeNode: 'BLR-1102-NODE-A', jitterMs: 162, note: 'Escalated to District Skill Development Officer' },
    ],

    classroom: { aspect: 1.6, startHour: 9, endHour: 13, edgeNode: 'BLR-1102-NODE-A', perTraineeCost: 25000 },
  },
  {
    id: 'KA-MYS-1247',
    name: 'Hebbal Industrial Skilling Hub',
    kannadaName: 'ಹೆಬ್ಬಾಳ ಕೈಗಾರಿಕಾ ಕೌಶಲ್ಯ ಕೇಂದ್ರ',
    district: 'Mysuru',
    taluk: 'Mysuru (Hebbal)',
    address: 'Plot 22, Hebbal Industrial Area, Mysuru — 570 016, Karnataka',
    pincode: '570016',
    geo: { lat: 12.3368, lng: 76.6163 },
    scheme: 'ddugky',
    sectors: ['Automotive', 'Electronics & Hardware'],
    spoc: { name: 'Sri Devaraju N. Shetty', designation: 'Centre Head', phone: '+91 96322 18874' },
    empaneledOn: '2021-09-16',
    tcStatus: 'Active',
    lastAuditOn: '2026-08-30',
    lastAuditType: 'Physical (NSDC-E)',
    averagePortalAttendance: 28,

    batches: [
      {
        batchId: 'DDUGKY/KA/MYS-1247/B19',
        course: 'CNC Operator & Precision Machining',
        qpCode: 'ASC/Q1401',
        trade: 'Automotive',
        trainer: 'Girish H. Poojary',
        trainerPortalPresent: true,
        sanctionedStrength: 30,
        portalReported: 28,
        aiPhysical: 27,
        aiConfidence: 0.974,
        activeHours: '09:00 AM - 01:00 PM',
        startDate: '2026-06-02',
        endDate: '2026-12-22',
        durationHours: 520,
        attendanceLocked: true,
      },
      {
        batchId: 'DDUGKY/KA/MYS-1247/B21',
        course: 'PCB Design & Embedded Assembly',
        qpCode: 'ELE/Q4607',
        trade: 'Electronics & Hardware',
        trainer: 'Sushma R. Kulkarni',
        trainerPortalPresent: true,
        sanctionedStrength: 24,
        portalReported: 24,
        aiPhysical: 23,
        aiConfidence: 0.962,
        activeHours: '02:00 PM - 06:00 PM',
        startDate: '2026-09-05',
        endDate: '2027-01-30',
        durationHours: 360,
        attendanceLocked: false,
      },
    ],

    equipment: [
      { id: 'EQ-01', item: 'CNC Trainer Lathe (3-axis)', assetTag: 'CNC-MYS-01..04', sanctionedQty: 4, detectedQty: 4, unitCost: 685000, critical: false },
      { id: 'EQ-02', item: 'Industrial Sewing Machine (Single Needle Lock Stitch)', assetTag: 'AMH-MYS-SM-01..08', sanctionedQty: 8, detectedQty: 8, unitCost: 24500, critical: false },
      { id: 'EQ-03', item: 'PCB Reflow Oven (Bench-top)', assetTag: 'ELE-RO-01..02', sanctionedQty: 2, detectedQty: 2, unitCost: 96000, critical: false },
      { id: 'EQ-04', item: 'Student Workbench (6 ft Heavy Duty)', assetTag: 'MYS-WB-01..18', sanctionedQty: 18, detectedQty: 17, unitCost: 12400, critical: false },
      { id: 'EQ-05', item: 'Fire Safety Extinguisher (CO₂ 4.5 kg)', assetTag: 'FIRE-MYS-01..03', sanctionedQty: 3, detectedQty: 3, unitCost: 4200, critical: true },
      { id: 'EQ-06', item: 'Tool Room Precision Instrument Set', assetTag: 'MYS-TR-01..06', sanctionedQty: 6, detectedQty: 6, unitCost: 34500, critical: false },
    ],

    auditTrail: [
      { ts: '2026-09-29T09:26:14+05:30', day: '2026-09-29', window: '09:00–09:15', portalClaimed: 28, aiHeadcount: 27, vacantSeats: 3, occupancyPct: 90, trainerPresent: true, edgeNode: 'MYS-1247-NODE-A', jitterMs: 82, note: 'Within statistical tolerance (±1 aspirant)' },
      { ts: '2026-09-29T11:08:52+05:30', day: '2026-09-29', window: '10:45–11:00', portalClaimed: 28, aiHeadcount: 27, vacantSeats: 3, occupancyPct: 90, trainerPresent: true, edgeNode: 'MYS-1247-NODE-A', jitterMs: 77, note: 'Sanctioned medical leave documented in SDMS' },
    ],

    classroom: { aspect: 1.6, startHour: 9, endHour: 13, edgeNode: 'MYS-1247-NODE-A', perTraineeCost: 25000 },
  },
  {
    id: 'KA-BLG-1388',
    name: 'Belagavi Precision Works Skilling Centre',
    kannadaName: 'ಬೆಳಗಾವಿ ನಿಖರ ಕೌಶಲ್ಯ ಕೇಂದ್ರ',
    district: 'Belagavi',
    taluk: 'Belagavi (Udyambag)',
    address: 'Foundry Cluster, Udyambag Industrial Estate, Belagavi — 590 008, Karnataka',
    pincode: '590008',
    geo: { lat: 15.8172, lng: 74.5076 },
    scheme: 'pmkvy',
    sectors: ['Electronics & Hardware', 'Automotive'],
    spoc: { name: 'Sri Vinayak R. Deshpande', designation: 'Centre Head', phone: '+91 94806 22915' },
    empaneledOn: '2022-03-03',
    tcStatus: 'Active',
    lastAuditOn: '2026-05-22',
    lastAuditType: 'Desk review',
    averagePortalAttendance: 27,

    batches: [
      {
        batchId: 'PMKVY/KA/BLG-1388/B14',
        course: 'Welding & Fabrication (GMAW/TIG)',
        qpCode: 'IIS/Q0102',
        trade: 'Infrastructure Equipment',
        trainer: 'Sadanand B. Naik',
        trainerPortalPresent: true,
        sanctionedStrength: 30,
        portalReported: 26,
        aiPhysical: 25,
        aiConfidence: 0.945,
        activeHours: '09:30 AM - 01:30 PM',
        startDate: '2026-07-01',
        endDate: '2026-11-26',
        durationHours: 440,
        attendanceLocked: true,
      },
      {
        batchId: 'PMKVY/KA/BLG-1388/B17',
        course: 'Consumer Electronics Assembly',
        qpCode: 'ELE/Q4607',
        trade: 'Electronics & Hardware',
        trainer: 'Priya M. Kudachi',
        trainerPortalPresent: true,
        sanctionedStrength: 25,
        portalReported: 25,
        aiPhysical: 22,
        aiConfidence: 0.929,
        activeHours: '02:00 PM - 06:00 PM',
        startDate: '2026-08-18',
        endDate: '2026-12-20',
        durationHours: 350,
        attendanceLocked: false,
      },
    ],

    equipment: [
      { id: 'EQ-01', item: 'GMAW Welding Machine (Inverter)', assetTag: 'WLD-BLG-01..08', sanctionedQty: 8, detectedQty: 8, unitCost: 58400, critical: false },
      { id: 'EQ-02', item: 'Welding Fume Extraction Arm', assetTag: 'WLD-EX-01..06', sanctionedQty: 6, detectedQty: 6, unitCost: 31500, critical: false },
      { id: 'EQ-03', item: 'Metal Fabrication Workbench', assetTag: 'WLD-WB-01..12', sanctionedQty: 12, detectedQty: 12, unitCost: 16800, critical: false },
      { id: 'EQ-04', item: 'ESD-Safe Assembly Workbench', assetTag: 'ELE-BLG-WB-01..10', sanctionedQty: 10, detectedQty: 10, unitCost: 11200, critical: false },
      { id: 'EQ-05', item: 'Fire Safety Extinguisher (CO₂ 4.5 kg)', assetTag: 'FIRE-BLG-01..02', sanctionedQty: 2, detectedQty: 2, unitCost: 4200, critical: true },
      { id: 'EQ-06', item: 'Digital Storage Oscilloscope', assetTag: 'ELE-BLG-OS-01..03', sanctionedQty: 3, detectedQty: 3, unitCost: 46800, critical: false },
    ],

    auditTrail: [
      { ts: '2026-09-26T09:41:02+05:30', day: '2026-09-26', window: '09:30–09:45', portalClaimed: 26, aiHeadcount: 25, vacantSeats: 5, occupancyPct: 83, trainerPresent: true, edgeNode: 'BLG-1388-NODE-A', jitterMs: 118, note: 'Shop-floor housekeeping drill delayed 3 arrivals' },
      { ts: '2026-09-26T11:27:39+05:30', day: '2026-09-26', window: '11:15–11:30', portalClaimed: 26, aiHeadcount: 25, vacantSeats: 5, occupancyPct: 83, trainerPresent: true, edgeNode: 'BLG-1388-NODE-A', jitterMs: 126, note: 'Compliant — no escalation warranted' },
    ],

    classroom: { aspect: 1.6, startHour: 9, endHour: 13, edgeNode: 'BLG-1388-NODE-A', perTraineeCost: 7500 },
  },
];

/** Fast lookup helper used by every portal. */
export const getCentreById = (id) => trainingCentres.find((c) => c.id === id) || trainingCentres[0];

export const getBatchByKey = (key) => {
  for (const centre of trainingCentres) {
    const batch = centre.batches.find((b) => b.batchId === key);
    if (batch) return { centre, batch };
  }
  return { centre: trainingCentres[0], batch: trainingCentres[0].batches[0] };
};

/* ---------------------------------------------------------------------------
 * 3. DISTRICT-WISE SUMMARY (embeds the mandated MSDE state-level roll-up)
 *    • Total empaneled centres : 148
 *    • Active batches          : 412
 *    • Fraud flags raised      : 19
 *    • Prevented leakage       : ₹14,80,000
 * ------------------------------------------------------------------------ */

export const districtSummary = {
  activeTab: 'district',
  totalEmpaneledCentres: 148,
  activeBatches: 412,
  fraudFlags: 19,
  preventedLeakage: 1480000,
  edgeNodesDeployed: 126,
  avgEdgeUptimePct: 98.7,
  avgDetectionLatencyMs: 1438,
  monthlyEdgePackets: 3_640_000,
  districts: [
    { name: 'Tumakuru',       kannada: 'ತುಮಕೂರು',  empaneledCentres: 148, activeBatches: 412, flaggedCentres: 19, avgCompliance: 61, preventedLeakage: 1480000, riskBand: 'RED',    auditOfficer: 'District Skill Development Officer, Tumakuru' },
    { name: 'Bengaluru Rural', kannada: 'ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ', empaneledCentres: 96,  activeBatches: 268, flaggedCentres: 9,  avgCompliance: 71, preventedLeakage: 860000,  riskBand: 'AMBER',  auditOfficer: 'District Skill Development Officer, Bengaluru Rural' },
    { name: 'Mysuru',          kannada: 'ಮೈಸೂರು',   empaneledCentres: 112, activeBatches: 301, flaggedCentres: 6,  avgCompliance: 78, preventedLeakage: 540000,  riskBand: 'AMBER',  auditOfficer: 'District Skill Development Officer, Mysuru' },
    { name: 'Belagavi',        kannada: 'ಬೆಳಗಾವಿ',  empaneledCentres: 134, activeBatches: 349, flaggedCentres: 11, avgCompliance: 74, preventedLeakage: 720000,  riskBand: 'AMBER',  auditOfficer: 'District Skill Development Officer, Belagavi' },
    { name: 'Kolar',           kannada: 'ಕೋಲಾರ',    empaneledCentres: 84,  activeBatches: 219, flaggedCentres: 4,  avgCompliance: 86, preventedLeakage: 310000,  riskBand: 'GREEN',  auditOfficer: 'District Skill Development Officer, Kolar' },
    { name: 'Davanagere',      kannada: 'ದಾವಣಗೆರೆ', empaneledCentres: 78,  activeBatches: 196, flaggedCentres: 5,  avgCompliance: 83, preventedLeakage: 365000,  riskBand: 'GREEN',  auditOfficer: 'District Skill Development Officer, Davanagere' },
    { name: 'Kalaburagi',      kannada: 'ಕಲಬುರಗಿ',  empaneledCentres: 91,  activeBatches: 233, flaggedCentres: 8,  avgCompliance: 72, preventedLeakage: 495000,  riskBand: 'AMBER',  auditOfficer: 'District Skill Development Officer, Kalaburagi' },
    { name: 'Ballari',         kannada: 'ಬಳ್ಳಾರಿ',  empaneledCentres: 69,  activeBatches: 174, flaggedCentres: 7,  avgCompliance: 68, preventedLeakage: 455000,  riskBand: 'AMBER',  auditOfficer: 'District Skill Development Officer, Ballari' },
  ],
};

/** Karnataka / national command roll-up shown on the Ministry console. */
export const nationalKpi = {
  monitoredCentres: 1284,
  activeBatches: 3470,
  ghostAlertsThisMonth: 214,
  blockedLeakageThisMonth: 1_62_00_000, // ₹1.62 Cr
  statesLive: 5,
  statesOnboarding: 11,
  prisoners: 0, // guard-rail field kept for schema parity
  resolvedCompliancePct: 91.4,
};

/** Enforcement action ledger shown under the Ministry console. */
export const enforcementHistory = [
  { id: 'ENF/2026/KA/1042', centreId: 'KA-TUM-0417', action: 'SHOW_CAUSE_NOTICE', issuedOn: '2026-09-22', authority: 'DSDO Tumakuru', status: 'Awaiting reply', slaDays: 7, amountAtRisk: 150000 },
  { id: 'ENF/2026/KA/1031', centreId: 'KA-BLR-1102', action: 'GRANT_FREEZE', issuedOn: '2026-09-14', authority: 'MSDE PMKVY Division', status: 'Standing order issued', slaDays: 0, amountAtRisk: 250000 },
  { id: 'ENF/2026/KA/1018', centreId: 'KA-TUM-0588', action: 'SURPRISE_AUDIT', issuedOn: '2026-08-30', authority: 'NSDC-E Filed Audit Cell', status: 'Team deployed', slaDays: 3, amountAtRisk: 60000 },
  { id: 'ENF/2026/KA/0994', centreId: 'KA-TUM-0813', action: 'SHOW_CAUSE_NOTICE', issuedOn: '2026-08-11', authority: 'DSDO Tumakuru', status: 'Reply under scrutiny', slaDays: 2, amountAtRisk: 30000 },
];

/* ---------------------------------------------------------------------------
 * 4. ALERT TICKER + BROADCAST FEED
 * ------------------------------------------------------------------------ */

export const tickerAlerts = [
  { id: 'TK-01', level: 'critical', text: '20 Ghost Trainees detected in Batch PMKVY/KA/TUM-0417/B04 (Tumakuru Skill Academy) — 71.4% shortfall', centreId: 'KA-TUM-0417' },
  { id: 'TK-02', level: 'critical', text: '4 Industrial Sewing Machines & 1 CO₂ fire extinguisher physically absent at Tumakuru Skill Academy', centreId: 'KA-TUM-0417' },
  { id: 'TK-03', level: 'warning',  text: 'Gubbi Skilling Centre idle-workbench ratio 23% across 3 epochs — 7-day observation window active', centreId: 'KA-TUM-0813' },
  { id: 'TK-04', level: 'critical', text: '10 aspirants on Devanahalli portal ledger unreconciled for 12 days — grant freeze in force', centreId: 'KA-BLR-1102' },
  { id: 'TK-05', level: 'info',     text: 'Edge node MADHUGIRI-0702-NODE-A reported 99.8% bandwidth savings with zero DPDP violations', centreId: 'KA-TUM-0702' },
];

/* ---------------------------------------------------------------------------
 * 5. PRIVACY / DPDP ACT 2023 AUDIT LEDGER
 * ------------------------------------------------------------------------ */

export const dpdpLedger = {
  act: 'Digital Personal Data Protection Act, 2023',
  lawfulBasis: 'Section 7(1)(a) — State function / subsidy disbursement verification',
  dataFiduciary: 'Ministry of Skill Development & Entrepreneurship (MSDE)',
  dataProcessor: 'KausalyaDrishti Edge Node (on-premise inference only)',
  retentionDays: 0,
  biometricEmbeddingsStored: 0,
  faceTemplatesStored: 0,
  blurMethod: 'Adaptive Gaussian + 12 px mosaic, applied in-canvas before any frame leaves the GPU buffer',
  principles: [
    { id: 'P-01', title: 'No biometric template ever created', detail: 'The detector emits only anonymous centroid coordinates, never a face embedding or hash.', status: 'Enforced' },
    { id: 'P-02', title: 'Pixel-level redaction before storage', detail: 'Faces are blurred inside the canvas draw loop — unblurred frames never touch disk or network.', status: 'Enforced' },
    { id: 'P-03', title: 'Purpose limitation', detail: 'Headcount + equipment presence only; no emotion, gait or identity analytics are computed.', status: 'Enforced' },
    { id: 'P-04', title: 'Zero-retention telemetry', detail: 'Metadata packets contain counts and confidence, not frames. Keyframes are only captured on violation.', status: 'Enforced' },
    { id: 'P-05', title: 'Data principal rights', detail: 'Aspirant consent notice in Kannada/English is displayed at centre entry and inside SDMS onboarding.', status: 'Enforced' },
  ],
};

/* ---------------------------------------------------------------------------
 * 6. EDGE TELEMETRY SCENARIOS (rural connectivity classes)
 * ------------------------------------------------------------------------ */

export const connectivityProfiles = [
  { id: '2g', label: 'Rural 2G (EDGE/GPRS)', downlinkKbps: 180, uplinkKbps: 90, latencyMs: 620, icon: '📶' },
  { id: '3g', label: 'Rural 3G (HSPA+)', downlinkKbps: 1800, uplinkKbps: 700, latencyMs: 240, icon: '📡' },
  { id: '4g', label: '4G LTE (village tower)', downlinkKbps: 12000, uplinkKbps: 4500, latencyMs: 90, icon: '📱' },
];

/** Traditional 24×7 CCTV streaming baseline used in the comparison panel. */
export const legacyStreamProfile = {
  label: 'Traditional 24×7 Video Stream',
  perHourMB: 500,
  perHourCostINR: 148.5,
  framesPerSecond: 30,
  resolutionLabel: '1080p @ 4 Mbps',
  note: 'Fails on rural 2G/3G — the inspector simply cannot pull live video from Pavagada or Madhugiri.',
};

/** KausalyaDrishti edge packet cadence. */
export const edgePacketProfile = {
  label: 'KausalyaDrishti Edge Telemetry',
  payloadKB: 5,
  cadenceMinutes: 15,
  keyframeKB: 48,
};

/* ---------------------------------------------------------------------------
 * 7. GENERATED DOCUMENT TEMPLATES (show-cause notice boilerplate)
 * ------------------------------------------------------------------------ */

export const noticeTemplate = {
  authority: 'Government of Karnataka',
  department: 'Department of Skill Development, Entrepreneurship & Livelihood',
  subjectPrefix: 'SHOW-CAUSE NOTICE — SUBSTANDARD TRAINING DELIVERY / PHYSICAL VERIFICATION MISMATCH',
  referencePrefix: 'KD/DSDEL/TUM/COMPL/2026',
  issuingOfficer: {
    name: 'Dr. Chandrashekaraiah B. N.',
    designation: 'District Skill Development Officer',
    district: 'Tumakuru',
    address: 'Office of the District Skill Development Officer, Mini Vidhana Soudha, Tumakuru — 572 101',
    phone: '0816-227 4400',
    email: 'dsdo-tum@kaushal.karnataka.gov.in',
  },
  penalClauses: [
    'PMKVY 4.0 Guidelines 2024, Clause 12.4 — Recovery of training cost from Training Partner on unverifiable attendance.',
    'PMKVY 4.0 Guidelines 2024, Clause 9.7 — Mandatory physical presence of all sanctioned tool-kit and machinery at the Training Centre.',
    'DDU-GKY Standard Operating Procedures, Para 18 — Disciplinary action for inflated beneficiary claims.',
    'National Skill Qualification Framework (NSQF) Empanelment Terms, Clause 6(b) — Suspension of affiliation for a verification mismatch exceeding 40% of the claimed roster.',
  ],
  timelineDays: 7,
};

/* ---------------------------------------------------------------------------
 * 8. UTILITY FORMATTERS (Indian numbering conventions)
 * ------------------------------------------------------------------------ */

export const formatINR = (value) => {
  const n = Number.isFinite(value) ? Math.round(value) : 0;
  return `₹${n.toLocaleString('en-IN')}`;
};

export const formatINRCompact = (value) => {
  const n = Number.isFinite(value) ? Math.round(value) : 0;
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} Lakh`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n}`;
};

export const formatBytes = (kb) => {
  if (kb >= 1024 * 1024) return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`;
  return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
};

export const formatPct = (value, digits = 1) => `${Number(value || 0).toFixed(digits)}%`;

export const defaultCentreId = 'KA-TUM-0417';
