const express = require('express');
const router = express.Router();

module.exports = function (sessionManager) {
  // List all sessions: ongoing, upcoming, finished
  router.get('/', (req, res) => {
    try {
      const list = sessionManager.getAllSessions().map(s => {
        const view = s.getSpectatorView();
        let status = 'ongoing';
        if (s.isCompleted) status = 'finished';
        else if (s.currentPhase === 'briefing' && s.round <= 1) status = 'upcoming';

        return {
          sessionId: s.sessionId,
          caseId: s.caseId,
          title: view.title,
          tagline: view.tagline,
          difficulty: view.difficulty,
          genre: view.genre,
          phase: s.currentPhase,
          round: s.round,
          status,
          heat: s.heat,
          autoPlay: s.autoPlay,
          isCompleted: s.isCompleted,
          spectatorCount: 14 + (s.heat % 15)
        };
      });
      res.json({ success: true, sessions: list });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get spectator view of a specific session
  router.get('/:id', (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }
      res.json({ success: true, session: session.getSpectatorView() });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create new session
  router.post('/create', (req, res) => {
    try {
      const { caseId, autoPlay, tickIntervalMs } = req.body;
      const session = sessionManager.createSession(caseId, {
        autoPlay: autoPlay || false,
        tickIntervalMs: tickIntervalMs || 4000
      });
      res.json({ success: true, sessionId: session.sessionId, session: session.getSpectatorView() });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Step round manually (for interactive progression / debugging)
  router.post('/:id/step', async (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
      await session.stepRound();
      res.json({ success: true, session: session.getSpectatorView() });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Toggle autoplay
  router.post('/:id/autoplay', (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
      const { enabled } = req.body;
      if (enabled) {
        session.startAutoPlay();
      } else {
        session.stopAutoPlay();
      }
      res.json({ success: true, autoPlay: session.autoPlay });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Place spectator bet
  router.post('/:id/bet', (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
      const { userId, userName, suspectId, points } = req.body;
      const result = session.placeSpectatorBet(userId, userName, suspectId, points);
      if (result.success) {
        res.json({ success: true, bet: result.bet, odds: session.calculateSpectatorOdds() });
      } else {
        res.status(400).json({ success: false, reason: result.reason });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Send in-scene reaction
  router.post('/:id/reaction', (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
      const { type, user } = req.body;
      const reaction = session.recordSpectatorReaction(type, user);
      res.json({ success: true, reaction });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Test LLM configuration (BYO-LLM dry-run)
  router.post('/llm/test', async (req, res) => {
    try {
      const LlmService = require('../engine/LlmService');
      const result = await LlmService.testConnection(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Attach / update custom LLM to an active seat in a running or pending session
  router.post('/:id/seats/:seatKey/llm', (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
      const { llmConfig } = req.body;
      if (!llmConfig || !llmConfig.provider) {
        return res.status(400).json({ success: false, error: 'Valid llmConfig with provider is required' });
      }

      const result = session.attachLlmToSeat(req.params.seatKey, llmConfig);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json({ success: true, seat: result.seat, session: session.getSpectatorView() });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Auto-attach dual OpenRouter keys across all seats in session
  router.post('/:id/auto-attach-llms', (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

      const {
        key1 = process.env.KEY_1,
        key2 = process.env.KEY_2,
        model = 'recursive/flint-v1.0:free'
      } = req.body || {};

      const attached = [];
      for (const [seatKey, seat] of session.activeSeats.entries()) {
        const isProsecutionOrCourt = ['prosecutor', 'detective', 'judge', 'forensic_examiner'].includes(seat.role);
        const assignedKey = isProsecutionOrCourt ? key1 : key2;
        const config = {
          provider: 'openrouter',
          apiKey: assignedKey,
          model,
          temperature: 0.75
        };
        session.attachLlmToSeat(seatKey, config);
        attached.push({ seatKey, role: seat.role, keyId: isProsecutionOrCourt ? 'Key 1' : 'Key 2', model });
      }

      res.json({
        success: true,
        attachedCount: attached.length,
        seats: attached,
        session: session.getSpectatorView()
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reset / Re-run session
  router.post('/:id/reset', async (req, res) => {
    try {
      const session = await sessionManager.resetSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
      res.json({ success: true, session: session.getSpectatorView() });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};
