import Botanical from './Botanical.jsx';
import Reveal from './Reveal.jsx';
export default function Section({ id, title, children }) {
  return <section className="section site-container relative" id={id} aria-labelledby={`${id}-title`}><Reveal className="section-heading"><h2 id={`${id}-title`} className="font-heading">{title}</h2><span className="section-light-rail" aria-hidden="true"><i /></span>{['about', 'interests'].includes(id) && <Botanical className="section-plants" variant="fern" />}</Reveal><div className="section-content min-w-0">{children}</div></section>;
}
