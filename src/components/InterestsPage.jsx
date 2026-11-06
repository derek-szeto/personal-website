import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { quickTransition, revealTransition } from '../motion.js';
import Botanical from './Botanical.jsx';
import ValorantSection from './ValorantSection.jsx';
import MusicSection from './MusicSection.jsx';
import Interests from './Interests.jsx';
import CurrentClasses from './CurrentClasses.jsx';
import ProfilePortrait from './ProfilePortrait.jsx';

const sections = [
  { id: 'about', label: 'About me' },
  { id: 'valorant', label: 'Valorant' },
  { id: 'music', label: 'Music' },
  { id: 'likes', label: 'Likes' },
  { id: 'dislikes', label: 'Dislikes' },
];
const targetFor = id => document.getElementById(`interest-section-${id}`);

function SectionReveal({ children, immediate, reduced }) {
  return <motion.div className="interest-section-content"
    initial={immediate || reduced ? false : { opacity: .9, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: .04 }}
    transition={reduced ? { duration: 0 } : revealTransition}>
    {children}
  </motion.div>;
}

export default function InterestsPage({ profile, interests, valorant, music, section = '' }) {
  const reduced = useReducedMotion();
  const navigationId = useId();
  const initialSection = sections.some(item => item.id === section) ? section : 'about';
  const initialTarget = useRef(initialSection);
  const [activeSection, setActiveSection] = useState(initialSection);
  const page = useRef(null);
  const directory = useRef(null);
  const offset = useRef(190);
  const scrollIntent = useRef(null);
  const bottomSelection = useRef(null);
  const intentTimer = useRef(null);
  const syncScroll = useRef(null);
  const firstNavigation = useRef(true);

  const measureOffset = useCallback(() => {
    const header = Math.ceil(document.querySelector('.site-header')?.getBoundingClientRect().height || 96);
    const nav = Math.ceil(directory.current?.getBoundingClientRect().height || 64);
    offset.current = header + nav + 28;
    page.current?.style.setProperty('--interest-header-height', `${header}px`);
    page.current?.style.setProperty('--interest-nav-height', `${nav}px`);
    return offset.current;
  }, []);

  const jumpTo = useCallback((id, behavior, focus = false) => {
    const target = targetFor(id);
    if (!target) return;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - measureOffset());
    const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    bottomSelection.current = top >= maximum - 2 ? id : null;
    scrollIntent.current = { id, until: Date.now() + 1500 };
    window.clearTimeout(intentTimer.current);
    intentTimer.current = window.setTimeout(() => {
      scrollIntent.current = null;
      syncScroll.current?.();
    }, 1500);
    setActiveSection(id);
    window.scrollTo({ top: Math.min(top, maximum), behavior });
    if (focus) target.focus({ preventScroll: true });
  }, [measureOffset]);

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      const intent = scrollIntent.current;
      if (intent && Date.now() < intent.until) {
        const target = targetFor(intent.id);
        if (target && Math.abs(target.getBoundingClientRect().top - offset.current) > 6 && !atBottom) return;
      }
      scrollIntent.current = null;
      if (atBottom && bottomSelection.current) {
        setActiveSection(bottomSelection.current);
        return;
      }
      if (!atBottom) bottomSelection.current = null;
      let active = 'about';
      for (const item of sections) {
        if (targetFor(item.id)?.getBoundingClientRect().top <= offset.current + 12) active = item.id;
      }
      if (atBottom) active = 'dislikes';
      setActiveSection(active);
    }
    function queueUpdate() { if (!frame) frame = requestAnimationFrame(update); }
    syncScroll.current = queueUpdate;
    function measure() {
      measureOffset();
      queueUpdate();
    }
    function interrupt() { scrollIntent.current = null; bottomSelection.current = null; queueUpdate(); }
    function finishScroll(event) {
      if (event.target !== document && event.target !== window) return;
      window.clearTimeout(intentTimer.current);
      scrollIntent.current = null;
      queueUpdate();
    }
    function keyboardInterrupt(event) {
      if (['PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp', ' '].includes(event.key)) interrupt();
    }
    const observer = new ResizeObserver(measure);
    if (directory.current) observer.observe(directory.current);
    if (page.current) observer.observe(page.current);
    const header = document.querySelector('.site-header');
    if (header) observer.observe(header);
    measure();
    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('scrollend', finishScroll);
    window.addEventListener('resize', measure);
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    window.addEventListener('pointerdown', interrupt, { passive: true });
    window.addEventListener('keydown', keyboardInterrupt);
    return () => {
      observer.disconnect();
      window.clearTimeout(intentTimer.current);
      syncScroll.current = null;
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', queueUpdate);
      window.removeEventListener('scrollend', finishScroll);
      window.removeEventListener('resize', measure);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      window.removeEventListener('pointerdown', interrupt);
      window.removeEventListener('keydown', keyboardInterrupt);
    };
  }, [measureOffset]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const first = firstNavigation.current;
      firstNavigation.current = false;
      if (!section || !sections.some(item => item.id === section)) {
        scrollIntent.current = null;
        bottomSelection.current = null;
        setActiveSection('about');
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.getElementById('main-content')?.focus({ preventScroll: true });
      } else {
        const prefersStill = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        jumpTo(section, first || prefersStill ? 'instant' : 'smooth', true);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [section, jumpTo]);

  useEffect(() => {
    let frame = 0;
    let active = true;
    function keepActiveVisible() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nav = directory.current;
        const item = nav?.querySelector('[aria-current="location"]');
        if (!active || !nav || !item) return;
        const bounds = nav.getBoundingClientRect();
        const target = item.getBoundingClientRect();
        const inset = 10;
        const delta = target.left < bounds.left + inset ? target.left - bounds.left - inset
          : target.right > bounds.right - inset ? target.right - bounds.right + inset : 0;
        if (Math.abs(delta) < 1) return;
        const prefersStill = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        nav.scrollTo({ left: Math.max(0, Math.min(nav.scrollWidth - nav.clientWidth, nav.scrollLeft + delta)), behavior: prefersStill ? 'instant' : 'smooth' });
      });
    }
    keepActiveVisible();
    window.addEventListener('resize', keepActiveVisible);
    document.fonts?.ready.then(() => { if (active) keepActiveVisible(); });
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', keepActiveVisible);
    };
  }, [activeSection]);

  function navigate(event, id) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const href = `#/interests/${id}`;
    if (window.location.hash === href) jumpTo(id, reduced ? 'instant' : 'smooth', true);
    else window.location.hash = href;
  }

  return <div ref={page} className="site-container interests-page">
    <a className="interests-home font-ui text-subtle" href="#home">Home</a>
    <header className="interests-page-heading"><div><h1>Beyond the screen<span>.</span></h1><p>Interests &amp; a little more about me.</p></div><div className="interests-light-lines" aria-hidden="true"><i /><i /><i /></div></header>
    <LayoutGroup id={`interest-navigation-${navigationId}`}>
      <motion.nav ref={directory} className="interests-navigation" aria-label="Interest sections" layoutScroll
        initial={reduced ? false : 'hidden'} animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: .035 } } }}>
        {sections.map(item => <motion.a key={item.id} href={`#/interests/${item.id}`} onClick={event => navigate(event, item.id)} aria-current={activeSection === item.id ? 'location' : undefined} className={activeSection === item.id ? 'is-current' : ''}
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: reduced ? { duration: 0 } : quickTransition } }}>
          {activeSection === item.id && <motion.span className="interest-nav-highlight" layoutId="active-section" aria-hidden="true" initial={false} transition={reduced ? { duration: 0 } : quickTransition} />}
          <span>{item.label}</span>
        </motion.a>)}
      </motion.nav>
    </LayoutGroup>
    <div className="interests-stream">
      <div id="interest-section-about" data-interest-section="about" className="interest-scroll-section" tabIndex={-1} aria-label="About me">
        <SectionReveal immediate={initialTarget.current === 'about'} reduced={reduced}>
        <section className="interest-about" aria-labelledby="interest-about-title">
          {profile.portrait?.src ? <div className="interest-about-portrait interest-about-person"><ProfilePortrait photo={profile.portrait} /></div> : <div className="interest-about-portrait" aria-hidden="true"><div className="interest-about-initials">{profile.initials}<span>&#10035;</span></div><Botanical /></div>}
          <div className="interest-about-copy"><p className="interest-overline">ABOUT ME</p><h2 id="interest-about-title">{profile.name}</h2>{profile.introduction && <p>{profile.introduction}</p>}{profile.about.map((paragraph, i) => <p key={i}>{paragraph}</p>)}<CurrentClasses courses={profile.courses} /><a className="interest-photo-link" href="#photos">Life in photos </a></div>
        </section>
        </SectionReveal>
      </div>
      <div id="interest-section-valorant" data-interest-section="valorant" className="interest-scroll-section" tabIndex={-1} aria-label="Valorant">
        <SectionReveal immediate={initialTarget.current === 'valorant'} reduced={reduced}><ValorantSection valorant={valorant} /></SectionReveal>
      </div>
      <div id="interest-section-music" data-interest-section="music" className="interest-scroll-section" tabIndex={-1} aria-label="Music">
        <MusicSection endpoint="/api/spotify" enabled={true} profileUrl={music.profileUrl} favorites={music.favorites} />
      </div>
      {['likes', 'dislikes'].map(id => <div id={`interest-section-${id}`} data-interest-section={id} className="interest-scroll-section" tabIndex={-1} aria-label={id === 'likes' ? 'Likes' : 'Dislikes'} key={id}>
        <SectionReveal immediate={initialTarget.current === id} reduced={reduced}><Interests interests={interests.filter(item => item.id === id)} /></SectionReveal>
      </div>)}
    </div>
  </div>;
}
