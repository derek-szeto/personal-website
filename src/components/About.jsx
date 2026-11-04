import Section from './Section.jsx';

export default function About({ paragraphs }) {
  return (
    <Section id="about" number="01" title="About me" description="A person behind the pixels.">
      <div className="about-copy">
        {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </div>
    </Section>
  );
}
