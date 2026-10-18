/**
 * jsdom bootstrap for the KausalyaDrishti smoke harness.
 * Provides a stubbed Canvas2D implementation so the real 30-FPS render loop
 * executes end-to-end (drawing calls included) without a GPU.
 *
 *   npm run smoke
 */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'https://localhost/',
  pretendToBeVisual: true,
});

const { window } = dom;

/* ---------------------------- fake Canvas 2D API --------------------------- */
const gradient = { addColorStop() {} };
const ctxStub = () => ({
  canvas: null,
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  shadowColor: '',
  shadowBlur: 0,
  globalAlpha: 1,
  clearRect() {},
  fillRect() {},
  strokeRect() {},
  beginPath() {},
  closePath() {},
  moveTo() {},
  lineTo() {},
  quadraticCurveTo() {},
  arc() {},
  fill() {},
  stroke() {},
  save() {},
  restore() {},
  setTransform() {},
  scale() {},
  translate() {},
  rotate() {},
  drawImage() {},
  setLineDash() {},
  fillText() {},
  measureText: (t) => ({ width: String(t).length * 7 }),
  createLinearGradient: () => gradient,
  createRadialGradient: () => gradient,
  createPattern: () => null,
  getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }),
  putImageData() {},
});

window.HTMLCanvasElement.prototype.getContext = function getContext() {
  const c = ctxStub();
  c.canvas = this;
  return c;
};
window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,AAAA';
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
Object.defineProperty(window.navigator, 'mediaDevices', { value: undefined, configurable: true });

/* ------------------------------- globals ---------------------------------- */
global.window = window;
try {
  Object.defineProperty(global, 'navigator', { value: window.navigator, configurable: true, writable: true });
} catch {
  // already defined or non-configurable
}

global.document = window.document;
global.HTMLElement = window.HTMLElement;
global.HTMLCanvasElement = window.HTMLCanvasElement;
global.Element = window.Element;
global.Node = window.Node;
global.MouseEvent = window.MouseEvent;
global.Event = window.Event;
global.KeyboardEvent = window.KeyboardEvent;
global.getComputedStyle = window.getComputedStyle.bind(window);
global.requestAnimationFrame = (cb) => window.setTimeout(() => cb(window.performance.now()), 16);
global.cancelAnimationFrame = (id) => window.clearTimeout(id);
// NOTE: keep Node's native `performance` — assigning jsdom's under Node causes
// infinite recursion inside jsdom's PerformanceImpl.now().
global.URL.createObjectURL = () => 'blob:mock';
global.URL.revokeObjectURL = () => {};
global.IS_REACT_ACT_ENVIRONMENT = false;

const { run } = await import('../build/testdist/harness.js');
const report = await run();

const passed = report.checks.filter((c) => c.pass);
const failed = report.checks.filter((c) => !c.pass);

console.log('\n================ KausalyaDrishti SMOKE TEST ================');
report.checks.forEach((c) => {
  console.log(`${c.pass ? '✅' : '❌'} ${c.name}${c.detail ? `  (${c.detail})` : ''}`);
});
console.log('------------------------------------------------------------');
console.log(`Checks: ${passed.length} passed, ${failed.length} failed`);
if (report.errors.length) {
  console.log('\n⚠️  Console errors / exceptions captured:');
  report.errors.slice(0, 3).forEach((e) => console.log('   -', e.split('\n').slice(0, 14).join('\n      ').slice(0, 1800)));
} else {
  console.log('No React runtime errors or exceptions captured. ✅');
}
console.log('============================================================\n');

process.exit(failed.length || report.errors.length ? 1 : 0);
