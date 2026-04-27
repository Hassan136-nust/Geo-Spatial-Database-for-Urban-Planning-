import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import { Earth } from './Earth';
import { Starfield } from './Starfield';
import { CameraController } from './CameraController';
import * as THREE from 'three';

export function Scene() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full -z-10">
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        style={{ background: '#f4f7f6' }}
      >
        <Suspense fallback={null}>
          {/* Camera */}
          <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />

          {/* Camera controller for route transitions */}
          <CameraController />

          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[5, 3, 5]}
            intensity={2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-5, -3, -5]} intensity={0.5} color="#4488ff" />

          {/* Starfield background */}
          <Starfield />

          {/* Earth */}
          <Earth scrollRotation={scrollY} />
        </Suspense>
      </Canvas>
    </div>
  );
}
