/**
 * Headless smoke-harness for KausalyaDrishti.
 * Bundled by Vite (SSR mode) and driven by test/setup.mjs under jsdom.
 * Mounts the real <App />, lets the 30-FPS loop run against a stubbed 2D
 * context, then clicks through every portal and enforcement action.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App.jsx';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const findByText = (needle, selector = 'button') =>
  Array.from(document.querySelectorAll(selector)).find((el) => (el.textContent || '').includes(needle));

export async function run() {
  const report = { errors: [], checks: [] };
  const originalError = console.error;
  console.error = (...args) => {
    const msg = args.map(String).join(' ');
    if (!/not wrapped in act/.test(msg)) report.errors.push(msg);
    originalError(...args);
  };
  window.addEventListener('error', (e) => report.errors.push(`window.onerror: ${e.message}`));

  const host = document.createElement('div');
  document.body.appendChild(host);

  const check = (name, condition, detail = '') => {
    report.checks.push({ name, pass: Boolean(condition), detail });
  };

  let root;
  try {
    root = createRoot(host);
    root.render(React.createElement(App));
    await sleep(900);

    // ---------------- Portal 1: edge camera ----------------
    const text1 = document.body.textContent;
    check('Navbar brand renders', text1.includes('KausalyaDrishti'));
    check('Kannada sub-brand renders', text1.includes('ಕೌಶಲ್ಯ ದೃಷ್ಟಿ'));
    check('Portal tabs render', text1.includes('Centre Edge AI Camera') && text1.includes('MSDE Ministry Console'));
    check('Alert ticker shows ghost-trainee alert', /20 Ghost Trainees detected in Batch B04/.test(text1));
    check('Privacy pill active', text1.includes('DPDP Privacy: Active'));
    check('Canvas mounted', document.querySelectorAll('canvas').length > 0);

    const hudText = document.querySelector('.hud') ? document.querySelector('.hud').textContent : '';
    check('HUD renders headcount label', hudText.includes('Physical Headcount'));
    check('HUD renders machinery label', hudText.includes('Machinery Detected'));
    check('HUD renders FPS label', hudText.includes('AI Detection FPS'));
    check('HUD reports 6/10 machinery', /6\s*\/\s*10\s*Active/.test(hudText.replace(/\s+/g, ' ')));
    check('DPDP zero-biometric claim shown', document.body.textContent.includes('Face embeddings stored'));
    check('Bandwidth hero 500 MB shown', document.body.textContent.includes('500'));
    check('Edge packet JSON preview rendered', document.querySelector('.code-block--json')?.textContent.includes('MSDE-KD/EDGE-PKT'));
    check('Bandwidth savings ≥ 99.8%', /99\.9\d%/.test(document.body.textContent));

    // live webcam path (jsdom has no mediaDevices → graceful fallback + toast)
    const liveBtn = findByText('Live Webcam Stream');
    if (liveBtn) {
      liveBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await sleep(500);
      check('Webcam fallback handled gracefully', document.body.textContent.includes('Webcam unavailable') || document.body.textContent.includes('simulated'));
    }
    const simBtn = findByText('Simulated PMKVY Workshop Feed');
    if (simBtn) simBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await sleep(300);

    // privacy toggle
    const privBtn = findByText('Privacy Blur: ON');
    if (privBtn) {
      privBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await sleep(350);
      check('Privacy toggle flips to OFF', document.body.textContent.includes('Privacy Blur: OFF') || document.body.textContent.includes('Face-Blur OFF'));
      const reOn = findByText('Privacy Blur: OFF') || findByText('🔓 Privacy Blur: OFF');
      if (reOn) reOn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await sleep(300);
    }

    // equipment re-scan animation
    const scanBtn = findByText('Trigger Equipment Re-Scan');
    if (scanBtn) {
      scanBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await sleep(500);
      check('Re-scan animation starts', document.body.textContent.includes('RE-SCAN IN PROGRESS') || document.body.textContent.includes('Scanning'));
      await sleep(2200);
    }

    // evidence snapshot capture
    const snapBtn = findByText('Capture Evidence');
    if (snapBtn) {
      snapBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await sleep(300);
      check('Evidence snapshot captured', document.querySelectorAll('.snap img').length > 0);
    }

    // ---------------- Portal 2: audit ----------------
    const auditTab = findByText('Attendance & Infra Audit');
    if (auditTab) auditTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await sleep(600);
    const text2 = document.body.textContent;
    check('Audit centre cards render', document.querySelectorAll('.centre-card').length >= 4);
    check('Ghost trainee fraud banner', text2.includes('CRITICAL GHOST TRAINEE FRAUD'));
    check('71.4% shortfall computed', /71\.4\d?%/.test(text2));
    check('₹1,50,000 leakage computed', text2.includes('₹1,50,000'));
    check('D_att formula displayed', text2.includes('D_att = ((N_portal − N_ai) / N_portal) × 100'));
    check('Roster tally triad', text2.includes('Registered Strength (N_reg)') && text2.includes('Portal Reported Attendance (N_portal)') && text2.includes('AI Physical Headcount (N_ai)'));
    check('Seat map rendered', document.querySelectorAll('.seat').length >= 30);
    check('Carousel thumbs rendered', document.querySelectorAll('.thumb').length >= 3);
    check('Infra score 68% gauge', text2.includes('68') && text2.includes('NON-COMPLIANT'));
    check('Sewing machine 10/6 deficit row', text2.includes('Industrial Sewing Machine'));
    check('Fire safety missing flagged', text2.includes('MISSING SAFETY KIT') || text2.includes('SAFETY EQUIPMENT BREACH'));
    check('Equipment table rows', document.querySelectorAll('.table--equip tbody tr').length === 8);

    // switch batch to the compliant solar batch
    const solarTab = findByText('B09');
    if (solarTab) {
      solarTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await sleep(400);
      check('Batch switch renders green verdict', document.body.textContent.includes('COMPLIANT'));
    }

    // escalate to ministry console
    const escalate = findByText('Escalate to MSDE Console');
    if (escalate) {
      escalate.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await sleep(700);
      check('Escalation switches to ministry portal', document.body.textContent.includes('Central Command Dashboard'));
    } else {
      const msdeTab0 = findByText('MSDE Ministry Console');
      if (msdeTab0) msdeTab0.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await sleep(600);
    }

    // ---------------- Portal 3: MSDE console ----------------
    const text3 = document.body.textContent;
    check('KPI: monitored centres 148', text3.includes('148'));
    check('KPI: active batches 412', text3.includes('412'));
    check('KPI: fraud flags 19', /19/.test(text3));
    check('KPI: leakage prevented ₹14,80,000', text3.includes('14.80 Lakh') || text3.includes('₹14,80,000'));
    check('District heatmap cells', document.querySelectorAll('.heat-cell').length >= 4);
    check('Heatmap has Tumakuru/Bengaluru Rural/Mysuru/Belagavi', ['Tumakuru', 'Bengaluru Rural', 'Mysuru', 'Belagavi'].every((d) => text3.includes(d)));
    check('Leaderboard rows', document.querySelectorAll('.table--leaderboard tbody tr').length >= 4);
    check('Enforcement buttons present', text3.includes('Show-Cause') && text3.includes('Freeze Grant') && text3.includes('Surprise Audit'));

    // generate show-cause notice for the critical centre
    const noticeBtn = findByText('📄 Show-Cause');
    if (noticeBtn) {
      noticeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await sleep(500);
      const modal = document.querySelector('.modal');
      check('Show-cause modal opens', Boolean(modal));
      const modalText = modal ? modal.textContent : '';
      check('Notice carries annexures', modalText.includes('Annexure I') && modalText.includes('Annexure V'));
      check('Notice cites PMKVY clause', /Clause 12\.4/.test(modalText));
      check('Notice includes offence value', modalText.includes('1,50,000'));
      const close = document.querySelector('.modal__close');
      if (close) close.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await sleep(300);
      check('Modal closes', !document.querySelector('.modal'));
    }

    // freeze order eligibility gate (compliant centre must be blocked)
    const freezeButtons = Array.from(document.querySelectorAll('button')).filter((b) => (b.textContent || '').includes('Freeze Grant'));
    const enabled = freezeButtons.filter((b) => !b.disabled);
    check('Freeze gated to eligible centres only', enabled.length >= 1 && enabled.length < freezeButtons.length, `${enabled.length}/${freezeButtons.length} enabled`);
    if (enabled[0]) {
      enabled[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await sleep(400);
      check('Freeze order opens', document.body.textContent.includes('IMMEDIATE FREEZE') || document.body.textContent.includes('FREEZE OF PMKVY'));
      const close2 = document.querySelector('.modal__close');
      if (close2) close2.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await sleep(250);
    }

    // surprise audit order
    const auditBtns = Array.from(document.querySelectorAll('button')).filter((b) => (b.textContent || '').includes('Surprise Audit') && !b.disabled);
    if (auditBtns[0]) {
      auditBtns[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await sleep(400);
      check('Audit order opens', document.body.textContent.includes('FIELD AUDIT ORDER'));
      const close3 = document.querySelector('.modal__close');
      if (close3) close3.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await sleep(250);
    }

    // back to the edge portal and confirm the render loop survived
    const edgeTab = findByText('Centre Edge AI Camera');
    if (edgeTab) edgeTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await sleep(900);
    check('Returned to edge portal with live canvas', document.querySelectorAll('.feed-canvas').length > 0);
    check('FPS counter reporting', /(\d+)\s*FPS/.test(document.body.textContent));

    root.unmount();
    await sleep(150);
  } catch (err) {
    report.errors.push(`HARNESS EXCEPTION: ${err && err.stack ? err.stack : err}`);
    try {
      if (root) root.unmount();
    } catch (e) {
      /* ignore */
    }
  }

  console.error = originalError;
  return report;
}
