'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  SkipBack,
  SkipForward,
  Clock,
  Compass,
  Bookmark,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { sounds } from '@/lib/audio';

export interface ReplayChapter {
  id: string;
  title: string;
  round: number;
  phase: string;
  eventIndex: number;
  description: string;
  timestamp: string;
}

interface CaseReplayControllerProps {
  transcript: any[];
  replayChapters?: ReplayChapter[];
  currentIndex: number;
  onSeekIndex: (index: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function CaseReplayController({
  transcript = [],
  replayChapters = [],
  currentIndex,
  onSeekIndex,
  isOpen,
  onClose
}: CaseReplayControllerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x
  const [showChapters, setShowChapters] = useState(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalEvents = Math.max(1, transcript.length);
  const safeIndex = Math.min(Math.max(0, currentIndex), totalEvents - 1);
  const currentEvent = transcript[safeIndex] || null;

  // Chapter markers: use provided chapters or derive fallback chapters from transcript phases
  const chapters: ReplayChapter[] = React.useMemo(() => {
    if (replayChapters && replayChapters.length > 0) return replayChapters;

    // Build fallback chapters by scanning transcript
    const derived: ReplayChapter[] = [];
    const seenPhases = new Set<string>();

    transcript.forEach((evt, idx) => {
      const p = evt.phase || 'investigation';
      if (!seenPhases.has(p)) {
        seenPhases.add(p);
        derived.push({
          id: `chap-${p}`,
          title: p.charAt(0).toUpperCase() + p.slice(1),
          round: evt.round || 1,
          phase: p,
          eventIndex: idx,
          description: `Phase transition into ${p}`,
          timestamp: `0${derived.length}:00`
        });
      }
      if (evt.discovered_evidence && !seenPhases.has('evidence_found')) {
        seenPhases.add('evidence_found');
        derived.push({
          id: 'chap-evidence',
          title: 'Evidence Found',
          round: evt.round,
          phase: p,
          eventIndex: idx,
          description: `Discovered: ${evt.discovered_evidence.name || 'Critical Clue'}`,
          timestamp: `0${derived.length}:30`
        });
      }
      if (evt.contradiction_exposed && !seenPhases.has('contradiction')) {
        seenPhases.add('contradiction');
        derived.push({
          id: 'chap-contradiction',
          title: 'Contradiction Exposed',
          round: evt.round,
          phase: p,
          eventIndex: idx,
          description: evt.contradiction_exposed.description || 'Major contradiction revealed',
          timestamp: `0${derived.length}:45`
        });
      }
    });

    return derived;
  }, [replayChapters, transcript]);

  // Handle Play/Pause timer loop
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      return;
    }

    const intervalMs = Math.max(300, Math.floor(2000 / playbackSpeed));
    playTimerRef.current = setInterval(() => {
      if (safeIndex >= totalEvents - 1) {
        setIsPlaying(false);
        if (playTimerRef.current) clearInterval(playTimerRef.current);
      } else {
        onSeekIndex(safeIndex + 1);
      }
    }, intervalMs);

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, safeIndex, totalEvents, playbackSpeed, onSeekIndex]);

  if (!isOpen) return null;

  const handleTogglePlay = () => {
    if (safeIndex >= totalEvents - 1 && !isPlaying) {
      onSeekIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    onSeekIndex(Math.max(0, safeIndex - 1));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    onSeekIndex(Math.min(totalEvents - 1, safeIndex + 1));
  };

  const handleJumpToChapter = (chapter: ReplayChapter) => {
    setIsPlaying(false);
    onSeekIndex(Math.min(totalEvents - 1, chapter.eventIndex));
    setShowChapters(false);
    sounds.playGavel();
  };

  const speedCycle = [1, 2, 5];
  const cycleSpeed = () => {
    const nextIdx = (speedCycle.indexOf(playbackSpeed) + 1) % speedCycle.length;
    setPlaybackSpeed(speedCycle[nextIdx]);
  };

  const progressPercent = Math.round(((safeIndex + 1) / totalEvents) * 100);

  return (
    <div className="pointer-events-auto fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl px-4 animate-slide-up">
      <div className="bg-noir-950/95 backdrop-blur-2xl rounded-2xl border border-amber-500/50 shadow-2xl p-3 sm:p-4 text-slate-100 flex flex-col gap-2.5">
        {/* Top bar: Chapter dropdown & Current Event Meta */}
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChapters(!showChapters)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold uppercase tracking-wider text-[11px] transition"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Chapters ({chapters.length})</span>
            </button>

            {currentEvent && (
              <span className="hidden sm:inline-block text-[11px] text-slate-400">
                Phase: <strong className="text-slate-200 capitalize">{currentEvent.phase}</strong> • Round{' '}
                <strong className="text-amber-400">{currentEvent.round}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400">
              Event <strong className="text-amber-400">{safeIndex + 1}</strong> of {totalEvents}
            </span>
            <button
              onClick={onClose}
              className="text-[10px] text-slate-500 hover:text-slate-300 uppercase px-2 py-0.5 rounded bg-noir-850 hover:bg-noir-800 transition"
            >
              Exit Replay
            </button>
          </div>
        </div>

        {/* Chapters Flyout Menu */}
        {showChapters && (
          <div className="p-2 rounded-xl bg-noir-900 border border-noir-750 max-h-48 overflow-y-auto space-y-1 text-xs">
            {chapters.map((chap) => {
              const isActive = safeIndex >= chap.eventIndex;
              return (
                <button
                  key={chap.id}
                  onClick={() => handleJumpToChapter(chap)}
                  className={`w-full p-2 rounded-lg text-left flex items-center justify-between transition ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 font-bold'
                      : 'hover:bg-noir-850 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-amber-400 font-mono">{chap.timestamp}</span>
                    <span>{chap.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Round {chap.round} (Evt #{chap.eventIndex + 1})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Scrub Bar Slider */}
        <div className="space-y-1">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={totalEvents - 1}
              value={safeIndex}
              onChange={(e) => {
                setIsPlaying(false);
                onSeekIndex(parseInt(e.target.value, 10));
              }}
              className="w-full h-2 bg-noir-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Markers track underneath */}
          <div className="relative h-1 w-full flex justify-between">
            {chapters.map((ch) => {
              const posPercent = (ch.eventIndex / Math.max(1, totalEvents - 1)) * 100;
              return (
                <div
                  key={ch.id}
                  style={{ left: `${posPercent}%` }}
                  className="absolute -top-1 w-1 h-2 bg-amber-400/80 rounded-full"
                  title={`${ch.title} (Event ${ch.eventIndex + 1})`}
                />
              );
            })}
          </div>
        </div>

        {/* Playback Controls Strip */}
        <div className="flex items-center justify-between pt-1">
          {/* Left: Replay Start */}
          <button
            onClick={() => {
              setIsPlaying(false);
              onSeekIndex(0);
            }}
            title="Rewind to Start"
            className="p-2 rounded-xl bg-noir-900 hover:bg-noir-850 border border-noir-800 text-slate-400 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Center Playback Hub */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleStepBack}
              title="Previous Event"
              className="p-2 rounded-xl bg-noir-900 hover:bg-noir-850 border border-noir-800 text-slate-300 hover:text-white transition"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={handleTogglePlay}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-noir-950 font-bold text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-amber-500/25 transition active:scale-95"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Resume Replay
                </>
              )}
            </button>

            <button
              onClick={handleStepForward}
              title="Next Event"
              className="p-2 rounded-xl bg-noir-900 hover:bg-noir-850 border border-noir-800 text-slate-300 hover:text-white transition"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Speed Multiplier */}
          <button
            onClick={cycleSpeed}
            title="Change Playback Speed"
            className="px-3 py-1.5 rounded-xl bg-noir-900 hover:bg-noir-850 border border-noir-800 text-amber-400 font-mono text-xs font-bold transition flex items-center gap-1"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>{playbackSpeed}x</span>
          </button>
        </div>
      </div>
    </div>
  );
}
