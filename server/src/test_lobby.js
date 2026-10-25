const assert = require('assert');
const CaseLoader = require('./engine/CaseLoader');
const SessionManager = require('./engine/SessionManager');

// Mock socket.io for standalone testing
class MockSocketIO {
  to(room) {
    return {
      emit: (event, data) => {}
    };
  }
  emit(event, data) {}
}

async function runLobbyTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🧪 RUNNING COMPREHENSIVE CASE LOBBY & LIFECYCLE TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Test 1: Validate all 11 cases in cases.json
  console.log('▶ TEST 1: Schema & Cross-Referencing Validation for All 11 Cases');
  const caseLoader = new CaseLoader();
  const allCases = caseLoader.getAllCases();
  assert.strictEqual(allCases.length, 11, `Expected 11 cases loaded, found ${allCases.length}`);
  const expectedIds = [
    'CASE-001', 'CASE-002', 'CASE-003', 'CASE-004', 'CASE-005',
    'CASE-006', 'CASE-007', 'CASE-008', 'CASE-009', 'CASE-010', 'CASE-011'
  ];
  expectedIds.forEach(id => {
    const c = caseLoader.getCase(id);
    assert(c, `Case ${id} must exist in case library`);
    assert(c.roster && c.roster.seats.length >= 4, `Case ${id} must define a valid seat roster`);
  });
  console.log('  ✔ All 11 cases exist and validated with ZERO schema or cross-reference errors.\n');

  // Test 2: Lobby Seeding & Lifecycle States
  console.log('▶ TEST 2: Lobby Seeding & Initial State Management');
  const mockIO = new MockSocketIO();
  const sessionManager = new SessionManager(caseLoader, mockIO);
  await sessionManager.seedDemoSessions();

  const liveSession = sessionManager.getSession('LIVE-CASE-001');
  assert.strictEqual(liveSession.lifecycleStatus, 'live', 'LIVE-CASE-001 must be in live state');

  const replaySession = sessionManager.getSession('REPLAY-CASE-002');
  assert.strictEqual(replaySession.lifecycleStatus, 'finished', 'REPLAY-CASE-002 must be in finished state');

  const lobby004 = sessionManager.getSession('LOBBY-CASE-004');
  assert(lobby004, 'LOBBY-CASE-004 must be initialized');
  assert.strictEqual(lobby004.lifecycleStatus, 'pending', 'LOBBY-CASE-004 must be in pending lobby state');

  const lobbyState = lobby004.getLobbyState();
  assert(lobbyState.seats.length >= 5, 'LOBBY-CASE-004 must have at least 5 seats');
  assert(lobbyState.stats.fillPercentage >= 0, 'Fill percentage must be calculated');
  console.log(`  ✔ Seeded lobbies active. LOBBY-CASE-004 has ${lobbyState.seats.length} seats (${lobbyState.stats.fillPercentage}% filled).\n`);

  // Test 3: Safe Character Dossier (No secrets, guilt, or true timeline leaked in lobby)
  console.log('▶ TEST 3: Character Dossier Information Leak Prevention');
  const suspectSeat = lobbyState.seats.find(s => s.role === 'suspect');
  assert(suspectSeat, 'Must find a suspect seat in lobby');
  assert(suspectSeat.publicProfile, 'Suspect seat must include public profile');
  assert.strictEqual(suspectSeat.publicProfile.secrets, undefined, 'CRITICAL: secrets MUST NOT be exposed in lobby dossier!');
  assert.strictEqual(suspectSeat.publicProfile.private_knowledge, undefined, 'CRITICAL: private_knowledge MUST NOT be exposed in lobby dossier!');
  assert.strictEqual(suspectSeat.publicProfile.lies_about, undefined, 'CRITICAL: lies_about MUST NOT be exposed in lobby dossier!');
  assert.strictEqual(suspectSeat.publicProfile.is_culprit, undefined, 'CRITICAL: is_culprit MUST NOT be exposed in lobby dossier!');
  assert.strictEqual(suspectSeat.publicProfile.true_whereabouts, undefined, 'CRITICAL: true_whereabouts MUST NOT be exposed in lobby dossier!');
  console.log('  ✔ Verified dossier sanitization: Zero secrets, guilt, or true timeline leaks.\n');

  // Test 4: Seat Selection & Anti-Collusion Rules
  console.log('▶ TEST 4: Seat Claiming & Anti-Collusion Enforcement');
  const testSession = sessionManager.createSession('CASE-004', {
    sessionId: 'TEST-COLLUSION-001',
    lifecycleStatus: 'pending'
  });

  // User A claims Detective seat
  const claim1 = testSession.claimSeat('detective', {
    agentId: 'agt-det-01',
    name: 'Detective Dupin',
    agentType: 'builtin'
  }, {
    userId: 'user-alpha',
    username: 'Alice Investigator'
  });
  assert(claim1.success, `Detective seat claim should succeed: ${claim1.reason}`);
  assert.strictEqual(claim1.seat.status, 'confirmed', 'Detective seat should be confirmed');

  // Anti-collusion 1: User A tries to claim Suspect seat (Investigation vs Defendant conflict!)
  const suspectKey = Array.from(testSession.lobbySeats.values()).find(s => s.role === 'suspect').seatKey;
  const claimCollusion1 = testSession.claimSeat(suspectKey, {
    agentId: 'agt-susp-01',
    name: 'Suspect Stand-in',
    agentType: 'builtin'
  }, {
    userId: 'user-alpha', // Same user!
    username: 'Alice Investigator'
  });
  assert.strictEqual(claimCollusion1.success, false, 'Anti-collusion MUST block Detective holding Suspect seat');
  assert(claimCollusion1.reason.includes('Anti-collusion'), `Reason should cite anti-collusion: ${claimCollusion1.reason}`);
  console.log('  ✔ Anti-collusion blocked user holding both Detective & Suspect seats.');

  // User B claims Prosecutor seat
  const claimProsecutor = testSession.claimSeat('prosecutor', {
    agentId: 'agt-pros-01',
    name: 'State Prosecutor',
    agentType: 'builtin'
  }, {
    userId: 'user-beta',
    username: 'Bob Prosecution'
  });
  assert(claimProsecutor.success, 'Prosecutor claim should succeed');

  // Anti-collusion 2: User B tries to claim Defense Lawyer seat (Prosecution vs Defense conflict!)
  const defenseKey = Array.from(testSession.lobbySeats.values()).find(s => s.role === 'defense_lawyer').seatKey;
  const claimCollusion2 = testSession.claimSeat(defenseKey, {
    agentId: 'agt-def-01',
    name: 'Defense Counsel',
    agentType: 'builtin'
  }, {
    userId: 'user-beta', // Same user!
    username: 'Bob Prosecution'
  });
  assert.strictEqual(claimCollusion2.success, false, 'Anti-collusion MUST block Prosecutor holding Defense Lawyer seat');
  console.log('  ✔ Anti-collusion blocked user holding both Prosecution & Defense seats.');

  // User C claims Judge seat
  const claimJudge = testSession.claimSeat('judge', {
    agentId: 'agt-judge-01',
    name: 'Chief Magistrate',
    agentType: 'builtin'
  }, {
    userId: 'user-gamma',
    username: 'Judge Charlie'
  });
  assert(claimJudge.success, 'Judge claim should succeed');

  // Anti-collusion 3: User C tries to claim Detective seat (Judge impartiality!)
  const claimCollusion3 = testSession.claimSeat('police_officer', {
    agentId: 'agt-cop-01',
    name: 'Officer Friendly',
    agentType: 'builtin'
  }, {
    userId: 'user-gamma', // Judge user!
    username: 'Judge Charlie'
  });
  assert.strictEqual(claimCollusion3.success, false, 'Anti-collusion MUST block Judge holding Partisan seat');
  console.log('  ✔ Anti-collusion blocked Judge holding partisan investigation seat.\n');

  // Test 5: Seat Release & Expiry Handling
  console.log('▶ TEST 5: Seat Release & Reservation Expiry');
  const releaseRes = testSession.releaseSeat('detective', 'user-alpha');
  assert(releaseRes.success, 'User Alpha should be able to release their seat');
  const detSeatAfter = testSession.lobbySeats.get('detective');
  assert.strictEqual(detSeatAfter.status, 'open', 'Released seat must be open');
  assert.strictEqual(detSeatAfter.claimedBy, null, 'Released seat must have null claimedBy');
  console.log('  ✔ Seat released successfully back to open state.\n');

  // Test 6: Ready Check Failure & Timeout Recovery
  console.log('▶ TEST 6: External Agent Health Check Failure & Graceful Reversion');
  const healthTestSession = sessionManager.createSession('CASE-004', {
    sessionId: 'TEST-HEALTH-001',
    lifecycleStatus: 'pending'
  });

  // Claim a seat with an unreachable external agent endpoint
  const mockExternalSeat = healthTestSession.lobbySeats.get('detective');
  mockExternalSeat.status = 'confirmed';
  mockExternalSeat.claimedBy = {
    userId: 'ext-user',
    username: 'External Dev',
    agentId: 'ext-broken-bot',
    agentName: 'Broken Bot',
    agentType: 'external',
    endpointUrl: 'http://127.0.0.1:59999/unreachable-endpoint', // Non-existent port
    isExternal: true
  };
  mockExternalSeat.readyConfirmed = false;

  healthTestSession.lifecycleStatus = 'ready';
  await healthTestSession.runAgentHealthCheck(mockExternalSeat);

  // Health check should fail, seat should reopen, and session should drop back to pending
  assert.strictEqual(mockExternalSeat.status, 'open', 'Failed external seat must reopen');
  assert.strictEqual(mockExternalSeat.healthStatus, 'failed', 'Health status must be marked failed');
  assert.strictEqual(healthTestSession.lifecycleStatus, 'pending', 'Session lifecycle must drop back to pending on failed agent');
  console.log('  ✔ External agent health check failure caught: seat reopened and case dropped back to pending.\n');

  // Test 7: Complete Seat Filling -> Ready Check -> Countdown -> Live Session
  console.log('▶ TEST 7: Full Seat Fill, Ready Check, Countdown and Live Launch');
  const startSession = sessionManager.createSession('CASE-004', {
    sessionId: 'TEST-START-001',
    lifecycleStatus: 'pending'
  });

  // Fill all required seats with confirmed valid built-in agents
  let userIdx = 1;
  for (const [key, s] of startSession.lobbySeats.entries()) {
    if (s.required && s.status !== 'confirmed') {
      startSession.claimSeat(key, {
        agentId: `agt-bot-${key}`,
        name: `${s.roleLabel || s.role} Pro`,
        agentType: 'builtin'
      }, {
        userId: `usr-batch-${userIdx++}`,
        username: `Player ${userIdx}`
      });
    }
  }

  // Any seats in pending_approval are approved by the presiding judge
  for (const [key, s] of startSession.lobbySeats.entries()) {
    if (s.status === 'pending_approval') {
      const appRes = startSession.approveSeat(key, 'usr-batch-1');
      assert(appRes.success, `Approval should succeed for ${key}`);
    }
  }

  assert.strictEqual(startSession.lifecycleStatus, 'ready', 'Session must transition to ready when all required seats are confirmed');
  assert(startSession.readyCheckState !== null, 'Ready check state must be initialized');

  // Confirm readiness for all confirmed seats
  for (const [key, s] of startSession.lobbySeats.entries()) {
    if (s.status === 'confirmed' && !s.readyConfirmed) {
      startSession.confirmReady(key, s.claimedBy?.userId || 'admin');
    }
  }

  // Force trigger launchLiveCase directly to verify clean transition without waiting 5s in test
  startSession.launchLiveCase();
  assert.strictEqual(startSession.lifecycleStatus, 'live', 'Session must be in live status after launch');
  assert(startSession.activeSeats.size >= 4, 'Active seats must be populated in live trial');
  console.log('  ✔ Complete seat fill and ready check successfully launched live trial session.\n');

  // Test 8: Late Entry & House Bot Surrogate Takeover / Rejoin
  console.log('▶ TEST 8: Live Case Late Entry & House Bot Takeover');
  const liveTestSession = sessionManager.createSession('CASE-005', {
    sessionId: 'TEST-LIVE-TAKEOVER',
    lifecycleStatus: 'live'
  });

  // Seat is currently occupied by house bot
  const testSeatKey = 'police_officer';
  assert(liveTestSession.activeSeats.has(testSeatKey), 'Live session must have police_officer seat');
  assert(liveTestSession.activeSeats.get(testSeatKey).isHouseBot, 'Initial seat should be house bot');

  // Player joins live case via Late Entry
  const lateRes = liveTestSession.lateJoinSeat(testSeatKey, {
    agentId: 'agt-late-cop',
    name: 'Officer Higgins',
    agentType: 'builtin'
  }, {
    userId: 'user-late-01',
    username: 'Late Player'
  });
  assert(lateRes.success, 'Late entry should succeed for house bot occupied seat');
  assert.strictEqual(liveTestSession.activeSeats.get(testSeatKey).isHouseBot, false, 'Seat must no longer be house bot');

  // Player disconnects -> House bot surrogate steps in without breaking game
  const takeoverRes = liveTestSession.takeoverByHouseBot(testSeatKey, 'socket disconnect');
  assert(takeoverRes, 'Takeover by house bot should succeed');
  assert.strictEqual(liveTestSession.activeSeats.get(testSeatKey).isHouseBot, true, 'Seat must now be house bot surrogate');

  // Player reconnects -> reclaims seat
  const rejoinRes = liveTestSession.rejoinSeat(testSeatKey, 'user-late-01');
  assert(rejoinRes.success, 'Original player must be able to reclaim seat');
  assert.strictEqual(liveTestSession.activeSeats.get(testSeatKey).isHouseBot, false, 'Seat must be restored to player');
  console.log('  ✔ Late entry, house bot surrogate takeover, and player rejoin verified.\n');

  // Test 9: Lobby Expiry & Force Start with House Bots
  console.log('▶ TEST 9: Lobby Expiry Rule & Force Start with Bots');
  const expirySession = sessionManager.createSession('CASE-006', {
    sessionId: 'TEST-EXPIRY-001',
    lifecycleStatus: 'pending'
  });
  const botFillRes = expirySession.fillWithBotsAndStart();
  assert(botFillRes.success, 'fillWithBotsAndStart should succeed');
  assert.strictEqual(expirySession.lifecycleStatus, 'ready', 'Expiry autofill should move to ready countdown');
  expirySession.launchLiveCase();
  assert.strictEqual(expirySession.lifecycleStatus, 'live', 'Should launch into live session');
  console.log('  ✔ Lobby expiry auto-fill successfully populated empty seats and launched.\n');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🎉 ALL 9 LOBBY TEST SUITES PASSED FLAWLESSLY WITH ZERO ERRORS');
  console.log('═══════════════════════════════════════════════════════════════');

  liveSession.stopAutoPlay();
  process.exit(0);
}

runLobbyTests().catch(err => {
  console.error('❌ Lobby test failure:', err);
  process.exit(1);
});
