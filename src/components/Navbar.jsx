import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { quickTransition } from '../motion.js';
import { isAmbientPaused, subscribeAmbientPaused } from '../ambientMotion.js';
import ThemeFlash from './ThemeFlash.jsx';
const compactNavigation = '(max-width: 1280px)';
const homeSections = [
  { id: 'home', href: '#home' },
  { id: 'directory', href: '#home' },
  { id: 'about', href: '#about' },
  { id: 'activities', href: '#about' },
  { id: 'photos', href: '#photos' },
  { id: 'vacations', href: '#photos' },
  { id: 'plushies', href: '#photos' },
  { id: 'projects', href: '#/projects' },
  { id: 'skills', href: '#skills' },
  { id: 'contact', href: '#contact' },
];
const pageFor = hash => hash === '#/projects' ? 'projects'
  : hash === '#interests' || /^#\/interests(?:\/|$)/.test(hash || '') ? 'interests' : 'home';
const destinationFor = hash => pageFor(hash) === 'projects' ? '#/projects'
  : pageFor(hash) === 'interests' ? '#/interests'
    : homeSections.find(section => `#${section.id}` === hash)?.href || '#home';

export default function Navbar({ name, initials, links, hash }) {
  const reduced = useReducedMotion();
  const page = pageFor(hash);
  const [isOpen, setIsOpen] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia(compactNavigation).matches);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  const [paused, setPaused] = useState(isAmbientPaused);
  const themeTransition = useRef(null);
  const [flashId, setFlashId] = useState(null);
  const requestedTheme = useRef(theme);
  const themeGeneration = useRef(0);
  const lastThemeFlash = useRef(-Infinity);
  const commitTheme = useCallback(next => {
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }, []);
  const detonateThemeFlash = useCallback(id => {
    if (id === themeGeneration.current && requestedTheme.current === 'light') commitTheme('light');
  }, [commitTheme]);
  const finishThemeFlash = useCallback(id => {
    if (id !== themeGeneration.current) return;
    commitTheme(requestedTheme.current);
    setFlashId(null);
  }, [commitTheme]);
  const header = useRef(null);
  const [observed, setObserved] = useState(() => ({ page, href: destinationFor(hash) }));
  const scrollIntent = useRef(null);
  const bottomSelection = useRef(null);
  const intentTimer = useRef(null);
  const queueSpy = useRef(null);
  const activeHref = page === 'home' && observed.page === page ? observed.href : destinationFor(hash);

  useEffect(() => () => {
    themeGeneration.current++;
    themeTransition.current?.skipTransition();
  }, []);

  const beginHomeNavigation = useCallback(id => {
    const section = homeSections.find(item => item.id === id);
    if (!section || !document.getElementById(id)) return false;
    scrollIntent.current = { ...section, until: Date.now() + 1600 };
    bottomSelection.current = null;
    setObserved({ page: 'home', href: section.href });
    window.clearTimeout(intentTimer.current);
    intentTimer.current = window.setTimeout(() => {
      scrollIntent.current = null;
      queueSpy.current?.();
    }, 1600);
    queueSpy.current?.();
    return true;
  }, []);

  useEffect(() => {
    if (page !== 'home') {
      setObserved({ page, href: page === 'projects' ? '#/projects' : '#/interests' });
      return undefined;
    }
    let frame = 0;
    let mounted = true;
    const updateDestination = href => setObserved(current => current.page === 'home' && current.href === href ? current : { page: 'home', href });
    function update() {
      frame = 0;
      if (!mounted) return;
      const line = Math.max(0, header.current?.getBoundingClientRect().bottom || 104) + 24;
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      const sections = homeSections.map(section => ({ ...section, element: document.getElementById(section.id) })).filter(section => section.element);
      const intent = scrollIntent.current;
      if (intent) {
        const target = document.getElementById(intent.id);
        const top = target?.getBoundingClientRect().top;
        const arrived = target && (Math.abs(top - line) <= 32 || atBottom && top > line && top < window.innerHeight);
        if (arrived) {
          scrollIntent.current = null;
          window.clearTimeout(intentTimer.current);
          if (atBottom) bottomSelection.current = intent;
        } else if (target && Date.now() < intent.until) {
          updateDestination(intent.href);
          return;
        } else scrollIntent.current = null;
      }
      if (atBottom && bottomSelection.current) {
        updateDestination(bottomSelection.current.href);
        return;
      }
      if (!atBottom) bottomSelection.current = null;
      let href = '#home';
      for (const section of sections) {
        if (section.element.getBoundingClientRect().top <= line) href = section.href;
      }
      if (atBottom && sections.length) href = sections.at(-1).href;
      updateDestination(href);
    }
    function queue() { if (!frame) frame = window.requestAnimationFrame(update); }
    function interrupt() {
      scrollIntent.current = null;
      bottomSelection.current = null;
      window.clearTimeout(intentTimer.current);
      queue();
    }
    function keyboardInterrupt(event) {
      if (['PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp', ' '].includes(event.key)) interrupt();
    }
    queueSpy.current = queue;
    const resize = new ResizeObserver(queue);
    if (header.current) resize.observe(header.current);
    const main = document.getElementById('main-content');
    if (main) resize.observe(main);
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('scrollend', queue);
    window.addEventListener('resize', queue);
    window.addEventListener('load', queue, true);
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    window.addEventListener('pointerdown', interrupt, { passive: true });
    window.addEventListener('keydown', keyboardInterrupt);
    document.fonts?.ready.then(() => { if (mounted) queue(); });
    queue();
    return () => {
      mounted = false;
      resize.disconnect();
      window.cancelAnimationFrame(frame);
      queueSpy.current = null;
      window.removeEventListener('scroll', queue);
      window.removeEventListener('scrollend', queue);
      window.removeEventListener('resize', queue);
      window.removeEventListener('load', queue, true);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      window.removeEventListener('pointerdown', interrupt);
      window.removeEventListener('keydown', keyboardInterrupt);
    };
  }, [page]);

  useEffect(() => {
    if (page === 'home') beginHomeNavigation((hash || '#home').slice(1));
    else {
      scrollIntent.current = null;
      bottomSelection.current = null;
      window.clearTimeout(intentTimer.current);
    }
    return () => window.clearTimeout(intentTimer.current);
  }, [hash, page, beginHomeNavigation]);
  useEffect(() => subscribeAmbientPaused(() => setPaused(isAmbientPaused())), []);
  useEffect(() => {
    const measure = () => document.documentElement.style.setProperty('--site-header-height', `${Math.ceil(header.current?.getBoundingClientRect().height || 104)}px`);
    const observer = new ResizeObserver(measure);
    if (header.current) observer.observe(header.current);
    measure();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!isOpen) return;
    const closeOutside = event => { if (!header.current?.contains(event.target)) setIsOpen(false); };
    const closeOnEscape = event => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        document.getElementById('menu-toggle')?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);
  useEffect(() => {
    const media = window.matchMedia(compactNavigation);
    const update = () => { setMobile(media.matches); setIsOpen(false); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#071b27' : '#eff7fb');
    try { localStorage.setItem('theme', theme); } catch { /* Storage may be unavailable. */ }
  }, [theme]);
  useEffect(() => { setIsOpen(false); }, [hash]);
  function toggleTheme() {
    const next = requestedTheme.current === 'dark' ? 'light' : 'dark';
    requestedTheme.current = next;
    const generation = ++themeGeneration.current;
    const update = () => {
      // skipTransition does not cancel an older update callback.
      if (generation === themeGeneration.current) flushSync(() => commitTheme(next));
    };
    themeTransition.current?.skipTransition();
    const reducedNow = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const now = performance.now();
    const shouldFlash = next === 'light' && !reducedNow && !isAmbientPaused() && !document.hidden && now - lastThemeFlash.current >= 2500;
    if (shouldFlash) {
      lastThemeFlash.current = now;
      setFlashId(generation);
      return;
    }
    setFlashId(null);
    if (reducedNow || flashId !== null || !document.startViewTransition) update();
    else {
      themeTransition.current = document.startViewTransition(update);
      themeTransition.current.finished.catch(() => {});
    }
  }
  const displayedTheme = flashId !== null ? 'light' : theme;
  return (
    <>
    {flashId !== null && <ThemeFlash key={flashId} id={flashId} paused={paused} onDetonate={detonateThemeFlash} onFinish={finishThemeFlash} />}
    <header ref={header} className="site-header adventure-header">
      <nav className="site-container navbar bg-panel/90 backdrop-blur-xl" aria-label="Main navigation">
        <a className="brand font-ui" href="#home" onClick={() => setIsOpen(false)}>
          <span className="brand-mark" aria-hidden="true">{initials}</span>
          <span className="brand-copy">{name}</span>
        </a>
        <button id="menu-toggle" className="menu-toggle font-ui" type="button" aria-expanded={isOpen} aria-controls="navigation-links" onClick={() => setIsOpen(!isOpen)}>
          <span className="menu-toggle-icon" aria-hidden="true" /> {isOpen ? 'Close' : 'Menu'}
        </button>
        <div className={`nav-menu${isOpen ? ' is-open' : ''}`} inert={mobile && !isOpen || undefined}>
        <div className="nav-menu-inner">
        <ul id="navigation-links" className={`nav-links ${isOpen ? 'is-open' : ''}`}>
          {links.map((link, index) => {
            const active = link.href === activeHref;
            return <li key={link.href} style={{ '--nav-index': index }}>
              <a href={link.href} aria-current={active ? (page === 'home' ? 'location' : 'page') : undefined} className={active ? 'is-active' : ''} onClick={event => {
                setIsOpen(false);
                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || page !== 'home' || link.href.startsWith('#/')) return;
                const id = link.href.slice(1);
                if (beginHomeNavigation(id) && window.location.hash === link.href) {
                  event.preventDefault();
                  document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' });
                }
              }}>
                <span>{link.label}</span>{active && <motion.span className="nav-active-backdrop" aria-hidden="true" layoutId="active-destination" transition={reduced ? { duration: 0 } : quickTransition} />}
              </a>
            </li>;
          })}
        </ul>
        </div>
        </div>
        <button className="theme-switch" type="button" onClick={toggleTheme} aria-label={`Switch to ${displayedTheme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${displayedTheme === 'dark' ? 'light' : 'dark'} mode`}>
          <span className="theme-icon" aria-hidden="true"><AnimatePresence initial={false}><motion.span key={displayedTheme} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .16 }}>{displayedTheme === 'dark' ? '\u263e' : '\u2600'}</motion.span></AnimatePresence></span>
          <span className="theme-switch-label">{displayedTheme === 'dark' ? 'Night' : 'Day'}</span>
        </button>
      </nav>
    </header>
    </>
  );
}
