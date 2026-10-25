'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Radio,
  Gavel,
  Scale,
  Shield,
  Eye,
  Search,
  FileText,
  AlertTriangle,
  Sparkles,
  Maximize2,
  Minimize2,
  X,
  Volume2,
  Brain,
  CornerDownRight,
  Zap,
  User,
  Quote,
  Layers
} from 'lucide-react';

interface DialogueEvent {
  id: string;
  round: number;
  phase: string;
  agentName?: string;
  characterName?: string;
  characterId?: string;
  agentId?: string;
  role: string;
  action: string;
  narrative?: string;
  spokenDialogue?: string;
  target?: string;
  params?: {
    text?: string;
    question?: string;
    answer?: string;
    details?: string;
    target?: string;
    target_id?: string;
    suspect?: string;
    suspect_id?: string;
    evidence?: string;
    evidence_id?: string;
    evidence_ids?: string[];
    to?: string;
    point?: string;
    grounds?: string;
    ruling?: string;
    reason?: string;
    verdicts?: any[];
    reasoning?: string;
    charge?: string;
    character_id?: string;
    kind?: string;
    culprit_ids?: string[];
    test_type?: string;
  };
  thought_summary?: string;
  contradiction_exposed?: {
    evidenceId?: string;
    evidenceName?: string;
    details?: string;
  };
}

interface LiveDialogueOverlayProps {
  transcript: DialogueEvent[];
  activeEvent?: DialogueEvent | null;
  onSelectEvent: (event: DialogueEvent) => void;
  onJumpToLive: () => void;
  isLive: boolean;
  characters?: any[];
  activeSeats?: any[];
}

// Role badge styling and icons
export function getRoleBadgeInfo(role: string = '') {
  switch (role.toLowerCase()) {
    case 'judge':
      return {
        label: 'JUDGE',
        color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
        ring: 'ring-amber-500/40',
        dot: 'bg-amber-400',
        icon: Gavel
      };
    case 'prosecutor':
      return {
        label: 'PROSECUTOR',
        color: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
        ring: 'ring-rose-500/40',
        dot: 'bg-rose-400',
        icon: Scale
      };
    case 'defense_lawyer':
      return {
        label: 'DEFENSE',
        color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
        ring: 'ring-cyan-500/40',
        dot: 'bg-cyan-400',
        icon: Shield
      };
    case 'suspect':
      return {
        label: 'SUSPECT',
        color: 'text-pink-400 bg-pink-500/15 border-pink-500/30',
        ring: 'ring-pink-500/40',
        dot: 'bg-pink-400',
        icon: AlertTriangle
      };
    case 'witness':
      return {
        label: 'WITNESS',
        color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
        ring: 'ring-emerald-500/40',
        dot: 'bg-emerald-400',
        icon: Eye
      };
    case 'detective':
      return {
        label: 'DETECTIVE',
        color: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
        ring: 'ring-yellow-500/40',
        dot: 'bg-yellow-400',
        icon: Search
      };
    case 'police_officer':
      return {
        label: 'POLICE',
        color: 'text-sky-400 bg-sky-500/15 border-sky-500/30',
        ring: 'ring-sky-500/40',
        dot: 'bg-sky-400',
        icon: Shield
      };
    case 'court_clerk':
    default:
      return {
        label: 'COURT CLERK',
        color: 'text-slate-300 bg-slate-800/80 border-slate-700',
        ring: 'ring-slate-600',
        dot: 'bg-slate-400',
        icon: FileText
      };
  }
}

// Action label mapping
export function getActionBadge(action: string = '') {
  switch (action) {
    case 'ask_question':
      return { label: 'Examination', icon: '❓', style: 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50' };
    case 'answer_question':
      return { label: 'Testimony', icon: '🗣️', style: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50' };
    case 'give_argument':
      return { label: 'Argument', icon: '📜', style: 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50' };
    case 'deliver_verdict':
      return { label: 'Verdict Delivered', icon: '⚖️', style: 'bg-amber-950/70 text-amber-300 border-amber-600/60' };
    case 'object':
      return { label: 'Objection!', icon: '❗', style: 'bg-red-950/70 text-red-300 border-red-700/60' };
    case 'confess':
      return { label: 'Confession', icon: '💥', style: 'bg-rose-950/80 text-rose-300 border-rose-600/60' };
    case 'request_warrant':
      return { label: 'Warrant Petition', icon: '📋', style: 'bg-blue-950/60 text-blue-300 border-blue-700/50' };
    case 'grant_warrant':
      return { label: 'Warrant Granted', icon: '🔨', style: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50' };
    case 'search_location':
      return { label: 'Investigation', icon: '🔍', style: 'bg-amber-950/60 text-amber-300 border-amber-700/50' };
    case 'say':
    default:
      return { label: 'Statement', icon: '💬', style: 'bg-noir-850 text-slate-300 border-noir-700' };
  }
}

// Helper to extract clean quote from third-person wrapped strings
function extractQuotedText(text: string): string | null {
  if (!text) return null;
  const match = text.match(/"([^"]+)"/) || text.match(/“([^”]+)”/);
  return match ? match[1].trim() : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. FIRST PERSON POV: Direct in-character speech for Live Court Proceedings
// ─────────────────────────────────────────────────────────────────────────────
export function getFirstPersonDialogue(event?: DialogueEvent | null, characters: any[] = []): string {
  if (!event) return '';
  // If the server engine directly emitted clean 1st Person POV spoken dialogue:
  if (event.spokenDialogue && event.spokenDialogue.trim().length > 0) {
    return event.spokenDialogue.trim();
  }
  const params = event.params || {};
  const action = event.action || '';
  const narrative = event.narrative || '';

  const charMap: Record<string, string> = {};
  characters.forEach((c: any) => {
    if (c.id) charMap[c.id] = c.name;
  });
  const getCharName = (id?: string) => (id && charMap[id]) ? charMap[id] : (id || 'the witness');

  switch (action) {
    case 'give_argument': {
      if (params.text) {
        let clean = params.text.replace(/^[^:]+:\s*["']?/, '').replace(/["']$/, '').trim();
        return clean || params.text;
      }
      const quote = extractQuotedText(narrative);
      if (quote) return quote;
      return narrative.replace(/^[^:]+:\s*/, '').replace(/["']/g, '').trim() || 'I present my argument to the court.';
    }

    case 'ask_question': {
      if (params.question) {
        return params.question.replace(/^[^:]+:\s*["']?/, '').replace(/["']$/, '').trim();
      }
      const quote = extractQuotedText(narrative);
      return quote || 'Can you explain what occurred during the events in question?';
    }

    case 'answer_question': {
      if (params.answer) {
        return params.answer.replace(/^[^:]+:\s*["']?/, '').replace(/["']$/, '').trim();
      }
      const quote = extractQuotedText(narrative);
      return quote || 'I am testifying to the truthful facts as I recall them.';
    }

    case 'object': {
      const grounds = params.grounds || extractQuotedText(narrative);
      return grounds ? `Objection, Your Honor! Grounds: ${grounds}` : 'Objection, Your Honor! I object to this line of questioning.';
    }

    case 'rule_on_objection': {
      const isSustained = (params.ruling || (narrative.toLowerCase().includes('sustained') ? 'sustained' : 'overruled')).toLowerCase() === 'sustained';
      const reason = params.reason || (narrative.split('!')[1]?.trim() || '');
      if (isSustained) {
        return `Sustained. ${reason || 'Counsel will rephrase and move on.'}`;
      } else {
        return `Overruled. ${reason || 'The witness will answer the question.'}`;
      }
    }

    case 'deliver_verdict': {
      if (params.verdicts && params.verdicts.length > 0) {
        const verdictsList = params.verdicts.map((v: any) => {
          const targetName = getCharName(v.character_id);
          return `${targetName}: ${v.verdict?.toUpperCase() || 'GUILTY'} on ${v.charge || 'charges'}`;
        }).join('; ');
        const reasoning = params.reasoning ? ` Court Reasoning: "${params.reasoning}"` : '';
        return `Having weighed all evidence and sworn testimony, I find: ${verdictsList}.${reasoning}`;
      }
      const cleanVerd = narrative.replace(/^⚖️\s*THE VERDICT IS IN:\s*/i, '').replace(/Reasoning:\s*/i, 'My reasoning: ');
      return `Having considered the full record, I deliver the verdict: ${cleanVerd}`;
    }

    case 'present_evidence': {
      const targetName = getCharName(params.target || params.to);
      const point = params.point ? `: "${params.point}"` : '.';
      const evLabel = params.evidence || params.evidence_id || 'exhibit';
      return `Your Honor, I present Exhibit [${evLabel}] before ${targetName === 'the witness' ? 'the court' : targetName}${point}`;
    }

    case 'file_charge': {
      const suspectName = getCharName(params.suspect || params.suspect_id);
      return `Your Honor, the prosecution formally files charges against ${suspectName} for "${params.charge || 'the offense'}".`;
    }

    case 'call_witness': {
      const witnessName = getCharName(params.character_id || params.target);
      return `I call ${witnessName} to take the witness stand for examination.`;
    }

    case 'confess': {
      const details = params.details || extractQuotedText(narrative);
      return details ? `I confess... ${details}` : 'I confess to the crime. I cannot hide what I have done any longer.';
    }

    case 'invoke_silence': {
      return 'On the advice of my legal counsel, I formally invoke my constitutional right to remain silent.';
    }

    case 'submit_theory': {
      const culprits = (params.culprit_ids || []).map((id: string) => getCharName(id)).join(', ');
      return `Based on our forensic timeline and evidence chain, my official theory identifies ${culprits || 'the accused'} as the perpetrator.`;
    }

    case 'request_warrant': {
      return 'Your Honor, I formally petition this court for a search warrant based on probable cause.';
    }

    case 'grant_warrant': {
      return 'Having reviewed the submitted affidavit and findings, I hereby grant the search warrant.';
    }

    case 'court_clerk':
    default: {
      if (narrative.includes('ANNOUNCEMENT:')) {
        const clean = narrative.replace(/^ANNOUNCEMENT:\s*/i, '').trim();
        return `Order in the court. ${clean}`;
      }
      if (params.text) {
        return params.text.replace(/^[^:]+:\s*["']?/, '').replace(/["']$/, '').trim();
      }
      const quote = extractQuotedText(narrative);
      if (quote) return quote;
      return narrative || 'Proceed with the next item on the court docket.';
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. THIRD PERSON POV: Court record / dossier narrative for Dialogue Stream Sidebar
// ─────────────────────────────────────────────────────────────────────────────
export function getThirdPersonNarrative(event?: DialogueEvent | null, characters: any[] = []): string {
  if (!event) return '';
  const params = event.params || {};
  const action = event.action || '';
  const narrative = event.narrative || '';

  const charMap: Record<string, string> = {};
  characters.forEach((c: any) => {
    if (c.id) charMap[c.id] = c.name;
  });
  const getCharName = (id?: string) => (id && charMap[id]) ? charMap[id] : (id || 'the witness');
  const speakerName = event.characterName || event.agentName || (event.characterId && charMap[event.characterId]) || (event.role ? event.role.replace('_', ' ').toUpperCase() : 'Agent');

  switch (action) {
    case 'give_argument': {
      const firstPerson = getFirstPersonDialogue(event, characters);
      const kind = params.kind ? `${params.kind} ` : '';
      return `${speakerName} delivered ${kind}argument to the court: "${firstPerson}"`;
    }

    case 'ask_question': {
      const targetName = getCharName(params.target || params.target_id);
      const q = params.question || extractQuotedText(narrative) || '';
      return `${speakerName} interrogated ${targetName}: "${q}"`;
    }

    case 'answer_question': {
      const a = params.answer || extractQuotedText(narrative) || '';
      return `${speakerName} testified under oath: "${a}"`;
    }

    case 'object': {
      const grounds = params.grounds || extractQuotedText(narrative) || 'Relevance';
      return `⚡ ${speakerName} raised an objection: "${grounds}"`;
    }

    case 'rule_on_objection': {
      const ruling = (params.ruling || (narrative.toLowerCase().includes('sustained') ? 'sustained' : 'overruled')).toUpperCase();
      const reason = params.reason || (narrative.split('!')[1]?.trim() || '');
      return `Judge ${speakerName} ruled on the objection: ${ruling}! ${reason ? `(${reason})` : ''}`;
    }

    case 'deliver_verdict': {
      if (narrative) return narrative;
      const reasoning = params.reasoning ? ` Reasoning: "${params.reasoning}"` : '';
      return `⚖️ Judge ${speakerName} pronounced the final verdict.${reasoning}`;
    }

    case 'present_evidence': {
      const targetName = getCharName(params.target || params.to);
      const evLabel = params.evidence || params.evidence_id || 'evidence';
      return `${speakerName} entered Exhibit [${evLabel}] into evidence before ${targetName}: "${params.point || ''}"`;
    }

    case 'file_charge': {
      const suspectName = getCharName(params.suspect || params.suspect_id);
      return `Prosecutor ${speakerName} filed formal indictment charges against ${suspectName} for "${params.charge || 'Murder'}".`;
    }

    case 'call_witness': {
      const witnessName = getCharName(params.character_id || params.target);
      return `${speakerName} called ${witnessName} to the witness stand for cross-examination.`;
    }

    case 'confess': {
      const details = params.details || extractQuotedText(narrative) || '';
      return `🚨 CONFESSION: ${speakerName} broke down on the record and admitted: "${details}"`;
    }

    case 'invoke_silence': {
      return `${speakerName} formally invoked the constitutional right to remain silent under questioning.`;
    }

    case 'submit_theory': {
      const culprits = (params.culprit_ids || []).map((id: string) => getCharName(id)).join(', ');
      return `Detective ${speakerName} submitted official theory of the crime naming ${culprits || 'the suspect'}.`;
    }

    case 'request_warrant': {
      return `Detective ${speakerName} petitioned the court for a search warrant.`;
    }

    case 'grant_warrant': {
      return `Judge ${speakerName} granted the search warrant to investigators.`;
    }

    case 'court_clerk':
    default: {
      if (narrative) return narrative;
      return `Court Clerk recorded: ${params.text || 'Action entered into official court docket.'}`;
    }
  }
}

// Backward compatibility export
export function getDialogueText(event?: DialogueEvent | null, characters: any[] = []): string {
  return getFirstPersonDialogue(event, characters);
}

export default function LiveDialogueOverlay({
  transcript = [],
  activeEvent,
  onSelectEvent,
  onJumpToLive,
  isLive,
  characters = [],
  activeSeats = []
}: LiveDialogueOverlayProps) {
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [isBarMinimized, setIsBarMinimized] = useState(false);
  const [livePovMode, setLivePovMode] = useState<'first' | 'third'>('first');
  const [filterMode, setFilterMode] = useState<'all' | 'dialogue' | 'key'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [expandedDirectQuotes, setExpandedDirectQuotes] = useState<Record<string, boolean>>({});

  const feedScrollRef = useRef<HTMLDivElement>(null);

  // Filter out pass_turn from meaningful speech history
  const dialogueEvents = useMemo(() => {
    return transcript.filter((t) => t.action !== 'pass_turn');
  }, [transcript]);

  // Current dialogue index
  const currentIndex = useMemo(() => {
    if (!activeEvent || dialogueEvents.length === 0) return -1;
    const idx = dialogueEvents.findIndex((d) => d.id === activeEvent.id);
    return idx >= 0 ? idx : dialogueEvents.length - 1;
  }, [activeEvent, dialogueEvents]);

  const currentDialogue = currentIndex >= 0 ? dialogueEvents[currentIndex] : dialogueEvents[dialogueEvents.length - 1];

  // Auto-scroll feed on new events
  useEffect(() => {
    if (autoScroll && feedScrollRef.current && isFeedOpen) {
      feedScrollRef.current.scrollTop = feedScrollRef.current.scrollHeight;
    }
  }, [dialogueEvents.length, isFeedOpen, autoScroll]);

  // Navigation handlers
  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectEvent(dialogueEvents[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < dialogueEvents.length - 1) {
      onSelectEvent(dialogueEvents[currentIndex + 1]);
    }
  };

  // Keyboard navigation for dialogue browsing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) onSelectEvent(dialogueEvents[currentIndex - 1]);
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < dialogueEvents.length - 1) onSelectEvent(dialogueEvents[currentIndex + 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, dialogueEvents, onSelectEvent]);

  const toggleThought = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedThoughts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDirectQuote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDirectQuotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Resolve persona character name if available
  const getSpeakerDisplayName = (event: DialogueEvent) => {
    if (event.characterName) return event.characterName;
    if (event.characterId) {
      const match = characters.find((c) => c.id === event.characterId);
      if (match) return match.name;
    }
    return event.agentName || event.role;
  };

  // Filtered list for the stream feed
  const feedList = useMemo(() => {
    if (filterMode === 'key') {
      return dialogueEvents.filter(
        (e) =>
          e.contradiction_exposed ||
          e.action === 'deliver_verdict' ||
          e.action === 'object' ||
          e.action === 'confess' ||
          e.action === 'grant_warrant'
      );
    }
    if (filterMode === 'dialogue') {
      return dialogueEvents.filter(
        (e) =>
          e.action === 'say' ||
          e.action === 'ask_question' ||
          e.action === 'answer_question' ||
          e.action === 'give_argument'
      );
    }
    return dialogueEvents;
  }, [dialogueEvents, filterMode]);

  if (!currentDialogue && dialogueEvents.length === 0) {
    return null;
  }

  const roleInfo = getRoleBadgeInfo(currentDialogue?.role);
  const actionBadge = getActionBadge(currentDialogue?.action);
  const RoleIcon = roleInfo.icon;

  // 1st Person vs 3rd Person texts for active statement
  const firstPersonText = getFirstPersonDialogue(currentDialogue, characters);
  const thirdPersonText = getThirdPersonNarrative(currentDialogue, characters);
  const activeDisplayText = livePovMode === 'first' ? firstPersonText : thirdPersonText;

  const speakerName = currentDialogue ? getSpeakerDisplayName(currentDialogue) : 'Agent';
  const targetName = currentDialogue?.target || currentDialogue?.params?.target || currentDialogue?.params?.suspect;

  return (
    <>
      {/* ────────────────── 1. ACTIVE DIALOGUE SUBTITLE BAR ────────────────── */}
      <div className="pointer-events-auto absolute bottom-20 sm:bottom-16 left-1/2 -translate-x-1/2 z-20 w-full max-w-3xl px-3 sm:px-4 select-none">
        {isBarMinimized ? (
          // Minimized Compact Subtitle Pill
          <div className="mx-auto flex items-center justify-between gap-3 bg-noir-950/90 backdrop-blur-xl px-4 py-2 rounded-full border border-noir-700/80 shadow-2xl animate-fade-in text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[9px] border ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
              <span className="font-bold text-slate-100">{speakerName}:</span>
              <span className="text-slate-300 italic truncate max-w-[280px] sm:max-w-md">
                "{activeDisplayText}"
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsBarMinimized(false)}
                className="p-1 rounded-lg bg-noir-900 hover:bg-noir-800 text-slate-400 hover:text-white transition"
                title="Expand Dialogue Card"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          // Expanded Interactive Dialogue Console
          <div className="bg-noir-950/92 backdrop-blur-2xl rounded-2xl border border-noir-700/80 shadow-2xl p-3 sm:p-4 text-slate-100 relative group transition-all duration-200">
            {/* Top Bar: Speaker Badge, Action, POV Mode Switcher, Stepper & Controls */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-noir-800/80">
              {/* Left: Speaker Role Badge, Persona, Addressee, Action Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${roleInfo.color}`}
                >
                  <RoleIcon className="w-3 h-3 shrink-0" />
                  <span>{roleInfo.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-100 tracking-tight font-sans">
                    {speakerName}
                  </span>
                  {currentDialogue?.agentName && currentDialogue?.agentName !== speakerName && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({currentDialogue.agentName})
                    </span>
                  )}
                </div>

                {targetName && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-400/90 font-mono bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    <CornerDownRight className="w-3 h-3 text-amber-400" />
                    <span>to {targetName}</span>
                  </div>
                )}

                <div
                  className={`px-2 py-0.5 rounded-md text-[9px] font-mono uppercase font-semibold border flex items-center gap-1 ${actionBadge.style}`}
                >
                  <span>{actionBadge.icon}</span>
                  <span>{actionBadge.label}</span>
                </div>
              </div>

              {/* Right: POV Mode Switcher (2 versions in live proceeding), Stepper & Drawer Trigger */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                {/* 2-Version POV Switcher */}
                <div className="flex items-center rounded-lg bg-noir-900 border border-noir-700/80 p-0.5 text-[10px] font-mono">
                  <button
                    onClick={() => setLivePovMode('first')}
                    className={`px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold transition ${
                      livePovMode === 'first'
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                    title="First Person POV (Direct speech from agent perspective)"
                  >
                    <User className="w-3 h-3" />
                    <span>1st POV</span>
                  </button>
                  <button
                    onClick={() => setLivePovMode('third')}
                    className={`px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold transition ${
                      livePovMode === 'third'
                        ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                    title="Third Person POV (Stenographer / Court record perspective)"
                  >
                    <Radio className="w-3 h-3" />
                    <span>3rd POV</span>
                  </button>
                </div>

                {/* Stepper Count */}
                <span className="text-[10px] text-slate-400 font-mono px-1.5 hidden sm:inline">
                  {currentIndex + 1} / {dialogueEvents.length}
                </span>

                {/* Previous Button */}
                <button
                  onClick={handlePrev}
                  disabled={currentIndex <= 0}
                  className="p-1 rounded-lg bg-noir-900 hover:bg-noir-850 disabled:opacity-30 disabled:cursor-not-allowed border border-noir-700/80 text-slate-300 hover:text-white transition"
                  title="Previous Statement (Left Arrow)"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  disabled={currentIndex >= dialogueEvents.length - 1}
                  className="p-1 rounded-lg bg-noir-900 hover:bg-noir-850 disabled:opacity-30 disabled:cursor-not-allowed border border-noir-700/80 text-slate-300 hover:text-white transition"
                  title="Next Statement (Right Arrow)"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Live Sync Button */}
                {!isLive && (
                  <button
                    onClick={onJumpToLive}
                    className="px-2 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition"
                    title="Jump to Realtime Simulation"
                  >
                    <Radio className="w-2.5 h-2.5 text-rose-400 animate-ping" />
                    <span>Live</span>
                  </button>
                )}

                {/* Stream Drawer Toggle Button */}
                <button
                  onClick={() => setIsFeedOpen(!isFeedOpen)}
                  className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition ${
                    isFeedOpen
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-noir-900 hover:bg-noir-850 text-slate-300 border-noir-700/80'
                  }`}
                  title="Toggle Live Dialogue Stream Feed (Sidebar)"
                >
                  <MessageSquare className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Dialogue Stream</span>
                </button>

                {/* Minimize Button */}
                <button
                  onClick={() => setIsBarMinimized(true)}
                  className="p-1 rounded-lg bg-noir-900 hover:bg-noir-850 text-slate-400 hover:text-white border border-noir-700/80 transition"
                  title="Minimize Dialogue Bar"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Main Dialogue Content */}
            <div className="relative">
              {/* POV Mode Tag */}
              <div className="flex items-center justify-between mb-1 text-[9.5px] font-mono">
                <span
                  className={`px-1.5 py-0.2 rounded font-semibold flex items-center gap-1 border ${
                    livePovMode === 'first'
                      ? 'text-amber-300/90 bg-amber-500/10 border-amber-500/30'
                      : 'text-indigo-300/90 bg-indigo-500/10 border-indigo-500/30'
                  }`}
                >
                  {livePovMode === 'first' ? (
                    <>
                      <User className="w-2.5 h-2.5 text-amber-400" />
                      <span>1ST PERSON POV • DIRECT IN-CHARACTER VOICE</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-2.5 h-2.5 text-indigo-400" />
                      <span>3RD PERSON POV • COURT STENOGRAPHER RECORD</span>
                    </>
                  )}
                </span>
                <span className="text-slate-500 text-[9px] sm:hidden">
                  {currentIndex + 1} / {dialogueEvents.length}
                </span>
              </div>

              {/* Dialogue Text */}
              <div className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed italic select-text pr-2">
                "{activeDisplayText}"
              </div>

              {/* Contradiction Alert Box */}
              {currentDialogue?.contradiction_exposed && (
                <div className="mt-2.5 p-2 rounded-xl bg-red-950/60 border border-red-700/60 flex items-start gap-2 text-red-200 text-xs">
                  <Zap className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-red-400 font-mono uppercase tracking-wide text-[10px]">
                      Contradiction Exposed:{' '}
                    </strong>
                    <span>{currentDialogue.contradiction_exposed.evidenceName}</span>
                    {currentDialogue.contradiction_exposed.details && (
                      <p className="text-[11px] text-red-300/90 mt-0.5">
                        {currentDialogue.contradiction_exposed.details}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Internal Tactical Reasoning / Agent Thought Snippet */}
              {currentDialogue?.thought_summary && (
                <div className="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-purple-950/70 via-indigo-950/50 to-noir-900 border border-purple-500/40 shadow-lg shadow-purple-950/40 flex items-start gap-2.5 font-mono animate-fade-in">
                  <div className="p-1 rounded-lg bg-purple-500/20 border border-purple-500/40 shrink-0 text-purple-300">
                    <Brain className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="flex-1 text-[11px] leading-relaxed">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2 py-0.2 rounded-md border border-purple-500/30">
                        💭 Tactical Reasoning & Internal Monologue
                      </span>
                      {targetName && (
                        <span className="text-[9.5px] text-amber-400 font-semibold">
                          Targeting: {targetName}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 italic font-sans font-medium">
                      "{currentDialogue.thought_summary}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Subtle Context Line with Autoplay Info */}
            <div className="mt-2.5 pt-2 border-t border-noir-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">
                  Round {currentDialogue?.round ?? 1} • {currentDialogue?.phase?.toUpperCase() ?? 'TRIAL'}
                </span>
                <span className="hidden sm:inline text-emerald-400/90 bg-emerald-500/10 px-2 py-0.2 rounded-md border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Autonomous Agent Debate
                </span>
              </div>
              <span className="hidden sm:inline text-slate-500">
                Use ◄ and ► to scrub dialogue history
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ────────────────── 2. LIVE DIALOGUE STREAM (SIDE PANEL) ────────────────── */}
      {isFeedOpen && (
        <aside className="pointer-events-auto fixed left-3 top-20 bottom-24 z-30 w-80 sm:w-96 glass-panel bg-noir-950/95 backdrop-blur-2xl border border-noir-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in select-none">
          {/* Stream Header */}
          <div className="p-3 border-b border-noir-800 flex items-center justify-between bg-noir-900/60">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <div>
                <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  Live Dialogue Stream
                </h2>
                <p className="text-[9px] text-indigo-300/80 font-mono">3rd Person Court Chronicle</p>
              </div>
              <span className="px-1.5 py-0.2 rounded-full bg-noir-800 text-indigo-300 font-mono text-[9px] border border-noir-700 ml-1">
                {dialogueEvents.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition ${
                  autoScroll
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-noir-800 text-slate-400 border-noir-700'
                }`}
                title="Toggle Auto-Scroll on new dialogue"
              >
                Scroll: {autoScroll ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setIsFeedOpen(false)}
                className="w-6 h-6 rounded-md bg-noir-850 hover:bg-noir-800 text-slate-400 hover:text-white flex items-center justify-center transition border border-noir-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1 p-2 border-b border-noir-800 bg-noir-900/40 text-[10px] font-mono">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2 py-0.5 rounded-md transition ${
                filterMode === 'all'
                  ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({dialogueEvents.length})
            </button>
            <button
              onClick={() => setFilterMode('dialogue')}
              className={`px-2 py-0.5 rounded-md transition ${
                filterMode === 'dialogue'
                  ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Speech Only
            </button>
            <button
              onClick={() => setFilterMode('key')}
              className={`px-2 py-0.5 rounded-md transition ${
                filterMode === 'key'
                  ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rulings & Objections
            </button>
          </div>

          {/* Messages Scroll Area (Rendered in Third Person POV) */}
          <div ref={feedScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {feedList.map((entry, idx) => {
              const rInfo = getRoleBadgeInfo(entry.role);
              const spkName = getSpeakerDisplayName(entry);
              // Rendered primarily in THIRD PERSON POV as requested
              const thirdPersonNarrative = getThirdPersonNarrative(entry, characters);
              const firstPersonSpeech = getFirstPersonDialogue(entry, characters);
              const isSelected = activeEvent?.id === entry.id || (!activeEvent && idx === feedList.length - 1);
              const hasThought = Boolean(entry.thought_summary);
              const isThoughtOpen = expandedThoughts[entry.id];
              const isQuoteOpen = expandedDirectQuotes[entry.id];

              return (
                <div
                  key={entry.id || idx}
                  onClick={() => onSelectEvent(entry)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-noir-850 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                      : entry.contradiction_exposed
                      ? 'bg-red-950/30 border-red-800/60 hover:bg-red-950/40'
                      : entry.action === 'deliver_verdict'
                      ? 'bg-amber-950/30 border-amber-700/50 hover:bg-amber-950/40'
                      : 'bg-noir-900/60 border-noir-800/80 hover:bg-noir-850/80 hover:border-slate-700'
                  }`}
                >
                  {/* Speaker Header with 3RD POV Tag */}
                  <div className="flex items-center justify-between gap-1 mb-1 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[8.5px] border ${rInfo.color}`}>
                        {rInfo.label}
                      </span>
                      <strong className="text-slate-200 truncate">{spkName}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[8px] font-mono text-indigo-300/80 bg-indigo-950/50 px-1 py-0.2 rounded border border-indigo-800/40">
                        3RD POV
                      </span>
                      <span className="text-slate-500 text-[9px]">
                        R{entry.round}
                      </span>
                    </div>
                  </div>

                  {/* Target addressee if present */}
                  {(entry.target || entry.params?.target) && (
                    <div className="text-[9px] text-amber-400/80 font-mono mb-1 flex items-center gap-1">
                      <CornerDownRight className="w-2.5 h-2.5" />
                      <span>to {entry.target || entry.params?.target}</span>
                    </div>
                  )}

                  {/* 3rd Person Narrative Body */}
                  <div className="text-slate-200 leading-relaxed text-[11px] font-sans">
                    {thirdPersonNarrative}
                  </div>

                  {/* Contradiction Tag */}
                  {entry.contradiction_exposed && (
                    <div className="mt-1.5 text-[9.5px] bg-red-900/40 text-red-300 px-1.5 py-0.5 rounded border border-red-700/50 flex items-center gap-1 font-mono">
                      <Zap className="w-3 h-3 text-red-400 shrink-0" />
                      <span>Contradiction: {entry.contradiction_exposed.evidenceName}</span>
                    </div>
                  )}

                  {/* Optional Direct 1st POV Voice Dropdown */}
                  <div className="mt-1.5 pt-1 border-t border-noir-800/70 flex items-center justify-between flex-wrap gap-1">
                    <button
                      onClick={(e) => toggleDirectQuote(entry.id, e)}
                      className="text-[9px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
                      title="Inspect spoken words from agent's 1st POV"
                    >
                      <Quote className="w-2.5 h-2.5" />
                      <span>{isQuoteOpen ? 'Hide 1st POV Quote' : 'View 1st POV Quote'}</span>
                    </button>

                    {hasThought && (
                      <button
                        onClick={(e) => toggleThought(entry.id, e)}
                        className="text-[9px] font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
                      >
                        <Brain className="w-2.5 h-2.5" />
                        <span>{isThoughtOpen ? 'Hide Reasoning' : 'Agent Reasoning'}</span>
                      </button>
                    )}
                  </div>

                  {/* Expanded 1st Person Quote */}
                  {isQuoteOpen && (
                    <div className="mt-1.5 p-2 rounded-lg bg-noir-950/90 border border-amber-500/30 text-[10.5px] text-amber-100 italic font-serif leading-relaxed">
                      <span className="text-amber-400 font-mono font-semibold not-italic text-[8.5px] block mb-0.5 uppercase tracking-wider">
                        Direct 1st Person Spoken Voice:
                      </span>
                      "{firstPersonSpeech}"
                    </div>
                  )}

                  {/* Expanded Thought Summary */}
                  {isThoughtOpen && hasThought && (
                    <div className="mt-1.5 p-1.5 rounded bg-purple-950/30 border border-purple-800/40 text-[10px] text-purple-200/90 font-mono">
                      <span className="text-purple-400 font-bold block text-[8.5px] mb-0.5 uppercase">Strategy / Rationale:</span>
                      {entry.thought_summary}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      )}
    </>
  );
}
