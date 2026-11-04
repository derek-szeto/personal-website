import { useEffect, useRef } from 'react';

export function Fern({ x = 0, y = 0, size = 1, mirrored = false }) {
  return <g transform={`translate(${x} ${y}) scale(${mirrored ? -size : size} ${size})`}>
    <g className="plant-frond">
      <path d="M0 0Q-13-35-46-67" fill="none" stroke="var(--plant-stem)" strokeWidth="2" />
      {[0,1,2,3,4].map(i => <g key={i} transform={`translate(${-6-i*8} ${-13-i*10}) rotate(${-i*5})`}>
        <path d="M0 0Q-21 2-25-14  -9-15 0 0" fill="var(--plant-leaf)" />
        <path d="M0 0Q6-18 0-25-10-14 0 0" fill="var(--plant-light)" />
      </g>)}
      <path d="M0 0Q-2-28 13-55" fill="none" stroke="var(--plant-stem)" strokeWidth="2" />
      {[0,1,2].map(i => <g key={i} transform={`translate(${2+i*3} ${-14-i*12})`}><path d="M0 0Q-17-3-14-17 0-13 0 0" fill="var(--plant-light)" /><path d="M0 0Q20-2 17-17 3-14 0 0" fill="var(--plant-leaf)" /></g>)}
    </g>
  </g>;
}

export function Shrub({ x = 0, y = 0, size = 1, rose = false }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <g className="plant-shrub">
      <path d="M-34 0Q-50-19-31-26-37-47-14-43-3-62 11-40 33-48 32-27 57-15 35 0Z" fill="var(--plant-deep)" />
      <path d="M-31-3Q-34-22-17-22-23-42-3-39 13-48 17-28 35-31 34-8Z" fill="var(--plant-leaf)" />
      <path d="M0-1V-34M0-14l-13-10M0-21l12-10" stroke="var(--plant-light)" strokeWidth="1.5" fill="none" />
      <g fill={rose ? 'var(--rose)' : 'var(--mint-glow)'}><circle cx="-22" cy="-29" r="3" /><circle cx="17" cy="-32" r="3.5" /><circle cx="29" cy="-17" r="2.5" /></g>
    </g>
  </g>;
}

export default function Botanical({ className = '', variant = 'cluster' }) {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (ref.current) ref.current.dataset.growing = String(entry.isIntersecting);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <svg ref={ref} className={`botanical ${className}`} viewBox="0 0 220 130" aria-hidden="true" focusable="false" data-growing="false">
    <ellipse cx="111" cy="115" rx="78" ry="7" fill="var(--ground-shadow)" />
    {variant !== 'shrub' && <Fern x={103} y={111} size={1.15} />}
    {variant !== 'fern' && <Shrub x={145} y={114} size={.9} rose />}
    {variant === 'cluster' && <><Fern x={161} y={113} size={.65} mirrored /><Shrub x={78} y={115} size={.55} /><g fill="var(--rose)"><path d="m111 107 5-17 6 17-6 5Z" /><path d="m126 112 4-11 5 10-5 4Z" /></g></>}
    <path d="M44 77v7m-3-3h6M177 60v9m-4-5h8" fill="none" stroke="var(--mint-glow)" strokeWidth="1.5" />
  </svg>;
}
