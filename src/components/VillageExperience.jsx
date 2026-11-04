import { Component, lazy, Suspense, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import VillageScene from './VillageScene.jsx';
const Village3D = lazy(() => import('./Village3D.jsx'));
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <><VillageScene /><p className="scene-hint">3D unavailable.</p></> : this.props.children; }
}
export default function VillageExperience() {
  const [mode, setMode] = useState('storybook');
  const reduced = useReducedMotion();
  return <motion.div className="village-experience" initial={reduced ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
    <div className="scene-selector" role="group" aria-label="Forest view">
      <button type="button" aria-pressed={mode === 'storybook'} onClick={() => setMode('storybook')} aria-label="Illustrated forest">2D</button>
      <button type="button" aria-pressed={mode === '3d'} onClick={() => setMode('3d')} aria-label="Interactive 3D forest">3D</button>
    </div>
    {mode === 'storybook' ? <VillageScene /> : <SceneBoundary><Suspense fallback={<div className="scene-loading" role="status">Loading...</div>}><Village3D /></Suspense></SceneBoundary>}
  </motion.div>;
}