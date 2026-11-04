import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CubicBezierCurve3, CurvePath, DoubleSide, LineCurve3, MathUtils, MeshStandardMaterial, Vector3 } from 'three';

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
  };
}

function Gem({ material, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0], size = .5 }) {
  return <mesh material={material} position={position} scale={scale} rotation={rotation}><octahedronGeometry args={[size, 0]} /></mesh>;
}

function WoolTree({ palette: p }) {
  return <>
    <mesh material={p.stone} position={[0, -.61, 0]} scale={[1.12, .48, .9]} rotation={[.12, .24, .1]}><dodecahedronGeometry args={[.59, 0]} /></mesh>
    <Gem material={p.cyan} position={[-.3, -.68, .29]} size={.13} scale={[.65, 1.8, .65]} />
    <mesh material={p.wood} position={[0, -.15, 0]}><cylinderGeometry args={[.08, .12, .8, 5]} /></mesh>
    <mesh material={p.wood} position={[-.15, .05, 0]} rotation={[0, 0, -.62]}><cylinderGeometry args={[.045, .065, .48, 5]} /></mesh>
    <mesh material={p.wood} position={[.17, .1, 0]} rotation={[0, 0, .62]}><cylinderGeometry args={[.045, .065, .47, 5]} /></mesh>
    {[[0,.57,0,.43],[-.34,.4,.03,.34],[.34,.43,-.03,.35],[.03,.38,.29,.32]].map(([x,y,z,r], index) => <mesh key={index} material={p.wool} position={[x,y,z]} rotation={[.1,index*.7,.2]}><icosahedronGeometry args={[r,1]} /></mesh>)}
    <Gem material={p.pink} position={[-.43,.58,.2]} size={.09} />
    <Gem material={p.mint} position={[.37,.64,.16]} size={.07} />
  </>;
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

function GlowBloom({ palette: p, rotor }) {
  return <>
    <mesh material={p.wood} position={[0,-.49,-.06]}><cylinderGeometry args={[.035,.05,.58,5]} /></mesh>
    <mesh material={p.mint} position={[-.17,-.48,-.04]} scale={[1,.28,.65]} rotation={[0,0,-.4]}><icosahedronGeometry args={[.22,0]} /></mesh>
    <mesh material={p.wood} position={[.17,-.56,-.05]} scale={[1,.3,.65]} rotation={[0,0,.4]}><icosahedronGeometry args={[.21,0]} /></mesh>
    <group position={[0,.18,0]}>
      <group ref={rotor}>{Array.from({ length: 7 }, (_, index) => {
        const angle = index * Math.PI * 2 / 7;
        return <mesh key={index} material={index % 3 === 0 ? p.pink : p.cyan} position={[Math.sin(angle)*.4,Math.cos(angle)*.4,0]} rotation={[.12,0,-angle]} scale={[.27,.49,.2]}><icosahedronGeometry args={[.8,1]} /></mesh>;
      })}</group>
      <mesh material={p.mint} position={[0,0,.15]}><dodecahedronGeometry args={[.19,0]} /></mesh>
    </group>
  </>;
}

function ContactPerson({ palette: p, rotor }) {
  const shoulders = useMemo(() => {
    const point = (x, y) => new Vector3(x, y, 0);
    const curve = new CurvePath();
    curve.add(new CubicBezierCurve3(point(-.64,-.58),point(-.7,-.58),point(-.73,-.55),point(-.73,-.49)));
    curve.add(new LineCurve3(point(-.73,-.49),point(-.73,-.28)));
    curve.add(new CubicBezierCurve3(point(-.73,-.28),point(-.73,.05),point(-.4,.2),point(0,.2)));
    curve.add(new CubicBezierCurve3(point(0,.2),point(.4,.2),point(.73,.05),point(.73,-.28)));
    curve.add(new LineCurve3(point(.73,-.28),point(.73,-.49)));
    curve.add(new CubicBezierCurve3(point(.73,-.49),point(.73,-.55),point(.7,-.58),point(.64,-.58)));
    curve.add(new LineCurve3(point(.64,-.58),point(-.64,-.58)));
    return curve;
  }, []);
  return <group rotation={[0,-.07,0]}>
    <mesh material={p.metal} position={[0,0,-.035]}><tubeGeometry args={[shoulders,80,.072,10,true]} /></mesh>
    <mesh material={p.cyan} position={[0,0,.04]}><tubeGeometry args={[shoulders,80,.05,10,true]} /></mesh>
    <group position={[0,.73,0]}>
      <mesh material={p.metal} position={[0,0,-.035]}><torusGeometry args={[.32,.07,12,48]} /></mesh>
      <mesh material={p.cyan} position={[0,0,.04]}><torusGeometry args={[.32,.052,12,48]} /></mesh>
      <group ref={rotor}>
        <mesh material={p.pink} position={[0,0,.105]}><torusGeometry args={[.32,.018,8,20,Math.PI*.55]} /></mesh>
        <mesh material={p.mint} position={[0,.32,.105]}><sphereGeometry args={[.032,10,8]} /></mesh>
      </group>
    </group>
    <mesh material={p.pink} position={[0,-.58,.1]} rotation={[0,0,HALF_PI]}><cylinderGeometry args={[.018,.018,.76,8]} /></mesh>
  </group>;
}

const models = { about: WoolTree, photos: HolographicFrames, projects: CrystalCluster, skills: Gyroscope, interests: GlowBloom, contact: ContactPerson };

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
      if (node.id === 'skills') { rotor.current.rotation.y = spin.current; rotor.current.rotation.z = Math.sin(t*.25+seed)*.07; }
      if (node.id === 'interests') rotor.current.rotation.z = Math.sin(t*.32+seed)*.07;
      if (node.id === 'contact') rotor.current.rotation.z = spin.current * .45;
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
