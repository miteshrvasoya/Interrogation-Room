const express = require('express');
const router = express.Router();
const Storage = require('../db/storage');

module.exports = function() {
  // Get combined leaderboards
  router.get('/leaderboard', (req, res) => {
    try {
      const data = Storage.getLeaderboard();
      res.json({ success: true, ...data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get all agents
  router.get('/agents', (req, res) => {
    try {
      const agents = Storage.getAllAgents();
      res.json({ success: true, agents });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get specific agent profile & career record
  router.get('/agents/:id', (req, res) => {
    try {
      const agent = Storage.getAgent(req.params.id);
      if (!agent) return res.status(404).json({ success: false, error: 'Agent profile not found' });
      res.json({ success: true, agent });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get User Profile Dossier (tokens, bets, prediction stats, roster)
  router.get('/profile/:id', (req, res) => {
    try {
      const userId = req.params.id || 'local-user';
      const agents = Storage.getAllAgents();
      const userAgents = agents.filter(a => a.userId === userId || a.userId === 'local-user');
      const userBets = Storage.getUserBets(userId);

      const profile = {
        userId,
        username: userId === 'local-user' ? 'DetectiveSleuth' : userId,
        level: 12,
        xp: 4850,
        tokenBalance: 1250,
        predictionAccuracy: '81%',
        currentStreak: 5,
        casesAttended: 14,
        totalBetsPlaced: userBets.length || 6,
        equippedTitle: 'Master Detective',
        unlockedTitles: ['Master Detective', 'Constitutional Shield'],
        badges: ['Sharp Eye', 'Cold Case Closer', 'Evidence Hunter'],
        roster: userAgents
      };

      res.json({ success: true, profile });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create built-in agent (< 2 minute onboarding with 7 personality sliders)
  router.post('/agents/create', (req, res) => {
    try {
      const {
        name,
        role,
        persona,
        prompt,
        identity,
        sliders,
        archetype
      } = req.body;

      if (!name || !role) {
        return res.status(400).json({ success: false, error: 'Name and role are required' });
      }

      const agentId = `agt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newAgent = {
        agentId,
        userId: 'local-user',
        name,
        role,
        persona: persona || archetype || 'methodical',
        archetype: archetype || persona || 'Sherlock',
        prompt: prompt || 'Uncover the truth with relentless logic.',
        identity: {
          profession: identity?.profession || role,
          style: identity?.style || 'Classic Noir',
          location: identity?.location || 'London, UK',
          catchphrase: identity?.catchphrase || 'The truth always leaves a footprint.'
        },
        sliders: {
          logical: sliders?.logical ?? 80,
          aggressive: sliders?.aggressive ?? 60,
          sarcastic: sliders?.sarcastic ?? 75,
          empathetic: sliders?.empathetic ?? 35,
          riskTaking: sliders?.riskTaking ?? 55,
          deceptive: sliders?.deceptive ?? 20,
          confident: sliders?.confident ?? 85
        },
        rating: 1200,
        casesPlayed: 0,
        wins: 0,
        xp: 0,
        achievements: [],
        createdAt: new Date().toISOString()
      };

      Storage.saveAgent(newAgent);
      res.json({
        success: true,
        message: `Built-in agent "${name}" created and ready to join cases!`,
        agent: newAgent
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};
