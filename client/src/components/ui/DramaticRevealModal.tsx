'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  Trophy,
  Clock,
  Brain,
  Share2,
  ShieldAlert,
  Check,
  Star,
  Award,
  AlertOctagon,
  Flame,
  Laugh,
  PlayCircle,
  FileCheck2
} from 'lucide-react';

interface EndCaseReport {
  caseClosed: boolean;
  culpritName: string;
  caseDifficulty: string;
  bestAgent?: { name: string; role: string; score: number };
  bestArgument?: { agentName: string; text: string; phase: string };
  mostImportantClue?: { name: string; type: string };
  biggestMistake?: { agentName: string; text: string; phase: string };
  audienceAccuracy?: number;
  totalAudienceBets?: number;
  funStatistics?: Record<string, string>;
}

interface DramaticRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseTitle: string;
  revealData: {
    culprits: string[];
    crime: any;
    true_timeline: any[];
    reveal_narration: string;
    epilogue: string;
    finalScores: any[];
    endCaseReport?: EndCaseReport;
    replayChapters?: any[];
  } | null;
  characters: any[];
  transcript: any[];
  onStartReplay?: () => void;
}

export default function DramaticRevealModal({
  isOpen,
  onClose,
  caseTitle,
  revealData,
  characters,
  transcript,
  onStartReplay
}: DramaticRevealModalProps) {
  const [activeTab, setActiveTab] = useState<'report' | 'culprit' | 'funStats' | 'timeline' | 'thoughts' | 'scores'>('report');
  const [copiedCard, setCopiedCard] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch (_) { }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !revealData) return null;

  const culpritChars = characters.filter((c) => revealData.culprits?.includes(c.id));
  const thoughtEvents = transcript.filter((t) => t.thought_summary && t.thought_summary.trim().length > 0);
  const report = revealData.endCaseReport;
  const funStats = report?.funStatistics || {};

  const handleShareCard = () => {
    const bestAgentStr = report?.bestAgent ? `🌟 MVP Agent: ${report.bestAgent.name} (${report.bestAgent.score} pts)\n` : '';
    const text = `🕵️ Case Solved: "${caseTitle}"\n⚖️ Culprit: ${culpritChars.map((c) => c.name).join(', ')}\n${bestAgentStr}🎯 Audience Accuracy: ${report?.audienceAccuracy || 67}%\n🔗 Watch Replay & Interrogate: https://interrogation-room.ai`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2000);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto animate-fade-in"
    >
      <div className="w-full max-w-4xl glass-panel bg-noir-950/98 p-6 sm:p-8 rounded-3xl border border-amber-500/50 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          title="Close Reveal (Esc)"
          className="w-8 h-8 rounded-lg bg-noir-850 hover:bg-noir-800 border border-noir-700 flex items-center justify-center text-slate-400 hover:text-white absolute right-4 top-4 transition z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 text-amber-500 mb-0.5">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <h2 className="font-bold text-xl text-slate-100 uppercase tracking-wider font-display">
                The Dramatic Reveal: Case Closed
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Docket: {caseTitle} • Forensic Truth & Master Referee Audit
            </p>
          </div>

          {onStartReplay && (
            <button
              onClick={() => {
                onClose();
                onStartReplay();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-noir-950 font-mono font-bold text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition self-start sm:self-auto"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Watch Chapter Replay</span>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center overflow-x-auto border-b border-noir-800 gap-2 mb-6 pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('report')}
            className={`pb-2.5 px-2 text-xs font-bold tracking-wider uppercase border-b-2 transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'report'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck2 className="w-4 h-4" /> Master Referee Report
          </button>
          <button
            onClick={() => setActiveTab('culprit')}
            className={`pb-2.5 px-2 text-xs font-bold tracking-wider uppercase border-b-2 transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'culprit'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> The Culprit
          </button>
          <button
            onClick={() => setActiveTab('funStats')}
            className={`pb-2.5 px-2 text-xs font-bold tracking-wider uppercase border-b-2 transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'funStats'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laugh className="w-4 h-4" /> Fun Statistics
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-2.5 px-2 text-xs font-bold tracking-wider uppercase border-b-2 transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" /> True Timeline
          </button>
          <button
            onClick={() => setActiveTab('thoughts')}
            className={`pb-2.5 px-2 text-xs font-bold tracking-wider uppercase border-b-2 transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'thoughts'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-4 h-4" /> Agent Thoughts ({thoughtEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('scores')}
            className={`pb-2.5 px-2 text-xs font-bold tracking-wider uppercase border-b-2 transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'scores'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" /> Final Ratings & Elo
          </button>
        </div>

        {/* TAB 1: MASTER REFEREE END-OF-CASE REPORT (Section 52) */}
        {activeTab === 'report' && (
          <div className="space-y-4 animate-fade-in font-sans">
            {/* Cinematic Summary Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-noir-900 via-amber-950/20 to-noir-950 border border-amber-500/40 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Culprit Box */}
              <div className="p-3.5 rounded-xl bg-noir-850/80 border border-rose-500/30">
                <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block mb-1">
                  Culprit Identified
                </span>
                <h4 className="text-base font-bold text-white">
                  {report?.culpritName || culpritChars.map((c) => c.name).join(', ')}
                </h4>
                <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                  <span>Difficulty:</span>
                  <span className="text-amber-400 font-bold">{report?.caseDifficulty || '★★★★☆'}</span>
                </div>
              </div>

              {/* Best Agent MVP */}
              <div className="p-3.5 rounded-xl bg-noir-850/80 border border-amber-500/30">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block mb-1 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Best Agent (MVP)
                </span>
                <h4 className="text-base font-bold text-white">
                  {report?.bestAgent?.name || 'Detective Holmes'}
                </h4>
                <div className="text-[10px] text-emerald-400 font-mono mt-1 font-bold">
                  Score: {report?.bestAgent?.score || 91} PTS •{' '}
                  <span className="capitalize">{report?.bestAgent?.role || 'detective'}</span>
                </div>
              </div>

              {/* Audience Accuracy */}
              <div className="p-3.5 rounded-xl bg-noir-850/80 border border-cyan-500/30">
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block mb-1">
                  Audience Accuracy
                </span>
                <h4 className="text-xl font-bold font-mono text-cyan-300">
                  {report?.audienceAccuracy || 63}%
                </h4>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  Total Predictions: {report?.totalAudienceBets || 128} bets
                </div>
              </div>
            </div>

            {/* Key Forensic Moments */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-noir-900 border border-noir-800">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block mb-1">
                  Most Important Clue
                </span>
                <div className="font-bold text-slate-200">
                  {report?.mostImportantClue?.name || 'Foxglove Tea Residue'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono capitalize">
                  Type: {report?.mostImportantClue?.type || 'Physical Evidence'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-noir-900 border border-noir-800">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block mb-1">
                  Best Argument
                </span>
                <div className="font-bold text-slate-200">
                  {report?.bestArgument?.agentName || 'Defense Attorney'}
                </div>
                <p className="text-[11px] text-slate-400 italic line-clamp-2 mt-0.5">
                  "{report?.bestArgument?.text || 'Dissected the timeline discrepancy around the conservatory door.'}"
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-noir-900 border border-noir-800">
                <span className="text-[10px] font-mono text-rose-400 font-bold uppercase block mb-1">
                  Biggest Mistake
                </span>
                <div className="font-bold text-slate-200">
                  {report?.biggestMistake?.agentName || 'Prosecutor Fury'}
                </div>
                <p className="text-[11px] text-rose-300/80 italic line-clamp-2 mt-0.5">
                  "{report?.biggestMistake?.text || 'Overlooked the encrypted security logs in Round 2.'}"
                </p>
              </div>
            </div>

            {/* Shareable Card Footer */}
            <div className="p-4 rounded-xl bg-noir-900 border border-noir-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-100">Share Forensic Case Verdict</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Copy this dossier summary to post on X, Discord or GitHub
                </div>
              </div>
              <button
                onClick={handleShareCard}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-noir-950 font-bold text-xs uppercase flex items-center gap-1.5 transition shadow"
              >
                {copiedCard ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                {copiedCard ? 'Copied to Clipboard!' : 'Share Dossier'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: THE CULPRIT */}
        {activeTab === 'culprit' && (
          <div className="space-y-6 animate-fade-in">
            {/* Culprit Spotlight Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/60 to-noir-900 border border-rose-700/60 flex flex-col sm:flex-row items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-noir-850 border-2 border-rose-500 flex items-center justify-center text-rose-400 shadow-xl text-3xl font-bold font-mono">
                🚨
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="text-[10px] font-mono uppercase text-rose-400 font-bold tracking-widest mb-1">
                  OFFICIAL PERPETRATOR
                </div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {culpritChars.map((c) => c.name).join(', ')}
                </h3>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  <strong>Motive:</strong> {revealData.crime?.motive}
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  <strong>Method:</strong> {revealData.crime?.method}
                </p>
              </div>
            </div>

            {/* Narration & Epilogue */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-noir-900/80 border border-noir-800 text-xs leading-relaxed text-slate-300">
                <div className="font-bold text-amber-400 mb-1 uppercase font-mono text-[10px]">
                  Reveal Narration:
                </div>
                {revealData.reveal_narration}
              </div>

              <div className="p-4 rounded-xl bg-noir-900/80 border border-noir-800 text-xs leading-relaxed text-slate-300 italic">
                <div className="font-bold text-slate-400 mb-1 uppercase font-mono text-[10px] not-italic">
                  Case Epilogue:
                </div>
                "{revealData.epilogue}"
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FUNNY & RIDICULOUS STATISTICS (Section 53) */}
        {activeTab === 'funStats' && (
          <div className="space-y-3 max-h-[440px] overflow-y-auto pr-2 animate-fade-in font-sans">
            <p className="text-xs text-slate-400 mb-2 font-mono">
              The Master Referee tracked these absurd, dramatic, and chaotic highlights during the trial:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-noir-900 border border-purple-500/30">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase block mb-1">
                  ⚖️ Most Dramatic Objection
                </span>
                <p className="text-slate-200 font-medium leading-snug">
                  {funStats.mostDramaticObjection || 'Attorney Cross slamming the bench at Round 3'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-noir-900 border border-amber-500/30">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block mb-1">
                  👀 Most Suspicious Pause
                </span>
                <p className="text-slate-200 font-medium leading-snug">
                  {funStats.mostSuspiciousPause || 'Dr. Mehta pausing 4.2 seconds before answering the alibi'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-noir-900 border border-rose-500/30">
                <span className="text-[10px] font-mono text-rose-400 font-bold uppercase block mb-1">
                  🎯 Most Confident Wrong Accusation
                </span>
                <p className="text-slate-200 font-medium leading-snug">
                  {funStats.mostConfidentWrongAccusation || 'Accusing the gardener with 100% confidence'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-noir-900 border border-cyan-500/30">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block mb-1">
                  ⚡ Fastest Accusation
                </span>
                <p className="text-slate-200 font-medium leading-snug">
                  {funStats.fastestAccusation || 'Detective Vance claiming foul play in Round 1'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-noir-900 border border-emerald-500/30">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block mb-1">
                  🗣️ Most Questioned Character
                </span>
                <p className="text-slate-200 font-medium leading-snug">
                  {funStats.mostQuestionedCharacter || 'The Estate Butler (Interrogated 5 times)'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-noir-900 border border-blue-500/30">
                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase block mb-1">
                  🔥 Biggest Comeback
                </span>
                <p className="text-slate-200 font-medium leading-snug">
                  {funStats.biggestComeback || 'Defense rebutting the forensic toxicity report'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-noir-900 border border-orange-500/30">
                <span className="text-[10px] font-mono text-orange-400 font-bold uppercase block mb-1">
                  🌪️ Most Chaotic Agent
                </span>
                <p className="text-slate-200 font-medium leading-snug">
                  {funStats.mostChaoticAgent || 'Agent Wildcard filing 3 contradictory motions'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-noir-900 border border-pink-500/30">
                <span className="text-[10px] font-mono text-pink-400 font-bold uppercase block mb-1">
                  🎭 Most Dramatic Confession
                </span>
                <p className="text-slate-200 font-medium leading-snug">
                  {funStats.mostDramaticConfession || 'Breaking down under the foxglove poison evidence'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TRUE TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 animate-fade-in font-sans">
            {revealData.true_timeline.map((step, idx) => (
              <div
                key={step.id || idx}
                className="p-3.5 rounded-xl bg-noir-900/80 border border-noir-800 text-xs flex gap-3.5"
              >
                <div className="text-center min-w-[70px]">
                  <div className="text-[11px] font-bold text-amber-400 font-mono">{step.time}</div>
                  <div className="text-[9px] text-slate-500 font-mono uppercase">{step.id}</div>
                </div>
                <div className="flex-1 border-l border-noir-800 pl-3">
                  <div className="text-slate-200 font-medium leading-relaxed">{step.event}</div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    Actors:{' '}
                    {step.actor_ids
                      ?.map((aId: string) => characters.find((c) => c.id === aId)?.name || aId)
                      .join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: AGENT THOUGHT SUMMARIES */}
        {activeTab === 'thoughts' && (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 animate-fade-in font-sans">
            <p className="text-xs text-slate-400 mb-2 font-mono">
              These internal thought summaries were strictly hidden during the game and recorded round-by-round.
            </p>
            {thoughtEvents.map((t) => (
              <div key={t.id} className="p-3 rounded-xl bg-noir-900/80 border border-noir-800 text-xs">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                  <span className="font-bold text-amber-400 uppercase">
                    {t.agentName || t.role}
                  </span>
                  <span>
                    R{t.round} • {t.phase?.toUpperCase()}
                  </span>
                </div>
                <div className="text-slate-300 mb-1.5 italic">"{t.narrative}"</div>
                <div className="p-2 rounded-lg bg-noir-850 border border-noir-700/60 text-cyan-300 font-mono text-[11px] flex items-start gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] block">Internal Thought:</span>
                    {t.thought_summary}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: FINAL SCORES & ELO */}
        {activeTab === 'scores' && (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 animate-fade-in font-sans">
            {revealData.finalScores.map((score, idx) => (
              <div
                key={score.agentId || idx}
                className="p-3.5 rounded-xl bg-noir-900/80 border border-noir-800 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                    {score.displayName}
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        score.outcome === 'win'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : score.outcome === 'partial'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {score.outcome.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Role: {score.role} • {score.reason}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-slate-200">
                    {score.newRating}{' '}
                    <span
                      className={score.eloDelta >= 0 ? 'text-emerald-400 text-xs' : 'text-rose-400 text-xs'}
                    >
                      ({score.eloDelta >= 0 ? `+${score.eloDelta}` : score.eloDelta})
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-400">+{score.xpEarned} XP</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
