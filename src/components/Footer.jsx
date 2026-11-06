import { useId } from 'react';
import { useReducedMotion } from 'motion/react';
import FooterContours from './FooterContours.jsx';

function SocialIcon({ type }) {
  const paths = {
    github: <path fill="currentColor" stroke="none" d="M12 .75a11.25 11.25 0 0 0-3.558 21.923c.563.104.77-.244.77-.543 0-.268-.01-.978-.015-1.92-3.13.68-3.79-1.508-3.79-1.508-.512-1.3-1.25-1.646-1.25-1.646-1.023-.7.078-.686.078-.686 1.13.08 1.725 1.16 1.725 1.16 1.005 1.722 2.637 1.225 3.28.937.103-.728.393-1.225.715-1.507-2.498-.284-5.124-1.25-5.124-5.564 0-1.23.44-2.235 1.16-3.023-.117-.285-.503-1.43.11-2.98 0 0 .945-.303 3.094 1.155A10.78 10.78 0 0 1 12 6.168c.955.004 1.918.129 2.816.379 2.147-1.458 3.09-1.155 3.09-1.155.616 1.55.23 2.695.114 2.98.722.788 1.157 1.793 1.157 3.023 0 4.325-2.63 5.277-5.136 5.556.404.348.765 1.034.765 2.084 0 1.505-.014 2.72-.014 3.09 0 .302.203.653.773.542A11.252 11.252 0 0 0 12 .75Z" />,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".75" fill="currentColor" stroke="none" /></>,
    email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  };
  return <svg className="footer-social-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[type] || paths.email}</svg>;
}

export function handleFooterNavigation(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const href = event.currentTarget.getAttribute('href');
  if (href !== window.location.hash) return;
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  if (href.startsWith('#/')) {
    event.preventDefault();
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior });
  } else {
    const target = document.getElementById(href.slice(1));
    if (target) {
      event.preventDefault();
      const heading = target.querySelector('h1,h2') || target;
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
      target.scrollIntoView({ behavior, block: 'start' });
    }
  }
}

export default function Footer({ name, introduction, email, links = [], navigation = [], projects = [], onReplayIntro }) {
  const id = useId();
  const reduced = useReducedMotion();
  const initials = name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2);
  const explore = navigation.filter(link => link.href !== '#home');
  const published = projects.filter(project => project.liveUrl).slice(0, 2);
  const socials = [...links.filter(link => link.url), ...(email ? [{ label: 'Email', url: `mailto:${email}`, icon: 'email' }] : [])];
  return <footer className="site-footer contour-footer" id="footer" aria-label="Website footer">
    <div className="footer-landscape" aria-hidden="true"><FooterContours /></div>
    <div className="footer-inner">
      <div className="footer-wordmark-frame"><p className="footer-wordmark">{name}</p></div>
      <div className="footer-columns">
        <div className="footer-identity">
          <a className="footer-home" href="#home" onClick={handleFooterNavigation} aria-label={`${name}, home`}><span className="footer-monogram" aria-hidden="true">{initials}</span><svg className="footer-spark" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true" focusable="false"><path d="m14 2 3.5 8.5L26 14l-8.5 3.5L14 26l-3.5-8.5L2 14l8.5-3.5Z" /><circle cx="14" cy="14" r="2" /></svg></a>
          <p className="footer-role">Student &amp; developer</p>
          {introduction && <p className="footer-bio">{introduction}</p>}
        </div>
        <nav className="footer-column" aria-labelledby={`${id}-explore`}>
          <h2 id={`${id}-explore`}>Explore</h2>
          <ul className="footer-link-list">{explore.map(link => <li key={link.href}><a href={link.href} onClick={handleFooterNavigation}>{link.label}</a></li>)}</ul>
        </nav>
        <nav className="footer-column" aria-labelledby={`${id}-projects`}>
          <h2 id={`${id}-projects`}>Projects</h2>
          <ul className="footer-link-list">{published.map(project => <li key={project.id}><a href={project.liveUrl} target="_blank" rel="noopener noreferrer"><span>{project.title}</span></a></li>)}<li><a href="#/projects" onClick={handleFooterNavigation}>All projects</a></li></ul>
        </nav>
        {socials.length > 0 && <nav className="footer-column footer-social-column" aria-labelledby={`${id}-social`}>
          <h2 id={`${id}-social`}>Elsewhere</h2>
          <ul className="footer-link-list footer-social-list">{socials.map(link => <li key={link.url}><a href={link.url} target={/^https?:\/\//.test(link.url) ? '_blank' : undefined} rel={/^https?:\/\//.test(link.url) ? 'noopener noreferrer' : undefined}><SocialIcon type={link.icon} /><span>{link.label}</span></a></li>)}</ul>
        </nav>}
      </div>
      <div className="footer-bottom"><p className="footer-stack">React<span aria-hidden="true">·</span>Three.js<span aria-hidden="true">·</span>Motion</p>{onReplayIntro && !reduced && <button className="footer-replay" type="button" onClick={onReplayIntro}>Replay intro<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M4 9a8 8 0 1 1-.1 6M4 4v5h5" /></svg></button>}</div>
    </div>
  </footer>;
}
