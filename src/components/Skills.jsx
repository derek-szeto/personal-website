import Section from './Section.jsx';
import Reveal from './Reveal.jsx';

export default function Skills({ skills }) {
  return (
    <Section id="skills" title="Skills">
      <div className="skills-grid">
        {skills.map((skill, index) => (
          <Reveal as="article" className="skill-card border border-line bg-panel/60" key={skill.id} delay={index * .055}>
            <h3>{skill.title}</h3>
            <p>{skill.description}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
