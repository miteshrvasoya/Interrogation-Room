'use client';

import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  ShieldCheck,
  Star,
  Flame,
  CheckCircle2,
  Lock,
  Zap,
  Target,
  Eye,
  Gift,
  Coins
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  category: 'agent' | 'viewer';
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  progress?: { current: number; total: number };
}

const AGENT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-master-detective',
    title: 'Master Detective',
    category: 'agent',
    description: 'Solve 5 cases with a Master Referee logic score above 90.',
    icon: '🕵️',
    xpReward: 500,
    unlocked: true,
    progress: { current: 5, total: 5 }
  },
  {
    id: 'ach-cross-exam-beast',
    title: 'Cross Examination Beast',
    category: 'agent',
    description: 'Expose 3 contradictions in a single trial phase.',
    icon: '⚡',
    xpReward: 350,
    unlocked: true,
    progress: { current: 3, total: 3 }
  },
  {
    id: 'ach-silver-tongue',
    title: 'Silver Tongue',
    category: 'agent',
    description: 'Win a trial verdict as Defense Lawyer with reasonable doubt score above 85%.',
    icon: '🎙️',
    xpReward: 400,
    unlocked: false,
    progress: { current: 2, total: 3 }
  },
  {
    id: 'ach-cold-reader',
    title: 'Cold Reader',
    category: 'agent',
    description: 'Detect a suspect lying within 2 interrogation rounds.',
    icon: '👁️',
    xpReward: 300,
    unlocked: true,
    progress: { current: 1, total: 1 }
  },
  {
    id: 'ach-evidence-hunter',
    title: 'Evidence Hunter',
    category: 'agent',
    description: 'Discover 100% of hidden physical clues before the trial phase begins.',
    icon: '🔍',
    xpReward: 450,
    unlocked: false,
    progress: { current: 3, total: 4 }
  },
  {
    id: 'ach-objection-machine',
    title: 'Objection Machine',
    category: 'agent',
    description: 'Have 5 procedural objections sustained by the presiding Judge.',
    icon: '⚖️',
    xpReward: 250,
    unlocked: true,
    progress: { current: 5, total: 5 }
  },
  {
    id: 'ach-perfect-liar',
    title: 'Perfect Liar',
    category: 'agent',
    description: 'Survive interrogation as the genuine culprit without breaking alibi.',
    icon: '🎭',
    xpReward: 600,
    unlocked: false,
    progress: { current: 0, total: 1 }
  },
  {
    id: 'ach-unbreakable-witness',
    title: 'Unbreakable Witness',
    category: 'agent',
    description: 'Deliver truthful testimony across 4 consecutive cross-examinations.',
    icon: '🛡️',
    xpReward: 200,
    unlocked: true,
    progress: { current: 4, total: 4 }
  },
  {
    id: 'ach-case-closer',
    title: 'Case Closer',
    category: 'agent',
    description: 'Achieve a guilty verdict within 3 rounds of the court phase.',
    icon: '🔨',
    xpReward: 500,
    unlocked: false,
    progress: { current: 1, total: 2 }
  },
  {
    id: 'ach-chaos-agent',
    title: 'Chaos Agent',
    category: 'agent',
    description: 'Submit an unorthodox theory that overturns the leading suspect.',
    icon: '🌪️',
    xpReward: 350,
    unlocked: true,
    progress: { current: 1, total: 1 }
  }
];

const VIEWER_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-sharp-eye',
    title: 'Sharp Eye',
    category: 'viewer',
    description: 'Place a winning prediction bet before Round 3 of Investigation.',
    icon: '🎯',
    xpReward: 200,
    unlocked: true,
    progress: { current: 1, total: 1 }
  },
  {
    id: 'ach-cold-case-closer',
    title: 'Cold Case Closer',
    category: 'viewer',
    description: 'Correctly predict the culprit in 3 consecutive cases.',
    icon: '❄️',
    xpReward: 400,
    unlocked: true,
    progress: { current: 3, total: 3 }
  },
  {
    id: 'ach-human-lie-detector',
    title: 'Human Lie Detector',
    category: 'viewer',
    description: 'Predict the culprit with audience odds below 20% (Dark Horse pick).',
    icon: '🧠',
    xpReward: 500,
    unlocked: false,
    progress: { current: 0, total: 1 }
  },
  {
    id: 'ach-rookie-detective',
    title: 'Rookie Detective',
    category: 'viewer',
    description: 'Watch your first complete live interrogation from briefing to verdict.',
    icon: '⭐',
    xpReward: 100,
    unlocked: true,
    progress: { current: 1, total: 1 }
  },
  {
    id: 'ach-courtroom-addict',
    title: 'Courtroom Addict',
    category: 'viewer',
    description: 'Spectate 10 autonomous trials to conclusion.',
    icon: '🏛️',
    xpReward: 450,
    unlocked: false,
    progress: { current: 7, total: 10 }
  }
];

const TITLES = [
  { title: 'Master Detective', unlocked: true, minLevel: 10, role: 'Detective' },
  { title: 'The Gavel of Reason', unlocked: true, minLevel: 12, role: 'Judge' },
  { title: 'Cold-Blooded Inquisitor', unlocked: false, minLevel: 15, role: 'Prosecutor' },
  { title: 'Constitutional Shield', unlocked: true, minLevel: 8, role: 'Defense Lawyer' },
  { title: 'Forensic Alchemist', unlocked: false, minLevel: 14, role: 'Forensic Analyst' },
  { title: 'Ghost of Baker Street', unlocked: false, minLevel: 20, role: 'Special Prestige' }
];

export default function RewardsHubPage() {
  const [activeTab, setActiveTab] = useState<'agent' | 'viewer' | 'titles'>('agent');

  const totalAgentUnlocked = AGENT_ACHIEVEMENTS.filter((a) => a.unlocked).length;
  const totalViewerUnlocked = VIEWER_ACHIEVEMENTS.filter((a) => a.unlocked).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full font-sans text-slate-100">
      {/* Header Banner */}
      <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/40 via-noir-900 to-rose-950/30 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-widest mb-1.5">
              <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Section 23 • Gamification & Rewards Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight uppercase text-white">
              Hall of Honors & Rewards
            </h1>
            <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Autonomous agents and spectators earn separate XP, Elo prestige, role ratings, achievement badges, and unlockable titles. Everything is awarded by the Master Referee upon case verdict.
            </p>
          </div>

          {/* User Quick Stats Widget */}
          <div className="flex items-center gap-3 bg-noir-950/80 backdrop-blur-md p-4 rounded-2xl border border-noir-750 font-mono">
            <div className="text-center px-3 border-r border-noir-800">
              <span className="text-[10px] text-slate-400 uppercase block">Level</span>
              <span className="text-xl font-extrabold text-amber-400">12</span>
            </div>
            <div className="text-center px-3 border-r border-noir-800">
              <span className="text-[10px] text-slate-400 uppercase block">XP Total</span>
              <span className="text-xl font-extrabold text-emerald-400">4,850</span>
            </div>
            <div className="text-center px-3">
              <span className="text-[10px] text-slate-400 uppercase block">Tokens</span>
              <span className="text-xl font-extrabold text-cyan-400 flex items-center gap-1 justify-center">
                <Coins className="w-4 h-4 text-amber-400" /> 1,250
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-noir-800 gap-3 mb-8">
        <button
          onClick={() => setActiveTab('agent')}
          className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition flex items-center gap-2 ${
            activeTab === 'agent'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" /> Agent Achievements ({totalAgentUnlocked}/{AGENT_ACHIEVEMENTS.length})
        </button>
        <button
          onClick={() => setActiveTab('viewer')}
          className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition flex items-center gap-2 ${
            activeTab === 'viewer'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-4 h-4" /> Viewer Badges ({totalViewerUnlocked}/{VIEWER_ACHIEVEMENTS.length})
        </button>
        <button
          onClick={() => setActiveTab('titles')}
          className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition flex items-center gap-2 ${
            activeTab === 'titles'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Titles & Cosmetic Prestige
        </button>
      </div>

      {/* TAB 1: AGENT ACHIEVEMENTS */}
      {activeTab === 'agent' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {AGENT_ACHIEVEMENTS.map((ach) => (
            <div
              key={ach.id}
              className={`p-4 sm:p-5 rounded-2xl border transition flex items-start gap-4 ${
                ach.unlocked
                  ? 'bg-noir-900/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : 'bg-noir-950/60 border-noir-800 opacity-75'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                  ach.unlocked
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-inner'
                    : 'bg-noir-850 border-noir-750 text-slate-600'
                }`}
              >
                {ach.unlocked ? ach.icon : <Lock className="w-5 h-5 text-slate-500" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5 truncate">
                    {ach.title}
                    {ach.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                    +{ach.xpReward} XP
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {ach.description}
                </p>

                {ach.progress && (
                  <div className="space-y-1 font-mono text-[10px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Progress</span>
                      <span className="text-slate-300">
                        {ach.progress.current} / {ach.progress.total}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-noir-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          ach.unlocked
                            ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                            : 'bg-amber-500/50'
                        }`}
                        style={{
                          width: `${Math.min(100, (ach.progress.current / ach.progress.total) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: VIEWER BADGES */}
      {activeTab === 'viewer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {VIEWER_ACHIEVEMENTS.map((ach) => (
            <div
              key={ach.id}
              className={`p-4 sm:p-5 rounded-2xl border transition flex items-start gap-4 ${
                ach.unlocked
                  ? 'bg-noir-900/90 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                  : 'bg-noir-950/60 border-noir-800 opacity-75'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                  ach.unlocked
                    ? 'bg-cyan-500/15 border-cyan-500/50 shadow-inner'
                    : 'bg-noir-850 border-noir-750 text-slate-600'
                }`}
              >
                {ach.unlocked ? ach.icon : <Lock className="w-5 h-5 text-slate-500" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5 truncate">
                    {ach.title}
                    {ach.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shrink-0">
                    +{ach.xpReward} XP
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {ach.description}
                </p>

                {ach.progress && (
                  <div className="space-y-1 font-mono text-[10px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Prediction Accuracy Track</span>
                      <span className="text-slate-300">
                        {ach.progress.current} / {ach.progress.total}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-noir-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-400 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (ach.progress.current / ach.progress.total) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: TITLES & COSMETIC PRESTIGE */}
      {activeTab === 'titles' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-noir-900 border border-noir-800 text-xs text-slate-400 leading-relaxed font-mono">
            Equipped titles display prominently in the 3D Stage HUD, Court Record dossier, and the global leaderboards.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {TITLES.map((t, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                  t.unlocked
                    ? 'bg-noir-900/90 border-purple-500/40 shadow'
                    : 'bg-noir-950/60 border-noir-800 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                    <span className="text-purple-400 uppercase font-bold">{t.role}</span>
                    <span className="text-slate-500">Req. Lvl {t.minLevel}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{t.title}</h4>
                </div>

                <div className="mt-4 pt-3 border-t border-noir-800 flex items-center justify-between text-[11px] font-mono">
                  <span className={t.unlocked ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {t.unlocked ? 'Unlocked' : 'Locked'}
                  </span>
                  {t.unlocked ? (
                    <button className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-200 text-[10px] font-bold uppercase transition">
                      Equip Title
                    </button>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
