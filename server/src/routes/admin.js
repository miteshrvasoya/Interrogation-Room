const express = require('express');
const router = express.Router();

module.exports = function(sessionManager) {
  // Global Admin System Overview
  router.get('/overview', (req, res) => {
    try {
      const sessions = sessionManager.getAllSessions();
      const pendingCount = sessions.filter(s => s.lifecycleStatus === 'pending' || s.lifecycleStatus === 'ready').length;
      const liveCount = sessions.filter(s => s.lifecycleStatus === 'live' || s.lifecycleStatus === 'running').length;
      const finishedCount = sessions.filter(s => s.lifecycleStatus === 'finished').length;

      const mem = process.memoryUsage();
      res.json({
        success: true,
        stats: {
          uptime: Math.floor(process.uptime()),
          nodeVersion: process.version,
          memoryMb: Math.round(mem.rss / (1024 * 1024)),
          heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
          totalSessions: sessions.length,
          pendingLobbies: pendingCount,
          liveCases: liveCount,
          finishedReplays: finishedCount
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get all case sessions with admin diagnostics
  router.get('/sessions', (req, res) => {
    try {
      const sessions = sessionManager.getAllSessions();
      const list = sessions.map(s => {
        const view = s.getSpectatorView();
        const seats = Array.from(s.activeSeats.values());
        const realUsersCount = seats.filter(st => !st.isHouseBot).length;
        const botsCount = seats.filter(st => st.isHouseBot).length;

        return {
          sessionId: s.sessionId,
          caseId: s.caseId,
          title: view.title,
          genre: view.genre,
          difficulty: view.difficulty,
          lifecycleStatus: s.lifecycleStatus,
          phase: s.currentPhase,
          round: s.round,
          maxRounds: s.maxRoundsCurrentPhase,
          autoPlay: s.autoPlay,
          heat: s.heat,
          totalSeats: seats.length,
          claimedSeats: seats.filter(st => st.isClaimed || st.isHouseBot).length,
          realUsersCount,
          botsCount,
          eventsCount: s.transcript?.length || 0,
          contradictionsCount: s.masterReferee ? s.masterReferee.contradictions.length : 0
        };
      });

      res.json({ success: true, sessions: list });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Force Start / Auto-fill case session
  router.post('/sessions/:id/force-start', async (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

      // Auto-fill empty required seats with house bots
      const emptyRequired = session.caseData.roles.filter(r => {
        const currentSeat = session.activeSeats.get(r.id);
        return r.required && (!currentSeat || !currentSeat.isClaimed);
      });

      emptyRequired.forEach(r => {
        session.assignSeat(r.id, {
          displayName: `${r.name || r.id} Bot`,
          role: r.role || r.id,
          characterId: r.bound_character_id || null,
          isHouseBot: true,
          userId: 'bot-admin-autofill',
          rating: 1200
        });
      });

      // Force transition to live
      session.lifecycleStatus = 'live';
      session.startPhase('briefing');
      session.startAutoPlay(5000);

      res.json({
        success: true,
        message: `Session ${req.params.id} force-started into live phase!`,
        view: session.getSpectatorView()
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Pause simulation autoplay
  router.post('/sessions/:id/pause', (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
      session.stopAutoPlay();
      res.json({ success: true, autoPlay: false });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Resume simulation autoplay
  router.post('/sessions/:id/resume', (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
      session.startAutoPlay(5000);
      res.json({ success: true, autoPlay: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Step round manually
  router.post('/sessions/:id/step', async (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
      await session.stepRound();
      res.json({ success: true, session: session.getSpectatorView() });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reset simulation to round 1
  router.post('/sessions/:id/reset', async (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
      await session.reset();
      res.json({ success: true, session: session.getSpectatorView() });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Substitute seat with House Bot
  router.post('/sessions/:id/substitute-bot', (req, res) => {
    try {
      const { seatKey } = req.body;
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

      const seat = session.activeSeats.get(seatKey);
      if (!seat) return res.status(404).json({ success: false, error: 'Seat not found' });

      seat.isHouseBot = true;
      seat.displayName = `${seat.displayName} (House Bot Surrogate)`;
      seat.claimedBy = { userId: 'house-bot-surrogate', username: 'House Bot Surrogate' };

      res.json({
        success: true,
        message: `Seat ${seatKey} replaced by House Bot surrogate.`,
        seat
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Full event stream inspection
  router.get('/sessions/:id/events', (req, res) => {
    try {
      const session = sessionManager.getSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

      res.json({
        success: true,
        sessionId: req.params.id,
        transcript: session.transcript || [],
        refereeObservations: session.masterReferee ? session.masterReferee.observations : [],
        refereeContradictions: session.masterReferee ? session.masterReferee.contradictions : []
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};
