import Section from './Section.jsx';
import { DirectorySheep } from './SheepDirectory.jsx';

export default function Interests({ interests }) {
  return (
    <Section id="interests" title="Interests">
      <div className="interests-grid preference-grid">
        {interests.map(interest => (
          <article className="interest-card preference-card border border-line bg-panel shadow-magic" key={interest.id} data-color={interest.id === 'dislikes' ? 'rose' : 'mint'}>
            <div className="interest-art"><DirectorySheep badge={interest.id === 'dislikes' ? 'star' : 'flower'} /></div>
            <h3 className="font-sans text-lg">{interest.title}</h3>
            {interest.items.length ? (
              <ul className="preference-list">{interest.items.map(item => <li key={item}>{item}</li>)}</ul>
            ) : <p>Coming soon.</p>}
          </article>
        ))}
      </div>
    </Section>
  );
}