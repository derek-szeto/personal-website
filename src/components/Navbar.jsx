import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
const icons = { Home: '\u2302', About: '\u2667', Photos: '\u25a3', Projects: '\u2691', Skills: '\u2692', Interests: '\u273f', Contact: '\u2709' };
export default function Navbar({ name, initials, links, hash }) {
  const reduced = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0c232a' : '#edf3ed');
    try { localStorage.setItem('theme', theme); } catch { /* Storage may be unavailable. */ }
  }, [theme]);
  useEffect(() => { setIsOpen(false); }, [hash]);
  return (
    <header className="site-header adventure-header">
      <nav className="site-container navbar bg-panel/90 backdrop-blur-xl" aria-label="Main navigation" onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
          document.getElementById('menu-toggle')?.focus();
        }
      }}>
        <a className="brand font-sans" href="#home" onClick={() => setIsOpen(false)}>
          <span className="brand-mark" aria-hidden="true">{initials}</span>
          <span className="brand-copy">{name}</span>
        </a>
        <button id="menu-toggle" className="menu-toggle font-mono" type="button" aria-expanded={isOpen} aria-controls="navigation-links" onClick={() => setIsOpen(!isOpen)}>
          <span aria-hidden="true">{isOpen ? '\u00d7' : '\u2630'}</span> {isOpen ? 'Close' : 'Menu'}
        </button>
        <ul id="navigation-links" className={`nav-links ${isOpen ? 'is-open' : ''}`}>
          {links.map((link) => {
            const active = link.href === hash || (link.href === '#home' && !hash);
            return <li key={link.href}>
              <a href={link.href} aria-current={active ? (link.href === '#/projects' ? 'page' : 'location') : undefined} className={active ? 'is-active' : ''} onClick={() => setIsOpen(false)}>
                <span className="nav-icon" aria-hidden="true">{icons[link.label]}</span>
                <span>{link.label}</span>{active && <motion.span className="nav-active-backdrop" layoutId="active-destination" transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 30 }} />}<span className="nav-gem" aria-hidden="true">&#9670;</span>
              </a>
            </li>;
          })}
        </ul>
        <button className="theme-switch" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          <span aria-hidden="true">{theme === 'dark' ? '\u263e' : '\u2600'}</span>
          <span className="theme-switch-label">{theme === 'dark' ? 'Night' : 'Day'}</span>
        </button>
      </nav>
    </header>
  );
}