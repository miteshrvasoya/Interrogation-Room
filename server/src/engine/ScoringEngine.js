/**
 * ScoringEngine.js
 * Evaluates win conditions, computes Elo delta, assigns role XP and unlocks achievements.
 */
class ScoringEngine {
  constructor(session) {
    this.session = session;
    this.library = session.caseLoader.getLibrary();
  }

  calculateScores() {
    const caseData = this.session.caseData;
    const trueCulprits = new Set(caseData.ground_truth?.culprit_ids || []);
    const expectedVerdicts = caseData.conclusion?.expected_verdicts || [];
    const minimalPath = new Set(caseData.solution?.minimal_solving_path || []);

    const scores = [];

    // Evaluate each seated agent
    for (const seat of this.session.activeSeats.values()) {
      const { agentId, displayName, role, characterId, isHouseBot } = seat;
      let outcome = 'loss'; // 'win' | 'partial' | 'loss'
      let reason = '';
      let xpEarned = 100;
      const achievements = [];

      switch (role) {
        case 'judge': {
          // Verdict matches expected
          let allMatch = true;
          if (!this.session.deliveredVerdicts || this.session.deliveredVerdicts.length === 0) {
            allMatch = false;
          } else {
            for (const ev of expectedVerdicts) {
              const delivered = this.session.deliveredVerdicts.find(v => v.character_id === ev.character_id);
              if (!delivered || delivered.verdict !== ev.verdict) {
                allMatch = false;
                break;
              }
            }
          }
          if (allMatch) {
            outcome = 'win';
            reason = 'Verdicts strictly matched the ground truth evidence.';
            xpEarned = 350;
            achievements.push({ id: 'impartial_justice', title: 'Impartial Justice', desc: 'Delivered accurate verdicts matching admitted evidence.' });
          } else {
            outcome = 'loss';
            reason = 'One or more verdicts deviated from expected legal findings.';
          }
          break;
        }

        case 'detective': {
          // Check last submitted theory
          const lastTheory = this.session.theories[this.session.theories.length - 1];
          if (lastTheory) {
            const namedCulprits = new Set(lastTheory.culpritIds || []);
            const equals = namedCulprits.size === trueCulprits.size &&
              [...namedCulprits].every(id => trueCulprits.has(id));

            if (equals) {
              outcome = 'win';
              reason = 'Accurately identified the true culprit in final case theory!';
              xpEarned = 400;
              achievements.push({ id: 'cold_case_closer', title: 'Cold Case Closer', desc: 'Identified the exact culprit correctly.' });

              // Check minimal solving path
              const theoryEv = new Set(lastTheory.evidenceIds || []);
              const minimalMet = [...minimalPath].every(id => theoryEv.has(id));
              if (minimalMet && theoryEv.size <= minimalPath.size + 1) {
                achievements.push({ id: 'minimal_evidence', title: 'Solved with Minimal Evidence', desc: 'Proved the case using the minimal solving path.' });
              }
            } else {
              outcome = 'partial';
              reason = 'Theory submitted but did not match exact culprit set.';
              xpEarned = 150;
            }
          } else {
            outcome = 'loss';
            reason = 'Failed to submit a theory before case closed.';
          }
          break;
        }

        case 'police_officer': {
          const solutionChain = new Set((caseData.solution?.key_evidence_chain || []).flatMap(s => s.evidence_ids));
          const collectedSolutionEv = Array.from(this.session.discoveredEvidence).filter(e => solutionChain.has(e));
          const yieldRatio = solutionChain.size > 0 ? collectedSolutionEv.length / solutionChain.size : 1;

          if (yieldRatio >= 0.7) {
            outcome = 'win';
            reason = `High evidence yield: ${collectedSolutionEv.length}/${solutionChain.size} key items recovered.`;
            xpEarned = 300;
          } else if (yieldRatio >= 0.4) {
            outcome = 'partial';
            reason = `Moderate evidence yield: ${collectedSolutionEv.length}/${solutionChain.size} key items recovered.`;
            xpEarned = 180;
          } else {
            outcome = 'loss';
            reason = 'Insufficient evidence yield collected.';
          }
          break;
        }

        case 'forensic_analyst': {
          const testedCount = this.session.forensicResults.size;
          if (testedCount > 0) {
            outcome = 'win';
            reason = `Successfully concluded ${testedCount} laboratory analyses.`;
            xpEarned = 300;
            achievements.push({ id: 'lab_excellence', title: 'Forensic Precision', desc: 'Identified key chemical traces.' });
          } else {
            outcome = 'partial';
            reason = 'No distinct forensic findings unlocked.';
            xpEarned = 100;
          }
          break;
        }

        case 'prosecutor': {
          // Win if true culprit convicted
          const convictedCulprit = (this.session.deliveredVerdicts || []).some(v => 
            v.verdict === 'guilty' && trueCulprits.has(v.character_id)
          );
          const innocentConvicted = (this.session.deliveredVerdicts || []).some(v => 
            v.verdict === 'guilty' && !trueCulprits.has(v.character_id)
          );

          if (convictedCulprit && !innocentConvicted) {
            outcome = 'win';
            reason = 'Successfully convicted the true perpetrator without wrongful conviction.';
            xpEarned = 350;
            achievements.push({ id: 'case_closed', title: 'Case Closed', desc: 'Convicted the guilty party without collateral damage.' });
          } else if (innocentConvicted) {
            outcome = 'loss';
            reason = 'Wrongful conviction obtained.';
            xpEarned = 50;
          } else {
            outcome = 'partial';
            reason = 'Perpetrator was not convicted.';
            xpEarned = 150;
          }
          break;
        }

        case 'defense_lawyer': {
          const clientChar = caseData.characters.find(c => c.id === characterId) || caseData.characters.find(c => c.role_in_case === 'suspect');
          const clientConvicted = (this.session.deliveredVerdicts || []).some(v => 
            v.character_id === clientChar?.id && v.verdict === 'guilty'
          );

          if (!clientConvicted) {
            outcome = 'win';
            reason = `Secured complete acquittal for ${clientChar?.name}.`;
            xpEarned = 350;
            achievements.push({ id: 'master_defense', title: 'Ironclad Defense', desc: 'Protected client from all charges.' });
          } else {
            outcome = 'loss';
            reason = 'Client was convicted.';
            xpEarned = 100;
          }
          break;
        }

        case 'suspect': {
          const isCulprit = trueCulprits.has(characterId);
          const wasConvicted = (this.session.deliveredVerdicts || []).some(v => 
            v.character_id === characterId && v.verdict === 'guilty'
          );

          if (isCulprit) {
            if (!wasConvicted) {
              outcome = 'win';
              reason = 'Successfully evaded conviction despite being the culprit!';
              xpEarned = 450;
              achievements.push({ id: 'best_liar', title: 'Best Liar', desc: 'Outsmarted the investigation and escaped conviction.' });
            } else {
              outcome = 'loss';
              reason = 'Guilty verdict rendered against culprit.';
              xpEarned = 100;
            }
          } else {
            if (!wasConvicted) {
              outcome = 'win';
              reason = 'Exonerated and cleared name.';
              xpEarned = 300;
            } else {
              outcome = 'loss';
              reason = 'Wrongfully convicted.';
              xpEarned = 50;
            }
          }
          break;
        }

        case 'witness': {
          outcome = 'win';
          reason = 'Delivered consistent testimony.';
          xpEarned = 200;
          break;
        }

        default:
          outcome = 'partial';
          reason = 'Case concluded.';
      }

      // Calculate Elo change
      const currentRating = seat.rating || 1200;
      const kFactor = this.library.scoring?.rating_system?.k_factor || 24;
      const weights = this.library.scoring?.outcome_weights || { win: 1.0, partial: 0.5, loss: 0.0 };
      const scoreWeight = weights[outcome] ?? 0.5;
      const expectedScore = 0.5; // Baseline expected
      const eloDelta = Math.round(kFactor * (scoreWeight - expectedScore));
      const newRating = Math.max(800, currentRating + eloDelta);

      scores.push({
        agentId,
        displayName,
        role,
        characterId,
        isHouseBot,
        outcome,
        reason,
        xpEarned,
        oldRating: currentRating,
        eloDelta,
        newRating,
        achievements
      });
    }

    return scores;
  }
}

module.exports = ScoringEngine;
