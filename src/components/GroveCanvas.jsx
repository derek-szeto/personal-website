import { useEffect, useLayoutEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import GroveObjects from './GroveObjects.jsx';

function Scene({ nodes, activeId, running, night, onReady, onFailure }) {
  const { camera, size, gl, invalidate } = useThree();
  const firstFrame = useRef(false);
  const width = size.width < 620 ? 6.4 : size.width < 900 ? 9.6 : 12;
  const height = width * size.height / Math.max(1,size.width);
  const positions = nodes.map(node => ({ id:node.id,x:(node.x / 100 - .5) * width,y:(.5 - node.y / 100) * height }));
  useLayoutEffect(() => {
    camera.zoom = size.width / width;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera,size.width,width,invalidate]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = event => { event.preventDefault(); onFailure(); };
    canvas.addEventListener('webglcontextlost',lost);
    return () => canvas.removeEventListener('webglcontextlost',lost);
  }, [gl,onFailure]);
  useFrame(() => {
    if (!firstFrame.current) { firstFrame.current = true; onReady(); }
  });
  return <>
    <ambientLight intensity={night ? 1.3 : 1.8} />
    <directionalLight position={[-4,5,8]} color="#d2f6ff" intensity={2.6} />
    <directionalLight position={[5,-2,4]} color="#ff95cf" intensity={1.2} />
    <GroveObjects nodes={positions} activeId={activeId} running={running} night={night} />
  </>;
}

export default function GroveCanvas(props) {
  return <Canvas orthographic camera={{ position:[0,0,20],zoom:60,near:.1,far:100 }} dpr={[1,1.5]} frameloop={props.running ? 'always' : 'demand'} gl={{ alpha:true,antialias:true,powerPreference:'low-power' }} fallback={null}><Scene {...props} /></Canvas>;
}
