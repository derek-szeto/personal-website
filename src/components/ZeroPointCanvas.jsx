import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, CatmullRomCurve3, Color, Vector2, Vector3 } from 'three';

const ORB_RADIUS = 1.6;
const TAU = Math.PI * 2;

const SHELL_VERTEX = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 p = position;
    p += normal * sin(position.x * 8.0 + uTime * 0.27)
      * sin(position.y * 9.0 - uTime * 0.21) * 0.006;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const SHELL_FRAGMENT = `
  uniform float uTime;
  uniform float uEnter;
  uniform float uStrength;
  uniform vec3 uCyan;
  uniform vec3 uPink;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    float edge = pow(1.0 - abs(normalize(vNormal).z), 3.3);
    float angle = atan(vPosition.y, vPosition.x);
    float ripple = 0.5 + 0.5 * sin(angle * 11.0 - uTime * 0.46);
    float pink = smoothstep(-0.65, 0.85, -vPosition.y + vPosition.x * 0.4);
    vec3 color = mix(uCyan, uPink, pink * 0.55);
    float alpha = edge * (0.35 + ripple * 0.16) * uStrength;
    alpha *= 1.0 - uEnter * 0.65;
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

const CURRENT_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CURRENT_FRAGMENT = `
  uniform float uTime;
  uniform float uEnter;
  uniform float uPhase;
  uniform float uTone;
  uniform vec3 uCyan;
  uniform vec3 uPink;
  varying vec2 vUv;
  void main() {
    float flow = pow(0.5 + 0.5 * sin(vUv.x * 37.0 - uTime * 1.5 + uPhase), 9.0);
    float ends = smoothstep(0.0, 0.06, vUv.x) * smoothstep(0.0, 0.06, 1.0 - vUv.x);
    float alpha = (0.15 + flow * 0.68) * ends * (1.0 - uEnter * 0.55);
    gl_FragColor = vec4(mix(uCyan, uPink, uTone), alpha);
    #include <colorspace_fragment>
  }
`;

const PARTICLE_VERTEX = `
  uniform float uTime;
  uniform float uEnter;
  uniform float uPixelRatio;
  uniform float uField;
  uniform vec2 uExtent;
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  varying float vAlpha;
  varying float vTone;
  void main() {
    vec3 p = position;
    if (uField > 0.5) {
      p.xy *= uExtent;
      p.xy *= 1.0 + uEnter * 0.3;
    } else {
      float angle = uTime * 0.025 * aSpeed;
      mat2 spin = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      p.xy = spin * p.xy;
      p.xy += vec2(sin(uTime * 0.25 + aPhase), cos(uTime * 0.2 + aPhase)) * 0.025;
      p.xy *= 1.0 + uEnter * (0.45 + aSpeed * 0.12);
    }
    float twinkle = 0.7 + 0.3 * sin(uTime * aSpeed * 0.5 + aPhase);
    vAlpha = twinkle * mix(0.65, 0.5, uField) * (1.0 - uEnter * 0.65);
    vTone = 0.5 + 0.5 * sin(aPhase);
    gl_PointSize = clamp(aSize * uPixelRatio * (1.0 + uEnter * 0.5), 1.0, 6.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const PARTICLE_FRAGMENT = `
  uniform vec3 uCyan;
  uniform vec3 uPink;
  varying float vAlpha;
  varying float vTone;
  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float distanceToCenter = length(point);
    if (distanceToCenter > 0.5) discard;
    float glow = exp(-distanceToCenter * distanceToCenter * 22.0);
    gl_FragColor = vec4(mix(uCyan, uPink, vTone * 0.7), glow * vAlpha);
    #include <colorspace_fragment>
  }
`;

function getFit(width, height) {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const diameter = Math.min(safeWidth * 0.84, safeHeight * 0.88);
  const zoom = diameter / (ORB_RADIUS * 2);
  return { zoom, width: safeWidth / zoom, height: safeHeight / zoom, centerY: -safeHeight * 0.02 / zoom };
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function makeCurrents() {
  return Array.from({ length: 16 }, (_, index) => {
    const start = index * 1.173;
    const length = index < 2 ? TAU : 1.35 + index % 5 * 0.48;
    const points = Array.from({ length: 65 }, (_, step) => {
      const progress = step / 64;
      const angle = start + progress * length;
      const wave = Math.sin(angle * 3 + index * 0.7) * 0.042;
      const radius = ORB_RADIUS + 0.012 + index % 4 * 0.035 + wave + Math.sin(progress * Math.PI) * 0.055;
      return new Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * (0.99 + Math.sin(index) * 0.015),
        0.13 + Math.sin(angle * 2 + index) * 0.28,
      );
    });
    return { curve: new CatmullRomCurve3(points), thickness: index < 2 ? 0.005 : 0.0025 + index % 3 * 0.0012, phase: index * 1.7, tone: index % 5 === 0 ? 0.8 : index % 3 * 0.12 };
  });
}

function makeParticles(count, field = false) {
  const random = seededRandom(field ? 92041 : 21709);
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);
  for (let index = 0; index < count; index++) {
    const angle = random() * TAU;
    const radius = 1.52 + Math.pow(random(), 2.5) * 0.82;
    positions[index * 3] = field ? random() * 2 - 1 : Math.cos(angle) * radius;
    positions[index * 3 + 1] = field ? random() * 2 - 1 : Math.sin(angle) * radius;
    positions[index * 3 + 2] = field ? -2 - random() * 2 : random() * 1.4 - 0.55;
    sizes[index] = field ? 0.8 + random() * 1.3 : 1 + random() * 2.3;
    phases[index] = random() * TAU;
    speeds[index] = 0.45 + random() * 1.05;
  }
  return { positions, sizes, phases, speeds };
}

function Particles({ data, uniforms }) {
  return <points frustumCulled={false} renderOrder={3}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
      <bufferAttribute attach="attributes-aSize" args={[data.sizes, 1]} />
      <bufferAttribute attach="attributes-aPhase" args={[data.phases, 1]} />
      <bufferAttribute attach="attributes-aSpeed" args={[data.speeds, 1]} />
    </bufferGeometry>
    <shaderMaterial vertexShader={PARTICLE_VERTEX} fragmentShader={PARTICLE_FRAGMENT} uniforms={uniforms} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
  </points>;
}

const ROCKS = [
  [-0.88, 0.4, 0.17], [0.8, 0.72, 0.22], [-0.76, -0.65, 0.13],
  [0.86, -0.48, 0.18], [-0.33, 0.9, 0.1], [0.29, -0.9, 0.16], [0.96, 0.02, 0.09],
];

function ZeroPointScene({ running, reduced, entering, onReady, onFailure, onEntryProgress }) {
  const { camera, gl, size, invalidate } = useThree();
  const callbacks = useRef({ onReady, onFailure, onEntryProgress });
  callbacks.current = { onReady, onFailure, onEntryProgress };
  const orb = useRef(null);
  const rocks = useRef([]);
  const phase = useRef(0);
  const entry = useRef(0);
  const lastEntry = useRef(-1);
  const firstFrame = useRef(false);
  const readyFrame = useRef(null);
  const failed = useRef(false);
  const fit = getFit(size.width, size.height);
  const currents = useMemo(makeCurrents, []);
  const particles = useMemo(() => makeParticles(768), []);
  const stars = useMemo(() => makeParticles(384, true), []);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uEnter: { value: 0 }, uPixelRatio: { value: 1 },
    uExtent: { value: new Vector2(1, 1) }, uCyan: { value: new Color('#6fdfff') }, uPink: { value: new Color('#ed87d5') },
  }), []);
  const shellUniforms = useMemo(() => ({ ...uniforms, uStrength: { value: 1 } }), [uniforms]);
  const haloUniforms = useMemo(() => ({ ...uniforms, uStrength: { value: 0.23 } }), [uniforms]);
  const particleUniforms = useMemo(() => ({ ...uniforms, uField: { value: 0 } }), [uniforms]);
  const starUniforms = useMemo(() => ({ ...uniforms, uField: { value: 1 } }), [uniforms]);
  const currentUniforms = useMemo(() => currents.map(current => ({ ...uniforms, uPhase: { value: current.phase }, uTone: { value: current.tone } })), [uniforms, currents]);

  useLayoutEffect(() => {
    camera.zoom = fit.zoom;
    camera.updateProjectionMatrix();
    uniforms.uExtent.value.set(fit.width * 0.5, fit.height * 0.5);
    uniforms.uPixelRatio.value = gl.getPixelRatio();
    if (!entering || reduced) entry.current = 0;
    uniforms.uEnter.value = entry.current;
    orb.current?.scale.setScalar(1 + entry.current * 0.36);
    callbacks.current.onEntryProgress?.(entry.current);
    lastEntry.current = entry.current;
    invalidate();
  }, [camera, gl, fit.zoom, fit.width, fit.height, running, reduced, entering, uniforms, invalidate]);

  useLayoutEffect(() => {
    const canvas = gl.domElement;
    const previousShaderError = gl.debug.onShaderError;
    const fail = () => {
      if (failed.current) return;
      failed.current = true;
      if (readyFrame.current !== null) cancelAnimationFrame(readyFrame.current);
      callbacks.current.onFailure?.();
    };
    const handleLoss = event => { event.preventDefault(); fail(); };
    const handleShaderError = (...args) => { previousShaderError?.(...args); fail(); };
    gl.debug.onShaderError = handleShaderError;
    canvas.addEventListener('webglcontextlost', handleLoss);
    return () => {
      canvas.removeEventListener('webglcontextlost', handleLoss);
      if (gl.debug.onShaderError === handleShaderError) gl.debug.onShaderError = previousShaderError;
      if (readyFrame.current !== null) cancelAnimationFrame(readyFrame.current);
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (failed.current) return;
    if (running && !reduced) {
      const step = Math.min(delta, 0.05);
      phase.current += step;
      if (entering) entry.current += (1 - entry.current) * (1 - Math.exp(-step * 4.5));
      uniforms.uTime.value = phase.current;
      uniforms.uEnter.value = entry.current;
      orb.current?.scale.setScalar(1 + entry.current * 0.36);
      rocks.current.forEach((rock, index) => {
        if (!rock) return;
        const [x, y] = ROCKS[index];
        rock.rotation.set(phase.current * 0.055 + index, phase.current * 0.075 + index * 0.7, index * 0.43);
        rock.position.x = x * fit.width * 0.5 * (1 + entry.current * 0.3);
        rock.position.y = y * fit.height * 0.5 + Math.sin(phase.current * 0.3 + index) * 0.025;
      });
    }
    if (Math.abs(entry.current - lastEntry.current) > .00001) {
      callbacks.current.onEntryProgress?.(entry.current);
      lastEntry.current = entry.current;
    }
    if (!firstFrame.current) {
      firstFrame.current = true;
      // The next animation frame follows R3F's initial render and shader setup.
      readyFrame.current = requestAnimationFrame(() => {
        readyFrame.current = null;
        if (!failed.current) callbacks.current.onReady?.();
      });
    }
  });

  return <>
    <ambientLight intensity={0.7} />
    <directionalLight position={[-3, 4, 5]} color="#82dfff" intensity={3.2} />
    <directionalLight position={[4, -3, 3]} color="#f192cd" intensity={2.4} />
    <Particles data={stars} uniforms={starUniforms} />
    <group ref={orb} position={[0, fit.centerY, 0]}>
      <mesh renderOrder={1}>
        <sphereGeometry args={[ORB_RADIUS, 96, 64]} />
        <shaderMaterial vertexShader={SHELL_VERTEX} fragmentShader={SHELL_FRAGMENT} uniforms={shellUniforms} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh renderOrder={0}>
        <sphereGeometry args={[ORB_RADIUS * 1.065, 64, 48]} />
        <shaderMaterial vertexShader={SHELL_VERTEX} fragmentShader={SHELL_FRAGMENT} uniforms={haloUniforms} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {currents.map((current, index) => <mesh key={index} renderOrder={2}>
        <tubeGeometry args={[current.curve, 96, current.thickness, 4, false]} />
        <shaderMaterial vertexShader={CURRENT_VERTEX} fragmentShader={CURRENT_FRAGMENT} uniforms={currentUniforms[index]} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>)}
      <Particles data={particles} uniforms={particleUniforms} />
    </group>
    {ROCKS.map(([x, y, scale], index) => <mesh key={index} ref={node => { rocks.current[index] = node; }} position={[x * fit.width * 0.5, y * fit.height * 0.5, 0.3 + index % 3 * 0.12]} rotation={[index, index * 0.7, index * 0.43]} scale={[scale * 1.25, scale, scale * 0.8]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={index % 3 ? '#1b2b48' : '#31475f'} emissive={index % 2 ? '#15446b' : '#4c245c'} emissiveIntensity={0.28} roughness={0.86} metalness={0.25} flatShading />
    </mesh>)}
  </>;
}

function CanvasUnavailable({ onFailure }) {
  const reported = useRef(false);
  useEffect(() => {
    if (!reported.current) { reported.current = true; onFailure?.(); }
  }, [onFailure]);
  return null;
}

export default function ZeroPointCanvas({ running = true, reduced = false, entering = false, onReady, onFailure, onEntryProgress }) {
  return <Canvas className="zero-point-canvas" aria-hidden="true" orthographic camera={{ position: [0, 0, 9], zoom: 100, near: 0.1, far: 30 }} dpr={[1, 1.5]} frameloop={running && !reduced ? 'always' : 'demand'} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }} onCreated={({ gl }) => gl.setClearColor(0x000000, 0)} fallback={<CanvasUnavailable onFailure={onFailure} />} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
    <ZeroPointScene running={running} reduced={reduced} entering={entering} onReady={onReady} onFailure={onFailure} onEntryProgress={onEntryProgress} />
  </Canvas>;
}
