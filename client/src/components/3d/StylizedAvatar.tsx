'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

// Preload character models for instant rendering
if (typeof window !== 'undefined') {
  useGLTF.preload('/models/soldier.glb');
  useGLTF.preload('/models/xbot.glb');
}

interface AvatarProps {
  id: string;
  name: string;
  role: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  isSpeaking?: boolean;
  speechText?: string;
  isAccused?: boolean;
  isGavelStriking?: boolean;
  isBrokenDown?: boolean;
  highlight?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// REAL 3D RIGGED CHARACTER MODEL LOADER WITH CLONED SKELETON & ANIMATIONS
// ─────────────────────────────────────────────────────────────────────────────

function InnerRealCharacterModel({
  modelPath,
  scale,
  role,
  isSpeaking = false
}: {
  modelPath: string;
  scale: number;
  role: string;
  isSpeaking?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF(modelPath);

  // Clone scene with unique independent skeleton binding per avatar
  const clonedScene = useMemo(() => {
    return SkeletonUtils.clone(gltf.scene);
  }, [gltf.scene]);

  // Hook animations to this avatar instance's group
  const { actions } = useAnimations(gltf.animations, groupRef);

  useEffect(() => {
    if (!actions) return;

    // Pick idle animation (Soldier has 'Idle', Xbot has 'idle')
    const idleAction = actions['Idle'] || actions['idle'] || Object.values(actions)[0];
    const talkAction = actions['agree'] || actions['headShake'];

    if (isSpeaking && talkAction) {
      talkAction.reset().fadeIn(0.2).play();
      return () => {
        talkAction.fadeOut(0.2);
      };
    } else if (idleAction) {
      idleAction.reset().fadeIn(0.3).play();
    }
  }, [actions, isSpeaking]);

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={scale} castShadow receiveShadow />

      {/* Classic Detective Fedora Hat accessory */}
      {role === 'detective' && (
        <group position={[0, 1.82, 0.02]} scale={1.1}>
          <mesh castShadow>
            <cylinderGeometry args={[0.28, 0.3, 0.035, 16]} />
            <meshStandardMaterial color="#451a03" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.2, 0.13, 16]} />
            <meshStandardMaterial color="#451a03" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.185, 0.205, 0.035, 16]} />
            <meshStandardMaterial color="#1e1815" />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCEDURAL CHARACTER FALLBACK
// ─────────────────────────────────────────────────────────────────────────────

function ProceduralCharacterMesh({ colors, role }: { colors: any; role: string }) {
  return (
    <group>
      {/* Torso & Coat */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.8, 12]} />
        <meshStandardMaterial color={colors.coat} roughness={0.7} />
      </mesh>

      {/* Collar & Tie */}
      <mesh position={[0, 1.05, 0.12]}>
        <boxGeometry args={[0.16, 0.2, 0.05]} />
        <meshStandardMaterial color={colors.trim} roughness={0.5} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={colors.skin} roughness={0.6} />
      </mesh>

      {/* Arms */}
      <group position={[-0.32, 0.95, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.5, 8]} />
          <meshStandardMaterial color={colors.coat} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.52, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={colors.skin} roughness={0.5} />
        </mesh>
      </group>
      <group position={[0.32, 0.95, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.5, 8]} />
          <meshStandardMaterial color={colors.coat} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.52, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={colors.skin} roughness={0.5} />
        </mesh>
      </group>

      {/* Legs / Robes */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.26, 0.3, 0.45, 12]} />
        <meshStandardMaterial color={colors.coat} roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN AVATAR COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function StylizedAvatar({
  id,
  name,
  role,
  position,
  rotation = [0, 0, 0],
  isSpeaking = false,
  speechText = '',
  isAccused = false,
  isGavelStriking = false,
  isBrokenDown = false,
  highlight = false
}: AvatarProps) {
  const groupRef = useRef<THREE.Group>(null);

  const isAiAgent = Boolean(
    name?.toLowerCase().includes('ai') ||
    name?.toLowerCase().includes('bot') ||
    name?.toLowerCase().includes('llm') ||
    name?.toLowerCase().includes('agent')
  );

  // Role color palettes for procedural accessories and UI badges
  const getRoleColors = (r: string) => {
    switch (r) {
      case 'judge':
        return { coat: '#111317', trim: '#f8fafc', skin: '#e2b397', accent: '#d97706' };
      case 'detective':
        return { coat: '#785437', trim: '#3b2518', skin: '#f1cbb0', accent: '#f59e0b' };
      case 'police_officer':
        return { coat: '#1e3a5f', trim: '#0f172a', skin: '#eec2a0', accent: '#38bdf8' };
      case 'forensic_analyst':
        return { coat: '#f8fafc', trim: '#38bdf8', skin: '#f4cdb2', accent: '#0284c7' };
      case 'prosecutor':
        return { coat: '#1e293b', trim: '#b91c1c', skin: '#efc19f', accent: '#ef4444' };
      case 'defense_lawyer':
        return { coat: '#334155', trim: '#0284c7', skin: '#f0c7a8', accent: '#06b6d4' };
      case 'suspect':
        return { coat: '#475569', trim: '#64748b', skin: '#ebbea0', accent: '#f43f5e' };
      case 'witness':
      default:
        return { coat: '#57534e', trim: '#a8a29e', skin: '#ecc5a6', accent: '#10b981' };
    }
  };

  const colors = getRoleColors(role);

  // Determine realistic 3D model path and scale with reliable animations
  let modelPath = '/models/soldier.glb';
  let modelScale = 0.94;

  switch (role) {
    case 'police_officer':
      modelPath = '/models/soldier.glb';
      modelScale = 0.94;
      break;
    case 'detective':
      modelPath = '/models/soldier.glb';
      modelScale = 0.94;
      break;
    case 'judge':
      modelPath = '/models/soldier.glb';
      modelScale = 0.94;
      break;
    case 'prosecutor':
      modelPath = '/models/soldier.glb';
      modelScale = 0.94;
      break;
    case 'defense_lawyer':
      modelPath = '/models/xbot.glb';
      modelScale = 0.94;
      break;
    case 'witness':
      modelPath = '/models/soldier.glb';
      modelScale = 0.94;
      break;
    case 'suspect':
      modelPath = '/models/xbot.glb';
      modelScale = 0.94;
      break;
    case 'court_clerk':
    default:
      modelPath = isAiAgent ? '/models/xbot.glb' : '/models/soldier.glb';
      modelScale = 0.94;
      break;
  }

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Subtle idle natural breathing
    groupRef.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.02;

    // Subtle rotation shift when actively speaking
    if (isSpeaking) {
      groupRef.current.rotation.y = rotation[1] + Math.sin(t * 4) * 0.04;
    } else {
      groupRef.current.rotation.y = rotation[1];
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Spotlight on accused suspect */}
      {isAccused && (
        <spotLight
          position={[0, 4.5, 0]}
          target={groupRef.current || undefined}
          intensity={4.5}
          angle={0.45}
          penumbra={0.6}
          color="#fef08a"
        />
      )}

      {/* Real 3D Rigged Human / AI Character Model via Suspense */}
      <React.Suspense fallback={<ProceduralCharacterMesh colors={colors} role={role} />}>
        <InnerRealCharacterModel
          modelPath={modelPath}
          scale={modelScale}
          role={role}
          isSpeaking={isSpeaking}
        />
      </React.Suspense>

      {/* Ground Contact Shadow Ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.38, 24]} />
        <meshBasicMaterial color="#000000" opacity={0.35} transparent />
      </mesh>

      {/* Highlight Aura for Active Speaker */}
      {highlight && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.62, 32]} />
          <meshBasicMaterial color={colors.accent} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* In-Scene 3D First Person Speech Bubble (Billboarding) */}
      {isSpeaking && speechText && (
        <Html position={[0, 2.15, 0]} center zIndexRange={[10, 0]}>
          <div className="pointer-events-none select-none w-64 animate-float">
            <div className="glass-panel px-3.5 py-2.5 rounded-xl shadow-2xl border border-amber-500/50 bg-noir-950/95 text-center relative backdrop-blur-md">
              <div className="text-[10px] font-bold tracking-wider uppercase text-amber-400 mb-1 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span>{name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-noir-800 text-slate-300 font-mono">({role})</span>
              </div>
              <div className="text-xs text-slate-100 font-medium leading-relaxed italic">
                "{speechText.slice(0, 140)}{speechText.length > 140 ? '...' : ''}"
              </div>
              {/* Bubble Tail */}
              <div className="w-2.5 h-2.5 bg-noir-950 rotate-45 border-r border-b border-amber-500/50 absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
            </div>
          </div>
        </Html>
      )}

      {/* Floating Nameplate Pill */}
      {!isSpeaking && (
        <Html position={[0, 1.95, 0]} center zIndexRange={[10, 0]}>
          <div className="pointer-events-none select-none whitespace-nowrap bg-noir-950/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/80 shadow-lg text-center flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.accent }} />
            <span className="text-[11px] font-semibold text-slate-200 tracking-wide font-sans">
              {name}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
