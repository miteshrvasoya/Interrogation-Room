'use client';

import React, { useState } from 'react';
import { FileCheck2, Upload, AlertCircle, CheckCircle2, FileText, ArrowRight, Sparkles, Copy, Trash2, Check } from 'lucide-react';

export default function ValidatorPage() {
  const [jsonText, setJsonText] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    if (navigator?.clipboard && jsonText) {
      navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Run validation check
  const handleValidate = async () => {
    setLoading(true);
    setValidationResult(null);
    setUploadSuccess(null);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(jsonText);
      } catch (e: any) {
        setValidationResult({
          valid: false,
          errors: [`JSON Syntax Error: ${e.message}`]
        });
        setLoading(false);
        return;
      }

      const res = await fetch('/api/cases/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      setValidationResult(data);
    } catch (err: any) {
      setValidationResult({ valid: false, errors: [err.message] });
    } finally {
      setLoading(false);
    }
  };

  // Upload into platform engine
  const handleUploadCase = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      const res = await fetch('/api/cases/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      if (data.success) {
        setUploadSuccess(`Case ${data.case_id} successfully loaded into platform memory!`);
      } else {
        alert(`Upload error: ${data.errors?.join('; ')}`);
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    }
  };

  // Load sample case template
  const loadSampleTemplate = () => {
    setJsonText(JSON.stringify({
      "format_version": "1.0",
      "library_ref": "interrogation-room-core",
      "cases": [
        {
          "case_id": "CASE-999",
          "title": "The Gilded Dagger",
          "tagline": "A collector is found dead in his private gallery.",
          "version": "1.0.0",
          "author": "Community Creator",
          "difficulty": 3,
          "genre": ["murder", "antiquities"],
          "content_rating": "PG-13",
          "estimated_rounds": 40,
          "setting": {
            "location": "Valmont Manor, London",
            "date": "Tuesday, 18 October",
            "atmosphere": "Heavy fog and rain.",
            "summary": "Lord Valmont was found in his locked gallery room."
          },
          "public_briefing": {
            "opening_report": "Lord Valmont was discovered dead in his gallery at 08:00.",
            "known_fact_ids": ["F-901"],
            "initial_leads": ["The alarm was deactivated from the inside."]
          },
          "ground_truth": {
            "crime": {
              "type": "murder",
              "victim_id": "CH-901",
              "time_window": { "start": "23:00", "end": "23:30" },
              "location_id": "LOC-GALLERY",
              "method": "Venom extract",
              "motive": "Will contestation"
            },
            "culprit_ids": ["CH-902"],
            "accomplice_ids": [],
            "true_timeline": [
              { "id": "TL-901", "time": "23:00", "actor_ids": ["CH-902"], "location_id": "LOC-GALLERY", "event": "Culprit enters", "fact_ids": ["F-901"] },
              { "id": "TL-902", "time": "23:15", "actor_ids": ["CH-901", "CH-902"], "location_id": "LOC-GALLERY", "event": "Poison delivered", "fact_ids": ["F-902"] },
              { "id": "TL-903", "time": "08:00", "actor_ids": ["CH-903"], "location_id": "LOC-GALLERY", "event": "Body discovered", "fact_ids": ["F-901"] }
            ],
            "facts": [
              { "id": "F-901", "statement": "Lord Valmont found dead at 08:00." },
              { "id": "F-902", "statement": "Venom traces found in the evening tonic." },
              { "id": "F-903", "statement": "Estate gate logs show nephew entered at 22:50." }
            ]
          },
          "characters": [
            {
              "id": "CH-901",
              "name": "Lord Valmont",
              "role_in_case": "victim",
              "public_profile": "Wealthy antiquities collector."
            },
            {
              "id": "CH-902",
              "name": "Julian Valmont",
              "role_in_case": "suspect",
              "seat_role": "suspect",
              "public_profile": "Estranged nephew.",
              "private_knowledge": ["F-901", "F-902"],
              "testimony": [
                {
                  "id": "TS-901",
                  "topic": "alibi",
                  "told_answer": "I was at the club until midnight.",
                  "honesty": "lie",
                  "truth_fact_ids": ["F-902"]
                }
              ],
              "behavior": {
                "is_culprit": true,
                "goal": "Avoid suspicion."
              }
            },
            {
              "id": "CH-903",
              "name": "Martha Cole",
              "role_in_case": "witness",
              "seat_role": "witness",
              "public_profile": "Head housekeeper.",
              "private_knowledge": ["F-901"],
              "testimony": [
                {
                  "id": "TS-902",
                  "topic": "discovery",
                  "told_answer": "I unlocked the gallery door at eight in the morning.",
                  "honesty": "truthful",
                  "truth_fact_ids": ["F-901"]
                }
              ],
              "behavior": {
                "is_culprit": false,
                "goal": "Tell the truth."
              }
            }
          ],
          "locations": [
            {
              "id": "LOC-GALLERY",
              "name": "Private Gallery",
              "description": "High ceiling room housing ancient daggers.",
              "access": { "requires_warrant": true },
              "hides": ["EV-901"]
            }
          ],
          "evidence": [
            {
              "id": "EV-901",
              "name": "Vial of Rare Extract",
              "type": "physical",
              "description": "Discarded small glass vial behind cabinet.",
              "location_id": "LOC-GALLERY",
              "discovery": {
                "method": "search_location",
                "requires_evidence": [],
                "requires_warrant": true
              },
              "supports_fact_ids": ["F-902"],
              "points_to": ["CH-902"],
              "reliability": 0.95,
              "is_red_herring": false,
              "significance": "Proves the poison source."
            },
            {
              "id": "EV-902",
              "name": "Security Log Book",
              "type": "document",
              "description": "Log of gate access for the estate.",
              "location_id": null,
              "discovery": {
                "method": "records_request",
                "requires_evidence": [],
                "requires_warrant": true,
                "record_source": "Estate Gate"
              },
              "supports_fact_ids": ["F-901"],
              "points_to": ["CH-902"],
              "reliability": 1.0,
              "is_red_herring": false,
              "significance": "Refutes the nephew's alibi."
            },
            {
              "id": "EV-903",
              "name": "Toxicology Swab",
              "type": "forensic",
              "description": "Residue swabbed from the glass.",
              "location_id": null,
              "discovery": {
                "method": "search_location",
                "requires_evidence": [],
                "requires_warrant": false
              },
              "supports_fact_ids": ["F-902"],
              "points_to": ["CH-902"],
              "reliability": 1.0,
              "is_red_herring": false,
              "significance": "Corroborates the poison type."
            }
          ],
          "roster": {
            "seats": [
              { "role": "judge", "min": 1, "max": 1, "initial_fill": "house_bot" },
              { "role": "detective", "min": 1, "max": 1, "initial_fill": "house_bot" },
              { "role": "suspect", "min": 1, "max": 1, "initial_fill": "house_bot", "character_ids": ["CH-902"] },
              { "role": "witness", "min": 1, "max": 1, "initial_fill": "house_bot", "character_ids": ["CH-903"] }
            ]
          },
          "phase_template": "standard_trial_v1",
          "solution": {
            "key_evidence_chain": [
              { "step": 1, "evidence_ids": ["EV-901"], "inference": "Venom vial discovered behind cabinet." },
              { "step": 2, "evidence_ids": ["EV-902"], "inference": "Gate logs disprove alibi, locking in culprit presence." }
            ],
            "minimal_solving_path": ["EV-901", "EV-902"],
            "red_herrings": [],
            "wrong_conclusions": [],
            "solver_check": { "status": "solved_by_solver_agent" }
          },
          "conclusion": {
            "expected_verdicts": [
              { "character_id": "CH-902", "verdict": "guilty", "charge": "Murder" }
            ],
            "default_for_unlisted_defendants": "not_guilty",
            "judge_reasoning_template": "Evidence confirms presence and poison.",
            "reveal_narration": "Julian Valmont slipped the venom into the tonic.",
            "epilogue": "Justice is served in the quiet London night."
          }
        }
      ]
    }, null, 2));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-amber-500 font-mono text-xs uppercase font-bold tracking-widest mb-1">
          <FileCheck2 className="w-4 h-4" /> Schema & Semantic Validator
        </div>
        <h1 className="text-3xl font-extrabold text-white font-display uppercase tracking-wide">
          Case File Validator & Uploader
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Validate any mystery case against `case_schema.json` and cross-referencing integrity rules. Add new cases dynamically without restarting or modifying code.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Pane */}
        <div className="glass-panel p-6 rounded-2xl border border-noir-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <span className="text-xs font-mono font-bold uppercase text-slate-300">
                Case JSON Input
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadSampleTemplate}
                  className="px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 text-[11px] font-mono font-bold transition"
                >
                  Load Sample Template
                </button>
                {jsonText && (
                  <>
                    <button
                      type="button"
                      onClick={handleCopyJson}
                      title="Copy JSON"
                      className="p-1 rounded bg-noir-850 hover:bg-noir-800 border border-noir-700 text-slate-300 hover:text-white text-[11px] font-mono transition flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setJsonText(''); setValidationResult(null); }}
                      title="Clear JSON"
                      className="p-1 rounded bg-noir-850 hover:bg-rose-950/60 border border-noir-700 text-slate-400 hover:text-rose-400 text-[11px] transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <textarea
              rows={18}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste case file JSON here..."
              className="w-full bg-noir-950 border border-noir-700/80 rounded-xl p-3 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleValidate}
              disabled={loading || !jsonText.trim()}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-noir-950 font-bold text-xs uppercase tracking-wider font-mono transition shadow"
            >
              {loading ? 'Running Validator...' : 'Validate Case File'}
            </button>
          </div>
        </div>

        {/* Validation Output Pane */}
        <div className="glass-panel p-6 rounded-2xl border border-noir-800 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4 font-mono flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" /> Validation Report
            </h2>

            {uploadSuccess && (
              <div className="p-4 mb-4 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-xs text-emerald-300 font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {validationResult ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border flex items-center gap-3 ${
                    validationResult.valid
                      ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-700/60 text-rose-300'
                  }`}
                >
                  {validationResult.valid ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-sm uppercase font-mono">
                      {validationResult.valid ? 'VALIDATION PASSED' : 'VALIDATION FAILED'}
                    </div>
                    <div className="text-[11px] font-mono mt-0.5">
                      {validationResult.valid
                        ? `All schema & cross-reference checks passed. Found ${validationResult.summary?.caseCount} case(s).`
                        : `${validationResult.errors?.length} error(s) discovered in case structure.`}
                    </div>
                  </div>
                </div>

                {/* Errors List */}
                {validationResult.errors && validationResult.errors.length > 0 && (
                  <div className="p-4 rounded-xl bg-noir-900 border border-noir-800 max-h-[260px] overflow-y-auto space-y-2">
                    <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">
                      Issues To Address:
                    </div>
                    {validationResult.errors.map((err: string, idx: number) => (
                      <div key={idx} className="text-xs text-rose-300 font-mono pl-3 border-l-2 border-rose-600">
                        {err}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                No validation run yet. Paste or load a case JSON on the left to test.
              </div>
            )}
          </div>

          {validationResult?.valid && (
            <div className="mt-6 pt-4 border-t border-noir-800">
              <button
                onClick={handleUploadCase}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider font-mono transition flex items-center justify-center gap-2 shadow"
              >
                <Sparkles className="w-4 h-4" />
                Add Case to Active Platform Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
