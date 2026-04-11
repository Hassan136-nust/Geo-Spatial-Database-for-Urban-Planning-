import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import api from '../../services/api';

export function Earth({ scrollRotation, onRotationChange }) {
  const meshRef = useRef(null);
  const atmosphereRef = useRef(null);
  const { camera } = useThree();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [activeMarker, setActiveMarker] = useState(null);

  useEffect(() => {
    // Fetch live data points to map onto the 3D globe coordinates
    const fetchMarkers = async () => {
      try {
        const res = await api.get('/landmarks');
        if (res.data && res.data.data) {
          setMarkers(res.data.data.filter(l => l.geometry && l.geometry.coordinates));
        }
      } catch (err) {
        console.warn('Failed to load globe markers:', err.message);
      }
    };
    fetchMarkers();
  }, []);

  // Coordinate conversion Helper (Lat/Lon to 3D Cartesian)
  const getMarkerPosition = (lng, lat) => {
    const radius = 2.505; // Slightly above earth surface
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    return [x, y, z];
  };

  // Load Earth textures
  const [earthMap, earthBump, earthSpec] = useTexture([
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg',
  ]);

  // Handle mouse events for dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      const newRotationY = rotationRef.current.y + deltaX * 0.005;
      const newRotationX = rotationRef.current.x + deltaY * 0.005;

      targetRotationRef.current = {
        x: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, newRotationX)),
        y: newRotationY,
      };

      velocityRef.current = {
        x: deltaY * 0.0005,
        y: deltaX * 0.0005,
      };

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Animation loop
  useFrame((state, delta) => {
    if (!meshRef.current || !atmosphereRef.current) return;

    // Apply scroll-based rotation
    const scrollInfluence = scrollRotation * 0.001;

    if (!isDragging) {
      // Idle auto-rotation when not dragging
      targetRotationRef.current.y += delta * 0.1 + scrollInfluence;

      // Apply inertia/damping
      velocityRef.current.x *= 0.95;
      velocityRef.current.y *= 0.95;

      targetRotationRef.current.x += velocityRef.current.x;
      targetRotationRef.current.y += velocityRef.current.y;
    }

    // Smooth lerp to target rotation
    rotationRef.current.x = THREE.MathUtils.lerp(rotationRef.current.x, targetRotationRef.current.x, 0.1);
    rotationRef.current.y = THREE.MathUtils.lerp(rotationRef.current.y, targetRotationRef.current.y, 0.1);

    meshRef.current.rotation.x = rotationRef.current.x;
    meshRef.current.rotation.y = rotationRef.current.y;
    atmosphereRef.current.rotation.x = rotationRef.current.x;
    atmosphereRef.current.rotation.y = rotationRef.current.y;

    // Subtle atmosphere pulse
    if (atmosphereRef.current.material instanceof THREE.ShaderMaterial) {
      atmosphereRef.current.material.uniforms.glowIntensity.value =
        0.8 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }

    // Hover glow effect
    if (isHovered && atmosphereRef.current.material instanceof THREE.ShaderMaterial) {
      atmosphereRef.current.material.uniforms.glowIntensity.value =
        Math.min(1.5, atmosphereRef.current.material.uniforms.glowIntensity.value + delta * 2);
    }
  });

  // Atmosphere shader material
  const atmosphereShader = useMemo(() => ({
    uniforms: {
      glowIntensity: { value: 1.0 },
      glowColor: { value: new THREE.Color(0x4488ff) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float glowIntensity;
      uniform vec3 glowColor;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        gl_FragColor = vec4(glowColor, 1.0) * intensity * glowIntensity;
      }
    `,
  }), []);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    velocityRef.current = { x: 0, y: 0 };
  };

  return (
    <group>
      {/* Main Earth sphere */}
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshPhongMaterial
          map={earthMap}
          bumpMap={earthBump}
          bumpScale={0.05}
          specularMap={earthSpec}
          specular={new THREE.Color(0x333333)}
          shininess={25}
        />
        
        {/* Render Live Data Markers on Globe */}
        {markers.map((marker, i) => {
          const coords = marker.geometry.coordinates; // [lng, lat]
          const pos = getMarkerPosition(coords[0], coords[1]);
          const color = marker.type === 'hospital' ? '#ef4444' : 
                        marker.type === 'commercial' ? '#ec4899' :
                        marker.type === 'park' ? '#10b981' : '#06b6d4';
          
          const isMarkerActive = activeMarker === marker._id;
          
          return (
            <group key={marker._id || i} position={pos}>
              <mesh 
                onPointerEnter={(e) => { e.stopPropagation(); setActiveMarker(marker._id); }}
                onPointerLeave={(e) => { e.stopPropagation(); setActiveMarker(null); }}
              >
                <sphereGeometry args={[isMarkerActive ? 0.025 : 0.015, 8, 8]} />
                <meshBasicMaterial color={color} />
              </mesh>

              {isMarkerActive && (
                <Html distanceFactor={10} center zIndexRange={[100, 0]}>
                  <div className="bg-black/80 backdrop-blur-md border border-cyan-500/50 rounded-lg p-3 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] pointer-events-none w-48 transition-all duration-300">
                    <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">{marker.name}</div>
                    <div className="flex justify-between items-center text-[10px] text-white/70">
                      <span className="capitalize">{marker.type}</span>
                      <span className={`${marker.status === 'operational' ? 'text-green-400' : 'text-amber-400'}`}>
                        {marker.status || 'Active'}
                      </span>
                    </div>
                    {(marker.capacity || marker.service_radius_km) && (
                      <div className="mt-2 pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-[9px]">
                        <div>
                          <div className="text-white/40">CAPACITY</div>
                          <div>{marker.capacity || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-white/40">RADIUS</div>
                          <div>{marker.service_radius_km ? `${marker.service_radius_km}km` : 'N/A'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </Html>
              )}
              <pointLight distance={0.5} intensity={isMarkerActive ? 1.5 : 0.5} color={color} />
            </group>
          );
        })}
      </mesh>

      {/* Atmospheric glow */}
      <mesh ref={atmosphereRef} scale={1.1}>
        <sphereGeometry args={[2.5, 64, 64]} />
        <shaderMaterial
          attach="material"
          args={[atmosphereShader]}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
