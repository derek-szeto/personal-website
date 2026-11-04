import { useState } from 'react';
import ProjectCard from './ProjectCard.jsx';
export default function ProjectsPage({ projects }) {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('All');
  const tags = ['All', ...new Set(projects.flatMap(project => project.tags))];
  const filtered = projects.filter(project =>
    (tag === 'All' || project.tags.includes(tag)) &&
    [project.title, project.description, project.category, ...project.tags].join(' ').toLowerCase().includes(query.trim().toLowerCase())
  );
  return <section className="site-container projects-page" aria-labelledby="projects-title">
    <a className="text-link village-return" href="#home">&#8592; Home</a>
    <div className="journal-heading">
      <div>
        <h1 id="projects-title">Projects</h1>
      </div>
    </div>
    <div className="journal-tools">
      <label className="project-search"><span className="visually-hidden">Search projects</span><input type="search" placeholder="Find a project, tool, or idea…" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <div className="project-filters" role="group" aria-label="Filter projects by technology or interest">
        {tags.map(item => <button key={item} type="button" aria-pressed={tag === item} onClick={() => setTag(item)}>{item}</button>)}
      </div>
    </div>
    <p className="results-count" role="status">{filtered.length} of {projects.length} {projects.length === 1 ? 'project' : 'projects'}</p>
    {filtered.length ? <div className="project-grid">{filtered.map(project => <ProjectCard key={project.id} project={project} number={projects.indexOf(project) + 1} />)}</div> : <div className="empty-journal"><span aria-hidden="true">&#10023;</span><h2>No projects found.</h2><button className="button button-primary" type="button" onClick={() => { setQuery(''); setTag('All'); }}>Reset filters</button></div>}
  </section>;
}