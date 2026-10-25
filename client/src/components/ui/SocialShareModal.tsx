'use client';

import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  MessageCircle,
  Eye,
  Twitter
} from 'lucide-react';
import Image from 'next/image';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  url?: string;
  caseId?: string;
}

export default function SocialShareModal({
  isOpen,
  onClose,
  title = 'Interrogation Room — Autonomous AI Murder Mystery Arena',
  description = 'Watch autonomous AI agents clash in 3D courtroom trials with live tactical reasoning, forensic cross-examinations, and dramatic reveals.',
  url,
  caseId
}: SocialShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl =
    url || (typeof window !== 'undefined' ? window.location.href : 'https://interrogation-room.vercel.app');

  const tweetText = caseId
    ? `Witness autonomous AI agents clashing in ${title}! Cross-examinations, forensic clues & real-time reasoning in 3D.`
    : `Experience the Interrogation Room: Autonomous AI agents arguing, counter-arguing, and solving locked-room mysteries live in 3D! ⚖️🔍`;

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    tweetText
  )}&url=${encodeURIComponent(currentUrl)}&hashtags=AIMystery,AutonomousAgents,ThreeJS`;

  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;

  const redditShareUrl = `https://reddit.com/submit?url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(
    title
  )}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-noir-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl glass-panel bg-noir-950/95 border border-amber-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-noir-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-noir-900 to-indigo-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
                Social Preview & Share
              </h2>
              <p className="text-xs text-slate-400">
                How this mystery trial card appears on Twitter, Discord, and social feeds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-noir-850 hover:bg-noir-800 border border-noir-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Twitter / X Feed Post Card Mockup */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-400">
                <Twitter className="w-3.5 h-3.5" /> Twitter / X Large Image Card Preview
              </span>
              <span className="text-[10px] bg-noir-800 px-2 py-0.5 rounded border border-noir-700">
                summary_large_image
              </span>
            </div>

            {/* Simulated Tweet Container */}
            <div className="p-4 rounded-2xl bg-black/90 border border-slate-800 shadow-xl space-y-3 font-sans">
              {/* User Header */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-500 flex items-center justify-center font-bold text-xs text-noir-950 font-display">
                  IR
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white leading-none">
                    <span>Interrogation Room</span>
                    <span className="text-blue-400 text-[10px]">☑️</span>
                    <span className="text-[11px] font-normal text-slate-500">@InterrogationAI</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Now playing in interactive 3D</div>
                </div>
              </div>

              {/* Tweet Text */}
              <p className="text-xs text-slate-200 leading-relaxed font-sans">{tweetText}</p>

              {/* The Large Image Link Card */}
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-noir-900/90 group hover:border-slate-700 transition cursor-pointer">
                {/* Banner Image */}
                <div className="relative w-full aspect-[1.91/1] overflow-hidden bg-noir-950">
                  <img
                    src="/og-preview.png"
                    alt="Interrogation Room Social Card Preview"
                    className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition duration-500"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-noir-950/85 backdrop-blur-md border border-amber-500/40 text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    <span>3D Live Trial</span>
                  </div>
                </div>

                {/* Card Meta Content */}
                <div className="p-3 bg-noir-900 border-t border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <span>interrogation-room.vercel.app</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-400 transition font-display line-clamp-1">
                    {title}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                    {description}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Share Links & Actions */}
          <div className="space-y-3 pt-2 border-t border-noir-800">
            <div className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
              1-Click Share to Social Media
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <a
                href={twitterShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-bold text-xs flex items-center justify-center gap-2 transition hover:scale-[1.02]"
              >
                <Twitter className="w-3.5 h-3.5" />
                <span>Post on X / Twitter</span>
              </a>

              <a
                href={redditShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 font-bold text-xs flex items-center justify-center gap-2 transition hover:scale-[1.02]"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Share on Reddit</span>
              </a>

              <a
                href={linkedinShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition hover:scale-[1.02]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Share on LinkedIn</span>
              </a>
            </div>

            {/* Copy Direct Link */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 bg-noir-950 border border-noir-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition ${
                  copied
                    ? 'bg-emerald-500 text-noir-950'
                    : 'bg-amber-500 hover:bg-amber-400 text-noir-950 shadow-md shadow-amber-500/20'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
