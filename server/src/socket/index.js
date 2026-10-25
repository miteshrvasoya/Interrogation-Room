function setupSocketServer(io, sessionManager) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join overall lobby room
    socket.on('join_lobby', () => {
      socket.join('lobby');
      console.log(`[Socket] ${socket.id} joined general lobby room`);
      socket.emit('lobby_list', sessionManager.getLobbies());
    });

    socket.on('leave_lobby', () => {
      socket.leave('lobby');
    });

    // Join a specific case room
    socket.on('join_case', ({ sessionId }) => {
      socket.join(`case:${sessionId}`);
      console.log(`[Socket] ${socket.id} joined case room: case:${sessionId}`);

      // Send initial spectator view and lobby state
      const session = sessionManager.getSession(sessionId);
      if (session) {
        socket.emit('case_state', session.getSpectatorView());
        if (session.lifecycleStatus === 'pending' || session.lifecycleStatus === 'ready') {
          socket.emit('lobby_updated', session.getLobbyState());
        }
      }
    });

    socket.on('leave_case', ({ sessionId }) => {
      socket.leave(`case:${sessionId}`);
      console.log(`[Socket] ${socket.id} left case room: case:${sessionId}`);
    });

    // Seat action via socket
    socket.on('claim_seat', ({ sessionId, seatKey, agent, user }) => {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const res = session.claimSeat(seatKey, agent, user);
        socket.emit('seat_action_result', res);
      }
    });

    socket.on('release_seat', ({ sessionId, seatKey, userId }) => {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const res = session.releaseSeat(seatKey, userId);
        socket.emit('seat_action_result', res);
      }
    });

    socket.on('confirm_ready', ({ sessionId, seatKey, userId }) => {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const res = session.confirmReady(seatKey, userId);
        socket.emit('seat_action_result', res);
      }
    });

    // Handle spectator in-scene reaction
    socket.on('send_reaction', ({ sessionId, type, user }) => {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const reaction = session.recordSpectatorReaction(type, user || 'Spectator');
        io.to(`case:${sessionId}`).emit('spectator_reaction', reaction);
      }
    });

    // Handle spectator bet
    socket.on('place_bet', ({ sessionId, userId, userName, suspectId, points }) => {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const result = session.placeSpectatorBet(userId || socket.id, userName || 'Spectator', suspectId, points);
        if (result.success) {
          io.to(`case:${sessionId}`).emit('spectator_bet_placed', {
            bet: result.bet,
            odds: session.calculateSpectatorOdds()
          });
          socket.emit('bet_confirmed', result.bet);
        } else {
          socket.emit('bet_error', { reason: result.reason });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = setupSocketServer;
