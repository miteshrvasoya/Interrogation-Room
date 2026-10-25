'use client';

import React, { useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

export interface FloatingReaction {
  id: string;
  type: string;
  user: string;
  x: number;
  y: number;
  z: number;
  opacity: number;
}

interface SpectatorFloatingFXProps {
  reactions: Array<{ id: string; type: string; user?: string }>;
}

export default function SpectatorFloatingFX({ reactions }: SpectatorFloatingFXProps) {
  const [activeItems, setActiveItems] = useState<FloatingReaction[]>([]);

  // When a new reaction arrives, push to active items with randomized gallery launch point
  useEffect(() => {
    if (reactions.length === 0) return;
    const latest = reactions[reactions.length - 1];
    const newItem: FloatingReaction = {
      id: latest.id,
      type: latest.type,
      user: latest.user || 'Spectator',
      x: (Math.random() - 0.5) * 6,
      y: 0.8,
      z: 2.5 + Math.random() * 2,
      opacity: 1
    };

    setActiveItems((prev) => [...prev.slice(-8), newItem]);
  }, [reactions]);

  // Animate items floating upward and fading
  useFrame((_, delta) => {
    setActiveItems((prev) =>
      prev
        .map((item) => ({
          ...item,
          y: item.y + delta * 1.4,
          opacity: item.opacity - delta * 0.45
        }))
        .filter((item) => item.opacity > 0)
    );
  });

  const getReactionConfig = (type: string) => {
    switch (type.toLowerCase()) {
      case 'objection':
        return { text: '⚖️ OBJECTION!', bg: 'bg-red-600/90 border-red-400 text-white shadow-red-500/50' };
      case 'suspicious':
        return { text: '🧐 SUSPICIOUS', bg: 'bg-amber-600/90 border-amber-400 text-amber-50 shadow-amber-500/50' };
      case 'gasp':
        return { text: '😱 GASP!', bg: 'bg-purple-600/90 border-purple-400 text-purple-50 shadow-purple-500/50' };
      case 'clapping':
      case 'guilty':
        return { text: '🔨 GUILTY!', bg: 'bg-crimson-600/90 border-crimson-400 text-white shadow-crimson-500/50' };
      case 'innocent':
        return { text: '🕊️ INNOCENT!', bg: 'bg-emerald-600/90 border-emerald-400 text-white shadow-emerald-500/50' };
      default:
        return { text: `💬 ${type}`, bg: 'bg-noir-800/90 border-slate-400 text-slate-100 shadow-noir-900/50' };
    }
  };

  return (
    <group>
      {activeItems.map((item) => {
        const config = getReactionConfig(item.type);
        return (
          <Html
            key={item.id}
            position={[item.x, item.y, item.z]}
            center
            distanceFactor={10}
            zIndexRange={[200, 0]}
          >
            <div
              className={`pointer-events-none select-none font-bold text-xs uppercase px-3 py-1 rounded-full border shadow-lg tracking-wider transform transition-opacity ${config.bg}`}
              style={{ opacity: Math.max(0, item.opacity) }}
            >
              {config.text}
            </div>
          </Html>
        );
      })}
    </group>
  );
}
