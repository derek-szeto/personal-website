import { useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import ProjectCard from './ProjectCard.jsx';
import TechnologySelect from './TechnologySelect.jsx';
import { quickTransition } from '../motion.js';

const categories = ['All', 'Games', 'Apps & tools', 'Websites', 'Research'];

export default function ProjectsPage({ projects = [] }) {
  const reduced = useReducedMotion();
  const id = useId();
  const searchInput = useRef(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [technology, setTechnology] = useState('');
  const tags = [...new Set(projects.flatMap(project => project.tags || []))].sort((a, b) => a.localeCompare(b));
  const search = query.trim().toLowerCase();
  const filtered = projects.filter(project =>
    (category === 'All' || project.category === category) &&
    (!technology || project.tags?.includes(technology)) &&
    [project.title, project.description, project.category, ...(project.details || []), ...(project.tags || [])].join(' ').toLowerCase().includes(search)
  );
  const hasFilters = Boolean(query || category !== 'All' || technology);
  const searchId = `${id}-search`;
  const technologyId = `${id}-technology`;
  const resultsId = `${id}-results`;
  const countId = `${id}-count`;
  const resetFilters = () => {
    setQuery('');
    setCategory('All');
    setTechnology('');
    searchInput.current?.focus({ preventScroll: true });
  };
  return <section className="site-container projects-page" aria-labelledby="projects-title">
    <a className="text-link village-return" href="#home">Home</a>
    <div className="journal-heading">
      <h1 id="projects-title">Projects</h1>
      <span className="projects-light-lines" aria-hidden="true"><i /><i /></span>
    </div>
    <div className="journal-tools">
      <div className="project-tool-row">
        <div className="project-search">
          <label className="project-tool-label" htmlFor={searchId}>Search</label>
          <div className="project-search-shell">
            <input id={searchId} ref={searchInput} type="search" placeholder="Search projects" value={query} aria-label="Search projects" aria-controls={resultsId} aria-describedby={countId} onChange={event => setQuery(event.target.value)} />
            <button className="project-search-clear" type="button" aria-label="Clear search" disabled={!query} onClick={() => { setQuery(''); searchInput.current?.focus({ preventScroll: true }); }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
          </div>
        </div>
        <div className="project-technology"><label className="project-tool-label" id={`${technologyId}-label`} htmlFor={technologyId}>Technology</label><TechnologySelect id={technologyId} labelledBy={`${technologyId}-label`} value={technology} onValueChange={setTechnology} options={tags} resultsId={resultsId} describedBy={countId} /></div>
      </div>
      <div className="project-filter-bar">
        <div className="project-filters" role="group" aria-label="Filter projects by category">
          {categories.map(item => <button key={item} type="button" aria-pressed={category === item} aria-controls={resultsId} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
        <button className="project-reset" type="button" disabled={!hasFilters} onClick={resetFilters}>Reset filters</button>
      </div>
    </div>
    <p className="results-count" id={countId} role="status" aria-live="polite" aria-atomic="true">{filtered.length} of {projects.length} {projects.length === 1 ? 'project' : 'projects'}</p>
    <motion.div className="project-grid" id={resultsId} layout={reduced ? false : 'position'} transition={reduced ? { duration: 0 } : quickTransition}>
      <AnimatePresence initial={false} mode="popLayout">
        {filtered.length ? filtered.map(project => <ProjectCard key={project.id} project={project} number={projects.indexOf(project) + 1} />) : <motion.div key="empty" className="empty-journal project-empty-state" initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={reduced ? { duration: 0 } : quickTransition}><span aria-hidden="true">&#10023;</span><h2>No projects found.</h2><button className="button button-primary" type="button" onClick={resetFilters}>Reset filters</button></motion.div>}
      </AnimatePresence>
    </motion.div>
  </section>;
}
