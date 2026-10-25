'use client';

import React from 'react';
import { useGLTF, Clone } from '@react-three/drei';
import * as THREE from 'three';

// Preload models for instantaneous rendering
if (typeof window !== 'undefined') {
  useGLTF.preload('/models/courtroom_chair.glb');
  useGLTF.preload('/models/counsel_chair.glb');
  useGLTF.preload('/models/court_lamp.glb');
  useGLTF.preload('/models/coffee_mug.glb');
  useGLTF.preload('/models/antique_camera.glb');
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. REAL 3D ASSETS LOADED VIA GLTF WITH REACT SUSPENSE FALLBACKS
// ─────────────────────────────────────────────────────────────────────────────

function InnerJudicialChair({ scale }: { scale: number }) {
  const gltf = useGLTF('/models/courtroom_chair.glb');
  return <Clone object={gltf.scene} scale={scale} castShadow receiveShadow />;
}

export function CourtroomJudicialChair({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1.35
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      <React.Suspense
        fallback={
          <group>
            <mesh position={[0, 0.45, 0]} castShadow>
              <boxGeometry args={[0.7, 0.12, 0.65]} />
              <meshStandardMaterial color="#3b1d0c" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.95, -0.28]} castShadow>
              <boxGeometry args={[0.7, 1.0, 0.12]} />
              <meshStandardMaterial color="#831843" roughness={0.5} />
            </mesh>
          </group>
        }
      >
        <InnerJudicialChair scale={scale} />
      </React.Suspense>
    </group>
  );
}

function InnerCounselChair({ scale }: { scale: number }) {
  const gltf = useGLTF('/models/counsel_chair.glb');
  return <Clone object={gltf.scene} scale={scale} castShadow receiveShadow />;
}

export function CounselArmchair({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1.25
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      <React.Suspense
        fallback={
          <group>
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[0.6, 0.1, 0.55]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.8, -0.24]} castShadow>
              <boxGeometry args={[0.6, 0.7, 0.08]} />
              <meshStandardMaterial color="#0f172a" roughness={0.5} />
            </mesh>
          </group>
        }
      >
        <InnerCounselChair scale={scale} />
      </React.Suspense>
    </group>
  );
}

function InnerCourtLamp({ scale, lightColor }: { scale: number; lightColor: string }) {
  const gltf = useGLTF('/models/court_lamp.glb');
  return (
    <group>
      <Clone object={gltf.scene} scale={scale} castShadow />
      <pointLight position={[0, 0.28, 0]} intensity={1.8} distance={3.2} color={lightColor} />
    </group>
  );
}

export function CourtDeskLamp({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 0.45,
  lightColor = '#fef08a'
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  lightColor?: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      <React.Suspense
        fallback={
          <group>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.02, 0.04, 0.24, 8]} />
              <meshStandardMaterial color="#ca8a04" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.24, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.05, 0.05, 0.2, 12]} />
              <meshStandardMaterial color="#15803d" roughness={0.2} />
            </mesh>
            <pointLight position={[0, 0.2, 0]} intensity={1.5} distance={2.5} color={lightColor} />
          </group>
        }
      >
        <InnerCourtLamp scale={scale} lightColor={lightColor} />
      </React.Suspense>
    </group>
  );
}

function InnerCoffeeMug({ scale }: { scale: number }) {
  const gltf = useGLTF('/models/coffee_mug.glb');
  return <Clone object={gltf.scene} scale={scale} castShadow />;
}

export function CourtCoffeeMug({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 0.035
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      <React.Suspense
        fallback={
          <mesh position={[0, 0.06, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.035, 0.1, 12]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} />
          </mesh>
        }
      >
        <InnerCoffeeMug scale={scale} />
      </React.Suspense>
    </group>
  );
}

function InnerEvidenceCamera({ scale }: { scale: number }) {
  const gltf = useGLTF('/models/antique_camera.glb');
  return <Clone object={gltf.scene} scale={scale} castShadow receiveShadow />;
}

export function EvidenceCameraExhibit({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 0.05
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      <React.Suspense
        fallback={
          <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[0.25, 0.18, 0.15]} />
            <meshStandardMaterial color="#451a03" roughness={0.6} />
          </mesh>
        }
      >
        <InnerEvidenceCamera scale={scale} />
      </React.Suspense>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PHOTOREALISTIC PROCEDURAL COURTROOM PROPS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Realistic Handcrafted Judicial Gavel and Turned Sounding Block
 */
export function RealisticJudicialGavel({
  position = [0.75, 1.95, -3.95],
  rotation = [0, 0.2, 0]
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Sounding Block (Octagonal polished hardwood with felt base) */}
      <mesh position={[0, -0.015, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.04, 8]} />
        <meshStandardMaterial color="#3b1d0c" roughness={0.25} metalness={0.1} />
      </mesh>
      {/* Sounding Block Brass Inset Ring */}
      <mesh position={[0, 0.006, 0]}>
        <ringGeometry args={[0.11, 0.14, 32]} />
        <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Gavel Hammer laying angled next to/on block */}
      <group position={[0.04, 0.04, 0.06]} rotation={[0, 0.4, 0.08]}>
        {/* Turned Hardwood Handle */}
        <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.016, 0.32, 16]} />
          <meshStandardMaterial color="#451a03" roughness={0.2} metalness={0.05} />
        </mesh>
        {/* Handle Knob */}
        <mesh position={[0, 0, 0.31]} castShadow>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Barrel Mallet Head */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.038, 0.038, 0.16, 16]} />
          <meshStandardMaterial color="#3b1d0c" roughness={0.25} metalness={0.1} />
        </mesh>
        {/* Central Brass Inscription Band */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.039, 0.039, 0.035, 16]} />
          <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Striking Faces (Left & Right Brass Caps) */}
        <mesh position={[-0.082, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.036, 0.036, 0.008, 16]} />
          <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0.082, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.036, 0.036, 0.008, 16]} />
          <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Gooseneck Courtroom Microphone with wind foam filter
 */
export function CourtMicrophone({
  position = [0, 0, 0],
  rotation = [0, 0, 0]
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Heavy Steel Base */}
      <mesh position={[0, 0.015, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.03, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Flexible Gooseneck Stem */}
      <mesh position={[0, 0.16, 0.03]} rotation={[-0.25, 0, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.28, 12]} />
        <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Microphone Capsule Mesh */}
      <mesh position={[0, 0.29, 0.06]} rotation={[-0.35, 0, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.014, 0.06, 12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      {/* LED Power Ring (Active state) */}
      <mesh position={[0, 0.32, 0.07]}>
        <ringGeometry args={[0.012, 0.015, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

/**
 * Stack of Leather-Bound Legal Code Books with Gold Foil Lettering
 */
export function LegalCodeBooks({
  position = [0, 0, 0],
  rotation = [0, 0, 0]
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Volume 1: Criminal Penal Code (Dark Burgundy) */}
      <group position={[0, 0.03, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.05, 0.34]} />
          <meshStandardMaterial color="#450a0a" roughness={0.4} />
        </mesh>
        {/* Paper Page Block */}
        <mesh position={[0.01, 0, 0]}>
          <boxGeometry args={[0.24, 0.045, 0.32]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.8} />
        </mesh>
        {/* Gold Spine Trim */}
        <mesh position={[-0.125, 0, 0]}>
          <boxGeometry args={[0.012, 0.051, 0.3]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* Volume 2: Rules of Evidence (Deep Navy) */}
      <group position={[0.02, 0.08, -0.01]} rotation={[0, 0.08, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.25, 0.045, 0.32]} />
          <meshStandardMaterial color="#0c4a6e" roughness={0.4} />
        </mesh>
        {/* Gold Spine Trim */}
        <mesh position={[-0.12, 0, 0]}>
          <boxGeometry args={[0.012, 0.046, 0.28]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Manila Case Dossier with Official Court Stamp
 */
export function ManilaCaseFolder({
  position = [0, 0, 0],
  rotation = [0, 0, 0]
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Folder Tab */}
      <mesh position={[0, 0.005, 0]} receiveShadow>
        <boxGeometry args={[0.3, 0.01, 0.38]} />
        <meshStandardMaterial color="#d97706" roughness={0.7} />
      </mesh>
      {/* Paper Pages peaking out */}
      <mesh position={[0.01, 0.012, 0]}>
        <boxGeometry args={[0.27, 0.004, 0.35]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>
      {/* Red "CONFIDENTIAL" Stamp */}
      <mesh position={[0.04, 0.016, 0.08]}>
        <planeGeometry args={[0.1, 0.03]} />
        <meshBasicMaterial color="#b91c1c" />
      </mesh>
    </group>
  );
}
