import { useId } from 'react';

export default function GroveFallback({ type }) {
  const id = `grove-prism-${useId().replace(/:/g, '')}`;
  const blue = 'var(--grove-object-blue, #61d9ff)';
  const pink = 'var(--grove-object-pink, #f58cc8)';
  const mint = 'var(--grove-object-mint, #83e9ce)';
  const ink = 'var(--grove-object-ink, #294d68)';
  const wool = 'var(--grove-object-wool, #e6faff)';
  const prism = `url(#${id})`;
  const objects = {
    about: <>
      <path d="m43 137 57-24 57 24-57 25Z" fill={mint} />
      <path d="m43 137 57 25v16l-33-12Z" fill={ink} stroke={blue} /><path d="m100 162 57-25-23 29-34 12Z" fill={blue} />
      <path d="m93 91 14-4v51l-14 5Z" fill={ink} stroke={mint} />
      <path d="M51 98c-13-6-17-22-7-32-2-15 11-27 25-24 7-15 27-17 37-5 14-8 31 0 31 15 16 0 27 16 19 30 8 13-1 28-16 28H72Z" fill={wool} />
      <path d="M52 96c13 3 22-2 26-10 12 8 26 5 33-5 13 8 30 5 39-4l6 5c8 13-1 28-16 28H72Z" fill={mint} stroke="none" />
      <path d="m65 62 13-5 9 5-12 6Zm40-12 13 5-10 7-13-6Zm15 44 12-6 9 6-12 6Z" fill={blue} stroke="none" opacity=".55" />
    </>,
    photos: <>
      <path d="m39 53 77-21 29 92-77 21Z" fill={ink} stroke={pink} strokeWidth="4" />
      <path d="m51 61 58-16 20 65-58 17Z" fill={pink} fillOpacity=".2" stroke={pink} />
      <path d="m75 77 74-20 27 87-74 21Z" fill={ink} stroke={blue} strokeWidth="4" />
      <path d="m87 85 55-15 19 61-55 16Z" fill={blue} fillOpacity=".2" stroke={mint} />
      <path d="m101 131 10-25 18 12 11-20 16 22" stroke={mint} strokeWidth="3" /><circle cx="108" cy="93" r="5" fill={pink} stroke="none" />
      <path d="m42 47-7-9m97-12 4-11m36 65 12-3" stroke={blue} strokeWidth="2" />
    </>,
    projects: <>
      <path d="m32 147 67-25 69 24-65 26Z" fill={ink} stroke={mint} />
      <path d="m74 63 26-37 25 36-8 68-17 21-19-22Z" fill={prism} />
      <path d="m100 26 1 125M74 63l27 16 24-17m-44 67 20-50 16 51" stroke={wool} strokeOpacity=".7" />
      <path d="m30 104 20-27 20 27-5 43-15 18-15-19Z" fill={blue} /><path d="m50 77 1 88m-21-61 21 12 19-12" stroke={ink} />
      <path d="m127 94 19-29 22 30-8 52-15 18-15-20Z" fill={pink} /><path d="m146 65-1 100m-18-71 18 13 23-12" stroke={ink} />
    </>,
    skills: <>
      {[{ color: blue, angle: -58 }, { color: pink, angle: 58 }, { color: mint, angle: 0 }].map(({ color, angle }) => <g key={angle} transform={`rotate(${angle} 100 95)`}>
        <ellipse cx="100" cy="95" rx="66" ry="27" stroke={ink} strokeWidth="9" /><ellipse cx="100" cy="95" rx="66" ry="27" stroke={color} strokeWidth="5" />
      </g>)}
      <path d="m100 74 19 21-19 22-19-22Z" fill={prism} /><path d="m100 74 1 43m-20-22h38" stroke={wool} />
      <circle cx="166" cy="95" r="6" fill={blue} /><circle cx="66" cy="151" r="5" fill={pink} />
    </>,
    interests: <>
      <path d="M100 111v55m0-14c-19 0-30-10-34-23 18-2 30 8 34 23Zm1 7c18-1 29-12 31-25-18 0-28 11-31 25Z" fill={mint} stroke={ink} strokeWidth="3" />
      {[blue, pink, mint, blue, pink, mint].map((color, index) => <path key={index} transform={`rotate(${index * 60} 100 85)`} d="M100 87C76 77 80 49 100 35c20 14 24 42 0 52Z" fill={color} />)}
      <path d="m100 73 12 12-12 12-12-12Z" fill={wool} /><path d="m100 78 7 7-7 7-7-7Z" fill={pink} stroke="none" />
    </>,
    contact: <>
      <circle cx="100" cy="45" r="29" stroke={ink} strokeWidth="11" />
      <circle cx="100" cy="45" r="29" stroke={blue} strokeWidth="7" />
      <path d="M100 16a29 29 0 0 1 29 29" stroke={pink} strokeWidth="3" />
      <circle cx="129" cy="45" r="3" fill={mint} stroke="none" />
      <path d="M34 151v-18c0-28 31-42 66-42s66 14 66 42v18q0 11-11 11H45q-11 0-11-11Z" stroke={ink} strokeWidth="11" />
      <path d="M34 151v-18c0-28 31-42 66-42s66 14 66 42v18q0 11-11 11H45q-11 0-11-11Z" stroke={blue} strokeWidth="7" />
      <path d="M67 162h66" stroke={pink} strokeWidth="3" />
    </>,
  };
  return <svg className="grove-fallback" viewBox="0 0 200 200" role="presentation" aria-hidden="true" focusable="false" fill="none">
    <defs><linearGradient id={id} x1="65" y1="40" x2="144" y2="155" gradientUnits="userSpaceOnUse"><stop stopColor={blue} /><stop offset=".55" stopColor={mint} /><stop offset="1" stopColor={pink} /></linearGradient></defs>
    <g stroke={ink} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">{objects[type] || objects.about}</g>
  </svg>;
}
