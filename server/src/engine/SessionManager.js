const GameSession = require('./GameSession');

class SessionManager {
  constructor(caseLoader, io) {
    this.caseLoader = caseLoader;
    this.io = io;
    this.sessions = new Map();
  }

  createSession(caseId, options = {}) {
    const caseData = this.caseLoader.getCase(caseId);
    if (!caseData) throw new Error(`Case ${caseId} not found in library`);

    const session = new GameSession(caseId, caseData, this.caseLoader, options);

    // Wire real-time socket events
    session.on('game_event', ({ event, sessionId }) => {
      this.io.to(`case:${sessionId}`).emit('game_event', event);
    });

    session.on('round_completed', ({ sessionId, phase, subPhase, round, view }) => {
      this.io.to(`case:${sessionId}`).emit('case_state', view);
    });

    session.on('case_finished', ({ sessionId, reveal }) => {
      this.io.to(`case:${sessionId}`).emit('case_finished', { reveal });
      this.io.to(`case:${sessionId}`).emit('case_state', session.getSpectatorView());
    });

    session.on('seat_updated', ({ seat, sessionId }) => {
      this.io.to(`case:${sessionId}`).emit('seat_updated', { seat });
    });

    // Lobby socket events
    session.on('lobby_updated', ({ sessionId, lobby }) => {
      this.io.to(`case:${sessionId}`).emit('lobby_updated', lobby);
      this.io.emit('lobby_summary_updated', { sessionId, stats: lobby.stats });
    });

    session.on('seat_claimed', ({ sessionId, seatKey, seat }) => {
      this.io.to(`case:${sessionId}`).emit('seat_claimed', { seatKey, seat });
    });

    session.on('seat_released', ({ sessionId, seatKey }) => {
      this.io.to(`case:${sessionId}`).emit('seat_released', { seatKey });
    });

    session.on('seat_approved', ({ sessionId, seatKey, seat }) => {
      this.io.to(`case:${sessionId}`).emit('seat_approved', { seatKey, seat });
    });

    session.on('ready_check_started', ({ sessionId, readyCheck }) => {
      this.io.to(`case:${sessionId}`).emit('ready_check_started', readyCheck);
    });

    session.on('ready_confirmed', ({ sessionId, seatKey }) => {
      this.io.to(`case:${sessionId}`).emit('ready_confirmed', { seatKey });
    });

    session.on('ready_countdown', ({ sessionId, countdown }) => {
      this.io.to(`case:${sessionId}`).emit('ready_countdown', { countdown });
    });

    session.on('ready_check_failed', ({ sessionId, seatKey, reason }) => {
      this.io.to(`case:${sessionId}`).emit('ready_check_failed', { seatKey, reason });
    });

    session.on('case_started', ({ sessionId, view }) => {
      this.io.to(`case:${sessionId}`).emit('case_started', view);
    });

    session.on('master_referee_update', ({ sessionId, evalResult, liveScores }) => {
      this.io.to(`case:${sessionId}`).emit('master_referee_update', { evalResult, liveScores });
    });

    this.sessions.set(session.sessionId, session);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  getLobbies() {
    return Array.from(this.sessions.values())
      .filter(s => s.lifecycleStatus === 'pending' || s.lifecycleStatus === 'ready')
      .map(s => s.getLobbyState());
  }

  /**
   * Seeds demo cases:
   * 1 ongoing case running live with auto-play (CASE-001)
   * 1 finished replay case with dramatic reveal ready to watch (CASE-002)
   * 1 upcoming/open case (CASE-003)
   * 8 pending case lobbies (CASE-004 through CASE-011) with varied genres, difficulties and sizes
   */
  async seedDemoSessions() {
    console.log('[SessionManager] Seeding sample cases and pending lobbies...');

    // 1. Live Ongoing Case: CASE-001 "The Last Page"
    const liveSession = this.createSession('CASE-001', {
      sessionId: 'LIVE-CASE-001',
      autoPlay: true,
      tickIntervalMs: 5000,
      lifecycleStatus: 'live'
    });
    await liveSession.stepRound();
    await liveSession.stepRound();
    await liveSession.stepRound();
    liveSession.startAutoPlay();
    console.log('[SessionManager] Seeded live session: LIVE-CASE-001 (ongoing)');

    // 2. Finished Case Replay: CASE-002 "The Sapphire Lantern"
    const finishedSession = this.createSession('CASE-002', {
      sessionId: 'REPLAY-CASE-002',
      autoPlay: false,
      lifecycleStatus: 'finished'
    });
    while (!finishedSession.isCompleted && finishedSession.round < 30) {
      await finishedSession.stepRound();
    }
    console.log('[SessionManager] Seeded finished session: REPLAY-CASE-002 (finished with reveal replay)');

    // 3. Upcoming / Open Case: CASE-003 "Orion Down"
    const openSession = this.createSession('CASE-003', {
      sessionId: 'UPCOMING-CASE-003',
      autoPlay: false,
      lifecycleStatus: 'pending'
    });
    console.log('[SessionManager] Seeded open session: UPCOMING-CASE-003 (lobby open)');

    // 4. Pending Case Lobbies: CASE-004 through CASE-011
    const pendingCases = [
      { caseId: 'CASE-004', sessionId: 'LOBBY-CASE-004', preClaim: { seat: 'judge', name: 'Justice Thorne', role: 'judge' } },
      { caseId: 'CASE-005', sessionId: 'LOBBY-CASE-005', preClaim: { seat: 'detective', name: 'Inspector Vance', role: 'detective' } },
      { caseId: 'CASE-006', sessionId: 'LOBBY-CASE-006', preClaim: { seat: 'prosecutor', name: 'Helena Cross, Esq.', role: 'prosecutor' } },
      { caseId: 'CASE-007', sessionId: 'LOBBY-CASE-007', preClaim: { seat: 'forensic_analyst', name: 'Dr. Aris Thorne', role: 'forensic_analyst' } },
      { caseId: 'CASE-008', sessionId: 'LOBBY-CASE-008', preClaim: { seat: 'detective', name: 'Detective Benoit', role: 'detective' } },
      { caseId: 'CASE-009', sessionId: 'LOBBY-CASE-009', preClaim: { seat: 'judge', name: 'Hon. Miriam Drake', role: 'judge' } },
      { caseId: 'CASE-010', sessionId: 'LOBBY-CASE-010', preClaim: { seat: 'defense_lawyer', name: 'Julian Mercer', role: 'defense_lawyer' } },
      { caseId: 'CASE-011', sessionId: 'LOBBY-CASE-011', preClaim: { seat: 'prosecutor', name: 'State Atty. Gabriel Vance', role: 'prosecutor' } }
    ];

    for (const item of pendingCases) {
      try {
        const s = this.createSession(item.caseId, {
          sessionId: item.sessionId,
          autoPlay: false,
          lifecycleStatus: 'pending'
        });

        // Add pre-claim for realistic matchmaking atmosphere
        if (item.preClaim && s.lobbySeats.has(item.preClaim.seat)) {
          s.claimSeat(item.preClaim.seat, {
            agentId: `seed-${item.preClaim.role}`,
            name: item.preClaim.name,
            agentType: 'builtin'
          }, {
            userId: `seed-usr-${item.preClaim.role}`,
            username: item.preClaim.name
          });
        }
        console.log(`[SessionManager] Seeded lobby session: ${item.sessionId} (${item.caseId})`);
      } catch (err) {
        console.warn(`[SessionManager] Could not seed ${item.sessionId}: ${err.message}`);
      }
    }
  }

  async resetSession(sessionId) {
    const existing = this.sessions.get(sessionId);
    if (existing) {
      existing.stopAutoPlay();
      this.sessions.delete(sessionId);
    }
    if (sessionId === 'LIVE-CASE-001') {
      const liveSession = this.createSession('CASE-001', {
        sessionId: 'LIVE-CASE-001',
        autoPlay: true,
        tickIntervalMs: 5000
      });
      await liveSession.stepRound();
      await liveSession.stepRound();
      liveSession.startAutoPlay();
      return liveSession;
    } else if (sessionId === 'REPLAY-CASE-002') {
      const finishedSession = this.createSession('CASE-002', {
        sessionId: 'REPLAY-CASE-002',
        autoPlay: false
      });
      while (!finishedSession.isCompleted && finishedSession.round < 30) {
        await finishedSession.stepRound();
      }
      return finishedSession;
    } else if (sessionId === 'UPCOMING-CASE-003') {
      const openSession = this.createSession('CASE-003', {
        sessionId: 'UPCOMING-CASE-003',
        autoPlay: false
      });
      return openSession;
    }
    return null;
  }
}

module.exports = SessionManager;
