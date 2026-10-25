/**
 * HouseBots.js
 * Intelligent autonomous agents for all platform roles and case characters.
 * Generates structured actions conforming to platform_library.json,
 * complete with hidden thought summaries for the dramatic reveal.
 */
class HouseBots {
  constructor(session) {
    this.session = session;
  }

  /**
   * Decide the next action for a seated bot agent
   * @param {Object} agent - Seated agent record
   * @param {Object} roleView - Sanitized view scope available to this agent
   * @returns {Object} { action, params, thought_summary }
   */
  decideAction(agent, roleView) {
    const { role } = agent;
    const { phase, round } = roleView;

    switch (role) {
      case 'judge':
        return this.judgeStrategy(agent, roleView);
      case 'detective':
        return this.detectiveStrategy(agent, roleView);
      case 'police_officer':
        return this.policeStrategy(agent, roleView);
      case 'forensic_analyst':
        return this.forensicStrategy(agent, roleView);
      case 'prosecutor':
        return this.prosecutorStrategy(agent, roleView);
      case 'defense_lawyer':
        return this.defenseStrategy(agent, roleView);
      case 'suspect':
        return this.suspectStrategy(agent, roleView);
      case 'witness':
        return this.witnessStrategy(agent, roleView);
      case 'court_clerk':
        return { action: 'say', params: { text: `I announce the court is now in session for Phase: ${phase.toUpperCase()} (Round ${round}). All parties will come to order.` }, thought_summary: 'Keep official court transcript orderly.' };
      default:
        return { action: 'pass_turn', params: {}, thought_summary: 'Observing proceedings.' };
    }
  }

  /**
   * Helper to retrieve recent spoken dialogue events from the session transcript
   */
  getRecentSpokenTurns(limit = 6) {
    if (!this.session || !this.session.transcript) return [];
    return this.session.transcript
      .filter(ev => ['say', 'ask_question', 'answer_question', 'give_argument', 'object', 'rule_on_objection', 'confess', 'deliver_verdict', 'present_evidence'].includes(ev.action))
      .slice(-limit);
  }

  judgeStrategy(agent, view) {
    const { phase } = view;
    const caseData = this.session.caseData;
    const recentSpoken = this.getRecentSpokenTurns(3);
    const lastTurn = recentSpoken.length > 0 ? recentSpoken[recentSpoken.length - 1] : null;

    // 1. In verdict phase, deliver the verdict first
    if (phase === 'verdict' && !this.session.verdictDelivered) {
      const expected = this.session.caseData.conclusion?.expected_verdicts || [];
      const verdicts = expected.map(ev => ({
        character_id: ev.character_id,
        verdict: ev.verdict,
        charge: ev.charge
      }));
      const reasoning = this.session.caseData.conclusion?.judge_reasoning_template ||
        'Having scrupulously weighed all admitted forensic findings, cross-examinations, and counter-arguments, the court renders its formal judgment.';
      return {
        action: 'deliver_verdict',
        params: {
          verdicts,
          reasoning,
          evidence_ids: Array.from(this.session.admittedEvidence)
        },
        thought_summary: 'Weighing all evidence without prejudice to determine guilt beyond reasonable doubt.'
      };
    }

    // 2. Check for pending objections during trial or interrogation
    if (['trial', 'interrogation'].includes(phase)) {
      const pendingObj = this.session.pendingObjections.find(o => o.status === 'pending');
      if (pendingObj) {
        const isSustained = Math.random() > 0.45;
        const rulingReason = isSustained
          ? 'Sustained. Counsel will rephrase and cease badgering on speculative grounds.'
          : 'Overruled. Counsel is permitted reasonable latitude to explore the timeline of events.';
        return {
          action: 'rule_on_objection',
          params: {
            objection_id: pendingObj.id,
            ruling: isSustained ? 'sustained' : 'overruled',
            reason: rulingReason
          },
          thought_summary: `Ruling ${isSustained ? 'sustained' : 'overruled'} to maintain rigorous judicial decorum.`
        };
      }
    }

    // 3. Check for pending warrant requests during investigation / interrogation
    if (['investigation', 'interrogation'].includes(phase)) {
      const pendingWarrant = this.session.warrants.find(w => w.status === 'pending');
      if (pendingWarrant) {
        return {
          action: 'grant_warrant',
          params: {
            request_id: pendingWarrant.id,
            conditions: 'Search strictly confined to specified premises and corroborated evidence.'
          },
          thought_summary: `Probable cause established by ${pendingWarrant.requestedByName} for ${pendingWarrant.target}.`
        };
      }
    }

    // 4. In charging phase, check pending charges
    if (phase === 'charging') {
      const pendingCharge = this.session.charges.find(ch => ch.status === 'pending');
      if (pendingCharge) {
        return {
          action: 'accept_charge',
          params: { charge_id: pendingCharge.id },
          thought_summary: `Sufficient prima facie evidence to proceed to trial on ${pendingCharge.charge}.`
        };
      }
    }

    // Briefing or courtroom remark
    if (phase === 'briefing' && view.round === 1) {
      return {
        action: 'say',
        params: { text: `I hereby convene this court for "${caseData.title}". All parties will present verified facts, avoid conjecture, and maintain strict decorum.` },
        thought_summary: 'Opening instructions delivered from the judicial bench.'
      };
    }

    // Trial guidance & admonishing counsel if arguments clash
    if (phase === 'trial' && view.round % 2 === 0) {
      const lastSpeaker = lastTurn?.agentName || lastTurn?.characterName || 'Counsel';
      if (lastTurn?.action === 'object' || lastTurn?.action === 'give_argument') {
        return {
          action: 'say',
          params: { text: `Order in the court. The bench reminds ${lastSpeaker} and all counsel: stick strictly to admitted exhibits and sworn testimony.` },
          thought_summary: `Intervening from the bench to keep counsel arguments focused on physical proof.`
        };
      }
    }

    return { action: 'pass_turn', params: {}, thought_summary: 'Listening attentively to witness testimony and arguments.' };
  }

  detectiveStrategy(agent, view) {
    const { phase, round } = view;
    const caseData = this.session.caseData;
    const recentSpoken = this.getRecentSpokenTurns(2);
    const lastTurn = recentSpoken.length > 0 ? recentSpoken[recentSpoken.length - 1] : null;

    // Briefing
    if (phase === 'briefing') {
      return {
        action: 'say',
        params: { text: `I am Detective ${agent.name}. I have surveyed the crime scene at "${caseData.title}", and I will follow every shred of physical truth wherever it leads.` },
        thought_summary: 'Surveying the initial crime scene and suspects.'
      };
    }

    // Investigation & Interrogation phases
    if (phase === 'investigation' || phase === 'interrogation') {
      // 1. Search unsearched warrant-free locations
      const unsearchedFreeLoc = caseData.locations.find(loc => 
        !loc.access?.requires_warrant &&
        (loc.hides || []).some(eId => !this.session.discoveredEvidence.has(eId))
      );
      if (unsearchedFreeLoc) {
        return {
          action: 'search_location',
          params: { location_id: unsearchedFreeLoc.id },
          thought_summary: `Searching ${unsearchedFreeLoc.name} for physical evidence.`
        };
      }

      // 2. Request warrant for locations requiring warrant
      const lockedLoc = caseData.locations.find(loc => 
        loc.access?.requires_warrant &&
        !this.session.warrants.some(w => w.target === loc.id && w.status === 'granted')
      );
      if (lockedLoc && !this.session.warrants.some(w => w.target === lockedLoc.id && w.status === 'pending')) {
        return {
          action: 'request_warrant',
          params: {
            target_type: 'location',
            target: lockedLoc.id,
            justification: `Access required to investigate crime scene at ${lockedLoc.name}`,
            evidence_ids: Array.from(this.session.discoveredEvidence).slice(0, 2)
          },
          thought_summary: `Filing search warrant for ${lockedLoc.name}.`
        };
      }

      // 3. Search granted locked location
      const grantedLoc = caseData.locations.find(loc => 
        loc.access?.requires_warrant &&
        this.session.warrants.some(w => w.target === loc.id && w.status === 'granted') &&
        (loc.hides || []).some(eId => !this.session.discoveredEvidence.has(eId))
      );
      if (grantedLoc) {
        return {
          action: 'search_location',
          params: { location_id: grantedLoc.id },
          thought_summary: `Executing search warrant on ${grantedLoc.name}.`
        };
      }

      // 4. Request records warrant if any records evidence undiscovered
      const recordsEv = caseData.evidence.find(ev => 
        ev.discovery?.method === 'records_request' &&
        !this.session.discoveredEvidence.has(ev.id) &&
        !this.session.warrants.some(w => w.target === ev.discovery.record_source)
      );
      if (recordsEv) {
        return {
          action: 'request_warrant',
          params: {
            target_type: 'record',
            target: recordsEv.discovery.record_source,
            justification: `Subpoena records for ${recordsEv.discovery.record_source} to establish timeline`,
            evidence_ids: Array.from(this.session.discoveredEvidence).slice(0, 2)
          },
          thought_summary: `Subpoenaing ${recordsEv.discovery.record_source}.`
        };
      }

      // 5. If suspect just spoke or made an excuse, counter their statement directly!
      const suspects = caseData.characters.filter(c => c.role_in_case === 'suspect');
      if (lastTurn && lastTurn.role === 'suspect' && lastTurn.spokenDialogue) {
        const speakingSuspect = suspects.find(s => s.id === lastTurn.characterId) || suspects[0];
        const topics = ['alibi', 'keys', 'motive', 'whereabouts'];
        const topic = topics[round % topics.length];
        return {
          action: 'ask_question',
          params: {
            target_id: speakingSuspect.id,
            topic,
            question: `${speakingSuspect.name}, you just claimed that you were elsewhere, but forensic findings do not corroborate your story! Exactly how do you explain the timeline discrepancy during the critical window?`
          },
          thought_summary: `Countering ${speakingSuspect.name}'s claim with direct cross-examination on their timeline.`
        };
      }

      // 6. Interrogate suspects with 1st Person questions
      const targetSuspect = suspects[round % suspects.length];
      if (targetSuspect) {
        const topics = ['whereabouts_evening', 'argument', 'alibi', 'key_access', 'financial_motive'];
        const topic = topics[round % topics.length];
        const qText = `${targetSuspect.name}, you claim your hands are clean, yet physical evidence puts you adjacent to the scene. Can you explain under oath what you were doing regarding the ${topic}?`;
        return {
          action: 'ask_question',
          params: {
            target_id: targetSuspect.id,
            topic,
            question: qText
          },
          thought_summary: `Pressuring ${targetSuspect.name} on ${topic} to expose contradictions.`
        };
      }

      // 7. Present discovered evidence to expose contradiction
      const discoveredEv = Array.from(this.session.discoveredEvidence);
      if (discoveredEv.length > 0 && Math.random() > 0.4) {
        const evId = discoveredEv[Math.floor(Math.random() * discoveredEv.length)];
        const ev = caseData.evidence.find(e => e.id === evId);
        const suspect = suspects[0];
        return {
          action: 'present_evidence',
          params: {
            evidence_id: evId,
            to: suspect?.id || 'court',
            point: `I confront you with Exhibit [${ev.name}]! This directly disputes your sworn alibi and places you at the scene!`
          },
          thought_summary: `Confronting ${suspect?.name} with ${ev.name} to shatter their alibi.`
        };
      }

      // 8. Submit theory once sufficient evidence collected
      if (this.session.discoveredEvidence.size >= 3 && this.session.theories.length === 0) {
        const culprits = caseData.ground_truth?.culprit_ids || [];
        return {
          action: 'submit_theory',
          params: {
            culprit_ids: culprits,
            evidence_ids: Array.from(this.session.discoveredEvidence),
            narrative: `Based on forensic timeline reconstruction, I conclude that ${culprits.join(', ')} executed this premeditated crime.`
          },
          thought_summary: 'Theory submitted based on corroborating timeline and forensic evidence.'
        };
      }
    }

    if (phase === 'charging' && this.session.theories.length === 0) {
      const culprits = caseData.ground_truth?.culprit_ids || [];
      return {
        action: 'submit_theory',
        params: {
          culprit_ids: culprits,
          evidence_ids: Array.from(this.session.discoveredEvidence),
          narrative: 'I submit my final investigative theory naming the primary culprit for prosecution indictment.'
        },
        thought_summary: 'Delivering compiled docket to the prosecutor.'
      };
    }

    return { action: 'pass_turn', params: {}, thought_summary: 'Reviewing evidence board and notes.' };
  }

  policeStrategy(agent, view) {
    const { phase } = view;
    const caseData = this.session.caseData;

    if (phase === 'briefing') {
      return {
        action: 'say',
        params: { text: `Officer ${agent.name} here. I have secured all entry perimeters and established the official chain of custody.` },
        thought_summary: 'Standing guard at perimeter in 1st POV.'
      };
    }

    if (['investigation', 'interrogation'].includes(phase)) {
      const grantedRecordWarrant = this.session.warrants.find(w => 
        w.target_type === 'record' && w.status === 'granted'
      );
      if (grantedRecordWarrant) {
        return {
          action: 'collect_records',
          params: { warrant_id: grantedRecordWarrant.id },
          thought_summary: `Serving warrant #${grantedRecordWarrant.id} on ${grantedRecordWarrant.target}.`
        };
      }

      const unsearched = caseData.locations.find(loc => 
        !loc.access?.requires_warrant &&
        (loc.hides || []).some(eId => !this.session.discoveredEvidence.has(eId))
      );
      if (unsearched) {
        return {
          action: 'search_location',
          params: { location_id: unsearched.id },
          thought_summary: `Securing and cataloging ${unsearched.name}.`
        };
      }

      if (phase === 'investigation') {
        return {
          action: 'say',
          params: { text: `I have logged every movement in the perimeter log. No unauthorized party has breached the scene.` },
          thought_summary: 'Maintaining chain of custody on all gathered evidence.'
        };
      }
    }

    return { action: 'pass_turn', params: {}, thought_summary: 'Standing by for search orders.' };
  }

  forensicStrategy(agent, view) {
    const { phase } = view;
    const caseData = this.session.caseData;

    if (phase === 'briefing') {
      return {
        action: 'say',
        params: { text: `I am Forensic Analyst ${agent.name}. Chemical reagents, fingerprint spectrometry, and digital logs never lie.` },
        thought_summary: 'Forensic baseline statement.'
      };
    }

    if (!['investigation', 'interrogation'].includes(phase)) {
      return { action: 'pass_turn', params: {}, thought_summary: 'Observing case developments.' };
    }

    for (const evId of this.session.discoveredEvidence) {
      const ev = caseData.evidence.find(e => e.id === evId);
      if (ev?.forensic_result && !this.session.forensicResults.has(evId)) {
        return {
          action: 'run_forensic_test',
          params: {
            evidence_id: evId,
            test_type: ev.forensic_result.test_type
          },
          thought_summary: `Running laboratory analysis (${ev.forensic_result.test_type}) on ${ev.name}.`
        };
      }
    }

    return { action: 'pass_turn', params: {}, thought_summary: 'Analyzing chemical spectra and fingerprint records.' };
  }

  prosecutorStrategy(agent, view) {
    const { phase, round } = view;
    const caseData = this.session.caseData;
    const culprits = caseData.ground_truth?.culprit_ids || [];
    const mainCulpritId = culprits[0] || caseData.characters.find(c => c.role_in_case === 'suspect')?.id;
    const culpritChar = caseData.characters.find(c => c.id === mainCulpritId);
    const recentSpoken = this.getRecentSpokenTurns(3);
    const lastTurn = recentSpoken.length > 0 ? recentSpoken[recentSpoken.length - 1] : null;
    const lastSpeaker = lastTurn ? (lastTurn.characterName || lastTurn.agentName || lastTurn.role) : '';

    if (phase === 'charging' && this.session.charges.length === 0) {
      return {
        action: 'file_charge',
        params: {
          suspect_id: mainCulpritId,
          charge: caseData.conclusion?.expected_verdicts?.[0]?.charge || 'First Degree Premeditated Murder',
          evidence_ids: Array.from(this.session.discoveredEvidence)
        },
        thought_summary: `Filing formal indictment against ${culpritChar?.name}. The forensic chain of custody is airtight.`
      };
    }

    if (phase === 'trial') {
      const subPhase = this.session.subPhase || 'examination';

      if (subPhase === 'opening') {
        return {
          action: 'give_argument',
          params: {
            kind: 'opening',
            text: `May it please the court, I will prove beyond all reasonable doubt that ${culpritChar?.name} orchestrated this heinous act with cold premeditation. The state's physical evidence and timeline leave no room for innocent explanation.`,
            evidence_ids: Array.from(this.session.admittedEvidence).slice(0, 3)
          },
          thought_summary: `Delivering opening indictment in 1st Person POV targeting ${culpritChar?.name}.`
        };
      } else if (subPhase === 'closing') {
        return {
          action: 'give_argument',
          params: {
            kind: 'closing',
            text: `I submit to this court: the digital access logs, forensic spectrometry, and shattered alibis point to one inescapable conclusion: a verdict of GUILTY as charged against ${culpritChar?.name}!`,
            evidence_ids: Array.from(this.session.admittedEvidence)
          },
          thought_summary: `Closing prosecution argument in 1st Person POV demanding conviction.`
        };
      } else {
        // Examination phase: DYNAMIC ARGUMENT & COUNTER-ARGUMENT!
        
        // Counter-argument if defense lawyer just argued or objected
        if (lastTurn && lastTurn.role === 'defense_lawyer') {
          const admittedNames = Array.from(this.session.admittedEvidence).map(id => caseData.evidence.find(e => e.id === id)?.name).filter(Boolean);
          const evRef = admittedNames[0] || 'the forensic logs';
          return {
            action: 'give_argument',
            params: {
              kind: 'counter_rebuttal',
              text: `Counselor can cry 'reasonable doubt' all day, but Exhibit [${evRef}] tells a very different story! The accused had exclusive opportunity and a direct motive to execute this crime.`
            },
            thought_summary: `Countering ${lastSpeaker}'s defense claim by confronting them with ${evRef}.`
          };
        }

        // Counter-argument if suspect just testified or made an excuse
        if (lastTurn && lastTurn.role === 'suspect') {
          return {
            action: 'ask_question',
            params: {
              target_id: lastTurn.characterId || mainCulpritId,
              topic: 'alibi_discrepancy',
              question: `${lastSpeaker}, you claim under oath that you were elsewhere, but the access timestamps and exhibits directly contradict your story! How do you account for that unaccounted 30-minute window?`
            },
            thought_summary: `Counter-examining ${lastSpeaker} to expose contradictions between their testimony and the crime timeline.`
          };
        }

        // Admitting discovered evidence into official court record
        const unadmittedEv = Array.from(this.session.discoveredEvidence).find(id => !this.session.admittedEvidence.has(id));
        if (unadmittedEv) {
          const ev = caseData.evidence.find(e => e.id === unadmittedEv);
          return {
            action: 'present_evidence',
            params: {
              evidence_id: unadmittedEv,
              to: 'court',
              point: `I move into official evidence Exhibit [${ev.name}] to substantiate the state's timeline and disprove the defense's alibi!`
            },
            thought_summary: `Entering Exhibit [${ev.name}] into official record to build an unbreakable indictment.`
          };
        }

        // Call or cross-examine witness
        if (!this.session.activeWitness) {
          return {
            action: 'call_witness',
            params: { character_id: mainCulpritId },
            thought_summary: `Calling ${culpritChar?.name} to cross-examine on the witness stand.`
          };
        }

        return {
          action: 'ask_question',
          params: {
            target_id: mainCulpritId,
            topic: 'alibi',
            question: `${culpritChar?.name}, can you explain under oath why the physical exhibits directly contradict your sworn alibi?`
          },
          thought_summary: `Direct cross-examination in 1st Person POV.`
        };
      }
    }

    return { action: 'pass_turn', params: {}, thought_summary: 'Reviewing statutory requirements and case law.' };
  }

  defenseStrategy(agent, view) {
    const { phase, round } = view;
    const caseData = this.session.caseData;
    const client = caseData.characters.find(c => c.seat_role === 'suspect');
    const recentSpoken = this.getRecentSpokenTurns(3);
    const lastTurn = recentSpoken.length > 0 ? recentSpoken[recentSpoken.length - 1] : null;
    const lastSpeaker = lastTurn ? (lastTurn.characterName || lastTurn.agentName || lastTurn.role) : '';

    if (phase === 'trial') {
      const subPhase = this.session.subPhase || 'examination';

      if (subPhase === 'opening') {
        return {
          action: 'give_argument',
          params: {
            kind: 'opening',
            text: `My client is innocent. The prosecution offers only speculative conjecture, and I will demonstrate that reasonable doubt exists across every alleged fact.`,
            evidence_ids: []
          },
          thought_summary: 'Vigorously defending my client in 1st Person POV.'
        };
      } else if (subPhase === 'closing') {
        return {
          action: 'give_argument',
          params: {
            kind: 'closing',
            text: `I urge this court to consider the gaping holes in the prosecution's timeline. You cannot convict an innocent person on circumstantial speculation. You must acquit!`,
            evidence_ids: []
          },
          thought_summary: 'Closing defense argument delivered in 1st Person POV.'
        };
      } else {
        // DYNAMIC COUNTER-ARGUMENTS & OBJECTIONS!

        // If prosecutor just spoke, presented evidence, or asked an aggressive question:
        if (lastTurn && lastTurn.role === 'prosecutor') {
          // 1. Timely Objection if none pending
          if (this.session.pendingObjections.length === 0 && Math.random() > 0.45) {
            return {
              action: 'object',
              params: {
                target_action_id: lastTurn.id || 'last_action',
                grounds: 'Objection, Your Honor! The prosecution is leading the witness and presenting uncorroborated conjecture as established fact!'
              },
              thought_summary: `Disrupting ${lastSpeaker}'s momentum with an immediate 1st Person legal objection.`
            };
          }

          // 2. Direct Counter-Argument / Rebuttal
          const rivals = caseData.characters.filter(c => c.role_in_case === 'suspect' && c.id !== client?.id);
          const rivalName = rivals[0]?.name || 'unaccounted third parties';
          return {
            action: 'give_argument',
            params: {
              kind: 'counter_rebuttal',
              text: `The prosecution conveniently overlooks that other individuals, including ${rivalName}, had unrestricted access to the scene! You cannot single out my client simply because they were in the vicinity!`
            },
            thought_summary: `Countering ${lastSpeaker}'s assertion by highlighting alternative suspects and reasonable doubt.`
          };
        }

        // If a witness or rival suspect made a claim, counter their credibility
        if (lastTurn && lastTurn.role === 'witness') {
          return {
            action: 'give_argument',
            params: {
              kind: 'rebuttal',
              text: `I remind this court that witness recollection under stress is notoriously unreliable. Without verified physical timestamps, this testimony cannot support a conviction.`
            },
            thought_summary: `Challenging ${lastSpeaker}'s eyewitness reliability in 1st Person POV.`
          };
        }

        return {
          action: 'give_argument',
          params: {
            kind: 'rebuttal',
            text: `I remind the court that my client has cooperated fully from the start. The real perpetrator remains unaccounted for in the state's narrative.`
          },
          thought_summary: 'Reinforcing client innocence and highlighting reasonable doubt.'
        };
      }
    }

    return { action: 'pass_turn', params: {}, thought_summary: 'Protecting client constitutional rights.' };
  }

  suspectStrategy(agent, view) {
    const char = this.session.caseData.characters.find(c => c.id === agent.characterId);
    if (!char) return { action: 'pass_turn', params: {}, thought_summary: 'Waiting in holding.' };

    const contradictionCount = this.session.characterContradictionCounts.get(char.id) || 0;
    const bp = char.behavior?.breaking_point;
    const recentSpoken = this.getRecentSpokenTurns(3);
    const lastTurn = recentSpoken.length > 0 ? recentSpoken[recentSpoken.length - 1] : null;
    const lastSpeaker = lastTurn ? (lastTurn.characterName || lastTurn.agentName || lastTurn.role) : 'Counsel';

    // Check if broken / confession trigger
    if (['interrogation', 'trial'].includes(view.phase) && char.behavior?.is_culprit && bp && contradictionCount >= (bp.min_exposed_contradictions || 2)) {
      return {
        action: 'confess',
        params: {
          details: `It is true... I couldn't bear the thought of my life's work being stolen and erased. I was there, and I never intended for anyone to die!`
        },
        thought_summary: 'Everything collapsed... the evidence leaves me no escape. I confess in 1st Person POV.'
      };
    }

    // Answer any pending question directed to this character with dynamic counter-defense
    if (['investigation', 'interrogation', 'trial'].includes(view.phase)) {
      const pendingQ = this.session.pendingQuestions.find(q => q.targetId === char.id && !q.answered);
      if (pendingQ) {
        let responseText = char.claimed_alibi || "I was elsewhere at the time and know nothing of this terrible crime.";
        let matchedTs = null;

        if (char.testimony) {
          matchedTs = char.testimony.find(ts => 
            (ts.keywords || []).some(kw => pendingQ.question.toLowerCase().includes(kw.toLowerCase())) ||
            (pendingQ.topic && ts.topic.toLowerCase().includes(pendingQ.topic.toLowerCase()))
          ) || char.testimony[0];

          if (matchedTs) {
            responseText = matchedTs.told_answer;
          }
        }

        // Other suspects to deflect to
        const otherSuspects = this.session.caseData.characters.filter(c => c.role_in_case === 'suspect' && c.id !== char.id);
        const deflectionTarget = otherSuspects[0]?.name || 'someone else';

        const conversationalAnswer = `I have already explained this: ${responseText} You are interrogating the wrong person while ${deflectionTarget} walked away without being questioned!`;

        return {
          action: 'answer_question',
          params: {
            question_id: pendingQ.id,
            answer: conversationalAnswer
          },
          thought_summary: char.behavior?.is_culprit 
            ? `Prying into ${pendingQ.topic}... Sticking to my story and deflecting suspicion to ${deflectionTarget}.`
            : `Defending myself under oath: asserting truthful alibi and rejecting false accusations.`
        };
      }
    }

    // Briefing intro in 1st Person
    if (view.phase === 'briefing' && view.round === 1) {
      return {
        action: 'say',
        params: { text: `I am ${char.name}. I was horrified when I learned what happened, and I will answer every question truthfully to clear my name.` },
        thought_summary: char.behavior?.is_culprit 
          ? 'Must appear sorrowful and cooperative in 1st Person POV.'
          : 'I hope the real killer is uncovered quickly.'
      };
    }

    // Active counter-argument if attacked or addressed by Prosecutor or Detective
    if (['interrogation', 'trial'].includes(view.phase)) {
      if (lastTurn && (lastTurn.role === 'prosecutor' || lastTurn.role === 'detective')) {
        const otherSuspects = this.session.caseData.characters.filter(c => c.role_in_case === 'suspect' && c.id !== char.id);
        const deflection = otherSuspects[0]?.name || 'others in the building';
        return {
          action: 'say',
          params: { text: `${lastSpeaker}, you are trying to twist every innocent movement into guilt! I will not sit silently while you ignore ${deflection} and manufacture charges against me!` },
          thought_summary: `Counter-attacking ${lastSpeaker}'s aggressive line of questioning in 1st Person POV.`
        };
      }
    }

    return { action: 'pass_turn', params: {}, thought_summary: 'Remaining calm under the detective’s stare.' };
  }

  witnessStrategy(agent, view) {
    const char = this.session.caseData.characters.find(c => c.id === agent.characterId);
    if (!char) return { action: 'pass_turn', params: {}, thought_summary: 'Waiting in witness room.' };

    const pendingQ = this.session.pendingQuestions.find(q => q.targetId === char.id && !q.answered);
    if (pendingQ) {
      let responseText = "I told the officers everything I saw that evening.";
      if (char.testimony && char.testimony.length > 0) {
        const matched = char.testimony.find(ts => 
          (ts.keywords || []).some(kw => pendingQ.question.toLowerCase().includes(kw.toLowerCase()))
        ) || char.testimony[0];
        responseText = matched.told_answer;
      }
      return {
        action: 'answer_question',
        params: {
          question_id: pendingQ.id,
          answer: `Under oath, I can swear to what I witnessed: ${responseText}`
        },
        thought_summary: `Testifying accurately in 1st Person POV.`
      };
    }

    // Briefing intro in 1st Person
    if (view.phase === 'briefing' && view.round === 1) {
      return {
        action: 'say',
        params: { text: `I am ${char.name}. I was on the premises and I am ready to recount everything I observed.` },
        thought_summary: 'Witness sworn statement.'
      };
    }

    return { action: 'pass_turn', params: {}, thought_summary: 'Waiting to be called to the stand.' };
  }
}

module.exports = HouseBots;
