import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import FlashDriveProp from './FlashDriveProp.jsx';

export const FLASH_THROW_MS = 560;
export const FLASH_WASH_MS = 760;

export default function ThemeFlash({ id, paused, onDetonate, onFinish }) {
  const wash = useRef(null);
  const [detonated, setDetonated] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finish = () => onFinish(id);
    const onVisibility = () => { if (document.hidden) finish(); };
    const onKey = event => { if (event.key === 'Escape') finish(); };
    if (paused || media.matches || document.hidden) {
      finish();
      return undefined;
    }
    const detonate = window.setTimeout(() => {
      setDetonated(true);
      onDetonate(id);
    }, FLASH_THROW_MS);
    const timeout = window.setTimeout(finish, FLASH_THROW_MS + FLASH_WASH_MS + 120);
    media.addEventListener('change', finish);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(detonate);
      window.clearTimeout(timeout);
      media.removeEventListener('change', finish);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('keydown', onKey);
    };
  }, [id, paused, onDetonate, onFinish]);

  return createPortal(
    <div className="theme-flash" aria-hidden="true" data-phase={detonated ? 'burst' : 'flight'} style={{ '--flash-throw-time': `${FLASH_THROW_MS}ms`, '--flash-wash-time': `${FLASH_WASH_MS}ms` }} onAnimationEnd={event => {
      if (event.target === wash.current && event.animationName === 'flashdrive-wash') onFinish(id);
    }}>
      <div className="flashdrive-flight"><div className="flashdrive-arc"><FlashDriveProp /></div></div>
      <span className="flashdrive-burst-ring" />
      <span ref={wash} className="flashdrive-wash" />
    </div>,
    document.body,
  );
}
