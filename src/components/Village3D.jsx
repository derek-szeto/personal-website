import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useReducedMotion } from 'motion/react';
function Tree({ position, scale = 1 }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, .35, 0]} castShadow><cylinderGeometry args={[.07, .1, .7, 7]} /><meshStandardMaterial color="#795a3c" /></mesh>
    <mesh position={[0, .93, 0]} castShadow><sphereGeometry args={[.48, 12, 10]} /><meshStandardMaterial color="#6ea899" roughness={1} flatShading /></mesh>
    <mesh position={[-.16, .71, .05]} castShadow><sphereGeometry args={[.33, 12, 10]} /><meshStandardMaterial color="#c88fa8" roughness={1} flatShading /></mesh>
  </group>;
}
function ForestShrub({ position, rose = false, scale = 1 }) {
  return <group position={position} scale={scale}>
    {[[-.2,.17,0],[.03,.25,-.04],[.23,.15,.04]].map((point, i) => <mesh key={i} position={point} scale={[1,.8,1]} castShadow><dodecahedronGeometry args={[.25,0]} /><meshStandardMaterial color={i === 1 ? '#81b89d' : '#438c78'} roughness={1} /></mesh>)}
    {rose && [[-.2,.35,.1],[.14,.3,.15]].map((point, i) => <mesh key={i} position={point}><sphereGeometry args={[.045,6,6]} /><meshStandardMaterial color="#ecacc8" emissive="#b45d8f" emissiveIntensity={.3} /></mesh>)}
    <group position={[-.27,0,.12]}>{[-.7,-.25,.25,.7].map((angle, i) => <mesh key={i} position={[Math.sin(angle)*.12,.12+i*.015,Math.cos(angle)*.1]} rotation={[angle,angle,.4]} scale={[.07,.24,.025]}><sphereGeometry args={[1,6,6]} /><meshStandardMaterial color="#9ad4b4" roughness={1} /></mesh>)}</group>
  </group>;
}
export default function Village3D() {
  const [night, setNight] = useState(() => document.documentElement.dataset.theme === 'dark');
  const reduced = useReducedMotion();
  useEffect(() => {
    const observer = new MutationObserver(() => setNight(document.documentElement.dataset.theme === 'dark'));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return <div className="village-3d">
    <div className="village-canvas" role="img" aria-label="Interactive magical forest with trees, ferns and shrubs. Drag to rotate.">
      <Canvas shadows dpr={[1, 1.5]} frameloop="demand" camera={{ position: [6, 5, 7], fov: 37 }} fallback={<p>3D unavailable. Choose 2D.</p>}>
        <color attach="background" args={[night ? '#102c34' : '#e5f1ec']} />
        <ambientLight intensity={night ? .8 : 1.5} />
        <directionalLight position={[4, 7, 3]} intensity={night ? 1 : 2.5} castShadow shadow-mapSize={[1024, 1024]} />
        <group position={[0, -.5, 0]}>
          <mesh receiveShadow position={[0, -.23, 0]}><cylinderGeometry args={[3.1, 2.85, .48, 64]} /><meshStandardMaterial color="#476c6a" roughness={1} /></mesh>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[3.12, 64]} /><meshStandardMaterial color={night ? '#356e68' : '#8db9a2'} roughness={1} /></mesh>
                              {[[-2,0,-.4],[-1.7,0,-1.7],[.1,0,-2.3],[2.1,0,-1.2],[-2.1,0,1.1]].map((p,i) => <Tree key={i} position={p} scale={i % 2 ? 1.1 : .9} />)}
          <ForestShrub position={[-2.1,0,.25]} rose /><ForestShrub position={[.5,0,1.4]} scale={.8} /><ForestShrub position={[2,0,.7]} rose /><ForestShrub position={[.7,0,-1.7]} />
          {Array.from({ length: 14 }, (_, i) => <mesh key={i} position={[Math.cos(i * 2.4) * (2.3 + (i % 2) * .2), .06, Math.sin(i * 2.4) * 2.5]}><sphereGeometry args={[.045, 6, 6]} /><meshStandardMaterial color={i % 2 ? '#ecaac4' : '#b8f2da'} emissive={i % 2 ? '#b87799' : '#70c4ae'} emissiveIntensity={night ? 1 : .2} /></mesh>)}
        </group>
        <OrbitControls makeDefault enableZoom={false} enablePan={false} enableDamping={!reduced} dampingFactor={.12} rotateSpeed={.55} minPolarAngle={.5} maxPolarAngle={1.3} target={[0, .1, 0]} />
      </Canvas>
    </div>
    <div className="village-3d-footer"><span>Drag to rotate</span></div>
  </div>;
}
