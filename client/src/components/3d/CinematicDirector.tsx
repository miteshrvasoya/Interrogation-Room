'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface CinematicDirectorProps {
  freeLook: boolean;
  activeSpeakerId?: string;
  activeSpeakerRole?: string;
  isDramaticMoment?: boolean; // Contradiction, confession, or verdict
  currentSetting: 'interrogation' | 'courtroom' | 'crime_scene' | 'evidence_board';
}

export default function CinematicDirector({
  freeLook,
  activeSpeakerId,
  activeSpeakerRole,
  isDramaticMoment = false,
  currentSetting
}: CinematicDirectorProps) {
  const { camera } = useThree();
  const targetCamPos = useRef(new THREE.Vector3(0, 1.35, 4.0));
  const targetLookAt = useRef(new THREE.Vector3(0, 1.35, -2.5));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.35, -2.5));

  // Determine ideal camera shot based on setting and active speaker
  useEffect(() => {
    if (freeLook) return;

    // Evidence Board view takes absolute priority over speech/dramatic shifts
    if (currentSetting === 'evidence_board') {
      targetCamPos.current.set(0, 2.65, 0.8);
      targetLookAt.current.set(0, 2.65, -5.8);
      return;
    }

    if (isDramaticMoment) {
      if (currentSetting === 'courtroom') {
        targetCamPos.current.set(0, 1.45, -2.2);
        targetLookAt.current.set(0, 1.8, -4.8);
      } else {
        targetCamPos.current.set(0.4, 1.3, -0.2);
        targetLookAt.current.set(0, 1.2, 1.1);
      }
      return;
    }

    if (currentSetting === 'courtroom') {
      if (activeSpeakerRole === 'judge') {
        // Close-up on Judge bench
        targetCamPos.current.set(0, 1.45, -2.2);
        targetLookAt.current.set(0, 1.8, -4.8);
      } else if (activeSpeakerRole === 'prosecutor') {
        targetCamPos.current.set(0.6, 1.4, 0.4);
        targetLookAt.current.set(1.8, 1.35, -0.9);
      } else if (activeSpeakerRole === 'defense_lawyer') {
        targetCamPos.current.set(-0.6, 1.4, 0.4);
        targetLookAt.current.set(-1.8, 1.35, -0.9);
      } else if (activeSpeakerRole === 'suspect' || activeSpeakerRole === 'witness') {
        targetCamPos.current.set(-1.4, 1.4, -1.8);
        targetLookAt.current.set(-2.6, 1.5, -3.2);
      } else {
        // Wide eye-level cinematic shot looking down the courtroom
        targetCamPos.current.set(0, 1.6, 2.4);
        targetLookAt.current.set(0, 1.45, -3.5);
      }
      return;
    }

    if (currentSetting === 'interrogation') {
      if (activeSpeakerRole === 'suspect') {
        // Looking across table at suspect
        targetCamPos.current.set(0.4, 1.3, -0.4);
        targetLookAt.current.set(0, 1.2, 1.1);
      } else if (activeSpeakerRole === 'detective') {
        // Looking across table at detective
        targetCamPos.current.set(-0.4, 1.3, 0.4);
        targetLookAt.current.set(0, 1.2, -1.1);
      } else {
        // Eye-level classic noir two-shot
        targetCamPos.current.set(2.8, 1.4, 1.8);
        targetLookAt.current.set(0, 1.1, 0);
      }
      return;
    }

    if (currentSetting === 'crime_scene') {
      if (activeSpeakerRole === 'detective') {
        targetCamPos.current.set(-0.8, 1.4, 0.8);
        targetLookAt.current.set(0, 1.2, -0.4);
      } else {
        targetCamPos.current.set(0, 1.6, 3.2);
        targetLookAt.current.set(0, 1.1, -1.5);
      }
      return;
    }

    // Default establishing shot
    targetCamPos.current.set(0, 1.6, 2.4);
    targetLookAt.current.set(0, 1.45, -3.5);
  }, [freeLook, activeSpeakerId, activeSpeakerRole, isDramaticMoment, currentSetting]);

  useFrame((state, delta) => {
    if (freeLook) return;

    // Smooth camera position interpolation
    camera.position.lerp(targetCamPos.current, delta * 3.5);

    // Smooth lookAt target interpolation
    currentLookAt.current.lerp(targetLookAt.current, delta * 4);
    camera.lookAt(currentLookAt.current);
  });

  return (
    <>
      {freeLook && (
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 + 0.1}
          minDistance={1.2}
          maxDistance={14}
          target={currentSetting === 'evidence_board' ? [0, 2.65, -5.8] : [0, 1.2, 0]}
        />
      )}
    </>
  );
}
