'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Bot,
  Trophy,
  Coins,
  ShieldCheck,
  Flame,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  History,
  CheckCircle2,
  Lock,
  Plus
} from 'lucide-react';

export default function UserProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/gamification/profile/local-user');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setProfile(data.profile);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400 font-mono text-xs">
        Loading Sleuth Dossier...
      </div>
    );
  }

  const user = profile || {
    username: 'DetectiveSleuth',
    level: 12,
    xp: 4850,
    tokenBalance: 1250,
    predictionAccuracy: '81%',
    currentStreak: 5,
    casesAttended: 14,
    equippedTitle: 'Master Detective',
    badges: ['Sharp Eye', 'Cold Case Closer', 'Evidence Hunter'],
    roster: []
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full font-sans text-slate-100">
      {/* Dossier Header Card */}
      <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-noir-900 via-amber-950/20 to-noir-950 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-3xl shadow-xl shrink-0">
              🕵️‍♂️
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                  {user.equippedTitle}
                </span>
                <span className="text-[10px] font-mono text-slate-400">Level {user.level}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white uppercase">
                {user.username}
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Sworn Sleuth • {user.casesAttended} Cases Attended
              </p>
            </div>
          </div>

          {/* Quick Bankroll & Accuracy Pill Group */}
          <div className="grid grid-cols-3 gap-3 bg-noir-950/80 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-noir-750 font-mono text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Virtual Tokens</span>
              <span className="text-base sm:text-lg font-extrabold text-amber-400 flex items-center justify-center gap-1">
                <Coins className="w-3.5 h-3.5" /> {user.tokenBalance}
              </span>
            </div>
            <div className="border-x border-noir-800">
              <span className="text-[10px] text-slate-400 uppercase block">Accuracy</span>
              <span className="text-base sm:text-lg font-extrabold text-cyan-400">
                {user.predictionAccuracy}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Win Streak</span>
              <span className="text-base sm:text-lg font-extrabold text-rose-400 flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 animate-pulse" /> {user.currentStreak}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Agent Stable / Roster (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-noir-800 space-y-4">
            <div className="flex items-center justify-between border-b border-noir-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
                  <Bot className="w-4 h-4 text-amber-400" /> My Autonomous Agent Stable ({user.roster?.length || 0})
                </h2>
                <p className="text-[11px] text-slate-400">
                  Agents registered under your account capable of claiming seats in live trials.
                </p>
              </div>

              <Link
                href="/agent-portal"
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-noir-950 font-bold text-xs uppercase flex items-center gap-1.5 transition shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Build Agent</span>
              </Link>
            </div>

            {user.roster && user.roster.length > 0 ? (
              <div className="space-y-3 font-mono text-xs">
                {user.roster.map((agt: any) => (
                  <div
                    key={agt.agentId}
                    className="p-4 rounded-xl bg-noir-900 border border-noir-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                          {agt.name}
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 capitalize font-normal">
                            {agt.role.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          ID: {agt.agentId} • Archetype: <strong>{agt.archetype || agt.persona}</strong>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-400">{agt.rating} Elo</span>
                        <div className="text-[10px] text-slate-400">
                          {agt.wins || 0} Wins / {agt.casesPlayed || 0} Cases
                        </div>
                      </div>
                    </div>

                    {agt.identity?.catchphrase && (
                      <div className="text-[11px] text-cyan-300 italic">
                        "{agt.identity.catchphrase}"
                      </div>
                    )}

                    {/* Personality Sliders Snapshot */}
                    {agt.sliders && (
                      <div className="pt-2 border-t border-noir-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                        <div>Logical: <strong className="text-slate-200">{agt.sliders.logical}%</strong></div>
                        <div>Aggressive: <strong className="text-slate-200">{agt.sliders.aggressive}%</strong></div>
                        <div>Sarcastic: <strong className="text-slate-200">{agt.sliders.sarcastic}%</strong></div>
                        <div>Confident: <strong className="text-slate-200">{agt.sliders.confident}%</strong></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-noir-900 border border-dashed border-noir-750 space-y-3">
                <Bot className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-mono">No autonomous agents created yet.</p>
                <Link
                  href="/agent-portal"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-noir-950 font-bold text-xs uppercase transition shadow"
                >
                  Create Your First Agent
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Badges & Honors (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-noir-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2 border-b border-noir-800 pb-3">
              <Award className="w-4 h-4 text-cyan-400" /> Sleuth Badges & Honors
            </h2>

            <div className="space-y-2.5">
              {user.badges?.map((b: string, i: number) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-noir-900 border border-noir-800 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-base shrink-0">
                    🎖️
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100">{b}</div>
                    <div className="text-[10px] text-emerald-400 font-mono">Verified Credential</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="/rewards"
                className="w-full text-center py-2 rounded-xl bg-noir-850 hover:bg-noir-800 border border-noir-750 text-slate-300 text-xs font-bold uppercase block transition"
              >
                View Rewards Hub
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
