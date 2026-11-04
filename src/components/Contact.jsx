import Botanical from './Botanical.jsx';
import PixelSheep from './PixelSheep.jsx';

function ContactIcon({ type }) {
  if (type === 'github') return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.7-1.3-1.7-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.4 5 18.4 5.3 18.4 5.3c.7 1.7.3 2.9.2 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" /></svg>;
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {type === 'instagram' ? <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></> : type === 'email' ? <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></> : type === 'phone' ? <path d="M8 3H5a2 2 0 0 0-2 2 17 17 0 0 0 16 16 2 2 0 0 0 2-2v-3l-5-2-2 2a13 13 0 0 1-6-6l2-2Z" /> : <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18" /></>}
  </svg>;
}

export default function Contact({ email, phone, links = [] }) {
  const cards = [
    ...(email ? [{ label: 'Email', value: email, url: `mailto:${email}`, icon: 'email' }] : []),
    ...(phone ? [{ label: 'Phone', value: phone, url: `tel:+1${phone.replace(/\D/g, '')}`, icon: 'phone' }] : []),
    ...links.map(link => ({ ...link, value: `@${new URL(link.url).pathname.split('/').filter(Boolean).pop() || link.label}`, external: true })),
  ];
  return <section id="contact" className="site-container contact-section" aria-labelledby="contact-title">
    <div className="contact-board relative isolate overflow-hidden rounded-2xl border border-line bg-panel shadow-magic">
      <div className="contact-identity relative flex flex-col">
        <span className="contact-eyebrow font-mono text-[10px] uppercase tracking-[.18em] text-subtle">Contact</span>
        <h2 id="contact-title" className="font-sans font-semibold tracking-[-.06em]">Say hello<span className="text-petal">.</span></h2>
        <div className="contact-garden" aria-hidden="true"><Botanical /><PixelSheep /><span className="contact-garden-star">&#10035;</span></div>
      </div>
      <div className="contact-card-grid grid gap-3 sm:grid-cols-2">
        {cards.map(card => <a key={card.url} className="contact-method group relative flex min-w-0 flex-col rounded-xl border border-line bg-canvas/70 transition-colors hover:border-magic focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-magic" href={card.url} target={card.external ? '_blank' : undefined} rel={card.external ? 'noopener noreferrer' : undefined} data-channel={card.icon}>
          <span className="contact-method-top flex items-start justify-between"><span className="contact-method-icon"><ContactIcon type={card.icon} /></span><svg className="contact-method-arrow transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 18 18 6M6 6h12v12" /></svg></span>
          <span className="contact-method-label font-mono text-[9px] uppercase tracking-[.14em] text-subtle">{card.label}</span>
          <span className="contact-method-value font-sans text-sm font-medium text-ink">{card.value}</span>
        </a>)}
      </div>
    </div>
  </section>;
}