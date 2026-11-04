import Section from './Section.jsx';
import CurrentClasses from './CurrentClasses.jsx';
import ProfilePortrait from './ProfilePortrait.jsx';

export default function About({ name, introduction, paragraphs = [], courses, portrait }) {
  return (
    <Section id="about" title="About me">
      <div className={`about-story${portrait?.src ? ' about-story-with-portrait' : ''}`}>
      {portrait?.src && <ProfilePortrait photo={portrait} />}
      <div className="about-biography">
        {name && <h3 className="about-name">{name}</h3>}
        {introduction && <p className="about-introduction">{introduction}</p>}
        <div className="about-copy">
          {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
        <CurrentClasses courses={courses} />
        <a className="text-link about-interests-link" href="#/interests">Interests <span aria-hidden="true">&#8599;</span></a>
      </div>
      </div>
    </Section>
  );
}
