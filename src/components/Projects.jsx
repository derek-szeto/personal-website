import Section from './Section.jsx';
import ProjectCard from './ProjectCard.jsx';

export default function Projects({ projects }) {
  return (
    <Section id="projects" title="Selected projects">
      <div className="project-grid">
        {projects.map((project, index) => <ProjectCard key={project.id} project={project} number={index + 1} />)}
      </div>
      <a className="button button-primary all-projects-link" href="#/projects">View all projects <span aria-hidden="true">&#8599;</span></a>
    </Section>
  );
}
