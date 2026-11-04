import Section from './Section.jsx';

export default function Skills({ skills }) {
  return (
    <Section id="skills" number="03" title="Skills" description="Things I build and learn with.">
      <div className="skills-grid">
        {skills.map((skill) => (
          <article className="skill-card border border-line bg-panel/60" key={skill.id}>
            <h3>{skill.title}</h3>
            <p>{skill.description}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
