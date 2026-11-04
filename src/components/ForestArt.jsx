import { Fern, Shrub } from './Botanical.jsx';
import { SheepArtwork } from './PixelSheep.jsx';
import { useId } from 'react';
export function WoolTree({ x, y, size = 1, pink = false }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <path d="M0 12V-95M0-42l-22-23M0-61l22-18" stroke="var(--trunk)" strokeWidth="12" strokeLinecap="round" />
    <g fill={pink ? 'var(--rose-tree)' : 'var(--wool-tree)'} stroke={pink ? 'var(--rose-shade)' : 'var(--wool-shade)'} strokeWidth="1.5">
      <circle cx="-24" cy="-103" r="30" /><circle cx="14" cy="-129" r="33" /><circle cx="37" cy="-95" r="28" /><circle cx="0" cy="-91" r="36" /><circle cx="-17" cy="-137" r="25" />
    </g>
    <g fill="none" stroke="var(--thread)" strokeWidth="2" opacity=".55"><path d="M-35-110q15-20 27-1t-14 16q-15-5 2-13M4-137q20-17 25 3t-16 11q-9-10 5-12M-9-98q26-23 31 3t-25 19q-19-12 1-20" /></g>
  </g>;
}
export function BlockSheep({ x, y, size = 1 }) {
  return <g transform={`translate(${x - 55 * size} ${y - 68 * size}) scale(${size * .5})`}><SheepArtwork sparkles={false} /></g>;
}
export default function ForestArt({ compact = false, pink = false }) {
  const glowId = useId();
  return <svg className={`forest-art ${compact ? 'compact-forest' : ''}`} viewBox="0 0 680 570" role={compact ? undefined : 'img'} aria-hidden={compact || undefined} aria-label={compact ? undefined : 'A magical wool forest with mint and rose pink trees, moonlight, floating islands, and blocky sheep.'}>
    <defs><radialGradient id={glowId}><stop stopColor="var(--forest-glow)" stopOpacity=".65" /><stop offset="1" stopColor="var(--forest-glow)" stopOpacity="0" /></radialGradient></defs>
    <ellipse cx="355" cy="260" rx="300" ry="250" fill={`url(#${glowId})`} />
    <circle cx="510" cy="100" r="42" fill="var(--moon)" /><circle cx="494" cy="88" r="40" fill="var(--scene-bg)" />
    <g className="forest-stars" fill="var(--mint-glow)">{[[90,130],[180,60],[355,107],[555,230],[600,150],[120,290],[450,60]].map(([x,y]) => <path key={x} d={`M${x} ${y-7}q0 7 7 7-7 0-7 7 0-7-7-7 7 0 7-7`} />)}</g>
    <g className="floating-island"><path d="M110 365Q320 280 560 350L470 456 235 480Z" fill="var(--island-side)" /><path d="M110 365Q310 267 560 350 480 435 235 420Z" fill="var(--moss)" /><path d="M146 368q151-67 360-20" fill="none" stroke="var(--moss-light)" strokeWidth="3" opacity=".6" />
      <WoolTree x={242} y={337} size={1.22} /><WoolTree x={419} y={351} size={1.06} pink /><WoolTree x={145} y={362} size={.65} />
<Fern x={177} y={391} size={.65} /><Shrub x={469} y={383} size={.8} rose /><Shrub x={208} y={355} size={.5} /><Fern x={391} y={405} size={.5} mirrored />
      <BlockSheep x={322} y={381} size={1.03} /><BlockSheep x={227} y={391} size={.62} />
      <g fill="var(--rose-tree)"><path d="M459 378l9-20 11 20zM487 384l7-14 9 14z" /></g>
      <g stroke="var(--mint-glow)" strokeWidth="2" fill="none"><path d="M162 383v-14m-5 7h10M394 394v-15m-6 7h12M504 360v-12m-5 6h10" /></g>
    </g>
    <g fill="var(--moss)"><path d="M496 211l49-18 41 16-38 17z" /><path d="M70 247l35-12 31 10-32 14z" /></g><g fill="var(--island-side)"><path d="M496 211l52 15 38-17-38 40z" /><path d="M70 247l34 12 32-14-32 31z" /></g>
    <g fill="var(--rose-tree)"><rect x="535" y="164" width="17" height="32" rx="7" /><rect x="95" y="216" width="13" height="22" rx="6" /></g>
    <path d="M265 485q45 19 85 0m-65 18q22 8 43 0" fill="none" stroke="var(--mint-glow)" strokeWidth="2" opacity=".4" />
  </svg>;
}