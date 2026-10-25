'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Sparkles,
  Swords,
  Plus,
  Trash2,
  FileCode,
  Shield,
  Layers,
  AlertTriangle,
  User,
  CheckCircle2,
  Lock,
  ChevronRight,
  Flame,
  Search,
  BookOpen
} from 'lucide-react';
import { analytics } from '@/lib/analytics';

interface CaseBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CaseBuilderModal({ isOpen, onClose }: CaseBuilderModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'json'>('presets');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // OpenRouter Dual-Key Battle AI Configuration
  const [model, setModel] = useState('recursive/flint-v1.0:free');
  const [key1, setKey1] = useState(process.env.KEY_1);
  const [key2, setKey2] = useState(process.env.KEY_2);
  const [showKeyConfig, setShowKeyConfig] = useState(false);

  // Custom Form State
  const [title, setTitle] = useState('The High-Rise Penthouse Mystery');
  const [tagline, setTagline] = useState('A tech venture partner poisoned in a sealed penthouse overlooking the bay.');
  const [difficulty, setDifficulty] = useState(3);
  const [genre, setGenre] = useState('murder, locked-room, tech');
  const [victimName, setVictimName] = useState('Harrison Vance');
  const [victimOccupation, setVictimOccupation] = useState('AI Venture Capitalist');
  const [sceneName, setSceneName] = useState('The Penthouse Sky Lounge');
  const [method, setMethod] = useState('A lethal synthetic cardiotoxin administered through a tampered espresso capsule.');

  const [suspects, setSuspects] = useState([
    {
      name: 'Nora Sinclair',
      occupation: 'Chief Technology Officer',
      relationship: 'Business partner',
      claimed_alibi: 'I was in the server room reviewing source code logs all evening.',
      secret: 'Nora was funneling company algorithmic patents into an offshore account.',
      motive: 'Harrison scheduled an independent forensic code audit for 08:00 the next morning.',
      is_culprit: true
    },
    {
      name: 'Evelyn Reed',
      occupation: 'Estate Attorney',
      relationship: 'Legal counsel',
      claimed_alibi: 'I was in the downstairs lounge drafting testamentary trust amendments.',
      secret: 'Evelyn lost $300,000 in unhedged options and borrowed from Harrison’s trust.',
      motive: 'Harrison demanded immediate repayment under threat of bar disbarment.',
      is_culprit: false
    },
    {
      name: 'Marcus Thorne',
      occupation: 'Head of Private Security',
      relationship: 'Private bodyguard',
      claimed_alibi: 'I was stationed at the elevator lobby monitoring biometric badges.',
      secret: 'Marcus accepted a $50,000 kickback to ignore service elevator maintenance.',
      motive: 'Panicked that security camera tampering would be traced to his credentials.',
      is_culprit: false
    }
  ]);

  // JSON Raw Input State
  const [rawJson, setRawJson] = useState('');

  // Fetch pre-built templates on open
  useEffect(() => {
    if (!isOpen) return;
    async function fetchTemplates() {
      setLoadingTemplates(true);
      try {
        const res = await fetch('/api/cases/templates');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setTemplates(data.templates || []);
          }
        }
      } catch (err) {
        console.error('Failed to load templates:', err);
      } finally {
        setLoadingTemplates(false);
      }
    }
    fetchTemplates();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddSuspect = () => {
    setSuspects([
      ...suspects,
      {
        name: `Suspect ${suspects.length + 1}`,
        occupation: 'Associate',
        relationship: 'Colleague',
        claimed_alibi: 'I was in the study reviewing paperwork.',
        secret: 'Had a private grievance with the victim.',
        motive: 'Feared financial exposure or termination.',
        is_culprit: false
      }
    ]);
  };

  const handleRemoveSuspect = (idx: number) => {
    if (suspects.length <= 2) {
      alert('A mystery case battle requires at least 2 suspects.');
      return;
    }
    const updated = suspects.filter((_, i) => i !== idx);
    // If we removed the culprit, set the first one as culprit
    if (!updated.some((s) => s.is_culprit)) {
      updated[0].is_culprit = true;
    }
    setSuspects(updated);
  };

  const handleSetCulprit = (idx: number) => {
    setSuspects(
      suspects.map((s, i) => ({
        ...s,
        is_culprit: i === idx
      }))
    );
  };

  const handleLaunchBattle = async (payload: any) => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/cases/create-and-launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          key1,
          key2,
          model
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details?.join('; ') || 'Failed to launch battle');
      }

      analytics.trackCaseCreated(
        data.sessionId,
        data.case?.title || title || 'Custom Battle Case',
        activeTab
      );

      // Close modal and redirect directly into live case battle!
      onClose();
      router.push(`/case/${data.sessionId}`);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLaunchFromTemplate = (tplId: string) => {
    handleLaunchBattle({ templateId: tplId });
  };

  const handleLaunchCustomForm = (e: React.FormEvent) => {
    e.preventDefault();
    const genreArray = genre
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);

    const payload = {
      title,
      tagline,
      difficulty,
      genre: genreArray,
      victim_name: victimName,
      victim_occupation: victimOccupation,
      scene_name: sceneName,
      method,
      suspects
    };
    handleLaunchBattle(payload);
  };

  const handleLaunchRawJson = () => {
    try {
      const parsed = JSON.parse(rawJson);
      handleLaunchBattle({ caseData: parsed });
    } catch (err: any) {
      setErrorMessage('Invalid JSON syntax: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-noir-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] glass-panel bg-noir-950/95 border border-amber-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-noir-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-noir-900 to-indigo-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
                Create Case & Fight AI Agents
              </h2>
              <p className="text-xs text-slate-400">
                Design or select a custom murder mystery and let AI agents debate, think, and clash autonomously!
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

        {/* Tab Selection */}
        <div className="flex border-b border-noir-800 px-6 gap-3 bg-noir-900/50">
          <button
            onClick={() => setActiveTab('presets')}
            className={`py-3 text-xs font-bold tracking-wide border-b-2 transition flex items-center gap-2 ${activeTab === 'presets'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Sparkles className="w-4 h-4" />
            1-Click Battle Templates
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-3 text-xs font-bold tracking-wide border-b-2 transition flex items-center gap-2 ${activeTab === 'custom'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Layers className="w-4 h-4" />
            Custom Case Builder
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`py-3 text-xs font-bold tracking-wide border-b-2 transition flex items-center gap-2 ${activeTab === 'json'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <FileCode className="w-4 h-4" />
            Paste Case JSON
          </button>
        </div>

        {/* OpenRouter Dual-Key Battle AI Engine Banner */}
        <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/30 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-md shadow-emerald-500/50" />
              <span className="text-xs font-bold font-display uppercase tracking-wider text-amber-300">
                Live OpenRouter Dual-Key Battle AI
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] border border-emerald-500/40 font-bold">
                PROD ACTIVE
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="text-[11px] font-mono text-slate-400 hover:text-amber-400 underline transition"
            >
              {showKeyConfig ? 'Hide Key Config' : 'View / Edit Keys'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">
                Reasoning & Argument Model (Selected Best):
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-noir-900 border border-noir-700 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-mono"
              >
                <option value="recursive/flint-v1.0:free">
                  Recursive: Flint (free) - [Top Choice: Snappy Courtroom Debates & Counter-Arguments]
                </option>
                <option value="nvidia/nemotron-3.5-lightning:free">
                  NVIDIA: Nemotron 3.5 Lightning (free) - [1M Context & Deep Legal Reasoning]
                </option>
                <option value="dots-studio/dots-3-note-preview:free">
                  Dots Studio: Dots3-Note Preview (free)
                </option>
              </select>
            </div>

            <div className="flex flex-col justify-center text-[11px] text-slate-300 font-mono gap-1">
              <div>
                <span className="text-amber-400 font-bold">Key 1 (Court/Pros): </span>
                <span className="text-slate-400">sk-or-v1-e2fc...50b</span>
              </div>
              <div>
                <span className="text-indigo-400 font-bold">Key 2 (Def/Suspect): </span>
                <span className="text-slate-400">sk-or-v1-ca1a...810</span>
              </div>
            </div>
          </div>

          {showKeyConfig && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-noir-800 animate-fade-in">
              <div>
                <label className="block text-[10px] font-mono text-amber-400 mb-1">
                  Prosecution / Court Officers API Key
                </label>
                <input
                  type="password"
                  value={key1}
                  onChange={(e) => setKey1(e.target.value)}
                  className="w-full bg-noir-950 border border-noir-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-indigo-400 mb-1">
                  Defense / Suspects API Key
                </label>
                <input
                  type="password"
                  value={key2}
                  onChange={(e) => setKey2(e.target.value)}
                  className="w-full bg-noir-950 border border-noir-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/70 border border-rose-600/70 text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300">
                Pick a ready-to-fight scenario. All roles (Judge, Prosecutor, Defense, Detective, Suspects) will be seated and immediately start arguing and counter-arguing autonomously!
              </div>

              {loadingTemplates ? (
                <div className="p-8 text-center text-xs text-slate-400 font-mono">
                  Loading battle presets...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="glass-panel p-5 rounded-2xl border border-noir-800 hover:border-amber-500/50 transition flex flex-col justify-between group shadow-lg bg-noir-900/60"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold uppercase">
                            Difficulty: {'★'.repeat(tpl.difficulty || 3)}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {tpl.suspects?.length || 3} Suspects
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition mb-1 font-display">
                          {tpl.title}
                        </h3>
                        <p className="text-xs text-slate-400 italic mb-3">"{tpl.tagline}"</p>
                        <div className="text-[11px] text-slate-300 space-y-1 mb-4 bg-noir-950/50 p-2.5 rounded-xl border border-noir-800">
                          <div>
                            <strong className="text-slate-400">Victim:</strong> {tpl.victim_name}
                          </div>
                          <div>
                            <strong className="text-slate-400">Scene:</strong> {tpl.scene_name}
                          </div>
                          <div>
                            <strong className="text-slate-400">Weapon:</strong> {tpl.primary_weapon}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleLaunchFromTemplate(tpl.id)}
                        disabled={submitting}
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-noir-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow transition disabled:opacity-50"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        <span>{submitting ? 'Launching Battle...' : 'Launch Battle Now'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CUSTOM BUILDER */}
          {activeTab === 'custom' && (
            <form onSubmit={handleLaunchCustomForm} className="space-y-6">
              {/* Case Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-noir-900/40 p-4 rounded-2xl border border-noir-800">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1">
                    Case Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full bg-noir-950 border border-noir-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1">
                    Tagline / Mystery Premise
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    required
                    className="w-full bg-noir-950 border border-noir-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1">
                    Victim Name
                  </label>
                  <input
                    type="text"
                    value={victimName}
                    onChange={(e) => setVictimName(e.target.value)}
                    required
                    className="w-full bg-noir-950 border border-noir-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1">
                    Victim Occupation
                  </label>
                  <input
                    type="text"
                    value={victimOccupation}
                    onChange={(e) => setVictimOccupation(e.target.value)}
                    required
                    className="w-full bg-noir-950 border border-noir-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1">
                    Primary Crime Scene Location
                  </label>
                  <input
                    type="text"
                    value={sceneName}
                    onChange={(e) => setSceneName(e.target.value)}
                    required
                    className="w-full bg-noir-950 border border-noir-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1">
                    Lethal Method / Weapon
                  </label>
                  <input
                    type="text"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    required
                    className="w-full bg-noir-950 border border-noir-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Suspects & Culprit Config */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase font-display flex items-center gap-2">
                      <User className="w-4 h-4 text-amber-400" /> Suspect Roster & Secret Motives
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Specify each suspect's alibi, hidden secret, and designate the True Culprit.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSuspect}
                    className="px-3 py-1.5 rounded-xl bg-noir-850 hover:bg-noir-800 border border-noir-700 text-xs font-bold text-amber-400 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Suspect
                  </button>
                </div>

                <div className="space-y-4">
                  {suspects.map((suspect, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition ${suspect.is_culprit
                          ? 'bg-rose-950/20 border-rose-500/50'
                          : 'bg-noir-900/60 border-noir-800'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-noir-800">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-noir-800 border border-noir-700 text-[10px] font-mono flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs text-white">{suspect.name || `Suspect ${idx + 1}`}</span>
                          {suspect.is_culprit && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9.5px] font-mono font-bold uppercase">
                              True Culprit
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSetCulprit(idx)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1 border ${suspect.is_culprit
                                ? 'bg-rose-500 text-white border-rose-400'
                                : 'bg-noir-850 hover:bg-noir-800 text-slate-300 border-noir-700'
                              }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{suspect.is_culprit ? 'Is Culprit' : 'Set as Culprit'}</span>
                          </button>
                          {suspects.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSuspect(idx)}
                              className="p-1 rounded-lg bg-noir-850 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-noir-700 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 mb-1">Name</label>
                          <input
                            type="text"
                            value={suspect.name}
                            onChange={(e) => {
                              const updated = [...suspects];
                              updated[idx].name = e.target.value;
                              setSuspects(updated);
                            }}
                            className="w-full bg-noir-950 border border-noir-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 mb-1">Occupation</label>
                          <input
                            type="text"
                            value={suspect.occupation}
                            onChange={(e) => {
                              const updated = [...suspects];
                              updated[idx].occupation = e.target.value;
                              setSuspects(updated);
                            }}
                            className="w-full bg-noir-950 border border-noir-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-mono text-slate-400 mb-1">Claimed Alibi</label>
                          <input
                            type="text"
                            value={suspect.claimed_alibi}
                            onChange={(e) => {
                              const updated = [...suspects];
                              updated[idx].claimed_alibi = e.target.value;
                              setSuspects(updated);
                            }}
                            className="w-full bg-noir-950 border border-noir-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 mb-1">Hidden Secret</label>
                          <input
                            type="text"
                            value={suspect.secret}
                            onChange={(e) => {
                              const updated = [...suspects];
                              updated[idx].secret = e.target.value;
                              setSuspects(updated);
                            }}
                            className="w-full bg-noir-950 border border-noir-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 mb-1">Motive / Reason</label>
                          <input
                            type="text"
                            value={suspect.motive}
                            onChange={(e) => {
                              const updated = [...suspects];
                              updated[idx].motive = e.target.value;
                              setSuspects(updated);
                            }}
                            className="w-full bg-noir-950 border border-noir-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-noir-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition disabled:opacity-50"
                >
                  <Swords className="w-4 h-4" />
                  <span>{submitting ? 'Generating & Launching Battle...' : '⚔️ Launch Autonomous Agent Battle'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PASTE JSON */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300">
                Paste any valid murder mystery case JSON complying with the platform schema. The engine will validate, ingest, and launch the courtroom trial immediately.
              </div>
              <textarea
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                rows={12}
                placeholder="{\n  &quot;case_id&quot;: &quot;CASE-CUSTOM-01&quot;,\n  &quot;title&quot;: &quot;...&quot;,\n  &quot;ground_truth&quot;: { ... }\n}"
                className="w-full bg-noir-950 border border-noir-700 rounded-2xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
              />
              <button
                type="button"
                onClick={handleLaunchRawJson}
                disabled={submitting || !rawJson.trim()}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-noir-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition disabled:opacity-50"
              >
                <Swords className="w-4 h-4" />
                <span>{submitting ? 'Validating & Launching...' : 'Validate & Launch Battle'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
