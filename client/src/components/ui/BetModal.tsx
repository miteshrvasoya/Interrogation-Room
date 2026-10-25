'use client';

import React, { useState } from 'react';
import { X, DollarSign, Sparkles, ShieldCheck } from 'lucide-react';

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: any[];
  onPlaceBet: (suspectId: string, points: number) => Promise<void>;
}

export default function BetModal({
  isOpen,
  onClose,
  characters,
  onPlaceBet
}: BetModalProps) {
  const [selectedSuspect, setSelectedSuspect] = useState('');
  const [points, setPoints] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const suspects = characters.filter((c) => c.role_in_case === 'suspect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuspect) return;
    setIsSubmitting(true);
    try {
      await onPlaceBet(selectedSuspect, points);
      setConfirmed(true);
      setTimeout(() => {
        setConfirmed(false);
        onClose();
      }, 1500);
    } catch (_) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-noir-700/80 shadow-2xl relative">
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-noir-850 hover:bg-noir-800 border border-noir-700 flex items-center justify-center text-slate-400 hover:text-white absolute right-4 top-4 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-amber-500 mb-1">
          <Sparkles className="w-5 h-5" />
          <h2 className="font-bold text-base text-slate-100 uppercase tracking-wide">
            Confidence Prediction Bet
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Back your detective instincts before the reveal phase closes. Correct culprit guesses pay out at 2.5x virtual points and advance your Sleuth streak.
        </p>

        {confirmed ? (
          <div className="p-6 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-center animate-fade-in">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white mb-1">Bet Confirmed!</h3>
            <p className="text-xs text-emerald-300 font-mono">
              {points} Points placed on {suspects.find((s) => s.id === selectedSuspect)?.name}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Suspect Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                1. Select Suspect
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suspects.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setSelectedSuspect(s.id)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      selectedSuspect === s.id
                        ? 'bg-amber-500/15 border-amber-500 text-amber-200'
                        : 'bg-noir-900 border-noir-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{s.name}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{s.occupation}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Points Stake */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                2. Points Stake
              </label>
              <div className="flex items-center gap-2 mb-2">
                {[50, 100, 250, 500].map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setPoints(amt)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-bold transition ${
                      points === amt
                        ? 'bg-amber-500 text-noir-950 border-amber-400'
                        : 'bg-noir-900 text-slate-400 border-noir-800 hover:text-white'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Payout calculation */}
            <div className="p-3 rounded-xl bg-noir-900 border border-noir-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Potential Payout:</span>
              <span className="text-amber-400 font-bold text-sm">
                +{Math.round(points * 2.5)} PTS (2.5x)
              </span>
            </div>

            <button
              type="submit"
              disabled={!selectedSuspect || isSubmitting}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-noir-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20"
            >
              {isSubmitting ? 'Placing Bet...' : 'Lock In Prediction'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
