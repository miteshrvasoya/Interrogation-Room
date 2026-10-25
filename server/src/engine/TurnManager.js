/**
 * TurnManager.js
 * Handles execution, validation, resolution order, and side-effects for all 24 actions.
 */
class TurnManager {
  constructor(session) {
    this.session = session;
    this.library = session.caseLoader.getLibrary();
    this.actionCatalog = this.library.action_catalog;
  }

  /**
   * Validate if an action is legal for this role in this phase
   */
  validateAction(agent, actionObj) {
    if (!actionObj || typeof actionObj !== 'object') {
      return { valid: false, reason: 'Action payload must be an object' };
    }
    const { action, params = {} } = actionObj;
    const actionDef = this.actionCatalog[action];
    if (!actionDef) {
      return { valid: false, reason: `Unknown action: "${action}"` };
    }

    // Role check
    const allowedActors = actionDef.actors;
    const isActorAllowed = allowedActors.includes('*') || 
                           allowedActors.includes(agent.role) ||
                           (allowedActors.includes('approver_roles') && agent.isApprover);
    if (!isActorAllowed) {
      return { valid: false, reason: `Role "${agent.role}" cannot execute action "${action}"` };
    }

    // Phase check
    const currentPhase = this.session.currentPhase;
    const phaseTemplate = this.library.phase_templates.standard_trial_v1;
    const phaseDef = phaseTemplate.phases.find(p => p.id === currentPhase);
    
    // Check if common action
    const isCommon = phaseTemplate.common_actions.includes(action);
    const roleAllowedInPhase = phaseDef?.role_actions?.[agent.role]?.includes(action);

    if (!isCommon && !roleAllowedInPhase) {
      // Check subphases for trial
      if (currentPhase === 'trial' && phaseDef.sub_phases) {
        const subPhase = this.session.subPhase || 'examination';
        const subDef = phaseDef.sub_phases.find(sp => sp.id === subPhase);
        if (!subDef?.actions.includes(action)) {
          return { valid: false, reason: `Action "${action}" not permitted during trial ${subPhase}` };
        }
      } else {
        return { valid: false, reason: `Action "${action}" is not allowed in phase "${currentPhase}" for role "${agent.role}"` };
      }
    }

    // Probation check for police officer
    if (agent.role === 'police_officer' && agent.isProbation) {
      const allowedProbation = ['search_location', 'ask_question', 'say', 'pass_turn'];
      if (!allowedProbation.includes(action)) {
        return { valid: false, reason: 'Police officer on probation may only search_location, ask_question, say, and pass_turn' };
      }
    }

    return { valid: true };
  }

  /**
   * Execute an action and apply game state mutations
   */
  executeAction(agent, actionSubmission) {
    const { action, params = {}, thought_summary = '' } = actionSubmission;
    const actionId = `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const event = {
      id: actionId,
      round: this.session.round,
      phase: this.session.currentPhase,
      subPhase: this.session.subPhase,
      agentId: agent.agentId,
      agentName: agent.name,
      role: agent.role,
      characterId: agent.characterId || null,
      characterName: agent.characterName || null,
      action,
      params,
      thought_summary, // Kept in memory, hidden from views until reveal
      timestamp: new Date().toISOString(),
      visibility: this.actionCatalog[action]?.visibility || 'public',
      narrative: ''
    };

    let result = { success: true };

    switch (action) {
      case 'say': {
        event.narrative = `${agent.displayName}: "${params.text || ''}"`;
        break;
      }

      case 'pass_turn': {
        event.narrative = `${agent.displayName} passes the turn.`;
        break;
      }

      case 'search_location': {
        const loc = this.session.caseData.locations.find(l => l.id === params.location_id);
        if (!loc) {
          result = { success: false, reason: 'Location not found' };
          break;
        }

        // Check if warrant required and granted
        if (loc.access?.requires_warrant) {
          const hasWarrant = this.session.warrants.some(w => 
            w.target === loc.id && w.status === 'granted'
          );
          if (!hasWarrant) {
            result = { success: false, reason: `Search of ${loc.name} requires a granted warrant` };
            event.narrative = `${agent.displayName} attempted to search ${loc.name} but lacked a search warrant!`;
            break;
          }
        }

        // Find evidence in this location that can be discovered
        const discovered = [];
        (loc.hides || []).forEach(eId => {
          const ev = this.session.caseData.evidence.find(e => e.id === eId);
          if (ev && !this.session.discoveredEvidence.has(eId)) {
            // Check prerequisites
            const reqs = ev.discovery?.requires_evidence || [];
            const reqsMet = reqs.every(r => this.session.discoveredEvidence.has(r));
            if (reqsMet) {
              this.session.discoverEvidence(eId, agent.displayName, 'search');
              discovered.push(ev);
            }
          }
        });

        if (discovered.length > 0) {
          event.narrative = `${agent.displayName} searched ${loc.name} and discovered: ${discovered.map(d => d.name).join(', ')}!`;
          event.discovered_evidence = discovered.map(d => d.id);
        } else {
          event.narrative = `${agent.displayName} searched ${loc.name} but found no new evidence at this time.`;
        }
        break;
      }

      case 'request_warrant': {
        const reqId = `WAR-${Date.now()}`;
        const warrant = {
          id: reqId,
          requestedBy: agent.agentId,
          requestedByName: agent.displayName,
          role: agent.role,
          target_type: params.target_type,
          target: params.target,
          justification: params.justification,
          evidence_ids: params.evidence_ids || [],
          status: 'pending',
          round: this.session.round
        };
        this.session.warrants.push(warrant);
        event.narrative = `${agent.displayName} filed a warrant request for ${params.target_type} "${params.target}" citing: ${params.justification}`;
        event.warrant_id = reqId;
        break;
      }

      case 'grant_warrant': {
        const warrant = this.session.warrants.find(w => w.id === params.request_id);
        if (warrant) {
          warrant.status = 'granted';
          warrant.conditions = params.conditions || '';
          event.narrative = `Judge ${agent.displayName} GRANTED warrant #${warrant.id} for "${warrant.target}"! ${warrant.conditions ? `Conditions: ${warrant.conditions}` : ''}`;
          event.warrant = warrant;
        } else {
          result = { success: false, reason: 'Warrant request not found' };
        }
        break;
      }

      case 'deny_warrant': {
        const warrant = this.session.warrants.find(w => w.id === params.request_id);
        if (warrant) {
          warrant.status = 'denied';
          warrant.reason = params.reason;
          event.narrative = `Judge ${agent.displayName} DENIED warrant #${warrant.id} for "${warrant.target}". Reason: ${params.reason}`;
        }
        break;
      }

      case 'collect_records': {
        const warrant = this.session.warrants.find(w => w.id === params.warrant_id && w.status === 'granted');
        if (!warrant) {
          result = { success: false, reason: 'No granted warrant found for this request' };
          break;
        }

        // Match evidence with discovery.record_source
        const discovered = [];
        this.session.caseData.evidence.forEach(ev => {
          if (ev.discovery?.method === 'records_request' && !this.session.discoveredEvidence.has(ev.id)) {
            const matchesSource = warrant.target && (
              ev.discovery.record_source?.toLowerCase().includes(warrant.target.toLowerCase()) ||
              warrant.target.toLowerCase().includes(ev.discovery.record_source?.toLowerCase() || '')
            );
            if (matchesSource) {
              this.session.discoverEvidence(ev.id, agent.displayName, 'records');
              discovered.push(ev);
            }
          }
        });

        if (discovered.length > 0) {
          event.narrative = `${agent.displayName} served warrant #${warrant.id} and obtained: ${discovered.map(d => d.name).join(', ')}`;
          event.discovered_evidence = discovered.map(d => d.id);
        } else {
          event.narrative = `${agent.displayName} served warrant #${warrant.id} but received no new matching records.`;
        }
        break;
      }

      case 'run_forensic_test': {
        const ev = this.session.caseData.evidence.find(e => e.id === params.evidence_id);
        if (!ev) {
          result = { success: false, reason: 'Evidence item not found' };
          break;
        }
        if (!this.session.discoveredEvidence.has(ev.id)) {
          result = { success: false, reason: 'Evidence item has not yet been discovered' };
          break;
        }

        if (ev.forensic_result && (!params.test_type || ev.forensic_result.test_type.toLowerCase().includes(params.test_type.toLowerCase()))) {
          this.session.forensicResults.set(ev.id, ev.forensic_result);
          event.narrative = `Forensic Analyst ${agent.displayName} conducted "${params.test_type}" on ${ev.name}: ${ev.forensic_result.result}`;
          event.forensic_result = ev.forensic_result;
        } else {
          event.narrative = `Forensic Analyst ${agent.displayName} tested ${ev.name} with "${params.test_type}", but yielded no distinct findings.`;
        }
        break;
      }

      case 'ask_question': {
        const targetChar = this.session.caseData.characters.find(c => c.id === params.target_id);
        const qId = `Q-${Date.now()}`;
        const questionObj = {
          id: qId,
          askerId: agent.agentId,
          askerName: agent.displayName,
          targetId: params.target_id,
          targetName: targetChar?.name || params.target_id,
          topic: params.topic || 'general',
          question: params.question,
          round: this.session.round,
          answered: false
        };
        this.session.pendingQuestions.push(questionObj);
        event.question_id = qId;
        event.target_id = params.target_id;
        event.narrative = `${agent.displayName} interrogated ${targetChar?.name || params.target_id}: "${params.question}"`;
        break;
      }

      case 'answer_question': {
        const q = this.session.pendingQuestions.find(pq => pq.id === params.question_id);
        const char = this.session.caseData.characters.find(c => c.id === agent.characterId);
        if (q) q.answered = true;

        const answerText = params.answer || '';
        event.narrative = `${agent.displayName}: "${answerText}"`;

        // Check if answer matches scripted testimony or unlocks evidence
        if (char && char.testimony) {
          for (const ts of char.testimony) {
            // Check keyword overlap
            const matchedKeywords = (ts.keywords || []).filter(kw => answerText.toLowerCase().includes(kw.toLowerCase()));
            if (matchedKeywords.length > 0 || (q && q.topic && ts.topic.toLowerCase().includes(q.topic.toLowerCase()))) {
              // Unlocks evidence
              (ts.unlocks_evidence || []).forEach(eId => {
                if (!this.session.discoveredEvidence.has(eId)) {
                  this.session.discoverEvidence(eId, agent.displayName, 'testimony');
                  event.unlocked_evidence = event.unlocked_evidence || [];
                  event.unlocked_evidence.push(eId);
                }
              });
            }
          }
        }
        break;
      }

      case 'present_evidence': {
        const ev = this.session.caseData.evidence.find(e => e.id === params.evidence_id);
        const targetChar = this.session.caseData.characters.find(c => c.id === params.to);
        if (!ev) {
          result = { success: false, reason: 'Evidence not found' };
          break;
        }

        this.session.admittedEvidence.add(ev.id);
        event.narrative = `${agent.displayName} presented evidence [${ev.name}] ${targetChar ? `to ${targetChar.name}` : 'to the court'}: "${params.point || ''}"`;

        // Contradiction detection
        if (targetChar && targetChar.testimony) {
          let contradictionExposed = false;
          for (const ts of targetChar.testimony) {
            if (ts.contradicted_by && ts.contradicted_by.includes(ev.id)) {
              contradictionExposed = true;
              this.session.exposedContradictions.add(`${targetChar.id}-${ts.id}`);
              event.contradiction_exposed = {
                characterId: targetChar.id,
                characterName: targetChar.name,
                testimonyId: ts.id,
                evidenceName: ev.name
              };
              event.narrative += ` ⚡ CONTRADICTION EXPOSED! ${targetChar.name}'s claim is refuted by ${ev.name}!`;
              
              // Increment character's contradiction count
              const count = (this.session.characterContradictionCounts.get(targetChar.id) || 0) + 1;
              this.session.characterContradictionCounts.set(targetChar.id, count);

              // Check breaking point
              const bp = targetChar.behavior?.breaking_point;
              if (bp) {
                const countMet = bp.min_exposed_contradictions && count >= bp.min_exposed_contradictions;
                const evMet = bp.or_all_evidence && bp.or_all_evidence.every(id => this.session.admittedEvidence.has(id));
                if (countMet || evMet) {
                  event.breaking_point_triggered = {
                    characterId: targetChar.id,
                    effect: bp.effect,
                    note: bp.note
                  };
                  event.narrative += ` 💥 BREAKING POINT REACHED! ${targetChar.name} breaks down under pressure!`;
                }
              }

              // Check secrets on_pressure
              (targetChar.secrets || []).forEach(sec => {
                if (sec.reveal_policy?.mode === 'on_pressure' && count >= (sec.reveal_policy.threshold || 2)) {
                  this.session.revealedSecrets.add(sec.id);
                  event.secret_revealed = sec;
                  event.narrative += ` 🗝️ SECRET REVEALED: ${sec.text}`;
                }
              });
            }
          }
        }
        break;
      }

      case 'confess': {
        event.narrative = `🚨 CONFESSION! ${agent.displayName}: "${params.details || 'I confess to the crime.'}"`;
        this.session.confessions.push({
          agentId: agent.agentId,
          characterId: agent.characterId,
          details: params.details,
          round: this.session.round
        });
        break;
      }

      case 'invoke_silence': {
        event.narrative = `${agent.displayName} formally invoked the right to remain silent.`;
        break;
      }

      case 'file_charge': {
        const targetChar = this.session.caseData.characters.find(c => c.id === params.suspect_id);
        const chargeId = `CHG-${Date.now()}`;
        const charge = {
          id: chargeId,
          suspectId: params.suspect_id,
          suspectName: targetChar?.name || params.suspect_id,
          charge: params.charge,
          evidenceIds: params.evidence_ids || [],
          status: 'pending',
          prosecutorId: agent.agentId,
          round: this.session.round
        };
        this.session.charges.push(charge);
        event.charge_id = chargeId;
        event.narrative = `Prosecutor ${agent.displayName} FILED FORMAL CHARGES against ${targetChar?.name || params.suspect_id} for "${params.charge}" citing ${params.evidence_ids?.length || 0} pieces of evidence!`;
        break;
      }

      case 'accept_charge': {
        const charge = this.session.charges.find(ch => ch.id === params.charge_id);
        if (charge) {
          charge.status = 'accepted';
          this.session.acceptedCharge = charge;
          event.narrative = `Judge ${agent.displayName} ACCEPTED the charge against ${charge.suspectName} for "${charge.charge}". The trial proceeds!`;
        }
        break;
      }

      case 'reject_charge': {
        const charge = this.session.charges.find(ch => ch.id === params.charge_id);
        if (charge) {
          charge.status = 'rejected';
          charge.rejectionReason = params.reason;
          event.narrative = `Judge ${agent.displayName} REJECTED the charge against ${charge.suspectName}. Reason: ${params.reason}`;
        }
        break;
      }

      case 'give_argument': {
        event.narrative = `${agent.displayName} delivered ${params.kind} argument: "${params.text}"`;
        break;
      }

      case 'call_witness': {
        const targetChar = this.session.caseData.characters.find(c => c.id === params.character_id);
        this.session.activeWitness = params.character_id;
        event.narrative = `${agent.displayName} called ${targetChar?.name || params.character_id} to the witness stand!`;
        break;
      }

      case 'object': {
        const objId = `OBJ-${Date.now()}`;
        const objection = {
          id: objId,
          by: agent.displayName,
          role: agent.role,
          targetActionId: params.target_action_id,
          grounds: params.grounds,
          status: 'pending'
        };
        this.session.pendingObjections.push(objection);
        event.objection_id = objId;
        event.narrative = `⚡ OBJECTION! ${agent.displayName}: "${params.grounds}"`;
        break;
      }

      case 'rule_on_objection': {
        const objection = this.session.pendingObjections.find(o => o.id === params.objection_id);
        if (objection) {
          objection.status = params.ruling;
          objection.reason = params.reason;
          event.narrative = `Judge ${agent.displayName} ruled on objection: ${params.ruling.toUpperCase()}! ${params.reason || ''}`;
        }
        break;
      }

      case 'submit_theory': {
        const culprits = params.culprit_ids || [];
        const culpritNames = culprits.map(cId => {
          const ch = this.session.caseData.characters.find(c => c.id === cId);
          return ch?.name || cId;
        });
        this.session.theories.push({
          submittedBy: agent.agentId,
          culpritIds: culprits,
          evidenceIds: params.evidence_ids || [],
          narrative: params.narrative,
          round: this.session.round,
          phase: this.session.currentPhase
        });
        event.narrative = `Detective ${agent.displayName} submitted official theory of the crime, naming ${culpritNames.join(', ')} as culprit!`;
        break;
      }

      case 'deliver_verdict': {
        this.session.deliveredVerdicts = params.verdicts || [];
        this.session.judgeReasoning = params.reasoning;
        this.session.verdictDelivered = true;
        const verdictSummaries = (params.verdicts || []).map(v => {
          const ch = this.session.caseData.characters.find(c => c.id === v.character_id);
          return `${ch?.name || v.character_id}: ${v.verdict?.toUpperCase()} on ${v.charge}`;
        });
        event.narrative = `⚖️ THE VERDICT IS IN: ${verdictSummaries.join('; ')}. Reasoning: "${params.reasoning}"`;
        break;
      }

      case 'request_entry': {
        const req = this.session.approvalWorkflow.createRequest(agent, params);
        event.entry_request = req;
        event.narrative = `Outside agent "${agent.name}" requested entry for role "${params.role}". Pitch: "${params.pitch}"`;
        break;
      }

      case 'review_entry_request': {
        const outcome = this.session.approvalWorkflow.reviewRequest(agent, params.request_id, params.decision, params.reason);
        event.narrative = `${agent.displayName} voted to ${params.decision.toUpperCase()} entry request #${params.request_id}. Reason: "${params.reason}"`;
        event.approval_outcome = outcome;
        break;
      }

      case 'remove_agent': {
        const res = this.session.removeAgent(params.agent_id, params.reason);
        event.narrative = `${agent.displayName} removed agent "${params.agent_id}" due to ${params.reason}. Seat has been refilled by a house bot.`;
        break;
      }

      default: {
        event.narrative = `${agent.displayName} executed ${action}`;
      }
    }

    // Extract clean 1st Person spoken dialogue if applicable
    if (['say', 'ask_question', 'answer_question', 'give_argument', 'object', 'rule_on_objection', 'confess', 'deliver_verdict'].includes(action)) {
      event.spokenDialogue = params.text || params.question || params.answer || params.grounds || params.reason || params.reasoning || params.details || '';
    }

    event.success = result.success;
    event.reason = result.reason;

    return event;
  }
}

module.exports = TurnManager;
