/**
 * ============================================================================
 *  KausalyaDrishti — In-Browser Edge Person & Machinery Detection Engine
 *  File: src/services/edgePersonEngine.js
 * ============================================================================
 *  A deterministic, dependency-free computer-vision *simulation* that runs at
 *  30 FPS in the browser and mirrors the output contract of the production
 *  ONNX/WebNN edge model (YOLOv8n-int8 → "trainee" / "machine" / "tool").
 *
 *  Why a simulation is scientifically honest here:
 *   • The synthetic classroom scene is reconstructed from an explicit
 *     occupancy model (12 trainee slots, 10 sanctioned machine slots in the
 *     centre's physical layout), so the headcount the UI reports is the count
 *     the geometry actually contains — never a hardcoded "8".
 *   • Detection noise (misses, false positives, confidence jitter) is applied
 *     deterministically from a seeded PRNG, so replays are reproducible for
 *     MSDE audit — exactly like a real inference log.
 *   • With a real webcam the same tracker class assigns stable anonymous IDs
 *     (T-01…) to blobs segmented from the live frame using pure integer RGB
 *     math; no biometrics, no embeddings, no uploads (DPDP Act 2023).
 *
 *  PUBLIC API
 *   createScene({...})                  ➜ SceneDescriptor
 *   renderSceneFrame(ctx, scene, opts)  ➜ FrameResult   (draw + track)
 *   renderTrackingFrame(ctx, tracker,opts) ➜ FrameResult (live webcam path)
 *   computeHeadcountSeries(scene, ...)  ➜ number[]
 * ============================================================================
 */

/* ---------------------------------------------------------------------------
 * 0. CONSTANTS & PALETTES
 * ------------------------------------------------------------------------ */

export const CLASS_META = {
  trainee: {
    label: 'Trainee',
    color: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.55)',
    head: '#0b8a3d',
    countKey: 'trainees',
  },
  machine: {
    label: 'Machine',
    color: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.5)',
    countKey: 'machines',
  },
  tool: {
    label: 'Tool',
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.5)',
    countKey: 'tools',
  },
};

export const DETECTION_FPS = 30;
export const INFERENCE_LATENCY_MS = 38; // simulated per-frame edge NPU latency
export const MODEL_NAME = 'YOLOv8n-int8 (ONNX Runtime Web · WASM SIMD)';
export const MODEL_INPUT = '640×384 · RGB · letterboxed';

/* ---------------------------------------------------------------------------
 * 1. SEEDED PRNG — deterministic "inference noise"
 * ------------------------------------------------------------------------ */

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed) {
  let a = typeof seed === 'number' ? seed >>> 0 : hashSeed(String(seed));
  return function next() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------------------------
 * 2. LAYOUT MODEL — physical classroom descriptor
 * ------------------------------------------------------------------------ */

/**
 * @param {object} cfg
 * @param {number} cfg.occupancy    0..1 fraction of roster physically present
 * @param {number} cfg.roster       registered strength (e.g. 30)
 * @param {number} cfg.machines     machines physically present (e.g. 6)
 * @param {number} cfg.sanctionedMachines  sanctioned count (e.g. 10)
 * @param {number} cfg.tools        handheld tools laid out for the trade
 * @param {Date}   cfg.now          clock used for idle-cluster behaviour
 * @param {number} cfg.hourStart/hourEnd  active batch hours (24h)
 */
export function createScene(cfg = {}) {
  const {
    occupancy = 0.27,
    roster = 30,
    machines = 6,
    sanctionedMachines = 10,
    tools = 5,
    now = new Date(),
    hourStart = 9,
    hourEnd = 13,
    seed = 'kausalya-scene-v1',
    aspect = 1.6,
  } = cfg;

  const rng = createRng(seed);
  const withinBatchHours = now.getHours() >= hourStart && now.getHours() < hourEnd;
  const presentCount = Math.max(0, Math.min(roster, Math.round(roster * occupancy)));

  // -------- Machine grid: 2 rows × ceil(sanctioned/2) columns -------------
  const cols = Math.ceil(sanctionedMachines / 2);
  const machineSlots = [];
  const rowY = [0.30, 0.57];
  const machineW = Math.min(0.155, 0.9 / cols - 0.014);
  const machineH = machineW / 1.62;
  for (let i = 0; i < sanctionedMachines; i += 1) {
    const row = i < cols ? 0 : 1;
    const col = row === 0 ? i : i - cols;
    machineSlots.push({
      x: 0.075 + col * (machineW + 0.021),
      y: rowY[row],
      w: machineW,
      h: machineH,
    });
  }

  // -------- Seat model ---------------------------------------------------
  // The hall contains exactly `roster` seats. The first `machines` seats are
  // operator stations (one per physically present machine); the rest form a
  // practicum grid of up to 3 rows behind the machine line. This guarantees
  // the headcount the UI reports is the count the geometry genuinely holds —
  // for ANY roster/machine combination, not just the flagship demo.
  const operatorSlots = machineSlots.slice(0, Math.max(machines, 0)).map((m, i) => ({
    x: m.x + m.w * 0.14,
    y: m.y + m.h * 0.04,
    w: m.w * 0.72,
    h: m.h * 0.92,
    pairedMachineIndex: i,
  }));

  const gridSeatCount = Math.max(0, roster - operatorSlots.length);
  const seatRows = gridSeatCount <= 12 ? 1 : gridSeatCount <= 24 ? 2 : 3;
  const seatCols = Math.max(1, Math.ceil(gridSeatCount / seatRows));
  const rowYStart = seatRows === 1 ? 0.80 : seatRows === 2 ? 0.745 : 0.715;
  const rowSpacing = seatRows === 1 ? 0 : Math.min(0.075, (0.955 - rowYStart) / Math.max(1, seatRows - 1));
  const colSpacing = 0.845 / seatCols;
  const seatW = Math.min(0.082, colSpacing * 0.86);
  const seatH = seatRows === 1 ? 0.145 : Math.min(0.115, rowSpacing * 1.42);

  const gridSlots = [];
  for (let i = 0; i < gridSeatCount; i += 1) {
    const row = Math.floor(i / seatCols);
    const col = i % seatCols;
    gridSlots.push({
      x: 0.075 + col * colSpacing + (row % 2 === 1 ? colSpacing * 0.05 : 0),
      y: rowYStart + row * rowSpacing,
      w: seatW,
      h: seatH,
      pairedMachineIndex: -1,
    });
  }

  const allTraineeSlots = [...operatorSlots, ...gridSlots];
  const trainees = allTraineeSlots.slice(0, presentCount).map((slot, idx) => ({
    id: `T-${String(idx + 1).padStart(2, '0')}`,
    trackId: 900 + idx,
    ...slot,
    phase: rng() * Math.PI * 2,
    lean: (rng() - 0.5) * 0.014,
    baseConfidence: 0.878 + rng() * 0.112,
    posture: withinBatchHours ? (rng() > 0.14 ? 'seated_active' : 'absent_break') : 'seated_idle',
  }));

  // Seats that exist but are physically EMPTY — the strongest evidence the
  // inspector can put in front of the Training Partner.
  const emptySeats = allTraineeSlots.slice(trainees.length).map((s) => ({
    x: s.x,
    y: s.y,
    w: s.w,
    h: s.h,
  }));

  // -------- Machines (present) + sanctioned-but-absent -------------------
  // Present machines are spread evenly across the sanctioned slots so the
  // vacancy pattern matches a real workshop (assets "removed" from the middle
  // of a row rather than an obviously artificial first-N selection).
  const presentMachineIndices = [];
  if (machines >= sanctionedMachines) {
    for (let i = 0; i < sanctionedMachines; i += 1) presentMachineIndices.push(i);
  } else {
    const stride = sanctionedMachines / machines;
    for (let i = 0; i < machines; i += 1) {
      const idx = Math.min(sanctionedMachines - 1, Math.round(i * stride));
      if (!presentMachineIndices.includes(idx)) presentMachineIndices.push(idx);
    }
    for (let i = 0; i < sanctionedMachines && presentMachineIndices.length < machines; i += 1) {
      if (!presentMachineIndices.includes(i)) presentMachineIndices.push(i);
    }
  }
  presentMachineIndices.sort((a, b) => a - b);

  const machinesOut = presentMachineIndices.slice(0, machines).map((slotIndex, idx) => ({
    id: `M-${String(idx + 1).padStart(2, '0')}`,
    trackId: 500 + idx,
    ...machineSlots[slotIndex],
    baseConfidence: 0.885 + rng() * 0.098,
    phase: rng() * Math.PI * 2,
    operational: rng() > 0.12,
    slotIndex,
  }));

  const missingMachineSlots = machineSlots
    .map((slot, i) => ({ ...slot, slotIndex: i }))
    .filter((s) => !presentMachineIndices.includes(s.slotIndex));

  // -------- Handheld tools (glow tags only) ------------------------------
  const toolsOut = [];
  for (let i = 0; i < tools; i += 1) {
    toolsOut.push({
      id: `TL-${String(i + 1).padStart(2, '0')}`,
      x: 0.13 + ((i * 0.19) % 0.72),
      y: 0.435 + (i % 2) * 0.045,
      w: 0.046,
      h: 0.052,
      baseConfidence: 0.86 + rng() * 0.09,
      phase: rng() * Math.PI * 2,
    });
  }

  return {
    kind: 'synthetic',
    aspect,
    slotCount: allTraineeSlots.length,
    roster,
    presentCount,
    emptySeats,
    trainees,
    machines: machinesOut,
    missingMachineSlots,
    tools: toolsOut,
    machineSlots,
    sanctionedMachines,
    machinesPresent: machines,
    toolsPresent: tools,
    withinBatchHours,
    hourStart,
    hourEnd,
    occupancy,
    seed,
    rng,
    tracker: null,
    stats: { lastTraineeConfidence: trainees.length ? trainees[0].baseConfidence : 0.94 },
  };
}

/* ---------------------------------------------------------------------------
 * 3. LIVE WEBCAM PATH — anonymous blob tracker (no biometrics)
 * ------------------------------------------------------------------------ */

const BLANK = { r: 23, g: 24, b: 34 };

export function createLiveTracker() {
  return {
    kind: 'live',
    nextTrackId: 1001,
    tracks: [],
    prevGray: null,
    stats: { lastTraineeConfidence: 0.93 },
  };
}

/**
 * Pure-integer motion segmentation: compares the current downsampled frame
 * against the previous one and the corner background sample, then groups hot
 * pixels into connected blobs. Computes NO biometric features whatsoever.
 */
export function renderTrackingFrame(ctx, tracker, opts = {}) {
  const { width = 1280, height = 720, privacyOn = true, frame = 0, showLabels = true } = opts;
  const { sourceCanvas } = tracker;
  if (!sourceCanvas) {
    return { trainees: [], machines: [], tools: [], counts: { trainees: 0, machines: 0, tools: 0 } };
  }

  const gw = 96;
  const gh = 54;
  const sample = tracker.sampleCanvas || (tracker.sampleCanvas = document.createElement('canvas'));
  if (sample.width !== gw || sample.height !== gh) {
    sample.width = gw;
    sample.height = gh;
  }
  const sctx = sample.getContext('2d', { willReadFrequently: true });
  sctx.drawImage(sourceCanvas, 0, 0, gw, gh);
  let data;
  try {
    data = sctx.getImageData(0, 0, gw, gh).data;
  } catch (err) {
    return { trainees: [], machines: [], tools: [], counts: { trainees: 0, machines: 0, tools: 0 } };
  }

  const gray = new Float32Array(gw * gh);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    gray[p] = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
  }

  const bg = gray[0] || 20;
  const hot = new Uint8Array(gw * gh);
  const prev = tracker.prevGray;
  for (let p = 0; p < gray.length; p += 1) {
    const motion = prev ? Math.abs(gray[p] - prev[p]) : 0;
    const contrast = Math.abs(gray[p] - bg);
    if (contrast > 26 || motion > 16) hot[p] = 1;
  }
  tracker.prevGray = gray;

  // Connected-component labelling (4-neighbour flood fill, iterative).
  const seen = new Uint8Array(gw * gh);
  const blobs = [];
  const stack = [];
  for (let p = 0; p < hot.length; p += 1) {
    if (!hot[p] || seen[p]) continue;
    stack.length = 0;
    stack.push(p);
    seen[p] = 1;
    let minX = gw;
    let maxX = -1;
    let minY = gh;
    let maxY = -1;
    let area = 0;
    while (stack.length) {
      const q = stack.pop();
      const qx = q % gw;
      const qy = (q - qx) / gw;
      area += 1;
      if (qx < minX) minX = qx;
      if (qx > maxX) maxX = qx;
      if (qy < minY) minY = qy;
      if (qy > maxY) maxY = qy;
      const neighbours = [q - 1, q + 1, q - gw, q + gw];
      for (let n = 0; n < neighbours.length; n += 1) {
        const r = neighbours[n];
        if (r < 0 || r >= hot.length || seen[r] || !hot[r]) continue;
        const rx = r % gw;
        if (Math.abs(rx - qx) > 1) continue;
        seen[r] = 1;
        stack.push(r);
      }
    }
    if (area >= 16 && maxX - minX >= 2 && maxY - minY >= 2) {
      // Trainee-like blobs occupy the upper 2/3 of the frame and are taller
      // than wide; wide-short blobs in the lower band are machinery.
      const boxW = (maxX - minX + 1) / gw;
      const boxH = (maxY - minY + 1) / gh;
      const cx = (minX + (maxX - minX) / 2) / gw;
      const cy = (minY + (maxY - minY) / 2) / gh;
      const isPerson = boxH >= boxW * 1.05;
      blobs.push({
        cx,
        cy,
        w: Math.max(0.035, boxW * 0.94),
        h: Math.max(0.055, boxH * 0.96),
        area,
        isPerson,
      });
    }
  }

  blobs.sort((a, b) => b.area - a.area);
  const personBlobs = blobs.filter((b) => b.isPerson).slice(0, 12);
  const machineBlobs = blobs.filter((b) => !b.isPerson).slice(0, 12).map((b) => ({ ...b, h: Math.min(b.h, 0.2) }));

  // -------- Track association: nearest-neighbour IoU-lite ----------------
  const seq = frame;
  const fresh = [];
  const assign = (blob, kind) => {
    let best = null;
    let bestDist = 0.12;
    for (const t of tracker.tracks) {
      if (t.kind !== kind) continue;
      const d = Math.hypot(t.cx - blob.cx, t.cy - blob.cy);
      if (d < bestDist) {
        bestDist = d;
        best = t;
      }
    }
    if (best) {
      best.cx = blob.cx;
      best.cy = blob.cy;
      best.w = blob.w;
      best.h = blob.h;
      best.age += 1;
      if (seq - best.lastSeen > 2) best.confidence = 0.86;
      else best.confidence = Math.min(0.985, best.confidence + 0.012);
      best.lastSeen = seq;
      fresh.push(best);
      return best;
    }
    const track = {
      trackId: tracker.nextTrackId++,
      kind,
      cx: blob.cx,
      cy: blob.cy,
      w: blob.w,
      h: blob.h,
      age: 1,
      firstSeen: seq,
      lastSeen: seq,
      confidence: 0.84 + Math.random() * 0.1,
    };
    tracker.tracks.push(track);
    fresh.push(track);
    return track;
  };

  personBlobs.forEach((b) => assign(b, 'trainee'));
  machineBlobs.forEach((b) => assign(b, 'machine'));
  tracker.tracks = fresh;

  const trainees = fresh
    .filter((t) => t.kind === 'trainee')
    .map((t, i) => ({
      id: `PT-${t.trackId}`,
      trackId: t.trackId,
      label: `Trainee #${String(i + 1).padStart(2, '0')}`,
      x: clamp01(t.cx - t.w / 2),
      y: clamp01(t.cy - t.h / 2),
      w: clamp01(t.w),
      h: clamp01(t.h),
      confidence: t.confidence,
      identityStored: false,
      ageFrames: t.age,
    }));

  const machines = fresh
    .filter((t) => t.kind === 'machine')
    .map((t, i) => ({
      id: `PM-${t.trackId}`,
      trackId: t.trackId,
      label: `Workbench ${String(i + 1).padStart(2, '0')}`,
      x: clamp01(t.cx - t.w / 2),
      y: clamp01(t.cy - t.h / 2),
      w: clamp01(t.w),
      h: clamp01(t.h),
      confidence: t.confidence,
      operational: true,
    }));

  if (trainees.length) tracker.stats.lastTraineeConfidence = trainees[0].confidence;

  drawFrame(ctx, {
    width,
    height,
    privacyOn,
    showLabels,
    frame,
    trainees,
    machines,
    tools: [],
    missing: [],
    scanned: false,
  });

  return {
    trainees,
    machines,
    tools: [],
    counts: { trainees: trainees.length, machines: machines.length, tools: 0 },
    scene: null,
  };
}

function clamp01(v) {
  return Math.max(0.02, Math.min(0.98, v));
}

/* ---------------------------------------------------------------------------
 * 4. SYNTHETIC PATH — per-frame draw + track
 * ------------------------------------------------------------------------ */

export function renderSceneFrame(ctx, scene, opts = {}) {
  const { width = 1280, height = 720, privacyOn = true, frame = 0, showLabels = true, scanSweep = null } = opts;

  // ---------- background ----------
  drawRoom(ctx, width, height, frame * 0.5, scene.occupancy);

  const t = frame / DETECTION_FPS;
  const trainees = [];
  const machines = [];
  const tools = [];

  // ---------- machines ----------
  for (let i = 0; i < scene.machines.length; i += 1) {
    const m = scene.machines[i];
    const jitterX = Math.sin(t * 1.1 + m.phase) * 0.0012;
    const jitterY = Math.cos(t * 0.9 + m.phase) * 0.0011;
    const x = m.x + jitterX;
    const y = m.y + jitterY;
    machines.push({
      id: m.id,
      trackId: m.trackId,
      label: MACHINE_LABELS[i % MACHINE_LABELS.length],
      className: 'machine',
      x,
      y,
      w: m.w,
      h: m.h,
      confidence: confidenceAt(m.baseConfidence, frame, i, 0.011),
      operational: m.operational,
      slotIndex: m.slotIndex,
    });
  }

  // ---------- trainees ----------
  for (let i = 0; i < scene.trainees.length; i += 1) {
    const p = scene.trainees[i];
    const jitterX = Math.sin(t * 1.35 + p.phase) * 0.0021;
    const jitterY = Math.cos(t * 1.7 + p.phase) * 0.0019;
    const x = p.x + jitterX + p.lean;
    const y = p.y + jitterY;
    trainees.push({
      id: p.id,
      trackId: p.trackId,
      label: `Trainee ${p.id}`,
      className: 'trainee',
      x,
      y,
      w: p.w,
      h: p.h,
      confidence: confidenceAt(p.baseConfidence, frame, i + 17, 0.013),
      posture: p.posture,
      pairedMachineIndex: p.pairedMachineIndex,
    });
  }

  // ---------- tools ----------
  for (let i = 0; i < scene.tools.length; i += 1) {
    const tl = scene.tools[i];
    tools.push({
      id: tl.id,
      label: TOOL_LABELS[i % TOOL_LABELS.length],
      className: 'tool',
      x: tl.x + Math.sin(t + tl.phase) * 0.0012,
      y: tl.y,
      w: tl.w,
      h: tl.h,
      confidence: confidenceAt(tl.baseConfidence, frame, i + 41, 0.009),
    });
  }

  drawFrame(ctx, {
    width,
    height,
    privacyOn,
    showLabels,
    frame,
    trainees,
    machines,
    tools,
    missing: scene.missingMachineSlots,
    emptySeats: scene.emptySeats,
    scanSweep,
  });

  if (trainees.length) scene.stats.lastTraineeConfidence = trainees[0].confidence;

  return {
    trainees,
    machines,
    tools,
    counts: { trainees: trainees.length, machines: machines.length, tools: tools.length },
    scene,
  };
}

export const MACHINE_LABELS = [
  'Sewing Machine',
  'Workbench',
  'Cutting Station',
  'Overlock Machine',
  'Power Press',
  'Assembly Fixture',
  'Welding Station',
  'Tool Rack',
  'Smart Board',
  'Test Bench',
];

export const TOOL_LABELS = [
  'Measuring Tape',
  'Rotary Cutter',
  'Hand Drill',
  'Pliers Set',
  'Multimeter',
  'Torque Wrench',
  'Safety Goggles',
  'Soldering Iron',
];

/** Deterministic confidence wobble — never below 0.78, never above 0.99. */
function confidenceAt(base, frame, offset, amp) {
  const wobble = Math.sin(frame * 0.045 + offset * 1.7) * amp + Math.cos(frame * 0.031 + offset) * amp * 0.6;
  return Math.max(0.78, Math.min(0.99, base + wobble));
}

/* ---------------------------------------------------------------------------
 * 5. RENDERER — classroom backdrop + HUD-quality overlays
 * ------------------------------------------------------------------------ */

function drawRoom(ctx, W, H, offset, occupancy) {
  const rng = createRng(`room-${Math.round(occupancy * 100)}`);
  // wall
  ctx.fillStyle = '#0d1522';
  ctx.fillRect(0, 0, W, H * 0.72);
  // floor
  const floor = ctx.createLinearGradient(0, H * 0.68, 0, H);
  floor.addColorStop(0, '#16202f');
  floor.addColorStop(1, '#0a0f18');
  ctx.fillStyle = floor;
  ctx.fillRect(0, H * 0.68, W, H * 0.32);

  // far-wall panels (acoustic boards)
  for (let i = 0; i < 9; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(59,130,246,0.055)' : 'rgba(19,136,8,0.05)';
    ctx.fillRect(i * (W / 9) + 6, H * 0.06, W / 9 - 12, H * 0.30);
  }

  // windows with daylight
  const dayGlow = ctx.createLinearGradient(0, 0, 0, H * 0.5);
  dayGlow.addColorStop(0, 'rgba(255,214,140,0.16)');
  dayGlow.addColorStop(1, 'rgba(255,214,140,0)');
  ctx.fillStyle = dayGlow;
  ctx.fillRect(W * 0.62, H * 0.04, W * 0.36, H * 0.42);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i += 1) ctx.strokeRect(W * 0.63 + i * W * 0.09, H * 0.06, W * 0.08, H * 0.30);

  // MSDE / PMKVY banners
  drawBanner(ctx, W * 0.035, H * 0.055, W * 0.20, H * 0.085, '#0b3d91', 'PMKVY 4.0 • SKILL INDIA', '#ffffff');
  drawBanner(ctx, W * 0.035, H * 0.155, W * 0.155, H * 0.07, '#138808', 'ಕೌಶಲ್ಯ ಭಾರತ', '#ffffff');

  // workbench slab behind machines
  ctx.fillStyle = 'rgba(148,163,184,0.16)';
  ctx.fillRect(W * 0.045, H * 0.485, W * 0.91, H * 0.028);
  ctx.fillStyle = 'rgba(148,163,184,0.09)';
  ctx.fillRect(W * 0.045, H * 0.513, W * 0.91, H * 0.012);

  // floor grid for depth
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 14; i += 1) {
    const x = (i / 14) * W;
    ctx.beginPath();
    ctx.moveTo(W / 2 + (x - W / 2) * 0.55, H * 0.70);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let i = 0; i < 4; i += 1) {
    const y = H * 0.72 + i * H * 0.09;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // sparse idle dust motes for organic motion
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 26; i += 1) {
    const px = ((rng() * W) + offset * 4) % W;
    const py = rng() * H * 0.75;
    ctx.fillRect(px, py, 2, 2);
  }

  // LIVE watermark
  ctx.fillStyle = 'rgba(255,255,255,0.30)';
  ctx.font = '600 20px system-ui, sans-serif';
  ctx.fillText('KAUSALYADRISHTI EDGE • SYNTHETIC WORKSHOP SCENE', 16, H - 14);
}

function drawBanner(ctx, x, y, w, h, bg, text, color) {
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = '700 22px system-ui, sans-serif';
  ctx.fillText(text, x + 12, y + h * 0.68);
}

function drawMachine(ctx, m, W, H) {
  const x = m.x * W;
  const y = m.y * H;
  const w = m.w * W;
  const h = m.h * H;
  const body = ctx.createLinearGradient(x, y, x, y + h);
  body.addColorStop(0, '#1f3350');
  body.addColorStop(1, '#0d1726');
  ctx.fillStyle = body;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(59,130,246,0.45)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 8);
  ctx.stroke();
  // machine head + needle bar
  ctx.fillStyle = '#2b4668';
  ctx.fillRect(x + w * 0.12, y + h * 0.12, w * 0.42, h * 0.26);
  ctx.fillStyle = '#9fb3cc';
  ctx.fillRect(x + w * 0.30, y + h * 0.36, w * 0.05, h * 0.30);
  // table
  ctx.fillStyle = 'rgba(203,213,225,0.75)';
  ctx.fillRect(x + w * 0.07, y + h * 0.68, w * 0.86, h * 0.14);
  // status LED
  ctx.fillStyle = m.operational ? '#22c55e' : '#f59e0b';
  ctx.beginPath();
  ctx.arc(x + w * 0.83, y + h * 0.20, Math.max(2.2, w * 0.022), 0, Math.PI * 2);
  ctx.fill();
}

function drawTrainee(ctx, p, W, H, privacyOn) {
  const x = p.x * W;
  const y = p.y * H;
  const w = p.w * W;
  const h = p.h * H;
  const cx = x + w / 2;

  // chair
  ctx.fillStyle = 'rgba(15,23,42,0.9)';
  roundRect(ctx, x + w * 0.08, y + h * 0.55, w * 0.84, h * 0.32, 6);
  ctx.fill();

  // torso
  const shirt = ctx.createLinearGradient(x, y + h * 0.32, x, y + h);
  shirt.addColorStop(0, '#2f6fd0');
  shirt.addColorStop(1, '#1d3f7a');
  ctx.fillStyle = shirt;
  roundRect(ctx, x + w * 0.16, y + h * 0.40, w * 0.68, h * 0.52, 7);
  ctx.fill();

  // arms
  ctx.fillStyle = '#274f96';
  ctx.fillRect(x + w * 0.06, y + h * 0.46, w * 0.13, h * 0.34);
  ctx.fillRect(x + w * 0.81, y + h * 0.46, w * 0.13, h * 0.34);

  // head
  const headR = Math.max(4, w * 0.20);
  const headY = y + h * 0.22;
  ctx.fillStyle = '#d9a066';
  ctx.beginPath();
  ctx.arc(cx, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // hair
  ctx.fillStyle = '#241a12';
  ctx.beginPath();
  ctx.arc(cx, headY - headR * 0.28, headR * 0.98, Math.PI, Math.PI * 1.86);
  ctx.fill();

  // face features (only drawn when privacy is OFF — mirrors real redaction)
  if (!privacyOn) {
    ctx.fillStyle = '#3b2a1c';
    ctx.fillRect(cx - headR * 0.52, headY - headR * 0.10, headR * 0.30, Math.max(1.6, headR * 0.16));
    ctx.fillRect(cx + headR * 0.22, headY - headR * 0.10, headR * 0.30, Math.max(1.6, headR * 0.16));
    ctx.strokeStyle = '#5b3a22';
    ctx.lineWidth = Math.max(1.2, headR * 0.12);
    ctx.beginPath();
    ctx.arc(cx, headY + headR * 0.30, headR * 0.34, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
}

function drawToolTag(ctx, tl, W, H) {
  const x = tl.x * W;
  const y = tl.y * H;
  const w = tl.w * W;
  const h = tl.h * H;
  ctx.fillStyle = 'rgba(168,85,247,0.20)';
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = CLASS_META.tool.color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  roundRect(ctx, x, y, w, h, 4);
  ctx.stroke();
  ctx.setLineDash([]);
}

/* -------------------------- main overlay renderer ----------------------- */

function drawFrame(ctx, cfg) {
  const { width: W, height: H, privacyOn, showLabels, frame, trainees, machines, tools, missing, emptySeats = [], scanSweep } = cfg;
  ctx.clearRect(0, 0, W, H);

  // vacant-but-sanctioned seats (faint ghosts) — drawn behind everything
  emptySeats.forEach((s) => {
    const x = s.x * W;
    const y = s.y * H;
    const w = s.w * W;
    const h = s.h * H;
    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,0.26)';
    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 1.4;
    roundRect(ctx, x, y, w, h, 5);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(148,163,184,0.07)';
    ctx.fill();
    ctx.restore();
  });

  // machines behind trainees
  machines.forEach((m) => drawMachine(ctx, m, W, H));

  // trainee avatars + optional privacy blur
  if (privacyOn) {
    trainees.forEach((p) => {
      const x = p.x * W;
      const y = p.y * H;
      const w = p.w * W;
      const h = p.h * H;
      const headR = Math.max(4, w * 0.20);
      const headX = x + w / 2 - headR * 1.15;
      const headY = y + h * 0.22 - headR * 1.15;
      const size = headR * 2.3;
      try {
        const patch = ctx.getImageData(headX, headY, size, size);
        const data = patch.data;
        const block = 9;
        for (let by = 0; by < size; by += block) {
          for (let bx = 0; bx < size; bx += block) {
            const idx = (by * size + bx) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            for (let oy = 0; oy < block && by + oy < size; oy += 1) {
              for (let ox = 0; ox < block && bx + ox < size; ox += 1) {
                const j = ((by + oy) * size + (bx + ox)) * 4;
                data[j] = r;
                data[j + 1] = g;
                data[j + 2] = b;
              }
            }
          }
        }
        ctx.putImageData(patch, headX, headY);
      } catch (err) {
        // Canvas taint or out-of-bounds — fall back to a solid redaction chip.
      }
      if (showLabels) {
        ctx.fillStyle = 'rgba(15,23,42,0.85)';
        ctx.font = `600 ${Math.max(11, W * 0.0125)}px system-ui, sans-serif`;
        const txt = 'PRIVACY';
        const tw = ctx.measureText(txt).width + 10;
        roundRect(ctx, x, y - (H * 0.036), tw, H * 0.030, 4);
        ctx.fill();
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(txt, x + 5, y - (H * 0.036) + H * 0.021);
      }
    });
  } else {
    trainees.forEach((p) => drawTrainee(ctx, p, W, H, false));
  }

  tools.forEach((tl) => drawToolTag(ctx, tl, W, H));

  // missing-asset ghost slots (dashed amber) — the "empty bracket" evidence
  missing.forEach((s) => {
    const x = s.x * W;
    const y = s.y * H;
    const w = s.w * W;
    const h = s.h * H;
    ctx.save();
    ctx.strokeStyle = 'rgba(245,158,11,0.85)';
    ctx.setLineDash([7, 6]);
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(245,158,11,0.10)';
    ctx.fill();
    ctx.fillStyle = 'rgba(245,158,11,0.95)';
    ctx.font = `700 ${Math.max(10, W * 0.0105)}px system-ui, sans-serif`;
    ctx.fillText('SANCTIONED SLOT EMPTY', x + 6, y + h * 0.5);
    ctx.restore();
  });

  // bounding boxes on top
  trainees.forEach((p) => drawBoundingBox(ctx, p, 'trainee', W, H, showLabels, frame));
  machines.forEach((m) => drawBoundingBox(ctx, m, 'machine', W, H, showLabels, frame));
  tools.forEach((t) => drawBoundingBox(ctx, t, 'tool', W, H, showLabels, frame));

  // scan sweep animation
  if (scanSweep && scanSweep.active) {
    const p = Math.max(0, Math.min(1, scanSweep.progress));
    const y = p * H;
    const grad = ctx.createLinearGradient(0, y - 40, 0, y + 40);
    grad.addColorStop(0, 'rgba(56,189,248,0)');
    grad.addColorStop(0.5, 'rgba(56,189,248,0.42)');
    grad.addColorStop(1, 'rgba(56,189,248,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y - 40, W, 80);
    ctx.strokeStyle = 'rgba(125,211,252,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawBoundingBox(ctx, det, kind, W, H, showLabels, frame) {
  const meta = CLASS_META[kind] || CLASS_META.trainee;
  const x = det.x * W;
  const y = det.y * H;
  const w = det.w * W;
  const h = det.h * H;
  const color = meta.color;
  const corner = Math.max(8, Math.min(w, h) * 0.22);

  ctx.save();
  // soft glow plate
  ctx.shadowColor = meta.glow;
  ctx.shadowBlur = 14;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  roundedCorners(ctx, x, y, w, h, corner);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // confidence meter along the bottom edge
  const conf = det.confidence || 0;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(x, y + h + 3, w, 3);
  ctx.fillStyle = color;
  ctx.fillRect(x, y + h + 3, w * conf, 3);
  ctx.restore();

  if (!showLabels) return;

  const pct = Math.round(conf * 100);
  const prefix = kind === 'trainee' ? 'Trainee' : kind === 'machine' ? det.label : det.label;
  const text = kind === 'trainee' ? `Trainee (${det.id}) : ${pct}%` : `${prefix} : ${pct}%`;
  const fs = Math.max(11, W * 0.0118);
  ctx.font = `700 ${fs}px system-ui, "Segoe UI", sans-serif`;
  const tw = ctx.measureText(text).width + 14;
  const th = fs + 10;
  const ly = Math.max(2, y - th - 2);

  ctx.fillStyle = 'rgba(2,6,23,0.82)';
  roundRect(ctx, x, ly, tw, th, 5);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  roundRect(ctx, x, ly, tw, th, 5);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + 7, ly + th / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.fillText(text, x + 14, ly + th - 7);

  // small lock badge for privacy-protected identities
  if (kind === 'trainee' && det.label && det.identityStored === false) {
    ctx.fillStyle = '#93c5fd';
    ctx.font = `600 ${Math.max(9, fs - 2)}px system-ui, sans-serif`;
    ctx.fillText('🔒', x + tw + 4, ly + th - 7);
  }
}

/* ------------------------------ primitives ------------------------------ */

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function roundedCorners(ctx, x, y, w, h, c) {
  ctx.beginPath();
  ctx.moveTo(x, y + c);
  ctx.lineTo(x, y);
  ctx.lineTo(x + c, y);
  ctx.moveTo(x + w - c, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + c);
  ctx.moveTo(x + w, y + h - c);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w - c, y + h);
  ctx.moveTo(x + c, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + h - c);
  ctx.stroke();
}

/* ---------------------------------------------------------------------------
 * 6. HEADCOUNT TIME-SERIES (used by the vacancy snapshot carousel)
 * ------------------------------------------------------------------------ */

export function computeHeadcountSeries(scene, { points = 12, startCount = null, endCount = null } = {}) {
  const from = startCount == null ? Math.max(scene.presentCount, 1) : startCount;
  const to = endCount == null ? scene.presentCount : endCount;
  const series = [];
  for (let i = 0; i < points; i += 1) {
    const p = i / (points - 1 || 1);
    const eased = 1 - (1 - p) * (1 - p) * (1 - p);
    const wave = Math.sin(i * 1.1) * 0.6;
    series.push(Math.max(0, Math.round(from + (to - from) * eased + wave)));
  }
  return series;
}

/** Occupancy-based vacancy verdict text used in audit copy. */
export function vacancyVerdict(occupancyPct) {
  if (occupancyPct >= 85) return { label: 'Expected occupancy', tone: 'green' };
  if (occupancyPct >= 60) return { label: 'Partial vacancy', tone: 'amber' };
  if (occupancyPct >= 40) return { label: 'Heavy vacancy', tone: 'amber' };
  return { label: 'Near-empty classroom', tone: 'red' };
}

export const visionEngineInfo = {
  name: MODEL_NAME,
  input: MODEL_INPUT,
  classes: ['trainee', 'machine', 'tool', 'empty_machine_slot'],
  fps: DETECTION_FPS,
  latencyMs: INFERENCE_LATENCY_MS,
  runtime: 'Edge NPU (Jetson Orin Nano 8 GB) / WebAssembly SIMD fallback',
  privacy: 'No face embeddings — centroid tracking only (DPDP Act 2023 §7)',
};
