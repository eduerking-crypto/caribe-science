"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const ISLANDS: Array<[number, number, number]> = [
  [21.5218, -77.7812, 1], // Cuba
  [18.1096, -77.2975, 1], // Jamaica
  [19.0, -70.6667, 1], // Hispaniola
  [18.2208, -66.5901, 1], // Puerto Rico
  [10.6918, -61.2225, 1], // Trinidad
  [13.1939, -59.5432, 1], // Barbados
  [15.5188, -61.4611, 1], // Dominica
  [17.7359, -64.7461, 1], // USVI/St Croix
  [14.0101, -60.9875, 1], // Santa Lucía
  [16.0336, -61.7665, 1], // Basse-Terre
  [13.1779, -59.4252, 0.8], // ? (Bridgetown)
  [24.2156, -75.6019, 1], // Bahamas leeward
  [20.9674, -76.9545, 1], // Céspedes/Bayamo inland → Holguín
  [22.2783, -78.5, 1], // Jardines de la Reina
  [19.4326, -99.1332, 0], // Ciudad de México (origen)
];

// Convertir lat/lon a esfera con radio r
function toVec(lat: number, lon: number, r: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return [
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
}

function OceanSphere() {
  const segments = useMemo(() => {
    const geo = new THREE.SphereGeometry(1.26, 36, 36);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c1 = new THREE.Color("#0E5F85");
    const c2 = new THREE.Color("#22AAA6");
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const depth = Math.max(0, Math.min(1, (y + 1.26) / 2.52));
      const c = c1.clone().lerp(c2, depth);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  return (
    <mesh geometry={segments}>
      <meshStandardMaterial
        vertexColors
        wireframe
        transparent
        opacity={0.55}
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
}

function Graticals() {
  const lines = useMemo(() => {
    const pts: Float32Array[] = [];
    for (let lon = -180; lon <= 180; lon += 15) {
      const arc: number[] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        arc.push(...toVec(lat, lon, 1.28));
      }
      pts.push(new Float32Array(arc));
    }
    for (let lat = -60; lat <= 60; lat += 15) {
      const arc: number[] = [];
      for (let lon = -180; lon <= 180; lon += 5) {
        arc.push(...toVec(lat, lon, 1.28));
      }
      pts.push(new Float32Array(arc));
    }
    return pts;
  }, []);

  return (
    <group>
      {lines.map((arc, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[arc, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#7FD8D3" transparent opacity={0.18} />
        </line>
      ))}
    </group>
  );
}

function IslandDots() {
  return (
    <group>
      {ISLANDS.map(([lat, lon, size], i) => (
        <mesh key={i} position={toVec(lat, lon, 1.3)}>
          <sphereGeometry args={[0.016 * (size || 0.7) + 0.005, 8, 8]} />
          <meshBasicMaterial color="#FFC93D" />
        </mesh>
      ))}
    </group>
  );
}

function Stars() {
  const stars = useMemo(() => {
    const count = 300;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3()
        .randomDirection()
        .multiplyScalar(2.6 + Math.random() * 1.6);
      arr[i * 3] = v.x;
      arr[i * 3 + 1] = v.y;
      arr[i * 3 + 2] = v.z;
    }
    return arr;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[stars, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.006} color="#BFE9F5" transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

export default function Globe3D() {
  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  return (
    <div className="aspect-square w-full" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0.4, 3.4], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.75} />
        <pointLight position={[5, 5, 5]} intensity={2.2} color="#FFE08A" />
        <pointLight position={[-4, -2, -4]} intensity={1} color="#3CC6C1" />
        <Graticals />
        <OceanSphere />
        <IslandDots />
        <Stars />
        {!reduced && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.9}
            rotateSpeed={0.4}
          />
        )}
      </Canvas>
    </div>
  );
}