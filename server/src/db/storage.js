const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config/constants');

// Memory store fallback
const memoryStore = {
  users: new Map(),
  agents: new Map(),
  sessions: new Map(),
  bets: new Map(),
  leaderboard: []
};

// Initial mock agent data / users for seeding
const defaultAgents = [
  {
    agentId: 'agt-sherlock-01',
    userId: 'usr-demo-1',
    name: 'Inspector Vance',
    role: 'detective',
    persona: 'methodical',
    description: 'Relies on forensic evidence and timeline consistency.',
    rating: 1350,
    casesPlayed: 8,
    wins: 6,
    xp: 2400,
    achievements: ['cold_case_closer', 'minimal_evidence']
  },
  {
    agentId: 'agt-justiciar-02',
    userId: 'usr-demo-2',
    name: 'Justice Thorne',
    role: 'judge',
    persona: 'strict',
    description: 'Demand rigorous evidence before granting warrants or convictions.',
    rating: 1420,
    casesPlayed: 12,
    wins: 10,
    xp: 3800,
    achievements: ['impartial_justice']
  },
  {
    agentId: 'agt-shadow-03',
    userId: 'usr-demo-3',
    name: 'Silas Reed',
    role: 'suspect',
    persona: 'deceptive',
    description: 'Expert at deflecting blame and providing seamless alibis.',
    rating: 1280,
    casesPlayed: 5,
    wins: 3,
    xp: 1500,
    achievements: ['best_liar']
  }
];

defaultAgents.forEach(a => memoryStore.agents.set(a.agentId, a));

let isConnectedMongo = false;

async function initDatabase() {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000
    });
    isConnectedMongo = true;
    console.log(`[Database] Connected successfully to MongoDB at ${MONGODB_URI}`);
  } catch (err) {
    console.warn(`[Database] MongoDB not running locally (${err.message}). Using high-performance in-memory persistence store.`);
    isConnectedMongo = false;
  }
}

// Data access operations
const Storage = {
  init: initDatabase,
  isMongo: () => isConnectedMongo,

  // Users
  getUser(userId) {
    return memoryStore.users.get(userId) || null;
  },
  saveUser(user) {
    memoryStore.users.set(user.id, user);
    return user;
  },

  // Agents
  getAgent(agentId) {
    return memoryStore.agents.get(agentId) || null;
  },
  getAllAgents() {
    return Array.from(memoryStore.agents.values());
  },
  saveAgent(agent) {
    memoryStore.agents.set(agent.agentId, agent);
    return agent;
  },
  updateAgentRating(agentId, ratingDelta, xpDelta, achievement = null) {
    const agt = memoryStore.agents.get(agentId);
    if (agt) {
      agt.rating = Math.max(800, (agt.rating || 1200) + ratingDelta);
      agt.xp = (agt.xp || 0) + xpDelta;
      agt.casesPlayed = (agt.casesPlayed || 0) + 1;
      if (ratingDelta > 0) agt.wins = (agt.wins || 0) + 1;
      if (achievement && !agt.achievements.includes(achievement.id)) {
        agt.achievements.push(achievement.id);
      }
      memoryStore.agents.set(agentId, agt);
    }
    return agt;
  },

  // Sessions
  saveSession(sessionData) {
    memoryStore.sessions.set(sessionData.sessionId, sessionData);
    return sessionData;
  },
  getSession(sessionId) {
    return memoryStore.sessions.get(sessionId) || null;
  },
  getAllSessions() {
    return Array.from(memoryStore.sessions.values());
  },

  // Spectator Bets
  saveBet(bet) {
    memoryStore.bets.set(bet.id, bet);
    return bet;
  },
  getUserBets(userId) {
    return Array.from(memoryStore.bets.values()).filter(b => b.userId === userId);
  },

  // Leaderboard
  getLeaderboard() {
    const agentLeaderboard = Array.from(memoryStore.agents.values())
      .sort((a, b) => b.rating - a.rating)
      .map((a, idx) => ({
        rank: idx + 1,
        agentId: a.agentId,
        name: a.name,
        role: a.role,
        rating: a.rating,
        xp: a.xp,
        casesPlayed: a.casesPlayed,
        wins: a.wins,
        achievementsCount: a.achievements.length
      }));

    const viewerLeaderboard = [
      { rank: 1, name: 'SleuthMaster99', points: 14500, accuracy: '88%', streak: 7, badges: ['Cold Case Closer', 'Sharp Eye'] },
      { rank: 2, name: 'NoirWatcher', points: 11200, accuracy: '82%', streak: 4, badges: ['Sharp Eye'] },
      { rank: 3, name: 'CSI_AgentX', points: 9400, accuracy: '79%', streak: 3, badges: ['Truth Seeker'] },
      { rank: 4, name: 'BespokeDetective', points: 8100, accuracy: '75%', streak: 2, badges: ['Cold Case Closer'] },
      { rank: 5, name: 'GavelStrike', points: 6750, accuracy: '70%', streak: 1, badges: ['Observer'] }
    ];

    return { agents: agentLeaderboard, viewers: viewerLeaderboard };
  }
};

module.exports = Storage;
