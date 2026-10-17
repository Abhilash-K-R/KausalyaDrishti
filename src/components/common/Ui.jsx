import React, { useEffect, useMemo, useState } from 'react';

/* ---------------------------------------------------------------------------
 * Panel — glassmorphic section container used by every portal
 * ------------------------------------------------------------------------ */
export function Panel({ title, subtitle, icon, actions, children, tone = 'default', className = '', dense = false }) {
  return (
    <section className={`panel panel--${tone} ${className}`}>
      {(title || actions) && (
        <header className="panel__head">
          <div className="panel__title-wrap">
            {icon && <span className="panel__icon" aria-hidden="true">{icon}</span>}
            <div>
              <h2 className="panel__title">{title}</h2>
              {subtitle && <p className="panel__subtitle">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="panel__actions">{actions}</div>}
        </header>
      )}
      <div className={dense ? 'panel__body panel__body--dense' : 'panel__body'}>{children}</div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * StatChip — compact metric tile
 * ------------------------------------------------------------------------ */
export function StatChip({ label, value, unit, hint, tone = 'neutral', icon }) {
  return (
    <div className={`stat-chip stat-chip--${tone}`}>
      <div className="stat-chip__top">
        {icon && <span className="stat-chip__icon">{icon}</span>}
        <span className="stat-chip__label">{label}</span>
      </div>
      <div className="stat-chip__value">
        {value}
        {unit && <span className="stat-chip__unit">{unit}</span>}
      </div>
      {hint && <div className="stat-chip__hint">{hint}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * SeverityBadge — 🔴 / 🟡 / 🟢 band pill driven by complianceRules output
 * ------------------------------------------------------------------------ */
export function SeverityBadge({ severity, size = 'md', showVerdict = true }) {
  if (!severity) return null;
  return (
    <span
      className={`sev-badge sev-badge--${severity.key} sev-badge--${size}`}
      title={severity.description}
    >
      <span className="sev-badge__dot" />
      {severity.emoji} {showVerdict ? severity.verdict : severity.band}
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * ThresholdLegend — documents the D_att classification matrix on-screen
 * ------------------------------------------------------------------------ */
export function ThresholdLegend({ compact = false }) {
  const bands = [
    { key: 'red', label: 'D_att > 40%', text: '🔴 RED — Critical Fraud', color: '#e02424' },
    { key: 'amber', label: '15% – 40%', text: '🟡 YELLOW — Suspicious', color: '#d97706' },
    { key: 'green', label: 'D_att < 15%', text: '🟢 GREEN — Compliant', color: '#138808' },
  ];
  return (
    <div className={compact ? 'legend legend--compact' : 'legend'}>
      {bands.map((b) => (
        <span key={b.key} className="legend__item">
          <i className="legend__swatch" style={{ background: b.color }} />
          <b>{b.label}</b>
          <span className="legend__text">{b.text}</span>
        </span>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * CopyButton — clipboard with graceful secure-context fallback
 * ------------------------------------------------------------------------ */
export function CopyButton({ text, label = 'Copy', className = '' }) {
  const [state, setState] = useState('idle');

  const copy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', 'readonly');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setState('done');
    } catch (err) {
      setState('fail');
    }
    window.setTimeout(() => setState('idle'), 1800);
  };

  return (
    <button type="button" className={`btn btn--ghost btn--sm ${className}`} onClick={copy}>
      {state === 'done' ? '✅ Copied' : state === 'fail' ? '⚠️ Copy failed' : `📋 ${label}`}
    </button>
  );
}

/* ---------------------------------------------------------------------------
 * Bar — inline proportional bar with an accessible label
 * ------------------------------------------------------------------------ */
export function Bar({ value, max = 100, tone = 'green', height = 8, label }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="bar" role="img" aria-label={label || `${value} of ${max}`}>
      <span className={`bar__fill bar__fill--${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Gauge — circular compliance score dial
 * ------------------------------------------------------------------------ */
export function Gauge({ value, size = 190, thickness = 16, tone = 'auto', caption, subCaption }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const color =
    tone === 'auto'
      ? clamped >= 90
        ? '#138808'
        : clamped >= 75
        ? '#0ea5e9'
        : clamped >= 60
        ? '#f59e0b'
        : '#e02424'
      : tone;

  return (
    <div className="gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Compliance score ${clamped}%`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 800ms cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <div className="gauge__center">
        <span className="gauge__value" style={{ color }}>
          {clamped.toFixed(0)}
          <small>%</small>
        </span>
        {caption && <span className="gauge__caption">{caption}</span>}
        {subCaption && <span className="gauge__sub">{subCaption}</span>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Sparkline — inline SVG headcount history
 * ------------------------------------------------------------------------ */
export function Sparkline({ values = [], width = 260, height = 56, color = '#38bdf8', fill = 'rgba(56,189,248,0.16)', max = null }) {
  const path = useMemo(() => {
    if (!values.length) return { line: '', area: '' };
    const hi = max == null ? Math.max(...values, 1) : max;
    const stepX = values.length > 1 ? width / (values.length - 1) : width;
    const pts = values.map((v, i) => [i * stepX, height - (Math.max(0, Math.min(hi, v)) / hi) * (height - 6) - 3]);
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area = `${line} L${width},${height} L0,${height} Z`;
    return { line, area };
  }, [values, width, height, max]);

  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {path.area && <path d={path.area} fill={fill} />}
      {path.line && <path d={path.line} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />}
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Toast — transient confirmation ribbon
 * ------------------------------------------------------------------------ */
export function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(id);
  }, [toast, onDismiss]);

  if (!toast) return null;
  return (
    <div className={`toast toast--${toast.tone || 'info'}`} role="status">
      <span className="toast__icon">{toast.tone === 'danger' ? '🚫' : toast.tone === 'success' ? '✅' : 'ℹ️'}</span>
      <div className="toast__body">
        <strong>{toast.title}</strong>
        {toast.message && <span>{toast.message}</span>}
      </div>
      <button type="button" className="toast__close" onClick={onDismiss} aria-label="Dismiss notification">
        ✕
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * ProgressRing — small inline ring for per-row scores
 * ------------------------------------------------------------------------ */
export function ProgressRing({ value, size = 46, thickness = 5, label }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const color = v >= 90 ? '#22c55e' : v >= 75 ? '#38bdf8' : v >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="pring" style={{ width: size, height: size }} title={label || `${v.toFixed(0)}%`}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${(v / 100) * c} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="pring__val" style={{ color }}>{v.toFixed(0)}</span>
    </div>
  );
}

export default { Panel, StatChip, SeverityBadge, ThresholdLegend, CopyButton, Bar, Gauge, Sparkline, Toast, ProgressRing };
