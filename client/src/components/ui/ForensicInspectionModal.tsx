'use client';

import React, { useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  FileText,
  Search,
  Key,
  FlaskConical,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  X,
  Fingerprint,
  AlertOctagon,
  Sparkles,
  Award,
  Lock,
  Layers
} from 'lucide-react';

export interface ForensicInspectionItem {
  kind: 'evidence' | 'suspect' | 'case_brief';
  data: any;
}

interface ForensicInspectionModalProps {
  item: ForensicInspectionItem | null;
  onClose: () => void;
  caseTitle?: string;
  casePremise?: string;
}

export default function ForensicInspectionModal({
  item,
  onClose,
  caseTitle = 'The Last Page',
  casePremise = 'A famous novelist is found dead behind a door locked from the inside.'
}: ForensicInspectionModalProps) {
  // Dismiss on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const { kind, data } = item;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden font-mono text-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              {kind === 'suspect' ? (
                <User className="w-5 h-5" />
              ) : kind === 'case_brief' ? (
                <Shield className="w-5 h-5" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <span>POLICE DOSSIER ARCHIVE</span>
                <span>•</span>
                <span className="text-slate-400">
                  {kind === 'suspect'
                    ? 'PERSON OF INTEREST'
                    : kind === 'case_brief'
                    ? 'CRIME INCIDENT REPORT'
                    : 'FORENSIC EXHIBIT'}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-100 tracking-tight">
                {kind === 'suspect'
                  ? data.name
                  : kind === 'case_brief'
                  ? data.title || caseTitle
                  : data.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed">
          {/* ==================================================== */}
          {/* KIND: EVIDENCE EXHIBIT                               */}
          {/* ==================================================== */}
          {kind === 'evidence' && (
            <>
              {/* Exhibit ID and Type Banner */}
              <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">EVIDENCE TAG:</span>
                  <span className="font-black text-amber-400 bg-amber-950/70 px-2.5 py-0.5 rounded border border-amber-800/40 text-xs">
                    {data.id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">TYPE:</span>
                  <span className="font-bold text-cyan-400 uppercase bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 text-[11px]">
                    {data.type || 'PHYSICAL'}
                  </span>
                </div>
              </div>

              {/* Visual Clue Graphic Frame */}
              <div className="w-full h-32 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-radial-vignette opacity-40 pointer-events-none" />
                {data.id === 'EV-103' && (
                  <div className="flex flex-col items-center text-emerald-400">
                    <FlaskConical className="w-12 h-12 mb-1 drop-shadow" />
                    <span className="text-xs font-bold text-emerald-300 tracking-wider">
                      FOXGLOVE LEAF RESIDUE (DIGITOXIN)
                    </span>
                  </div>
                )}
                {data.id === 'EV-105' && (
                  <div className="flex flex-col items-center text-cyan-400">
                    <Clock className="w-12 h-12 mb-1 drop-shadow" />
                    <span className="text-xs font-bold text-cyan-300 tracking-wider">
                      STAFF-DOOR RFID SCANNER LOG
                    </span>
                  </div>
                )}
                {data.id === 'EV-101' && (
                  <div className="flex flex-col items-center text-amber-400">
                    <Key className="w-12 h-12 mb-1 drop-shadow" />
                    <span className="text-xs font-bold text-amber-300 tracking-wider">
                      STUDY DEADBOLT KEY (VICTIM POCKET)
                    </span>
                  </div>
                )}
                {data.id === 'EV-104' && (
                  <div className="flex flex-col items-center text-rose-400">
                    <FileText className="w-12 h-12 mb-1 drop-shadow" />
                    <span className="text-xs font-bold text-rose-300 tracking-wider">
                      WORD PROCESSOR TERMINATION DRAFT
                    </span>
                  </div>
                )}
                {data.id === 'EV-107' && (
                  <div className="flex flex-col items-center text-purple-400">
                    <Scissors className="w-12 h-12 mb-1 drop-shadow" />
                    <span className="text-xs font-bold text-purple-300 tracking-wider">
                      BOTANICAL PRUNING SHEARS & GLOVES
                    </span>
                  </div>
                )}
                {data.id !== 'EV-103' &&
                  data.id !== 'EV-105' &&
                  data.id !== 'EV-101' &&
                  data.id !== 'EV-104' &&
                  data.id !== 'EV-107' && (
                    <div className="flex flex-col items-center text-amber-400">
                      <Fingerprint className="w-12 h-12 mb-1 drop-shadow" />
                      <span className="text-xs font-bold text-amber-300 tracking-wider">
                        CRIME SCENE ARTIFACT
                      </span>
                    </div>
                  )}
              </div>

              {/* Description */}
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Investigative Findings & Chain of Custody
                </div>
                <div className="text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
                  {data.description}
                </div>
              </div>

              {/* Forensic Result */}
              {data.forensicResult && (
                <div>
                  <div className="text-[10px] font-bold uppercase text-cyan-400 mb-1.5 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                    Forensic Laboratory Certification
                  </div>
                  <div className="bg-cyan-950/40 border border-cyan-800/50 p-3.5 rounded-xl text-cyan-200">
                    <div className="font-bold text-xs mb-1 text-cyan-300 uppercase tracking-wide">
                      {data.forensicResult.test_type}
                    </div>
                    <p className="text-xs leading-relaxed text-cyan-100">
                      {data.forensicResult.result}
                    </p>
                  </div>
                </div>
              )}

              {/* Investigative Significance */}
              {data.significance && (
                <div>
                  <div className="text-[10px] font-bold uppercase text-amber-400 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Strategic Inquest Value
                  </div>
                  <div className="text-xs text-amber-200/95 bg-amber-950/30 p-3 rounded-xl border border-amber-800/40 leading-relaxed">
                    {data.significance}
                  </div>
                </div>
              )}

              {/* Judicial Admissibility */}
              <div className="pt-1">
                {data.isAdmitted ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Admitted as Sworn Evidence by presiding judge in court record.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-700/50 text-amber-300 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Discovered in field; pending formal admission to judicial record.</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ==================================================== */}
          {/* KIND: SUSPECT DOSSIER                                */}
          {/* ==================================================== */}
          {kind === 'suspect' && (
            <>
              {/* Profile Bar */}
              <div className="grid grid-cols-2 gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px]">OCCUPATION:</span>
                  <div className="font-bold text-slate-100 mt-0.5">{data.occupation || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">RELATIONSHIP TO VICTIM:</span>
                  <div className="font-bold text-slate-100 mt-0.5">
                    {data.relationship_to_victim || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Claimed Alibi */}
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Initial Statement & Claimed Alibi
                </div>
                <div className="text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 leading-relaxed italic">
                  “{data.claimed_alibi || 'Refused to supply verified timeline without counsel.'}”
                </div>
              </div>

              {/* Culprit vs Cleared Inquest Finding */}
              {data.id === 'CH-104' ? (
                <div className="bg-red-950/50 border border-red-700/60 p-4 rounded-xl text-red-200 space-y-2">
                  <div className="font-black text-red-400 text-xs uppercase flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    CULPRIT IDENTIFIED: CONFLICT & CONFESSION
                  </div>
                  <p className="text-xs leading-relaxed text-red-100">
                    Nora Pike prepared foxglove leaf extract from the greenhouse, delivered the poisoned tea at 21:40, and exited at 22:04 through the staff door. Her confession and the evidence chain confirm her sole culpability.
                  </p>
                  <div className="text-[11px] font-bold text-red-300 pt-1 border-t border-red-800/60">
                    Motive: Retaliation for removal of co-writer credit on “The Salt Road”.
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-950/40 border border-emerald-800/50 p-4 rounded-xl text-emerald-200 space-y-1.5">
                  <div className="font-bold text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    CLEARED: ALIBI FORENSICALLY VERIFIED
                  </div>
                  <p className="text-xs leading-relaxed text-emerald-100">
                    Independent alibi verified through forensic timeline, inn check-in receipts, or continuous phone records. Confirmed cleared of homicide culpability.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ==================================================== */}
          {/* KIND: CASE INCIDENT BRIEF                            */}
          {/* ==================================================== */}
          {kind === 'case_brief' && (
            <>
              {/* Public Inquest Premise */}
              <div className="bg-amber-950/30 border border-amber-800/40 p-4 rounded-xl text-amber-200">
                <div className="font-bold text-xs uppercase text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Official Inquest Public Premise
                </div>
                <p className="text-xs leading-relaxed text-slate-200">
                  {casePremise}
                </p>
              </div>

              {/* Case Attributes Table */}
              <div className="space-y-2.5 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">VICTIM:</span>
                  <span className="font-bold text-slate-200">Marcus Vell (Age 58)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">LOCATION:</span>
                  <span className="font-bold text-slate-200">Vell House Study, Heron Island</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">TIME OF DEATH:</span>
                  <span className="font-bold text-slate-200">22:00 – 22:30 (Saturday, 9 Nov)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">CAUSE OF DEATH:</span>
                  <span className="font-bold text-red-400">Cardiac Glycoside (Foxglove) Poisoning</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">LOCKED ROOM STATUS:</span>
                  <span className="font-bold text-emerald-400">Locked from Inside; Key in Pocket</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-500">
            Press ESC or click outside to dismiss
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-md"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
