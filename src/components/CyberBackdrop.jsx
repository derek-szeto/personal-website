import { useEffect, useId } from 'react';

const lightSurfaces = '.hero-visual,.section,.explore-card,.contact-board,.journal-heading,.interests-page-heading,.interests-navigation,.interest-scroll-section,.project-card,.activity-card,.adventure-header,.site-footer';

// Keep ambient light outside React's render loop, and pause off-screen surfaces.
export default function CyberBackdrop({ active = true }) {
  const id = useId();
  useEffect(() => {
    const root = document.documentElement;
    const visibility = () => { root.dataset.pageVisible = String(!document.hidden); };
    visibility();
    document.addEventListener('visibilitychange', visibility);
    const observed = new WeakSet();
    const observer = window.IntersectionObserver ? new IntersectionObserver(entries => {
      entries.forEach(entry => { entry.target.dataset.lightActive = String(entry.isIntersecting); });
    }, { rootMargin: '40px' }) : null;
    const update = (node, add) => {
      if (!(node instanceof Element)) return;
      const elements = [...(node.matches(lightSurfaces) ? [node] : []), ...node.querySelectorAll(lightSurfaces)];
      elements.forEach(element => {
        if (!add) { observer?.unobserve(element); observed.delete(element); return; }
        if (observed.has(element)) return;
        observed.add(element);
        if (observer) observer.observe(element);
        else element.dataset.lightActive = 'true';
      });
    };
    update(document.body, true);
    const mutations = new MutationObserver(records => records.forEach(record => {
      record.removedNodes.forEach(node => update(node, false));
      record.addedNodes.forEach(node => update(node, true));
    }));
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer?.disconnect(); mutations.disconnect();
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  const routes = [
    'M-20 750H76V524L140 460V214L218 136V-20',
    'M-20 804H108V558L172 494V248L250 170V-20',
    'M1460 720H1364V506L1300 442V198L1222 120V-20',
    'M1460 776H1332V540L1268 476V232L1190 154V-20',
  ];
  return <div className="cyber-backdrop" data-running={active} aria-hidden="true">
    <div className="cyber-aura cyber-aura-blue" /><div className="cyber-aura cyber-aura-pink" />
    <svg className="cyber-environment" viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs><linearGradient id={`${id}-canopy`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--electric-blue)" /><stop offset=".5" stopColor="var(--grove-mint)" /><stop offset="1" stopColor="var(--electric-pink)" /></linearGradient></defs>
      <g className="cyber-canopy" fill="none" stroke={`url(#${id}-canopy)`} strokeWidth="1">
        <path d="M-20 25 120 128 176 280M120 128 212 82 280 90M120 128 66 236 82 324M176 280 250 234 298 258M66 236 18 208M212 82 238 26M1460 34 1320 148 1264 300M1320 148 1228 102 1160 110M1320 148 1374 256 1358 344M1264 300 1190 254 1142 278M1228 102 1202 46" />
        <path d="M50 180q-55-85-61-40 12 51 61 40Zm143-88q44-71 64-31-15 40-64 31Zm-19 188q41-55 64-22-13 35-64 22Zm1215-78q55-85 61-40-12 51-61 40Zm-143-88q-44-71-64-31 15 40 64 31Zm19 188q-41-55-64-22 13 35 64 22Z" />
      </g>
      <g className="cyber-circuit-base" fill="none" strokeWidth="1">{routes.map(route => <path key={route} d={route} />)}</g>
      <g className="cyber-current" fill="none" strokeWidth="2">{routes.map((route, index) => <path key={route} d={route} pathLength="1" className={index % 2 ? 'current-pink' : 'current-blue'} style={{ animationDelay: `${index * -3.6}s` }} />)}</g>
      <g className="cyber-points">{[[76,524],[140,214],[218,136],[108,804],[1364,506],[1300,198],[1222,120],[1332,776]].map(([cx,cy],index) => <circle key={cx} cx={cx} cy={cy} r="3" style={{ animationDelay: `${index * -.8}s` }} />)}</g>
    </svg>
    <div className="cyber-floor" />
  </div>;
}
