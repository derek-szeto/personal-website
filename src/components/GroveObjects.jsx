import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CubicBezierCurve3, DoubleSide, MathUtils, MeshStandardMaterial, Vector3 } from 'three';

const HALF_PI = Math.PI / 2;

function makePalette(night) {
  const material = (color, emissive, glow, extra = {}) => {
    const result = new MeshStandardMaterial({ color, emissive, emissiveIntensity: glow, roughness: .38, metalness: .22, flatShading: true, ...extra });
    result.userData.baseGlow = glow;
    return result;
  };
  return {
    cyan: material('#70dcff', '#29a6dc', .65, { roughness: .25 }),
    pink: material('#ff9ac8', '#e64691', .58, { roughness: .29 }),
    mint: material('#b5ffe3', '#4cbf9d', .4),
    stone: material(night ? '#172a46' : '#54718d', '#193756', .05, { roughness: .72, metalness: .12 }),
    metal: material(night ? '#233a56' : '#7d9ab5', '#1b4665', .08, { roughness: .25, metalness: .65 }),
    wool: material(night ? '#cae9f3' : '#e5f7ff', '#3d879b', .1, { roughness: .9, metalness: 0 }),
    wood: material(night ? '#578894' : '#416a79', '#193e4c', .04, { roughness: .8, metalness: .05 }),
    glass: material('#68d9ff', '#197496', .25, { transparent: true, opacity: .13, side: DoubleSide, depthWrite: false, roughness: .1 }),
    leaf: material(night ? '#368b89' : '#277f79', '#1e625d', .12, { roughness: .75, metalness: .04 }),
    moss: material(night ? '#326771' : '#4c8d89', '#1d5b64', .08, { roughness: .9, metalness: 0 }),
  };
}

function Gem({ material, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0], size = .5 }) {
  return <mesh material={material} position={position} scale={scale} rotation={rotation}><octahedronGeometry args={[size, 0]} /></mesh>;
}

function Vine({ points, material, radius = .025 }) {
  const curve = useMemo(() => new CubicBezierCurve3(...points.map(point => new Vector3(...point))), [points]);
  return <mesh material={material}><tubeGeometry args={[curve, 16, radius, 5, false]} /></mesh>;
}

function Leaf({ material, position, rotation = [0,0,0], scale = [1,1,1] }) {
  return <mesh material={material} position={position} rotation={rotation} scale={scale}><icosahedronGeometry args={[.2,0]} /></mesh>;
}

function EnchantedWillow({ palette: p, rotor }) {
  return <group position={[0,.36,0]}>
    <mesh material={p.stone} position={[0,-.61,0]} scale={[1,.36,.76]} rotation={[0,.24,0]}><dodecahedronGeometry args={[.62,0]} /></mesh>
    <mesh material={p.moss} position={[0,-.52,0]}><cylinderGeometry args={[.54,.47,.12,9]} /></mesh>
    <Gem material={p.cyan} position={[-.29,-.76,.15]} scale={[.6,1.7,.6]} size={.12} />
    <Gem material={p.pink} position={[.21,-.72,.29]} scale={[.6,1.4,.6]} size={.08} />
    <Vine material={p.wood} radius={.075} points={[[0,-.52,0],[-.14,-.12,0],[.17,.14,-.03],[.05,.6,0]]} />
    {[-1,1].map(side => <group key={side}>
      <Vine material={p.wood} radius={.038} points={[[.02,-.02,0],[side*.12,.21,0],[side*.39,.18,-.03],[side*.43,.43,0]]} />
      <Vine material={p.wood} radius={.035} points={[[0,-.35,.01],[side*.09,-.51,.05],[side*.27,-.44,.21],[side*.39,-.51,.23]]} />
    </group>)}
    <group ref={rotor} position={[0,.41,0]}>
      {[[0,.22,-.07,.43],[-.34,.05,-.02,.33],[.32,.09,-.04,.34],[0,-.02,.21,.3]].map(([x,y,z,r],index) => <mesh key={index} material={index % 2 ? p.leaf : p.mint} position={[x,y,z]} scale={[1,.48,.8]} rotation={[.08,index*.6,.12]}><icosahedronGeometry args={[r,1]} /></mesh>)}
      {Array.from({length:7},(_,index) => {
        const angle = index*Math.PI*2/7;
        const x = Math.cos(angle)*.43, z = Math.sin(angle)*.25;
        const length = .26 + (index%3)*.075;
        return <group key={index} position={[x,-.02,z]}>
          <Vine material={p.leaf} radius={.012} points={[[0,0,0],[x*.25,-.08,.02],[x*.12,-length*.7,.03],[0,-length,0]]} />
          <Leaf material={index%2 ? p.cyan : p.mint} position={[.02,-length*.54,.02]} rotation={[0,.3,.3]} scale={[.34,.65,.2]} />
          <Gem material={index%2 ? p.pink : p.cyan} position={[0,-length,0]} size={.037} scale={[.65,1.35,.65]} />
        </group>;
      })}
    </group>
    <Leaf material={p.mint} position={[-.34,-.46,.28]} rotation={[0,0,-.65]} scale={[.8,.3,.5]} />
    <Leaf material={p.leaf} position={[.32,-.46,.18]} rotation={[0,0,.5]} scale={[.7,.3,.5]} />
  </group>;
}

function PhotoFrame({ palette: p, position, rotation, front = false }) {
  const rim = front ? p.cyan : p.pink;
  return <group position={position} rotation={rotation}>
    {[[-.46,0,.055,.075,1.17,.075],[.46,0,.055,.075,1.17,.075],[0,.55,.055,.94,.075,.075],[0,-.55,.055,.94,.075,.075]].map(([x,y,z,w,h,d],index) => <mesh key={index} material={rim} position={[x,y,z]}><boxGeometry args={[w,h,d]} /></mesh>)}
    <mesh material={p.glass}><planeGeometry args={[.86,1.03]} /></mesh>
    {front && <>
      <mesh material={p.pink} position={[-.2,.27,.035]}><sphereGeometry args={[.105,12,8]} /></mesh>
      <mesh material={p.metal} position={[.12,-.16,.02]}><coneGeometry args={[.28,.44,3]} /></mesh>
      <mesh material={p.cyan} position={[-.19,-.23,.055]}><coneGeometry args={[.23,.3,3]} /></mesh>
    </>}
  </group>;
}

function HolographicFrames({ palette }) {
  return <>
    <PhotoFrame palette={palette} position={[-.24,.13,-.16]} rotation={[.05,-.2,-.18]} />
    <PhotoFrame palette={palette} position={[.24,-.08,.13]} rotation={[-.04,.17,.12]} front />
    <Gem material={palette.mint} position={[-.69,-.56,.1]} size={.06} />
  </>;
}

function CrystalCluster({ palette: p }) {
  return <>
    <mesh material={p.stone} position={[0,-.63,0]} scale={[1.2,.35,.85]}><dodecahedronGeometry args={[.55,0]} /></mesh>
    <Gem material={p.cyan} position={[0,.1,0]} scale={[.58,1.35,.58]} rotation={[0,.28,-.05]} size={.61} />
    <Gem material={p.pink} position={[-.41,-.13,.07]} scale={[.55,1.2,.55]} rotation={[0,.25,.32]} size={.42} />
    <Gem material={p.cyan} position={[.4,-.16,-.1]} scale={[.57,1.2,.57]} rotation={[.12,.5,-.35]} size={.43} />
    <Gem material={p.mint} position={[.16,-.38,.36]} scale={[.6,1.1,.6]} rotation={[0,.4,-.2]} size={.22} />
    <Gem material={p.pink} position={[-.18,-.54,.38]} scale={[1,.45,1]} size={.12} />
  </>;
}

function Gyroscope({ palette: p, rotor }) {
  return <>
    <group ref={rotor}>
      <mesh material={p.cyan} rotation={[.3,.2,.15]}><torusGeometry args={[.68,.035,8,48]} /></mesh>
      <mesh material={p.pink} rotation={[HALF_PI,.35,.4]}><torusGeometry args={[.73,.033,8,48]} /></mesh>
      <mesh material={p.metal} rotation={[.6,HALF_PI,-.25]}><torusGeometry args={[.8,.045,8,48]} /></mesh>
      <mesh material={p.mint} position={[.68,0,0]}><sphereGeometry args={[.075,10,8]} /></mesh>
    </group>
    <Gem material={p.cyan} size={.3} rotation={[.3,.4,.5]} />
    <Gem material={p.pink} position={[0,-.41,0]} size={.07} />
  </>;
}

function MoonGarden({ palette: p, rotor }) {
  return <group position={[0,.36,0]}>
    <mesh material={p.stone} position={[0,-.66,0]} scale={[1,.3,.85]}><dodecahedronGeometry args={[.6,0]} /></mesh>
    <mesh material={p.moss} position={[0,-.55,0]}><cylinderGeometry args={[.56,.5,.1,12]} /></mesh>
    <mesh material={p.cyan} position={[0,-.49,0]} rotation={[HALF_PI,0,0]}><torusGeometry args={[.44,.012,5,32]} /></mesh>
    <Vine material={p.leaf} radius={.032} points={[[0,-.5,0],[.12,-.28,0],[-.13,-.05,0],[0,.18,0]]} />
    <Leaf material={p.leaf} position={[-.19,-.29,.04]} rotation={[.15,.2,-.6]} scale={[1.35,.4,.55]} />
    <Leaf material={p.mint} position={[.2,-.39,.08]} rotation={[.15,-.3,.6]} scale={[1.2,.36,.55]} />
    <group position={[0,.25,0]} rotation={[-.24,.15,0]}>
      <group ref={rotor}>
        {Array.from({length:8},(_,index) => {
          const angle = index*Math.PI*2/8;
          return <group key={index} rotation={[0,0,-angle]}>
            <Leaf material={index%3 === 0 ? p.pink : p.cyan} position={[0,.31,0]} rotation={[.25,0,0]} scale={[.79,1.9,.48]} />
            <Leaf material={p.mint} position={[0,.18,-.095]} rotation={[.45,0,.06]} scale={[.6,1.2,.35]} />
          </group>;
        })}
        {Array.from({length:5},(_,index) => <Leaf key={index} material={p.pink} position={[Math.sin(index*1.257)*.15,Math.cos(index*1.257)*.15,.12]} rotation={[-.3,0,-index*1.257]} scale={[.53,.95,.46]} />)}
        <mesh material={p.wool} position={[0,0,.18]}><dodecahedronGeometry args={[.115,0]} /></mesh>
        <Gem material={p.mint} position={[0,0,.28]} size={.06} />
      </group>
    </group>
    {[[-.39,-.41,.12,.1],[.38,-.39,.08,.13]].map(([x,y,z,size],index) => <group key={index} position={[x,y,z]}>
      <mesh material={p.wool} position={[0,-.035,0]}><cylinderGeometry args={[.025,.035,.18,5]} /></mesh>
      <mesh material={index ? p.pink : p.cyan} position={[0,.055,0]}><sphereGeometry args={[size,8,4,0,Math.PI*2,0,HALF_PI]} /></mesh>
      <Gem material={p.mint} position={[size*.25,.1,size*.5]} size={.025} />
    </group>)}
  </group>;
}

function SpiritLantern({ palette: p, rotor }) {
  return <group position={[0,.36,0]} rotation={[0,-.12,0]}>
    <mesh material={p.stone} position={[0,-.69,0]} scale={[1,.3,.8]}><dodecahedronGeometry args={[.49,0]} /></mesh>
    <mesh material={p.moss} position={[0,-.59,0]}><cylinderGeometry args={[.4,.35,.08,8]} /></mesh>
    <mesh material={p.metal} position={[0,-.44,0]}><cylinderGeometry args={[.32,.37,.14,6]} /></mesh>
    <mesh material={p.cyan} position={[0,-.35,0]}><cylinderGeometry args={[.31,.32,.025,6]} /></mesh>
    <mesh material={p.glass} position={[0,-.02,0]} rotation={[0,Math.PI/6,0]}><cylinderGeometry args={[.29,.29,.66,6,1,true]} /></mesh>
    {Array.from({length:6},(_,index) => {
      const angle = (index+.5)*Math.PI/3;
      return <mesh key={index} material={index%2 ? p.wood : p.metal} position={[Math.sin(angle)*.3,-.01,Math.cos(angle)*.3]}><cylinderGeometry args={[.018,.024,.7,5]} /></mesh>;
    })}
    <mesh material={p.cyan} position={[0,.34,0]}><cylinderGeometry args={[.32,.3,.035,6]} /></mesh>
    <mesh material={p.metal} position={[0,.45,0]}><coneGeometry args={[.4,.22,6]} /></mesh>
    <mesh material={p.pink} position={[0,.57,0]}><sphereGeometry args={[.045,8,6]} /></mesh>
    <mesh material={p.wood} position={[0,.71,0]}><torusGeometry args={[.14,.023,6,20]} /></mesh>
    <group ref={rotor}>
      <mesh material={p.cyan} position={[0,-.04,0]} scale={[.62,1,.62]}><icosahedronGeometry args={[.2,1]} /></mesh>
      <Gem material={p.wool} position={[0,.05,.02]} size={.12} scale={[.6,1.7,.6]} rotation={[0,0,-.18]} />
      <Gem material={p.pink} position={[.14,.14,.02]} size={.035} />
      <mesh material={p.mint} position={[-.13,-.18,.08]}><sphereGeometry args={[.025,8,6]} /></mesh>
    </group>
    <Vine material={p.leaf} radius={.025} points={[[-.28,-.44,.12],[-.57,-.02,.19],[.18,.1,.36],[.25,.39,.17]]} />
    <Leaf material={p.mint} position={[-.34,-.28,.2]} rotation={[.2,.1,-.65]} scale={[.55,.95,.3]} />
    <Leaf material={p.leaf} position={[-.23,-.08,.28]} rotation={[.3,.2,.5]} scale={[.4,.7,.3]} />
    <Leaf material={p.mint} position={[.21,.18,.3]} rotation={[.3,.1,.7]} scale={[.42,.7,.3]} />
    <Gem material={p.pink} position={[-.37,-.1,.24]} size={.035} />
  </group>;
}

const models = { about: EnchantedWillow, photos: HolographicFrames, projects: CrystalCluster, skills: Gyroscope, interests: MoonGarden, contact: SpiritLantern };

function GroveObject({ node, active, running, night }) {
  const body = useRef(null);
  const rotor = useRef(null);
  const elapsed = useRef(0);
  const spin = useRef(0);
  const speed = useRef(.16);
  const invalidate = useThree(state => state.invalidate);
  const palette = useMemo(() => makePalette(night), [night]);
  const seed = [...node.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) * .13;
  const Model = models[node.id] || CrystalCluster;

  const applyPose = (delta, immediate = false) => {
    if (!body.current) return;
    const t = elapsed.current;
    const set = (current, target) => immediate ? target : MathUtils.damp(current, target, 5, delta);
    body.current.position.y = Math.sin(t * .72 + seed) * .035;
    body.current.rotation.y = set(body.current.rotation.y, Math.sin(t * .3 + seed) * .11 + (active ? .055 : 0));
    body.current.rotation.x = set(body.current.rotation.x, Math.cos(t * .23 + seed) * .025);
    for (const material of Object.values(palette)) {
      const target = material.userData.baseGlow * (active ? 1.75 : 1);
      material.emissiveIntensity = set(material.emissiveIntensity, target);
    }
    if (rotor.current) {
      if (node.id === 'about') { rotor.current.rotation.z = Math.sin(t*.45+seed)*.035; rotor.current.rotation.y = Math.sin(t*.24+seed)*.08; }
      if (node.id === 'skills') { rotor.current.rotation.y = spin.current; rotor.current.rotation.z = Math.sin(t*.25+seed)*.07; }
      if (node.id === 'interests') rotor.current.rotation.z = Math.sin(t*.32+seed)*.07;
      if (node.id === 'contact') { rotor.current.rotation.y = spin.current * .45; rotor.current.position.y = Math.sin(t*1.2+seed)*.035; rotor.current.rotation.z = Math.sin(t*.65+seed)*.08; }
    }
  };

  useLayoutEffect(() => {
    if (!running) { applyPose(0, true); invalidate(); }
  }, [active, running, palette, invalidate]);
  useEffect(() => () => Object.values(palette).forEach(material => material.dispose()), [palette]);
  useFrame((_, delta) => {
    if (!running) return;
    const dt = Math.min(delta, .05);
    elapsed.current += dt;
    speed.current = MathUtils.damp(speed.current, active ? .32 : .16, 4, dt);
    spin.current += dt * speed.current;
    applyPose(dt);
  });

  return <group name={`grove-${node.id}`} position={[node.x || 0,node.y || 0,0]} userData={{ navigationId: node.id }}>
    <group ref={body}><Model palette={palette} rotor={rotor} /></group>
  </group>;
}

// Parent owns Canvas, camera/lights, responsive node positions, and DOM links.
export default function GroveObjects({ nodes = [], activeId = null, running = true, night = true }) {
  return <group name="grove-navigation-models">{nodes.map(node => <GroveObject key={node.id} node={node} active={activeId === node.id} running={running} night={night} />)}</group>;
}
