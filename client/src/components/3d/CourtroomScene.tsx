'use client';

import React from 'react';
import * as THREE from 'three';
import {
  CourtroomJudicialChair,
  CounselArmchair,
  CourtDeskLamp,
  CourtCoffeeMug,
  EvidenceCameraExhibit,
  RealisticJudicialGavel,
  CourtMicrophone,
  LegalCodeBooks,
  ManilaCaseFolder
} from './RealCourtroomProps';

export default function CourtroomScene() {
  return (
    <group>
      {/* ────────────────── LIGHTING SYSTEM ────────────────── */}
      <ambientLight intensity={1.3} color="#fef3c7" />
      <directionalLight position={[4, 9, 5]} intensity={1.9} color="#fffbeb" castShadow />
      
      {/* Overhead Warm Chandelier Fill */}
      <pointLight position={[0, 6, -1]} intensity={2.2} distance={18} color="#fde68a" />
      
      {/* Judicial Bench Spotlight */}
      <spotLight
        position={[0, 7.5, -3.2]}
        intensity={4.0}
        angle={0.65}
        penumbra={0.6}
        color="#fffbeb"
        castShadow
      />

      {/* Evidence Exhibit Center Spotlight */}
      <spotLight
        position={[0, 5.0, -2.2]}
        intensity={3.2}
        angle={0.4}
        penumbra={0.5}
        color="#fef08a"
      />

      {/* ────────────────── ARCHITECTURE & WALLS ────────────────── */}
      {/* Floor: Solid Stately Parquet Hardwood */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[26, 0.3, 26]} />
        <meshStandardMaterial color="#3b1d0c" roughness={0.3} metalness={0.08} />
      </mesh>
      {/* Polished Parquet Inlay Border */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color="#4a2511" roughness={0.25} metalness={0.12} />
      </mesh>

      {/* Classical Pedestal & Marble Bust (Left of Dais) */}
      <group position={[-3.4, 0, -4.6]}>
        <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.24, 1.3, 16]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.2} metalness={0.05} />
        </mesh>
        <mesh position={[0, 1.32, 0]}>
          <boxGeometry args={[0.44, 0.06, 0.44]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.2} />
        </mesh>
        <group position={[0, 1.55, 0]} scale={0.65}>
          <mesh castShadow>
            <cylinderGeometry args={[0.16, 0.22, 0.35, 12]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.28, 0]} castShadow>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.25} />
          </mesh>
        </group>
      </group>

      {/* Classical Pedestal & Marble Bust (Right of Dais) */}
      <group position={[3.4, 0, -4.6]}>
        <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.24, 1.3, 16]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.2} metalness={0.05} />
        </mesh>
        <mesh position={[0, 1.32, 0]}>
          <boxGeometry args={[0.44, 0.06, 0.44]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.2} />
        </mesh>
        <group position={[0, 1.55, 0]} scale={0.65}>
          <mesh castShadow>
            <cylinderGeometry args={[0.16, 0.22, 0.35, 12]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.28, 0]} castShadow>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.25} />
          </mesh>
        </group>
      </group>

      {/* Back Wall with Classical Stately Wainscoting */}
      <mesh position={[0, 5, -6.5]} receiveShadow>
        <planeGeometry args={[22, 10]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      {/* Lower Wood Wainscoting on Back Wall */}
      <mesh position={[0, 1.6, -6.45]} receiveShadow>
        <boxGeometry args={[22, 3.2, 0.1]} />
        <meshStandardMaterial color="#381a08" roughness={0.45} />
      </mesh>
      {/* Decorative Gold Wainscoting Trim */}
      <mesh position={[0, 3.2, -6.38]}>
        <boxGeometry args={[22, 0.1, 0.05]} />
        <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Grand Scales of Justice / Court Seal on Back Wall */}
      <group position={[0, 4.9, -6.4]}>
        {/* Outer Gold Medallion Ring */}
        <mesh>
          <ringGeometry args={[1.05, 1.2, 32]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Center Plaque */}
        <mesh position={[0, 0, -0.01]}>
          <circleGeometry args={[1.05, 32]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        {/* Pillar of Justice */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.08, 1.35, 0.03]} />
          <meshStandardMaterial color="#fcd34d" metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Crossbeam */}
        <mesh position={[0, 0.45, 0.02]}>
          <boxGeometry args={[1.4, 0.06, 0.03]} />
          <meshStandardMaterial color="#fcd34d" metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Left Scale Pan */}
        <mesh position={[-0.6, 0.12, 0.02]}>
          <cylinderGeometry args={[0.22, 0.02, 0.12, 16]} />
          <meshStandardMaterial color="#fcd34d" metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Right Scale Pan */}
        <mesh position={[0.6, 0.12, 0.02]}>
          <cylinderGeometry args={[0.22, 0.02, 0.12, 16]} />
          <meshStandardMaterial color="#fcd34d" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>

      {/* Left Wall with Sconce Lighting */}
      <mesh position={[-9, 5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      <group position={[-8.9, 3.5, -1]}>
        <pointLight intensity={1.4} distance={7} color="#fed7aa" />
        <mesh>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color="#fde68a" />
        </mesh>
      </group>

      {/* Right Wall with Sconce Lighting */}
      <mesh position={[9, 5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      <group position={[8.9, 3.5, -1]}>
        <pointLight intensity={1.4} distance={7} color="#fed7aa" />
        <mesh>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color="#fde68a" />
        </mesh>
      </group>

      {/* ────────────────── JUDICIAL DAIS & BENCH ────────────────── */}
      {/* Elevated Dais */}
      <mesh position={[0, 0.4, -4.5]} receiveShadow castShadow>
        <boxGeometry args={[7.8, 0.8, 3.4]} />
        <meshStandardMaterial color="#2c1407" roughness={0.45} />
      </mesh>
      {/* Dais Gold Trim */}
      <mesh position={[0, 0.8, -2.78]}>
        <boxGeometry args={[7.8, 0.06, 0.06]} />
        <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Grand Real 3D Judicial Armchair (Behind the Judge) */}
      <CourtroomJudicialChair position={[0, 0.8, -5.2]} rotation={[0, 0, 0]} scale={1.45} />

      {/* Stately Mahogany Judicial Bench */}
      <mesh position={[0, 1.35, -4.2]} castShadow receiveShadow>
        <boxGeometry args={[5.2, 1.1, 1.3]} />
        <meshStandardMaterial color="#451a03" roughness={0.3} metalness={0.12} />
      </mesh>
      {/* Bench Carved Front Molding */}
      <mesh position={[0, 1.35, -3.53]}>
        <boxGeometry args={[4.8, 0.85, 0.06]} />
        <meshStandardMaterial color="#602809" roughness={0.4} />
      </mesh>

      {/* Realistic Judicial Gavel & Sounding Block on Judge's Bench */}
      <RealisticJudicialGavel position={[0.8, 1.93, -3.9]} rotation={[0, 0.3, 0]} />

      {/* Judge's Desk Lamp (Real 3D GLTF) */}
      <CourtDeskLamp position={[-1.4, 1.92, -3.95]} rotation={[0, 0.2, 0]} scale={0.42} />

      {/* Judge's Gooseneck Microphone */}
      <CourtMicrophone position={[0, 1.92, -3.65]} rotation={[0, 0, 0]} />

      {/* Stacked Legal Code Volumes on Judge's Desk */}
      <LegalCodeBooks position={[-0.7, 1.92, -4.0]} rotation={[0, -0.15, 0]} />

      {/* ────────────────── WITNESS STAND BOX ────────────────── */}
      <group position={[-2.7, 0, -3.2]}>
        {/* Elevated Witness Platform */}
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.7, 1.5]} />
          <meshStandardMaterial color="#381a08" roughness={0.4} />
        </mesh>
        {/* Railing around witness */}
        <mesh position={[0, 1.05, 0.7]} castShadow>
          <boxGeometry args={[1.7, 0.65, 0.08]} />
          <meshStandardMaterial color="#54230b" roughness={0.35} />
        </mesh>
        <mesh position={[0.8, 1.05, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[1.4, 0.65, 0.08]} />
          <meshStandardMaterial color="#54230b" roughness={0.35} />
        </mesh>

        {/* Real 3D Armchair inside Witness Stand */}
        <CounselArmchair position={[0, 0.7, -0.15]} rotation={[0, 0.35, 0]} scale={1.15} />

        {/* Witness Microphone on Railing */}
        <CourtMicrophone position={[0.2, 1.38, 0.65]} rotation={[0, -0.3, 0]} />
      </group>

      {/* ────────────────── OFFICIAL EVIDENCE EXHIBIT TABLE ────────────────── */}
      <group position={[0, 0, -2.3]}>
        {/* Evidence Table */}
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 0.06, 0.9]} />
          <meshStandardMaterial color="#381a08" roughness={0.4} />
        </mesh>
        {/* Table Legs */}
        {[-0.85, 0.85].map((x) =>
          [-0.35, 0.35].map((z) => (
            <mesh key={`ev-leg-${x}-${z}`} position={[x, 0.22, z]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.44, 8]} />
              <meshStandardMaterial color="#1e0e05" />
            </mesh>
          ))
        )}
        {/* Velvet Evidence Display Mat */}
        <mesh position={[0, 0.485, 0]}>
          <boxGeometry args={[1.7, 0.01, 0.75]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        {/* Real 3D Antique Detective Camera Exhibit */}
        <EvidenceCameraExhibit position={[-0.3, 0.49, 0]} rotation={[0, 0.4, 0]} scale={0.045} />
        {/* Evidence Tent Marker #1 (Bright Yellow) */}
        <group position={[-0.6, 0.49, 0.15]} rotation={[0, 0.2, 0]}>
          <mesh castShadow>
            <coneGeometry args={[0.06, 0.1, 3]} />
            <meshStandardMaterial color="#eab308" roughness={0.3} />
          </mesh>
        </group>
        {/* Evidence Exhibit Clipboard / Log */}
        <ManilaCaseFolder position={[0.4, 0.49, -0.05]} rotation={[0, -0.2, 0]} />
      </group>

      {/* ────────────────── COUNSEL TABLES WITH REAL 3D CHAIRS ────────────────── */}
      {/* Prosecution Counsel Table (Right side) */}
      <group position={[1.9, 0, -0.5]}>
        {/* Table Surface */}
        <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.08, 1.15]} />
          <meshStandardMaterial color="#451a03" roughness={0.3} />
        </mesh>
        {/* Green Leather Blotter */}
        <mesh position={[0, 0.83, 0]}>
          <boxGeometry args={[1.8, 0.01, 0.8]} />
          <meshStandardMaterial color="#14532d" roughness={0.65} />
        </mesh>
        {/* Real 3D Banker Desk Lamp */}
        <CourtDeskLamp position={[0.85, 0.84, -0.25]} rotation={[0, -0.2, 0]} scale={0.4} />
        {/* Real 3D Ceramic Coffee Mug */}
        <CourtCoffeeMug position={[-0.7, 0.84, -0.3]} scale={0.035} />
        {/* Counsel Microphone */}
        <CourtMicrophone position={[0, 0.84, -0.2]} rotation={[0, 0, 0]} />
        {/* Legal Briefs & Dossier */}
        <ManilaCaseFolder position={[0.2, 0.84, 0.1]} rotation={[0, 0.1, 0]} />
        {/* Table Legs */}
        {[-1.05, 1.05].map((x) =>
          [-0.45, 0.45].map((z) => (
            <mesh key={`p-leg-${x}-${z}`} position={[x, 0.38, z]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.76, 8]} />
              <meshStandardMaterial color="#2d1203" />
            </mesh>
          ))
        )}

        {/* Real 3D Counsel Armchairs for Prosecution */}
        <CounselArmchair position={[-0.45, 0, -0.75]} rotation={[0, -0.15, 0]} scale={1.22} />
        <CounselArmchair position={[0.55, 0, -0.75]} rotation={[0, -0.1, 0]} scale={1.22} />
      </group>

      {/* Defense Counsel Table (Left side) */}
      <group position={[-1.9, 0, -0.5]}>
        {/* Table Surface */}
        <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.08, 1.15]} />
          <meshStandardMaterial color="#451a03" roughness={0.3} />
        </mesh>
        {/* Burgundy Leather Blotter */}
        <mesh position={[0, 0.83, 0]}>
          <boxGeometry args={[1.8, 0.01, 0.8]} />
          <meshStandardMaterial color="#881337" roughness={0.65} />
        </mesh>
        {/* Real 3D Banker Desk Lamp */}
        <CourtDeskLamp position={[-0.85, 0.84, -0.25]} rotation={[0, 0.2, 0]} scale={0.4} />
        {/* Real 3D Ceramic Coffee Mug */}
        <CourtCoffeeMug position={[0.7, 0.84, -0.3]} scale={0.035} />
        {/* Counsel Microphone */}
        <CourtMicrophone position={[0, 0.84, -0.2]} rotation={[0, 0, 0]} />
        {/* Legal Code Volumes on Defense Table */}
        <LegalCodeBooks position={[-0.2, 0.84, 0.1]} rotation={[0, -0.08, 0]} />
        {/* Table Legs */}
        {[-1.05, 1.05].map((x) =>
          [-0.45, 0.45].map((z) => (
            <mesh key={`d-leg-${x}-${z}`} position={[x, 0.38, z]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.76, 8]} />
              <meshStandardMaterial color="#2d1203" />
            </mesh>
          ))
        )}

        {/* Real 3D Counsel Armchairs for Defense */}
        <CounselArmchair position={[-0.55, 0, -0.75]} rotation={[0, 0.1, 0]} scale={1.22} />
        <CounselArmchair position={[0.45, 0, -0.75]} rotation={[0, 0.15, 0]} scale={1.22} />
      </group>

      {/* ────────────────── TWO-TIERED JURY BOX (RIGHT WALL) ────────────────── */}
      <group position={[6.2, 0, -1.8]}>
        {/* Front Tier Platform */}
        <mesh position={[0, 0.18, 0.6]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.36, 1.2]} />
          <meshStandardMaterial color="#381a08" roughness={0.45} />
        </mesh>
        {/* Front Tier Balustrade Railing */}
        <mesh position={[0, 0.65, 1.15]} castShadow>
          <boxGeometry args={[3.2, 0.6, 0.08]} />
          <meshStandardMaterial color="#54230b" roughness={0.35} />
        </mesh>
        {/* Front Row Jury Armchairs */}
        <CounselArmchair position={[-0.9, 0.36, 0.55]} rotation={[0, -Math.PI / 2, 0]} scale={1.05} />
        <CounselArmchair position={[0, 0.36, 0.55]} rotation={[0, -Math.PI / 2, 0]} scale={1.05} />
        <CounselArmchair position={[0.9, 0.36, 0.55]} rotation={[0, -Math.PI / 2, 0]} scale={1.05} />

        {/* Elevated Back Tier Platform */}
        <mesh position={[0, 0.45, -0.6]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.9, 1.2]} />
          <meshStandardMaterial color="#2c1407" roughness={0.45} />
        </mesh>
        {/* Back Row Jury Armchairs */}
        <CounselArmchair position={[-0.9, 0.9, -0.65]} rotation={[0, -Math.PI / 2, 0]} scale={1.05} />
        <CounselArmchair position={[0, 0.9, -0.65]} rotation={[0, -Math.PI / 2, 0]} scale={1.05} />
        <CounselArmchair position={[0.9, 0.9, -0.65]} rotation={[0, -Math.PI / 2, 0]} scale={1.05} />
      </group>

      {/* ────────────────── GALLERY RAILING ────────────────── */}
      {/* Left Gallery Railing */}
      <group position={[-4.0, 0, 4.0]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[5.2, 0.08, 0.12]} />
          <meshStandardMaterial color="#78350f" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[5.2, 0.06, 0.08]} />
          <meshStandardMaterial color="#451a03" />
        </mesh>
        {[-2.2, -1.6, -1.0, -0.4, 0.2, 0.8, 1.4, 2.0].map((x) => (
          <mesh key={`l-spindle-${x}`} position={[x, 0.52, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.7, 6]} />
            <meshStandardMaterial color="#d97706" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[2.5, 0.55, 0]} castShadow>
          <boxGeometry args={[0.16, 1.1, 0.16]} />
          <meshStandardMaterial color="#78350f" roughness={0.3} />
        </mesh>
      </group>

      {/* Right Gallery Railing */}
      <group position={[4.0, 0, 4.0]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[5.2, 0.08, 0.12]} />
          <meshStandardMaterial color="#78350f" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[5.2, 0.06, 0.08]} />
          <meshStandardMaterial color="#451a03" />
        </mesh>
        {[-2.0, -1.4, -0.8, -0.2, 0.4, 1.0, 1.6, 2.2].map((x) => (
          <mesh key={`r-spindle-${x}`} position={[x, 0.52, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.7, 6]} />
            <meshStandardMaterial color="#d97706" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[-2.5, 0.55, 0]} castShadow>
          <boxGeometry args={[0.16, 1.1, 0.16]} />
          <meshStandardMaterial color="#78350f" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
