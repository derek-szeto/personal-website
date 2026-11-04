import { useEffect, useMemo } from 'react';
import { DataTexture, RGBAFormat, NearestFilter, SRGBColorSpace } from 'three';
import { sheepPalette, sheepParts, sheepPixel } from './sheepModel.js';
function makeTexture(material, side, seed) {
  const palette = sheepPalette[material];
  const color = palette[side];
  const number = parseInt(color.slice(1), 16);
  const rgb = [number >> 16, (number >> 8) & 255, number & 255];
  const data = new Uint8Array(16 * 16 * 4);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const patch = ['wool', 'skin', 'hoof'].includes(material) && sheepPixel(x, y, seed) < 25;
    const offset = (y * 16 + x) * 4;
    for (let c = 0; c < 3; c++) data[offset + c] = Math.round(rgb[c] * (patch ? .91 : 1));
    data[offset + 3] = 255;
  }
  const texture = new DataTexture(data, 16, 16, RGBAFormat);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
function SheepVoxel({ part, seed }) {
  const textures = useMemo(() => ['side','side','top','side','front','side'].map((side, i) => makeTexture(part.material, side, seed + i)), [part, seed]);
  useEffect(() => () => textures.forEach(texture => texture.dispose()), [textures]);
  return <mesh position={part.position} castShadow receiveShadow><boxGeometry args={part.size} />{textures.map((map, i) => <meshStandardMaterial key={i} attach={`material-${i}`} map={map} roughness={1} />)}</mesh>;
}
export default function PixelSheep3D({ position, rotation = 0, scale = .4 }) {
  return <group position={position} rotation={[0,rotation,0]} scale={scale}>{sheepParts.map((part, i) => <SheepVoxel key={part.id} part={part} seed={i} />)}</group>;
}