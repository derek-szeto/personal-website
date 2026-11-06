import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { isAmbientPaused, subscribeAmbientPaused } from '../ambientMotion.js';
import GroveFallback from './GroveFallback.jsx';
const GroveCanvas = lazy(() => import('./GroveCanvas.jsx'));

const destinations = [
  { id:'about', label:'About', href:'#about', wide:[14,35], narrow:[26,14] },
  { id:'photos', label:'Photos', href:'#photos', wide:[40,23], narrow:[74,28] },
  { id:'projects', label:'Projects', href:'#/projects', wide:[72,32], narrow:[26,43] },
  { id:'skills', label:'Skills', href:'#skills', wide:[23,74], narrow:[74,57] },
  { id:'interests', label:'Interests', href:'#/interests', wide:[55,68], narrow:[26,72] },
  { id:'contact', label:'Contact', href:'#contact', wide:[87,72], narrow:[74,85] },
];

class SceneBoundary extends Component {
  state = { failed:false };
  static getDerivedStateFromError() { return { failed:true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function Directory({ introReady = true }) {
  const map = useRef(null);
  const [paused, setPaused] = useState(isAmbientPaused);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(false);
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [narrow, setNarrow] = useState(() => window.innerWidth < 680);
  const [night, setNight] = useState(() => document.documentElement.dataset.theme === 'dark');
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [hoveredId, setHoveredId] = useState(null);
  const [focusedId, setFocusedId] = useState(null);
  const activeId = hoveredId || focusedId;
  const running = Boolean(visible && pageVisible && introReady && !paused && !reduced);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => { setFailed(true); setReady(false); }, []);
  const nodes = destinations.map(item => {
    const [x,y] = narrow ? item.narrow : item.wide;
    return { ...item,x,y };
  });
  useEffect(() => subscribeAmbientPaused(() => setPaused(isAmbientPaused())), []);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    preference.addEventListener('change',update);
    return () => preference.removeEventListener('change',update);
  }, []);
  useEffect(() => {
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    const theme = new MutationObserver(() => setNight(document.documentElement.dataset.theme === 'dark'));
    theme.observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });
    return () => { document.removeEventListener('visibilitychange', onVisibility); theme.disconnect(); };
  }, []);
  useEffect(() => {
    const element = map.current;
    if (!element) return undefined;
    const size = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < 620));
    size.observe(element);
    let preload, visibility;
    if (window.IntersectionObserver) {
      preload = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { setLoad(true); preload.disconnect(); }
      }, { rootMargin:'240px' });
      visibility = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
      preload.observe(element); visibility.observe(element);
    } else { setLoad(true); setVisible(true); }
    return () => { size.disconnect(); preload?.disconnect(); visibility?.disconnect(); };
  }, []);
  const trail = narrow
    ? 'M26 14C91 7 12 40 74 28S10 33 26 43S93 46 74 57S5 61 26 72S98 72 74 85'
    : 'M14 35C24 25 27 18 40 23S59 44 72 32S94 42 87 72S66 90 55 68S32 56 23 74S5 61 14 35';
  return <nav className="site-container explore-directory grove-directory" id="directory" tabIndex={-1} aria-label="Explore my website" data-paused={paused || reduced}>
    <div className="explore-directory-heading"><h1 id="directory-title">Explore</h1></div>
    <div ref={map} className="grove-map" data-narrow={narrow} data-running={running} data-scene-ready={ready && !failed} data-active-destination={activeId || undefined}>
      <svg className="grove-trails" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false"><path className="grove-trail-base" d={trail} vectorEffect="non-scaling-stroke" /><path className="grove-trail-current" d={trail} pathLength="1" vectorEffect="non-scaling-stroke" />{nodes.map(node => <ellipse key={node.id} cx={node.x} cy={node.y + (narrow ? 5 : 9)} rx={narrow ? 15 : 7} ry={narrow ? 1.5 : 2} className="grove-landing-ring" vectorEffect="non-scaling-stroke" />)}</svg>
      <div className="grove-viewport" aria-hidden="true">{load && !failed && <SceneBoundary onFailure={onFailure}><Suspense fallback={null}><GroveCanvas nodes={nodes} activeId={activeId} running={running} night={night} onReady={onReady} onFailure={onFailure} /></Suspense></SceneBoundary>}</div>
      {nodes.map((node,index) => <a key={node.id} className={`grove-node${node.id === 'interests' ? ' interest-directory-card' : ''}`} href={node.href} data-destination={node.id} data-accent={index % 2 ? 'pink' : 'blue'} style={{ '--node-x':`${node.x}%`, '--node-y':`${node.y}%` }} onPointerEnter={() => setHoveredId(node.id)} onPointerLeave={() => setHoveredId(current => current === node.id ? null : current)} onPointerCancel={() => setHoveredId(null)} onFocus={() => setFocusedId(node.id)} onBlur={() => setFocusedId(current => current === node.id ? null : current)}>
        <GroveFallback type={node.id} />
        <span className="grove-node-label">{node.label}</span>
      </a>)}
    </div>
  </nav>;
}
