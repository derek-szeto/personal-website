import ForestArt from './ForestArt.jsx';
import { useState } from 'react';

export default function VillageScene() {
  const [active, setActive] = useState(false);
  return <div className="forest-scene" onPointerEnter={() => setActive(true)} onPointerLeave={() => setActive(false)} onPointerCancel={() => setActive(false)}><ForestArt active={active} /></div>;
}
