const express = require('express');
const router = express.Router();
const Storage = require('../db/storage');

module.exports = function(sessionManager, io) {
  /**
   * GET /api/lobby/cases
   * Anyone can browse pending case lobbies without logging in.
   */
  router.get('/cases', (req, res) => {
    try {
      const lobbies = sessionManager.getAllSessions()
        .filter(s => s.lifecycleStatus === 'pending' || s.lifecycleStatus === 'ready')
        .map(s => s.getLobbyState());

      res.json({
        success: true,
        count: lobbies.length,
        lobbies
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/lobby/cases/:id
   * Get specific lobby details, seat map, safe dossiers and ready-check status.
   */
  router.get('/cases/:id', (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ success: false, error: `Case session "${req.params.id}" not found` });
      }

      res.json({
        success: true,
        lobby: session.getLobbyState()
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/lobby/quick-join
   * Finds the best-fit pending case (closest to full but has open seats) and recommends a seat.
   */
  router.get('/quick-join', (req, res) => {
    try {
      const lobbies = sessionManager.getAllSessions()
        .filter(s => s.lifecycleStatus === 'pending')
        .map(s => s.getLobbyState());

      if (lobbies.length === 0) {
        return res.status(404).json({ success: false, error: 'No open lobbies found for quick join' });
      }

      // Sort by fill percentage descending (closest to launch)
      lobbies.sort((a, b) => b.stats.fillPercentage - a.stats.fillPercentage);

      // Find first lobby with an open required or optional seat
      for (const lobby of lobbies) {
        const openSeat = lobby.seats.find(s => s.status === 'open' && s.required) ||
                         lobby.seats.find(s => s.status === 'open');
        if (openSeat) {
          return res.json({
            success: true,
            sessionId: lobby.sessionId,
            caseId: lobby.caseId,
            title: lobby.title,
            recommendedSeat: openSeat
          });
        }
      }

      res.status(404).json({ success: false, error: 'All lobbies are currently full' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/lobby/cases/:id/seats/:seatKey/claim
   * Claim a seat with an agent (built-in or external).
   */
  router.post('/cases/:id/seats/:seatKey/claim', (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

      const { agent, user } = req.body;
      if (!agent || !user) {
        return res.status(400).json({ success: false, error: 'Agent info and User info are required to take a seat' });
      }

      const result = session.claimSeat(req.params.seatKey, agent, user);
      if (!result.success) {
        return res.status(400).json(result);
      }

      // Award XP for claiming seat
      if (agent.agentId && !agent.agentId.startsWith('bot-')) {
        Storage.updateAgentRating(agent.agentId, 5, 50);
      }

      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/lobby/cases/:id/seats/:seatKey/release
   * Release a claimed seat.
   */
  router.post('/cases/:id/seats/:seatKey/release', (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

      const { userId } = req.body;
      const result = session.releaseSeat(req.params.seatKey, userId);
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/lobby/cases/:id/seats/:seatKey/approve
   * Approver confirms a pending seat claim.
   */
  router.post('/cases/:id/seats/:seatKey/approve', (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

      const { userId } = req.body;
      const result = session.approveSeat(req.params.seatKey, userId);
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/lobby/cases/:id/ready-confirm
   * Participant confirms readiness during ready-check.
   */
  router.post('/cases/:id/ready-confirm', (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

      const { seatKey, userId, agentId } = req.body;
      const result = session.confirmReady(seatKey, userId);
      if (!result.success) {
        return res.status(400).json(result);
      }

      if (agentId) {
        Storage.updateAgentRating(agentId, 10, 150);
      }

      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/lobby/cases/:id/fill-bots
   * Fill remaining open seats with House Bots (for lobby expiry or force start).
   */
  router.post('/cases/:id/fill-bots', (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

      const result = session.fillWithBotsAndStart();
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/lobby/cases/:id/late-join
   * Late entry into a live case for house-bot occupied roles.
   */
  router.post('/cases/:id/late-join', (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

      const { seatKey, agent, user } = req.body;
      const result = session.lateJoinSeat(seatKey, agent, user);
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/lobby/cases/:id/rejoin
   * Reclaim a seat from house bot surrogate after disconnect.
   */
  router.post('/cases/:id/rejoin', (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

      const { seatKey, userId } = req.body;
      const result = session.rejoinSeat(seatKey, userId);
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};
