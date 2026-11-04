import { Component, lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from 'react';
import { motion, useIsPresent, useReducedMotion } from 'motion/react';
import { isAmbientPaused, subscribeAmbientPaused } from '../ambientMotion.js';
import { easeInOut } from '../motion.js';

const ZeroPointCanvas = lazy(() => import('./ZeroPointCanvas.jsx'));

class EnergyBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function EnergyFallback() {
  const id = useId();
  return <svg className="zero-point-energy-fallback" viewBox="0 0 1000 1000" fill="none" aria-hidden="true" focusable="false">
    <defs><linearGradient id={`${id}-energy`}><stop stopColor="#a2f5ff" /><stop offset=".55" stopColor="#2cb6ff" /><stop offset="1" stopColor="#b491ff" /></linearGradient></defs>
    <g className="zero-point-fallback-orbit" stroke={`url(#${id}-energy)`}>
      <circle cx="500" cy="500" r="400" strokeWidth="2" opacity=".85" /><circle cx="500" cy="500" r="409" strokeWidth="6" opacity=".12" />
      <circle className="zero-point-fallback-current" cx="500" cy="500" r="401" strokeWidth="5" strokeDasharray="2 9 30 260" />
      {Array.from({ length: 12 }, (_, index) => <path key={index} d="M900 500C975 430 960 345 909 376S975 520 905 580" transform={`rotate(${index * 30} 500 500)`} strokeWidth={index % 2 ? '1' : '2'} opacity=".45" />)}
    </g>
  </svg>;
}

export default function ZeroPointScreen({ onEnter }) {
  const reduced = useReducedMotion();
  const present = useIsPresent();
  const screen = useRef(null);
  const enter = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [paused, setPaused] = useState(isAmbientPaused);
  const [sceneReady, setSceneReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => setSceneReady(true), []);
  const onFailure = useCallback(() => { setFailed(true); setSceneReady(false); }, []);
  const onEntryProgress = useCallback(progress => {
    screen.current?.style.setProperty('--zero-entry-scale', String(1 + progress * .36));
  }, []);
  const running = mounted && pageVisible && !paused && !reduced;

  useEffect(() => {
    setMounted(true);
    enter.current?.focus({ preventScroll: true });
    const visibility = () => setPageVisible(!document.hidden);
    visibility();
    document.addEventListener('visibilitychange', visibility);
    const unsubscribe = subscribeAmbientPaused(() => setPaused(isAmbientPaused()));
    return () => { unsubscribe(); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  return <motion.section ref={screen} className="zero-point-screen" role="dialog" aria-modal="true" aria-labelledby="zero-point-title" aria-describedby="zero-point-hint" inert={!present || undefined} aria-hidden={!present || undefined} data-running={running} data-entering={!present} data-scene-ready={sceneReady && !failed}
    initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : present ? .65 : .95, ease: easeInOut }}
    onKeyDown={event => {
      if (!present) return;
      if (event.key === 'Tab') {
        event.preventDefault();
        enter.current?.focus({ preventScroll: true });
      }
    }}>
    <h2 className="visually-hidden" id="zero-point-title">The Zero Point</h2>
    <div className="zero-point-cosmos" aria-hidden="true" />
    <div className="zero-point-world" aria-hidden="true"><img src="/images/zero-point/world-interior.png" alt="" width="1254" height="1254" decoding="async" fetchPriority="high" /><div className="zero-point-clouds" /><div className="zero-point-reflection" /></div>
    <div className="zero-point-horizon" aria-hidden="true"><i /></div>
    <EnergyFallback />
    <div className="zero-point-webgl" aria-hidden="true">{mounted && !failed && <EnergyBoundary onFailure={onFailure}><Suspense fallback={null}><ZeroPointCanvas running={running} reduced={Boolean(reduced)} entering={!present} onReady={onReady} onFailure={onFailure} onEntryProgress={onEntryProgress} /></Suspense></EnergyBoundary>}</div>
    <div className="zero-point-topline"><span className="zero-point-monogram" aria-hidden="true">DS<span /></span></div>
    <button ref={enter} className="zero-point-enter" type="button" onClick={onEnter} disabled={!present} aria-label="Enter the directory through the Zero Point" aria-describedby="zero-point-hint"><span className="zero-point-core" aria-hidden="true" /></button>
    <p className="zero-point-hint" id="zero-point-hint">Explore who Derek Szeto is<span aria-hidden="true">↗</span></p>
  </motion.section>;
}
