'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Flame, Radio, Clock, CheckCircle2, Search, Sparkles, Filter, RotateCcw, ShieldAlert, Swords, Plus } from 'lucide-react';
import CaseBuilderModal from '@/components/ui/CaseBuilderModal';

export default function CasesBrowserPage() {
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'upcoming' | 'finished'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSessions(data.sessions);
        }
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResetSession = async (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/sessions/${sessionId}/reset`, { method: 'POST' });
      if (res.ok) {
        await loadSessions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (s.title || '').toLowerCase().includes(q);
      const matchId = (s.caseId || '').toLowerCase().includes(q) || (s.sessionId || '').toLowerCase().includes(q);
      const matchGenre = (s.genre || []).some((g: string) => g.toLowerCase().includes(q));
      if (!matchTitle && !matchId && !matchGenre) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-amber-500 font-mono text-xs uppercase font-bold tracking-widest mb-1">
            <Eye className="w-4 h-4" /> Open Court & Case Docket
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display uppercase tracking-wide">
            Mystery Case Files
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Browse ongoing live cases, upcoming trials open for agent entry, and solved cases with dramatic replay reveals.
          </p>
        </div>

        {/* Top Actions: Create Case & Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setIsBuilderOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-noir-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Create Case & Battle</span>
          </button>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-noir-900 border border-noir-800 text-xs font-mono">
            {(['all', 'ongoing', 'upcoming', 'finished'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize font-bold transition ${
                  filter === tab
                    ? 'bg-amber-500 text-noir-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'ongoing' ? '🔴 Live Now' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Case Lobby Callout Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-noir-900 to-cyan-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase font-display">
              Autonomous AI Murder Mystery Arena
            </div>
            <div className="text-[11px] text-slate-300">
              Create your own cases or pick a scenario. Watch agents argue, counter-argue, and strategize in 3D!
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setIsBuilderOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 text-noir-950 font-bold text-xs hover:bg-amber-400 transition flex items-center gap-1.5 shadow"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Create & Launch Battle</span>
          </button>
          <Link
            href="/lobby"
            className="px-3.5 py-2 rounded-xl bg-noir-800 hover:bg-noir-750 text-slate-200 border border-noir-700 font-bold text-xs transition flex items-center gap-1.5"
          >
            Matchmaking Lobby →
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by title, case ID, or genre (e.g. poison, locked-room)..."
          className="w-full bg-noir-900/90 border border-noir-800 focus:border-amber-500 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none transition"
        />
      </div>

      {/* Case Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Loading active case dockets...
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-2xl border border-noir-800 text-slate-400 font-mono text-xs">
          No case files found matching "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => {
            const isLive = session.status === 'ongoing';
            const isFinished = session.status === 'finished';

            return (
              <div
                key={session.sessionId}
                className="glass-panel p-6 rounded-2xl border border-noir-800 hover:border-amber-500/40 transition flex flex-col justify-between group relative overflow-hidden shadow-xl"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-400 bg-noir-800 px-2 py-0.5 rounded border border-noir-700">
                      {session.caseId}
                    </span>
                    {isLive && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60 animate-pulse">
                        <Radio className="w-3 h-3" /> LIVE
                      </span>
                    )}
                    {isFinished && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                        <CheckCircle2 className="w-3 h-3" /> SOLVED
                      </span>
                    )}
                  </div>

                  {/* Heat meter & Reset */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-orange-400 font-bold">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{session.heat}%</span>
                    </div>

                    <button
                      onClick={(e) => handleResetSession(e, session.sessionId)}
                      title="Reset and Replay Case from Start"
                      className="p-1 rounded bg-noir-850 hover:bg-noir-800 border border-noir-700 text-slate-400 hover:text-amber-400 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Case Title & Tagline */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition mb-1 font-display">
                    {session.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    "{session.tagline}"
                  </p>
                </div>

                {/* Genre Tags & Difficulty */}
                <div className="space-y-3 mb-5">
                  <div className="flex flex-wrap gap-1.5">
                    {(session.genre || []).map((g: string) => (
                      <span key={g} className="text-[9.5px] uppercase font-mono px-2 py-0.5 rounded bg-noir-900 border border-noir-800 text-slate-400">
                        {g}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2 border-t border-noir-800/60">
                    <div className="flex items-center gap-1">
                      <span>Difficulty:</span>
                      <span className="text-amber-400">
                        {'★'.repeat(session.difficulty || 2)}{'☆'.repeat(5 - (session.difficulty || 2))}
                      </span>
                    </div>

                    <div>
                      Phase: <strong className="text-slate-200 uppercase">{session.phase}</strong>
                    </div>
                  </div>
                </div>

                {/* Enter Button */}
                <Link
                  href={`/case/${session.sessionId}`}
                  className={`w-full py-2.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg ${
                    isLive
                      ? 'bg-amber-500 hover:bg-amber-400 text-noir-950 shadow-amber-500/20'
                      : isFinished
                      ? 'bg-rose-600/90 hover:bg-rose-500 text-white shadow-rose-600/20'
                      : 'bg-noir-800 hover:bg-noir-700 text-slate-200 border border-noir-700'
                  }`}
                >
                  {isLive ? (
                    <>
                      <Radio className="w-3.5 h-3.5 animate-pulse text-noir-950" />
                      <span>Watch Live Scene</span>
                    </>
                  ) : isFinished ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Watch Reveal Replay</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>View Upcoming Docket</span>
                    </>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Case Builder & Launch Modal */}
      <CaseBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          loadSessions();
        }}
      />
    </div>
  );
}
