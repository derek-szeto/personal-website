import Botanical from './Botanical.jsx';
export default function Section({ id, title, children }) {
  return <section className="section site-container relative" id={id} aria-labelledby={`${id}-title`}><div className="section-heading"><h2 id={`${id}-title`} className="font-sans font-medium">{title}</h2>{['about', 'interests'].includes(id) && <Botanical className="section-plants" variant="fern" />}</div><div className="section-content min-w-0">{children}</div></section>;
}
