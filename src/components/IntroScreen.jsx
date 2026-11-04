import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import PixelSheep from './PixelSheep.jsx';

export const INTRO_STORAGE_KEY = 'derek-intro-seen';
export const INTRO_DURATION = 2800;

export function canPlayIntro(hash, reduced, seen) {
  return (!hash || hash === '#home') && !reduced && !seen;
}

export function shouldShowIntro() {
  let seen = false;
  try { seen = sessionStorage.getItem(INTRO_STORAGE_KEY) === 'true'; } catch { /* Storage is optional. */ }
  return canPlayIntro(window.location.hash, window.matchMedia('(prefers-reduced-motion: reduce)').matches, seen);
}

function Bloom({ className = '' }) {
  return <div className={`intro-bloom ${className}`}><i /><i /><i /><i /></div>;
}

function Cube({ className = '' }) {
  return <div className={`intro-cube ${className}`}><i /><i /><i /></div>;
}

export default function IntroScreen({ onFinish }) {
  const skip = useRef(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    skip.current?.focus({ preventScroll: true });
    const timer = window.setTimeout(onFinish, reduced ? 0 : INTRO_DURATION);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [onFinish, reduced]);

  return <motion.section className="intro-screen" role="dialog" aria-modal="true" aria-labelledby="intro-title"
    initial={{ opacity: 1 }} exit={reduced ? { opacity: 0 } : { y: '-105%' }}
    transition={{ duration: reduced ? 0 : .7, ease: [.76, 0, .24, 1] }}
    onKeyDown={event => {
      if (event.key === 'Escape') onFinish();
      if (event.key === 'Tab') { event.preventDefault(); skip.current?.focus(); }
    }}>
    <div className="intro-stage">
      <div className="intro-topline"><span aria-hidden="true">DS<span className="intro-brand-star">✳</span></span><button ref={skip} className="intro-skip" type="button" onClick={onFinish}>Skip <span aria-hidden="true">↗</span></button></div>
      <div className="intro-art" aria-hidden="true">
        <div className="intro-object intro-object-flower"><Bloom /></div>
        <div className="intro-object intro-object-ring"><div className="intro-ring" /></div>
        <div className="intro-object intro-object-bars"><div className="intro-bars"><i /><i /><i /></div></div>
        <div className="intro-object intro-object-cube"><Cube /></div>
        <div className="intro-object intro-object-bloom"><Bloom /></div>
        <div className="intro-object intro-object-spring"><div className="intro-spring"><i /><i /><i /><i /></div></div>
        <div className="intro-object intro-object-orb"><div className="intro-orb" /></div>
        <div className="intro-object intro-object-tiles"><Cube /><Cube /></div>
        <div className="intro-object intro-object-sheep"><PixelSheep /></div>
        <div className="intro-object intro-object-small-ring"><div className="intro-ring" /></div>
      </div>
      <div className="intro-name"><h2 id="intro-title"><span>Derek</span><span>Szeto<span className="intro-title-period">.</span></span></h2></div>
      <div className="intro-bottomline" aria-hidden="true"><span>PORTFOLIO / 01</span><span className="intro-timer"><span /></span><span>WELCOME IN</span></div>
    </div>
  </motion.section>;
}
