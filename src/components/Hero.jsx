import Botanical from './Botanical.jsx';
import SheepDirectory from './SheepDirectory.jsx';
import { motion, useReducedMotion } from 'motion/react';
import VillageExperience from './VillageExperience.jsx';
import Arrow from './Arrow.jsx';
export default function Hero({ profile }) {
  const reduced = useReducedMotion();
  return <>
    <section className="site-container hero gap-10" id="home" aria-labelledby="hero-title">
      <motion.div className="hero-copy relative z-10" initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
        <h1 id="hero-title" className="font-sans font-semibold">{profile.name}<span className="name-star" aria-hidden="true">&#10035;</span></h1>
        <p className="hero-introduction">Projects, ideas &amp; a little magic.</p>
        <a className="button button-primary" href="#/projects">Projects <span className="button-arrow"><Arrow /></span></a>
      </motion.div>
      <div className="relative min-w-0"><VillageExperience /><Botanical className="hero-plants" /></div>
    </section>
    <SheepDirectory />
  </>;
}