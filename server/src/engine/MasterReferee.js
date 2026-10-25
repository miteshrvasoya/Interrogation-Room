/**
 * MasterReferee.js
 * Independent internal evaluation engine that observes all legal game events,
 * maintains dynamic real-time agent scores across 12 dimensions, detects contradictions
 * with confidence levels, and computes the end-of-case forensic report and fun statistics.
 */

class MasterReferee {
  constructor(session) {
    this.session = session;
    this.caseData = session.caseData;
    this.groundTruth = this.caseData.ground_truth || {};
    this.solution = this.caseData.solution || {};
    this.trueCulprits = new Set(this.groundTruth.culprit_ids || []);
    this.keyEvidenceChain = new Set((this.solution.key_evidence_chain || []).flatMap(s => s.evidence_ids || []));
    this.minimalPath = new Set(this.solution.minimal_solving_path || []);

    // Running agent scores: agentId -> { score: number, breakdown: [], rank: number }
    this.agentScores = new Map();
    // Recorded contradictions with confidence
    this.contradictions = [];
    // Live referee observations feed
    this.observations = [];
  }

  /**
   * Initializes or gets the score tracker for an agent
   */
  getOrCreateScore(agent) {
    if (!this.agentScores.has(agent.agentId)) {
      this.agentScores.set(agent.agentId, {
        agentId: agent.agentId,
        displayName: agent.displayName || agent.name,
        role: agent.role,
        characterId: agent.characterId || null,
        isHouseBot: !!agent.isHouseBot,
        score: 50, // Starting baseline score
        breakdown: [
          { metric: 'Baseline Entrance', delta: +50, reason: 'Assumed sworn role in docket', round: 0 }
        ]
      });
    }
    return this.agentScores.get(agent.agentId);
  }

  /**
   * Evaluates an executed action in real time and adjusts the agent's live score
   */
  evaluateEvent(agent, event) {
    const tracker = this.getOrCreateScore(agent);
    const { action, params = {} } = event;
    const deltas = [];

    switch (action) {
      case 'search_location': {
        if (event.discovered_evidence) {
          const isKey = this.keyEvidenceChain.has(event.discovered_evidence.id);
          if (isKey) {
            deltas.push({ metric: 'Key Clue Recovered', delta: +25, reason: `Discovered critical case evidence: ${event.discovered_evidence.name}` });
          } else {
            deltas.push({ metric: 'Evidence Yield', delta: +15, reason: `Recovered physical item: ${event.discovered_evidence.name}` });
          }
        }
        break;
      }

      case 'run_forensic_test': {
        deltas.push({ metric: 'Forensic Precision', delta: +20, reason: `Concluded lab analysis on ${params.evidence_id}` });
        break;
      }

      case 'collect_records': {
        deltas.push({ metric: 'Factual Diligence', delta: +12, reason: `Secured administrative logs from ${params.record_source}` });
        break;
      }

      case 'ask_question': {
        // Evaluating question quality
        const targetChar = this.caseData.characters.find(c => c.id === params.target_character_id);
        if (targetChar) {
          const isCulprit = this.trueCulprits.has(targetChar.id);
          if (isCulprit) {
            deltas.push({ metric: 'Targeted Interrogation', delta: +14, reason: `Focused questioning on primary suspect ${targetChar.name}` });
          } else {
            deltas.push({ metric: 'Inquiry Depth', delta: +8, reason: `Interrogated witness ${targetChar.name}` });
          }
        }
        break;
      }

      case 'present_evidence': {
        deltas.push({ metric: 'Evidence Presentation', delta: +15, reason: `Introduced evidence ${params.evidence_id} on record` });

        // Check if contradiction was exposed
        if (event.contradiction_exposed) {
          const evItem = this.caseData.evidence.find(e => e.id === params.evidence_id);
          const confidence = Math.round((evItem?.reliability || 0.95) * 100);
          deltas.push({
            metric: 'Contradiction Exposed',
            delta: +30,
            reason: `Exposed direct factual discrepancy with ${confidence}% confidence!`
          });

          this.contradictions.push({
            id: `CON-${Date.now()}`,
            agentId: agent.agentId,
            agentName: agent.displayName,
            characterName: event.contradiction_exposed.characterName,
            evidenceName: event.contradiction_exposed.evidenceName,
            confidence,
            round: event.round,
            timestamp: new Date().toISOString()
          });

          this.observations.push({
            type: 'contradiction',
            text: `MASTER REFEREE: Contradiction verified! ${agent.displayName} refuted ${event.contradiction_exposed.characterName} using ${event.contradiction_exposed.evidenceName} (Confidence: ${confidence}%).`,
            round: event.round
          });
        }
        break;
      }

      case 'object': {
        deltas.push({ metric: 'Courtroom Objection', delta: +5, reason: `Raised procedural objection: ${params.grounds}` });
        break;
      }

      case 'rule_on_objection': {
        deltas.push({ metric: 'Judicial Ruling', delta: +12, reason: `Ruled on objection: ${params.ruling?.toUpperCase()}` });
        break;
      }

      case 'submit_theory': {
        const namedCulprits = new Set(params.culprit_ids || []);
        const matches = namedCulprits.size === this.trueCulprits.size &&
          [...namedCulprits].every(id => this.trueCulprits.has(id));

        if (matches) {
          deltas.push({ metric: 'Master Deduction', delta: +45, reason: 'Case theory named exact true culprits!' });
          this.observations.push({
            type: 'deduction',
            text: `MASTER REFEREE: Correct culpability chain established by ${agent.displayName}!`,
            round: event.round
          });
        } else {
          deltas.push({ metric: 'Flawed Theory', delta: -18, reason: 'Theory deviates from true perpetrator identity' });
        }
        break;
      }

      case 'file_charge': {
        const isTargetCulprit = this.trueCulprits.has(params.suspect_id);
        if (isTargetCulprit) {
          deltas.push({ metric: 'Justified Indictment', delta: +35, reason: `Formally indicted genuine perpetrator` });
        } else {
          deltas.push({ metric: 'False Accusation', delta: -25, reason: `Indicted innocent character without sufficient corroboration` });
        }
        break;
      }

      case 'accept_charge': {
        const charge = this.session.charges.find(ch => ch.id === params.charge_id);
        if (charge && this.trueCulprits.has(charge.suspectId)) {
          deltas.push({ metric: 'Accurate Probable Cause', delta: +25, reason: 'Accepted legitimate charge against culprit' });
        } else {
          deltas.push({ metric: 'Judicial Oversight', delta: -20, reason: 'Accepted uncorroborated charge' });
        }
        break;
      }

      case 'deliver_verdict': {
        const isGuilty = params.verdict === 'guilty';
        const isCulprit = this.trueCulprits.has(params.defendant_id);
        if ((isGuilty && isCulprit) || (!isGuilty && !isCulprit)) {
          deltas.push({ metric: 'Impartial Truth Reached', delta: +50, reason: 'Rendered correct verdict aligning with objective truth' });
        } else {
          deltas.push({ metric: 'Miscarriage of Justice', delta: -50, reason: 'Verdict deviated from immutable facts' });
        }
        break;
      }

      case 'confess': {
        if (this.trueCulprits.has(agent.characterId)) {
          deltas.push({ metric: 'Truthful Confession', delta: +25, reason: 'Admitted guilt under investigative pressure' });
        }
        break;
      }

      case 'answer_question': {
        if (params.honesty === 'lie') {
          deltas.push({ metric: 'Deceptive Alibi', delta: +10, reason: 'Attempted deflection of culpability' });
        } else {
          deltas.push({ metric: 'Cooperative Statement', delta: +8, reason: 'Provided factual testimony' });
        }
        break;
      }
    }

    // Apply score deltas
    deltas.forEach(d => {
      tracker.score = Math.max(0, tracker.score + d.delta);
      tracker.breakdown.push({
        metric: d.metric,
        delta: d.delta,
        reason: d.reason,
        round: event.round,
        timestamp: new Date().toISOString()
      });
    });

    // Update ranks across all agents
    this.updateRankings();

    return {
      agentId: agent.agentId,
      currentScore: tracker.score,
      deltas,
      latestObservations: this.observations.slice(-3)
    };
  }

  updateRankings() {
    const list = Array.from(this.agentScores.values()).sort((a, b) => b.score - a.score);
    list.forEach((item, idx) => {
      item.rank = idx + 1;
    });
  }

  /**
   * Returns current live scores snapshot for HUD and spectator view
   */
  getLiveScoresSnapshot() {
    this.updateRankings();
    return Array.from(this.agentScores.values()).map(s => ({
      agentId: s.agentId,
      displayName: s.displayName,
      role: s.role,
      characterId: s.characterId,
      isHouseBot: s.isHouseBot,
      score: s.score,
      rank: s.rank,
      breakdown: s.breakdown.slice(-5) // Last 5 meaningful score adjustments
    }));
  }

  /**
   * Generates End-of-Case Report with fun/ridiculous statistics (Sections 52 & 53)
   */
  generateEndCaseReport() {
    this.updateRankings();
    const scores = Array.from(this.agentScores.values());
    const bestAgent = scores[0] || null;

    // Find best argument
    const argumentEvents = this.session.transcript.filter(e => e.action === 'give_argument' || e.action === 'file_charge');
    const bestArgument = argumentEvents.length > 0 ? {
      agentName: argumentEvents[0].agentName,
      text: argumentEvents[0].params?.text || argumentEvents[0].params?.rationale || 'Decisive closing presentation',
      phase: argumentEvents[0].phase
    } : null;

    // Most important clue
    const keyEvId = Array.from(this.minimalPath)[0] || Array.from(this.keyEvidenceChain)[0];
    const keyEv = this.caseData.evidence.find(e => e.id === keyEvId);

    // Biggest mistake (largest negative delta)
    let biggestMistake = null;
    let worstDelta = 0;
    scores.forEach(s => {
      s.breakdown.forEach(b => {
        if (b.delta < worstDelta) {
          worstDelta = b.delta;
          biggestMistake = {
            agentName: s.displayName,
            mistake: b.reason,
            penalty: b.delta,
            metric: b.metric
          };
        }
      });
    });

    // Spectator prediction accuracy
    const totalBets = this.session.spectatorBets.length;
    const winningBets = this.session.spectatorBets.filter(b => b.won).length;
    const audienceAccuracy = totalBets > 0 ? Math.round((winningBets / totalBets) * 100) : 75;

    // Ridiculous & Fun Statistics (Section 53)
    const objections = this.session.transcript.filter(e => e.action === 'object');
    const mostDramaticObjection = objections.length > 0 ? {
      by: objections[0].agentName,
      grounds: objections[0].params?.grounds || 'Relevance and speculation!'
    } : { by: 'Court Clerk', grounds: 'Procedural discipline' };

    const passes = this.session.transcript.filter(e => e.action === 'pass_turn');
    const mostSuspiciousPause = passes.length > 0 ? {
      by: passes[0].agentName,
      round: passes[0].round,
      note: 'Long hesitation before answering questions'
    } : { by: 'Lead Suspect', round: 2, note: 'Sweating profusely on the stand' };

    return {
      caseId: this.session.caseId,
      title: this.caseData.title,
      culprits: Array.from(this.trueCulprits),
      bestAgent: bestAgent ? { name: bestAgent.displayName, role: bestAgent.role, score: bestAgent.score } : null,
      bestArgument,
      mostImportantClue: keyEv ? { id: keyEv.id, name: keyEv.name, significance: keyEv.significance || keyEv.description } : null,
      biggestMistake: biggestMistake || { agentName: 'Prosecution', mistake: 'Overlooked early alibi details', penalty: -15, metric: 'Inquiry Depth' },
      audienceAccuracy: `${audienceAccuracy}%`,
      totalViewers: 1200 + (this.session.heat * 14),
      contradictionsCount: this.contradictions.length,
      funStats: {
        mostDramaticObjection,
        mostSuspiciousPause,
        mostConfidentWrongAccusation: {
          by: scores.find(s => s.role === 'detective' || s.role === 'prosecutor')?.displayName || 'Inspector Vance',
          quote: 'The timeline points inexorably towards the butler!'
        },
        biggestComeback: {
          agent: scores[1]?.displayName || scores[0]?.displayName || 'Defense Counsel',
          recoveryPoints: '+35 in Trial Closing'
        },
        mostChaoticAgent: {
          agent: scores[scores.length - 1]?.displayName || 'Wildcard AI',
          trait: 'Volatile questioning and spontaneous objections'
        }
      }
    };
  }

  /**
   * Builds chapterized timeline for deterministic replay (Section 22)
   */
  getReplayChapters() {
    const chapters = [];
    let currentPhase = null;

    this.session.transcript.forEach((evt, idx) => {
      if (evt.phase !== currentPhase) {
        currentPhase = evt.phase;
        chapters.push({
          chapterIndex: chapters.length + 1,
          phase: currentPhase,
          title: currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1),
          eventIndex: idx,
          round: evt.round,
          timestamp: evt.timestamp,
          keyAction: evt.action,
          narrativePreview: evt.narrative?.slice(0, 80) || ''
        });
      } else if (evt.contradiction_exposed || evt.action === 'deliver_verdict' || evt.action === 'confess') {
        chapters.push({
          chapterIndex: chapters.length + 1,
          phase: currentPhase,
          title: evt.contradiction_exposed ? 'Contradiction Exposed' : (evt.action === 'confess' ? 'Confession' : 'Verdict'),
          eventIndex: idx,
          round: evt.round,
          timestamp: evt.timestamp,
          keyAction: evt.action,
          narrativePreview: evt.narrative?.slice(0, 80) || ''
        });
      }
    });

    return chapters;
  }
}

module.exports = MasterReferee;
