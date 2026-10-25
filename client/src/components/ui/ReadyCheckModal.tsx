'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, Flame, Radio, Sparkles, X, ChevronRight } from 'lucide-react';
import { sounds } from '@/lib/audio';

interface ReadyCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  lobby: any;
  currentUser: { userId: string; username: string };
  onConfirmReady: (seatKey: string) => void;
}

export default function ReadyCheckModal({
  isOpen,
  onClose,
  sessionId,
  lobby,
  currentUser,
  onConfirmReady
}: ReadyCheckModalProps) {
  const router = useRouter();

  if (!isOpen || !lobby) return null;

  const countdown = lobby.readyCheck?.countdown;
  const isCountingDown = typeof countdown === 'number' && countdown > 0;

  // Find user's seat in this lobby
  const userSeat = lobby.seats.find((s: any) => s.claimedBy?.userId === currentUser.userId);
  const userReady = userSeat?.readyConfirmed;

  // Audio cue when countdown starts
  useEffect(() => {
    if (isCountingDown) {
      sounds.playGavel();
    }
  }, [countdown]);

  // Handle launch transition
  const handleLaunchNow = () => {
    sounds.playGavel();
    router.push(`/case/${sessionId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-noir-900 border border-noir-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Glowing Top Accent Bar */}
        <div className={`h-1.5 w-full ${isCountingDown ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500 animate-pulse' : 'bg-gradient-to-r from-cyan-500 to-amber-500'}`} />

        {/* Modal Header */}
        <div className="p-6 border-b border-noir-800/80 bg-noir-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner ${
              isCountingDown
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 animate-bounce'
                : 'bg-noir-800 border-noir-700 text-cyan-400'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                Synchronized Pre-Trial Check
              </div>
              <h2 className="text-xl font-extrabold text-white font-display uppercase tracking-wide">
                Courtroom Ready Check
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-noir-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Cinematic Countdown Display */}
          {isCountingDown ? (
            <div className="text-center py-6 space-y-3 bg-noir-950/80 rounded-2xl border border-amber-500/40 shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold animate-pulse">
                All Participants Verified • Trial Chamber Spinning Up In
              </div>
              <div className="text-7xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-500 to-rose-500 scale-110 transform transition duration-300 animate-in zoom-in-50">
                {countdown}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Prepare your investigation notes. 3D Chamber audio and live stream will engage automatically.
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-noir-950/50 border border-noir-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">All required seats filled:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Confirmed
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Please confirm participant readiness. External agent endpoints have been pinged for health compliance.
              </p>
            </div>
          )}

          {/* Participant Verification List */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Seated Participants ({lobby.seats.filter((s: any) => s.status === 'confirmed').length})
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {lobby.seats
                .filter((s: any) => s.status === 'confirmed')
                .map((seat: any) => (
                  <div
                    key={seat.seatKey}
                    className="p-2.5 rounded-xl bg-noir-950/80 border border-noir-800/80 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        seat.side === 'court' ? 'bg-amber-500/20 text-amber-400' :
                        seat.side === 'prosecution' ? 'bg-rose-500/20 text-rose-400' :
                        seat.side === 'investigation' ? 'bg-cyan-500/20 text-cyan-400' :
                        seat.side === 'defense' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {seat.roleLabel?.charAt(0) || seat.role.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-slate-200 font-bold">{seat.claimedBy?.agentName || seat.roleLabel}</div>
                        <div className="text-[10px] text-slate-500">
                          {seat.roleLabel} • {seat.claimedBy?.isExternal ? 'External Webhook' : 'Built-in Agent'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {seat.readyConfirmed ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">
                          <Clock className="w-3.5 h-3.5" /> Awaiting
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-noir-800 bg-noir-950/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            +150 XP for Ready Confirmation
          </div>

          <div className="flex items-center gap-2">
            {isCountingDown ? (
              <button
                type="button"
                onClick={handleLaunchNow}
                className="px-6 py-2.5 rounded-xl font-extrabold text-xs bg-emerald-500 text-noir-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                Launch Courtroom Now
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                {userSeat && !userReady && (
                  <button
                    type="button"
                    onClick={() => onConfirmReady(userSeat.seatKey)}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs bg-amber-500 text-noir-950 hover:bg-amber-400 shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    I Am Ready
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
