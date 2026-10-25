const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const { SCHEMA_PATH } = require('../config/constants');

class CaseValidator {
  constructor(schemaPath = SCHEMA_PATH) {
    this.schemaPath = schemaPath;
    this.ajv = new Ajv2020({ allErrors: true, verbose: true, strict: false });
    addFormats(this.ajv);
    this.schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    this.validateFn = this.ajv.compile(this.schema);
  }

  /**
   * Validate raw case library or single case against schema and semantic graph rules.
   * @param {Object} data - Case library JSON or { cases: [case] }
   * @returns {{ valid: boolean, errors: Array<string>, warnings: Array<string>, summary: Object }}
   */
  validate(data) {
    const errors = [];
    const warnings = [];

    // Normalize: if user passed a single case object, wrap it
    let libraryData = data;
    if (data && data.case_id && !data.cases) {
      libraryData = {
        format_version: '1.0',
        library_ref: 'interrogation-room-core',
        cases: [data]
      };
    }

    // 1. Schema Validation via Ajv
    const schemaValid = this.validateFn(libraryData);
    if (!schemaValid && this.validateFn.errors) {
      for (const err of this.validateFn.errors) {
        errors.push(`[Schema] ${err.instancePath || 'root'}: ${err.message} (${JSON.stringify(err.params)})`);
      }
    }

    if (!libraryData || !Array.isArray(libraryData.cases)) {
      return { valid: false, errors, warnings, summary: { caseCount: 0 } };
    }

    // 2. Semantic Cross-Reference Validation for each case
    libraryData.cases.forEach((c, idx) => {
      const casePrefix = `[Case ${c.case_id || idx}]`;

      const factIds = new Set((c.ground_truth?.facts || []).map(f => f.id));
      const charIds = new Set((c.characters || []).map(ch => ch.id));
      const locIds = new Set((c.locations || []).map(l => l.id));
      const evIds = new Set((c.evidence || []).map(e => e.id));
      const secIds = new Set();
      const tsIds = new Set();

      (c.characters || []).forEach(ch => {
        (ch.secrets || []).forEach(s => secIds.add(s.id));
        (ch.testimony || []).forEach(t => tsIds.add(t.id));
      });

      // Ground truth checks
      if (c.ground_truth) {
        const { crime, culprit_ids, accomplice_ids, true_timeline } = c.ground_truth;
        
        if (crime?.victim_id && !charIds.has(crime.victim_id)) {
          errors.push(`${casePrefix} Crime victim_id "${crime.victim_id}" not found in characters.`);
        }
        if (crime?.location_id && !locIds.has(crime.location_id)) {
          errors.push(`${casePrefix} Crime location_id "${crime.location_id}" not found in locations.`);
        }

        (culprit_ids || []).forEach(id => {
          if (!charIds.has(id)) {
            errors.push(`${casePrefix} Culprit ID "${id}" not found in characters.`);
          }
        });

        (accomplice_ids || []).forEach(id => {
          if (!charIds.has(id)) {
            errors.push(`${casePrefix} Accomplice ID "${id}" not found in characters.`);
          }
        });

        (true_timeline || []).forEach((tl, tIdx) => {
          (tl.actor_ids || []).forEach(aId => {
            if (!charIds.has(aId)) {
              errors.push(`${casePrefix} Timeline step ${tl.id || tIdx}: Actor ID "${aId}" not found in characters.`);
            }
          });
          if (tl.location_id && !locIds.has(tl.location_id)) {
            errors.push(`${casePrefix} Timeline step ${tl.id || tIdx}: Location ID "${tl.location_id}" not found in locations.`);
          }
          (tl.fact_ids || []).forEach(fId => {
            if (!factIds.has(fId)) {
              errors.push(`${casePrefix} Timeline step ${tl.id || tIdx}: Fact ID "${fId}" not found in ground_truth.facts.`);
            }
          });
        });
      }

      // Public briefing checks
      (c.public_briefing?.known_fact_ids || []).forEach(fId => {
        if (!factIds.has(fId)) {
          errors.push(`${casePrefix} Public briefing known_fact_ids: Fact "${fId}" not in ground_truth.facts.`);
        }
      });

      // Location hides check
      (c.locations || []).forEach(loc => {
        (loc.hides || []).forEach(eId => {
          if (!evIds.has(eId)) {
            errors.push(`${casePrefix} Location ${loc.id}: Hides evidence "${eId}" which is not defined in evidence list.`);
          }
        });
      });

      // Characters checks
      (c.characters || []).forEach(ch => {
        (ch.private_knowledge || []).forEach(fId => {
          if (!factIds.has(fId)) {
            errors.push(`${casePrefix} Character ${ch.id} (${ch.name}): private_knowledge fact "${fId}" not found.`);
          }
        });

        (ch.secrets || []).forEach(sec => {
          (sec.reveal_policy?.requires_evidence || []).forEach(eId => {
            if (!evIds.has(eId)) {
              errors.push(`${casePrefix} Character ${ch.id} secret ${sec.id}: requires_evidence "${eId}" not in evidence list.`);
            }
          });
        });

        (ch.testimony || []).forEach(ts => {
          (ts.truth_fact_ids || []).forEach(fId => {
            if (!factIds.has(fId)) {
              errors.push(`${casePrefix} Character ${ch.id} testimony ${ts.id}: truth_fact_ids "${fId}" not in ground_truth.facts.`);
            }
          });
          (ts.contradicted_by || []).forEach(eId => {
            if (!evIds.has(eId)) {
              errors.push(`${casePrefix} Character ${ch.id} testimony ${ts.id}: contradicted_by "${eId}" not in evidence.`);
            }
          });
          (ts.available_after || []).forEach(eId => {
            if (!evIds.has(eId)) {
              errors.push(`${casePrefix} Character ${ch.id} testimony ${ts.id}: available_after "${eId}" not in evidence.`);
            }
          });
          (ts.unlocks_evidence || []).forEach(eId => {
            if (!evIds.has(eId)) {
              errors.push(`${casePrefix} Character ${ch.id} testimony ${ts.id}: unlocks_evidence "${eId}" not in evidence.`);
            }
          });
        });

        if (ch.behavior?.breaking_point?.or_all_evidence) {
          ch.behavior.breaking_point.or_all_evidence.forEach(eId => {
            if (!evIds.has(eId)) {
              errors.push(`${casePrefix} Character ${ch.id} breaking_point or_all_evidence: "${eId}" not in evidence.`);
            }
          });
        }
      });

      // Evidence checks
      (c.evidence || []).forEach(ev => {
        if (ev.location_id && !locIds.has(ev.location_id)) {
          errors.push(`${casePrefix} Evidence ${ev.id}: location_id "${ev.location_id}" not in locations.`);
        }
        (ev.supports_fact_ids || []).forEach(fId => {
          if (!factIds.has(fId)) {
            errors.push(`${casePrefix} Evidence ${ev.id}: supports_fact_ids "${fId}" not in ground_truth.facts.`);
          }
        });
        (ev.points_to || []).forEach(chId => {
          if (!charIds.has(chId)) {
            errors.push(`${casePrefix} Evidence ${ev.id}: points_to "${chId}" not in characters.`);
          }
        });
        (ev.discovery?.requires_evidence || []).forEach(reqId => {
          if (!evIds.has(reqId)) {
            errors.push(`${casePrefix} Evidence ${ev.id}: discovery requires_evidence "${reqId}" not in evidence.`);
          }
        });
        if (ev.discovery?.character_id && !charIds.has(ev.discovery.character_id)) {
          errors.push(`${casePrefix} Evidence ${ev.id}: discovery character_id "${ev.discovery.character_id}" not in characters.`);
        }
        if (ev.discovery?.testimony_id && !tsIds.has(ev.discovery.testimony_id)) {
          errors.push(`${casePrefix} Evidence ${ev.id}: discovery testimony_id "${ev.discovery.testimony_id}" not in testimonies.`);
        }
      });

      // Solution checks
      if (c.solution) {
        (c.solution.key_evidence_chain || []).forEach(step => {
          (step.evidence_ids || []).forEach(eId => {
            if (!evIds.has(eId)) {
              errors.push(`${casePrefix} Solution key_evidence_chain step ${step.step}: evidence "${eId}" not in evidence.`);
            }
          });
        });
        (c.solution.minimal_solving_path || []).forEach(eId => {
          if (!evIds.has(eId)) {
            errors.push(`${casePrefix} Solution minimal_solving_path evidence "${eId}" not in evidence.`);
          }
        });
        (c.solution.red_herrings || []).forEach(eId => {
          if (!evIds.has(eId)) {
            errors.push(`${casePrefix} Solution red_herrings evidence "${eId}" not in evidence.`);
          }
        });
        (c.solution.wrong_conclusions || []).forEach(wc => {
          if (!charIds.has(wc.suspect_id)) {
            errors.push(`${casePrefix} Solution wrong_conclusions suspect_id "${wc.suspect_id}" not in characters.`);
          }
          (wc.refuted_by || []).forEach(eId => {
            if (!evIds.has(eId)) {
              errors.push(`${casePrefix} Solution wrong_conclusions refuted_by "${eId}" not in evidence.`);
            }
          });
        });
      }

      // Conclusion checks
      if (c.conclusion) {
        (c.conclusion.expected_verdicts || []).forEach(ev => {
          if (!charIds.has(ev.character_id)) {
            errors.push(`${casePrefix} Conclusion expected_verdict character_id "${ev.character_id}" not in characters.`);
          }
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        caseCount: libraryData.cases.length,
        caseIds: libraryData.cases.map(c => c.case_id)
      }
    };
  }
}

// Allow CLI execution: node src/engine/Validator.js [path]
if (require.main === module) {
  const filePath = process.argv[2] || path.resolve(__dirname, '../../../cases.json');
  console.log(`[CaseValidator] Checking file: ${filePath}`);
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const validator = new CaseValidator();
    const result = validator.validate(raw);
    if (result.valid) {
      console.log(`✅ Validation Successful! Found ${result.summary.caseCount} valid cases: ${result.summary.caseIds.join(', ')}`);
      process.exit(0);
    } else {
      console.error(`❌ Validation Failed with ${result.errors.length} errors:`);
      result.errors.forEach(e => console.error(`  - ${e}`));
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Failed to read or parse file: ${err.message}`);
    process.exit(1);
  }
}

module.exports = CaseValidator;
