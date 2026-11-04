import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AdditiveBlending, BackSide, BufferGeometry, CanvasTexture, Color, Quaternion, SRGBColorSpace, Vector3 } from 'three';
import { landPolygons } from '../data/globeLand.js';
import { isGlobePointVisible, latLonToVector, lonLatToCanvas } from '../globeMath.js';

const UP = new Vector3(0, 1, 0);
const ORIGIN = new Vector3(0, 0, 0);
const PIN_HEAD_RADIUS = 1.145;
const ATMOSPHERE_VERTEX = `
  varying vec3 worldNormal;
  varying vec3 viewDirection;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    worldNormal = normalize(mat3(modelMatrix) * normal);
    viewDirection = cameraPosition - worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;
const ATMOSPHERE_FRAGMENT = `
  uniform vec3 blue;
  uniform vec3 pink;
  varying vec3 worldNormal;
  varying vec3 viewDirection;
  void main() {
    float edge = pow(1.0 - abs(dot(normalize(worldNormal), normalize(viewDirection))), 2.7);
    vec3 lightColor = mix(blue, pink, smoothstep(-0.8, 0.8, -worldNormal.y + worldNormal.x * 0.35));
    gl_FragColor = vec4(lightColor, edge * 0.42);
  }
`;

function earthTexture(night) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Earth texture canvas is unavailable');
  const ocean = context.createLinearGradient(0, 0, 0, canvas.height);
  ocean.addColorStop(0, night ? '#0b2749' : '#164c76');
  ocean.addColorStop(.5, night ? '#0a4266' : '#237b94');
  ocean.addColorStop(1, night ? '#092c4d' : '#19496f');
  context.fillStyle = ocean;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = night ? '#40a99f' : '#74c7b5';
  context.strokeStyle = night ? '#a9efff80' : '#c1fff1a0';
  context.lineWidth = .65;
  context.lineJoin = 'round';
  for (const polygon of landPolygons) {
    context.beginPath();
    for (const ring of polygon) {
      ring.forEach((coordinate, index) => {
        const [x, y] = lonLatToCanvas(coordinate, canvas.width, canvas.height);
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.closePath();
    }
    context.fill('evenodd');
    context.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function earthGrid() {
  const points = [];
  const addLine = coordinates => {
    for (let index = 1; index < coordinates.length; index++) {
      points.push(new Vector3(...coordinates[index - 1]), new Vector3(...coordinates[index]));
    }
  };
  for (let latitude = -60; latitude <= 60; latitude += 30) {
    addLine(Array.from({ length: 145 }, (_, index) => latLonToVector(latitude, -180 + index * 2.5, 1.003)));
  }
  for (let longitude = -180; longitude < 180; longitude += 30) {
    addLine(Array.from({ length: 73 }, (_, index) => latLonToVector(-90 + index * 2.5, longitude, 1.003)));
  }
  return new BufferGeometry().setFromPoints(points);
}

function DestinationPin({ node, selected, running, onSelect }) {
  const material = useRef(null);
  const phase = useRef(0);
  const orientation = useMemo(() => new Quaternion().setFromUnitVectors(UP, node.normal), [node]);
  useFrame((_, delta) => {
    if (!running || !material.current) return;
    phase.current += Math.min(delta, .05);
    material.current.emissiveIntensity = selected ? 1.1 + Math.sin(phase.current * 1.7) * .1 : .65;
  });
  return <group position={node.surface} quaternion={orientation} userData={{ destinationId: node.id }}>
    <mesh position={[0,.06,0]}>
      <cylinderGeometry args={[.011,.018,.12,8]} />
      <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={.5} roughness={.4} />
    </mesh>
    <mesh position={[0,.14,0]} onClick={event => {
      if (event.delta > 4 || !isGlobePointVisible(node.surface.toArray(),event.camera.position.toArray())) return;
      event.stopPropagation();
      onSelect(node.id);
    }}>
      <sphereGeometry args={[selected ? .049 : .038,16,12]} />
      <meshStandardMaterial ref={material} color={node.color} emissive={node.color} emissiveIntensity={selected ? 1.1 : .65} roughness={.25} toneMapped={false} />
    </mesh>
    <mesh position={[0,.007,0]} rotation={[Math.PI / 2,0,0]}>
      <torusGeometry args={[selected ? .06 : .044,.004,6,32]} />
      <meshBasicMaterial color={node.color} transparent opacity={selected ? .85 : .45} depthWrite={false} />
    </mesh>
  </group>;
}

function EarthScene({ destinations, selectedId, focusRequest, running, reduced, night, onSelect, onReady, onFailure, onProjectPins }) {
  const { camera, gl, size, invalidate } = useThree();
  const callbacks = useRef({ onSelect, onReady, onFailure, onProjectPins });
  callbacks.current = { onSelect, onReady, onFailure, onProjectPins };
  const controls = useRef(null);
  const focus = useRef(null);
  const firstFocus = useRef(true);
  const ready = useRef(false);
  const failed = useRef(false);
  const radius = useRef(4.7);
  const projected = useRef([]);
  const lastProjection = useRef(-Infinity);
  const projectionTimer = useRef(null);
  const [texture, setTexture] = useState(null);
  const signature = JSON.stringify(destinations.map(item => [item.id,item.latitude,item.longitude,item.color]));
  const nodes = useMemo(() => destinations.filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)).map(item => {
    const normal = new Vector3(...latLonToVector(item.latitude,item.longitude));
    return { ...item, color: item.color || '#82dfff', normal, surface: normal.clone().multiplyScalar(1.005), head: normal.clone().multiplyScalar(PIN_HEAD_RADIUS) };
  }), [signature]);
  const currentNodes = useRef(nodes);
  currentNodes.current = nodes;
  const grid = useMemo(earthGrid, []);
  const atmosphere = useMemo(() => ({ blue: { value: new Color('#62dcff') }, pink: { value: new Color('#f58cc8') } }), []);
  const scratch = useMemo(() => ({ direction: new Vector3(), rotation: new Quaternion(), step: new Quaternion(), point: new Vector3() }), []);

  useEffect(() => {
    let next;
    try {
      next = earthTexture(night);
      setTexture(next);
      invalidate();
    } catch {
      failed.current = true;
      callbacks.current.onFailure?.();
    }
    return () => next?.dispose();
  }, [night, invalidate]);
  useEffect(() => () => grid.dispose(), [grid]);

  useEffect(() => {
    const canvas = gl.domElement;
    const previousTouchAction = canvas.style.touchAction;
    const orbit = new OrbitControls(camera, canvas);
    canvas.style.touchAction = 'pan-y';
    orbit.enableZoom = false;
    orbit.enablePan = false;
    orbit.enableDamping = false;
    orbit.rotateSpeed = .58;
    orbit.minPolarAngle = .12;
    orbit.maxPolarAngle = Math.PI - .12;
    orbit.target.set(0,0,0);
    const change = () => invalidate();
    const start = () => { focus.current = null; };
    const lost = event => {
      event.preventDefault();
      if (failed.current) return;
      failed.current = true;
      orbit.enabled = false;
      callbacks.current.onProjectPins?.(currentNodes.current.map(node => ({ id: node.id, x: 50, y: 50, visible: false })));
      callbacks.current.onFailure?.();
    };
    orbit.addEventListener('change',change);
    orbit.addEventListener('start',start);
    orbit.addEventListener('end',change);
    canvas.addEventListener('webglcontextlost',lost);
    controls.current = orbit;
    invalidate();
    return () => {
      controls.current = null;
      orbit.removeEventListener('change',change);
      orbit.removeEventListener('start',start);
      orbit.removeEventListener('end',change);
      orbit.dispose();
      canvas.style.touchAction = previousTouchAction;
      canvas.removeEventListener('webglcontextlost',lost);
      window.clearTimeout(projectionTimer.current);
      projectionTimer.current = null;
    };
  }, [camera, gl, invalidate]);

  useLayoutEffect(() => {
    if (!size.width || !size.height) return;
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    radius.current = Math.max(4.7,4.25 / Math.min(1,camera.aspect));
    camera.position.normalize().multiplyScalar(radius.current);
    camera.lookAt(ORIGIN);
    controls.current?.update();
    invalidate();
  }, [camera, size.width, size.height, invalidate]);

  useLayoutEffect(() => {
    const node = nodes.find(item => item.id === selectedId) || nodes[0];
    if (!node) return;
    focus.current = node.normal.clone();
    if (firstFocus.current || reduced || !running) {
      camera.position.copy(focus.current).multiplyScalar(radius.current);
      camera.lookAt(ORIGIN);
      controls.current?.update();
      focus.current = null;
    }
    firstFocus.current = false;
    invalidate();
  }, [selectedId, focusRequest, signature, camera, invalidate]);

  useLayoutEffect(() => {
    if ((reduced || !running) && focus.current) {
      camera.position.copy(focus.current).multiplyScalar(radius.current);
      camera.lookAt(ORIGIN);
      controls.current?.update();
      focus.current = null;
      invalidate();
    }
  }, [running, reduced, camera, invalidate]);

  const selectPin = id => {
    const node = nodes.find(item => item.id === id);
    if (node) {
      focus.current = node.normal.clone();
      if (reduced || !running) {
        camera.position.copy(focus.current).multiplyScalar(radius.current);
        camera.lookAt(ORIGIN);
        controls.current?.update();
        focus.current = null;
      }
      invalidate();
    }
    callbacks.current.onSelect?.(id);
  };

  useFrame((_, delta) => {
    if (failed.current) return;
    if (running && focus.current) {
      const dt = Math.min(delta,.05);
      scratch.direction.copy(camera.position).normalize();
      const angle = scratch.direction.angleTo(focus.current);
      if (angle < .0015) {
        camera.position.copy(focus.current).multiplyScalar(radius.current);
        focus.current = null;
      } else {
        scratch.rotation.setFromUnitVectors(scratch.direction,focus.current);
        scratch.step.identity().slerp(scratch.rotation,1-Math.exp(-4*dt));
        scratch.direction.applyQuaternion(scratch.step).normalize();
        camera.position.copy(scratch.direction).multiplyScalar(radius.current);
      }
      camera.lookAt(ORIGIN);
      controls.current?.update();
    }
    camera.updateMatrixWorld();
    if (!texture || !size.width || !size.height) return;
    const cameraPosition = camera.position.toArray();
    const next = nodes.map(node => {
      const front = isGlobePointVisible(node.surface.toArray(),cameraPosition);
      scratch.point.copy(node.head).project(camera);
      const x = (scratch.point.x + 1) * 50;
      const y = (1 - scratch.point.y) * 50;
      return { id: node.id, x, y, visible: front && scratch.point.z > -1 && scratch.point.z < 1 && x >= 0 && x <= 100 && y >= 0 && y <= 100 };
    });
    const changed = next.length !== projected.current.length || next.some((pin,index) => {
      const old = projected.current[index];
      return !old || old.id !== pin.id || old.visible !== pin.visible || Math.abs(old.x-pin.x) > .12 || Math.abs(old.y-pin.y) > .12;
    });
    if (changed) {
      const wait = 34 - (performance.now() - lastProjection.current);
      if (wait <= 0) {
        projected.current = next;
        lastProjection.current = performance.now();
        callbacks.current.onProjectPins?.(next);
      } else if (!running && !projectionTimer.current) {
        projectionTimer.current = window.setTimeout(() => { projectionTimer.current = null; invalidate(); },wait+2);
      }
    }
    if (!ready.current) { ready.current = true; callbacks.current.onReady?.(); }
  });

  return <>
    <ambientLight intensity={night ? 1.25 : 1.65} />
    <directionalLight position={[-3,4,5]} intensity={2.1} color="#c7f1ff" />
    <directionalLight position={[3,-2,-4]} intensity={1.35} color="#ff91cb" />
    <mesh rotation={[0,-Math.PI/2,0]} onClick={event => event.stopPropagation()}>
      <sphereGeometry args={[1,96,64]} />
      <meshStandardMaterial map={texture} color="#ffffff" roughness={.76} metalness={.07} emissive="#16405a" emissiveIntensity={night ? .2 : .06} />
    </mesh>
    <lineSegments geometry={grid}>
      <lineBasicMaterial color="#9cefff" transparent opacity={night ? .16 : .12} depthWrite={false} />
    </lineSegments>
    <mesh>
      <sphereGeometry args={[1.045,64,48]} />
      <shaderMaterial uniforms={atmosphere} vertexShader={ATMOSPHERE_VERTEX} fragmentShader={ATMOSPHERE_FRAGMENT} side={BackSide} blending={AdditiveBlending} transparent depthWrite={false} />
    </mesh>
    <mesh rotation={[1.04,.2,-.18]}>
      <torusGeometry args={[1.13,.0035,4,112,Math.PI*1.65]} />
      <meshBasicMaterial color="#f58cc8" transparent opacity={.28} depthWrite={false} />
    </mesh>
    {nodes.map(node => <DestinationPin key={node.id} node={node} selected={node.id===selectedId} running={running && !reduced} onSelect={selectPin} />)}
  </>;
}

export default function TravelGlobeCanvas({ destinations = [], selectedId, focusRequest = 0, running = true, reduced = false, night = true, onSelect, onReady, onFailure, onProjectPins }) {
  return <Canvas camera={{ position:[0,0,4.7],fov:32,near:.1,far:50 }} dpr={[1,1.5]} frameloop={running && !reduced ? 'always' : 'demand'} gl={{alpha:true,antialias:true,powerPreference:'low-power'}} fallback={null} style={{touchAction:'pan-y'}}>
    <EarthScene destinations={destinations} selectedId={selectedId} focusRequest={focusRequest} running={running && !reduced} reduced={reduced} night={night} onSelect={onSelect} onReady={onReady} onFailure={onFailure} onProjectPins={onProjectPins} />
  </Canvas>;
}
