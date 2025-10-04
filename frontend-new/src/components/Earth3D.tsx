import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import './Earth3D.css';

interface Earth3DProps {
  asteroidTrajectory?: Array<{x: number, y: number, z: number}>;
  impactPoint?: {lat: number, lng: number};
  onEarthClick?: (lat: number, lng: number) => void;
  className?: string;
}

export default function Earth3D({ 
  asteroidTrajectory, 
  impactPoint, 
  onEarthClick,
  className = ''
}: Earth3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 800;   // fallback values
    const height = mountRef.current.clientHeight || 600;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create Earth
    const earthGeometry = new THREE.SphereGeometry(1, 64, 32);
    
    // Create Earth material with texture
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a90e2,
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.castShadow = true;
    earth.receiveShadow = true;
    earth.userData = { type: 'earth' };
    scene.add(earth);
    earthRef.current = earth;

    // Add atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(1.05, 32, 16);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Add stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.02
    });

    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 20;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Add asteroid trajectory if provided
    if (asteroidTrajectory && asteroidTrajectory.length > 0) {
      const trajectoryGeometry = new THREE.BufferGeometry();
      const trajectoryMaterial = new THREE.LineBasicMaterial({
        color: 0xff6b6b,
        linewidth: 2
      });

      const trajectoryPoints = asteroidTrajectory.map(point => 
        new THREE.Vector3(point.x, point.y, point.z)
      );
      trajectoryGeometry.setFromPoints(trajectoryPoints);
      
      const trajectory = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
      scene.add(trajectory);

      // Add asteroid at current position
      const asteroidGeometry = new THREE.SphereGeometry(0.05, 8, 6);
      const asteroidMaterial = new THREE.MeshBasicMaterial({ color: 0xff4757 });
      const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
      
      if (asteroidTrajectory.length > 0) {
        const lastPoint = asteroidTrajectory[asteroidTrajectory.length - 1];
        asteroid.position.set(lastPoint.x, lastPoint.y, lastPoint.z);
      }
      
      scene.add(asteroid);
    }

    // Add impact point if provided
    if (impactPoint) {
      const lat = (impactPoint.lat * Math.PI) / 180;
      const lng = (impactPoint.lng * Math.PI) / 180;
      
      const x = Math.cos(lat) * Math.cos(lng);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.sin(lng);
      
      const impactGeometry = new THREE.SphereGeometry(0.1, 8, 6);
      const impactMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.8
      });
      const impactMarker = new THREE.Mesh(impactGeometry, impactMaterial);
      impactMarker.position.set(x, y, z);
      scene.add(impactMarker);
    }

    // Mouse controls
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      earth.rotation.y += deltaX * 0.01;
      earth.rotation.x += deltaY * 0.01;

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleClick = (event: MouseEvent) => {
      if (!onEarthClick) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObject(earth);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const lat = Math.asin(point.y) * (180 / Math.PI);
        const lng = Math.atan2(point.z, point.x) * (180 / Math.PI);
        onEarthClick(lat, lng);
      }
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Rotate Earth slowly
      earth.rotation.y += 0.005;
      
      // Rotate stars
      stars.rotation.y += 0.001;
      
      renderer.render(scene, camera);
    };

    animate();
    setIsLoading(false);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      
      if (mountRef.current && renderer.domElement.parentNode) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
  }, [asteroidTrajectory, impactPoint, onEarthClick]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`earth-3d-container ${className}`}>
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading 3D Earth...</p>
        </div>
      )}
      {error && (
        <div className="error-overlay">
          <p>Error loading 3D Earth: {error}</p>
        </div>
      )}
      <div 
        ref={mountRef} 
        className="earth-3d-canvas"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
