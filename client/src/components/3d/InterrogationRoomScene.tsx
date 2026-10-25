'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CounselArmchair, CourtCoffeeMug, ManilaCaseFolder } from './RealCourtroomProps';

export default function InterrogationRoomScene() {
  const lampRef = useRef<THREE.Group>(null);
  const spotlightRef = useRef<THREE.SpotLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Subtle swinging motion of the interrogation overhead lamp
    if (lampRef.current) {
      lampRef.current.rotation.z = Math.sin(t * 0.8) * 0.05;
      lampRef.current.rotation.x = Math.cos(t * 0.6) * 0.03;
    }
  });

  return (
    <group>
      {/* Floor: Dark tiled concrete with grid lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#111827" roughness={0.7} metalness={0.2} />
      </mesh>
      <gridHelper args={[16, 16, '#334155', '#1e293b']} position={[0, 0.005, 0]} />

      {/* Back Wall: Cold textured concrete with green trim */}
      <mesh position={[0, 3, -6]} receiveShadow>
        <planeGeometry args={[16, 6]} />
        <meshStandardMaterial color="#111827" roughness={0.9} />
      </mesh>
      {/* Wainscoting line */}
      <mesh position={[0, 1.2, -5.98]}>
        <boxGeometry args={[16, 0.08, 0.04]} />
        <meshStandardMaterial color="#0d9488" roughness={0.6} />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-6.5, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[16, 6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      {/* Right Wall with One-Way Observation Mirror */}
      <mesh position={[6.5, 3, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[16, 6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      {/* One-Way Mirror Frame */}
      <mesh position={[6.45, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[4.5, 2.2, 0.1]} />
        <meshStandardMaterial color="#020617" roughness={0.05} metalness={0.98} />
      </mesh>

      {/* Heavy Steel Interrogation Table */}
      <group position={[0, 0, 0]}>
        {/* Tabletop */}
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.08, 1.3]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Table Legs */}
        {[-1.05, 1.05].map((x) =>
          [-0.5, 0.5].map((z) => (
            <mesh key={`leg-${x}-${z}`} position={[x, 0.35, z]} castShadow>
              <cylinderGeometry args={[0.035, 0.035, 0.7, 8]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.4} />
            </mesh>
          ))
        )}

        {/* Real 3D Ceramic Coffee Mug for Detective */}
        <CourtCoffeeMug position={[-0.6, 0.79, -0.25]} scale={0.035} />

        {/* Manila Case Folder with Confidential stamp */}
        <ManilaCaseFolder position={[0.2, 0.79, -0.1]} rotation={[0, 0.25, 0]} />

        {/* Tape Recorder Exhibit */}
        <group position={[0.55, 0.79, 0.2]} rotation={[0, -0.3, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.22, 0.05, 0.14]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[-0.04, 0.026, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.01, 16]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0.04, 0.026, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.01, 16]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          {/* Red Recording LED */}
          <mesh position={[0.08, 0.028, 0.05]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      </group>

      {/* Real 3D Armchairs on Either Side of Table */}
      {/* Detective Chair */}
      <CounselArmchair position={[0, 0, -1.25]} rotation={[0, 0, 0]} scale={1.2} />

      {/* Suspect Chair */}
      <CounselArmchair position={[0, 0, 1.25]} rotation={[0, Math.PI, 0]} scale={1.2} />

      {/* Defense Counsel Chair */}
      <CounselArmchair position={[-1.4, 0, 1.25]} rotation={[0, Math.PI, 0]} scale={1.15} />

      {/* Low-hanging Industrial Lamp with swinging motion */}
      <group ref={lampRef} position={[0, 4, 0]}>
        {/* Cord */}
        <mesh position={[0, -0.8, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 1.6, 6]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Lamp Shade */}
        <mesh position={[0, -1.6, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.35, 0.25, 16, 1, true]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} side={THREE.DoubleSide} />
        </mesh>
        {/* Light Bulb */}
        <mesh position={[0, -1.68, 0]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        {/* Dramatic Interrogation Spotlight */}
        <spotLight
          ref={spotlightRef}
          position={[0, -1.7, 0]}
          target-position={[0, 0, 0]}
          intensity={6.0}
          angle={0.7}
          penumbra={0.4}
          color="#fef08a"
          castShadow
        />
      </group>
    </group>
  );
}
