import Botanical from './Botanical.jsx';
import Reveal from './Reveal.jsx';
import { useId } from 'react';

const githubMark = 'M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.7-1.3-1.7-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.4 5 18.4 5.3 18.4 5.3c.7 1.7.3 2.9.2 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z';

export function ContactAvatar() {
  const id = useId();
  const shoulders = 'M54 194v-14c0-34 29-61 66-61s66 27 66 61v14Z';
  return <svg className="contact-avatar" viewBox="0 0 240 240" fill="none" aria-hidden="true" focusable="false">
    <defs><linearGradient id={`${id}-avatar`} x1="55" y1="30" x2="185" y2="205" gradientUnits="userSpaceOnUse"><stop stopColor="var(--electric-blue)" /><stop offset=".58" stopColor="var(--accent)" /><stop offset="1" stopColor="var(--electric-pink)" /></linearGradient></defs>
    <circle cx="120" cy="65" r="28" fill="var(--art)" fillOpacity=".4" stroke={`url(#${id}-avatar)`} strokeWidth="8" />
    <path d={shoulders} fill="var(--art)" fillOpacity=".35" stroke={`url(#${id}-avatar)`} strokeWidth="8" strokeLinejoin="round" />
    <circle className="contact-avatar-trace contact-avatar-head" cx="120" cy="65" r="28" pathLength="1" stroke="var(--grove-mint)" strokeWidth="3" strokeLinecap="round" />
    <path className="contact-avatar-trace" d={shoulders} pathLength="1" stroke="var(--electric-blue)" strokeWidth="3" strokeLinecap="round" />
    <path className="contact-avatar-guides" d="M24 66V42h24m144 0h24v24M24 174v24h24m144 0h24v-24" stroke="var(--electric-blue)" strokeOpacity=".3" strokeWidth="1.5" />
  </svg>;
}

function ContactIcon({ type }) {
  if (type === 'github') return <svg aria-hidden="true" focusable="false" width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d={githubMark} /><path className="contact-github-trace" d={githubMark} pathLength="1" fill="none" stroke="var(--grove-mint)" strokeWidth=".65" /></svg>;
  return <svg aria-hidden="true" focusable="false" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {type === 'instagram' ? <><rect x="3" y="3" width="18" height="18" rx="5" /><rect className="contact-instagram-trace" x="3" y="3" width="18" height="18" rx="5" pathLength="1" stroke="var(--accent)" /><circle cx="12" cy="12" r="4" /><circle className="contact-instagram-dot" cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></> : type === 'email' ? <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></> : type === 'phone' ? <path d="M8 3H5a2 2 0 0 0-2 2 17 17 0 0 0 16 16 2 2 0 0 0 2-2v-3l-5-2-2 2a13 13 0 0 1-6-6l2-2Z" /> : <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18" /></>}
  </svg>;
}

export default function Contact({ email, phone, links = [] }) {
  const cards = [
    ...(email ? [{ label: 'Email', value: email, url: `mailto:${email}`, icon: 'email' }] : []),
    ...(phone ? [{ label: 'Phone', value: phone, url: `tel:+1${phone.replace(/\D/g, '')}`, icon: 'phone' }] : []),
    ...links.map(link => ({ ...link, value: `@${new URL(link.url).pathname.split('/').filter(Boolean).pop() || link.label}`, external: true })),
  ];
  return <section id="contact" className="site-container contact-section" aria-labelledby="contact-title">
    <Reveal className="contact-board relative isolate overflow-hidden rounded-2xl border border-line bg-panel shadow-magic">
      <div className="contact-identity relative flex flex-col">
        <span className="contact-eyebrow font-ui uppercase text-subtle">Contact</span>
        <h2 id="contact-title" className="font-display font-normal">Let's work together<span className="text-petal">.</span></h2>
        <div className="contact-garden contact-avatar-garden" aria-hidden="true"><ContactAvatar /><Botanical /><span className="contact-light-orbit" /></div>
      </div>
      <div className="contact-card-grid grid gap-3 sm:grid-cols-2">
        {cards.map(card => <a key={card.url} className="contact-method relative flex min-w-0 flex-col rounded-xl border focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-magic" href={card.url} target={card.external ? '_blank' : undefined} rel={card.external ? 'noopener noreferrer' : undefined} data-channel={card.icon}>
          <span className="contact-method-top flex items-start justify-between"><span className="contact-method-icon"><ContactIcon type={card.icon} /></span></span>
          <span className="contact-method-label font-ui uppercase text-subtle">{card.label}</span>
          <span className="contact-method-value font-sans font-medium text-ink">{card.value}</span>
        </a>)}
      </div>
    </Reveal>
  </section>;
}
