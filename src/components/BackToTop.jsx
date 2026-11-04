import { useEffect, useRef, useState } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const button = useRef(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const shown = window.scrollY > 500;
      if (!shown && document.activeElement === button.current) document.getElementById('main-content')?.focus({ preventScroll: true });
      setVisible(shown);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  function scrollToTop() {
    document.getElementById('main-content')?.focus({ preventScroll: true });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
  }

  return <button ref={button} className={`back-to-top${visible ? ' is-visible' : ''}`} type="button" aria-label="Back to top" title="Back to top" aria-hidden={!visible} disabled={!visible} tabIndex={visible ? 0 : -1} onClick={scrollToTop}>
    <svg className="back-to-top-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M12 19V5m-6 6 6-6 6 6" /></svg>
  </button>;
}
