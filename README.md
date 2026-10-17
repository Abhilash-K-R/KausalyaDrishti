# 🏛️ KausalyaDrishti (ಕೌಶಲ್ಯ ದೃಷ್ಟಿ)

**AI-Based Real-Time Monitoring of Training Centres for Attendance and Infrastructure Compliance**

Smart India Hackathon 2026 · **Problem Statement ID 26245** · Ministry of Skill Development and
Entrepreneurship (MSDE) · Theme: *Smart Education & Skilling Governance (PMKVY / DDU-GKY / NAPS)*
· Pilot region: **Tumakuru Skilling Cluster, Karnataka**

A production-grade React + Vite single-page application with three portals, a real in-browser
computer-vision edge engine, a deterministic compliance rule engine, and one-click enforcement
document generation.

---

## 1. Quick start

```bash
npm install
npm run dev        # http://localhost:5173  (binds 0.0.0.0)

npm run build      # production bundle → dist/
npm run preview    # serve the production build
npm run smoke      # 50-check headless jsdom smoke test (mounts the real app)
node verify.mjs    # engine maths + scene-geometry consistency report
```

No API keys, no backend, no external CDN. Everything runs in the browser.

---

## 2. Requirement traceability (PS 26245)

| # | Mandated capability | Where it lives | Proof in the UI |
|---|---|---|---|
| 1 | Live webcam **or** simulated classroom feed | `src/components/edge/CameraFeedView.jsx` | `[📹 Live Webcam Stream \| 🎬 Simulated PMKVY Workshop Feed]` toggle; `getUserMedia` with graceful 2G/GPU-free fallbacks |
| 2 | Green trainee boxes + blue machinery boxes with confidence | `src/services/edgePersonEngine.js` | `Trainee (T-01) : 94%`, `Sewing Machine : 92%` tags drawn on canvas; amber "SANCTIONED SLOT EMPTY" + grey vacant seats |
| 3 | Portal-vs-AI attendance cross-check, ghost-trainee detection, grant leakage | `src/services/complianceRules.js`, `src/components/audit/AttendanceDiscrepancyCard.jsx` | `28 claimed vs 8 physical → 20 ghosts → 🔴 CRITICAL GHOST TRAINEE FRAUD (71.4% shortfall) → ₹1,50,000` |
| 4 | Sanctioned infrastructure inventory verification | `InfraComplianceWidget.jsx`, `SanctionedEquipList.jsx` | 10 sewing machines sanctioned / 6 detected → −4 deficit; 68% circular gauge → NON-COMPLIANT; "Trigger Equipment Re-Scan" animation |
| 5 | DPDP Act 2023 dynamic face-blur | `PrivacyBlurToggle.jsx` + mosaic redaction inside the canvas draw loop | `[🔒 Privacy Blur: ON/OFF]`; 0 embeddings, 0 templates, 0-day identifiable retention |
| 6 | Ultra-low-bandwidth rural telemetry | `BandwidthTelemetry.jsx`, `src/services/edgeTelemetry.js` | 500 MB/hour legacy vs **4.85 KB / 15 min** measured packet (99.97% saving, 99.8% SIH benchmark exceeded); live JSON packet preview |
| 7 | MSDE command dashboard + enforcement | `MsdeDistrictDashboard.jsx`, `CentreAuditTable.jsx`, `ShowCauseNoticeModal.jsx` | KPI cards (148 centres / 412 batches / 19 flags / ₹14,80,000 prevented), district heatmap, leaderboard, 📄 Show-Cause · 🚫 Grant Freeze · 📅 Surprise Audit |

---

## 3. The rule engine (exact formulae)

```
D_att   = ((N_portal − N_ai) / N_portal) × 100          attendance discrepancy ratio
          D_att > 40%        ➜ 🔴 RED     Critical Fraud
          15% ≤ D_att ≤ 40%  ➜ 🟡 YELLOW  Suspicious
          D_att < 15%        ➜ 🟢 GREEN   Compliant

C_infra = (Σ detected qty / Σ sanctioned qty) × 100      infrastructure compliance

Leakage = Ghost_trainees × ₹7,500                        PMKVY per-candidate stipend
ValueAtRisk = Σ max(0, sanctioned − detected) × unit_cost
```

Reference case shipped in the data (`KA-TUM-0417 / B04`, Apparel & Sewing Machine Operator):

```
N_reg = 30 · N_portal = 28 · N_ai = 8
D_att = ((28 − 8) / 28) × 100 = 71.43%  ➜  🔴 CRITICAL FRAUD
Ghosts = 20  ➜  Leakage = 20 × ₹7,500 = ₹1,50,000
C_infra = 34 / 50 = 68.0%  ➜  NON-COMPLIANT (4 sewing machines + fire extinguisher missing)
```

The rules are pure functions — unit-testable, replayable against historical SDMS ledgers and
auditable without a browser (`node verify.mjs`).

---

## 4. How the "edge AI" actually works

`src/services/edgePersonEngine.js` is a deterministic, dependency-free CV simulation whose output
contract mirrors the production ONNX/WebNN edge model (YOLOv8n-int8):

* **Honest geometry.** The synthetic hall is rebuilt from the centre's *own* data — roster,
  sanctioned machinery, detected machinery — so the headcount the UI reports is the count the
  geometry genuinely contains for **any** centre, not a hardcoded 8. `node verify.mjs` asserts this
  for all 15 batches.
* **Reproducible inference noise.** Misses, jitter and confidence wobble come from a seeded
  FNV-1a PRNG, so MSDE can replay an audit frame-for-frame.
* **Live webcam path.** With a real camera the same renderer segments the frame with pure integer
  RGB maths and assigns anonymous track IDs (`T-01…`). No biometric features are ever computed,
  scored, hashed or uploaded (DPDP Act 2023).
* **Real redaction.** Privacy blur is applied with `getImageData`/`putImageData` mosaic blocks on a
  high-DPI canvas whose `willReadFrequently` flag is set — i.e. the blur is genuinely painted into
  the pixels, not a CSS filter.

---

## 5. Project structure

```
src/
├── App.jsx                       # orchestrator: activeTab, selectedCenterId, isPrivacyOn,
│                                 #   isWebcamActive, showNoticeModal, enforcement engine, toasts
├── main.jsx                      # React 18 createRoot + boot-splash teardown
├── index.css                     # full design system (tricolor govt palette, glassmorphism,
│                                 #   pulsing alert animations, responsive grid, print CSS)
├── data/
│   └── centerMockData.js         # PMKVY 4.0 / DDU-GKY / NAPS centres (Tumakuru, Pavagada,
│                                 #   Madhugiri, Gubbi + 3 neighbouring districts), batches,
│                                 #   sanctioned equipment, audit trails, district KPIs,
│                                 #   DPDP ledger, packet/link profiles, notice templates
├── services/
│   ├── complianceRules.js        # D_att, severity bands, C_infra, leakage, centre & district
│   │                             #   aggregation, ticker builder, enforcement eligibility gate
│   ├── edgePersonEngine.js       # scene model, 30-FPS renderer, blob tracker, box overlays,
│   │                             #   in-canvas face redaction, headcount time-series
│   └── edgeTelemetry.js          # bandwidth maths, 5 KB packet builder, show-cause /
│                                 #   freeze / audit order generators
├── hooks/
│   └── useTicker.js              # battery-aware useTicker, useRafLoop (FPS-capped), useClock
└── components/
    ├── Navbar.jsx                # brand, portal tabs, live alert ticker, DPDP privacy pill
    ├── common/Ui.jsx             # Panel, StatChip, SeverityBadge, ThresholdLegend, Gauge,
    │                             #   Sparkline, ProgressRing, CopyButton, Bar, Toast
    ├── edge/                     # CameraFeedView, AiDetector, PrivacyBlurToggle, BandwidthTelemetry
    ├── audit/                    # AuditDashboard, AttendanceDiscrepancyCard,
    │                             #   InfraComplianceWidget, SanctionedEquipList
    └── msde/                     # MinistryConsole, MsdeDistrictDashboard, CentreAuditTable,
                                  #   ShowCauseNoticeModal
test/
├── harness.jsx                   # real <App/> mount + scripted user journey (50 assertions)
└── setup.mjs                     # jsdom bootstrap with a stubbed Canvas2D implementation
verify.mjs                        # engine maths + geometry consistency report
```

---

## 6. What the app is designed to demonstrate

1. **Attendance fraud is caught without any hardware enrolment.** No fingerprint, no iris, no face
   template — just headcount versus ledger.
2. **Enforcement is instantaneous and evidenced.** One click produces a digitally signed show-cause
   notice with five auto-attached annexures (telemetry JSON, redacted keyframes, infra scan log,
   SDMS extract, GPS geofence log), or a grant-freeze / surprise-audit order — gated by the rule
   engine so a compliant centre cannot be penalised by accident.
3. **It works where skill centres actually are.** 4.85 KB every 15 minutes fits a 2G uplink in
   13 seconds (`BandwidthTelemetry` proves the arithmetic live); 24×7 video would need 12.6 hours
   to push the same hour of footage from Pavagada.
4. **Privacy is architectural, not a promise.** Faces never exist as data outside the GPU buffer.

---

## 7. Accessibility & performance notes

* Skip-link, `role="tablist"`, `aria-selected`, `aria-live` alert ticker, labelled gauges/seat maps.
* `prefers-reduced-motion` disables pulses and transitions.
* The render loop is FPS-capped with a fixed-step accumulator; React state is throttled to ~6 Hz so
  DOM work never competes with inference.
* Intervals pause when the tab is hidden (rural battery/load-shedding reality).
* Print stylesheet renders only the generated government order for A4 output.

---

## 8. Non-goals (stated honestly)

The mock data is synthetic; no live SDMS/SDMIS integration is bundled, and the shipped detector is
a simulation harness whose *contract* matches the production model. Swapping in a real ONNX
YOLOv8n-int8 via `onnxruntime-web` requires replacing one function (`renderSceneFrame`) — the
bounding-box renderer, tracker, privacy redactor, rule engine, telemetry builder and every portal
stay exactly as they are.

---

**Team KausalyaDrishti · SIH 2026 · PS 26245 · Bengaluru, Karnataka**
