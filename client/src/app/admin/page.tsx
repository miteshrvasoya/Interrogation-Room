'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Server,
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Bot,
  Users,
  Activity,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Flame,
  AlertTriangle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { sounds } from '@/lib/audio';

export default function AdminConsolePage() {
  const [overview, setOverview] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionEvents, setSelectedSessionEvents] = useState<any>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ovRes, sessRes] = await Promise.all([
        fetch('/api/admin/overview'),
        fetch('/api/admin/sessions')
      ]);

      if (ovRes.ok) {
        const ovData = await ovRes.json();
        setOverview(ovData.stats);
      }
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        setSessions(sessData.sessions || []);
      }
    } catch (e) {
      console.error('Admin fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleForceStart = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}/force-start`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        sounds.playGavel();
        setActionMessage(`Session ${sessionId} force-started into Live Trial!`);
        fetchData();
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAutoplay = async (sessionId: string, currentAutoplay: boolean) => {
    try {
      const endpoint = currentAutoplay ? 'pause' : 'resume';
      const res = await fetch(`/api/admin/sessions/${sessionId}/${endpoint}`, { method: 'POST' });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStepRound = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}/step`, { method: 'POST' });
      if (res.ok) {
        sounds.playGavel();
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}/reset`, { method: 'POST' });
      if (res.ok) {
        sounds.playGavel();
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInspectEvents = async (sessionId: string) => {
    try {
      setEventsLoading(true);
      const res = await fetch(`/api/admin/sessions/${sessionId}/events`);
      if (res.ok) {
        const data = await res.json();
        setSelectedSessionEvents(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEventsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full font-sans text-slate-100">
      {/* Header */}
      <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-noir-900 via-rose-950/30 to-noir-950 border border-rose-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase tracking-widest mb-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Section 41 • Real-Time Engine Operations</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight uppercase text-white">
            Admin Mission Control
          </h1>
          <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Manage active case sessions, monitor node runtime health, force-start pending lobbies, substitute unresponsive external agents with House Bots, and inspect canonical event streams.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2.5 rounded-xl bg-noir-850 hover:bg-noir-800 border border-noir-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-2 transition self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh State</span>
        </button>
      </div>

      {actionMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Diagnostics Cards Grid */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-noir-900 border border-noir-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Total Sessions</span>
            <div className="text-2xl font-bold font-mono text-white">{overview.totalSessions}</div>
            <div className="text-[10px] text-amber-400 font-mono">
              {overview.liveCases} Live • {overview.pendingLobbies} Pending
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-noir-900 border border-noir-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Memory Heap</span>
            <div className="text-2xl font-bold font-mono text-cyan-400">
              {overview.heapUsedMb} <span className="text-xs text-slate-400">MB</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">RSS: {overview.memoryMb} MB</div>
          </div>

          <div className="p-4 rounded-2xl bg-noir-900 border border-noir-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Engine Runtime</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {Math.floor(overview.uptime / 60)}m {overview.uptime % 60}s
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{overview.nodeVersion}</div>
          </div>

          <div className="p-4 rounded-2xl bg-noir-900 border border-noir-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Finished Replays</span>
            <div className="text-2xl font-bold font-mono text-purple-400">
              {overview.finishedReplays}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Ready for Replay</div>
          </div>
        </div>
      )}

      {/* Sessions Management Table */}
      <div className="glass-panel rounded-2xl border border-noir-800 overflow-hidden mb-8">
        <div className="p-4 border-b border-noir-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" /> Active Dockets ({sessions.length})
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">Auto-syncs every 8s</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-noir-950/80 text-slate-400 uppercase text-[10px] border-b border-noir-800">
              <tr>
                <th className="p-3.5">Session ID / Title</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Phase & Round</th>
                <th className="p-3.5">Seats (Real / Bot)</th>
                <th className="p-3.5">Ref Contradictions</th>
                <th className="p-3.5 text-right">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-noir-800/60">
              {sessions.map((s) => {
                const isLive = s.lifecycleStatus === 'live' || s.lifecycleStatus === 'running';
                const isPending = s.lifecycleStatus === 'pending' || s.lifecycleStatus === 'ready';

                return (
                  <tr key={s.sessionId} className="hover:bg-noir-900/60 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-100">{s.title}</div>
                      <div className="text-[10px] text-slate-500">
                        {s.sessionId} • {s.genre} ({s.difficulty})
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isLive
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isPending
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        {s.lifecycleStatus}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="text-slate-200 capitalize">{s.phase}</div>
                      <div className="text-[10px] text-slate-500">
                        Round {s.round} of {s.maxRounds}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="text-slate-200">
                        {s.claimedSeats} / {s.totalSeats} Filled
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {s.realUsersCount} Users • {s.botsCount} Bots
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          s.contradictionsCount > 0
                            ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800'
                            : 'text-slate-500'
                        }`}
                      >
                        {s.contradictionsCount} flagged
                      </span>
                    </td>

                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {isPending && (
                        <button
                          onClick={() => handleForceStart(s.sessionId)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold uppercase transition"
                          title="Auto-fill empty seats and launch live"
                        >
                          Force Start
                        </button>
                      )}

                      {isLive && (
                        <>
                          <button
                            onClick={() => handleToggleAutoplay(s.sessionId, s.autoPlay)}
                            className={`p-1.5 rounded-lg border text-[10px] transition ${
                              s.autoPlay
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            }`}
                            title={s.autoPlay ? 'Pause Autoplay' : 'Resume Autoplay'}
                          >
                            {s.autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleStepRound(s.sessionId)}
                            className="p-1.5 rounded-lg bg-noir-800 hover:bg-noir-750 border border-noir-700 text-slate-300 transition"
                            title="Step Round Manually"
                          >
                            <StepForward className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleResetSession(s.sessionId)}
                        className="p-1.5 rounded-lg bg-noir-800 hover:bg-noir-750 border border-noir-700 text-slate-400 hover:text-rose-400 transition"
                        title="Restart Session to Round 1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleInspectEvents(s.sessionId)}
                        className="px-2.5 py-1 rounded-lg bg-noir-800 hover:bg-noir-750 border border-noir-700 text-cyan-300 text-[10px] transition"
                      >
                        Inspect Log
                      </button>

                      <Link
                        href={`/case/${s.sessionId}`}
                        className="px-2.5 py-1 rounded-lg bg-noir-800 hover:bg-noir-750 border border-noir-700 text-slate-300 text-[10px] inline-flex items-center gap-1 transition"
                      >
                        <span>Stage</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Event Stream Inspector Drawer */}
      {selectedSessionEvents && (
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/40 space-y-4 animate-fade-in font-mono">
          <div className="flex items-center justify-between border-b border-noir-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> Event Stream Inspector: {selectedSessionEvents.sessionId}
              </h3>
              <p className="text-[10px] text-slate-400">
                Total Canonical Events: {selectedSessionEvents.transcript?.length || 0}
              </p>
            </div>
            <button
              onClick={() => setSelectedSessionEvents(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-noir-850 border border-noir-750"
            >
              Close Inspector
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-2 text-xs">
            {selectedSessionEvents.transcript?.map((evt: any, i: number) => (
              <div key={evt.id || i} className="p-3 rounded-xl bg-noir-950 border border-noir-800 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="text-amber-400 font-bold uppercase">
                    R{evt.round} • {evt.phase} • {evt.action}
                  </span>
                  <span>{evt.timestamp}</span>
                </div>
                <div className="text-slate-200">
                  <strong className="text-cyan-300">{evt.agentName || evt.role}:</strong> {evt.narrative}
                </div>
                {evt.thought_summary && (
                  <div className="text-[10px] text-slate-400 italic">
                    Hidden Thought: "{evt.thought_summary}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
