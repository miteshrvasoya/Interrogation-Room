'use client';

import React from 'react';
import * as THREE from 'three';
import { CounselArmchair, CourtDeskLamp, CourtCoffeeMug, LegalCodeBooks, ManilaCaseFolder } from './RealCourtroomProps';

export default function CrimeScene() {
  return (
    <group>
      {/* Floor: Dark aged wood flooring with crime scene markers */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#1a120c" roughness={0.7} />
      </mesh>

      {/* Back Wall: Wood paneled study with vintage wallpaper */}
      <mesh position={[0, 3, -5]} receiveShadow>
        <planeGeometry args={[16, 6]} />
        <meshStandardMaterial color="#140e0a" roughness={0.9} />
      </mesh>

      {/* Tall Rainy Window on Left */}
      <group position={[-5.5, 3, -1]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[4, 5]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        {/* Rainy Glass Pane */}
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[3.8, 4.8]} />
          <meshStandardMaterial color="#1e293b" transparent opacity={0.6} roughness={0.1} />
        </mesh>
        {/* Moody Blue Night Moonlight through window */}
        <spotLight
          position={[0, 2, 3]}
          target-position={[0, -2, -3]}
          intensity={3.5}
          angle={0.6}
          color="#38bdf8"
        />
      </group>

      {/* Heavy Locked Study Door on Right */}
      <group position={[4.8, 2.2, -4.9]}>
        <mesh castShadow>
          <boxGeometry args={[1.8, 3.8, 0.12]} />
          <meshStandardMaterial color="#361a0d" roughness={0.5} />
        </mesh>
        {/* Antique Brass Lock & Keyhole */}
        <mesh position={[0.7, 0, 0.08]}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
          <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Police Seal Tape across door */}
        <mesh position={[0, 0.2, 0.1]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[2.2, 0.08, 0.01]} />
          <meshStandardMaterial color="#facc15" roughness={0.8} />
        </mesh>
      </group>

      {/* Grand Writing Desk */}
      <group position={[0, 0, -2]}>
        {/* Desk top */}
        <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 0.1, 1.4]} />
          <meshStandardMaterial color="#3b1d0c" roughness={0.35} />
        </mesh>
        {/* Desk Pedestals */}
        {[-1.1, 1.1].map(x => (
          <mesh key={`ped-${x}`} position={[x, 0.4, 0]} castShadow>
            <boxGeometry args={[0.5, 0.8, 1.2]} />
            <meshStandardMaterial color="#241006" roughness={0.5} />
          </mesh>
        ))}

        {/* Real 3D Banker Desk Lamp */}
        <CourtDeskLamp position={[0.85, 0.9, -0.3]} rotation={[0, -0.2, 0]} scale={0.42} />

        {/* Real 3D Ceramic Coffee Mug (The Fatal Cup) */}
        <CourtCoffeeMug position={[0.45, 0.9, 0.15]} scale={0.038} />
        {/* Spilled Pool beside mug */}
        <mesh position={[0.55, 0.905, 0.22]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.16, 16]} />
          <meshStandardMaterial color="#2d1a08" roughness={0.1} />
        </mesh>

        {/* Vintage Typewriter on desk */}
        <mesh position={[-0.2, 0.95, 0.1]} castShadow>
          <boxGeometry args={[0.5, 0.12, 0.45]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Stack of Leather Legal / Manuscript Books */}
        <LegalCodeBooks position={[-0.75, 0.9, -0.2]} rotation={[0, 0.35, 0]} />

        {/* Manila Case Folder */}
        <ManilaCaseFolder position={[0, 0.9, 0.2]} rotation={[0, -0.1, 0]} />
      </group>

      {/* Real 3D Study Armchair behind writing desk */}
      <CounselArmchair position={[0, 0, -2.9]} rotation={[0, 0, 0]} scale={1.25} />

      {/* Police Evidence Marker Cones on floor */}
      {[
        { pos: [0.9, 0.08, -1.2], label: '1' },
        { pos: [-1.2, 0.08, -1.8], label: '2' },
        { pos: [3.2, 0.08, -4.2], label: '3' }
      ].map((marker, idx) => (
        <group key={`marker-${idx}`} position={marker.pos as [number, number, number]}>
          <mesh castShadow>
            <coneGeometry args={[0.1, 0.16, 4]} />
            <meshStandardMaterial color="#facc15" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Atmospheric Noir Study Lighting */}
      <ambientLight intensity={1.1} color="#cbd5e1" />
      <directionalLight position={[3, 6, 2]} intensity={1.8} color="#fde68a" castShadow />
      <pointLight position={[0, 4, -1]} intensity={2.2} distance={12} color="#fed7aa" />
    </group>
  );
}
