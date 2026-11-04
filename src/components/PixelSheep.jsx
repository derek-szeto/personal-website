import { sheepPalette, sheepParts, sheepPixel } from './sheepModel.js';
const project = ([x, y, z]) => [116 + (x - z) * 35, 122 + (x + z) * 17.5 - y * 35];
const path = points => `${points.map((point, i) => `${i ? 'L' : 'M'}${project(point).map(n => Math.round(n * 100) / 100).join(' ')}`).join(' ')}Z`;
function cell(face, u, v) {
  const [origin, a, , b] = face;
  return origin.map((n, i) => n + (a[i] - n) * u + (b[i] - n) * v);
}
function Voxel({ part, seed }) {
  const { position: [x, y, z], size: [w, h, d], material } = part;
  const x0 = x - w / 2, x1 = x + w / 2, y0 = y - h / 2, y1 = y + h / 2, z0 = z - d / 2, z1 = z + d / 2;
  const faces = [
    { color: 'side', points: [[x1,y1,z1],[x1,y1,z0],[x1,y0,z0],[x1,y0,z1]] },
    { color: 'front', points: [[x0,y1,z1],[x1,y1,z1],[x1,y0,z1],[x0,y0,z1]] },
    { color: 'top', points: [[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]] },
  ];
  const palette = sheepPalette[material];
  return <g data-part={part.id}>{faces.map(({ color, points }, faceIndex) => {
    const pixels = [];
    if (['wool', 'skin', 'hoof'].includes(material)) {
      const columns = Math.max(2, Math.round((color === 'front' ? w : color === 'side' ? d : w) * 8));
      const rows = Math.max(2, Math.round((color === 'top' ? d : h) * 8));
      for (let i = 0; i < columns; i++) for (let j = 0; j < rows; j++) {
        if (sheepPixel(i, j, seed + faceIndex * 7) < 25) {
          pixels.push(path([cell(points,i/columns,j/rows),cell(points,(i+1)/columns,j/rows),cell(points,(i+1)/columns,(j+1)/rows),cell(points,i/columns,(j+1)/rows)]));
        }
      }
    }
    return <g key={color}><path d={path(points)} fill={palette[color]} /><path d={pixels.join(' ')} fill={palette.patch} opacity={material === 'wool' ? .12 : .2} /></g>;
  })}</g>;
}
function Parts({ group }) {
  return sheepParts.filter(part => part.group === group).map((part, i) => <Voxel key={part.id} part={part} seed={i + group.length} />);
}
export function SheepArtwork({ shadow = true, sparkles = true }) {
  return <>
    {shadow && <ellipse className="sheep-ground" cx="111" cy="143" rx="65" ry="10" fill="var(--sheep-shadow, #0b293925)" />}
    <g className="sheep-character">
      <g className="sheep-leg sheep-leg-back"><Parts group="back-legs" /></g>
      <Parts group="body" />
      <g className="sheep-leg sheep-leg-front"><Parts group="front-legs" /></g>
      <g className="sheep-head"><Parts group="head" /><g className="sheep-eyes"><Parts group="eyes" /></g></g>
    </g>
    {sparkles && <g className="sheep-hover-stars" fill="var(--rose)"><path d="M31 28q0 7 7 7-7 0-7 7 0-7-7-7 7 0 7-7M189 27q0 5 5 5-5 0-5 5 0-5-5-5 5 0 5-5" /></g>}
  </>;
}
export default function PixelSheep() {
  return <svg className="directory-sheep pixel-sheep" viewBox="0 0 220 170" aria-hidden="true" focusable="false"><SheepArtwork /></svg>;
}