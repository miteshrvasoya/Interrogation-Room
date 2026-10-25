'use client';

import React from 'react';
import {
  Camera,
  Eye,
  Flame,
  MessageSquare,
  Sparkles,
  DollarSign,
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Radio,
  FileText,
  ShieldCheck,
  BrainCircuit,
  History,
  Share2
} from 'lucide-react';

interface SpectatorHUDProps {
  caseTitle: string;
  phase: string;
  subPhase?: string | null;
  round: number;
  maxRounds: number;
  heat: number;
  odds: Record<string, { name: string; percentage: number }>;
  freeLook: boolean;
  onToggleFreeLook: () => void;
  settingMode: 'auto' | 'evidence_board';
  onToggleSettingMode: () => void;
  onOpenTranscript: () => void;
  onOpenBetModal: () => void;
  onSendReaction: (type: string) => void;
  isCompleted?: boolean;
  onOpenReveal?: () => void;
  autoPlay?: boolean;
  onToggleAutoPlay?: () => void;
  onStepRound?: () => void;
  onResetCase?: () => void;
  transcriptCount?: number;
  onToggleReferee?: () => void;
  isRefereeOpen?: boolean;
  onStartReplay?: () => void;
  isReplayActive?: boolean;
  onOpenShare?: () => void;
}

const PHASES = [
  { id: 'briefing', label: 'Briefing' },
  { id: 'investigation', label: 'Investigation' },
  { id: 'interrogation', label: 'Interrogation' },
  { id: 'charging', label: 'Charging' },
  { id: 'trial', label: 'Trial' },
  { id: 'verdict', label: 'Verdict' },
  { id: 'reveal', label: 'Reveal' }
];

export default function SpectatorHUD({
  caseTitle,
  phase,
  subPhase,
  round,
  maxRounds,
  heat,
  odds,
  freeLook,
  onToggleFreeLook,
  settingMode,
  onToggleSettingMode,
  onOpenTranscript,
  onOpenBetModal,
  onSendReaction,
  isCompleted = false,
  onOpenReveal,
  autoPlay = true,
  onToggleAutoPlay,
  onStepRound,
  onResetCase,
  transcriptCount = 0,
  onToggleReferee,
  isRefereeOpen = false,
  onStartReplay,
  isReplayActive = false,
  onOpenShare
}: SpectatorHUDProps) {
  const currentPhaseIdx = PHASES.findIndex((p) => p.id === phase);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-4 select-none">
      {/* ────────────────── TOP BROADCAST CONTROL BAR ────────────────── */}
      <div className="flex flex-col gap-2">
        <header className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 bg-noir-950/85 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-noir-700/80 shadow-2xl">
          {/* Left: Case Info & Heat */}
          <div className="flex items-center gap-3">
            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono text-[10px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>LIVE</span>
            </div>

            {/* Case Title */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                  {caseTitle}
                </h1>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold uppercase">
                  {phase} {subPhase ? `• ${subPhase}` : ''}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Round {round} of {maxRounds || 6}
              </div>
            </div>

            {/* Heat Meter */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-noir-800">
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                <span className="text-xs font-bold text-orange-400 font-mono">{heat}%</span>
              </div>
              <div className="w-14 h-1.5 bg-noir-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, heat)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Center: Phase Stepper Progress */}
          <div className="hidden xl:flex items-center gap-1 bg-noir-900/80 px-2 py-1 rounded-xl border border-noir-800">
            {PHASES.map((p, idx) => {
              const isDone = idx < currentPhaseIdx;
              const isCurrent = idx === currentPhaseIdx;
              return (
                <div
                  key={p.id}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition ${
                    isCurrent
                      ? 'bg-amber-500 text-noir-950 font-bold shadow-md shadow-amber-500/30'
                      : isDone
                      ? 'bg-noir-800/80 text-slate-500 line-through'
                      : 'text-slate-500'
                  }`}
                >
                  {p.label}
                </div>
              );
            })}
          </div>

          {/* Right: Simulation Controls & View Modifiers */}
          <div className="flex items-center flex-wrap gap-1.5">
            {/* Reset Simulation Button */}
            {onResetCase && (
              <button
                onClick={onResetCase}
                title="Restart Case Simulation to Round 1"
                className="p-1.5 rounded-xl bg-noir-900 hover:bg-noir-800 text-slate-300 hover:text-amber-400 border border-noir-700/80 text-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Autoplay Play/Pause */}
            {onToggleAutoPlay && (
              <button
                onClick={onToggleAutoPlay}
                title={autoPlay ? 'Pause Live Progression' : 'Resume Live Progression'}
                className={`p-1.5 rounded-xl border text-xs transition flex items-center gap-1 font-mono ${
                  autoPlay
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                }`}
              >
                {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Manual Step Button */}
            {onStepRound && !autoPlay && (
              <button
                onClick={onStepRound}
                title="Step Next Simulation Round"
                className="px-2.5 py-1.5 rounded-xl bg-noir-900 hover:bg-noir-850 text-slate-200 border border-noir-700/80 text-xs font-mono flex items-center gap-1 transition"
              >
                <StepForward className="w-3.5 h-3.5 text-amber-400" />
                <span>Step</span>
              </button>
            )}

            {/* Watch Reveal Button (if case solved) */}
            {isCompleted && onOpenReveal && (
              <button
                onClick={onOpenReveal}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition animate-pulse"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Watch Reveal</span>
              </button>
            )}

            {/* Master Referee Scoring HUD Toggle */}
            {onToggleReferee && (
              <button
                onClick={onToggleReferee}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                  isRefereeOpen
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/20'
                    : 'bg-noir-900 hover:bg-noir-850 text-slate-300 border-noir-700/80 hover:text-amber-400'
                }`}
                title="Toggle Master Referee Live Intelligence Panel"
              >
                <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Referee Intel</span>
              </button>
            )}

            {/* Deterministic Replay Timeline Toggle */}
            {onStartReplay && (
              <button
                onClick={onStartReplay}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                  isReplayActive
                    ? 'bg-purple-500/25 text-purple-300 border-purple-500/50 shadow-md shadow-purple-500/20'
                    : 'bg-noir-900 hover:bg-noir-850 text-slate-300 border-noir-700/80 hover:text-purple-400'
                }`}
                title="Toggle Chapterized Deterministic Replay"
              >
                <History className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Replay</span>
              </button>
            )}

            {/* View Mode Toggle (3D vs Evidence Board) */}
            <button
              onClick={onToggleSettingMode}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
                settingMode === 'evidence_board'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-noir-900 hover:bg-noir-850 text-slate-300 border-noir-700/80'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {settingMode === 'evidence_board' ? '3D Stage' : 'Evidence Board'}
              </span>
            </button>

            {/* Free Look OrbitControls Toggle */}
            <button
              onClick={onToggleFreeLook}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
                freeLook
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                  : 'bg-noir-900 hover:bg-noir-850 text-slate-300 border-noir-700/80'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{freeLook ? 'Free-Look ON' : 'Cinematic Auto'}</span>
            </button>

            {/* Social Share / Twitter Card Preview */}
            {onOpenShare && (
              <button
                onClick={onOpenShare}
                className="px-2.5 py-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-xs font-mono font-bold flex items-center gap-1.5 transition"
                title="Preview Twitter Post & Share Mystery"
              >
                <Share2 className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
          </div>
        </header>

        {/* Banner when Verdict / Solved (Non-Intrusive Floating Banner) */}
        {isCompleted && (
          <div className="pointer-events-auto mx-auto max-w-xl w-full bg-noir-950/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-rose-500/40 shadow-2xl flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-xs text-slate-200">
                <strong className="text-rose-400">Verdict Delivered!</strong> Simulation has concluded.
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onOpenReveal && (
                <button
                  onClick={onOpenReveal}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition"
                >
                  View Reveal
                </button>
              )}
              {onResetCase && (
                <button
                  onClick={onResetCase}
                  className="px-2.5 py-1 rounded-lg bg-noir-850 hover:bg-noir-800 text-slate-300 border border-noir-700 text-xs transition"
                >
                  Replay Case
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ────────────────── BOTTOM COMMAND & INTERACTION DOCK ────────────────── */}
      <div className="pointer-events-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Spectator Live Reaction Pills */}
        <div className="flex items-center gap-1.5 bg-noir-950/85 backdrop-blur-xl p-1.5 rounded-2xl border border-noir-700/80 shadow-2xl">
          <span className="text-[10px] text-slate-400 font-mono uppercase px-2 hidden sm:inline">
            React:
          </span>
          <button
            onClick={() => onSendReaction('objection')}
            className="px-2.5 py-1 rounded-xl bg-red-950/60 hover:bg-red-800/80 text-red-300 border border-red-800/60 text-xs font-bold tracking-wide transition transform active:scale-95 shadow"
          >
            ⚖️ Objection!
          </button>
          <button
            onClick={() => onSendReaction('suspicious')}
            className="px-2.5 py-1 rounded-xl bg-amber-950/60 hover:bg-amber-800/80 text-amber-300 border border-amber-800/60 text-xs font-bold tracking-wide transition transform active:scale-95 shadow"
          >
            🧐 Suspicious
          </button>
          <button
            onClick={() => onSendReaction('gasp')}
            className="px-2.5 py-1 rounded-xl bg-purple-950/60 hover:bg-purple-800/80 text-purple-300 border border-purple-800/60 text-xs font-bold tracking-wide transition transform active:scale-95 shadow"
          >
            😱 Gasp!
          </button>
          <button
            onClick={() => onSendReaction('guilty')}
            className="px-2.5 py-1 rounded-xl bg-rose-950/60 hover:bg-rose-800/80 text-rose-300 border border-rose-800/60 text-xs font-bold tracking-wide transition transform active:scale-95 shadow hidden sm:inline-block"
          >
            🔨 Guilty!
          </button>
        </div>

        {/* Center: Live Audience Culprit Odds Bar */}
        {Object.keys(odds).length > 0 && (
          <div className="w-full max-w-md bg-noir-950/85 backdrop-blur-xl px-4 py-2 rounded-2xl border border-noir-700/80 shadow-2xl">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-mono mb-1">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Sparkles className="w-3 h-3" /> Audience Odds
              </span>
              <button
                onClick={onOpenBetModal}
                className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-0.5 font-bold transition"
              >
                <DollarSign className="w-3 h-3" /> Place Bet
              </button>
            </div>
            {/* Color Strip */}
            <div className="flex h-2 rounded-full overflow-hidden bg-noir-800 gap-0.5">
              {Object.entries(odds).map(([charId, data], idx) => {
                const colors = ['bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-indigo-500'];
                const color = colors[idx % colors.length];
                return (
                  <div
                    key={charId}
                    style={{ width: `${Math.max(8, data.percentage)}%` }}
                    className={`${color} h-full transition-all duration-500`}
                    title={`${data.name}: ${data.percentage}%`}
                  />
                );
              })}
            </div>
            {/* Character percentages */}
            <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400 font-mono">
              {Object.entries(odds).slice(0, 4).map(([charId, data]) => (
                <span key={charId} className="truncate max-w-[80px]">
                  {data.name.split(' ')[0]}: <strong className="text-slate-200">{data.percentage}%</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Right: Court Record & Dossier Drawer Button */}
        <button
          onClick={onOpenTranscript}
          className="bg-noir-950/85 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-noir-700/80 hover:border-amber-500/50 text-slate-200 text-xs font-semibold flex items-center gap-2.5 shadow-2xl hover:text-white transition group"
        >
          <FileText className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
          <span>Court Record & Dossier</span>
          {transcriptCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px]">
              {transcriptCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
