import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const FunkyBackground = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Setup
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 10);
    camera.position.z = 1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Black background to see the cube

    const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const material = new THREE.MeshNormalMaterial();


    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Add lighting for better visibility
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    scene.add(light);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Style the canvas to ensure it's visible
    const canvas = renderer.domElement;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.display = 'block';
    canvas.style.zIndex = '0';
    canvas.style.pointerEvents = 'none';

    // Append directly to body instead of the mount div
    document.body.appendChild(canvas);

    // Force an initial render
    renderer.render(scene, camera);

    // Animation
    function animate(time: number) {
      mesh.rotation.x = time / 10000;
      mesh.rotation.y = time / 5000;
      renderer.render(scene, camera);
    }

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
      renderer.setAnimationLoop(null);
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ display: 'none' }} />;
};


export default FunkyBackground;
