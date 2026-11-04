import Arrow from './Arrow.jsx';
import Section from './Section.jsx';
import ProjectCard from './ProjectCard.jsx';

export default function Projects({ projects }) {
  return (
    <Section id="projects" number="02" title="Projects" description="A few things taking shape.">
      <div className="project-grid">
        {projects.map((project, index) => <ProjectCard key={project.id} project={project} number={index + 1} />)}
      </div>
      <a className="button button-primary all-projects-link" href="#/projects">View all projects <span aria-hidden="true">↗</span></a>
    </Section>
  );
}
