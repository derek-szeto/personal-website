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
      <path d="m45 147 55-22 55 22-21 30-34 11-37-14Z" fill={ink} />
      <path d="m45 147 55-22 55 22-55 21Z" fill={mint} />
      <path d="m77 172 4 16 7-18m30 3 4 13 6-18" fill={blue} stroke="none" />
      <path d="M97 150c-14-22 6-32 3-58l8-27m-7 47L71 86m32 17 25-19m-27 51-21 16m23-17 23 16" stroke={ink} strokeWidth="9" />
      <path d="m35 77 18-24 32-7 17-17 32 15 23 29-20 20-33-1-23 6-28-6Z" fill={mint} />
      <path d="m35 77 49-31-10 43Zm49-31 18-17 12 49Zm30 32 20-34 23 29-20 20Z" fill={blue} fillOpacity=".5" />
      {[55,76,124,146].map((x,index) => <g key={x}><path d={`M${x} 83q-9 19 0 ${27+index%2*12}`} stroke={mint} strokeWidth="2" /><path d={`m${x} 96-6 7 6 7 5-7Z`} fill={mint} stroke="none" /><path d={`m${x} ${111+index%2*12}-4 6 4 6 4-6Z`} fill={index%2 ? blue : pink} stroke="none" /></g>)}
      <path d="M71 148q-13-15-23-9 5 14 23 9Zm57 1q11-18 23-12-5 14-23 12Z" fill={mint} />
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
      <path d="m43 160 57-19 57 19-18 20H67Z" fill={ink} /><ellipse cx="100" cy="158" rx="53" ry="14" fill={mint} /><ellipse cx="100" cy="158" rx="38" ry="9" stroke={blue} strokeWidth="2" />
      <path d="M100 149c18-32-16-32 0-64m0 47c-18-16-34-13-37-20 0 17 14 24 37 20Zm3 12c18-12 30-8 33-20-18-3-30 7-33 20Z" fill={mint} stroke={ink} strokeWidth="3" />
      {[blue,pink,blue,mint,blue,pink,blue,mint].map((color,index) => <g key={index} transform={`rotate(${index*45} 100 82)`}><path d="M100 89 85 70 89 40 100 27l12 13 3 30Z" fill={color} /><path d="m100 27 1 55-12-42Z" fill={wool} fillOpacity=".32" stroke="none" /></g>)}
      {[0,72,144,216,288].map(angle => <path key={angle} transform={`rotate(${angle} 100 82)`} d="M100 88 91 67l9-17 10 17Z" fill={pink} />)}
      <path d="m100 72 10 10-10 10-10-10Z" fill={wool} />
      <path d="M55 161v-13m87 16v-19" stroke={wool} strokeWidth="5" /><path d="M43 149q12-24 24 0Zm83-3q16-29 32 0Z" fill={pink} /><circle cx="54" cy="143" r="2" fill={mint} /><circle cx="144" cy="137" r="2" fill={wool} />
    </>,
    contact: <>
      <path d="m55 170 45-17 45 17-17 13H73Z" fill={ink} /><ellipse cx="100" cy="167" rx="40" ry="10" fill={mint} />
      <ellipse cx="100" cy="35" rx="12" ry="17" stroke={ink} strokeWidth="5" /><circle cx="100" cy="53" r="4" fill={pink} />
      <path d="m63 76 37-23 37 23-10 8H73Z" fill={ink} /><path d="m63 76 37-5 37 5" stroke={blue} strokeWidth="3" />
      <path d="M73 83h54v68H73Z" fill={blue} fillOpacity=".14" stroke={blue} /><path d="m73 83 14 7h26l14-7m-40 7v61m26-61v61" stroke={ink} strokeWidth="3" />
      <path d="m100 96 12 20-4 16-8 7-11-13 2-13Z" fill={blue} /><path d="m100 94 4 30-7 8-3-16Z" fill={wool} stroke="none" /><circle cx="113" cy="103" r="3" fill={pink} />
      <path d="m68 149 32 6 32-6v12l-32 7-32-7Z" fill={ink} stroke={blue} />
      <path d="M66 158c-35-40 68-28 63-80m-59 57q-21-2-23-19 19-1 23 19Zm43-26q-1-17 14-24 7 15-14 24Z" fill={mint} stroke={mint} strokeWidth="2" /><path d="m67 110-5 7 5 7 5-7Z" fill={pink} stroke="none" />
    </>,
  };
  return <svg className="grove-fallback" viewBox="0 0 200 200" role="presentation" aria-hidden="true" focusable="false" fill="none">
    <defs><linearGradient id={id} x1="65" y1="40" x2="144" y2="155" gradientUnits="userSpaceOnUse"><stop stopColor={blue} /><stop offset=".55" stopColor={mint} /><stop offset="1" stopColor={pink} /></linearGradient></defs>
    <g stroke={ink} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">{objects[type] || objects.about}</g>
  </svg>;
}
