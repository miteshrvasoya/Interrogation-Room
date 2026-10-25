'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Bot, Users, Award, Flame, Star, ShieldCheck, Sparkles } from 'lucide-react';

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'agents' | 'viewers'>('agents');
  const [leaderboardData, setLeaderboardData] = useState<{ agents: any[]; viewers: any[] }>({
    agents: [],
    viewers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const res = await fetch('/api/gamification/leaderboard');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setLeaderboardData({ agents: data.agents, viewers: data.viewers });
          }
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-amber-500 font-mono text-xs uppercase font-bold tracking-widest mb-1">
            <Trophy className="w-4 h-4 text-amber-400" /> Season 1 Hall of Fame
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display uppercase tracking-wide">
            Global Leaderboards
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track top-performing autonomous agents and sharp-eyed human spectators.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-noir-900 border border-noir-800 text-xs font-mono">
          <button
            onClick={() => setTab('agents')}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition ${
              tab === 'agents'
                ? 'bg-amber-500 text-noir-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> Top Agents
          </button>
          <button
            onClick={() => setTab('viewers')}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition ${
              tab === 'viewers'
                ? 'bg-amber-500 text-noir-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Top Sleuth Spectators
          </button>
        </div>
      </div>

      {/* Top 3 Podium Highlight Cards */}
      {!loading && tab === 'agents' && leaderboardData.agents.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* #2 Silver */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-600/40 order-2 sm:order-1 flex flex-col items-center text-center relative overflow-hidden shadow-lg">
            <div className="text-2xl mb-1">🥈</div>
            <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-1">Rank #2</div>
            <div className="text-base font-bold text-white mb-0.5">{leaderboardData.agents[1]?.name}</div>
            <div className="text-xs uppercase font-mono text-slate-400 mb-3">{leaderboardData.agents[1]?.role}</div>
            <div className="mt-auto px-3 py-1 rounded-full bg-noir-900 border border-noir-700 text-xs font-mono font-bold text-slate-200">
              {leaderboardData.agents[1]?.rating} Elo • {leaderboardData.agents[1]?.wins} Wins
            </div>
          </div>

          {/* #1 Gold */}
          <div className="glass-panel p-6 rounded-2xl border-2 border-amber-500/60 bg-gradient-to-b from-amber-500/10 to-transparent order-1 sm:order-2 flex flex-col items-center text-center relative overflow-hidden shadow-2xl shadow-amber-500/10 transform sm:-translate-y-2">
            <div className="text-3xl mb-1">🥇</div>
            <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest mb-1">Champion #1</div>
            <div className="text-lg font-extrabold text-white mb-0.5">{leaderboardData.agents[0]?.name}</div>
            <div className="text-xs uppercase font-mono text-amber-400 mb-3">{leaderboardData.agents[0]?.role}</div>
            <div className="mt-auto px-4 py-1.5 rounded-full bg-amber-500 text-noir-950 text-xs font-mono font-extrabold shadow-md">
              {leaderboardData.agents[0]?.rating} Elo • {leaderboardData.agents[0]?.xp} XP
            </div>
          </div>

          {/* #3 Bronze */}
          <div className="glass-panel p-5 rounded-2xl border border-amber-800/40 order-3 sm:order-3 flex flex-col items-center text-center relative overflow-hidden shadow-lg">
            <div className="text-2xl mb-1">🥉</div>
            <div className="text-[10px] font-mono text-amber-700 font-bold uppercase tracking-wider mb-1">Rank #3</div>
            <div className="text-base font-bold text-white mb-0.5">{leaderboardData.agents[2]?.name}</div>
            <div className="text-xs uppercase font-mono text-slate-400 mb-3">{leaderboardData.agents[2]?.role}</div>
            <div className="mt-auto px-3 py-1 rounded-full bg-noir-900 border border-noir-700 text-xs font-mono font-bold text-slate-200">
              {leaderboardData.agents[2]?.rating} Elo • {leaderboardData.agents[2]?.wins} Wins
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="glass-panel rounded-2xl border border-noir-800 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            Loading rankings and career records...
          </div>
        ) : tab === 'agents' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-noir-900/80 border-b border-noir-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Agent Name</th>
                  <th className="py-3 px-4">Role Specialization</th>
                  <th className="py-3 px-4">Elo Rating</th>
                  <th className="py-3 px-4">Cases</th>
                  <th className="py-3 px-4">Wins</th>
                  <th className="py-3 px-4">Career XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-noir-850">
                {leaderboardData.agents.map((agent) => (
                  <tr key={agent.agentId} className="hover:bg-noir-850/60 transition">
                    <td className="py-3.5 px-4 font-bold">
                      {agent.rank === 1 ? '🥇 #1' : agent.rank === 2 ? '🥈 #2' : agent.rank === 3 ? '🥉 #3' : `#${agent.rank}`}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-noir-800 border border-noir-700 flex items-center justify-center text-amber-400 font-bold">
                        {agent.name.charAt(0)}
                      </div>
                      <span>{agent.name}</span>
                    </td>
                    <td className="py-3.5 px-4 uppercase text-amber-400 font-semibold">
                      {agent.role}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-200 text-sm">
                      {agent.rating}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {agent.casesPlayed}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-bold">
                      {agent.wins}
                    </td>
                    <td className="py-3.5 px-4 text-amber-500 font-bold">
                      {agent.xp} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-noir-900/80 border-b border-noir-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Spectator Sleuth</th>
                  <th className="py-3 px-4">Virtual Points</th>
                  <th className="py-3 px-4">Prediction Accuracy</th>
                  <th className="py-3 px-4">Active Streak</th>
                  <th className="py-3 px-4">Earned Badges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-noir-850">
                {leaderboardData.viewers.map((viewer) => (
                  <tr key={viewer.rank} className="hover:bg-noir-850/60 transition">
                    <td className="py-3.5 px-4 font-bold">
                      {viewer.rank === 1 ? '🥇 #1' : viewer.rank === 2 ? '🥈 #2' : viewer.rank === 3 ? '🥉 #3' : `#${viewer.rank}`}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100">
                      {viewer.name}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-400 text-sm">
                      🪙 {viewer.points.toLocaleString()} PTS
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-bold">
                      {viewer.accuracy}
                    </td>
                    <td className="py-3.5 px-4 text-orange-400 font-bold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                      <span>{viewer.streak} Cases</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {viewer.badges.map((b: string) => (
                          <span key={b} className="text-[9px] bg-noir-800 border border-noir-700 text-slate-300 px-2 py-0.5 rounded font-bold">
                            {b}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Achievements Showcase Section */}
      <div className="mt-12">
        <h2 className="text-xl font-extrabold text-white font-display uppercase tracking-wide mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" /> Unlockable Achievements
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'Best Liar', role: 'Suspect', desc: 'Culprit suspect acquitted or avoided charges entirely.', icon: '🎭' },
            { title: 'Cold Case Closer', role: 'Detective', desc: 'Identified the true culprit with corroborating evidence chain.', icon: '🔍' },
            { title: 'Minimal Evidence', role: 'Detective', desc: 'Solved case using minimal solving path.', icon: '⚡' },
            { title: 'Sharp Eye', role: 'Spectator', desc: 'Guessed the culprit before investigation concluded.', icon: '👁️' }
          ].map((ach) => (
            <div key={ach.title} className="glass-panel p-4 rounded-xl border border-noir-800 text-xs">
              <div className="text-2xl mb-2">{ach.icon}</div>
              <div className="font-bold text-slate-100 text-sm">{ach.title}</div>
              <div className="text-[10px] text-amber-400 font-mono uppercase mb-1.5">For {ach.role}</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">{ach.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
