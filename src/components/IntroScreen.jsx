import { useEffect, useRef } from 'react';
import { motion, useIsPresent, useReducedMotion } from 'motion/react';
import { easeInOut } from '../motion.js';

// Give visitors one look at the redesigned intro, even in an older session.
export const INTRO_STORAGE_KEY = 'derek-intro-seen-cyber-v1';
export const INTRO_DURATION = 3400;
export const INTRO_EXIT_DURATION = 650;

export function canPlayIntro(hash, reduced, seen) {
  return (!hash || hash === '#home') && !reduced && !seen;
}

export function shouldShowIntro() {
  let seen = false;
  try { seen = sessionStorage.getItem(INTRO_STORAGE_KEY) === 'true'; } catch { /* Storage is optional. */ }
  return canPlayIntro(window.location.hash, window.matchMedia('(prefers-reduced-motion: reduce)').matches, seen);
}

const branchPaths = [
  'M66 720V594L144 516V392L204 332V180L260 124V36',
  'M144 516H90L44 470V398',
  'M144 392H82L28 338V246',
  'M204 332H286L338 280V168',
  'M204 244H138L100 206V112',
  'M260 124H326L376 74V20',
  'M66 630H168L226 572V492',
  'M204 180Q154 172 146 126Q185 124 204 180M286 332Q284 282 320 252Q342 290 286 332',
  'M90 516Q38 520 18 482Q57 464 90 516M260 124Q246 82 274 56Q300 92 260 124',
];

function BranchPaths() {
  return branchPaths.map((d, index) => <path key={d} d={d} pathLength="1" style={{ '--trace-delay': `${.15 + index * .07}s` }} />);
}

function CircuitBranch({ side }) {
  return <svg className={`intro-branch intro-branch-${side}`} viewBox="0 0 420 720" fill="none" strokeLinecap="round" strokeLinejoin="round" focusable="false">
    <g className="intro-trace-halo"><BranchPaths /></g>
    <g className="intro-trace-core"><BranchPaths /></g>
    <g className="intro-branch-nodes">{[[260,36],[44,398],[28,246],[338,168],[100,112],[376,20],[226,492]].map(([cx,cy], index) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={index % 2 ? 3 : 4} style={{ '--node-delay': `${.9 + index * .11}s` }} />)}</g>
    <path className="intro-branch-signal" d={branchPaths[0]} pathLength="1" />
  </svg>;
}

function GrovePortal() {
  return <svg className="intro-portal" viewBox="0 0 900 900" fill="none" focusable="false">
    <circle className="intro-portal-guide" cx="450" cy="450" r="388" />
    <circle className="intro-portal-ticks" cx="450" cy="450" r="370" />
    <g className="intro-portal-markers">{Array.from({ length: 12 }, (_, index) => <path key={index} d="M450 47v14" transform={`rotate(${index * 30} 450 450)`} />)}</g>
    <circle className="intro-portal-ring intro-portal-ring-blue" cx="450" cy="450" r="326" pathLength="1" />
    <circle className="intro-portal-ring intro-portal-ring-pink" cx="450" cy="450" r="346" pathLength="1" />
    <circle className="intro-portal-signal" cx="450" cy="450" r="326" pathLength="1" />
    <path className="intro-portal-circuit" d="M450 62V28h96l36 36h66M123 450H64l-30 30v90M450 838v34h-96l-36-36h-66M777 450h59l30-30v-90" />
    <g className="intro-portal-nodes"><circle cx="450" cy="124" r="5" /><circle cx="776" cy="450" r="4" /><circle cx="450" cy="776" r="5" /><circle cx="124" cy="450" r="4" /></g>
  </svg>;
}

export default function IntroScreen({ onFinish }) {
  const screen = useRef(null);
  const present = useIsPresent();
  const reduced = useReducedMotion();
  useEffect(() => {
    screen.current?.focus({ preventScroll: true });
    const timer = window.setTimeout(onFinish, reduced ? 0 : INTRO_DURATION);
    return () => {
      window.clearTimeout(timer);
    };
  }, [onFinish, reduced]);

  return <motion.section ref={screen} className="intro-screen" role="dialog" aria-modal="true" aria-labelledby="intro-title" tabIndex={-1} inert={!present || undefined} aria-hidden={!present || undefined}
    style={{ '--intro-duration': `${INTRO_DURATION}ms` }}
    initial={{ opacity: 1, clipPath: 'circle(150% at 50% 50%)' }}
    exit={reduced ? { opacity: 0 } : { opacity: 0, clipPath: 'circle(0% at 50% 50%)' }}
    transition={{ duration: reduced ? 0 : INTRO_EXIT_DURATION / 1000, ease: easeInOut }}
    onKeyDown={event => {
      if (!present) return;
      if (event.key === 'Tab') { event.preventDefault(); screen.current?.focus({ preventScroll: true }); }
    }}>
    <div className="intro-stage">
      <div className="intro-topline"><span className="intro-monogram" aria-hidden="true">DS<span /></span></div>
      <div className="intro-grove" aria-hidden="true"><CircuitBranch side="left" /><CircuitBranch side="right" /><GrovePortal /><div className="intro-floor" /></div>
      <div className="intro-name"><h2 id="intro-title" aria-label="Derek Szeto"><span className="intro-word">Derek</span><span className="intro-word">Szeto<span className="intro-title-period" aria-hidden="true">.</span></span></h2><span className="intro-name-rule" aria-hidden="true" /></div>
      <div className="intro-edge" aria-hidden="true"><i /><i /><i /></div>
    </div>
  </motion.section>;
}
