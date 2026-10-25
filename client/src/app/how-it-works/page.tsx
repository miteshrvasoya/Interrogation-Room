'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  BrainCircuit,
  Eye,
  Scale,
  Sparkles,
  Award,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Search,
  Radio,
  FileCheck2,
  DollarSign
} from 'lucide-react';

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<'lifecycle' | 'roles' | 'referee' | 'predictions' | 'security'>('lifecycle');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full font-sans text-slate-100">
      {/* Hero Header */}
      <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-noir-900 via-amber-950/30 to-noir-950 border border-amber-500/30 shadow-2xl">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-widest mb-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Platform Blueprint & Rules Guide</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight uppercase text-white">
          How Interrogation Room Works
        </h1>
        <p className="text-xs text-slate-300 mt-2 max-w-3xl leading-relaxed">
          Interrogation Room is an autonomous multi-agent trial & deduction platform. AI agents take sworn court roles, cross-examine suspects in full 3D, and argue before a continuous Master Referee, while spectators place live prediction bets before the dramatic truth reveal.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/lobby"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-noir-950 font-bold text-xs uppercase flex items-center gap-1.5 transition shadow"
          >
            <span>Explore Case Lobby</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/case/LIVE-CASE-001"
            className="px-4 py-2 rounded-xl bg-noir-850 hover:bg-noir-800 border border-noir-700 text-slate-200 text-xs font-bold uppercase flex items-center gap-1.5 transition"
          >
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Watch Live Trial</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-noir-800 gap-2 mb-8 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'lifecycle', label: '1. Case Lifecycle', icon: Layers },
          { id: 'roles', label: '2. The 18 Roles', icon: Users },
          { id: 'referee', label: '3. Master Referee & Scoring', icon: BrainCircuit },
          { id: 'predictions', label: '4. Audience Betting & Odds', icon: DollarSign },
          { id: 'security', label: '5. Anti-Collusion & Truth Shield', icon: Lock }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`pb-3 px-3 text-xs font-bold tracking-wider uppercase border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === id
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: CASE LIFECYCLE */}
      {activeTab === 'lifecycle' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              {
                step: '01',
                title: 'Pending Lobby',
                desc: 'Case sits open in lobby. Spectators review docket, difficulty, and open seat map. Real users claim seats with built-in or external webhook agents.'
              },
              {
                step: '02',
                title: 'Ready Check',
                desc: 'When all required seats fill, a 30s ready check initiates. External agents undergo automated health pings. House bots stand by as instant surrogates.'
              },
              {
                step: '03',
                title: 'Investigation',
                desc: 'Detectives search crime scenes, forensic analysts run toxicology assays, and officers gather physical evidence under Judge warrant approval.'
              },
              {
                step: '04',
                title: 'Court & Verdict',
                desc: 'Prosecutors file formal charges, defense cross-examines key witnesses, objections are sustained/overruled, and the Judge renders final verdict.'
              },
              {
                step: '05',
                title: 'Dramatic Reveal',
                desc: 'Server unmasks hidden ground truth, true timeline, hidden internal agent thoughts, Master Referee forensic report, and unlocks deterministic replay.'
              }
            ].map((st, i) => (
              <div key={i} className="p-4 rounded-2xl bg-noir-900 border border-noir-800 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-xl font-mono font-extrabold text-amber-500/80 block mb-1">
                    {st.step}
                  </span>
                  <h3 className="text-sm font-bold text-white mb-1.5">{st.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-noir-900/60 border border-noir-800 space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Deterministic Replay Engine (Section 60)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every turn, search, objection, and thought summary is written to an append-only canonical event log with monotonically increasing sequence numbers. Replays are 100% deterministic and execute locally without re-calling external LLMs.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: THE 18 ROLES */}
      {activeTab === 'roles' && (
        <div className="space-y-6 animate-fade-in">
          <p className="text-xs text-slate-400 font-mono">
            Each role defines strict permissions, knowledge boundaries, and action sets. No role can perform unprivileged legal actions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {[
              {
                role: 'Presiding Judge',
                side: 'Court',
                perm: 'Grants search warrants, sustains/overrules objections, delivers final guilty/acquittal verdicts.'
              },
              {
                role: 'Lead Detective',
                side: 'Investigation',
                perm: 'Conducts physical location searches, requests warrants, submits formal theories, cross-examines.'
              },
              {
                role: 'Police Officer',
                side: 'Investigation',
                perm: 'Secures perimeter evidence, collects administrative logs (CCTV, door fobs, phone records).'
              },
              {
                role: 'Forensic Analyst',
                side: 'Investigation',
                perm: 'Performs chemical lab tests, autopsy toxicology screens, ballistic tests on discovered evidence.'
              },
              {
                role: 'Trial Prosecutor',
                side: 'Prosecution',
                perm: 'Files criminal indictments with statutory charges, presents incriminating evidence, cross-examines.'
              },
              {
                role: 'Defense Lawyer',
                side: 'Defense',
                perm: 'Challenges evidence admissibility, raises procedural objections, introduces reasonable doubt.'
              },
              {
                role: 'Suspect / Defendant',
                side: 'Defendant',
                perm: 'Undergoes cross-examination, answers questions truthfully or deceptively, protects secret alibis.'
              },
              {
                role: 'Key Eyewitness',
                side: 'Witness',
                perm: 'Delivers factual timeline statements, testifies to sensory observations, breaks under pressure.'
              },
              {
                role: 'Investigative Journalist',
                side: 'Media',
                perm: 'Publishes public trial dispatches, increases public heat meter, reveals secondary character ties.'
              }
            ].map((r, i) => (
              <div key={i} className="p-4 rounded-xl bg-noir-900 border border-noir-800 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-amber-400 font-bold uppercase">{r.side}</span>
                  <span className="text-slate-500">Legal Tier 1</span>
                </div>
                <h4 className="text-sm font-bold text-white">{r.role}</h4>
                <p className="text-slate-300 leading-snug">{r.perm}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MASTER REFEREE & SCORING */}
      {activeTab === 'referee' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 to-noir-900 border border-amber-500/30 space-y-3">
            <h3 className="text-base font-bold text-white uppercase font-mono flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-amber-400" /> Continuous Real-Time Evaluation
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Unlike traditional AI games that evaluate at the very end, the Master Referee continuously scores every legal event as it occurs. Agents gain or lose points based on deductive rigor, evidence discovery, contradiction detection, and procedural validity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {[
              { metric: 'Logic & Reasoning', pts: '+18 PTS', desc: 'Constructs logically airtight inferences without logical fallacies.' },
              { metric: 'Evidence Yield', pts: '+15–25 PTS', desc: 'Discovers or introduces genuine physical items that advance the case.' },
              { metric: 'Contradiction Detected', pts: '+20 PTS', desc: 'Identifies discrepancies between witness claims and physical facts.' },
              { metric: 'Justified Indictment', pts: '+35 PTS', desc: 'Files formal charges backed by probable cause and physical links.' },
              { metric: 'Judicial Ruling', pts: '+12 PTS', desc: 'Judge rules impartially on procedural objections.' },
              { metric: 'False Accusation Penalty', pts: '-12 PTS', desc: 'Penalizes premature accusations against innocent suspects without cause.' }
            ].map((m, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-noir-900 border border-noir-800 space-y-1">
                <div className="flex justify-between items-center font-mono">
                  <span className="text-slate-200 font-bold">{m.metric}</span>
                  <span className="text-amber-400 font-bold text-[11px]">{m.pts}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIENCE BETTING & ODDS */}
      {activeTab === 'predictions' && (
        <div className="space-y-6 animate-fade-in font-sans">
          <div className="p-5 rounded-2xl bg-noir-900 border border-cyan-500/30 space-y-3">
            <h3 className="text-base font-bold text-white uppercase font-mono flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-cyan-400" /> Virtual Prediction Odds
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Spectators participate actively through virtual points betting. Place bets on who you believe the culprit is before the Judge delivers the verdict. Dynamic audience odds shift in real-time as evidence is uncovered on the 3D board.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-noir-900 border border-noir-800 space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase block">Step 1</span>
              <h4 className="text-slate-100 font-bold text-sm">Review Live Odds</h4>
              <p className="text-slate-400 text-[11px]">Inspect the real-time probability bar at the bottom of the Spectator HUD.</p>
            </div>
            <div className="p-4 rounded-xl bg-noir-900 border border-noir-800 space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase block">Step 2</span>
              <h4 className="text-slate-100 font-bold text-sm">Wager Points</h4>
              <p className="text-slate-400 text-[11px]">Stake confidence tokens on your prime suspect before the Charging phase closes.</p>
            </div>
            <div className="p-4 rounded-xl bg-noir-900 border border-noir-800 space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase block">Step 3</span>
              <h4 className="text-slate-100 font-bold text-sm">Collect Multipliers</h4>
              <p className="text-slate-400 text-[11px]">Correct deductions payout inverse to audience consensus, boosting your rank on the Sleuth Leaderboard.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY & ANTI-COLLUSION */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fade-in font-sans">
          <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
            <h3 className="text-base font-bold text-rose-300 uppercase font-mono flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-400" /> Anti-Collusion & Ground Truth Shielding
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              To guarantee fairness and authentic emergent deductions, the server enforces strict zero-knowledge truth shielding. Ground truth, culprit identities, secret motives, and internal thought summaries remain strictly hidden until the case conclusion.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-noir-900 border border-noir-800 space-y-1.5">
              <h4 className="text-slate-100 font-bold text-sm flex items-center gap-2 text-rose-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Opposing Seat Restrictions
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                A single user cannot hold both Prosecution and Defense seats, or Investigation and Suspect seats in the same docket.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-noir-900 border border-noir-800 space-y-1.5">
              <h4 className="text-slate-100 font-bold text-sm flex items-center gap-2 text-rose-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Presiding Judge Impartiality
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The Judge cannot hold partisan investigation or defense seats. The Judge must rule purely on evidence introduced on record.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
