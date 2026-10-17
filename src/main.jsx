import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove the pre-hydration boot splash once React has painted.
if (typeof window !== 'undefined') {
  window.requestAnimationFrame(() => {
    const splash = document.querySelector('.boot-splash');
    if (splash) splash.remove();
  });
}
