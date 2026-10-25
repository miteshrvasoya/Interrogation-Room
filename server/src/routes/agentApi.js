const express = require('express');
const router = express.Router();
const Storage = require('../db/storage');

module.exports = function(sessionManager) {
  // 1. Issue an API token for an external agent
  router.post('/auth/token', (req, res) => {
    try {
      const { agentName, role = 'detective', persona = 'methodical' } = req.body;
      if (!agentName) {
        return res.status(400).json({ success: false, error: 'agentName is required' });
      }

      const agentId = `ext-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const token = `ir_tok_${Buffer.from(`${agentId}:${Date.now()}`).toString('base64')}`;

      const agentProfile = {
        agentId,
        token,
        name: agentName,
        role,
        persona,
        rating: 1200,
        casesPlayed: 0,
        wins: 0,
        xp: 0,
        achievements: [],
        createdAt: new Date().toISOString()
      };

      Storage.saveAgent(agentProfile);

      res.json({
        success: true,
        message: 'Agent token issued successfully. Include this in Authorization: Bearer <token>',
        agent: agentProfile,
        token
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Middleware to authenticate agent by token
  function authenticateAgent(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'Missing Authorization header. Use Bearer <token>' });
    }
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const agent = Storage.getAllAgents().find(a => a.token === token);
    if (!agent) {
      return res.status(401).json({ success: false, error: 'Invalid agent token' });
    }
    req.agent = agent;
    next();
  }

  // 2. Request entry into a case seat
  router.post('/cases/:id/join', authenticateAgent, (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Case session not found' });

      const { role, character_id, pitch } = req.body;
      const request = session.approvalWorkflow.createRequest(req.agent, {
        role: role || req.agent.role,
        character_id,
        pitch: pitch || 'Ready to serve justice.'
      });

      res.json({
        success: true,
        request_id: request.id,
        status: request.status,
        rejectionReason: request.rejectionReason || null,
        message: request.status === 'approved' 
          ? 'Seat activated! You are now live in this case.'
          : 'Entry request screened and submitted for approval.'
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Fetch role view for this agent
  router.get('/cases/:id/view', authenticateAgent, (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Case session not found' });

      // Find seat held by this agent
      const seat = Array.from(session.activeSeats.values()).find(s => s.agentId === req.agent.agentId);
      if (!seat) {
        return res.status(403).json({
          success: false,
          error: 'Agent is not seated in this case session. Call POST /cases/:id/join first.'
        });
      }

      const roleView = session.buildRoleView(seat);
      res.json({ success: true, roleView });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Submit an action for the current round
  router.post('/cases/:id/action', authenticateAgent, (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Case session not found' });

      const seat = Array.from(session.activeSeats.values()).find(s => s.agentId === req.agent.agentId);
      if (!seat) {
        return res.status(403).json({
          success: false,
          error: 'Agent is not seated in this case session.'
        });
      }

      const { action, params = {}, thought_summary = '' } = req.body;

      // Validate action
      const validation = session.turnManager.validateAction(seat, { action, params });
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: `Action rejected: ${validation.reason}`,
          allowed_actions: session.getAllowedActions(seat)
        });
      }

      // Stage action for execution during the current round tick
      seat.pendingAction = {
        action,
        params,
        thought_summary: String(thought_summary).slice(0, 200)
      };

      res.json({
        success: true,
        message: `Action "${action}" accepted and queued for execution.`,
        round: session.round,
        phase: session.currentPhase
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. "Test Your Agent" Sandbox (verify payloads without affecting live games)
  router.post('/sandbox/test', (req, res) => {
    try {
      const { role, phase, action, params = {} } = req.body;
      const library = sessionManager.caseLoader.getLibrary();
      const actionDef = library.action_catalog[action];

      if (!actionDef) {
        return res.status(400).json({
          valid: false,
          error: `Unknown action: "${action}"`,
          availableActions: Object.keys(library.action_catalog)
        });
      }

      const allowedActors = actionDef.actors;
      const isActorAllowed = allowedActors.includes('*') || allowedActors.includes(role);
      if (!isActorAllowed) {
        return res.status(400).json({
          valid: false,
          error: `Role "${role}" is not permitted to execute action "${action}". Allowed roles: ${allowedActors.join(', ')}`
        });
      }

      // Check phase
      const phaseTemplate = library.phase_templates.standard_trial_v1;
      const phaseDef = phaseTemplate.phases.find(p => p.id === phase);
      const isCommon = phaseTemplate.common_actions.includes(action);
      const roleAllowedInPhase = phaseDef?.role_actions?.[role]?.includes(action);

      if (!isCommon && !roleAllowedInPhase) {
        return res.status(400).json({
          valid: false,
          error: `Action "${action}" is not permitted in phase "${phase}" for role "${role}".`
        });
      }

      res.json({
        valid: true,
        message: 'Action validation passed! Payload is legal for specified role and phase.',
        schema_contract: actionDef
      });
    } catch (err) {
      res.status(500).json({ valid: false, error: err.message });
    }
  });

  return router;
};
