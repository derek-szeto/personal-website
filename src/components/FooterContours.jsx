import { useId } from 'react';

const WIDTH = 1440;
const HEIGHT = 520;
const RIDGE = [[0,4],[225,98],[450,52],[680,300],[930,105],[1185,220],[1440,35]];
const round = value => Math.round(value);

function contour(index) {
  const depth = index / 37;
  const baseline = 36 + index * 12.2;
  const points = RIDGE.map(([x, lift], knot) => [
    x === 0 || x === WIDTH ? x : round(x + Math.sin(index * .12 + knot * 1.7) * (7 + depth * 9)),
    round(baseline - lift * (.06 + depth * .62) + Math.sin(index * .17 + knot * 1.3) * 6),
  ]);
  let path = `M0 ${points[0][1]}`;
  for (let knot = 1; knot < points.length - 1; knot++) {
    const [x,y] = points[knot];
    const next = points[knot + 1];
    path += `Q${x} ${y} ${round((x + next[0]) / 2)} ${round((y + next[1]) / 2)}`;
  }
  return `${path}Q1406 ${points.at(-1)[1]} 1440 ${points.at(-1)[1]}`;
}

const paths = Array.from({ length: 38 }, (_, index) => contour(index));
const highlights = [8, 20, 32];

export default function FooterContours({ className = '' }) {
  const id = `footer-contours-${useId().replace(/:/g, '')}`;
  const stroke = `${id}-stroke`;
  const current = `${id}-current`;
  const fade = `${id}-fade`;
  const mask = `${id}-mask`;
  return <svg className={`footer-contours${className ? ` ${className}` : ''}`} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" fill="none">
    <defs>
      <linearGradient id={stroke} x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="var(--electric-blue, #62dcff)" stopOpacity=".08" />
        <stop offset=".22" stopColor="var(--electric-blue, #62dcff)" stopOpacity=".4" />
        <stop offset=".55" stopColor="var(--electric-pink, #f29bcc)" stopOpacity=".5" />
        <stop offset=".82" stopColor="var(--electric-blue, #62dcff)" stopOpacity=".32" />
        <stop offset="1" stopColor="var(--electric-pink, #f29bcc)" stopOpacity=".08" />
      </linearGradient>
      <linearGradient id={current} x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="var(--electric-blue, #62dcff)" stopOpacity="0" />
        <stop offset=".35" stopColor="var(--electric-blue, #62dcff)" />
        <stop offset=".68" stopColor="var(--electric-pink, #f29bcc)" />
        <stop offset="1" stopColor="var(--electric-pink, #f29bcc)" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={fade} x1="0" y1="0" x2="0" y2="520" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fff" stopOpacity=".18" />
        <stop offset=".25" stopColor="#fff" stopOpacity=".9" />
        <stop offset=".66" stopColor="#fff" stopOpacity=".75" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <mask id={mask} x="0" y="0" width="1440" height="520" maskUnits="userSpaceOnUse"><rect width="1440" height="520" fill={`url(#${fade})`} /></mask>
    </defs>
    <g mask={`url(#${mask})`} strokeLinecap="round" strokeLinejoin="round">
      <g className="footer-contour-base" stroke={`url(#${stroke})`} strokeWidth=".9">{paths.map((d,index) => <path key={index} d={d} />)}</g>
      <g stroke={`url(#${current})`} strokeWidth="1.25" opacity=".65">{highlights.map(index => <path key={index} className="footer-contour-current" pathLength="1" d={paths[index]} />)}</g>
    </g>
  </svg>;
}
