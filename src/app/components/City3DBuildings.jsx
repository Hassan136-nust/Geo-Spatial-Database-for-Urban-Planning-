import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// ── Shared material colors ─────────────────────────────────
const M = {
  cream:  { color: '#f0e8d5', roughness: 0.8 },
  white:  { color: '#f4f6f8', roughness: 0.5, metalness: 0.05 },
  red:    { color: '#c0392b', roughness: 0.7 },
  darkRed:{ color: '#7a1f1f', roughness: 0.9 },
  brown:  { color: '#6b3a2a', roughness: 0.9 },
  dkBrown:{ color: '#3d1f0f', roughness: 1.0 },
  glass:  { color: '#a8d4f0', roughness: 0.1, metalness: 0.6 },
  concrete:{ color: '#b0aaa0', roughness: 0.95 },
  steel:  { color: '#8a9aaa', roughness: 0.3, metalness: 0.7 },
  green:  { color: '#2d7a3a', roughness: 0.9 },
  lgGreen:{ color: '#4caf65', roughness: 0.8 },
  blue:   { color: '#1a4fa0', roughness: 0.6 },
  orange: { color: '#c0510a', roughness: 0.7 },
  purple: { color: '#6a3fa0', roughness: 0.6 },
  gold:   { color: '#c8a020', roughness: 0.4, metalness: 0.3 },
  asphalt:{ color: '#3a3a3a', roughness: 1.0 },
  yellow: { color: '#e0b020', roughness: 0.7 },
};

function Mat({ c }) {
  return <meshStandardMaterial {...c} />;
}

// ─────────────────────────────────────────────────────────
export function House() {
  return (
    <group>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.82, 0.84, 0.82]} />
        <Mat c={M.cream} />
      </mesh>
      {/* Gable roof */}
      <mesh position={[0, 0.97, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.65, 0.52, 4]} />
        <Mat c={M.red} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.22, 0.412]}>
        <boxGeometry args={[0.18, 0.38, 0.01]} />
        <Mat c={M.dkBrown} />
      </mesh>
      {/* 2 Windows */}
      {[-0.22, 0.22].map((x, i) => (
        <mesh key={i} position={[x, 0.5, 0.412]}>
          <boxGeometry args={[0.16, 0.16, 0.01]} />
          <Mat c={M.glass} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────
export function Hospital() {
  return (
    <group>
      {/* Main body */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 1.8, 1.0]} />
        <Mat c={M.white} />
      </mesh>
      {/* Roof parapet */}
      <mesh position={[0, 1.82, 0]}>
        <boxGeometry args={[1.05, 0.08, 1.05]} />
        <Mat c={M.concrete} />
      </mesh>
      {/* Floor stripes */}
      {[0.6, 1.2].map((y, i) => (
        <mesh key={i} position={[0, y, 0.51]}>
          <boxGeometry args={[0.9, 0.04, 0.01]} />
          <meshStandardMaterial color="#c8dde8" roughness={0.5} />
        </mesh>
      ))}
      {/* Red cross H */}
      <mesh position={[0, 1.65, 0.51]}>
        <boxGeometry args={[0.38, 0.09, 0.015]} />
        <meshStandardMaterial color="#e02020" emissive="#c00000" emissiveIntensity={0.25} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.65, 0.51]}>
        <boxGeometry args={[0.09, 0.38, 0.015]} />
        <meshStandardMaterial color="#e02020" emissive="#c00000" emissiveIntensity={0.25} roughness={0.5} />
      </mesh>
      {/* Windows */}
      {[-0.28, 0.28].map((x, i) =>
        [0.55, 1.15].map((y, j) => (
          <mesh key={`${i}${j}`} position={[x, y, 0.51]}>
            <boxGeometry args={[0.15, 0.2, 0.01]} />
            <Mat c={M.glass} />
          </mesh>
        ))
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────
export function School() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 1.0, 0.9]} />
        <meshStandardMaterial color="#c8a060" roughness={0.85} />
      </mesh>
      {/* Flat roof */}
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[1.15, 0.07, 0.95]} />
        <Mat c={M.concrete} />
      </mesh>
      {/* Bell tower */}
      <mesh position={[0.35, 1.45, 0]} castShadow>
        <boxGeometry args={[0.28, 0.8, 0.28]} />
        <meshStandardMaterial color="#b89050" roughness={0.85} />
      </mesh>
      <mesh position={[0.35, 1.9, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.22, 0.3, 4]} />
        <meshStandardMaterial color="#6b3a2a" roughness={0.9} />
      </mesh>
      {/* Windows */}
      {[-0.3, 0.0, 0.3].map((x, i) =>
        [0.45, 0.75].map((y, j) => (
          <mesh key={`${i}${j}`} position={[x, y, 0.46]}>
            <boxGeometry args={[0.14, 0.18, 0.01]} />
            <Mat c={M.glass} />
          </mesh>
        ))
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────
function Tree({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.075, 0.4, 6]} />
        <Mat c={M.brown} />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow>
        <coneGeometry args={[0.3, 0.7, 7]} />
        <Mat c={M.green} />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <coneGeometry args={[0.22, 0.55, 7]} />
        <Mat c={M.lgGreen} />
      </mesh>
    </group>
  );
}

export function Park() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[0.9, 16]} />
        <meshStandardMaterial color="#3a8a4a" roughness={0.95} />
      </mesh>
      <Tree x={0} z={0} />
      <Tree x={0.5} z={0.3} />
      <Tree x={-0.45} z={0.2} />
      <Tree x={0.15} z={-0.5} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────
export function Road() {
  return (
    <group>
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[2.0, 0.04, 0.55]} />
        <Mat c={M.asphalt} />
      </mesh>
      {/* Centre dashes */}
      {[-0.6, 0, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 0.03, 0]}>
          <boxGeometry args={[0.3, 0.01, 0.05]} />
          <meshStandardMaterial color="#f0e060" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────
export function Mosque() {
  return (
    <group>
      {/* Base body */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <Mat c={M.white} />
      </mesh>
      {/* Drum for dome */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.12, 12]} />
        <Mat c={M.white} />
      </mesh>
      {/* Main dome */}
      <mesh position={[0, 1.16, 0]} castShadow>
        <sphereGeometry args={[0.32, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#d4c080" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Finial */}
      <mesh position={[0, 1.49, 0]} castShadow>
        <coneGeometry args={[0.035, 0.18, 6]} />
        <Mat c={M.gold} />
      </mesh>
      {/* 2 Minarets */}
      {[-0.38, 0.38].map((x, i) => (
        <group key={i} position={[x, 0, 0.38]}>
          <mesh position={[0, 0.72, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.09, 1.44, 8]} />
            <Mat c={M.white} />
          </mesh>
          <mesh position={[0, 1.55, 0]}>
            <coneGeometry args={[0.1, 0.28, 8]} />
            <meshStandardMaterial color="#c8a020" roughness={0.4} metalness={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────
export function Mall() {
  return (
    <group>
      {/* Wide low body */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.8, 1.1]} />
        <meshStandardMaterial color="#d0d8e0" roughness={0.55} metalness={0.1} />
      </mesh>
      {/* Glass canopy top */}
      <mesh position={[0, 0.83, 0]} castShadow>
        <boxGeometry args={[1.45, 0.08, 1.15]} />
        <Mat c={M.steel} />
      </mesh>
      {/* Glass facade panels */}
      {[-0.45, 0, 0.45].map((x, i) => (
        <mesh key={i} position={[x, 0.42, 0.56]}>
          <boxGeometry args={[0.32, 0.55, 0.01]} />
          <Mat c={M.glass} />
        </mesh>
      ))}
      {/* Entrance canopy */}
      <mesh position={[0, 0.62, 0.65]}>
        <boxGeometry args={[0.5, 0.04, 0.22]} />
        <Mat c={M.steel} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────
export function Police() {
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 1.1, 0.9]} />
        <meshStandardMaterial color="#1a3a6a" roughness={0.7} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 1.13, 0]}>
        <boxGeometry args={[0.95, 0.07, 0.95]} />
        <Mat c={M.concrete} />
      </mesh>
      {/* Light bar */}
      <mesh position={[0, 1.22, 0]}>
        <boxGeometry args={[0.3, 0.06, 0.1]} />
        <meshStandardMaterial color="#2060e0" emissive="#1040c0" emissiveIntensity={0.5} roughness={0.3} />
      </mesh>
      {/* Sign */}
      <mesh position={[0, 0.75, 0.46]}>
        <boxGeometry args={[0.36, 0.1, 0.01]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      {/* Windows */}
      {[-0.22, 0.22].map((x, i) =>
        [0.5, 0.85].map((y, j) => (
          <mesh key={`${i}${j}`} position={[x, y, 0.46]}>
            <boxGeometry args={[0.14, 0.16, 0.01]} />
            <Mat c={M.glass} />
          </mesh>
        ))
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────
export function Industrial() {
  return (
    <group>
      {/* Main shed */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.0, 1.0]} />
        <Mat c={M.concrete} />
      </mesh>
      {/* Arched roof suggestion */}
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[1.25, 0.07, 1.05]} />
        <Mat c={M.steel} />
      </mesh>
      {/* 2 Chimneys */}
      {[-0.3, 0.25].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 1.55, -0.2]} castShadow>
            <cylinderGeometry args={[0.09, 0.11, 1.1, 8]} />
            <meshStandardMaterial color="#5a5a5a" roughness={0.9} />
          </mesh>
          <mesh position={[x, 2.12, -0.2]}>
            <cylinderGeometry args={[0.12, 0.09, 0.12, 8]} />
            <meshStandardMaterial color="#3a3a3a" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────
export function FireStation() {
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 1.1, 0.9]} />
        <Mat c={M.red} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[1.05, 0.07, 0.95]} />
        <meshStandardMaterial color="#8a1a1a" roughness={0.9} />
      </mesh>
      {/* Garage doors */}
      {[-0.28, 0.28].map((x, i) => (
        <mesh key={i} position={[x, 0.3, 0.46]}>
          <boxGeometry args={[0.38, 0.55, 0.015]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.4} metalness={0.3} />
        </mesh>
      ))}
      {/* Sign strip */}
      <mesh position={[0, 0.78, 0.46]}>
        <boxGeometry args={[0.75, 0.1, 0.01]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────
export function University() {
  return (
    <group>
      {/* Main hall */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.8, 1.0]} />
        <meshStandardMaterial color="#c8b898" roughness={0.8} />
      </mesh>
      {/* Pediment / classical front */}
      <mesh position={[0, 1.88, 0.51]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.6, 0.3, 3, 1, false, -Math.PI / 6]} />
        <meshStandardMaterial color="#b8a888" roughness={0.85} />
      </mesh>
      {/* Columns */}
      {[-0.45, -0.15, 0.15, 0.45].map((x, i) => (
        <mesh key={i} position={[x, 0.65, 0.52]} castShadow>
          <cylinderGeometry args={[0.055, 0.065, 1.3, 8]} />
          <meshStandardMaterial color="#e0d8c8" roughness={0.7} />
        </mesh>
      ))}
      {/* Windows */}
      {[-0.5, 0, 0.5].map((x, i) =>
        [0.55, 1.1, 1.55].map((y, j) => (
          <mesh key={`${i}${j}`} position={[x, y, 0.51]}>
            <boxGeometry args={[0.2, 0.24, 0.01]} />
            <Mat c={M.glass} />
          </mesh>
        ))
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────
export function OtherBuilding() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.75, 1.0, 0.75]} />
        <Mat c={M.concrete} />
      </mesh>
      <mesh position={[0, 1.03, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.58, 0.4, 4]} />
        <meshStandardMaterial color="#7a7a7a" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────
// Map type → component
const TYPE_COMPONENTS = {
  house: House,
  residential: House,
  hospital: Hospital,
  school: School,
  park: Park,
  road: Road,
  mosque: Mosque,
  mall: Mall,
  police: Police,
  industrial: Industrial,
  fire_station: FireStation,
  university: University,
  other: OtherBuilding,
};

export const TYPE_COLOR = {
  house: '#60a5fa', residential: '#93c5fd', hospital: '#f87171',
  school: '#fbbf24', park: '#4ade80', road: '#94a3b8',
  mosque: '#c084fc', mall: '#38bdf8', police: '#1a3a6a',
  industrial: '#9ca3af', fire_station: '#ef4444',
  university: '#a78bfa', other: '#6b7280',
};

export function Building3D({ type, x, z }) {
  const Comp = TYPE_COMPONENTS[type] || OtherBuilding;
  return (
    <group position={[x, 0, z]}>
      <Comp />
    </group>
  );
}
