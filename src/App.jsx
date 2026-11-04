import Botanical from './components/Botanical.jsx';
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import IntroScreen, { INTRO_STORAGE_KEY, shouldShowIntro } from './components/IntroScreen.jsx';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import Photos from './components/Photos.jsx';
import Projects from './components/Projects.jsx';
import ProjectsPage from './components/ProjectsPage.jsx';
import Skills from './components/Skills.jsx';
import Interests from './components/Interests.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import { profile, projects, skills, interests, photos, navigation } from './data/siteData.js';

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [showIntro, setShowIntro] = useState(shouldShowIntro);
  const [introPlayed, setIntroPlayed] = useState(false);
  const isProjectsPage = hash === '#/projects';
  const finishIntro = useCallback(() => {
    try { sessionStorage.setItem(INTRO_STORAGE_KEY, 'true'); } catch { /* Storage is optional. */ }
    setShowIntro(false);
    setIntroPlayed(true);
  }, []);
  const replayIntro = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.getElementById('home')?.scrollIntoView({ behavior: 'instant' });
    setIntroPlayed(false);
    setShowIntro(true);
  }, []);
  useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash);
      setShowIntro(false);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => {
    document.title = `${isProjectsPage ? 'Projects' : 'Personal Website'} | ${profile.name}`;
    if (isProjectsPage) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.getElementById('main-content')?.focus({ preventScroll: true });
    } else {
      const target = document.getElementById(hash.slice(1) || 'home');
      target?.scrollIntoView({ behavior: 'instant' });
    }
  }, [hash, isProjectsPage]);
  return (
    <>
      <AnimatePresence onExitComplete={() => document.getElementById('main-content')?.focus({ preventScroll: true })}>
        {showIntro && <IntroScreen key="intro" onFinish={finishIntro} />}
      </AnimatePresence>
      <div className={introPlayed ? 'site-content site-content--revealed' : 'site-content'} inert={showIntro || undefined} aria-hidden={showIntro || undefined}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navbar name={profile.name} initials={profile.initials} links={navigation} hash={hash} />
      <main id="main-content" tabIndex={-1}>
        {isProjectsPage ? <ProjectsPage projects={projects} /> : <>
          <Hero profile={profile} />
          <About paragraphs={profile.about} />
          <Photos photos={photos} />
          <Projects projects={projects.slice(0, 2)} />
          <Skills skills={skills} />
          <Interests interests={interests} />
          <Contact email={profile.email} phone={profile.phone} links={profile.socialLinks} />
        </>}
      </main>
      <div className="plant-divider" aria-hidden="true"><Botanical /></div>
      <Footer name={profile.name} onReplayIntro={isProjectsPage ? undefined : replayIntro} />
      </div>
    </>
  );
}
