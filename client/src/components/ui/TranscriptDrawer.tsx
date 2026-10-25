'use client';

import React, { useState } from 'react';
import { X, Search, FileText, Briefcase, Users, CheckCircle, AlertTriangle } from 'lucide-react';

interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: any[];
  evidenceList: any[];
  characters: any[];
  activeSeats: any[];
}

export default function TranscriptDrawer({
  isOpen,
  onClose,
  transcript,
  evidenceList,
  characters,
  activeSeats
}: TranscriptDrawerProps) {
  const [activeTab, setActiveTab] = useState<'record' | 'evidence' | 'roster'>('record');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredTranscript = transcript.filter((t) =>
    (t.narrative || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.agentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md glass-panel bg-noir-950/95 border-l border-noir-700/80 shadow-2xl flex flex-col pt-16">
      {/* Drawer Header */}
      <div className="p-4 border-b border-noir-800 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" /> Case Dossier & Record
          </h2>
          <p className="text-[10px] text-slate-400 font-mono">
            {transcript.length} logged entries in court record
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-noir-850 hover:bg-noir-800 border border-noir-700 flex items-center justify-center text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-noir-800 px-4 gap-2 pt-2">
        <button
          onClick={() => setActiveTab('record')}
          className={`pb-2 text-xs font-semibold tracking-wide border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'record'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Court Record ({transcript.length})
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`pb-2 text-xs font-semibold tracking-wide border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'evidence'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          Evidence ({evidenceList.length})
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-2 text-xs font-semibold tracking-wide border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'roster'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Roster ({activeSeats.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* TAB 1: RECORD */}
        {activeTab === 'record' && (
          <>
            {/* Search filter */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search statements, actions, agents..."
                className="w-full bg-noir-900 border border-noir-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            {filteredTranscript.map((entry) => (
              <div
                key={entry.id}
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  entry.contradiction_exposed
                    ? 'bg-red-950/30 border-red-800/60'
                    : entry.action === 'confess'
                    ? 'bg-rose-950/40 border-rose-700/60'
                    : entry.action === 'deliver_verdict'
                    ? 'bg-amber-950/30 border-amber-600/60'
                    : 'bg-noir-900/60 border-noir-800'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                  <span className="font-bold text-amber-400/90 uppercase">
                    {entry.agentName || entry.role}
                  </span>
                  <span>
                    R{entry.round} • {entry.phase?.toUpperCase()}
                  </span>
                </div>
                <div className="text-slate-200">{entry.narrative}</div>

                {entry.thought_summary && (
                  <div className="mt-2 text-[10.5px] bg-purple-950/40 text-purple-300 px-2.5 py-1.5 rounded-lg border border-purple-800/50 flex items-start gap-1.5 font-mono">
                    <span className="text-purple-400">💭</span>
                    <span>
                      <strong className="text-purple-200">Internal Thought: </strong>
                      <span className="italic">{entry.thought_summary}</span>
                    </span>
                  </div>
                )}

                {entry.contradiction_exposed && (
                  <div className="mt-2 text-[10px] bg-red-900/50 text-red-200 px-2 py-1 rounded border border-red-700/50 flex items-center gap-1 font-mono">
                    <AlertTriangle className="w-3 h-3 text-red-400" /> Contradiction Exposed: {entry.contradiction_exposed.evidenceName}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* TAB 2: EVIDENCE */}
        {activeTab === 'evidence' && (
          <div className="space-y-3">
            {evidenceList.map((ev) => (
              <div key={ev.id} className="p-3 rounded-xl bg-noir-900/80 border border-noir-700/80 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] font-bold text-amber-400 bg-noir-800 px-1.5 py-0.5 rounded">
                    {ev.id}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {ev.type}
                  </span>
                </div>
                <div className="font-bold text-slate-100 text-sm mb-1">{ev.name}</div>
                <p className="text-slate-300 text-xs leading-relaxed">{ev.description}</p>
                {ev.forensicResult && (
                  <div className="mt-2 p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-[11px] text-cyan-300 font-mono">
                    <strong>LAB REPORT:</strong> {ev.forensicResult.result}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2 text-[10px] font-mono">
                  <span className={`px-2 py-0.5 rounded ${ev.isAdmitted ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-noir-800 text-slate-400'}`}>
                    {ev.isAdmitted ? 'Admitted in Court' : 'Field Discovered'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: ROSTER */}
        {activeTab === 'roster' && (
          <div className="space-y-3">
            {activeSeats.map((seat) => (
              <div key={seat.seatKey || seat.agentId} className="p-3 rounded-xl bg-noir-900/80 border border-noir-700/80 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                    {seat.displayName}
                    {seat.isHouseBot ? (
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">HOUSE BOT</span>
                    ) : (
                      <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded font-mono border border-emerald-700">HUMAN AGENT</span>
                    )}
                  </div>
                  <div className="text-[10px] text-amber-400 uppercase font-mono mt-0.5">
                    Role: {seat.role}
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="text-slate-400 text-[10px]">ELO RATING</div>
                  <div className="font-bold text-slate-200">{seat.rating || 1200}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
