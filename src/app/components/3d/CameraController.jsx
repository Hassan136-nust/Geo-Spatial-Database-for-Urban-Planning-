import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useLocation } from 'react-router';
import * as THREE from 'three';

const routeCameraPositions = {
  '/': { position: [0, 0, 8], fov: 50 },
  '/login': { position: [0, 0.5, 7.5], fov: 52 },
  '/dashboard': { position: [0, 1, 7], fov: 55 },
  '/zones': { position: [1, 0, 7.5], fov: 50 },
  '/infrastructure': { position: [-1, 0.5, 7.5], fov: 52 },
  '/analytics': { position: [0, -0.5, 7], fov: 55 },
  '/profile': { position: [0.5, 0.5, 7.5], fov: 50 },
  '/admin': { position: [-0.5, 0, 7.5], fov: 52 },
};

export function CameraController() {
  const { camera } = useThree();
  const location = useLocation();
  const targetPosition = useRef(new THREE.Vector3(0, 0, 8));
  const targetFov = useRef(50);

  useEffect(() => {
    const config = routeCameraPositions[location.pathname] || routeCameraPositions['/'];
    targetPosition.current.set(...config.position);
    targetFov.current = config.fov || 50;

    const startPosition = camera.position.clone();
    const startFov = camera.fov || 50;
    const duration = 1200;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPosition, targetPosition.current, eased);

      if ('fov' in camera) {
        camera.fov = THREE.MathUtils.lerp(startFov, targetFov.current, eased);
        camera.updateProjectionMatrix();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [location.pathname, camera]);

  return null;
}
