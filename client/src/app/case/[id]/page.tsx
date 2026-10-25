'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Case3DStage from '@/components/3d/Case3DStage';
import SpectatorHUD from '@/components/ui/SpectatorHUD';
import TranscriptDrawer from '@/components/ui/TranscriptDrawer';
import BetModal from '@/components/ui/BetModal';
import DramaticRevealModal from '@/components/ui/DramaticRevealModal';
import LiveDialogueOverlay from '@/components/ui/LiveDialogueOverlay';
import MasterRefereeScorePanel from '@/components/ui/MasterRefereeScorePanel';
import CaseReplayController from '@/components/ui/CaseReplayController';
import AttachLlmModal from '@/components/ui/AttachLlmModal';
import SocialShareModal from '@/components/ui/SocialShareModal';
import { Zap } from 'lucide-react';
import { sounds } from '@/lib/audio';
import { getSocketUrl } from '@/lib/socket';
import { analytics } from '@/lib/analytics';

export default function CaseRoomPage() {
  const params = useParams();
  const sessionId = (params?.id as string) || 'LIVE-CASE-001';

  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3D Controls State
  const [freeLook, setFreeLook] = useState(false);
  const [settingMode, setSettingMode] = useState<'auto' | 'evidence_board'>('auto');
  const [latestEvent, setLatestEvent] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [reactions, setReactions] = useState<any[]>([]);

  // Modals & Drawers
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [isRevealOpen, setIsRevealOpen] = useState(false);
  const [isAttachLlmOpen, setIsAttachLlmOpen] = useState(false);
  const [isSocialShareOpen, setIsSocialShareOpen] = useState(false);

  // Master Referee & Replay State
  const [isRefereeOpen, setIsRefereeOpen] = useState(true);
  const [liveScores, setLiveScores] = useState<any[]>([]);
  const [refereeContradictions, setRefereeContradictions] = useState<any[]>([]);
  const [refereeObservations, setRefereeObservations] = useState<any[]>([]);
  const [isReplayActive, setIsReplayActive] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);

  const socketRef = useRef<Socket | null>(null);

  // Active dialogue event: replay scrubbing, user-selected, latest real-time, or latest meaningful dialogue
  const displayedEvent = React.useMemo(() => {
    if (isReplayActive && sessionData?.transcript?.length > 0) {
      const idx = Math.min(Math.max(0, replayIndex), sessionData.transcript.length - 1);
      return sessionData.transcript[idx];
    }
    if (selectedEvent) return selectedEvent;
    if (latestEvent) return latestEvent;
    if (sessionData?.transcript?.length > 0) {
      const meaningful = sessionData.transcript.filter((t: any) => t.action !== 'pass_turn');
      return meaningful.length > 0
        ? meaningful[meaningful.length - 1]
        : sessionData.transcript[sessionData.transcript.length - 1];
    }
    return null;
  }, [isReplayActive, replayIndex, selectedEvent, latestEvent, sessionData?.transcript]);

  // 1. Initial REST fetch
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) throw new Error('Failed to load session details');
        const data = await res.json();
        if (data.success) {
          setSessionData(data.session);
          analytics.trackCaseViewed(sessionId, data.session?.title);
          if (data.session.liveScores) setLiveScores(data.session.liveScores);
          if (data.session.refereeContradictions) setRefereeContradictions(data.session.refereeContradictions);
          if (data.session.refereeObservations) setRefereeObservations(data.session.refereeObservations);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [sessionId]);

  // 2. Real-time Socket.io Connection & Event Handling
  useEffect(() => {
    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[Socket] Connected to server, joining case room: ${sessionId}`);
      socket.emit('join_case', { sessionId });
    });

    socket.on('case_state', (state: any) => {
      setSessionData(state);
      if (state.liveScores) setLiveScores(state.liveScores);
      if (state.refereeContradictions) setRefereeContradictions(state.refereeContradictions);
      if (state.refereeObservations) setRefereeObservations(state.refereeObservations);
    });

    socket.on('game_event', (event: any) => {
      setLatestEvent(event);
      setSelectedEvent(null);
      setSessionData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          transcript: [...(prev.transcript || []), event]
        };
      });
    });

    socket.on('master_referee_update', ({ evalResult, liveScores }: any) => {
      if (liveScores) setLiveScores(liveScores);
      if (evalResult?.contradiction) {
        setRefereeContradictions((prev: any) => [...prev, evalResult.contradiction]);
      }
      if (evalResult?.observation) {
        setRefereeObservations((prev: any) => [...prev, evalResult.observation]);
      }
    });

    socket.on('spectator_reaction', (rx: any) => {
      setReactions((prev) => [...prev.slice(-12), rx]);
    });

    socket.on('case_finished', ({ reveal }: any) => {
      sounds.playGavel();
      analytics.trackRevealViewed(sessionId, reveal?.trueCulprit);
      setTimeout(() => {
        setIsRevealOpen(true);
      }, 1000);
    });

    return () => {
      socket.emit('leave_case', { sessionId });
      socket.disconnect();
    };
  }, [sessionId]);

  // Handle spectator reactions
  const handleSendReaction = (type: string) => {
    analytics.trackReactionSent(type, sessionId);
    if (socketRef.current) {
      socketRef.current.emit('send_reaction', {
        sessionId,
        type,
        user: 'Spectator'
      });
    } else {
      // Fallback REST
      fetch(`/api/sessions/${sessionId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, user: 'Spectator' })
      }).catch(() => {});
    }
  };

  // Handle confidence bet
  const handlePlaceBet = async (suspectId: string, points: number) => {
    const suspectChar = sessionData?.characters?.find((c: any) => c.id === suspectId);
    analytics.trackBetPlaced(suspectId, suspectChar?.name || suspectId, points, sessionId);
    const res = await fetch(`/api/sessions/${sessionId}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'spectator-me',
        userName: 'SleuthSpectator',
        suspectId,
        points
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.reason || 'Failed to place bet');
    }
  };

  // Reset simulation to round 1
  const handleResetCase = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSessionData(data.session);
          setIsRevealOpen(false);
          sounds.playGavel();
        }
      }
    } catch (e) {
      console.error('Reset error:', e);
    }
  };

  // Toggle autoplay on/off
  const handleToggleAutoPlay = async () => {
    try {
      const current = sessionData?.autoPlay ?? true;
      const res = await fetch(`/api/sessions/${sessionId}/autoplay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !current })
      });
      if (res.ok) {
        const data = await res.json();
        setSessionData((prev: any) => ({ ...prev, autoPlay: data.autoPlay }));
      }
    } catch (e) {
      console.error('Autoplay toggle error:', e);
    }
  };

  // Step round manually
  const handleStepRound = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/step`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSessionData(data.session);
        }
      }
    } catch (e) {
      console.error('Step round error:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-noir-950 text-slate-400 font-mono text-xs">
        Connecting to 3D Interrogation Room Stage...
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-rose-400 mb-2 font-display">Docket Not Found</h2>
        <p className="text-xs text-slate-400 mb-4">{error || 'Session could not be loaded.'}</p>
        <a href="/cases" className="px-4 py-2 rounded-xl bg-amber-500 text-noir-950 font-bold text-xs uppercase">
          Back to Case Files
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] min-h-[calc(100vh-3.5rem)] overflow-hidden bg-noir-950">
      {/* Floating BYO-LLM Controller Trigger Button */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30">
        <button
          onClick={() => setIsAttachLlmOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-purple-950/85 hover:bg-purple-900 border border-purple-500/50 text-purple-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-purple-950/50 backdrop-blur-md transition hover:scale-105"
          title="Attach your custom LLM to an agent in this live proceeding"
        >
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Attach LLM Agent</span>
          <span className="sm:hidden">BYO-LLM</span>
        </button>
      </div>

      {/* 3D Scene Stage (Canvas) */}
      <Case3DStage
        phase={sessionData.phase}
        subPhase={sessionData.subPhase}
        round={sessionData.round}
        latestEvent={displayedEvent}
        characters={sessionData.characters || []}
        discoveredEvidence={sessionData.discoveredEvidence || []}
        activeSeats={sessionData.activeSeats || []}
        reactions={reactions}
        freeLook={freeLook}
        manualSetting={settingMode === 'evidence_board' ? 'evidence_board' : 'auto'}
        caseTitle={sessionData.title}
        casePremise={sessionData.tagline || sessionData.setting?.summary}
      />

      {/* Live Dialogue Overlay (Subtitle Card & Stream Feed) */}
      <LiveDialogueOverlay
        transcript={sessionData.transcript || []}
        activeEvent={displayedEvent}
        onSelectEvent={(evt) => setSelectedEvent(evt)}
        onJumpToLive={() => setSelectedEvent(null)}
        isLive={!selectedEvent}
        characters={sessionData.characters || []}
        activeSeats={sessionData.activeSeats || []}
      />

      {/* Floating Spectator HUD */}
      <SpectatorHUD
        caseTitle={sessionData.title}
        phase={sessionData.phase}
        subPhase={sessionData.subPhase}
        round={sessionData.round}
        maxRounds={sessionData.max_rounds}
        heat={sessionData.heat || 75}
        odds={sessionData.odds || {}}
        freeLook={freeLook}
        onToggleFreeLook={() => {
          analytics.trackFreeLookToggled(!freeLook, sessionId);
          setFreeLook(!freeLook);
        }}
        settingMode={settingMode}
        onToggleSettingMode={() => {
          const nextMode = settingMode === 'evidence_board' ? 'auto' : 'evidence_board';
          analytics.trackSettingModeToggled(nextMode, sessionId);
          if (settingMode !== 'evidence_board') {
            setFreeLook(false);
          }
          setSettingMode(nextMode);
        }}
        onOpenTranscript={() => setIsTranscriptOpen(true)}
        onOpenBetModal={() => setIsBetModalOpen(true)}
        onSendReaction={handleSendReaction}
        isCompleted={sessionData.isCompleted}
        onOpenReveal={() => setIsRevealOpen(true)}
        autoPlay={sessionData.autoPlay}
        onToggleAutoPlay={handleToggleAutoPlay}
        onStepRound={handleStepRound}
        onResetCase={handleResetCase}
        transcriptCount={sessionData.transcript?.length || 0}
        onToggleReferee={() => setIsRefereeOpen(!isRefereeOpen)}
        isRefereeOpen={isRefereeOpen}
        onStartReplay={() => {
          const nextActive = !isReplayActive;
          analytics.trackReplayAction(nextActive ? 'open' : 'close', sessionId);
          setIsReplayActive(nextActive);
          if (!isReplayActive) setReplayIndex(0);
        }}
        isReplayActive={isReplayActive}
        onOpenShare={() => setIsSocialShareOpen(true)}
      />

      {/* Master Referee Live Scoring Panel (Top-Right Floating Overlay) */}
      <div className="pointer-events-none absolute top-16 sm:top-20 right-3 sm:right-4 z-30 flex flex-col items-end">
        <MasterRefereeScorePanel
          liveScores={liveScores}
          contradictions={refereeContradictions}
          observations={refereeObservations}
          isOpen={isRefereeOpen}
          onToggle={() => setIsRefereeOpen(!isRefereeOpen)}
        />
      </div>

      {/* Deterministic Replay Controller Bar */}
      <CaseReplayController
        isOpen={isReplayActive}
        onClose={() => setIsReplayActive(false)}
        transcript={sessionData.transcript || []}
        replayChapters={sessionData.revealData?.replayChapters || []}
        currentIndex={replayIndex}
        onSeekIndex={(idx) => setReplayIndex(idx)}
      />

      {/* Side Slide-Out Transcript Drawer */}
      <TranscriptDrawer
        isOpen={isTranscriptOpen}
        onClose={() => setIsTranscriptOpen(false)}
        transcript={sessionData.transcript || []}
        evidenceList={sessionData.discoveredEvidence || []}
        characters={sessionData.characters || []}
        activeSeats={sessionData.activeSeats || []}
      />

      {/* Confidence Bet Modal */}
      <BetModal
        isOpen={isBetModalOpen}
        onClose={() => setIsBetModalOpen(false)}
        characters={sessionData.characters || []}
        onPlaceBet={handlePlaceBet}
      />

      {/* Dramatic Reveal Modal (Replay Mode) */}
      <DramaticRevealModal
        isOpen={isRevealOpen}
        onClose={() => setIsRevealOpen(false)}
        caseTitle={sessionData.title}
        revealData={sessionData.revealData}
        characters={sessionData.characters || []}
        transcript={sessionData.transcript || []}
        onStartReplay={() => {
          setIsRevealOpen(false);
          setIsReplayActive(true);
          setReplayIndex(0);
        }}
      />

      {/* Attach BYO-LLM Agent Modal */}
      <AttachLlmModal
        isOpen={isAttachLlmOpen}
        onClose={() => setIsAttachLlmOpen(false)}
        sessionId={sessionId}
        activeSeats={sessionData.activeSeats || []}
        onLlmAttached={async () => {
          try {
            const res = await fetch(`/api/sessions/${sessionId}`);
            const data = await res.json();
            if (data.success) {
              setSessionData(data.session);
            }
          } catch (e) {
            console.error('Failed to reload session after LLM attachment', e);
          }
        }}
      />

      {/* Post Preview / Social Share Modal */}
      <SocialShareModal
        isOpen={isSocialShareOpen}
        onClose={() => setIsSocialShareOpen(false)}
        title={sessionData.title}
        description={sessionData.tagline || sessionData.setting?.summary || 'Autonomous multi-agent courtroom investigation in 3D'}
        caseId={sessionId}
      />
    </div>
  );
}
