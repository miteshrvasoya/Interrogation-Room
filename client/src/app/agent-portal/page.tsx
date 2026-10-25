'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Key, Terminal, Play, Check, Copy, Code, Sparkles, ShieldAlert, Cpu, Zap, Settings, Globe, Shield, Eye, EyeOff, AlertCircle, RefreshCw, Trash2, ArrowRight } from 'lucide-react';

export default function AgentPortalPage() {
  const [activeTab, setActiveTab] = useState<'builtin' | 'byollm' | 'external' | 'sandbox'>('byollm');

  // BYO-LLM (Bring Your Own LLM) State
  const [llmProvider, setLlmProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'groq' | 'openrouter' | 'local'>('openai');
  const [llmAgentName, setLlmAgentName] = useState('');
  const [llmRole, setLlmRole] = useState('defense_lawyer');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [llmBaseUrl, setLlmBaseUrl] = useState('');
  const [llmModel, setLlmModel] = useState('gpt-4o-mini');
  const [llmTemperature, setLlmTemperature] = useState(0.7);
  const [llmSystemPrompt, setLlmSystemPrompt] = useState('Speak strictly in 1st Person POV. Rebut and counter all opponent arguments passionately like an elite trial attorney.');
  const [testingLlm, setTestingLlm] = useState(false);
  const [testLlmResult, setTestLlmResult] = useState<any>(null);
  const [savedLlmAgents, setSavedLlmAgents] = useState<any[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load saved LLM agents from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('my_byo_llm_agents');
      if (stored) {
        setSavedLlmAgents(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const PROVIDER_PRESETS: Record<string, { label: string; defaultModel: string; models: string[]; defaultBaseUrl: string; placeholderKey: string; badge: string; desc: string }> = {
    openai: {
      label: 'OpenAI',
      defaultModel: 'gpt-4o-mini',
      models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      defaultBaseUrl: 'https://api.openai.com/v1',
      placeholderKey: 'sk-proj-...',
      badge: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      desc: 'Industry standard for structured legal reasoning and argumentation.'
    },
    anthropic: {
      label: 'Anthropic Claude',
      defaultModel: 'claude-3-5-sonnet-20241022',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
      defaultBaseUrl: 'https://api.anthropic.com/v1',
      placeholderKey: 'sk-ant-...',
      badge: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
      desc: 'Superb nuanced cross-examination and rapid rhetoric analysis.'
    },
    gemini: {
      label: 'Google Gemini',
      defaultModel: 'gemini-1.5-flash',
      models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
      defaultBaseUrl: '',
      placeholderKey: 'AIzaSy...',
      badge: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
      desc: 'Ultra-fast low-latency responses with expansive context windows.'
    },
    groq: {
      label: 'Groq (Ultra-Fast)',
      defaultModel: 'llama-3.3-70b-versatile',
      models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
      defaultBaseUrl: 'https://api.groq.com/openai/v1',
      placeholderKey: 'gsk_...',
      badge: 'border-orange-500/40 text-orange-400 bg-orange-500/10',
      desc: 'Sub-second LPUs for instantaneous objections and real-time trial heat.'
    },
    openrouter: {
      label: 'OpenRouter',
      defaultModel: 'meta-llama/llama-3.3-70b-instruct',
      models: ['meta-llama/llama-3.3-70b-instruct', 'anthropic/claude-3.5-sonnet', 'deepseek/deepseek-chat', 'google/gemini-2.0-flash-exp:free'],
      defaultBaseUrl: 'https://openrouter.ai/api/v1',
      placeholderKey: 'sk-or-v1-...',
      badge: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
      desc: 'Route across 200+ frontier and open-source models seamlessly.'
    },
    local: {
      label: 'Local Ollama / LM Studio',
      defaultModel: 'llama3',
      models: ['llama3', 'mistral', 'deepseek-r1', 'qwen2.5:7b'],
      defaultBaseUrl: 'http://localhost:11434/v1',
      placeholderKey: 'Optional for Local LLM',
      badge: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
      desc: '100% private, zero-cost offline models running on your local machine.'
    }
  };

  const handleSelectProvider = (prov: any) => {
    setLlmProvider(prov);
    const p = PROVIDER_PRESETS[prov];
    if (p) {
      setLlmModel(p.defaultModel);
      setLlmBaseUrl(p.defaultBaseUrl);
    }
  };

  const handleTestLlm = async () => {
    setTestingLlm(true);
    setTestLlmResult(null);
    try {
      const res = await fetch('/api/sessions/llm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: llmProvider,
          apiKey: llmApiKey,
          baseUrl: llmBaseUrl,
          model: llmModel
        })
      });
      const data = await res.json();
      setTestLlmResult(data);
    } catch (err: any) {
      setTestLlmResult({ success: false, error: err.message });
    } finally {
      setTestingLlm(false);
    }
  };

  const handleSaveLlmAgent = (e: React.FormEvent) => {
    e.preventDefault();
    const newAgent = {
      agentId: `byo-llm-${Date.now()}`,
      name: llmAgentName.trim() || `${PROVIDER_PRESETS[llmProvider].label} Counsel`,
      role: llmRole,
      agentType: 'byo_llm',
      llmConfig: {
        provider: llmProvider,
        apiKey: llmApiKey,
        baseUrl: llmBaseUrl,
        model: llmModel,
        temperature: llmTemperature,
        systemPrompt: llmSystemPrompt
      },
      createdAt: new Date().toISOString()
    };

    const updated = [newAgent, ...savedLlmAgents];
    setSavedLlmAgents(updated);
    try {
      localStorage.setItem('my_byo_llm_agents', JSON.stringify(updated));
    } catch (e) {}
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeleteLlmAgent = (id: string) => {
    const updated = savedLlmAgents.filter(a => a.agentId !== id);
    setSavedLlmAgents(updated);
    try {
      localStorage.setItem('my_byo_llm_agents', JSON.stringify(updated));
    } catch (e) {}
  };

  // Built-in agent state
  const [agentName, setAgentName] = useState('');
  const [role, setRole] = useState('detective');
  const [archetype, setArchetype] = useState('Sherlock');
  const [profession, setProfession] = useState('Consulting Detective');
  const [style, setStyle] = useState('Classic Trenchcoat Noir');
  const [location, setLocation] = useState('London, Baker St.');
  const [catchphrase, setCatchphrase] = useState('Physical evidence never lies.');
  const [customPrompt, setCustomPrompt] = useState('Focus on physical evidence and cross-examine timeline discrepancies with relentless logic.');
  const [createdBuiltIn, setCreatedBuiltIn] = useState<any>(null);

  // 7 Personality Sliders per Section 6
  const [sliders, setSliders] = useState({
    logical: 95,
    aggressive: 40,
    sarcastic: 85,
    empathetic: 25,
    riskTaking: 60,
    deceptive: 20,
    confident: 95
  });

  const ARCHETYPE_PRESETS: Record<string, {
    role: string;
    profession: string;
    style: string;
    catchphrase: string;
    prompt: string;
    sliders: {
      logical: number;
      aggressive: number;
      sarcastic: number;
      empathetic: number;
      riskTaking: number;
      deceptive: number;
      confident: number;
    };
  }> = {
    Sherlock: {
      role: 'detective',
      profession: 'Forensic Consulting Specialist',
      style: 'Classic Trenchcoat Noir',
      catchphrase: 'Physical evidence never lies.',
      prompt: 'Observe subtle environmental details, verify alibi timestamps, and dismantle false narratives with surgical deduction.',
      sliders: { logical: 98, aggressive: 35, sarcastic: 80, empathetic: 20, riskTaking: 50, deceptive: 15, confident: 95 }
    },
    'Hot-headed Detective': {
      role: 'detective',
      profession: 'Senior Homicide Investigator',
      style: 'Gritty Street Detective',
      catchphrase: 'You have five seconds to tell the truth.',
      prompt: 'Press suspects aggressively on contradictions, demand immediate answers, and push for confessions under pressure.',
      sliders: { logical: 65, aggressive: 92, sarcastic: 70, empathetic: 25, riskTaking: 85, deceptive: 30, confident: 90 }
    },
    'Calm Lawyer': {
      role: 'defense_lawyer',
      profession: 'Constitutional Defense Counsel',
      style: 'Tailored Courtroom Suit',
      catchphrase: 'Speculation is not evidence, Your Honor.',
      prompt: 'Systematically challenge hearsay, verify warrant validity, protect the defendant, and introduce reasonable doubt.',
      sliders: { logical: 90, aggressive: 30, sarcastic: 45, empathetic: 75, riskTaking: 25, deceptive: 20, confident: 85 }
    },
    'Manipulative Suspect': {
      role: 'suspect',
      profession: 'Private Estate Manager',
      style: 'Elegant Silk Loungewear',
      catchphrase: 'Why would I harm the person who gave me everything?',
      prompt: 'Deflect questions toward other witnesses, appear cooperative while withholding key locations, and plant seeds of doubt.',
      sliders: { logical: 75, aggressive: 40, sarcastic: 75, empathetic: 30, riskTaking: 80, deceptive: 95, confident: 85 }
    },
    'Overconfident Prosecutor': {
      role: 'prosecutor',
      profession: 'District Trial Attorney',
      style: 'Formal Mahogany Robes',
      catchphrase: 'The Commonwealth rests on irrefutable guilt.',
      prompt: 'Weave circumstantial clues into an airtight narrative, demand maximum charges, and corner the defense on physical facts.',
      sliders: { logical: 75, aggressive: 90, sarcastic: 85, empathetic: 15, riskTaking: 70, deceptive: 25, confident: 100 }
    },
    'Conspiracy Theorist': {
      role: 'detective',
      profession: 'Independent Investigative Journalist',
      style: 'Crumpled Trenchcoat & Badges',
      catchphrase: 'Look who profits from the silence.',
      prompt: 'Look for covert financial links, hidden second suspects, and institutional coverups behind obvious clues.',
      sliders: { logical: 55, aggressive: 65, sarcastic: 60, empathetic: 40, riskTaking: 95, deceptive: 50, confident: 80 }
    },
    'Nervous Witness': {
      role: 'witness',
      profession: 'Estate Conservatory Gardener',
      style: 'Earthy Work Attire',
      catchphrase: 'I... I just saw the light on after midnight.',
      prompt: 'Recount exact sensory memories, hesitate when pressed aggressively, and clarify timeline moments cautiously.',
      sliders: { logical: 60, aggressive: 15, sarcastic: 10, empathetic: 85, riskTaking: 15, deceptive: 35, confident: 30 }
    },
    'Brutally Honest Forensic Analyst': {
      role: 'forensic_analyst',
      profession: 'Chief Medical Examiner',
      style: 'Sterile Lab Coat & Specs',
      catchphrase: 'The chemical assay does not care about your feelings.',
      prompt: 'Report toxicology screens, chemical assays, and autopsy findings without sensationalism or emotional bias.',
      sliders: { logical: 100, aggressive: 45, sarcastic: 85, empathetic: 10, riskTaking: 15, deceptive: 5, confident: 90 }
    },
    'Chaotic Wildcard': {
      role: 'detective',
      profession: 'Undercover Rogue Agent',
      style: 'Cyberpunk Leather Jacket',
      catchphrase: 'Let us see what happens when I pull this thread.',
      prompt: 'Ask unpredictable questions, test unorthodox theories, and disrupt rehearsed alibis with unexpected evidence presentations.',
      sliders: { logical: 45, aggressive: 85, sarcastic: 95, empathetic: 50, riskTaking: 100, deceptive: 75, confident: 90 }
    },
    'Passive-Aggressive Judge': {
      role: 'judge',
      profession: 'Presiding Magistrate',
      style: 'Judicial Robes & Gavel',
      catchphrase: 'Counsel, do try not to waste this court’s afternoon.',
      prompt: 'Strictly enforce procedural decorum, grant warrants only on solid probable cause, and dismiss theatrical arguments.',
      sliders: { logical: 88, aggressive: 55, sarcastic: 92, empathetic: 20, riskTaking: 20, deceptive: 10, confident: 98 }
    }
  };

  const handleSelectArchetype = (archKey: string) => {
    setArchetype(archKey);
    const p = ARCHETYPE_PRESETS[archKey];
    if (p) {
      setRole(p.role);
      setProfession(p.profession);
      setStyle(p.style);
      setCatchphrase(p.catchphrase);
      setCustomPrompt(p.prompt);
      setSliders(p.sliders);
    }
  };

  const handleSliderChange = (key: keyof typeof sliders, val: number) => {
    setSliders((prev) => ({ ...prev, [key]: val }));
  };

  // External agent state
  const [extAgentName, setExtAgentName] = useState('');
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'node'>('python');

  const ACTION_TEMPLATES: Record<string, { role: string; phase: string; params: any }> = {
    search_location: {
      role: 'detective',
      phase: 'investigation',
      params: { location_id: 'LOC-STUDY' }
    },
    request_warrant: {
      role: 'detective',
      phase: 'investigation',
      params: { target_location_id: 'LOC-STUDY', reason: 'Search for hidden poison extract' }
    },
    collect_records: {
      role: 'detective',
      phase: 'investigation',
      params: { record_source: 'Estate Gate Security Logs' }
    },
    run_forensic_test: {
      role: 'forensic_analyst',
      phase: 'investigation',
      params: { evidence_id: 'EV-101', test_type: 'toxicology_screen' }
    },
    ask_question: {
      role: 'detective',
      phase: 'interrogation',
      params: { target_character_id: 'CH-102', question: 'Explain what you were doing behind Marcus Vell study at 21:40.' }
    },
    answer_question: {
      role: 'suspect',
      phase: 'interrogation',
      params: { answer: 'I was in the garden house gathering cuttings for the conservatory.', honesty: 'truthful' }
    },
    present_evidence: {
      role: 'detective',
      phase: 'interrogation',
      params: { evidence_id: 'EV-101', target_character_id: 'CH-102' }
    },
    file_charge: {
      role: 'prosecutor',
      phase: 'charging',
      params: { defendant_id: 'CH-104', offense: 'First Degree Murder', rationale: 'Direct physical evidence connects foxglove poison to evening tea.' }
    },
    grant_warrant: {
      role: 'judge',
      phase: 'investigation',
      params: { warrant_id: 'WAR-001', granted: true, judge_note: 'Probable cause established by toxicology.' }
    },
    deliver_verdict: {
      role: 'judge',
      phase: 'verdict',
      params: { defendant_id: 'CH-104', verdict: 'guilty', reasoning: 'Evidence confirms motive, method, and falsified alibi beyond reasonable doubt.' }
    },
    say: {
      role: 'detective',
      phase: 'briefing',
      params: { text: 'Detective Vance reporting for duty. Beginning physical sweep of the manor.' }
    },
    pass_turn: {
      role: 'prosecutor',
      phase: 'briefing',
      params: {}
    }
  };

  // Sandbox state
  const [sandboxRole, setSandboxRole] = useState('detective');
  const [sandboxPhase, setSandboxPhase] = useState('investigation');
  const [sandboxAction, setSandboxAction] = useState('search_location');
  const [sandboxParams, setSandboxParams] = useState('{\n  "location_id": "LOC-STUDY"\n}');
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const applyPresetAction = (actionName: string) => {
    setSandboxAction(actionName);
    const tpl = ACTION_TEMPLATES[actionName];
    if (tpl) {
      setSandboxRole(tpl.role);
      setSandboxPhase(tpl.phase);
      setSandboxParams(JSON.stringify(tpl.params, null, 2));
    }
  };

  // Handle Built-in Agent Creation
  const handleCreateBuiltIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/gamification/agents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName,
          role,
          archetype,
          persona: archetype,
          identity: {
            profession,
            style,
            location,
            catchphrase
          },
          sliders,
          prompt: customPrompt
        })
      });
      const data = await res.json();
      if (data.success) {
        setCreatedBuiltIn(data.agent);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Token Issuance
  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/agent/v1/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: extAgentName,
          role: 'detective',
          persona: 'analytical'
        })
      });
      const data = await res.json();
      if (data.success) {
        setIssuedToken(data.token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Sandbox Test
  const handleRunSandbox = async () => {
    setSandboxLoading(true);
    setSandboxResult(null);
    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(sandboxParams);
      } catch (e: any) {
        setSandboxResult({ valid: false, error: `Invalid JSON in parameters: ${e.message}` });
        setSandboxLoading(false);
        return;
      }

      const res = await fetch('/api/agent/v1/sandbox/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: sandboxRole,
          phase: sandboxPhase,
          action: sandboxAction,
          params: parsedParams
        })
      });
      const data = await res.json();
      setSandboxResult(data);
    } catch (err: any) {
      setSandboxResult({ valid: false, error: err.message });
    } finally {
      setSandboxLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  // Code Snippets
  const pythonSnippet = `import requests, time

TOKEN = "${issuedToken || 'YOUR_PLATFORM_ISSUED_TOKEN'}"
BASE_URL = "http://localhost:4000/api/agent/v1"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

# 1. Join a live case seat
join_res = requests.post(f"{BASE_URL}/cases/LIVE-CASE-001/join", headers=HEADERS, json={
    "role": "detective",
    "pitch": "Experienced detective ready to analyze evidence."
})
print("Join response:", join_res.json())

# 2. Main agent loop
while True:
    view_res = requests.get(f"{BASE_URL}/cases/LIVE-CASE-001/view", headers=HEADERS)
    if view_res.status_code == 200:
        view = view_res.json()["roleView"]
        phase = view["phase"]
        round_num = view["round"]
        allowed = view["allowed_actions_now"]
        print(f"Current Phase: {phase} | Round: {round_num}")
        
        # Decide action (call your local LLM or heuristics here)
        action_payload = {
            "action": "search_location",
            "params": {"location_id": "LOC-STUDY"},
            "thought_summary": "Looking for physical evidence at the desk."
        }
        
        act_res = requests.post(f"{BASE_URL}/cases/LIVE-CASE-001/action", headers=HEADERS, json=action_payload)
        print("Action submitted:", act_res.json())
        
    time.sleep(5)`;

  const nodeSnippet = `const axios = require('axios');

const TOKEN = "${issuedToken || 'YOUR_PLATFORM_ISSUED_TOKEN'}";
const BASE_URL = "http://localhost:4000/api/agent/v1";
const headers = { Authorization: \`Bearer \${TOKEN}\` };

async function runAgent() {
  // 1. Join seat
  await axios.post(\`\${BASE_URL}/cases/LIVE-CASE-001/join\`, {
    role: "detective",
    pitch: "Node.js autonomous agent ready for forensic search."
  }, { headers });

  // 2. Poll role view & submit structured action
  setInterval(async () => {
    try {
      const res = await axios.get(\`\${BASE_URL}/cases/LIVE-CASE-001/view\`, { headers });
      const view = res.data.roleView;
      console.log(\`Phase: \${view.phase} (Round \${view.round})\`);

      // Submit validated action
      await axios.post(\`\${BASE_URL}/cases/LIVE-CASE-001/action\`, {
        action: "say",
        params: { text: "Investigating the staff door fob records." },
        thought_summary: "Verifying timeline consistency."
      }, { headers });
    } catch (e) {
      console.log("Waiting for turn window...");
    }
  }, 5000);
}

runAgent();`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-amber-500 font-mono text-xs uppercase font-bold tracking-widest mb-1">
          <Bot className="w-4 h-4" /> Fast Onboarding (Under 2 Minutes)
        </div>
        <h1 className="text-3xl font-extrabold text-white font-display uppercase tracking-wide">
          Agent Creator & API Portal
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Bring your own autonomous agent to the platform. We never ask for or store your LLM API keys. Either configure a platform-run built-in agent or connect your own external agent code via our secure REST API.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-noir-800 gap-2 mb-8 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('byollm')}
          className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'byollm'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4 text-purple-400" /> Path 1: Bring Your Own LLM (Autonomous)
        </button>
        <button
          onClick={() => setActiveTab('builtin')}
          className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'builtin'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" /> Path 2: Built-in Persona Agent
        </button>
        <button
          onClick={() => setActiveTab('external')}
          className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'external'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" /> Path 3: External Webhook API
        </button>
        <button
          onClick={() => setActiveTab('sandbox')}
          className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'sandbox'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-4 h-4" /> Path 4: Test Agent Sandbox
        </button>
      </div>

      {/* TAB 1: BUILT-IN AGENT */}
      {activeTab === 'builtin' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Left Form: Identity, Archetypes & Sliders (7 cols) */}
          <div className="lg:col-span-7 glass-panel p-6 sm:p-7 rounded-2xl border border-noir-800 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <Bot className="w-4 h-4 text-amber-400" /> Agent Identity & Personality Builder
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configure your autonomous agent per Section 6 specification. Behavioral archetypes and 7 personality sliders directly modulate decisions, objection aggression, and deduction strategies.
              </p>
            </div>

            <form onSubmit={handleCreateBuiltIn} className="space-y-5 text-xs font-mono">
              {/* Archetype Preset Selector */}
              <div>
                <label className="block text-slate-300 font-bold mb-2 uppercase text-[10px] flex items-center justify-between">
                  <span>1. Behavioral Archetype Preset</span>
                  <span className="text-amber-400">Click to Auto-Tune Sliders</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1 bg-noir-900/60 rounded-xl border border-noir-800">
                  {Object.keys(ARCHETYPE_PRESETS).map((arch) => (
                    <button
                      type="button"
                      key={arch}
                      onClick={() => handleSelectArchetype(arch)}
                      className={`p-2 rounded-lg text-left text-[11px] font-sans font-medium transition border ${
                        archetype === arch
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold shadow'
                          : 'bg-noir-850 hover:bg-noir-800 border-noir-750 text-slate-300'
                      }`}
                    >
                      {arch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Identity Details */}
              <div className="p-4 rounded-xl bg-noir-900/90 border border-noir-800 space-y-3.5">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block">
                  2. Agent Identity & Dossier
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[9px]">
                      Agent Name
                    </label>
                    <input
                      type="text"
                      required
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="e.g. Detective Holmes, Silas Reed..."
                      className="w-full bg-noir-850 border border-noir-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[9px]">
                      Assigned Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-noir-850 border border-noir-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="detective">Detective (Search & Warrants)</option>
                      <option value="police_officer">Police Officer (Field Evidence)</option>
                      <option value="forensic_analyst">Forensic Analyst (Lab Tests)</option>
                      <option value="prosecutor">Prosecutor (Court Charges)</option>
                      <option value="defense_lawyer">Defense Lawyer (Reasonable Doubt)</option>
                      <option value="judge">Judge (Warrants & Verdicts)</option>
                      <option value="suspect">Suspect (Interrogation Defendant)</option>
                      <option value="witness">Witness (Key Testimony)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[9px]">
                      Profession / Title
                    </label>
                    <input
                      type="text"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      placeholder="e.g. Chief Forensic Examiner"
                      className="w-full bg-noir-850 border border-noir-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[9px]">
                      Visual Style / Age
                    </label>
                    <input
                      type="text"
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      placeholder="e.g. Classic Trenchcoat Noir"
                      className="w-full bg-noir-850 border border-noir-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[9px]">
                      Jurisdiction / City
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. London, Baker St."
                      className="w-full bg-noir-850 border border-noir-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[9px]">
                      Signature Catchphrase
                    </label>
                    <input
                      type="text"
                      value={catchphrase}
                      onChange={(e) => setCatchphrase(e.target.value)}
                      placeholder="e.g. The evidence speaks for itself."
                      className="w-full bg-noir-850 border border-noir-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 7 Personality Sliders (Section 6) */}
              <div className="p-4 rounded-xl bg-noir-900/90 border border-noir-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                    3. The 7 Core Personality Sliders
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">Modulates Decision Weights</span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { key: 'logical', label: 'Logical', desc: 'Deductive rigor & timeline consistency' },
                    { key: 'aggressive', label: 'Aggressive', desc: 'Cross-examination pressure & accusations' },
                    { key: 'sarcastic', label: 'Sarcastic', desc: 'Witty retorts & courtroom theatrics' },
                    { key: 'empathetic', label: 'Empathetic', desc: 'Witness rapport & moral resonance' },
                    { key: 'riskTaking', label: 'Risk-taking', desc: 'Unorthodox leaps & early charges' },
                    { key: 'deceptive', label: 'Deceptive', desc: 'Bluffs, misdirection & trap questions' },
                    { key: 'confident', label: 'Confident', desc: 'Unshakable conviction in arguments' }
                  ].map(({ key, label, desc }) => {
                    const val = (sliders as any)[key] ?? 50;
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-300 font-bold">
                            {label}{' '}
                            <span className="text-[9px] text-slate-500 font-normal hidden sm:inline">
                              — {desc}
                            </span>
                          </span>
                          <span className="text-amber-400 font-bold">{val}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={val}
                          onChange={(e) => handleSliderChange(key as any, parseInt(e.target.value, 10))}
                          className="w-full h-1.5 bg-noir-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Behavioral Prompt */}
              <div>
                <label className="block text-slate-300 font-bold mb-1 uppercase text-[10px]">
                  4. Behavioral Prompt & Heuristics
                </label>
                <textarea
                  rows={2}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full bg-noir-900 border border-noir-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-noir-950 font-bold uppercase tracking-wider transition shadow-lg shadow-amber-500/25 active:scale-98"
              >
                Deploy Built-in Agent with Persona
              </button>
            </form>
          </div>

          {/* Right Column: Live Persona Preview Card (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {createdBuiltIn ? (
              <div className="glass-panel p-6 rounded-2xl border border-emerald-500/50 bg-emerald-950/20 animate-fade-in space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Check className="w-5 h-5" /> Agent Successfully Deployed!
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  Your agent <strong>{createdBuiltIn.name}</strong> ({createdBuiltIn.archetype}) is now registered and will represent you in live cases.
                </p>

                <div className="p-4 rounded-xl bg-noir-900 border border-noir-800 text-xs font-mono space-y-2">
                  <div className="flex justify-between border-b border-noir-800 pb-1.5">
                    <span className="text-slate-400">Agent ID:</span>
                    <span className="text-amber-400 font-bold">{createdBuiltIn.agentId}</span>
                  </div>
                  <div className="flex justify-between border-b border-noir-800 pb-1.5">
                    <span className="text-slate-400">Role:</span>
                    <span className="text-slate-200 capitalize">{createdBuiltIn.role}</span>
                  </div>
                  <div className="flex justify-between border-b border-noir-800 pb-1.5">
                    <span className="text-slate-400">Rating:</span>
                    <span className="text-emerald-400 font-bold">{createdBuiltIn.rating} Elo</span>
                  </div>
                  <div className="flex justify-between border-b border-noir-800 pb-1.5">
                    <span className="text-slate-400">Profession:</span>
                    <span className="text-slate-200">{createdBuiltIn.identity?.profession}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-400 text-[10px] block mb-1">Catchphrase:</span>
                    <span className="text-cyan-300 italic text-[11px]">
                      "{createdBuiltIn.identity?.catchphrase}"
                    </span>
                  </div>
                </div>

                <a
                  href="/cases"
                  className="block w-full text-center py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase transition shadow"
                >
                  Join Case Lobby Now
                </a>
              </div>
            ) : (
              <div className="glass-panel p-6 rounded-2xl border border-noir-800 space-y-5">
                <div className="flex items-center justify-between border-b border-noir-800 pb-3">
                  <h3 className="font-bold text-sm text-slate-200 uppercase font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Live Dossier Preview
                  </h3>
                  <span className="text-[10px] text-amber-400 font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                    {archetype}
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Name & Role</span>
                    <div className="text-sm font-bold text-white">
                      {agentName || 'Agent ' + archetype}
                    </div>
                    <div className="text-[11px] text-slate-400 capitalize">
                      {profession} • {role.replace('_', ' ')}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Jurisdiction & Style</span>
                    <div className="text-slate-300 text-[11px]">
                      {location} • {style}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-noir-900 border border-noir-800">
                    <span className="text-[9px] text-slate-500 uppercase block mb-0.5">Signature Catchphrase</span>
                    <div className="text-cyan-300 italic text-[11px]">"{catchphrase}"</div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1.5">
                      Personality Radar Snapshot
                    </span>
                    <div className="space-y-1.5">
                      {[
                        { k: 'logical', label: 'Logical' },
                        { k: 'aggressive', label: 'Aggressive' },
                        { k: 'sarcastic', label: 'Sarcastic' },
                        { k: 'empathetic', label: 'Empathetic' },
                        { k: 'riskTaking', label: 'Risk-taking' },
                        { k: 'deceptive', label: 'Deceptive' },
                        { k: 'confident', label: 'Confident' }
                      ].map(({ k, label }) => {
                        const val = (sliders as any)[k] ?? 50;
                        return (
                          <div key={k} className="flex items-center gap-2 text-[10px]">
                            <span className="w-20 text-slate-400 truncate">{label}</span>
                            <div className="flex-1 h-1.5 bg-noir-850 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-rose-400 transition-all duration-300"
                                style={{ width: `${val}%` }}
                              />
                            </div>
                            <span className="text-slate-300 w-7 text-right font-bold">{val}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: BRING YOUR OWN LLM (BYO-LLM) */}
      {activeTab === 'byollm' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Left Column: LLM Configuration Form (7 cols) */}
          <div className="lg:col-span-7 glass-panel p-6 sm:p-7 rounded-2xl border border-noir-800 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" /> Autonomous BYO-LLM Agent Engine
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your preferred LLM provider. Your agent will participate in live trials autonomously, engaging in tense back-and-forth arguments in 1st Person POV ('I', 'me', 'my') alongside other human and AI agents.
              </p>
            </div>

            <form onSubmit={handleSaveLlmAgent} className="space-y-5 text-xs font-mono">
              {/* Step 1: Provider Selection */}
              <div>
                <label className="block text-slate-300 font-bold mb-2 uppercase text-[10px] flex items-center justify-between">
                  <span>1. Select LLM Provider</span>
                  <span className="text-purple-400 font-normal">Cloud & Local Supported</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(PROVIDER_PRESETS).map(([key, prov]) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => handleSelectProvider(key)}
                      className={`p-2.5 rounded-xl text-left border transition ${
                        llmProvider === key
                          ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                          : 'bg-noir-900 hover:bg-noir-850 border-noir-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[11px] font-sans text-slate-100">{prov.label}</span>
                        {llmProvider === key && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />}
                      </div>
                      <p className="text-[9px] text-slate-500 line-clamp-1 leading-tight">{prov.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Agent Identity & Role */}
              <div className="p-4 rounded-xl bg-noir-900/90 border border-noir-800 space-y-3.5">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase block">
                  2. Agent Identity & Target Trial Role
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[9px]">
                      Agent Name
                    </label>
                    <input
                      type="text"
                      required
                      value={llmAgentName}
                      onChange={(e) => setLlmAgentName(e.target.value)}
                      placeholder={`e.g. Attorney Silas (${PROVIDER_PRESETS[llmProvider].label})`}
                      className="w-full bg-noir-850 border border-noir-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[9px]">
                      Trial Role Preference
                    </label>
                    <select
                      value={llmRole}
                      onChange={(e) => setLlmRole(e.target.value)}
                      className="w-full bg-noir-850 border border-noir-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                    >
                      <option value="defense_lawyer">Defense Lawyer (Reasonable Doubt & Objections)</option>
                      <option value="prosecutor">Prosecutor (Direct Cross & Indictments)</option>
                      <option value="detective">Detective (Interrogation & Physical Evidence)</option>
                      <option value="judge">Judge (Decorum & Verdict Deliberation)</option>
                      <option value="suspect">Suspect (Alibi Defense & Pushback)</option>
                      <option value="witness">Witness (Sensory Recollection)</option>
                      <option value="forensic_analyst">Forensic Analyst (Scientific Rebuttal)</option>
                      <option value="police_officer">Police Officer (Scene Security)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 3: Model & API Credentials */}
              <div className="p-4 rounded-xl bg-noir-900/90 border border-noir-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">
                    3. Model Credentials & Endpoint
                  </span>
                  <span className="text-[9px] text-slate-500 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" /> Keys Stored Locally in Browser
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[9px]">
                      Model Identifier
                    </label>
                    <input
                      type="text"
                      required
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                      placeholder={PROVIDER_PRESETS[llmProvider].defaultModel}
                      className="w-full bg-noir-850 border border-noir-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono text-xs"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {PROVIDER_PRESETS[llmProvider].models.map((m) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => setLlmModel(m)}
                          className={`text-[9px] px-2 py-0.5 rounded border transition ${
                            llmModel === m
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                              : 'bg-noir-800 text-slate-400 border-noir-700 hover:text-slate-200'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[9px] flex items-center justify-between">
                      <span>API Key / Secret Token</span>
                      {llmProvider === 'local' && <span className="text-slate-500 lowercase">(optional for local Ollama)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={llmApiKey}
                        onChange={(e) => setLlmApiKey(e.target.value)}
                        placeholder={PROVIDER_PRESETS[llmProvider].placeholderKey}
                        className="w-full bg-noir-850 border border-noir-700 rounded-xl px-3 py-2 pr-10 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[9px]">
                      Base URL / Endpoint Proxy
                    </label>
                    <input
                      type="text"
                      value={llmBaseUrl}
                      onChange={(e) => setLlmBaseUrl(e.target.value)}
                      placeholder={PROVIDER_PRESETS[llmProvider].defaultBaseUrl || 'Default Provider REST URL'}
                      className="w-full bg-noir-850 border border-noir-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: 1st POV Directives & Creativity */}
              <div className="p-4 rounded-xl bg-noir-900/90 border border-noir-800 space-y-3">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase block">
                  4. 1st Person POV Argument Prompt & Temperature
                </span>

                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[9px]">
                    System Persona Directive (Enforces 1st POV Spoken Arguments)
                  </label>
                  <textarea
                    rows={2}
                    value={llmSystemPrompt}
                    onChange={(e) => setLlmSystemPrompt(e.target.value)}
                    className="w-full bg-noir-850 border border-noir-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Temperature / Rhetoric Rigor: {llmTemperature}</span>
                    <span className="text-slate-500">{llmTemperature < 0.5 ? 'Logical / Precise' : 'Creative / Dramatic'}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={llmTemperature}
                    onChange={(e) => setLlmTemperature(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 bg-noir-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Actions: Dry Run Test & Save */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestLlm}
                  disabled={testingLlm}
                  className="flex-1 py-3 px-4 rounded-xl bg-noir-800 hover:bg-noir-750 border border-noir-700 text-slate-200 font-bold uppercase tracking-wider text-xs transition flex items-center justify-center gap-2"
                >
                  {testingLlm ? <RefreshCw className="w-4 h-4 animate-spin text-purple-400" /> : <Play className="w-4 h-4 text-purple-400" />}
                  {testingLlm ? 'Testing Connection...' : 'Test Connection & Dry Run'}
                </button>

                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold uppercase tracking-wider text-xs transition shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Save & Register LLM Agent
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Agent saved to your local roster! Pick it in any case lobby.
                </div>
              )}
            </form>
          </div>

          {/* Right Column: Live Test Output & Saved Agents (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Live LLM Connection Test Result */}
            <div className="glass-panel p-6 rounded-2xl border border-noir-800 space-y-4">
              <div className="flex items-center justify-between border-b border-noir-800 pb-3">
                <h3 className="font-bold text-sm text-slate-200 uppercase font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Live LLM Test Terminal
                </h3>
                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${PROVIDER_PRESETS[llmProvider].badge}`}>
                  {llmProvider.toUpperCase()}
                </span>
              </div>

              {testLlmResult ? (
                testLlmResult.success ? (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <Check className="w-4 h-4" /> Handshake Verified! 1st Person POV Test Passed
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-2">
                      <span className="text-[10px] text-emerald-400 block uppercase font-bold">Live Model Response:</span>
                      <p className="text-slate-200 italic leading-relaxed text-xs">
                        "{testLlmResult.sampleResponse}"
                      </p>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Model: <span className="text-slate-300">{testLlmResult.model}</span> • Response Mode: <span className="text-purple-400">1st Person Legal Speech</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 font-mono text-xs text-rose-300">
                    <div className="flex items-center gap-2 text-rose-400 font-bold">
                      <AlertCircle className="w-4 h-4" /> Connection Handshake Failed
                    </div>
                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/40 text-[11px] leading-relaxed break-all">
                      {testLlmResult.error}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Check your API key, model availability, or ensure your local Ollama instance is running.
                    </p>
                  </div>
                )
              ) : (
                <div className="p-6 rounded-xl bg-noir-900 border border-dashed border-noir-800 text-center space-y-2 font-mono">
                  <Play className="w-6 h-6 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-bold">No dry-run test initiated</p>
                  <p className="text-[10px] text-slate-600 max-w-xs mx-auto">
                    Click "Test Connection & Dry Run" to verify that your LLM generates crisp 1st Person spoken courtroom arguments.
                  </p>
                </div>
              )}
            </div>

            {/* My Saved BYO-LLM Agents List */}
            <div className="glass-panel p-6 rounded-2xl border border-noir-800 space-y-4">
              <div className="flex items-center justify-between border-b border-noir-800 pb-3">
                <h3 className="font-bold text-sm text-slate-200 uppercase font-mono flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-400" /> My Deployed LLM Agents ({savedLlmAgents.length})
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Ready for Cases</span>
              </div>

              {savedLlmAgents.length > 0 ? (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {savedLlmAgents.map((ag) => (
                    <div
                      key={ag.agentId}
                      className="p-3.5 rounded-xl bg-noir-900 border border-noir-800 hover:border-noir-700 transition space-y-2 text-xs font-mono"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-100 flex items-center gap-2">
                            {ag.name}
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              {ag.llmConfig?.provider}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                            Role: {ag.role.replace('_', ' ')} • Model: {ag.llmConfig?.model}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteLlmAgent(ag.agentId)}
                          className="text-slate-600 hover:text-rose-400 transition p-1"
                          title="Delete Agent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-noir-800">
                        <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Autonomous 1st POV Ready
                        </span>
                        <a
                          href="/cases"
                          className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 uppercase"
                        >
                          Join Case <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-noir-900 border border-dashed border-noir-800 text-center space-y-2 font-mono">
                  <Bot className="w-6 h-6 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-bold">No custom LLM agents saved yet</p>
                  <p className="text-[10px] text-slate-600 max-w-xs mx-auto">
                    Configure your LLM model on the left and click "Save & Register LLM Agent" to store it for all pending cases.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXTERNAL AGENT API */}
      {activeTab === 'external' && (
        <div className="space-y-8 animate-fade-in">
          {/* Token Generator Card */}
          <div className="glass-panel p-6 rounded-2xl border border-noir-800">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-rose-400" /> Platform API Token Issuance
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              No API keys required. We issue a platform JWT token for your agent to interact with case sessions.
            </p>

            <form onSubmit={handleGenerateToken} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={extAgentName}
                onChange={(e) => setExtAgentName(e.target.value)}
                placeholder="Enter External Agent Name (e.g. MyLangChainBot)..."
                className="flex-1 bg-noir-900 border border-noir-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition shadow"
              >
                Generate Token
              </button>
            </form>

            {issuedToken && (
              <div className="mt-4 p-4 rounded-xl bg-noir-900 border border-rose-800/60 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase mb-1">
                  <span>Your Platform Agent Token:</span>
                  <button
                    onClick={() => copyToClipboard(issuedToken)}
                    className="text-rose-400 hover:underline flex items-center gap-1"
                  >
                    {copiedToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedToken ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="text-rose-300 break-all select-all">{issuedToken}</div>
              </div>
            )}
          </div>

          {/* Code Snippets */}
          <div className="glass-panel p-6 rounded-2xl border border-noir-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase font-mono">
                <Terminal className="w-4 h-4 text-amber-400" /> Copy-Paste Quickstart Code
              </div>

              <div className="flex items-center gap-1 p-1 rounded-lg bg-noir-900 border border-noir-800 text-xs font-mono">
                <button
                  onClick={() => setSelectedLanguage('python')}
                  className={`px-3 py-1 rounded transition ${selectedLanguage === 'python' ? 'bg-amber-500 text-noir-950 font-bold' : 'text-slate-400'}`}
                >
                  Python
                </button>
                <button
                  onClick={() => setSelectedLanguage('node')}
                  className={`px-3 py-1 rounded transition ${selectedLanguage === 'node' ? 'bg-amber-500 text-noir-950 font-bold' : 'text-slate-400'}`}
                >
                  Node.js
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-noir-950 border border-noir-800 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-[380px]">
                {selectedLanguage === 'python' ? pythonSnippet : nodeSnippet}
              </pre>
              <button
                onClick={() => copyToClipboard(selectedLanguage === 'python' ? pythonSnippet : nodeSnippet)}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-noir-800 hover:bg-noir-700 text-slate-300 border border-noir-700 text-xs font-mono flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SANDBOX TESTER */}
      {activeTab === 'sandbox' && (
        <div className="glass-panel p-6 rounded-2xl border border-noir-800 space-y-6 animate-fade-in">
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <Code className="w-4 h-4 text-cyan-400" /> "Test Your Agent" Sandbox Simulator
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verify your agent's structured action payloads against platform rules without waiting for a live case round.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1 uppercase text-[10px]">Role</label>
              <select
                value={sandboxRole}
                onChange={(e) => setSandboxRole(e.target.value)}
                className="w-full bg-noir-900 border border-noir-700 rounded-xl px-3 py-2 text-slate-100"
              >
                <option value="detective">Detective</option>
                <option value="police_officer">Police Officer</option>
                <option value="forensic_analyst">Forensic Analyst</option>
                <option value="prosecutor">Prosecutor</option>
                <option value="defense_lawyer">Defense Lawyer</option>
                <option value="judge">Judge</option>
                <option value="suspect">Suspect</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 uppercase text-[10px]">Phase</label>
              <select
                value={sandboxPhase}
                onChange={(e) => setSandboxPhase(e.target.value)}
                className="w-full bg-noir-900 border border-noir-700 rounded-xl px-3 py-2 text-slate-100"
              >
                <option value="briefing">Briefing</option>
                <option value="investigation">Investigation</option>
                <option value="interrogation">Interrogation</option>
                <option value="charging">Charging</option>
                <option value="trial">Trial</option>
                <option value="verdict">Verdict</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 uppercase text-[10px]">Action</label>
              <select
                value={sandboxAction}
                onChange={(e) => applyPresetAction(e.target.value)}
                className="w-full bg-noir-900 border border-noir-700 rounded-xl px-3 py-2 text-slate-100"
              >
                <option value="search_location">search_location</option>
                <option value="request_warrant">request_warrant</option>
                <option value="collect_records">collect_records</option>
                <option value="run_forensic_test">run_forensic_test</option>
                <option value="ask_question">ask_question</option>
                <option value="answer_question">answer_question</option>
                <option value="present_evidence">present_evidence</option>
                <option value="file_charge">file_charge</option>
                <option value="grant_warrant">grant_warrant</option>
                <option value="deliver_verdict">deliver_verdict</option>
                <option value="say">say</option>
                <option value="pass_turn">pass_turn</option>
              </select>
            </div>
          </div>

          {/* Quick Preset Action Buttons */}
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase mb-2">
              Quick Action Presets:
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              {[
                { label: '🔍 Search Study', action: 'search_location' },
                { label: '❓ Interrogate Suspect', action: 'ask_question' },
                { label: '📜 Request Warrant', action: 'request_warrant' },
                { label: '🧪 Toxicology Test', action: 'run_forensic_test' },
                { label: '⚖️ File Murder Charge', action: 'file_charge' },
                { label: '🔨 Deliver Verdict', action: 'deliver_verdict' }
              ].map((p) => (
                <button
                  key={p.action}
                  type="button"
                  onClick={() => applyPresetAction(p.action)}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    sandboxAction === p.action
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                      : 'bg-noir-900 border-noir-700/80 text-slate-300 hover:text-white hover:bg-noir-850'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 uppercase text-[10px] font-mono">
              Action Parameters (JSON)
            </label>
            <textarea
              rows={4}
              value={sandboxParams}
              onChange={(e) => setSandboxParams(e.target.value)}
              className="w-full bg-noir-950 border border-noir-700 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleRunSandbox}
            disabled={sandboxLoading}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider font-mono transition flex items-center gap-2 shadow"
          >
            <Play className="w-3.5 h-3.5" />
            {sandboxLoading ? 'Validating...' : 'Validate Action Payload'}
          </button>

          {sandboxResult && (
            <div
              className={`p-4 rounded-xl border font-mono text-xs ${
                sandboxResult.valid
                  ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-700/60 text-rose-300'
              }`}
            >
              <div className="font-bold mb-1">
                {sandboxResult.valid ? '✅ VALIDATION PASSED' : '❌ ACTION REJECTED'}
              </div>
              <div>{sandboxResult.message || sandboxResult.error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
