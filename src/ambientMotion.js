export function isAmbientPaused() {
  return typeof document !== 'undefined' && document.documentElement.dataset.ambientPaused === 'true';
}

export function setAmbientPaused(paused) {
  document.documentElement.dataset.ambientPaused = String(Boolean(paused));
  window.dispatchEvent(new Event('derek-ambient-motion'));
}

export function subscribeAmbientPaused(listener) {
  window.addEventListener('derek-ambient-motion', listener);
  return () => window.removeEventListener('derek-ambient-motion', listener);
}
