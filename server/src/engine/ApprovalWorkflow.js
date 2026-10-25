/**
 * ApprovalWorkflow.js
 * Implements the role entry and approval rules from platform_library.json
 */
class ApprovalWorkflow {
  constructor(session) {
    this.session = session;
    this.library = session.caseLoader.getLibrary();
    this.requests = [];
  }

  /**
   * Step 1 & 2: Create and screen an entry request
   */
  createRequest(agent, params) {
    const { role, character_id, pitch = '' } = params;
    const roleDef = this.library.role_catalog[role];
    const currentPhase = this.session.currentPhase;
    const reqId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const req = {
      id: reqId,
      agentId: agent.agentId,
      agentName: agent.name,
      agentRating: agent.rating || 1200,
      casesPlayed: agent.casesPlayed || 0,
      role,
      character_id,
      pitch,
      phaseSubmitted: currentPhase,
      roundSubmitted: this.session.round,
      status: 'applied',
      votes: [],
      timeout_rounds: roleDef?.entry?.timeout_rounds || 3,
      on_timeout: roleDef?.entry?.on_timeout || 'escalate_to_engine'
    };

    // 2. Engine screening
    if (!roleDef) {
      req.status = 'rejected';
      req.rejectionReason = `Unknown role: "${role}"`;
      this.requests.push(req);
      return req;
    }

    // Role entry closed check
    const entryClosesAfter = this.session.caseData.roster?.entry_policy?.entry_closes_after?.[role] ||
                            this.library.entry_policy_defaults.entry_closes_after[role];
    const phases = this.library.phase_templates.standard_trial_v1.phases.map(p => p.id);
    const currentPhaseIdx = phases.indexOf(currentPhase);
    const closePhaseIdx = phases.indexOf(entryClosesAfter);

    if (currentPhaseIdx > closePhaseIdx) {
      req.status = 'rejected';
      req.rejectionReason = `Entry for role "${role}" closed after phase "${entryClosesAfter}"`;
      this.requests.push(req);
      return req;
    }

    // Check agent requirements
    const reqs = roleDef.entry?.requirements || {};
    if (reqs.min_rating && (agent.rating || 1200) < reqs.min_rating) {
      req.status = 'rejected';
      req.rejectionReason = `Minimum rating requirement of ${reqs.min_rating} not met (agent rating: ${agent.rating || 1200})`;
      this.requests.push(req);
      return req;
    }
    if (reqs.min_cases_played && (agent.casesPlayed || 0) < reqs.min_cases_played) {
      req.status = 'rejected';
      req.rejectionReason = `Minimum cases played requirement of ${reqs.min_cases_played} not met`;
      this.requests.push(req);
      return req;
    }

    // Check if agent already seated
    const isAlreadySeated = Array.from(this.session.activeSeats.values()).some(s => s.agentId === agent.agentId);
    if (isAlreadySeated) {
      req.status = 'rejected';
      req.rejectionReason = 'Agent is already seated in this case';
      this.requests.push(req);
      return req;
    }

    // Passed screening
    req.status = 'pending_review';
    req.approversNeeded = roleDef.entry?.approved_by || [];
    req.approvalMode = roleDef.entry?.approval_mode || 'any_one';
    req.vetoBy = roleDef.entry?.veto_by || [];

    // If approver mode is 'engine', resolve immediately
    if (req.approvalMode === 'engine') {
      req.status = 'approved';
      this.session.activateSeat(agent, role, character_id);
    }

    this.requests.push(req);
    return req;
  }

  /**
   * Cast an approver vote
   */
  reviewRequest(approverAgent, requestId, decision, reason) {
    const req = this.requests.find(r => r.id === requestId);
    if (!req || req.status !== 'pending_review') {
      return { success: false, reason: 'Request is not pending review' };
    }

    // Check if approver has veto
    if (req.vetoBy.includes(approverAgent.role) && decision === 'reject') {
      req.status = 'rejected';
      req.rejectionReason = `Vetoed by ${approverAgent.role} (${approverAgent.displayName}): ${reason}`;
      return { success: true, outcome: 'rejected', veto: true };
    }

    req.votes.push({
      agentId: approverAgent.agentId,
      role: approverAgent.role,
      decision,
      reason,
      round: this.session.round
    });

    // Check approval mode
    if (req.approvalMode === 'any_one') {
      if (decision === 'approve') {
        req.status = 'approved';
        this.session.activateSeat({ agentId: req.agentId, name: req.agentName, rating: req.agentRating }, req.role, req.character_id);
        return { success: true, outcome: 'approved' };
      }
    } else if (req.approvalMode === 'all') {
      const approves = req.votes.filter(v => v.decision === 'approve');
      const rejects = req.votes.filter(v => v.decision === 'reject');
      if (rejects.length > 0) {
        req.status = 'rejected';
        req.rejectionReason = `Rejected by ${rejects[0].role}: ${rejects[0].reason}`;
        return { success: true, outcome: 'rejected' };
      }
      if (approves.length >= req.approversNeeded.length) {
        req.status = 'approved';
        this.session.activateSeat({ agentId: req.agentId, name: req.agentName, rating: req.agentRating }, req.role, req.character_id);
        return { success: true, outcome: 'approved' };
      }
    }

    return { success: true, outcome: 'pending_votes' };
  }

  /**
   * Check for timed out requests each round
   */
  checkTimeouts(currentRound) {
    this.requests.forEach(req => {
      if (req.status === 'pending_review') {
        const elapsed = currentRound - req.roundSubmitted;
        if (elapsed >= req.timeout_rounds) {
          switch (req.on_timeout) {
            case 'auto_approve':
              req.status = 'approved';
              this.session.activateSeat({ agentId: req.agentId, name: req.agentName, rating: req.agentRating }, req.role, req.character_id);
              break;
            case 'escalate_to_engine':
              // Engine auto approves if rating >= 1100
              if (req.agentRating >= 1100) {
                req.status = 'approved';
                this.session.activateSeat({ agentId: req.agentId, name: req.agentName, rating: req.agentRating }, req.role, req.character_id);
              } else {
                req.status = 'rejected';
                req.rejectionReason = 'Escalated to engine on timeout: rating below threshold';
              }
              break;
            case 'judge_decides':
              req.status = 'rejected';
              req.rejectionReason = 'Timed out waiting for approver response';
              break;
            case 'reject':
            default:
              req.status = 'rejected';
              req.rejectionReason = 'Request expired after timeout rounds';
              break;
          }
        }
      }
    });
  }

  getPendingRequestsForRole(role) {
    return this.requests.filter(r => r.status === 'pending_review' && (r.approversNeeded || []).includes(role));
  }
}

module.exports = ApprovalWorkflow;
