'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '@/lib/socket';
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  Radio,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Zap,
  Trophy,
  ChevronRight,
  Flame,
  Award,
  ShieldCheck,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import { sounds } from '@/lib/audio';
import SeatSelectionModal from '@/components/ui/SeatSelectionModal';
import ReadyCheckModal from '@/components/ui/ReadyCheckModal';

// Current demo player session profile
const CURRENT_USER = {
  userId: 'usr-local-player',
  username: 'Chief Investigator'
};

export default function CaseLobbyPage() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  const [lobbies, setLobbies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<number | 'all'>('all');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [filterSize, setFilterSize] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Modals state
  const [selectedLobby, setSelectedLobby] = useState<any | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<any | null>(null);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [isReadyModalOpen, setIsReadyModalOpen] = useState(false);
  const [quickJoinLoading, setQuickJoinLoading] = useState(false);

  // User XP and achievements
  const [userXP, setUserXP] = useState(1450);
  const userLevel = Math.floor(userXP / 500) + 1;

  const fetchLobbies = async () => {
    try {
      const res = await fetch('/api/lobby/cases');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLobbies(data.lobbies);
          // If modal is open for a lobby, refresh its state
          if (selectedLobby) {
            const updated = data.lobbies.find((l: any) => l.sessionId === selectedLobby.sessionId);
            if (updated) setSelectedLobby(updated);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load lobbies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLobbies();

    // Setup real-time socket connection
    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_lobby');
    });

    socket.on('lobby_list', (list: any[]) => {
      setLobbies(list);
    });

    socket.on('lobby_updated', (updatedLobby: any) => {
      setLobbies(prev => prev.map(l => l.sessionId === updatedLobby.sessionId ? updatedLobby : l));
      setSelectedLobby((prev: any) => prev && prev.sessionId === updatedLobby.sessionId ? updatedLobby : prev);
    });

    socket.on('lobby_summary_updated', () => {
      fetchLobbies();
    });

    socket.on('case_started', ({ sessionId }: any) => {
      sounds.playGavel();
      router.push(`/case/${sessionId}`);
    });

    const interval = setInterval(fetchLobbies, 4000);
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  // Quick Join logic: Matches into best-fit case
  const handleQuickJoin = async () => {
    setQuickJoinLoading(true);
    try {
      const res = await fetch('/api/lobby/quick-join');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const lobby = lobbies.find(l => l.sessionId === data.sessionId);
          if (lobby) {
            sounds.playGavel();
            setSelectedLobby(lobby);
            setSelectedSeat(data.recommendedSeat);
            setIsSeatModalOpen(true);
          }
        }
      } else {
        alert('All pending cases are currently filled! You can create a new case or force start with bots.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQuickJoinLoading(false);
    }
  };

  // Force start with bots (lobby expiry fallback)
  const handleForceStartWithBots = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/lobby/cases/${sessionId}/fill-bots`, { method: 'POST' });
      if (res.ok) {
        sounds.playGavel();
        await fetchLobbies();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenSeatModal = (lobby: any, seat: any) => {
    setSelectedLobby(lobby);
    setSelectedSeat(seat);
    setIsSeatModalOpen(true);
  };

  const handleOpenReadyModal = (lobby: any) => {
    setSelectedLobby(lobby);
    setIsReadyModalOpen(true);
  };

  const handleConfirmReady = async (seatKey: string) => {
    if (!selectedLobby) return;
    try {
      const res = await fetch(`/api/lobby/cases/${selectedLobby.sessionId}/ready-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatKey,
          userId: CURRENT_USER.userId,
          agentId: 'agt-player'
        })
      });
      if (res.ok) {
        sounds.playGavel();
        setUserXP(prev => prev + 150);
        await fetchLobbies();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter computation
  const filteredLobbies = lobbies.filter(lobby => {
    if (filterDifficulty !== 'all' && lobby.difficulty !== filterDifficulty) return false;
    if (filterGenre !== 'all' && !(lobby.genre || []).includes(filterGenre.toLowerCase())) return false;
    if (filterSize !== 'all') {
      const seats = lobby.seats.length;
      if (filterSize === 'small' && (seats < 5 || seats > 6)) return false;
      if (filterSize === 'medium' && (seats < 7 || seats > 8)) return false;
      if (filterSize === 'large' && seats < 9) return false;
    }
    if (filterRole !== 'all') {
      const hasOpenRole = lobby.seats.some((s: any) => s.status === 'open' && s.role === filterRole);
      if (!hasOpenRole) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (lobby.title || '').toLowerCase().includes(q);
      const matchTagline = (lobby.tagline || '').toLowerCase().includes(q);
      const matchCaseId = (lobby.caseId || '').toLowerCase().includes(q);
      const matchSetting = (lobby.setting?.location || '').toLowerCase().includes(q);
      if (!matchTitle && !matchTagline && !matchCaseId && !matchSetting) return false;
    }
    return true;
  });

  // Calculate live global stats
  const totalOpenSeats = lobbies.reduce((acc, l) => acc + l.seats.filter((s: any) => s.status === 'open').length, 0);
  const totalRequiredWaiting = lobbies.reduce((acc, l) => acc + l.seats.filter((s: any) => s.required && s.status === 'open').length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full space-y-8">
      {/* Hero Matchmaking Docket Header */}
      <div className="relative rounded-3xl p-6 sm:p-8 border border-noir-700/80 bg-gradient-to-br from-noir-950 via-noir-900 to-noir-950 shadow-2xl overflow-hidden">
        {/* Ambient Decorative Lighting */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-xs uppercase font-bold tracking-widest shadow-sm">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              Multiplayer Agent Matchmaking Hub
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white font-display uppercase tracking-wider">
              Pending Case Lobby
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Cases sit in a pending state until real participants have filled every required seat. Assign your built-in or external autonomous agents, observe anti-collusion protocols, and launch into the live 3D courtroom.
            </p>
          </div>

          {/* Quick Join & Player Dossier Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-start lg:self-auto">
            {/* Quick Join Button */}
            <button
              onClick={handleQuickJoin}
              disabled={quickJoinLoading}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-noir-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition transform active:scale-95"
            >
              <Zap className="w-4 h-4 fill-current text-noir-950" />
              {quickJoinLoading ? 'Matching...' : 'Quick Join Best-Fit'}
            </button>

            {/* User XP Gamification Pill */}
            <div className="p-3 rounded-2xl bg-noir-900/90 border border-noir-700/80 shadow-inner flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold font-mono text-xs shadow-inner">
                L{userLevel}
              </div>
              <div className="text-left font-mono">
                <div className="text-[11px] font-bold text-slate-200">{CURRENT_USER.username}</div>
                <div className="text-[10px] text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {userXP} XP (Rank {userLevel})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="mt-8 pt-6 border-t border-noir-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-noir-950/60 border border-noir-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Open Lobbies</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">{lobbies.length} Pending</div>
          </div>
          <div className="p-3 rounded-xl bg-noir-950/60 border border-noir-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Available Seats</div>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">{totalOpenSeats} Open</div>
          </div>
          <div className="p-3 rounded-xl bg-noir-950/60 border border-noir-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Seats Still Required</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">{totalRequiredWaiting} Needed</div>
          </div>
          <div className="p-3 rounded-xl bg-noir-950/60 border border-noir-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Verified Runtime</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> 100% Enforced
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Filter & Search Bar */}
      <div className="space-y-3">
        {/* Search & Difficulty Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by case title, mystery tags, setting location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-noir-900 border border-noir-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          {/* Difficulty Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-noir-900 border border-noir-800 text-xs font-mono">
            <span className="text-[10px] text-slate-500 uppercase px-2 font-bold">Difficulty:</span>
            {(['all', 1, 2, 3, 4, 5] as const).map(d => (
              <button
                key={d}
                onClick={() => setFilterDifficulty(d)}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  filterDifficulty === d
                    ? 'bg-amber-500 text-noir-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d === 'all' ? 'All' : `★ ${d}`}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Tags (Genre, Size, Needed Roles) */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Genre:</span>
          {['all', 'heist', 'cyberpunk', 'mystery', 'corporate', 'nautical', 'theatrical', 'conspiracy'].map(g => (
            <button
              key={g}
              onClick={() => setFilterGenre(g)}
              className={`px-2.5 py-1 rounded-lg capitalize transition text-[10.5px] ${
                filterGenre === g
                  ? 'bg-noir-700 text-amber-400 border border-amber-500/50'
                  : 'bg-noir-900/60 border border-noir-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {g}
            </button>
          ))}

          <span className="text-[10px] text-slate-500 uppercase font-bold ml-2">Size:</span>
          {(['all', 'small', 'medium', 'large'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterSize(s)}
              className={`px-2.5 py-1 rounded-lg capitalize transition text-[10.5px] ${
                filterSize === s
                  ? 'bg-noir-700 text-cyan-400 border border-cyan-500/50'
                  : 'bg-noir-900/60 border border-noir-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {s === 'all' ? 'All Sizes' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Lobbies Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
          Loading case docket and active lobbies...
        </div>
      ) : filteredLobbies.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-noir-800 rounded-3xl bg-noir-950/40 p-8 space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-500/80 mx-auto" />
          <h3 className="text-base font-bold text-white uppercase font-display">No Matching Lobbies</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search query, difficulty, or genre filters to discover open cases.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterDifficulty('all');
              setFilterGenre('all');
              setFilterSize('all');
            }}
            className="px-4 py-2 rounded-xl bg-noir-800 text-amber-400 border border-amber-500/30 text-xs font-bold font-mono hover:bg-noir-700 transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLobbies.map((lobby) => {
            const isReady = lobby.lifecycleStatus === 'ready' || lobby.stats.isReadyToStart;
            const confirmedRequired = lobby.stats.confirmedRequiredSeats;
            const totalRequired = lobby.stats.requiredSeats;
            const fillPct = lobby.stats.fillPercentage;

            return (
              <div
                key={lobby.sessionId}
                className="group relative rounded-2xl bg-noir-900 border border-noir-800 hover:border-amber-500/40 shadow-xl overflow-hidden flex flex-col transition duration-300"
              >
                {/* Card Top Atmospheric Header */}
                <div className="p-5 bg-gradient-to-b from-noir-950 via-noir-950/90 to-noir-900 border-b border-noir-800/80">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        {lobby.caseId}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ★ Diff {lobby.difficulty}
                      </span>
                    </div>

                    {isReady ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                        <CheckCircle2 className="w-3 h-3" /> READY CHECK
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        <Radio className="w-3 h-3 animate-ping" /> LOBBY OPEN
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white font-display group-hover:text-amber-400 transition line-clamp-1">
                    {lobby.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[2rem]">
                    {lobby.tagline}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-noir-800/60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> ~{lobby.estimatedLengthMin} Min
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">{lobby.setting?.location || 'Chamber'}</span>
                  </div>
                </div>

                {/* Fill Meter Bar */}
                <div className="px-5 py-3 bg-noir-950/40 border-b border-noir-800/60">
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-slate-400 text-[11px]">Seat Fill Rate</span>
                    <span className="font-bold text-slate-200 text-[11px]">
                      {confirmedRequired} / {totalRequired} Required ({fillPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-noir-950 border border-noir-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isReady
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : fillPct > 50
                          ? 'bg-gradient-to-r from-cyan-500 to-amber-500'
                          : 'bg-gradient-to-r from-amber-600 to-amber-400'
                      }`}
                      style={{ width: `${Math.max(8, fillPct)}%` }}
                    />
                  </div>
                </div>

                {/* Interactive Seat Map */}
                <div className="p-5 flex-1 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">
                    <span>Seat Roster ({lobby.seats.length} total)</span>
                    <span className="text-[10px] text-slate-500">Click to Select</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {lobby.seats.map((s: any) => {
                      const isClaimed = s.status === 'confirmed';
                      const isPendingApp = s.status === 'pending_approval';

                      return (
                        <div
                          key={s.seatKey}
                          onClick={() => handleOpenSeatModal(lobby, s)}
                          className={`p-2 rounded-xl border text-left cursor-pointer transition flex items-center justify-between text-xs ${
                            isClaimed
                              ? 'bg-noir-950/80 border-noir-800 hover:border-slate-600'
                              : isPendingApp
                              ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-400'
                              : s.required
                              ? 'bg-noir-950/40 border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/5'
                              : 'bg-noir-950/20 border-noir-800/60 hover:border-noir-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                              s.side === 'court' ? 'bg-amber-500/20 text-amber-400' :
                              s.side === 'prosecution' ? 'bg-rose-500/20 text-rose-400' :
                              s.side === 'investigation' ? 'bg-cyan-500/20 text-cyan-400' :
                              s.side === 'defense' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {s.roleLabel?.charAt(0) || s.role.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <div className="text-[11px] font-bold text-slate-200 truncate">
                                {s.roleLabel || s.role}
                              </div>
                              <div className="text-[9.5px] font-mono text-slate-500 truncate">
                                {isClaimed ? (s.claimedBy?.agentName || 'Seated') : s.required ? 'Open (Required)' : 'Open (Optional)'}
                              </div>
                            </div>
                          </div>

                          <div>
                            {isClaimed ? (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" title="Confirmed" />
                            ) : isPendingApp ? (
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" title="Pending Approval" />
                            ) : s.required ? (
                              <span className="text-[9px] font-mono text-amber-400 font-bold bg-amber-500/15 px-1.5 py-0.5 rounded">
                                NEEDED
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono text-slate-500">OPEN</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-noir-950/70 border-t border-noir-800 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => handleForceStartWithBots(e, lobby.sessionId)}
                    title="Fill remaining required seats with House Bots and start"
                    className="text-[11px] font-mono text-slate-400 hover:text-amber-400 underline decoration-dotted transition"
                  >
                    Force Start (Bots)
                  </button>

                  {isReady ? (
                    <button
                      onClick={() => handleOpenReadyModal(lobby)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-noir-950 font-bold text-xs hover:bg-emerald-400 shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      View Ready Check
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const firstOpen = lobby.seats.find((s: any) => s.status === 'open');
                        handleOpenSeatModal(lobby, firstOpen || lobby.seats[0]);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-noir-950 font-bold text-xs hover:bg-amber-400 shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Take a Seat
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Seat Selection Modal */}
      {selectedLobby && selectedSeat && (
        <SeatSelectionModal
          isOpen={isSeatModalOpen}
          onClose={() => setIsSeatModalOpen(false)}
          sessionId={selectedLobby.sessionId}
          seat={selectedSeat}
          userHeldSeats={selectedLobby.seats.filter((s: any) => s.claimedBy?.userId === CURRENT_USER.userId)}
          currentUser={CURRENT_USER}
          onSeatClaimed={fetchLobbies}
        />
      )}

      {/* Ready Check Modal */}
      {selectedLobby && (
        <ReadyCheckModal
          isOpen={isReadyModalOpen}
          onClose={() => setIsReadyModalOpen(false)}
          sessionId={selectedLobby.sessionId}
          lobby={selectedLobby}
          currentUser={CURRENT_USER}
          onConfirmReady={handleConfirmReady}
        />
      )}
    </div>
  );
}
