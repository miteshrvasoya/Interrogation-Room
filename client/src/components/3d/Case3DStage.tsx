'use client';

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import InterrogationRoomScene from './InterrogationRoomScene';
import CourtroomScene from './CourtroomScene';
import CrimeScene from './CrimeScene';
import EvidenceBoard3D from './EvidenceBoard3D';
import StylizedAvatar from './StylizedAvatar';
import CinematicDirector from './CinematicDirector';
import SpectatorFloatingFX from './SpectatorFloatingFX';
import { sounds } from '@/lib/audio';
import { getFirstPersonDialogue } from '../ui/LiveDialogueOverlay';
import ForensicInspectionModal, { ForensicInspectionItem } from '../ui/ForensicInspectionModal';

interface Case3DStageProps {
  phase: string;
  subPhase?: string | null;
  round: number;
  latestEvent?: any;
  characters: any[];
  discoveredEvidence: any[];
  activeSeats: any[];
  reactions: any[];
  freeLook: boolean;
  manualSetting?: 'auto' | 'interrogation' | 'courtroom' | 'crime_scene' | 'evidence_board';
  hideSpeech?: boolean;
  caseTitle?: string;
  casePremise?: string;
}

export default function Case3DStage({
  phase,
  subPhase,
  round,
  latestEvent,
  characters,
  discoveredEvidence,
  activeSeats,
  reactions,
  freeLook,
  manualSetting = 'auto',
  hideSpeech = false,
  caseTitle,
  casePremise
}: Case3DStageProps) {
  // Determine current 3D setting
  const getSetting = (): 'interrogation' | 'courtroom' | 'crime_scene' | 'evidence_board' => {
    if (manualSetting !== 'auto') return manualSetting as any;
    if (['briefing', 'investigation'].includes(phase)) return 'crime_scene';
    if (phase === 'interrogation') return 'interrogation';
    return 'courtroom'; // charging, trial, verdict, reveal
  };

  const setting = getSetting();

  // Selected item for high-fidelity Forensic Inspection Modal (rendered outside Canvas)
  const [inspectingItem, setInspectingItem] = useState<ForensicInspectionItem | null>(null);

  // Active speaker & dramatic moments detection (only during active simulation steps, not completed/reveal)
  const isDramaticMoment = Boolean(
    phase !== 'reveal' &&
    (latestEvent?.contradiction_exposed ||
    latestEvent?.action === 'confess')
  );

  const activeSpeakerId = latestEvent?.characterId || latestEvent?.agentId || latestEvent?.agentName;
  const activeSpeakerRole = latestEvent?.role;
  const isSpeaking = Boolean(
    latestEvent?.action === 'say' ||
    latestEvent?.action === 'ask_question' ||
    latestEvent?.action === 'answer_question' ||
    latestEvent?.action === 'give_argument' ||
    latestEvent?.action === 'confess' ||
    latestEvent?.action === 'deliver_verdict' ||
    latestEvent?.action === 'object' ||
    latestEvent?.action === 'request_warrant' ||
    latestEvent?.action === 'grant_warrant'
  );
  // Format speech in First Person POV for direct in-character speech bubble
  const speechText = getFirstPersonDialogue(latestEvent, characters);

  // Trigger procedural audio on key events
  useEffect(() => {
    if (!latestEvent || hideSpeech) return;
    if (latestEvent.action === 'deliver_verdict' || latestEvent.action === 'grant_warrant') {
      sounds.playGavel();
    } else if (latestEvent.action === 'object') {
      sounds.playObjection();
    } else if (latestEvent.contradiction_exposed) {
      sounds.playContradiction();
    } else if (latestEvent.action === 'search_location' && latestEvent.discovered_evidence?.length > 0) {
      sounds.playPinEvidence();
    } else if (isSpeaking) {
      sounds.playTypewriter();
    }
  }, [latestEvent?.id, hideSpeech]);

  // Gallery benches placed neatly behind spectator camera
  const getGalleryPosition = (idx: number, z: number = 4.2): [number, number, number] => {
    const isRight = idx % 2 === 1;
    const offset = Math.floor(idx / 2) * 1.1;
    const x = isRight ? 3.5 + offset : -3.5 - offset;
    return [x, 0, z];
  };

  // Position avatars based on the active 3D setting
  const getAvatarPosition = (role: string, charId?: string, index: number = 0): [number, number, number] => {
    if (setting === 'interrogation') {
      if (role === 'detective') return [0, 0, -1.1];
      if (role === 'suspect') return [0, 0, 1.1];
      if (role === 'police_officer') return [-2.5, 0, 0];
      if (role === 'judge') return [2.5, 0, -1.5];
      if (role === 'defense_lawyer') return [-1.4, 0, 1.1];
      // Other observers stand neatly along the side observation walls
      const isRight = index % 2 === 1;
      const row = Math.floor(index / 2) * 1.2;
      return [isRight ? 4.2 : -4.2, 0, -2.5 + row];
    }

    if (setting === 'courtroom') {
      if (role === 'judge') return [0, 0.8, -4.8];
      if (role === 'prosecutor') return [1.8, 0, -0.9];
      if (role === 'defense_lawyer') return [-1.8, 0, -0.9];
      if (role === 'suspect' || role === 'witness') return [-2.6, 0.7, -3.2]; // In witness box
      if (role === 'detective') return [2.4, 0, 0.4];
      if (role === 'police_officer') return [-2.4, 0, 0.4];
      return getGalleryPosition(index, 4.2);
    }

    // Crime Scene
    if (role === 'detective') return [0, 0, -0.4];
    if (role === 'police_officer') return [2.5, 0, -2.2];
    if (role === 'forensic_analyst') return [-1.8, 0, -1.8];
    if (role === 'suspect') return [-2.8, 0, 0.6];
    const isRight = index % 2 === 1;
    const offset = Math.floor(index / 2) * 1.2;
    return [isRight ? 3.5 : -3.5, 0, -3.0 + offset];
  };

  // Rotation angles so characters face the action
  const getAvatarRotation = (role: string): [number, number, number] => {
    if (setting === 'interrogation') {
      if (role === 'detective') return [0, 0, 0]; // Facing suspect
      if (role === 'suspect') return [0, Math.PI, 0]; // Facing detective
      if (role === 'defense_lawyer') return [0, Math.PI, 0];
      if (role === 'police_officer') return [0, Math.PI / 2, 0];
      return [0, 0, 0];
    }

    if (setting === 'courtroom') {
      if (role === 'judge') return [0, 0, 0];
      if (role === 'prosecutor') return [0, -Math.PI * 0.25, 0];
      if (role === 'defense_lawyer') return [0, Math.PI * 0.25, 0];
      if (role === 'suspect' || role === 'witness') return [0, Math.PI * 0.35, 0];
      if (role === 'detective') return [0, -Math.PI * 0.6, 0];
      if (role === 'police_officer') return [0, Math.PI * 0.6, 0];
      return [0, 0, 0];
    }

    return [0, 0, 0];
  };

  return (
    <div className="absolute inset-0 w-full h-full select-none">
      <Canvas
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        camera={{ position: [0, 1.6, 2.4], fov: 46 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#08090e']} />
        <fog attach="fog" args={['#08090e', 14, 38]} />

        {/* Global baseline illumination */}
        <ambientLight intensity={1.1} color="#f8fafc" />
        <directionalLight position={[4, 8, 6]} intensity={1.8} color="#fffbeb" />

        {/* Cinematic Auto Director or Free Look OrbitControls */}
        <CinematicDirector
          freeLook={freeLook}
          activeSpeakerId={activeSpeakerId}
          activeSpeakerRole={activeSpeakerRole}
          isDramaticMoment={isDramaticMoment}
          currentSetting={setting}
        />

        {/* 3D Setting Environment & Avatars wrapped in Suspense for real 3D GLTF models */}
        <React.Suspense fallback={null}>
          {setting === 'interrogation' && <InterrogationRoomScene />}
          {setting === 'courtroom' && <CourtroomScene />}
          {setting === 'crime_scene' && <CrimeScene />}
          {setting === 'evidence_board' && (
            <EvidenceBoard3D
              evidenceList={discoveredEvidence}
              characters={characters}
              activeSeats={activeSeats}
              latestEvent={latestEvent}
              caseTitle={caseTitle}
              casePremise={casePremise}
              onInspect={(kind, data) => setInspectingItem({ kind, data })}
            />
          )}

          {/* Floating Spectator Reactions */}
          <SpectatorFloatingFX reactions={reactions} />

          {/* Real 3D Characters and Avatars positioned in scene */}
          {setting !== 'evidence_board' &&
            activeSeats.map((seat, idx) => {
              const isThisSpeaker =
                !hideSpeech &&
                isSpeaking &&
                (seat.agentId === activeSpeakerId ||
                  seat.characterId === activeSpeakerId ||
                  (activeSpeakerRole && seat.role === activeSpeakerRole && seat.role !== 'witness' && seat.role !== 'suspect') ||
                  (latestEvent?.agentName && seat.displayName?.toLowerCase() === latestEvent.agentName.toLowerCase()));
              const isAccused = seat.role === 'suspect' && setting === 'interrogation';
              const isGavelStriking = seat.role === 'judge' && (latestEvent?.action === 'deliver_verdict' || latestEvent?.action === 'grant_warrant');
              const isBrokenDown = seat.role === 'suspect' && latestEvent?.action === 'confess';

              return (
                <StylizedAvatar
                  key={seat.seatKey || seat.agentId}
                  id={seat.agentId}
                  name={seat.displayName}
                  role={seat.role}
                  position={getAvatarPosition(seat.role, seat.characterId, idx)}
                  rotation={getAvatarRotation(seat.role)}
                  isSpeaking={isThisSpeaker}
                  speechText={isThisSpeaker ? speechText : ''}
                  isAccused={isAccused}
                  isGavelStriking={isGavelStriking}
                  isBrokenDown={isBrokenDown}
                  highlight={isThisSpeaker}
                />
              );
            })}
        </React.Suspense>
      </Canvas>

      {/* Forensic Inspection Modal (Standard React DOM outside Canvas) */}
      {inspectingItem && (
        <ForensicInspectionModal
          item={inspectingItem}
          onClose={() => setInspectingItem(null)}
          caseTitle={caseTitle}
          casePremise={casePremise}
        />
      )}
    </div>
  );
}
