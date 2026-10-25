'use client';

import React, { useState } from 'react';
import {
  Award,
  AlertTriangle,
  TrendingUp,
  BrainCircuit,
  Scale,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Zap,
  Sparkles
} from 'lucide-react';

export interface ScoreAdjustment {
  metric: string;
  delta: number;
  reason: string;
  timestamp?: number;
}

export interface AgentScore {
  agentId: string;
  name: string;
  role: string;
  totalScore: number;
  recentAdjustments: ScoreAdjustment[];
  metrics: Record<string, number>;
}

export interface ContradictionAlert {
  id: string;
  characterId: string;
  claim: string;
  evidenceId?: string;
  confidence: number;
  description: string;
  round: number;
  phase: string;
}

interface MasterRefereeScorePanelProps {
  liveScores: AgentScore[];
  contradictions: ContradictionAlert[];
  observations?: (string | any)[];
  isOpen: boolean;
  onToggle: () => void;
}

export default function MasterRefereeScorePanel({
  liveScores = [],
  contradictions = [],
  observations = [],
  isOpen,
  onToggle
}: MasterRefereeScorePanelProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Default to first agent if not selected
  const activeAgent = liveScores.find((a) => a.agentId === selectedAgentId) || liveScores[0];

  return (
    <div className="pointer-events-auto transition-all duration-300">
      {/* Minimized Trigger Pill */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-noir-950/90 backdrop-blur-xl border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-xs font-mono font-bold shadow-2xl transition group"
        >
          <BrainCircuit className="w-4 h-4 text-amber-400 group-hover:scale-110 transition animate-pulse" />
          <span>Referee Intel</span>
          {contradictions.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-300 text-[10px] border border-rose-500/50 flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" />
              {contradictions.length}
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}

      {/* Expanded Intelligence Panel */}
      {isOpen && (
        <div className="w-80 sm:w-96 max-h-[75vh] flex flex-col bg-noir-950/95 backdrop-blur-2xl rounded-2xl border border-amber-500/40 shadow-2xl overflow-hidden animate-fade-in text-slate-200 font-sans">
          {/* Header */}
          <div className="p-3.5 border-b border-noir-800 flex items-center justify-between bg-gradient-to-r from-amber-950/40 to-noir-900/40">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  Master Referee
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </h3>
                <div className="text-[10px] text-slate-400 font-mono">
                  Continuous Evaluation & Contradiction Tracking
                </div>
              </div>
            </div>

            <button
              onClick={onToggle}
              className="p-1 rounded-lg hover:bg-noir-800 text-slate-400 hover:text-white transition"
              title="Collapse Referee Panel"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3.5 scrollbar-thin scrollbar-thumb-noir-700">
            {/* Contradiction Detection Ticker (if any) */}
            {contradictions.length > 0 && (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-600/40 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-500" /> Contradiction Detected
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-200 border border-rose-700/60">
                    Conf: {contradictions[contradictions.length - 1].confidence || 92}%
                  </span>
                </div>
                <p className="text-[11px] text-rose-200 leading-snug">
                  {contradictions[contradictions.length - 1].description}
                </p>
                {contradictions[contradictions.length - 1].claim && (
                  <div className="text-[10px] text-rose-300/80 italic font-mono">
                    "{contradictions[contradictions.length - 1].claim}"
                  </div>
                )}
              </div>
            )}

            {/* Agent Score Cards Grid */}
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5 flex items-center justify-between">
                <span>Active Participants ({liveScores.length})</span>
                <span className="text-amber-400 font-mono">Live Score</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {liveScores.map((agent: any) => {
                  const isSelected = activeAgent?.agentId === agent.agentId;
                  const currentScore = agent.score ?? agent.totalScore ?? 50;
                  const agentName = agent.displayName || agent.name || 'Agent';
                  const scoreColor =
                    currentScore >= 75
                      ? 'text-emerald-400'
                      : currentScore >= 50
                      ? 'text-amber-400'
                      : 'text-rose-400';

                  return (
                    <button
                      key={agent.agentId}
                      onClick={() => setSelectedAgentId(agent.agentId)}
                      className={`p-2 rounded-xl text-left border transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                          : 'bg-noir-900/80 hover:bg-noir-850 border-noir-800'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-bold text-slate-200 truncate max-w-[90px]">
                          {agentName}
                        </span>
                        <span className={`text-xs font-mono font-bold ${scoreColor}`}>
                          {currentScore}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-400 uppercase font-mono mt-0.5">
                        {agent.role?.replace('_', ' ')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Agent Score Breakdown */}
            {activeAgent && (
              <div className="p-3 rounded-xl bg-noir-900/90 border border-noir-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-noir-800 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      {(activeAgent as any).displayName || activeAgent.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">
                      Role: {activeAgent.role?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-extrabold text-amber-400">
                      {(activeAgent as any).score ?? activeAgent.totalScore ?? 50}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-mono">PTS</span>
                  </div>
                </div>

                {/* Live Adjustments Pill Stream */}
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    Score Adjustments Breakdown
                  </span>
                  {((activeAgent as any).breakdown || activeAgent.recentAdjustments)?.length > 0 ? (
                    <div className="space-y-1">
                      {((activeAgent as any).breakdown || activeAgent.recentAdjustments)
                        .slice(-4)
                        .reverse()
                        .map((adj: any, i: number) => {
                          const isPositive = adj.delta >= 0;
                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between text-[11px] font-mono py-0.5 px-2 rounded-lg bg-noir-850 border border-noir-750"
                            >
                              <span className="text-slate-300 truncate max-w-[180px]">
                                {adj.reason || adj.metric}
                              </span>
                              <span
                                className={`font-bold ml-2 ${
                                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isPositive ? `+${adj.delta}` : adj.delta}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 font-mono italic">
                      Initial baseline active. Scoring updates with arguments & evidence.
                    </div>
                  )}
                </div>

                {/* Sub-Metrics Progress Bars */}
                {activeAgent.metrics && Object.keys(activeAgent.metrics).length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-noir-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">
                      Core Performance Metrics
                    </span>
                    {Object.entries(activeAgent.metrics).map(([metricKey, val]) => (
                      <div key={metricKey} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-400 capitalize">
                            {metricKey.replace('_', ' ')}
                          </span>
                          <span className="text-slate-200 font-bold">{val}%</span>
                        </div>
                        <div className="w-full h-1 bg-noir-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(5, val))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Referee Observations Ticker */}
            {observations.length > 0 && (
              <div className="p-2.5 rounded-xl bg-noir-900/60 border border-noir-800">
                <span className="text-[10px] font-mono text-amber-400/90 font-bold uppercase flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Forensic Observation
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "{typeof observations[observations.length - 1] === 'string'
                    ? observations[observations.length - 1]
                    : (observations[observations.length - 1]?.text || '')}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
