import Botanical from './Botanical.jsx';
import PixelSheep from './PixelSheep.jsx';
import { useRef, useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import Arrow from './Arrow.jsx';
const destinations = [
  { label: 'About', href: '#about', color: 'mint', reaction: 'nod', badge: 'star' },
  { label: 'Photos', href: '#photos', color: 'moon', reaction: 'wiggle', badge: 'camera' },
  { label: 'Projects', href: '#/projects', color: 'rose', reaction: 'hop', badge: 'code' },
  { label: 'Skills', href: '#skills', color: 'moon', reaction: 'wiggle', badge: 'spark' },
  { label: 'Interests', href: '#interests', color: 'lilac', reaction: 'prance', badge: 'flower' },
  { label: 'Contact', href: '#contact', color: 'teal', reaction: 'greet', badge: 'mail' },
];
export function DirectorySheep() { return <PixelSheep />; }
export default function SheepDirectory() {
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();
  const root = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .05 });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  function followPointer(event) {
    if (paused || reduced) return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--look-x', `${((event.clientX - box.left) / box.width - .5) * 5}px`);
    event.currentTarget.style.setProperty('--look-y', `${((event.clientY - box.top) / box.height - .5) * 4}px`);
  }
  function resetPointer(event) {
    event.currentTarget.style.setProperty('--look-x', '0px');
    event.currentTarget.style.setProperty('--look-y', '0px');
  }
  return <nav ref={root} className="site-container sheep-directory" aria-label="Explore my website" data-paused={paused || reduced || !visible}>
    <div className="sheep-directory-heading"><h2>Explore</h2><button className="sheep-pause" type="button" aria-pressed={paused} aria-label={reduced ? 'Reduced motion enabled' : paused ? 'Resume animations' : 'Pause animations'} title={reduced ? 'Reduced motion enabled' : paused ? 'Resume animations' : 'Pause animations'} onClick={() => setPaused(!paused)} disabled={Boolean(reduced)}><span aria-hidden="true">{paused || reduced ? '\u25b7' : '\u2161'}</span></button></div>
    <div className="sheep-directory-grid">{destinations.map((item, index) => <a key={item.href} className="sheep-destination group relative overflow-hidden" href={item.href} data-color={item.color} data-reaction={item.reaction} style={{ '--sheep-delay': `${index * -.8}s` }} onPointerMove={followPointer} onPointerLeave={resetPointer}>
      <Botanical className="directory-foliage" variant={index % 2 ? 'fern' : 'shrub'} /><DirectorySheep badge={item.badge} /><span className="sheep-destination-label font-mono">{item.label}<Arrow /></span>
    </a>)}</div>
  </nav>;
}