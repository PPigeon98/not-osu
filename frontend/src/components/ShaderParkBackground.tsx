import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type ShaderParkBackgroundProps = {
  audioAnalyser?: AnalyserNode | null;
};

/**
 * FIXED: Pass the shader as a function. 
 * Shader Park will stringify this function or run it in a custom scope
 * where 'input', 'getSpace', 'noise', etc. are defined.
 */
const shaderCode = () => {
  // @ts-ignore - These functions are injected by Shader Park at runtime
  let audio = input();
  // @ts-ignore
  displace(mouse.x, mouse.y, 0);
  // @ts-ignore
  setMaxIterations(5);
  // @ts-ignore
  let pointerDown = input();
  // @ts-ignore
  let n = noise(getSpace() + vec3(0, 0, audio) + noise(getRayDirection() * 4 + audio));
  // @ts-ignore
  color(normal * .1 + vec3(0, 0, 1));
  // @ts-ignore
  boxFrame(vec3(.5), .01 + n * .01);
  // @ts-ignore
  mixGeo(pointerDown);
  // @ts-ignore
  sphere(0.5 + n * .5);
};

const ShaderParkBackground = ({ audioAnalyser }: ShaderParkBackgroundProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef({
    time: 0,
    mouse: { x: 0, y: 0 },
    pointerDown: 0,
    audio: 0,
    currAudio: 0,
  });
  const analyserRef = useRef<AnalyserNode | null>(null);
  const clockRef = useRef(new THREE.Clock());

  useEffect(() => {
    analyserRef.current = audioAnalyser || null;
  }, [audioAnalyser]);

  useEffect(() => {
    if (!mountRef.current || typeof window === 'undefined') return;

    let camera: THREE.PerspectiveCamera;
    let scene: THREE.Scene;
    let renderer: THREE.WebGLRenderer;
    let geometry: THREE.SphereGeometry;
    let mesh: THREE.Mesh;
    let canvas: HTMLCanvasElement;
    let cleanupFn: (() => void) | null = null;

    (async () => {
      try {
        const shaderParkModule = await import('shader-park-core');
        
        const createSculptureWithGeometry = 
          shaderParkModule.createSculptureWithGeometry || 
          shaderParkModule.default?.createSculptureWithGeometry;
        
        if (typeof createSculptureWithGeometry !== 'function') {
          throw new Error('Shader Park creation function not found');
        }

        const width = window.innerWidth;
        const height = window.innerHeight;

        camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 10);
        camera.position.z = 1.2;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        geometry = new THREE.SphereGeometry(1, 64, 64);

        const getState = () => {
          const state = stateRef.current;
          return {
            audio: state.audio || 0,
            pointerDown: state.pointerDown || 0,
            time: state.time || 0,
            mouse: state.mouse || { x: 0, y: 0 },
          };
        };

        // Create mesh using the function reference instead of a string
        mesh = createSculptureWithGeometry(geometry, shaderCode, getState);
        
        if (!mesh) throw new Error('Mesh creation failed');
        scene.add(mesh);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        canvas = renderer.domElement;
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;pointer-events:none;';
        
        const oldCanvas = document.getElementById('shader-park-bg');
        if (oldCanvas) oldCanvas.remove();
        canvas.id = 'shader-park-bg';
        document.body.appendChild(canvas);

        const handleMouseMove = (e: MouseEvent) => {
          stateRef.current.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
          stateRef.current.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener('mousemove', handleMouseMove);

        const animate = () => {
          const delta = clockRef.current.getDelta();
          stateRef.current.time += delta;

          if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const bass = dataArray[2] / 255;
            stateRef.current.currAudio += Math.pow(bass * 0.8, 4) + delta * 0.2;
            stateRef.current.audio = stateRef.current.currAudio;
          } else {
            stateRef.current.audio = stateRef.current.time * 0.2;
          }

          renderer.render(scene, camera);
        };

        renderer.setAnimationLoop(animate);

        const handleResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        cleanupFn = () => {
          window.removeEventListener('resize', handleResize);
          window.removeEventListener('mousemove', handleMouseMove);
          renderer.setAnimationLoop(null);
          canvas.remove();
          geometry.dispose();
          renderer.dispose();
        };
      } catch (err) {
        console.error('ShaderPark setup error:', err);
        setError(err instanceof Error ? err.message : 'Unknown');
      }
    })();

    return () => cleanupFn?.();
  }, []);

  return <div ref={mountRef} style={{ display: 'none' }} />;
};

export default ShaderParkBackground;