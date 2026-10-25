'use client';

import React, { useState, useEffect } from 'react';
import { X, Zap, Bot, Check, AlertCircle, RefreshCw, Shield, Play } from 'lucide-react';
import { sounds } from '@/lib/audio';

interface AttachLlmModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  activeSeats: any[];
  onLlmAttached?: () => void;
}

const LLM_PROVIDERS: Record<string, { label: string; defaultModel: string; models: string[]; defaultBaseUrl: string }> = {
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
    defaultBaseUrl: 'https://api.openai.com/v1'
  },
  anthropic: {
    label: 'Anthropic Claude',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    defaultBaseUrl: 'https://api.anthropic.com/v1'
  },
  gemini: {
    label: 'Google Gemini',
    defaultModel: 'gemini-1.5-flash',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    defaultBaseUrl: ''
  },
  groq: {
    label: 'Groq (Ultra-Fast)',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    defaultBaseUrl: 'https://api.groq.com/openai/v1'
  },
  openrouter: {
    label: 'OpenRouter (Reasoner & Battle AI)',
    defaultModel: 'recursive/flint-v1.0:free',
    models: [
      'recursive/flint-v1.0:free',
      'nvidia/nemotron-3.5-lightning:free',
      'dots-studio/dots-3-note-preview:free',
      'meta-llama/llama-3.3-70b-instruct'
    ],
    defaultBaseUrl: 'https://openrouter.ai/api/v1'
  },
  local: {
    label: 'Local Ollama / LM Studio',
    defaultModel: 'llama3',
    models: ['llama3', 'mistral', 'deepseek-r1'],
    defaultBaseUrl: 'http://localhost:11434/v1'
  }
};

export default function AttachLlmModal({
  isOpen,
  onClose,
  sessionId,
  activeSeats = [],
  onLlmAttached
}: AttachLlmModalProps) {
  const [selectedSeatKey, setSelectedSeatKey] = useState<string>('');
  const [provider, setProvider] = useState<string>('openai');
  const [model, setModel] = useState<string>('gpt-4o-mini');
  const [apiKey, setApiKey] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Default to defense_lawyer or first seat
  useEffect(() => {
    if (activeSeats.length > 0 && !selectedSeatKey) {
      const def = activeSeats.find(s => s.role === 'defense_lawyer' || s.role === 'prosecutor' || s.role === 'detective');
      setSelectedSeatKey(def?.seatKey || activeSeats[0]?.seatKey || '');
    }
  }, [activeSeats, selectedSeatKey]);

  if (!isOpen) return null;

  const handleProviderSelect = (p: string) => {
    setProvider(p);
    const info = LLM_PROVIDERS[p];
    if (info) {
      setModel(info.defaultModel);
      setBaseUrl(info.defaultBaseUrl);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setErrorMessage('');
    try {
      const res = await fetch('/api/sessions/llm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          model,
          apiKey: apiKey.trim(),
          baseUrl: baseUrl.trim()
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleAttachLlm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeatKey) {
      setErrorMessage('Please select a seat to control');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/sessions/${sessionId}/seats/${selectedSeatKey}/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          llmConfig: {
            provider,
            model,
            apiKey: apiKey.trim(),
            baseUrl: baseUrl.trim(),
            temperature: 0.75
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to attach LLM to seat');
      } else {
        sounds.playGavel();
        setSuccessMessage(`Successfully connected your ${provider.toUpperCase()} model to ${data.seat?.displayName || selectedSeatKey}!`);
        if (onLlmAttached) onLlmAttached();
        setTimeout(() => {
          onClose();
          setSuccessMessage('');
        }, 1800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoEquipDualKeys = async () => {
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await fetch(`/api/sessions/${sessionId}/auto-attach-llms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key1: process.env.KEY_1,
          key2: process.env.KEY_2,
          model: 'recursive/flint-v1.0:free'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to auto-equip LLMs');
      }
      sounds.playGavel();
      setSuccessMessage(`⚡ Armed all ${data.attachedCount} agents with OpenRouter Dual-Key AI (Recursive: Flint)!`);
      if (onLlmAttached) onLlmAttached();
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Auto-equip error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSeat = activeSeats.find(s => s.seatKey === selectedSeatKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-noir-950 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-noir-800 bg-noir-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display uppercase tracking-wide flex items-center gap-2">
                Take Control with Your Own LLM
              </h2>
              <p className="text-[11px] text-slate-400">
                Connect your LLM model directly into this live court proceeding
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-noir-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleAttachLlm} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-mono">
          {/* Quick Action: Auto-Equip Dual OpenRouter Keys */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 border border-amber-500/40 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-amber-300 font-display uppercase tracking-wider">
                  OpenRouter Dual-Key Live Arena
                </span>
              </div>
              <span className="text-[10px] text-emerald-300 font-mono font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
                RECOMMENDED
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans">
              Instantly equip Key 1 (Court &amp; Prosecution) and Key 2 (Defense &amp; Suspects) using <strong className="text-amber-400">Recursive: Flint (free)</strong> so agents argue and counter-argue autonomously!
            </p>
            <button
              type="button"
              disabled={submitting}
              onClick={handleAutoEquipDualKeys}
              className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-noir-950 font-bold uppercase text-[10px] tracking-wider transition flex items-center justify-center gap-1.5 shadow shadow-amber-500/30 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Auto-Equip Both Keys To All Agents</span>
            </button>
          </div>

          {/* Target Seat Picker */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[10px] flex items-center justify-between">
              <span>1. Target Seat to Control</span>
              {selectedSeat?.hasLlm && (
                <span className="text-purple-400 text-[9px] bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30">
                  Currently LLM Driven ({selectedSeat.llmProvider})
                </span>
              )}
            </label>
            <select
              value={selectedSeatKey}
              onChange={(e) => setSelectedSeatKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-noir-900 border border-noir-700 text-slate-100 font-sans focus:outline-none focus:border-purple-500 text-xs"
            >
              {activeSeats.map((s) => (
                <option key={s.seatKey} value={s.seatKey}>
                  {s.displayName} ({s.role.toUpperCase()}) {s.hasLlm ? `[${s.llmProvider}]` : '[Bot]'}
                </option>
              ))}
            </select>
          </div>

          {/* Provider Picker */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[10px]">
              2. Select LLM Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(LLM_PROVIDERS).map(([key, prov]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => handleProviderSelect(key)}
                  className={`p-2.5 rounded-xl text-left border transition ${provider === key
                    ? 'bg-purple-950/40 border-purple-500 text-purple-200 font-bold shadow'
                    : 'bg-noir-900 hover:bg-noir-850 border-noir-800 text-slate-400'
                    }`}
                >
                  <div className="text-[11px] font-sans text-slate-100">{prov.label}</div>
                  <div className="text-[9px] text-slate-500 truncate mt-0.5">{prov.defaultModel}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Model Name & API Key */}
          <div className="p-3.5 rounded-xl bg-noir-900/80 border border-noir-800 space-y-3">
            <div>
              <label className="block text-slate-400 uppercase text-[9px] mb-1 font-bold">
                Model Name
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={LLM_PROVIDERS[provider]?.defaultModel}
                className="w-full px-3 py-1.5 rounded-lg bg-noir-950 border border-noir-700 text-slate-100 focus:outline-none focus:border-purple-500 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase text-[9px] mb-1 font-bold flex items-center justify-between">
                <span>API Key / Secret Token</span>
                <span className="text-[9px] text-emerald-400 font-sans flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Stored in browser memory only
                </span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'local' ? 'Optional for local Ollama' : 'Enter API Key...'}
                className="w-full px-3 py-1.5 rounded-lg bg-noir-950 border border-noir-700 text-slate-100 focus:outline-none focus:border-purple-500 text-xs font-mono"
              />
            </div>

            {provider === 'local' && (
              <div>
                <label className="block text-slate-400 uppercase text-[9px] mb-1 font-bold">
                  Ollama / Local Endpoint URL
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434/v1"
                  className="w-full px-3 py-1.5 rounded-lg bg-noir-950 border border-noir-700 text-slate-100 focus:outline-none focus:border-purple-500 text-xs font-mono"
                />
              </div>
            )}
          </div>

          {/* Test Dry-run response */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-[11px] ${testResult.success ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
              }`}>
              {testResult.success ? (
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-emerald-400 mb-1">
                    <Check className="w-3.5 h-3.5" /> Handshake Verified!
                  </div>
                  <div className="italic text-slate-200">"{testResult.sampleResponse}"</div>
                </div>
              ) : (
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{testResult.error}</span>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              {successMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-4 py-2.5 rounded-xl bg-noir-900 hover:bg-noir-850 border border-noir-700 text-slate-300 font-bold uppercase text-[10px] tracking-wider transition flex items-center gap-1.5"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" /> : <Play className="w-3.5 h-3.5 text-purple-400" />}
              {testing ? 'Pinging...' : 'Test Ping'}
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold uppercase text-[11px] tracking-wider transition shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              {submitting ? 'Connecting Seat...' : `Take Control as ${selectedSeat?.displayName || 'Agent'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
