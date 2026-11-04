import CyberBackdrop from './components/CyberBackdrop.jsx';
import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import { quickTransition } from './motion.js';
import IntroScreen, { INTRO_STORAGE_KEY } from './components/IntroScreen.jsx';
import ZeroPointScreen from './components/ZeroPointScreen.jsx';
import { createIntroFlow, getIntroOverlay, introFlowReducer, isIntroFlowReady } from './introFlow.js';
import Navbar from './components/Navbar.jsx';
import Directory from './components/Directory.jsx';
import About from './components/About.jsx';
import Activities from './components/Activities.jsx';
import Photos from './components/Photos.jsx';
import Projects from './components/Projects.jsx';
import ProjectsPage from './components/ProjectsPage.jsx';
import Skills from './components/Skills.jsx';
import InterestsPage from './components/InterestsPage.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import BackToTop from './components/BackToTop.jsx';
import { profile, projects, skills, activities, honors, interests, photos, vacationDestinations, navigation, valorant, music } from './data/siteData.js';

function readInitialIntroFlow() {
  let introSeen = false;
  try { introSeen = sessionStorage.getItem(INTRO_STORAGE_KEY) === 'true'; } catch { /* Storage is optional. */ }
  return createIntroFlow({ hash: window.location.hash, reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches, introSeen });
}

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [introFlow, dispatchIntro] = useReducer(introFlowReducer, undefined, readInitialIntroFlow);
  const introReady = isIntroFlowReady(introFlow);
  const overlay = getIntroOverlay(introFlow);
  const reduced = useReducedMotion();
  const previousPage = useRef(null);
  const isProjectsPage = hash === '#/projects';
  const isInterestsPage = hash === '#interests' || /^#\/interests(?:\/|$)/.test(hash);
  const interestSection = hash.split('/')[2] || '';
  const page = isProjectsPage ? 'projects' : isInterestsPage ? 'interests' : 'home';
  const finishIntro = useCallback(() => {
    try { sessionStorage.setItem(INTRO_STORAGE_KEY, 'true'); } catch { /* Storage is optional. */ }
    dispatchIntro({ type: 'INTRO_FINISHED', cycle: introFlow.cycle });
  }, [introFlow.cycle]);
  const enterZeroPoint = useCallback(() => {
    // Position the inert page behind the gateway before its exit reveals it.
    document.getElementById('directory')?.scrollIntoView({ behavior: 'instant', block: 'start' });
    dispatchIntro({ type: 'GATEWAY_ENTERED', cycle: introFlow.cycle });
  }, [introFlow.cycle]);
  const completeOverlayExit = useCallback(() => {
    dispatchIntro({ type: 'EXIT_COMPLETE', exitId: introFlow.exitId });
  }, [introFlow.exitId]);
  useLayoutEffect(() => {
    if (introReady) return undefined;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const padding = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${padding + gap}px`;
    return () => { body.style.overflow = previousOverflow; body.style.paddingRight = previousPadding; };
  }, [introReady]);
  const replayIntro = useCallback(() => {
    document.getElementById('home')?.scrollIntoView({ behavior: 'instant' });
    dispatchIntro({ type: 'REPLAY', reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches });
  }, []);
  useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash);
      dispatchIntro({ type: 'NAVIGATE', hash: window.location.hash });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => {
    document.title = `${isProjectsPage ? 'Projects' : isInterestsPage ? 'Interests' : 'Personal Website'} | ${profile.name}`;
  }, [isProjectsPage, isInterestsPage]);
  useEffect(() => {
    if (!introReady || !introFlow.target) return;
    const withinPage = previousPage.current === page;
    previousPage.current = page;
    if (introFlow.target === 'directory') {
      const directory = document.getElementById('directory');
      directory?.scrollIntoView({ behavior: 'instant', block: 'start' });
      directory?.focus({ preventScroll: true });
      dispatchIntro({ type: 'TARGET_HANDLED', cycle: introFlow.cycle });
      return;
    }
    // The Interests page owns its anchor scrolling, including browser Back/Forward.
    if (isProjectsPage) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.getElementById('main-content')?.focus({ preventScroll: true });
    } else if (isInterestsPage) {
      const target = document.getElementById(`interest-section-${interestSection}`) || document.getElementById('main-content');
      target?.focus({ preventScroll: true });
    } else {
      const target = document.getElementById(hash.slice(1) || 'home');
      target?.scrollIntoView({ behavior: withinPage && !reduced ? 'smooth' : 'instant' });
      const focusTarget = target?.hasAttribute('tabindex') ? target : target?.querySelector('h1,h2,h3') || target || document.getElementById('main-content');
      if (focusTarget && !focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
      focusTarget?.focus({ preventScroll: true });
    }
    dispatchIntro({ type: 'TARGET_HANDLED', cycle: introFlow.cycle });
  }, [hash, page, isProjectsPage, isInterestsPage, interestSection, reduced, introReady, introFlow.target, introFlow.cycle]);
  return (
    <MotionConfig reducedMotion="user" transition={quickTransition}>
      <CyberBackdrop active={introReady} />
      {!introReady && <link rel="preload" as="image" href="/images/zero-point/world-interior.png" />}
      <AnimatePresence onExitComplete={completeOverlayExit}>
        {overlay === 'intro' && <IntroScreen key={`intro-${introFlow.cycle}`} onFinish={finishIntro} />}
        {overlay === 'gateway' && <ZeroPointScreen key={`gateway-${introFlow.cycle}`} onEnter={enterZeroPoint} />}
      </AnimatePresence>
      <div className="site-content" data-lights-ready={introReady} inert={!introReady || undefined} aria-hidden={!introReady || undefined}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navbar name={profile.name} initials={profile.initials} links={navigation} hash={hash} />
      <motion.main key={page} id="main-content" tabIndex={-1} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={quickTransition}>
        {isProjectsPage ? <ProjectsPage projects={projects} /> : isInterestsPage ? <InterestsPage profile={profile} interests={interests} valorant={valorant} music={music} section={interestSection} /> : <>
          <div id="home"><Directory introReady={introReady} /></div>
          <About name={profile.name} introduction={profile.introduction} paragraphs={profile.about} courses={profile.courses} portrait={profile.portrait} />
          <Activities activities={activities} honors={honors} />
          <Photos photos={photos} destinations={vacationDestinations} />
          <Projects projects={projects.filter(project => project.featured).slice(0, 2)} />
          <Skills skills={skills} />
          <Contact email={profile.email} phone={profile.phone} links={profile.socialLinks} />
        </>}
      </motion.main>
      <Footer name={profile.name} introduction={profile.introduction} email={profile.email} links={profile.socialLinks} navigation={navigation} projects={projects} onReplayIntro={isProjectsPage || isInterestsPage ? undefined : replayIntro} />
      <BackToTop />
      </div>
    </MotionConfig>
  );
}
