'use client';

import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { sounds } from '@/lib/audio';
import {
  Shield,
  FileText,
  Key,
  FlaskConical,
  Clock,
  User,
  Scissors,
  Fingerprint,
  ChevronRight,
  AlertOctagon
} from 'lucide-react';

export interface EvidenceItem {
  id: string;
  name: string;
  type: string;
  description: string;
  isAdmitted: boolean;
  forensicResult?: { test_type: string; result: string } | null;
  points_to?: string[];
  significance?: string;
  supports_fact_ids?: string[];
}

export interface CharacterItem {
  id: string;
  name: string;
  age?: number;
  occupation?: string;
  role_in_case?: string;
  relationship_to_victim?: string;
  personality?: { traits?: string[]; speech_style?: string };
  claimed_alibi?: string;
  true_whereabouts?: string;
}

interface EvidenceBoardProps {
  evidenceList: EvidenceItem[];
  characters?: CharacterItem[];
  activeSeats?: any[];
  latestEvent?: any;
  caseTitle?: string;
  casePremise?: string;
  position?: [number, number, number];
  onInspect?: (kind: 'evidence' | 'suspect' | 'case_brief', data: any) => void;
}

export default function EvidenceBoard3D({
  evidenceList,
  characters = [],
  caseTitle = 'The Last Page',
  casePremise = 'A famous novelist is found dead behind a door locked from the inside.',
  position = [0, 2.65, -5.8],
  onInspect
}: EvidenceBoardProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Play audio pin on card selection and notify parent
  const handleSelect = (kind: 'evidence' | 'suspect' | 'case_brief', data: any) => {
    sounds.playPinEvidence();
    if (onInspect) {
      onInspect(kind, data);
    }
  };

  // Base suspects derived from characters or defaults for rich authentic board
  const suspectItems = useMemo(() => {
    const defaultSuspects: CharacterItem[] = [
      {
        id: 'CH-104',
        name: 'Nora Pike',
        age: 29,
        occupation: 'Research Assistant & Co-Writer',
        role_in_case: 'suspect',
        relationship_to_victim: 'Assistant & Ghostwriter',
        claimed_alibi: 'Caught 21:00 ferry, never returned.',
        personality: { traits: ['sharp-tongued', 'guarded', 'calculating'] }
      },
      {
        id: 'CH-103',
        name: 'Daniel Cruz',
        age: 47,
        occupation: 'Publisher',
        role_in_case: 'suspect',
        relationship_to_victim: 'Publisher & Creditor',
        claimed_alibi: 'Left at 21:15, checked into Heron Inn at 21:40.',
        personality: { traits: ['smooth', 'anxious', 'financial pressure'] }
      },
      {
        id: 'CH-105',
        name: 'Tomas Reed',
        age: 62,
        occupation: 'Groundskeeper',
        role_in_case: 'suspect',
        relationship_to_victim: 'Groundskeeper (30 yrs)',
        claimed_alibi: 'In potting shed all afternoon, then home.',
        personality: { traits: ['gruff', 'secretive', 'poaches fish'] }
      },
      {
        id: 'CH-102',
        name: 'Iris Vell',
        age: 54,
        occupation: 'Wife',
        role_in_case: 'suspect',
        relationship_to_victim: 'Spouse',
        claimed_alibi: 'Sunroom on continuous phone call (21:02-22:14).',
        personality: { traits: ['dignified', 'estranged', 'divorce talks'] }
      }
    ];

    if (characters && characters.length > 0) {
      const suspectsOnly = characters.filter(
        c => c.role_in_case === 'suspect' || c.role_in_case === 'witness'
      );
      if (suspectsOnly.length > 0) return suspectsOnly.slice(0, 4);
    }
    return defaultSuspects;
  }, [characters]);

  // Clean, non-overlapping coordinates for suspects (Left Column, x: -2.38)
  const suspectCoords = useMemo(() => {
    return [
      { x: -2.38, y: 1.05, rotZ: 0.02 },
      { x: -2.38, y: 0.38, rotZ: -0.015 },
      { x: -2.38, y: -0.28, rotZ: 0.025 },
      { x: -2.38, y: -0.95, rotZ: -0.02 }
    ];
  }, []);

  // Enriched Exhibits list combining passed evidenceList + canonical case exhibits
  const exhibitsList = useMemo(() => {
    const canonicalExhibits: EvidenceItem[] = [
      {
        id: 'EV-103',
        name: 'Teacup & Foxglove Sediment',
        type: 'physical',
        description:
          'Half-finished Earl Grey tea beside Marcus’s keyboard. Green-brown sediment confirmed by chemical assay as lethal foxglove extract.',
        isAdmitted: true,
        forensicResult: {
          test_type: 'toxicology_spectrometry',
          result: 'Lethal concentration of Cardiac Glycoside (Digitoxin). Ingested 20-40 min prior to cardiac arrest.'
        },
        points_to: ['CH-104'],
        significance: 'Murder weapon delivery vehicle. Pours blame directly onto tea preparer.'
      },
      {
        id: 'EV-105',
        name: 'Staff-Door RFID Lock Log',
        type: 'digital',
        description:
          'Smart-lock server log for the staff corridor door. Fob N.PIKE logged at 20:49 (exit), 21:31 (entry), and 22:04 (exit).',
        isAdmitted: true,
        forensicResult: {
          test_type: 'digital_timestamp_hash',
          result: 'Cryptographic hash valid. Nora Pike re-entered house 21:31, delivered tea, exited 22:04.'
        },
        points_to: ['CH-104'],
        significance: 'Completely shatters Nora’s alibi of boarding the 21:00 passenger ferry.'
      },
      {
        id: 'EV-104',
        name: 'Unsent Termination Notice Draft',
        type: 'document',
        description:
          'Word processor draft saved at 20:12: "Nora - your contract ends this Friday; co-writer credit removed from The Salt Road."',
        isAdmitted: true,
        forensicResult: {
          test_type: 'forensic_data_recovery',
          result: 'File authored by Marcus Vell at 20:12. Motive established for premeditated retaliation.'
        },
        points_to: ['CH-104'],
        significance: 'Direct financial and professional motive for homicide.'
      },
      {
        id: 'EV-107',
        name: 'Stained Gloves & Pruning Shears',
        type: 'physical',
        description:
          'Found hidden in staff supply locker. Gardening gloves and pruning shears with sap residue matching greenhouse foxgloves.',
        isAdmitted: false,
        forensicResult: {
          test_type: 'botanical_chromatography',
          result: 'Plant sap on shears contains Digitalis purpurea (foxglove). Traces of Nora’s makeup on interior glove cuffs.'
        },
        points_to: ['CH-104'],
        significance: 'Direct physical link to harvesting toxin from the greenhouse.'
      }
    ];

    if (evidenceList && evidenceList.length > 0) {
      const map = new Map<string, EvidenceItem>();
      canonicalExhibits.forEach(e => map.set(e.id, e));
      evidenceList.forEach(e => {
        map.set(e.id, {
          ...map.get(e.id),
          ...e
        });
      });
      return Array.from(map.values()).slice(0, 4);
    }
    return canonicalExhibits;
  }, [evidenceList]);

  // Center Scene Key Clue
  const centerSceneClue: EvidenceItem = useMemo(() => {
    return {
      id: 'EV-101',
      name: 'Locked Study Door & Inside Key',
      type: 'physical',
      description:
        'Solid oak study door locked from inside with heavy deadbolt. Sole brass key recovered in victim’s front trouser pocket.',
      isAdmitted: true,
      forensicResult: {
        test_type: 'coroner_lock_analysis',
        result: 'No forced entry before 07:30 break-in. Marcus locked the door himself after poison ingested.'
      },
      significance: 'Confirms locked-room mechanism: victim was poisoned prior to locking himself inside.'
    };
  }, []);

  // Post-it sticky notes with detective insights
  const stickyNotes = useMemo(() => {
    return [
      {
        id: 'note-1',
        text: 'Tea brewed at 21:40 -> cardiac arrest 22:00-22:30. Ingestion window is exact!',
        pos: [0.8, 0.05, 0.07] as [number, number, number],
        rotZ: -0.05,
        color: '#fef08a'
      },
      {
        id: 'note-2',
        text: 'NORA FOB: 22:04 exit! Caught 22:10 ferry, NOT 21:00 ferry! ALIBI BROKEN.',
        pos: [2.1, 0.05, 0.07] as [number, number, number],
        rotZ: 0.04,
        color: '#fbcfe8'
      },
      {
        id: 'note-3',
        text: 'Foxglove grows ONLY in estate greenhouse bed. Cultivated intentionally!',
        pos: [2.1, -1.45, 0.07] as [number, number, number],
        rotZ: 0.03,
        color: '#bbf7d0'
      },
      {
        id: 'note-4',
        text: 'Key in pocket confirms: Marcus locked door HIMSELF after drinking tea.',
        pos: [-0.95, -1.45, 0.07] as [number, number, number],
        rotZ: -0.04,
        color: '#e0e7ff'
      }
    ];
  }, []);

  // 3D Realistic Sagging Red Yarn Strings (Conspiracy Web)
  const redYarnLines = useMemo(() => {
    const connections: { from: [number, number, number]; to: [number, number, number]; sag: number }[] = [
      // Incident Case Brief to Nora (Primary link)
      { from: [-0.15, 1.22, 0.08], to: [-2.38, 1.05, 0.08], sag: 0.18 },
      // Nora to Teacup (Murder weapon delivery)
      { from: [-2.38, 1.05, 0.08], to: [1.45, 0.72, 0.08], sag: 0.40 },
      // Nora to Lock Log (Shattered alibi)
      { from: [-2.38, 1.05, 0.08], to: [2.75, 0.72, 0.08], sag: 0.46 },
      // Nora to Termination Notice (Direct motive)
      { from: [-2.38, 1.05, 0.08], to: [1.45, -0.68, 0.08], sag: 0.44 },
      // Teacup to Gloves & Shears (Toxin source)
      { from: [1.45, 0.72, 0.08], to: [2.75, -0.68, 0.08], sag: 0.28 },
      // Incident to Scene Key
      { from: [-0.15, 1.22, 0.08], to: [-0.15, -0.22, 0.08], sag: 0.12 },
      // Incident Case Brief to Daniel Cruz (Ruled out lead)
      { from: [-0.15, 1.22, 0.08], to: [-2.38, 0.38, 0.08], sag: 0.22 },
      // Incident Case Brief to Tomas Reed (Witness lead)
      { from: [-0.15, 1.22, 0.08], to: [-2.38, -0.28, 0.08], sag: 0.28 }
    ];

    return connections.map(conn => {
      const p1 = new THREE.Vector3(...conn.from);
      const p2 = new THREE.Vector3(...conn.to);
      const midX = (conn.from[0] + conn.to[0]) / 2;
      const midY = (conn.from[1] + conn.to[1]) / 2 - conn.sag;
      const midZ = 0.12 + Math.random() * 0.02;
      const mid = new THREE.Vector3(midX, midY, midZ);

      const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
      return new THREE.TubeGeometry(curve, 28, 0.014, 7, false);
    });
  }, []);

  return (
    <group position={position}>
      {/* ======================================================== */}
      {/* DEDICATED ATMOSPHERIC TASK LIGHTING                       */}
      {/* ======================================================== */}
      <ambientLight intensity={1.6} color="#fef3c7" />
      <spotLight
        position={[-1.8, 2.3, 2.0]}
        target-position={[-1.8, 0, 0]}
        intensity={4.5}
        distance={10}
        angle={0.72}
        penumbra={0.7}
        color="#fff1d6"
        castShadow
      />
      <spotLight
        position={[1.8, 2.3, 2.0]}
        target-position={[1.8, 0, 0]}
        intensity={4.5}
        distance={10}
        angle={0.72}
        penumbra={0.7}
        color="#fff1d6"
        castShadow
      />
      <directionalLight position={[0, 4, 3]} intensity={2.2} color="#fed7aa" />

      {/* ======================================================== */}
      {/* HEAVY DARK MAHOGANY FRAME & BRASS REINFORCEMENTS          */}
      {/* ======================================================== */}
      {/* Outer Walnut Wood Frame (7.4m x 4.0m) */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.4, 4.0, 0.14]} />
        <meshStandardMaterial color="#24150b" roughness={0.65} metalness={0.1} />
      </mesh>

      {/* Textured Warm Cork Surface (7.0m x 3.6m) */}
      <mesh position={[0, 0, 0.05]} receiveShadow>
        <planeGeometry args={[7.0, 3.6]} />
        <meshStandardMaterial color="#9e663a" roughness={0.96} metalness={0.02} />
      </mesh>

      {/* Subtle Cork Texture Overlay Grid with Pin Marks */}
      <mesh position={[0, 0, 0.055]}>
        <planeGeometry args={[6.95, 3.55]} />
        <meshStandardMaterial
          color="#8b552b"
          roughness={0.98}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* 4 Aged Brass Corner Reinforcement Brackets */}
      {[
        [-3.4, 1.75],
        [3.4, 1.75],
        [-3.4, -1.75],
        [3.4, -1.75]
      ].map(([bx, by], idx) => (
        <group key={`corner-${idx}`} position={[bx, by, 0.08]}>
          <mesh>
            <boxGeometry args={[0.34, 0.34, 0.03]} />
            <meshStandardMaterial color="#d97706" metalness={0.88} roughness={0.22} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <cylinderGeometry args={[0.025, 0.025, 0.02, 8]} />
            <meshStandardMaterial color="#78350f" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Overhead Brass Gooseneck Task Lamp Fixtures */}
      {[-1.8, 1.8].map((lx, idx) => (
        <group key={`lamp-${idx}`} position={[lx, 1.95, 0.12]}>
          <mesh>
            <boxGeometry args={[0.2, 0.12, 0.08]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.14, 0.16]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.32, 12]} />
            <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.28, 0.32]} rotation={[-0.7, 0, 0]}>
            <coneGeometry args={[0.18, 0.22, 16, 1, true]} />
            <meshStandardMaterial color="#064e3b" roughness={0.3} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.22, 0.28]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>
      ))}

      {/* ======================================================== */}
      {/* VINTAGE BRUSHED METAL POLICE HEADER PLAQUE               */}
      {/* ======================================================== */}
      <group position={[0, 1.72, 0.09]}>
        <mesh castShadow>
          <boxGeometry args={[4.4, 0.26, 0.02]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.35} />
        </mesh>
        <Html position={[0, 0, 0.02]} transform distanceFactor={3.6} zIndexRange={[15, 0]}>
          <div className="flex items-center justify-center gap-2 w-[460px] py-1 select-none pointer-events-none text-center font-mono">
            <span className="text-amber-500 font-bold tracking-widest text-[11px] flex items-center gap-1.5 uppercase">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Metropolitan Homicide Division • Case Evidence Board
              <Shield className="w-3.5 h-3.5 text-amber-400" />
            </span>
          </div>
        </Html>
      </group>

      {/* ======================================================== */}
      {/* 3D CATENARY RED YARN STRINGS (INVESTIGATION NETWORK)      */}
      {/* ======================================================== */}
      {redYarnLines.map((geom, idx) => (
        <mesh key={`yarn-${idx}`} geometry={geom} castShadow>
          <meshStandardMaterial
            color="#ef4444"
            emissive="#991b1b"
            emissiveIntensity={0.55}
            roughness={0.4}
            metalness={0.05}
          />
        </mesh>
      ))}

      {/* ======================================================== */}
      {/* CENTERPIECE: CRIME SCENE INCIDENT DOSSIER FOLDER         */}
      {/* ======================================================== */}
      <group
        position={[-0.15, 0.75, hoveredId === 'case_brief' ? 0.12 : 0.08]}
        rotation={[0, 0, 0.015]}
        onClick={(e) => {
          e.stopPropagation();
          handleSelect('case_brief', { title: caseTitle, premise: casePremise });
        }}
        onPointerOver={() => setHoveredId('case_brief')}
        onPointerOut={() => setHoveredId(null)}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.75, 1.35, 0.025]} />
          <meshStandardMaterial
            color={hoveredId === 'case_brief' ? '#fef3c7' : '#f59e0b'}
            roughness={0.7}
          />
        </mesh>

        <mesh position={[0, 0.52, 0.018]} rotation={[0, 0, -0.05]}>
          <boxGeometry args={[1.78, 0.16, 0.01]} />
          <meshStandardMaterial color="#eab308" roughness={0.6} />
        </mesh>

        <group position={[0, 0.62, 0.03]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.035, 0.02, 0.05, 12]} />
            <meshStandardMaterial color="#dc2626" metalness={0.7} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.025, 0]}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>

        {/* Scaled precisely with distanceFactor to fit folder */}
        <Html position={[0, 0, 0.025]} transform distanceFactor={3.4} zIndexRange={[20, 0]}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleSelect('case_brief', { title: caseTitle, premise: casePremise });
            }}
            className="w-[215px] p-2 select-none cursor-pointer font-mono leading-tight hover:scale-[1.02] transition-transform duration-150"
          >
            <div className="text-[7.5px] font-black uppercase tracking-wider text-slate-900 bg-amber-400 px-1 py-0.5 rounded text-center mb-1 shadow-sm">
              ⚠ POLICE INCIDENT REPORT ⚠
            </div>

            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] font-bold text-slate-900 bg-amber-200/80 px-1 rounded">
                CASE-001
              </span>
              <span className="text-[7.5px] font-bold text-red-700 uppercase bg-red-100 px-1 rounded">
                HOMICIDE INQUEST
              </span>
            </div>

            <h3 className="text-[11.5px] font-black text-slate-950 uppercase tracking-tight line-clamp-1 mb-1">
              {caseTitle}
            </h3>

            <div className="space-y-0.5 text-[7.5px] text-slate-800 bg-amber-100/70 p-1.5 rounded border border-amber-300/60 mb-1">
              <div>
                <span className="font-bold text-slate-900">VICTIM:</span> Marcus Vell (58)
              </div>
              <div>
                <span className="font-bold text-slate-900">TIME:</span> 22:00 – 22:30
              </div>
              <div>
                <span className="font-bold text-slate-900">CAUSE:</span> Foxglove Poisoning
              </div>
              <div>
                <span className="font-bold text-slate-900">SCENE:</span> Study (Locked)
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5 border-t border-amber-400/50 text-[7px] font-bold text-red-800">
              <span className="flex items-center gap-0.5">
                <AlertOctagon className="w-2.5 h-2.5 text-red-600" />
                VERDICT: GUILTY
              </span>
              <span className="text-amber-800 flex items-center gap-0.5 underline">
                Inspect <ChevronRight className="w-2 h-2" />
              </span>
            </div>
          </div>
        </Html>
      </group>

      {/* ======================================================== */}
      {/* CENTER-BOTTOM: CRIME SCENE LOCKED KEY EXHIBIT            */}
      {/* ======================================================== */}
      <group
        position={[-0.15, -0.68, hoveredId === centerSceneClue.id ? 0.12 : 0.08]}
        rotation={[0, 0, -0.02]}
        onClick={(e) => {
          e.stopPropagation();
          handleSelect('evidence', centerSceneClue);
        }}
        onPointerOver={() => setHoveredId(centerSceneClue.id)}
        onPointerOut={() => setHoveredId(null)}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.32, 1.25, 0.02]} />
          <meshStandardMaterial
            color={hoveredId === centerSceneClue.id ? '#fffef0' : '#f8fafc'}
            roughness={0.82}
          />
        </mesh>

        <group position={[0, 0.54, 0.025]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.024, 0.014, 0.035, 10]} />
            <meshStandardMaterial color="#dc2626" metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.018, 0]}>
            <sphereGeometry args={[0.028, 10, 10]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>

        <Html position={[0, 0, 0.02]} transform distanceFactor={3.4} zIndexRange={[18, 0]}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleSelect('evidence', centerSceneClue);
            }}
            className="w-[165px] p-2 select-none cursor-pointer font-mono leading-tight hover:scale-[1.02] transition-transform duration-150"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[7px] font-black uppercase bg-amber-300 text-slate-900 px-1 py-0.2 rounded shadow-sm">
                KEY EXHIBIT
              </span>
              <span className="text-[7px] font-bold text-slate-600 bg-slate-200 px-1 py-0.2 rounded">
                {centerSceneClue.id}
              </span>
            </div>

            <div className="w-full h-14 bg-slate-900 rounded overflow-hidden relative mb-1 border border-slate-700/80 flex items-center justify-center">
              <div className="flex flex-col items-center text-amber-400">
                <Key className="w-6 h-6 drop-shadow" />
                <span className="text-[6px] font-bold text-amber-300 tracking-wider">
                  LOCKED STUDY KEY
                </span>
              </div>
            </div>

            <div className="text-[9.5px] font-black text-slate-900 truncate mb-0.5">
              {centerSceneClue.name}
            </div>
            <div className="text-[7px] text-slate-700 line-clamp-2 leading-relaxed mb-1">
              {centerSceneClue.description}
            </div>

            <div className="text-[6px] font-black text-red-700 uppercase border border-red-500 bg-red-50/90 px-1 py-0.5 rounded text-center tracking-tight">
              ★ COURT ADMITTED EXHIBIT ★
            </div>
          </div>
        </Html>
      </group>

      {/* ======================================================== */}
      {/* LEFT ZONE: SUSPECT MUGSHOTS & DOSSIERS                   */}
      {/* ======================================================== */}
      {suspectItems.map((suspect, idx) => {
        const coords = suspectCoords[idx] || { x: -2.38, y: 0, rotZ: 0 };
        const isHovered = hoveredId === suspect.id;
        const isCulprit = suspect.id === 'CH-104';

        return (
          <group
            key={suspect.id}
            position={[coords.x, coords.y, isHovered ? 0.12 : 0.08]}
            rotation={[0, 0, coords.rotZ]}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect('suspect', suspect);
            }}
            onPointerOver={() => setHoveredId(suspect.id)}
            onPointerOut={() => setHoveredId(null)}
          >
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.65, 0.58, 0.02]} />
              <meshStandardMaterial
                color={isHovered ? '#fffbeb' : '#f8fafc'}
                roughness={0.75}
              />
            </mesh>

            <group position={[0, 0.25, 0.025]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.025, 0.015, 0.035, 10]} />
                <meshStandardMaterial color="#dc2626" metalness={0.75} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0.018, 0]}>
                <sphereGeometry args={[0.03, 10, 10]} />
                <meshStandardMaterial color="#b91c1c" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>

            <Html position={[0, 0, 0.02]} transform distanceFactor={3.4} zIndexRange={[18, 0]}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect('suspect', suspect);
                }}
                className="w-[205px] p-1.5 select-none cursor-pointer font-mono leading-tight hover:scale-[1.02] transition-transform duration-150"
              >
                <div className="flex items-start gap-1.5">
                  <div className="relative w-9 h-11 bg-slate-900 rounded overflow-hidden flex flex-col items-center justify-end border border-slate-700 shrink-0">
                    <div className="absolute inset-0 opacity-25 flex flex-col justify-between py-0.5 px-0.5">
                      <div className="border-b border-slate-400 w-full" />
                      <div className="border-b border-slate-400 w-full" />
                    </div>
                    <User className="w-5 h-5 text-slate-400 relative z-10" />
                    <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[5.5px] text-center font-bold text-amber-400">
                      {suspect.id}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-black text-slate-900 truncate">
                        {suspect.name}
                      </span>
                      {isCulprit ? (
                        <span className="text-[6.5px] font-black uppercase bg-red-600 text-white px-1 py-0.2 rounded animate-pulse">
                          CULPRIT
                        </span>
                      ) : (
                        <span className="text-[6.5px] font-bold uppercase bg-slate-200 text-slate-700 px-1 py-0.2 rounded">
                          CLEARED
                        </span>
                      )}
                    </div>

                    <div className="text-[7.5px] font-semibold text-slate-600 truncate mb-0.5">
                      {suspect.occupation || 'Person of Interest'}
                    </div>

                    <div className="text-[7px] text-slate-700 line-clamp-1 bg-slate-100 p-0.5 rounded mb-0.5">
                      <span className="font-bold text-slate-900">Alibi:</span> {suspect.claimed_alibi}
                    </div>

                    {isCulprit ? (
                      <div className="text-[6.5px] font-bold text-red-700 bg-red-50 border border-red-200 px-1 rounded flex items-center justify-between">
                        <span>CONFESSED CRIME</span>
                        <ChevronRight className="w-2 h-2 text-red-600" />
                      </div>
                    ) : (
                      <div className="text-[6.5px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1 rounded flex items-center justify-between">
                        <span>Alibi Confirmed</span>
                        <ChevronRight className="w-2 h-2 text-emerald-600" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Html>
          </group>
        );
      })}

      {/* ======================================================== */}
      {/* RIGHT ZONE: 2x2 POLAROID FORENSIC EXHIBITS               */}
      {/* ======================================================== */}
      {exhibitsList.map((item, idx) => {
        const gridPositions = [
          { x: 1.45, y: 0.72, rotZ: -0.025, label: 'EXHIBIT #A' },
          { x: 2.75, y: 0.72, rotZ: 0.03, label: 'EXHIBIT #B' },
          { x: 1.45, y: -0.68, rotZ: 0.02, label: 'EXHIBIT #C' },
          { x: 2.75, y: -0.68, rotZ: -0.03, label: 'EXHIBIT #D' }
        ];

        const coords = gridPositions[idx] || gridPositions[0];
        const isHovered = hoveredId === item.id;

        return (
          <group
            key={item.id}
            position={[coords.x, coords.y, isHovered ? 0.12 : 0.08]}
            rotation={[0, 0, coords.rotZ]}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect('evidence', item);
            }}
            onPointerOver={() => setHoveredId(item.id)}
            onPointerOut={() => setHoveredId(null)}
          >
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.32, 1.25, 0.02]} />
              <meshStandardMaterial
                color={isHovered ? '#fffef0' : '#f8fafc'}
                roughness={0.82}
              />
            </mesh>

            {/* Translucent Scotch Tape Corners */}
            <mesh position={[-0.56, 0.54, 0.022]} rotation={[0, 0, 0.6]}>
              <planeGeometry args={[0.22, 0.08]} />
              <meshStandardMaterial
                color="#fef08a"
                transparent
                opacity={0.45}
                roughness={0.2}
              />
            </mesh>
            <mesh position={[0.56, 0.54, 0.022]} rotation={[0, 0, -0.6]}>
              <planeGeometry args={[0.22, 0.08]} />
              <meshStandardMaterial
                color="#fef08a"
                transparent
                opacity={0.45}
                roughness={0.2}
              />
            </mesh>

            <group position={[0, 0.54, 0.025]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.024, 0.014, 0.035, 10]} />
                <meshStandardMaterial
                  color={item.isAdmitted ? '#dc2626' : '#2563eb'}
                  metalness={0.7}
                  roughness={0.2}
                />
              </mesh>
              <mesh position={[0, 0.018, 0]}>
                <sphereGeometry args={[0.028, 10, 10]} />
                <meshStandardMaterial
                  color={item.isAdmitted ? '#b91c1c' : '#1d4ed8'}
                  roughness={0.2}
                  metalness={0.8}
                />
              </mesh>
            </group>

            <Html position={[0, 0, 0.02]} transform distanceFactor={3.4} zIndexRange={[18, 0]}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect('evidence', item);
                }}
                className="w-[165px] p-2 select-none cursor-pointer font-mono leading-tight hover:scale-[1.02] transition-transform duration-150"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[7px] font-black uppercase bg-amber-300 text-slate-900 px-1 py-0.2 rounded shadow-sm">
                    {coords.label}
                  </span>
                  <span className="text-[7px] font-bold text-slate-600 bg-slate-200 px-1 py-0.2 rounded">
                    {item.id}
                  </span>
                </div>

                <div className="w-full h-14 bg-slate-900 rounded overflow-hidden relative mb-1 border border-slate-700/80 flex items-center justify-center">
                  {item.id === 'EV-103' && (
                    <div className="flex flex-col items-center text-emerald-400">
                      <FlaskConical className="w-6 h-6 drop-shadow" />
                      <span className="text-[6px] font-bold text-emerald-300 tracking-wider">
                        FOXGLOVE SEDIMENT
                      </span>
                    </div>
                  )}
                  {item.id === 'EV-105' && (
                    <div className="flex flex-col items-center text-cyan-400">
                      <Clock className="w-6 h-6 drop-shadow" />
                      <span className="text-[6px] font-bold text-cyan-300 tracking-wider">
                        RFID LOG: 22:04
                      </span>
                    </div>
                  )}
                  {item.id === 'EV-104' && (
                    <div className="flex flex-col items-center text-rose-400">
                      <FileText className="w-6 h-6 drop-shadow" />
                      <span className="text-[6px] font-bold text-rose-300 tracking-wider">
                        TERMINATION DRAFT
                      </span>
                    </div>
                  )}
                  {item.id === 'EV-107' && (
                    <div className="flex flex-col items-center text-purple-400">
                      <Scissors className="w-6 h-6 drop-shadow" />
                      <span className="text-[6px] font-bold text-purple-300 tracking-wider">
                        PRUNING SHEARS
                      </span>
                    </div>
                  )}
                  {item.id !== 'EV-103' &&
                    item.id !== 'EV-105' &&
                    item.id !== 'EV-104' &&
                    item.id !== 'EV-107' && (
                      <div className="flex flex-col items-center text-amber-400">
                        <Fingerprint className="w-6 h-6 drop-shadow" />
                        <span className="text-[6px] font-bold text-amber-300 tracking-wider">
                          CRIME CLUE
                        </span>
                      </div>
                    )}
                </div>

                <div className="text-[9.5px] font-black text-slate-900 truncate mb-0.5">
                  {item.name}
                </div>
                <div className="text-[7px] text-slate-700 line-clamp-2 leading-relaxed mb-1">
                  {item.description}
                </div>

                {item.isAdmitted ? (
                  <div className="text-[6px] font-black text-red-700 uppercase border border-red-500 bg-red-50/90 px-1 py-0.5 rounded text-center tracking-tight">
                    ★ COURT ADMITTED EXHIBIT ★
                  </div>
                ) : (
                  <div className="text-[6px] font-bold text-cyan-800 uppercase border border-cyan-400 bg-cyan-50/90 px-1 py-0.5 rounded text-center tracking-tight">
                    [LAB VERIFIED RESULT]
                  </div>
                )}
              </div>
            </Html>
          </group>
        );
      })}

      {/* ======================================================== */}
      {/* POST-IT STICKY NOTES WITH DETECTIVE SCRIBBLINGS           */}
      {/* ======================================================== */}
      {stickyNotes.map(note => (
        <group
          key={note.id}
          position={note.pos}
          rotation={[0, 0, note.rotZ]}
          onPointerOver={() => setHoveredId(note.id)}
          onPointerOut={() => setHoveredId(null)}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.05, 0.65, 0.015]} />
            <meshStandardMaterial
              color={note.color}
              roughness={0.88}
              metalness={0.02}
            />
          </mesh>

          <mesh position={[0, 0.28, 0.012]}>
            <planeGeometry args={[1.02, 0.08]} />
            <meshStandardMaterial color="#000000" transparent opacity={0.08} />
          </mesh>

          <Html position={[0, 0, 0.018]} transform distanceFactor={3.2} zIndexRange={[17, 0]}>
            <div className="w-[130px] p-1.5 select-none pointer-events-none font-sans text-slate-800 leading-tight">
              <div className="text-[7.5px] font-extrabold italic text-slate-900 tracking-tight">
                “{note.text}”
              </div>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}
