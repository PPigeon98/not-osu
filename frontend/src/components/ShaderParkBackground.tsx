import { useEffect, useRef } from 'react';
import * as THREE from 'three';
// @ts-ignore - shader-park-core doesn't have types
import { createSculptureWithGeometry } from 'shader-park-core';

type ShaderParkBackgroundProps = {
  audioAnalyser?: AnalyserNode | null;
};

const shaderCode = `
  let audio = input();
  displace(mouse.x, mouse.y, 0);
  setMaxIterations(5);
  let pointerDown = input();
  let n = noise(getSpace() + vec3(0, 0, audio) + noise(getRayDirection()*4+audio));
  color(normal*.1 + vec3(0, 0, 1));
  boxFrame(vec3(.5), .01 + n*.01);
  mixGeo(pointerDown);
  sphere(0.5 + n*.5);
`;

const ShaderParkBackground = ({ audioAnalyser }: ShaderParkBackgroundProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    time: 0,
    mouse: { x: 0, y: 0 },
    pointerDown: 0,
    audio: 0,
    currAudio: 0,
  });
  const analyserRef = useRef<AnalyserNode | null>(null);
  const clockRef = useRef(new THREE.Clock());

  // Update analyser reference when it changes
  useEffect(() => {
    analyserRef.current = audioAnalyser || null;
  }, [audioAnalyser]);

  useEffect(() => {
    if (!mountRef.current) return;

    let camera: THREE.PerspectiveCamera;
    let scene: THREE.Scene;
    let renderer: THREE.WebGLRenderer;
    let geometry: THREE.SphereGeometry;
    let mesh: THREE.Mesh;
    let canvas: HTMLCanvasElement;

    try {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Setup camera
      camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 10);
      camera.position.z = 1;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      // Create geometry
      geometry = new THREE.SphereGeometry(1, 32, 32);

      // Create shader park mesh
      mesh = createSculptureWithGeometry(geometry, shaderCode, () => {
        return {
          time: stateRef.current.time,
          mouse: stateRef.current.mouse,
          pointerDown: stateRef.current.pointerDown,
          audio: stateRef.current.audio,
        };
      });
      scene.add(mesh);

      // Setup renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);

      canvas = renderer.domElement;
      canvas.id = 'shader-park-background';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.display = 'block';
      canvas.style.zIndex = '0';
      canvas.style.pointerEvents = 'none';

      // Remove any existing canvas with the same id
      const existingCanvas = document.getElementById('shader-park-background');
      if (existingCanvas) {
        existingCanvas.remove();
      }

      document.body.appendChild(canvas);
      console.log('ShaderParkBackground canvas appended to body');

      // Mouse tracking
      const handleMouseMove = (e: MouseEvent) => {
        stateRef.current.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        stateRef.current.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      };

      window.addEventListener('mousemove', handleMouseMove);

      // Animation loop
      function animate() {
        const delta = clockRef.current.getDelta();
        stateRef.current.time += delta;

        // Update audio reactivity
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Get low frequency data (bin 2 for bass)
          const audioValue = Math.pow((dataArray[2] / 255) * 0.81, 8) + delta * 0.5;
          stateRef.current.currAudio += audioValue;
          stateRef.current.audio = 0.2 * stateRef.current.currAudio + 0.8 * stateRef.current.audio;
        } else {
          // If no audio, use time for continuous motion
          stateRef.current.audio = stateRef.current.time * 0.1;
        }

        renderer.render(scene, camera);
      }

      // Force an initial render
      renderer.render(scene, camera);
      
      renderer.setAnimationLoop(animate);

      // Handle resize
      const handleResize = () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };

      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        if (renderer) {
          renderer.setAnimationLoop(null);
        }
        if (canvas && canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
        if (geometry) {
          geometry.dispose();
        }
        if (renderer) {
          renderer.dispose();
        }
      };
    } catch (error) {
      console.error('Error setting up ShaderParkBackground:', error);
      return () => {
        // Cleanup on error
        if (canvas && canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      };
    }
  }, []);

  return <div ref={mountRef} style={{ display: 'none' }} />;
};

export default ShaderParkBackground;

