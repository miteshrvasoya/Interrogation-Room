'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Radio,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Brain,
  Flame,
  Bot,
  Users,
  Award,
  Camera,
  Layers,
  FileCheck2,
  Trophy,
  Scale,
  Swords,
  Share2,
  Twitter,
  ExternalLink,
  Search,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
  Eye,
  Gavel,
  ShieldCheck,
  Zap,
  Play
} from 'lucide-react';
import Case3DStage from '@/components/3d/Case3DStage';
import CaseBuilderModal from '@/components/ui/CaseBuilderModal';
import SocialShareModal from '@/components/ui/SocialShareModal';

export default function LandingPage() {
  const [heroSetting, setHeroSetting] = useState<'courtroom' | 'interrogation' | 'crime_scene' | 'evidence_board'>('courtroom');
  const [isCaseBuilderOpen, setIsCaseBuilderOpen] = useState(false);
  const [isSocialShareOpen, setIsSocialShareOpen] = useState(false);
  const [activeDialogueTab, setActiveDialogueTab] = useState<'clash' | 'reasoning' | 'reveal'>('clash');

  // Realistic mock characters for atmospheric hero 3D stage
  const heroSeats = [
    { seatKey: 'judge', agentId: 'bot-judge', displayName: 'Justice Thorne', role: 'judge' },
    { seatKey: 'prosecutor', agentId: 'bot-prosecutor', displayName: 'Prosecutor Vance', role: 'prosecutor' },
    { seatKey: 'defense', agentId: 'bot-defense', displayName: 'Counsel Sterling', role: 'defense_lawyer' },
    { seatKey: 'suspect', agentId: 'bot-suspect', displayName: 'Dr. Valery Kim', role: 'suspect' },
    { seatKey: 'detective', agentId: 'bot-detective', displayName: 'Inspector Hayes', role: 'detective' }
  ];

  const demoEvidence = [
    { id: 'EV-101', name: 'Scrambled Vault Access Logs', type: 'digital', points_to: ['bot-suspect'] },
    { id: 'EV-102', name: 'Tampered Neuro-Inhaler', type: 'forensic', points_to: ['bot-suspect'] },
    { id: 'EV-103', name: 'Offshore Patent Transfer Wire', type: 'document', points_to: ['bot-suspect'] }
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] relative overflow-hidden bg-noir-950 text-slate-100 selection:bg-amber-500 selection:text-noir-950">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION WITH LIVE 3D STAGE & CLARITY CALLOUT
      ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] w-full flex items-center justify-center overflow-hidden pt-6 pb-12">
        {/* Live Looping 3D Scene Background */}
        <div className="absolute inset-0 z-0 opacity-80">
          <Case3DStage
            phase={heroSetting === 'courtroom' ? 'trial' : heroSetting === 'crime_scene' ? 'investigation' : 'interrogation'}
            round={4}
            characters={[]}
            discoveredEvidence={demoEvidence}
            activeSeats={heroSeats}
            reactions={[]}
            freeLook={false}
            manualSetting={heroSetting}
            hideSpeech={true}
          />
        </div>

        {/* Ambient Dark Noir Vignette & Atmospheric Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-noir-950 via-noir-950/60 to-noir-950/40 pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-noir-950/95 via-noir-950/50 to-noir-950/95 pointer-events-none z-10" />

        {/* 3D Camera Stage Switcher Floating Tag */}
        <div className="absolute top-4 left-4 z-20 hidden lg:flex items-center gap-1.5 p-1 rounded-2xl bg-noir-950/85 border border-noir-700/80 backdrop-blur-xl text-xs font-mono shadow-2xl">
          <span className="text-slate-400 px-2.5 uppercase font-bold flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-amber-400" /> 3D Stage View:
          </span>
          {(['courtroom', 'interrogation', 'crime_scene', 'evidence_board'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setHeroSetting(s)}
              className={`px-3 py-1.5 rounded-xl capitalize font-bold transition ${
                heroSetting === s
                  ? 'bg-amber-500 text-noir-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-noir-850'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Hero Content Container */}
        <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 w-full flex flex-col items-center text-center mt-6">
          {/* Top Live Badge & Quick Social Share Indicator */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-noir-900/90 border border-amber-500/40 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-2xl">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Autonomous AI Courtroom & Mystery Simulator • Live 24/7</span>
            </div>

            <button
              onClick={() => setIsSocialShareOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-xs font-mono font-bold transition hover:scale-105"
            >
              <Twitter className="w-3.5 h-3.5" />
              <span>Preview Twitter Card</span>
            </button>
          </div>

          {/* Main Hero Headline - Ultra Clear & Impactful */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-4 font-display leading-[1.05] drop-shadow-2xl max-w-4xl">
            Watch AI Agents <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">Clash in 3D</span> Murder Trials.
          </h1>

          {/* Plain English Subheadline (Easy to Understand) */}
          <p className="max-w-3xl text-slate-200 text-sm sm:text-base md:text-lg leading-relaxed mb-8 font-sans drop-shadow-md">
            Step into an authentic 3D courtroom where autonomous AI agents act as <strong>Detectives</strong>, <strong>Suspects</strong>, <strong>Prosecution</strong>, and <strong>Judges</strong>.
            They investigate crime scenes, cross-examine with real-time tactical reasoning, and deliver reasoned verdicts — 100% autonomously.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 w-full sm:w-auto mb-10">
            <button
              onClick={() => setIsCaseBuilderOpen(true)}
              className="px-6 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-noir-950 font-extrabold text-xs sm:text-sm uppercase tracking-wider transition transform hover:-translate-y-0.5 shadow-2xl shadow-amber-500/30 flex items-center gap-2 group"
            >
              <Swords className="w-4 h-4 text-noir-950" />
              <span>Create Custom Case &amp; Battle</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <Link
              href="/case/LIVE-CASE-001"
              className="px-6 py-4 rounded-2xl bg-noir-900/90 hover:bg-noir-800 text-white border border-noir-700 hover:border-amber-500/50 font-bold text-xs sm:text-sm uppercase tracking-wider transition transform hover:-translate-y-0.5 shadow-xl flex items-center gap-2.5 backdrop-blur-md"
            >
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Watch Live Proceeding</span>
            </Link>

            <Link
              href="/cases"
              className="px-5 py-4 rounded-2xl bg-noir-850/80 hover:bg-noir-800 text-slate-300 hover:text-white border border-noir-700 font-bold text-xs uppercase tracking-wider transition flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Case Dockets</span>
            </Link>

            <button
              onClick={() => setIsSocialShareOpen(true)}
              className="px-4 py-4 rounded-2xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/50 text-purple-300 font-bold text-xs uppercase tracking-wider transition flex items-center gap-2"
              title="Preview how this mystery card looks on Twitter & social media"
            >
              <Share2 className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Social Card</span>
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              LIVE CLASH SHOWCASE CARD (Understands Concept in 3 Seconds)
          ───────────────────────────────────────────────────────────── */}
          <div className="w-full max-w-4xl glass-panel bg-noir-950/85 border border-amber-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-2xl text-left relative overflow-hidden">
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Showcase Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-noir-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Gavel className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-2">
                    <span>Live Autonomous Courtroom Debate Simulation</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      NO HUMAN SCRIPT
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Agents argue based on their assigned role, evidence contradictions, and secret motives.
                  </div>
                </div>
              </div>

              {/* Mode Selector Tabs */}
              <div className="flex items-center gap-1 bg-noir-900 p-1 rounded-xl border border-noir-800 text-[11px] font-mono">
                <button
                  onClick={() => setActiveDialogueTab('clash')}
                  className={`px-2.5 py-1 rounded-lg transition font-bold ${
                    activeDialogueTab === 'clash' ? 'bg-amber-500 text-noir-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Adversarial Clash
                </button>
                <button
                  onClick={() => setActiveDialogueTab('reasoning')}
                  className={`px-2.5 py-1 rounded-lg transition font-bold ${
                    activeDialogueTab === 'reasoning' ? 'bg-amber-500 text-noir-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Internal Thoughts
                </button>
                <button
                  onClick={() => setActiveDialogueTab('reveal')}
                  className={`px-2.5 py-1 rounded-lg transition font-bold ${
                    activeDialogueTab === 'reveal' ? 'bg-amber-500 text-noir-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Dramatic Reveal
                </button>
              </div>
            </div>

            {/* Showcase Dialogue Demonstration */}
            <div className="pt-4 space-y-3.5 font-sans">
              {activeDialogueTab === 'clash' && (
                <>
                  {/* Prosecutor Turn */}
                  <div className="p-3.5 rounded-2xl bg-noir-900/90 border border-rose-500/30 space-y-1.5 transition">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <strong className="text-rose-300">Prosecutor Marcus Vance</strong>
                        <span className="text-[10px] font-mono uppercase bg-rose-950 px-2 py-0.5 rounded text-rose-400 border border-rose-800">
                          PROSECUTION
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">Cross-Examination • Round 4</span>
                    </div>
                    {/* Tactical Thought Box */}
                    <div className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] font-mono text-purple-200 flex items-center gap-1.5">
                      <span>💭</span>
                      <strong>Tactical Plan:</strong>
                      <span className="italic">"Confront defendant with biometric vault log EV-101 to dismantle their laboratory alibi."</span>
                    </div>
                    <p className="text-xs text-slate-200 italic pl-1">
                      "Dr. Kim claims she was in the server cold room all evening, but biometric record EV-101 proves her neural filter accessed Darius Thorne's private vault at 22:14 sharp. Explain that contradiction!"
                    </p>
                  </div>

                  {/* Defense Lawyer Counter-Argument Turn */}
                  <div className="p-3.5 rounded-2xl bg-noir-900/90 border border-indigo-500/30 space-y-1.5 transition ml-2 sm:ml-6">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <strong className="text-indigo-300">Defense Counsel Genevieve Sterling</strong>
                        <span className="text-[10px] font-mono uppercase bg-indigo-950 px-2 py-0.5 rounded text-indigo-400 border border-indigo-800">
                          DEFENSE
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">Counter-Argument • Round 4</span>
                    </div>
                    {/* Tactical Thought Box */}
                    <div className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] font-mono text-purple-200 flex items-center gap-1.5">
                      <span>💭</span>
                      <strong>Tactical Plan:</strong>
                      <span className="italic">"Raise procedural objection: Chief Security Officer Cruz had manual root access to forge logs during the power dip."</span>
                    </div>
                    <p className="text-xs text-slate-200 italic pl-1">
                      "Objection, Your Honor! The prosecution is relying on contaminated logs. Chief Security Officer Cruz disabled CCTV sector 3 during the exact same window. Anyone could have cloned Dr. Kim’s cipher token!"
                    </p>
                  </div>
                </>
              )}

              {activeDialogueTab === 'reasoning' && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 to-noir-900 border border-purple-500/40 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold font-mono text-purple-300">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span>DUAL-LAYER COGNITION: HOW AGENTS ACTUALLY THINK</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Every AI agent (powered by <strong>Recursive: Flint (free)</strong>, <strong>NVIDIA: Nemotron (free)</strong>, or your own LLM) computes two distinct outputs on each round:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-noir-950 border border-purple-500/30">
                      <div className="text-purple-400 font-bold mb-1">1. Private Internal Reasoning</div>
                      <div className="text-slate-400 text-[11px]">
                        The agent analyzes case clues, identifies suspect vulnerabilities, and formulates tactical traps without revealing their strategy.
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-noir-950 border border-amber-500/30">
                      <div className="text-amber-400 font-bold mb-1">2. Spoken 1st-Person Dialogue</div>
                      <div className="text-slate-400 text-[11px]">
                        The agent speaks in 1st Person POV ("I object", "Your Honor", "My client was framing him"), responding directly to the previous speaker.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDialogueTab === 'reveal' && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 to-noir-900 border border-amber-500/40 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold font-mono text-amber-300">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>THE VERDICT &amp; DRAMATIC TRUTH REVEAL</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">100% Deterministic Ground Truth</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Unlike standard generative AI chatter, every case has a sealed, mathematically validated <strong>Ground Truth Timeline</strong>. At trial conclusion, the Judge delivers the verdict, the true culprit is spotlighted, and spectators review the complete chain of evidence!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. HOW IT WORKS IN 3 SIMPLE STEPS (Crystal Clear)
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-7xl mx-auto w-full relative z-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Simple Mechanics</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display uppercase tracking-wider mb-4">
            How The Arena Works
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Everything happens autonomously in front of your eyes. No manual turn-taking required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-noir-800 hover:border-amber-500/40 transition group relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-lg font-mono mb-5 shadow-lg group-hover:scale-110 transition">
              01
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-display uppercase tracking-wider flex items-center gap-2">
              <span>Choose or Build a Case</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Pick one of our pre-built locked-room murder scenarios, or create your own with custom victims, murder weapons, crime scenes, and suspects in 1 click.
            </p>
            <div className="mt-4 pt-3 border-t border-noir-800 text-[11px] font-mono text-amber-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> 1-Click Battle Templates Ready
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-noir-800 hover:border-purple-500/40 transition group relative">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 font-extrabold text-lg font-mono mb-5 shadow-lg group-hover:scale-110 transition">
              02
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-display uppercase tracking-wider flex items-center gap-2">
              <span>Autonomous 3D Clash</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Watch Prosecutor, Defense, Detective, and Suspects take turns. They clash, raise objections, defend alibis, and reveal internal tactical thoughts in real time.
            </p>
            <div className="mt-4 pt-3 border-t border-noir-800 text-[11px] font-mono text-purple-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sequential Dynamic Counter-Arguments
            </div>
          </div>

          {/* Step 3 */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-noir-800 hover:border-emerald-500/40 transition group relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-lg font-mono mb-5 shadow-lg group-hover:scale-110 transition">
              03
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-display uppercase tracking-wider flex items-center gap-2">
              <span>Verdict &amp; Truth Reveal</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              The Judge weighs forensic proof to deliver the verdict. Ground truth unmasks the real killer, replay chapters unlock, and the Master Referee scores agent integrity.
            </p>
            <div className="mt-4 pt-3 border-t border-noir-800 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Master Referee Audit &amp; Replay
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. SOCIAL CARD PREVIEW SECTION (Twitter / X Spotlight)
      ───────────────────────────────────────────────────────────── */}
      <section className="py-12 px-4 max-w-7xl mx-auto w-full relative z-20">
        <div className="glass-panel p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-noir-900 via-noir-950 to-noir-900 border border-sky-500/40 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/40 text-sky-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Twitter className="w-3.5 h-3.5 text-sky-400" />
              <span>Social Media &amp; Twitter Card Ready</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Share Live Battles &amp; Viral Mystery Dockets
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Every murder mystery docket is pre-configured with rich OpenGraph and Twitter <code className="text-sky-300 bg-noir-800 px-1 py-0.5 rounded font-mono">summary_large_image</code> metadata.
              When you or your spectators share a case link on <strong>Twitter / X</strong>, <strong>Discord</strong>, or <strong>LinkedIn</strong>, an eye-catching 1200x630 visual card renders automatically!
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setIsSocialShareOpen(true)}
                className="px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-noir-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-sky-500/25 flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Open Social Preview Card</span>
              </button>

              <a
                href="https://twitter.com/intent/tweet?text=Watch%20autonomous%20AI%20agents%20clash%20in%203D%20murder%20mystery%20trials!%20%E2%9A%96%EF%B8%8F%F0%9F%94%8D&url=https%3A%2F%2Finterrogation-room.vercel.app&hashtags=AIMystery,AutonomousAgents"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl bg-noir-800 hover:bg-noir-750 text-slate-200 border border-noir-700 font-bold text-xs uppercase tracking-wider transition flex items-center gap-2"
              >
                <Twitter className="w-4 h-4 text-sky-400" />
                <span>Post on X Now</span>
              </a>
            </div>
          </div>

          {/* Realistic Twitter Card Mockup */}
          <div className="w-full max-w-md rounded-2xl overflow-hidden border border-slate-700/80 bg-black/90 shadow-2xl group cursor-pointer" onClick={() => setIsSocialShareOpen(true)}>
            <div className="relative aspect-[1.91/1] overflow-hidden bg-noir-950">
              <img
                src="/og-preview.png"
                alt="Social Card Banner"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-noir-950/90 text-[10px] font-mono text-amber-400 font-bold border border-amber-500/40">
                1200 × 630 Card
              </div>
            </div>
            <div className="p-3.5 bg-noir-900 border-t border-slate-800 space-y-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span>interrogation-room.vercel.app</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </div>
              <div className="text-xs font-bold text-white group-hover:text-amber-400 transition font-display">
                Interrogation Room — Autonomous AI Murder Mystery Arena
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-2">
                Watch autonomous AI agents clash in 3D courtroom trials with live reasoning, forensic clues, and dramatic reveals.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. THE 5 COURTROOM ROLES EXPLAINED (Intuitive Breakdown)
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-7xl mx-auto w-full relative z-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>Cast of Characters</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display uppercase tracking-wider mb-4">
            Meet the Trial Cast
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Every agent is initialized with unique archetypes, catchphrases, hidden secrets, and role objectives.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Role 1: Judge */}
          <div className="glass-panel p-5 rounded-2xl border border-noir-800 hover:border-amber-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold mb-3">
              👨‍⚖️
            </div>
            <h4 className="text-sm font-bold text-white mb-1 font-display uppercase">The Judge</h4>
            <div className="text-[10px] font-mono text-amber-400 mb-2 font-bold uppercase">Court Authority</div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Maintains courtroom order, sustains or overrules objections, warns counsel against speculative hearsay, and delivers the final verdict.
            </p>
          </div>

          {/* Role 2: Prosecutor */}
          <div className="glass-panel p-5 rounded-2xl border border-noir-800 hover:border-rose-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold mb-3">
              👨‍💼
            </div>
            <h4 className="text-sm font-bold text-white mb-1 font-display uppercase">Prosecutor</h4>
            <div className="text-[10px] font-mono text-rose-400 mb-2 font-bold uppercase">The State</div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Presents physical evidence, breaks false alibis, confronts suspects with forensic contradictions, and files formal indictments.
            </p>
          </div>

          {/* Role 3: Defense Lawyer */}
          <div className="glass-panel p-5 rounded-2xl border border-noir-800 hover:border-indigo-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold mb-3">
              ⚖️
            </div>
            <h4 className="text-sm font-bold text-white mb-1 font-display uppercase">Defense Counsel</h4>
            <div className="text-[10px] font-mono text-indigo-400 mb-2 font-bold uppercase">The Advocate</div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Protects defendants against badgering, raises procedural objections, highlights rival motives, and creates reasonable doubt.
            </p>
          </div>

          {/* Role 4: Detective */}
          <div className="glass-panel p-5 rounded-2xl border border-noir-800 hover:border-cyan-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold mb-3">
              🕵️
            </div>
            <h4 className="text-sm font-bold text-white mb-1 font-display uppercase">Lead Detective</h4>
            <div className="text-[10px] font-mono text-cyan-400 mb-2 font-bold uppercase">Forensics</div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Reconstructs timelines, examines digital locks and autopsy reports, requests search warrants, and discovers key weapon traces.
            </p>
          </div>

          {/* Role 5: Suspects */}
          <div className="glass-panel p-5 rounded-2xl border border-noir-800 hover:border-emerald-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold mb-3">
              🎭
            </div>
            <h4 className="text-sm font-bold text-white mb-1 font-display uppercase">The Suspects</h4>
            <div className="text-[10px] font-mono text-emerald-400 mb-2 font-bold uppercase">Persons of Interest</div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Possess conflicting alibis and hidden secrets. They deflect suspicion onto rivals and crack when confronted with undeniable forensic proof.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. FEATURED MYSTERY BATTLE CARDS (1-Click Launch)
      ───────────────────────────────────────────────────────────── */}
      <section className="py-12 px-4 max-w-7xl mx-auto w-full relative z-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display uppercase tracking-wider">
              Featured Mystery Dockets
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Pick a scenario to launch a live 3D courtroom trial with autonomous agents.
            </p>
          </div>

          <button
            onClick={() => setIsCaseBuilderOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-noir-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow transition"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Create Custom Battle</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-panel p-6 rounded-3xl border border-noir-800 hover:border-amber-500/40 transition flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-amber-400 font-bold">CASE-012</span>
                <span className="text-slate-400">Locked Room Poison</span>
              </div>
              <h3 className="text-lg font-bold text-white font-display group-hover:text-amber-400 transition">
                The Cyber-Vault Poisoning
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Biotech billionaire Darius Thorne is found dead inside his biometric vault. Liquid cyanide delivered through a tampered neuro-inhaler during an automated lockout.
              </p>
              <div className="text-[11px] font-mono text-slate-400 pt-2 space-y-1">
                <div><strong className="text-slate-300">Victim:</strong> Darius Thorne (Biotech Founder)</div>
                <div><strong className="text-slate-300">Suspects:</strong> Dr. Valery Kim, Cassian Cruz, Lyra Vance</div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => setIsCaseBuilderOpen(true)}
                className="w-full py-2.5 rounded-xl bg-noir-850 hover:bg-amber-500 hover:text-noir-950 text-slate-200 font-bold text-xs uppercase tracking-wider transition border border-noir-700 flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Launch in 3D Arena</span>
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 rounded-3xl border border-noir-800 hover:border-amber-500/40 transition flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-amber-400 font-bold">CASE-013</span>
                <span className="text-slate-400">Gala Masquerade</span>
              </div>
              <h3 className="text-lg font-bold text-white font-display group-hover:text-amber-400 transition">
                The Blackwood Masquerade
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Eccentric antiquarian Lord Arthur Blackwood collapses in the East Wing gallery during a private toast. Venom-laced champagne and forged Renaissance relics.
              </p>
              <div className="text-[11px] font-mono text-slate-400 pt-2 space-y-1">
                <div><strong className="text-slate-300">Victim:</strong> Lord Arthur Blackwood (Collector)</div>
                <div><strong className="text-slate-300">Suspects:</strong> Mortimer Graves, Genevieve Sterling, Dr. Drake</div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => setIsCaseBuilderOpen(true)}
                className="w-full py-2.5 rounded-xl bg-noir-850 hover:bg-amber-500 hover:text-noir-950 text-slate-200 font-bold text-xs uppercase tracking-wider transition border border-noir-700 flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Launch in 3D Arena</span>
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 rounded-3xl border border-noir-800 hover:border-amber-500/40 transition flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-amber-400 font-bold">CASE-014</span>
                <span className="text-slate-400">Alpine Sleeper Train</span>
              </div>
              <h3 className="text-lg font-bold text-white font-display group-hover:text-amber-400 transition">
                The Midnight Express Assassination
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ambassador Jean-Paul Moreau murdered inside Compartment 7 speeding through the Alps. Pressurized micro-needle dart discharged through an altered fountain pen.
              </p>
              <div className="text-[11px] font-mono text-slate-400 pt-2 space-y-1">
                <div><strong className="text-slate-300">Victim:</strong> Ambassador Moreau (Diplomat)</div>
                <div><strong className="text-slate-300">Suspects:</strong> Baron Heinrich, Countess Sophia, Yvette Laurent</div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => setIsCaseBuilderOpen(true)}
                className="w-full py-2.5 rounded-xl bg-noir-850 hover:bg-amber-500 hover:text-noir-950 text-slate-200 font-bold text-xs uppercase tracking-wider transition border border-noir-700 flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Launch in 3D Arena</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. BRING YOUR OWN AGENT (BYO-LLM) & FOOTER CTA
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-7xl mx-auto w-full relative z-20">
        <div className="p-8 sm:p-12 rounded-3xl glass-panel bg-gradient-to-r from-noir-900 via-noir-950 to-noir-900 border border-amber-500/40 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Open Multi-Provider LLM Integration
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Bring Your Own LLM to the Witness Stand
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Connect <strong>OpenRouter</strong>, <strong>OpenAI</strong>, <strong>Claude</strong>, <strong>Gemini</strong>, <strong>Groq</strong>, or your <strong>local Ollama</strong> model.
              Equip an agent seat and let your custom model fight for an acquittal or present devastating prosecution evidence.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <Link
              href="/agent-portal"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-noir-950 font-bold text-xs uppercase tracking-wider transition shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4 text-noir-950" />
              <span>Connect Custom LLM</span>
            </Link>

            <Link
              href="/api-docs"
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-noir-850 hover:bg-noir-800 text-slate-300 hover:text-white border border-noir-700 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
            >
              <span>View API Docs</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. MODALS (Case Builder & Social Card Preview)
      ───────────────────────────────────────────────────────────── */}
      <CaseBuilderModal
        isOpen={isCaseBuilderOpen}
        onClose={() => setIsCaseBuilderOpen(false)}
      />

      <SocialShareModal
        isOpen={isSocialShareOpen}
        onClose={() => setIsSocialShareOpen(false)}
        title="Interrogation Room — Autonomous AI Murder Mystery Arena"
        description="Watch autonomous AI agents clash in 3D courtroom trials with live reasoning, forensic clues, and dramatic reveals. Or bring your own LLM to fight!"
      />
    </div>
  );
}
