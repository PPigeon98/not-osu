import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type ShaderParkBackgroundProps = {
  audioAnalyser?: AnalyserNode | null;
};

// Shader code for development (uses input() function)
const shaderCodeDev = `
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

// Shader code for production/Vercel (no input(), no mouse - uses time-based animation only)
const shaderCodeProd = `
  setMaxIterations(5);
  // Use time for animation since input() and mouse aren't available in production
  let audio = time * 0.1;
  let pointerDown = 0.0;
  let n = noise(getSpace() + vec3(0, 0, audio) + noise(getRayDirection()*4+audio));
  color(normal*.1 + vec3(0, 0, 1));
  boxFrame(vec3(.5), .01 + n*.01);
  mixGeo(pointerDown);
  sphere(0.5 + n*.5);
`;

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

  // Update analyser reference when it changes
  useEffect(() => {
    analyserRef.current = audioAnalyser || null;
  }, [audioAnalyser]);

  useEffect(() => {
    if (!mountRef.current) return;
    
    // Ensure we're in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    let camera: THREE.PerspectiveCamera;
    let scene: THREE.Scene;
    let renderer: THREE.WebGLRenderer;
    let geometry: THREE.SphereGeometry;
    let mesh: THREE.Mesh;
    let canvas: HTMLCanvasElement;
    let cleanupFn: (() => void) | null = null;

    // Dynamically import shader-park-core to handle Vercel build issues
    (async () => {
      try {
        // @ts-ignore - shader-park-core doesn't have types
        const shaderParkModule = await import('shader-park-core');
        
        // Handle both default and named exports
        const createSculptureWithGeometry = 
          shaderParkModule.createSculptureWithGeometry || 
          shaderParkModule.default?.createSculptureWithGeometry ||
          (shaderParkModule.default && typeof shaderParkModule.default === 'function' 
            ? shaderParkModule.default 
            : null);
        
        if (typeof createSculptureWithGeometry !== 'function') {
          console.error('ShaderPark module structure:', shaderParkModule);
          throw new Error('createSculptureWithGeometry is not available');
        }

        const width = window.innerWidth;
        const height = window.innerHeight;

        // Setup camera
        camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 10);
        camera.position.z = 1;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        // Create geometry
        geometry = new THREE.SphereGeometry(1, 32, 32);

        // Use production shader (no input()) when in Vercel/production
        // Check if we're in production by checking the hostname or environment
        const isProduction = 
          typeof window !== 'undefined' && 
          (window.location.hostname.includes('vercel.app') || 
           window.location.hostname.includes('vercel.com') ||
           import.meta.env.PROD);
        
        const cleanShaderCode = (isProduction ? shaderCodeProd : shaderCodeDev).trim();

        // Create shader park mesh
        // Wrap in try-catch to handle shader compilation errors gracefully
        try {
          // Create the state callback function
          // Ensure all values are primitives and in a consistent order
          // The order matters for input() - it accesses values sequentially
          const getState = () => {
            const state = stateRef.current;
            return {
              // Return values in the order they're accessed in the shader
              // First input() call gets audio, second gets pointerDown
              audio: typeof state.audio === 'number' ? state.audio : 0,
              pointerDown: typeof state.pointerDown === 'number' ? state.pointerDown : 0,
              // time and mouse are special - time might be used, mouse is accessed directly
              time: typeof state.time === 'number' ? state.time : 0,
              mouse: state.mouse || { x: 0, y: 0 },
            };
          };

          // Small delay to ensure module is fully initialized
          await new Promise(resolve => setTimeout(resolve, 0));

          // Try to create the mesh
          mesh = createSculptureWithGeometry(geometry, cleanShaderCode, getState);
          
          if (!mesh) {
            throw new Error('createSculptureWithGeometry returned null/undefined');
          }
          
          scene.add(mesh);
        } catch (meshError) {
          console.error('Error creating shader park mesh:', meshError);
          console.error('Shader code:', cleanShaderCode);
          console.log('Using production shader:', isProduction);
          setError(meshError instanceof Error ? meshError.message : 'Failed to create shader mesh');
          // Don't throw - allow component to render without background
          return;
        }

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

        // Store cleanup function
        cleanupFn = () => {
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
        setError(error instanceof Error ? error.message : 'Unknown error');
      }
    })();

    // Return cleanup function
    return () => {
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, []);

  if (error) {
    console.warn('ShaderParkBackground error:', error);
    // Return empty div on error - background won't show but app won't crash
    return <div ref={mountRef} style={{ display: 'none' }} />;
  }

  return <div ref={mountRef} style={{ display: 'none' }} />;
};

export default ShaderParkBackground;

