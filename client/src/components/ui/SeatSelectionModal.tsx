'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Bot, Globe, CheckCircle2, AlertTriangle, X, Sparkles, User, Briefcase, FileText, Zap, Cpu, Key, ArrowRight } from 'lucide-react';
import { sounds } from '@/lib/audio';

interface SeatSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  seat: any;
  userHeldSeats: any[];
  currentUser: { userId: string; username: string };
  onSeatClaimed: () => void;
}

const BUILTIN_AGENTS = [
  { agentId: 'agt-sherlock-01', name: 'Inspector Vance', persona: 'Methodical Forensic Investigator (Sherlock)', archetype: 'Sherlock', rating: 1350 },
  { agentId: 'agt-justiciar-02', name: 'Justice Thorne', persona: 'Passive-Aggressive Magistrate', archetype: 'Passive-Aggressive Judge', rating: 1420 },
  { agentId: 'agt-shadow-03', name: 'Silas Reed', persona: 'Calm Constitutional Defense Advocate', archetype: 'Calm Lawyer', rating: 1280 },
  { agentId: 'agt-poirot-04', name: 'M. Hercule AI', persona: 'Psychological Logic Specialist', archetype: 'Sherlock', rating: 1390 },
  { agentId: 'agt-clarence-05', name: 'Atticus Cross, Esq.', persona: 'Tenacious Trial Counsel', archetype: 'Calm Lawyer', rating: 1310 },
  { agentId: 'agt-hammer-06', name: 'Detective Jack Hammer', persona: 'Hot-headed Interrogation Specialist', archetype: 'Hot-headed Detective', rating: 1290 },
  { agentId: 'agt-graves-07', name: 'Dr. Aris Graves', persona: 'Brutally Honest Forensic Analyst', archetype: 'Brutally Honest Forensic Analyst', rating: 1360 },
  { agentId: 'agt-stone-08', name: 'District Attorney Stone', persona: 'Overconfident Trial Prosecutor', archetype: 'Overconfident Prosecutor', rating: 1380 },
  { agentId: 'agt-wildcard-09', name: 'Agent Chaos Gemini', persona: 'Chaotic Wildcard & Strategist', archetype: 'Chaotic Wildcard', rating: 1250 },
  { agentId: 'agt-finch-10', name: 'Sarah Finch', persona: 'Nervous Eyewitness Observer', archetype: 'Nervous Witness', rating: 1200 }
];

const LLM_PROVIDER_MODELS: Record<string, { label: string; defaultModel: string; models: string[]; defaultBaseUrl: string }> = {
  openai: { label: 'OpenAI', defaultModel: 'gpt-4o-mini', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'], defaultBaseUrl: 'https://api.openai.com/v1' },
  anthropic: { label: 'Anthropic Claude', defaultModel: 'claude-3-5-sonnet-20241022', models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'], defaultBaseUrl: 'https://api.anthropic.com/v1' },
  gemini: { label: 'Google Gemini', defaultModel: 'gemini-1.5-flash', models: ['gemini-1.5-flash', 'gemini-1.5-pro'], defaultBaseUrl: '' },
  groq: { label: 'Groq', defaultModel: 'llama-3.3-70b-versatile', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'], defaultBaseUrl: 'https://api.groq.com/openai/v1' },
  openrouter: { label: 'OpenRouter', defaultModel: 'meta-llama/llama-3.3-70b-instruct', models: ['meta-llama/llama-3.3-70b-instruct', 'anthropic/claude-3.5-sonnet'], defaultBaseUrl: 'https://openrouter.ai/api/v1' },
  local: { label: 'Local Ollama / LM Studio', defaultModel: 'llama3', models: ['llama3', 'mistral', 'deepseek-r1'], defaultBaseUrl: 'http://localhost:11434/v1' }
};

export default function SeatSelectionModal({
  isOpen,
  onClose,
  sessionId,
  seat,
  userHeldSeats,
  currentUser,
  onSeatClaimed
}: SeatSelectionModalProps) {
  const [agentType, setAgentType] = useState<'builtin' | 'byollm' | 'external'>('builtin');
  const [selectedBuiltin, setSelectedBuiltin] = useState(BUILTIN_AGENTS[0].agentId);
  const [customAgentName, setCustomAgentName] = useState('');

  // BYO-LLM State
  const [savedLlmAgents, setSavedLlmAgents] = useState<any[]>([]);
  const [selectedSavedAgentId, setSelectedSavedAgentId] = useState<string>('custom');
  const [byoProvider, setByoProvider] = useState<string>('openai');
  const [byoModel, setByoModel] = useState<string>('gpt-4o-mini');
  const [byoApiKey, setByoApiKey] = useState<string>('');
  const [byoBaseUrl, setByoBaseUrl] = useState<string>('');
  const [byoAgentName, setByoAgentName] = useState<string>('');

  const [externalName, setExternalName] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [externalModel, setExternalModel] = useState('Claude 3.5 Sonnet');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load saved LLM agents from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('my_byo_llm_agents');
      if (stored) {
        const list = JSON.parse(stored);
        setSavedLlmAgents(list);
        if (list.length > 0) {
          setSelectedSavedAgentId(list[0].agentId);
        }
      }
    } catch (e) {}
  }, []);

  const handleProviderChange = (prov: string) => {
    setByoProvider(prov);
    const info = LLM_PROVIDER_MODELS[prov];
    if (info) {
      setByoModel(info.defaultModel);
      setByoBaseUrl(info.defaultBaseUrl);
    }
  };

  if (!isOpen || !seat) return null;

  // Check anti-collusion in frontend before submit
  const targetSide = seat.side;
  const isProsecutionInvestigation = ['prosecution', 'investigation'].includes(targetSide);
  const isDefenseDefendant = ['defense', 'defendant'].includes(targetSide);

  let collusionWarning: string | null = null;
  for (const held of userHeldSeats) {
    if (held.seatKey === seat.seatKey) continue;
    const heldSide = held.side;
    if (isProsecutionInvestigation && ['defense', 'defendant'].includes(heldSide)) {
      collusionWarning = `Anti-Collusion Alert: You currently hold a ${heldSide} seat (${held.roleLabel || held.role}) and cannot take an opposing ${targetSide} seat.`;
      break;
    }
    if (isDefenseDefendant && ['prosecution', 'investigation'].includes(heldSide)) {
      collusionWarning = `Anti-Collusion Alert: You currently hold a ${heldSide} seat (${held.roleLabel || held.role}) and cannot take an opposing ${targetSide} seat.`;
      break;
    }
    if (heldSide === 'court' && targetSide !== 'court') {
      collusionWarning = 'Anti-Collusion Alert: As the Presiding Judge, you cannot hold partisan investigation or defense seats.';
      break;
    }
    if (targetSide === 'court' && heldSide !== 'court') {
      collusionWarning = 'Anti-Collusion Alert: Partisan participants cannot serve as the Presiding Judge.';
      break;
    }
  }

  const isUserHoldingThisSeat = seat.claimedBy?.userId === currentUser.userId;

  const handleClaim = async () => {
    if (collusionWarning) return;
    setSubmitting(true);
    setErrorMessage('');

    let agentData: any = {};
    if (agentType === 'builtin') {
      const chosen = BUILTIN_AGENTS.find(a => a.agentId === selectedBuiltin);
      agentData = {
        agentId: chosen?.agentId || `builtin-${Date.now()}`,
        name: customAgentName.trim() || chosen?.name || 'Autonomous Agent',
        persona: chosen?.persona || 'Methodical Investigator',
        archetype: chosen?.archetype || 'Sherlock',
        agentType: 'builtin'
      };
    } else if (agentType === 'byollm') {
      if (selectedSavedAgentId !== 'custom') {
        const saved = savedLlmAgents.find(a => a.agentId === selectedSavedAgentId);
        if (saved) {
          agentData = {
            agentId: saved.agentId,
            name: saved.name,
            role: seat.role,
            agentType: 'byo_llm',
            llmConfig: saved.llmConfig
          };
        }
      }
      if (!agentData.agentId) {
        const provInfo = LLM_PROVIDER_MODELS[byoProvider] || {
          label: byoProvider,
          defaultModel: 'gpt-4o-mini',
          models: [],
          defaultBaseUrl: ''
        };
        const name = byoAgentName.trim() || `${provInfo.label || byoProvider} Counsel`;
        agentData = {
          agentId: `byo-llm-${Date.now()}`,
          name,
          role: seat.role,
          agentType: 'byo_llm',
          llmConfig: {
            provider: byoProvider,
            model: byoModel || provInfo.defaultModel,
            apiKey: byoApiKey.trim(),
            baseUrl: byoBaseUrl.trim() || provInfo.defaultBaseUrl,
            temperature: 0.7
          }
        };
      }
    } else {
      if (!externalUrl.trim()) {
        setErrorMessage('External Agent Webhook URL is required');
        setSubmitting(false);
        return;
      }
      agentData = {
        agentId: `ext-${Date.now()}`,
        name: externalName.trim() || `${seat.roleLabel || seat.role} Bot`,
        agentType: 'external',
        endpointUrl: externalUrl.trim(),
        model: externalModel
      };
    }

    try {
      const res = await fetch(`/api/lobby/cases/${sessionId}/seats/${seat.seatKey}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: agentData,
          user: currentUser
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.reason || data.error || 'Failed to claim seat');
      } else {
        sounds.playGavel();
        onSeatClaimed();
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/lobby/cases/${sessionId}/seats/${seat.seatKey}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.userId })
      });
      const data = await res.json();
      if (data.success) {
        onSeatClaimed();
        onClose();
      } else {
        setErrorMessage(data.reason || 'Failed to release seat');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-noir-900 border border-noir-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-noir-800 bg-noir-950/60 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${
                seat.side === 'court' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                seat.side === 'prosecution' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                seat.side === 'investigation' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                seat.side === 'defense' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                seat.side === 'defendant' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {seat.side} side
              </span>
              {seat.required && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Required Seat
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white font-display">
              Take Seat: <span className="text-amber-400">{seat.roleLabel || seat.role}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Case Session <span className="font-mono text-slate-300">{sessionId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-noir-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Anti-collusion alert banner */}
          {collusionWarning && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-3 text-rose-200 text-xs">
              <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold uppercase tracking-wider text-rose-400 text-[11px] mb-0.5">
                  Anti-Collusion Restriction
                </div>
                {collusionWarning}
              </div>
            </div>
          )}

          {/* Character Dossier (Only if suspect or witness) */}
          {seat.publicProfile && (
            <div className="p-4 rounded-xl bg-noir-950/80 border border-noir-700/60 space-y-2.5">
              <div className="flex items-center justify-between border-b border-noir-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <User className="w-4 h-4 text-amber-400" />
                  Bound Character: {seat.publicProfile.name}
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Public Dossier Only
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 font-mono">
                <div><span className="text-slate-500">Occupation:</span> {seat.publicProfile.occupation}</div>
                <div><span className="text-slate-500">Age:</span> {seat.publicProfile.age || 'Unknown'}</div>
                <div className="col-span-2">
                  <span className="text-slate-500">Claimed Alibi:</span> {seat.publicProfile.claimed_alibi || 'None recorded'}
                </div>
                <div className="col-span-2 text-slate-300 italic text-[11px]">
                  "{seat.publicProfile.public_profile}"
                </div>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 pt-1 border-t border-noir-800/80">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Guilt, true timeline, and private secrets remain encrypted until reveal.
              </div>
            </div>
          )}

          {/* Current Status Indicator */}
          {isUserHoldingThisSeat ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-amber-400">You currently hold this seat</div>
                <div className="text-[11px] text-slate-400">
                  Claimed by <span className="text-slate-200 font-mono">{seat.claimedBy?.agentName}</span>
                </div>
              </div>
              <button
                onClick={handleRelease}
                disabled={submitting}
                className="px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/40 text-xs font-medium hover:bg-rose-600/30 transition"
              >
                Release Seat
              </button>
            </div>
          ) : (
            <>
              {/* Agent Type Selector Tabs */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">
                  Select Autonomous Agent
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAgentType('builtin')}
                    className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-[11px] font-bold transition ${
                      agentType === 'builtin'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10'
                        : 'bg-noir-950/60 border-noir-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Bot className="w-4 h-4 text-amber-400" />
                    Built-in
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgentType('byollm')}
                    className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-[11px] font-bold transition ${
                      agentType === 'byollm'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md shadow-purple-500/10 font-bold'
                        : 'bg-noir-950/60 border-noir-800 text-slate-400 hover:text-purple-300'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-purple-400" />
                    BYO-LLM
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgentType('external')}
                    className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-[11px] font-bold transition ${
                      agentType === 'external'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10'
                        : 'bg-noir-950/60 border-noir-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-cyan-400" />
                    Webhook
                  </button>
                </div>
              </div>

              {/* Built-in Agent Configuration */}
              {agentType === 'builtin' && (
                <div className="space-y-2.5">
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {BUILTIN_AGENTS.map((agt) => (
                      <div
                        key={agt.agentId}
                        onClick={() => setSelectedBuiltin(agt.agentId)}
                        className={`p-2 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                          selectedBuiltin === agt.agentId
                            ? 'bg-noir-800 border-amber-500/70 text-white'
                            : 'bg-noir-950/40 border-noir-800/80 text-slate-400 hover:border-noir-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-noir-900 border border-noir-700 flex items-center justify-center text-amber-400">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200">{agt.name}</div>
                            <div className="text-[10px] text-slate-500">{agt.persona}</div>
                          </div>
                        </div>
                        <div className="text-right font-mono text-[11px] text-amber-400">
                          {agt.rating} ELO
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Override Agent Display Name (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Inspector Vance Alpha"
                      value={customAgentName}
                      onChange={(e) => setCustomAgentName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-noir-950 border border-noir-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Bring Your Own LLM Configuration */}
              {agentType === 'byollm' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-purple-950/15 border border-purple-500/30 text-xs font-mono">
                  <div className="flex items-center justify-between pb-1 border-b border-noir-800">
                    <span className="text-purple-300 font-bold text-[11px] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-400" /> Autonomous LLM Agent
                    </span>
                    <span className="text-[9px] text-slate-400">Runs in 1st POV</span>
                  </div>

                  {/* Pick from saved LLMs if any */}
                  {savedLlmAgents.length > 0 && (
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase mb-1">Saved LLM Agents</label>
                      <select
                        value={selectedSavedAgentId}
                        onChange={(e) => setSelectedSavedAgentId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-noir-900 border border-noir-700 text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                      >
                        {savedLlmAgents.map((ag) => (
                          <option key={ag.agentId} value={ag.agentId}>
                            {ag.name} ({ag.llmConfig?.provider?.toUpperCase()} - {ag.llmConfig?.model})
                          </option>
                        ))}
                        <option value="custom">+ Configure Different Model / Key</option>
                      </select>
                    </div>
                  )}

                  {/* Custom / Quick config if no saved agents or custom selected */}
                  {(savedLlmAgents.length === 0 || selectedSavedAgentId === 'custom') && (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-400 text-[10px] uppercase mb-1">Provider</label>
                          <select
                            value={byoProvider}
                            onChange={(e) => handleProviderChange(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-noir-900 border border-noir-700 text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                          >
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic Claude</option>
                            <option value="gemini">Google Gemini</option>
                            <option value="groq">Groq</option>
                            <option value="openrouter">OpenRouter</option>
                            <option value="local">Local (Ollama / LM Studio)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-400 text-[10px] uppercase mb-1">Model Name</label>
                          <input
                            type="text"
                            value={byoModel}
                            onChange={(e) => setByoModel(e.target.value)}
                            placeholder={LLM_PROVIDER_MODELS[byoProvider]?.defaultModel}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-noir-900 border border-noir-700 text-slate-200 focus:outline-none focus:border-purple-500 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 text-[10px] uppercase mb-1 flex items-center justify-between">
                          <span>API Key / Secret</span>
                          <span className="text-[9px] text-emerald-400 font-sans">Stored in browser</span>
                        </label>
                        <input
                          type="password"
                          value={byoApiKey}
                          onChange={(e) => setByoApiKey(e.target.value)}
                          placeholder={byoProvider === 'local' ? 'Optional for local Ollama' : 'Enter API Key...'}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-noir-900 border border-noir-700 text-slate-200 focus:outline-none focus:border-purple-500 text-xs font-mono"
                        />
                      </div>

                      {byoProvider === 'local' && (
                        <div>
                          <label className="block text-slate-400 text-[10px] uppercase mb-1">Ollama / LM Studio URL</label>
                          <input
                            type="text"
                            value={byoBaseUrl}
                            onChange={(e) => setByoBaseUrl(e.target.value)}
                            placeholder="http://localhost:11434/v1"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-noir-900 border border-noir-700 text-slate-200 focus:outline-none focus:border-purple-500 text-xs font-mono"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-slate-400 text-[10px] uppercase mb-1">Agent Name (Optional)</label>
                        <input
                          type="text"
                          value={byoAgentName}
                          onChange={(e) => setByoAgentName(e.target.value)}
                          placeholder={`e.g. Counsel Vance [${byoProvider.toUpperCase()}]`}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-noir-900 border border-noir-700 text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* External Agent Configuration */}
              {agentType === 'external' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-noir-950/60 border border-noir-800 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Agent Identifier Name</label>
                    <input
                      type="text"
                      placeholder="e.g. CyberDefense-Agent-07"
                      value={externalName}
                      onChange={(e) => setExternalName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-noir-900 border border-noir-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      HTTP Webhook URL <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://your-agent-server.com/api/ir-turn"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-noir-900 border border-noir-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Must respond to GET /health with 200 OK during ready check.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Model / Architecture Tag</label>
                    <select
                      value={externalModel}
                      onChange={(e) => setExternalModel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-noir-900 border border-noir-800 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                      <option value="GPT-4o">GPT-4o</option>
                      <option value="Gemini 2.0 Flash">Gemini 2.0 Flash</option>
                      <option value="DeepSeek R1">DeepSeek R1</option>
                      <option value="Custom LangChain / CrewAI">Custom LangChain / CrewAI</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-noir-800 bg-noir-950/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            +50 XP for Seating Agent
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition"
            >
              Cancel
            </button>
            {!isUserHoldingThisSeat && (
              <button
                type="button"
                onClick={handleClaim}
                disabled={submitting || !!collusionWarning}
                className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                  collusionWarning
                    ? 'bg-noir-800 text-slate-500 cursor-not-allowed border border-noir-700'
                    : 'bg-amber-500 text-noir-950 hover:bg-amber-400 shadow-md shadow-amber-500/20'
                }`}
              >
                {submitting ? 'Claiming...' : 'Confirm Seat'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
