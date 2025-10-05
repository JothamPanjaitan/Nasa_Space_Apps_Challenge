import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { keplerianToPosition, OrbitalElements } from '../lib/orbitPhysics';

interface OrbitRendererProps {
  elements: OrbitalElements | null;
  selectedAsteroid?: any;
  onAsteroidSelect?: (asteroid: any) => void;
}

export default function OrbitRenderer({ elements, selectedAsteroid, onAsteroidSelect }: OrbitRendererProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rafRef = useRef<number | null>(null);
  const timeRef = useRef<number>(Date.now());

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      1e3,
      1e12
    );
    camera.position.set(5e7, 3e7, 5e7); // Better angle to see Earth and orbit
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create starfield
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const starPositions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 2e9;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      transparent: true,
      opacity: 0.8
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Create Earth
    const earthGeometry = new THREE.SphereGeometry(6.371e6, 64, 64);
    
    // Earth texture (simplified)
    const earthTexture = new THREE.TextureLoader().load(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    );
    
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a90e2,
      map: earthTexture,
      transparent: true,
      opacity: 0.9
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.receiveShadow = true;
    earth.castShadow = true;
    scene.add(earth);

    // Add atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(6.371e6 * 1.02, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x4a90e2) }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(color, 1.0) * intensity;
        }
      `,
      transparent: true,
      side: THREE.BackSide
    });
    
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Create asteroid
    const asteroidGeometry = new THREE.SphereGeometry(1.5e6, 16, 16);
    const asteroidMaterial = new THREE.MeshStandardMaterial({
      color: 0xff8800,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    asteroid.castShadow = true;
    asteroid.receiveShadow = true;
    scene.add(asteroid);

    // Create orbit line (trajectory)
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitMaterial = new THREE.LineBasicMaterial({
      color: 0xff6600, // Orange for better visibility
      transparent: true,
      opacity: 0.9,
      linewidth: 2
    });
    
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbitLine);
    
    // Add trajectory markers (dots along path)
    const markerGeometry = new THREE.SphereGeometry(5e5, 8, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff6600,
      transparent: true,
      opacity: 0.6
    });
    const markers: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i++) {
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      markers.push(marker);
      scene.add(marker);
    }

    // Animation loop
    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - timeRef.current;
      timeRef.current = currentTime;

      // Update atmosphere shader
      atmosphereMaterial.uniforms.time.value = currentTime * 0.001;

      // Update orbit and asteroid position
      if (elements) {
        const positions: number[] = [];
        const samples = 360;
        
        for (let s = 0; s < samples; s++) {
          const t = currentTime + (s * 24 * 3600 * 1000) / 10; // sample
          const pos = keplerianToPosition(elements, t);
          positions.push(pos.x, pos.y, pos.z);
        }
        
        orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        // Update asteroid position
        const currentPos = keplerianToPosition(elements, currentTime);
        asteroid.position.set(currentPos.x, currentPos.y, currentPos.z);
        
        // Update trajectory markers
        for (let i = 0; i < markers.length; i++) {
          const t = currentTime + (i * 24 * 3600 * 1000 * 30); // 30-day intervals
          const pos = keplerianToPosition(elements, t);
          markers[i].position.set(pos.x, pos.y, pos.z);
        }
        
        // Rotate asteroid
        asteroid.rotation.x += 0.01;
        asteroid.rotation.y += 0.01;
      }

      // Rotate Earth
      earth.rotation.y += 0.001;

      // Rotate stars slowly
      stars.rotation.y += 0.0001;

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [elements]);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative'
      }} 
    />
  );
}
