const EventEmitter = require('events');
const TurnManager = require('./TurnManager');
const HouseBots = require('./HouseBots');
const ApprovalWorkflow = require('./ApprovalWorkflow');
const ScoringEngine = require('./ScoringEngine');
const MasterReferee = require('./MasterReferee');
const LlmService = require('./LlmService');

class GameSession extends EventEmitter {
  constructor(caseId, caseData, caseLoader, options = {}) {
    super();
    this.sessionId = options.sessionId || `SES-${caseId}-${Date.now()}`;
    this.caseId = caseId;
    this.caseData = JSON.parse(JSON.stringify(caseData)); // Deep clone
    this.caseLoader = caseLoader;
    this.library = caseLoader.getLibrary();

    // Game state
    this.currentPhase = 'briefing';
    this.subPhase = null; // Used in trial: 'opening' | 'examination' | 'closing'
    this.round = 1;
    this.maxRoundsCurrentPhase = 2;
    this.isCompleted = false;
    this.autoPlay = options.autoPlay !== undefined ? options.autoPlay : false;
    this.tickIntervalMs = options.tickIntervalMs || 4000;
    this.tickTimer = null;

    // Case lifecycle: 'pending' (lobby open) -> 'ready' (seats filled & verified) -> 'live' -> 'finished'
    this.lifecycleStatus = options.lifecycleStatus || (
      options.autoPlay || this.sessionId.startsWith('LIVE-') ? 'live' :
      (this.sessionId.startsWith('REPLAY-') ? 'finished' : 'pending')
    );
    this.lobbyCreatedAt = options.createdAt || Date.now();
    this.lobbyTimeoutMs = options.lobbyTimeoutMs || 30 * 60 * 1000;
    this.readyCheckState = null;
    this.readyCountdownTimer = null;

    // Seated agents map: seatKey -> agent
    this.activeSeats = new Map();
    // Lobby seats map: seatKey -> lobby seat definition
    this.lobbySeats = new Map();

    // Mechanics collections
    this.discoveredEvidence = new Set();
    this.admittedEvidence = new Set();
    this.forensicResults = new Map(); // evId -> result
    this.warrants = [];
    this.pendingQuestions = [];
    this.pendingObjections = [];
    this.charges = [];
    this.acceptedCharge = null;
    this.theories = [];
    this.confessions = [];
    this.deliveredVerdicts = [];
    this.judgeReasoning = '';
    this.verdictDelivered = false;

    // Contradictions & secrets
    this.exposedContradictions = new Set();
    this.characterContradictionCounts = new Map();
    this.revealedSecrets = new Set();

    // Event log & complete transcript
    this.transcript = [];
    this.thoughtSummaries = new Map(); // actionId -> thought_summary

    // Sub-engines
    this.turnManager = new TurnManager(this);
    this.houseBots = new HouseBots(this);
    this.approvalWorkflow = new ApprovalWorkflow(this);
    this.scoringEngine = new ScoringEngine(this);
    this.masterReferee = new MasterReferee(this);

    // Spectator state
    this.spectatorBets = [];
    this.spectatorReactions = [];
    this.heat = 65; // Dynamic viewer interest score (0 - 100)

    // Initial fill
    this.setupLobbySeats();
    if (this.lifecycleStatus === 'live' || this.lifecycleStatus === 'finished') {
      this.bootstrapSeats();
    }
    this.logInitialBriefing();
  }

  /**
   * Bootstraps seats with house bots or case characters
   */
  bootstrapSeats() {
    const roster = this.caseData.roster || { seats: [] };
    const requiredRoles = ['judge', 'prosecutor', 'defense_lawyer', 'detective', 'police_officer', 'forensic_analyst', 'court_clerk'];

    // Fill system & core roles
    requiredRoles.forEach(role => {
      const seatKey = role;
      const roleDef = this.library.role_catalog[role];
      const botName = `${roleDef?.label || role} AI`;
      this.activeSeats.set(seatKey, {
        seatKey,
        agentId: `bot-${role}`,
        displayName: botName,
        name: botName,
        role,
        isHouseBot: true,
        rating: 1250,
        casesPlayed: 5,
        isApprover: ['judge', 'detective', 'prosecutor'].includes(role)
      });
    });

    // Fill suspects and witnesses from case characters
    (this.caseData.characters || []).forEach(ch => {
      if (ch.seat_role === 'suspect' || ch.seat_role === 'witness') {
        const seatKey = `${ch.seat_role}-${ch.id}`;
        this.activeSeats.set(seatKey, {
          seatKey,
          agentId: `bot-${ch.id}`,
          displayName: ch.name,
          name: ch.name,
          role: ch.seat_role,
          characterId: ch.id,
          characterName: ch.name,
          isHouseBot: true,
          rating: 1200,
          casesPlayed: 3,
          isApprover: ch.seat_role === 'suspect'
        });
      }
    });

    console.log(`[GameSession ${this.sessionId}] Bootstrapped ${this.activeSeats.size} seats.`);
  }

  /**
   * Initializes lobby seat definitions based on case roster and characters
   */
  setupLobbySeats() {
    this.lobbySeats.clear();
    const roster = this.caseData.roster || { seats: [] };
    const characters = this.caseData.characters || [];

    (roster.seats || []).forEach(rSeat => {
      const roleDef = this.library?.role_catalog[rSeat.role] || {};
      const side = roleDef.side || 'investigation';

      if (rSeat.role === 'court_clerk') {
        this.lobbySeats.set('court_clerk', {
          seatKey: 'court_clerk',
          role: 'court_clerk',
          roleLabel: 'Court Clerk',
          side: 'court',
          required: true,
          status: 'confirmed',
          isHouseBot: true,
          claimedBy: {
            userId: 'system',
            username: 'Court Clerk AI',
            agentId: 'bot-court_clerk',
            agentName: 'Court Clerk AI',
            agentType: 'builtin'
          },
          readyConfirmed: true,
          healthStatus: 'healthy',
          note: rSeat.note || 'System record keeper'
        });
        return;
      }

      if (rSeat.role === 'suspect' || rSeat.role === 'witness') {
        let targetChars = [];
        if (rSeat.character_ids && rSeat.character_ids.length > 0) {
          targetChars = rSeat.character_ids.map(cid => characters.find(c => c.id === cid)).filter(Boolean);
        } else {
          targetChars = characters.filter(c => c.seat_role === rSeat.role);
        }

        targetChars.forEach(ch => {
          const seatKey = `${rSeat.role}-${ch.id}`;
          // Public dossier only: NEVER leak secrets, lies, guilt, or true whereabouts!
          const publicProfile = {
            id: ch.id,
            name: ch.name,
            age: ch.age,
            occupation: ch.occupation,
            role_in_case: ch.role_in_case,
            public_profile: ch.public_profile,
            relationship_to_victim: ch.relationship_to_victim,
            claimed_alibi: ch.claimed_alibi,
            personality: ch.personality ? { speech_style: ch.personality.speech_style } : null
          };

          const isInitiallyFilled = rSeat.initial_fill === 'house_bot';
          this.lobbySeats.set(seatKey, {
            seatKey,
            role: rSeat.role,
            roleLabel: ch.name,
            side: rSeat.role === 'suspect' ? 'defendant' : 'witness',
            required: (rSeat.min || 0) > 0,
            characterId: ch.id,
            characterName: ch.name,
            publicProfile,
            status: isInitiallyFilled ? 'confirmed' : 'open',
            isHouseBot: isInitiallyFilled,
            claimedBy: isInitiallyFilled ? {
              userId: 'bot-system',
              username: `${ch.name} (AI)`,
              agentId: `bot-${ch.id}`,
              agentName: `${ch.name} (AI)`,
              agentType: 'builtin'
            } : null,
            readyConfirmed: isInitiallyFilled,
            healthStatus: isInitiallyFilled ? 'healthy' : 'untested',
            note: rSeat.note || ch.name
          });
        });
        return;
      }

      // Standard roles (judge, prosecutor, detective, defense_lawyer, police_officer, forensic_analyst)
      const count = rSeat.max || 1;
      for (let i = 1; i <= count; i++) {
        const seatKey = count === 1 ? rSeat.role : `${rSeat.role}-${i}`;
        const isInitiallyFilled = rSeat.initial_fill === 'house_bot';
        this.lobbySeats.set(seatKey, {
          seatKey,
          role: rSeat.role,
          roleLabel: roleDef.label || rSeat.role,
          side,
          required: i <= (rSeat.min || 0),
          status: isInitiallyFilled ? 'confirmed' : 'open',
          isHouseBot: isInitiallyFilled,
          claimedBy: isInitiallyFilled ? {
            userId: 'bot-system',
            username: `${roleDef.label || rSeat.role} AI`,
            agentId: `bot-${seatKey}`,
            agentName: `${roleDef.label || rSeat.role} AI`,
            agentType: 'builtin'
          } : null,
          readyConfirmed: isInitiallyFilled,
          healthStatus: isInitiallyFilled ? 'healthy' : 'untested',
          note: rSeat.note || roleDef.description || ''
        });
      }
    });
  }

  /**
   * Safe public lobby view for lobby cards and seat map
   */
  getLobbyState() {
    const seatsArray = Array.from(this.lobbySeats.values()).map(s => ({
      seatKey: s.seatKey,
      role: s.role,
      roleLabel: s.roleLabel || (this.library?.role_catalog[s.role]?.label || s.role),
      side: s.side,
      required: s.required,
      status: s.status, // 'open' | 'pending_approval' | 'confirmed'
      characterId: s.characterId || null,
      characterName: s.characterName || null,
      publicProfile: s.publicProfile || null,
      claimedBy: s.claimedBy ? {
        userId: s.claimedBy.userId,
        username: s.claimedBy.username,
        agentId: s.claimedBy.agentId,
        agentName: s.claimedBy.agentName,
        agentType: s.claimedBy.agentType,
        isExternal: !!s.claimedBy.isExternal
      } : null,
      readyConfirmed: !!s.readyConfirmed,
      healthStatus: s.healthStatus || 'untested',
      reservationExpiresAt: s.reservationExpiresAt || null,
      isHouseBot: !!s.isHouseBot,
      note: s.note || ''
    }));

    const totalSeats = seatsArray.length;
    const requiredSeats = seatsArray.filter(s => s.required).length;
    const confirmedSeats = seatsArray.filter(s => s.status === 'confirmed').length;
    const confirmedRequiredSeats = seatsArray.filter(s => s.required && s.status === 'confirmed').length;
    const fillPercentage = totalSeats > 0 ? Math.round((confirmedSeats / totalSeats) * 100) : 0;

    return {
      sessionId: this.sessionId,
      caseId: this.caseId,
      title: this.caseData.title,
      tagline: this.caseData.tagline,
      difficulty: this.caseData.difficulty,
      genre: this.caseData.genre || [],
      estimatedRounds: this.caseData.estimated_rounds || 30,
      estimatedLengthMin: Math.round((this.caseData.estimated_rounds || 30) * 1.5),
      setting: this.caseData.setting,
      publicBriefing: this.caseData.public_briefing,
      lifecycleStatus: this.lifecycleStatus, // 'pending' | 'ready' | 'live' | 'finished'
      createdAt: this.lobbyCreatedAt,
      seats: seatsArray,
      stats: {
        totalSeats,
        requiredSeats,
        confirmedSeats,
        confirmedRequiredSeats,
        fillPercentage,
        isReadyToStart: this.lifecycleStatus === 'ready' || (requiredSeats > 0 && confirmedRequiredSeats === requiredSeats)
      },
      readyCheck: this.readyCheckState
    };
  }

  /**
   * Anti-collusion validation: prevents a user from holding opposing sides in the same case.
   */
  checkCollusion(userId, targetRole) {
    if (!userId || userId === 'bot-system' || userId === 'system') {
      return { allowed: true };
    }

    const roleDef = this.library?.role_catalog[targetRole] || {};
    const targetSide = roleDef.side || (targetRole === 'suspect' ? 'defendant' : (targetRole === 'witness' ? 'witness' : 'investigation'));

    // Check all seats in this case currently claimed by this user
    const userSeats = Array.from(this.lobbySeats.values()).filter(s =>
      s.claimedBy && s.claimedBy.userId === userId && s.status !== 'open'
    );

    for (const s of userSeats) {
      const heldSide = s.side;
      if (heldSide === targetSide) continue;

      const isProsecutionInvestigation = ['prosecution', 'investigation'].includes(heldSide);
      const isDefenseDefendant = ['defense', 'defendant'].includes(heldSide);

      if (isProsecutionInvestigation && ['defense', 'defendant'].includes(targetSide)) {
        return {
          allowed: false,
          reason: `Anti-collusion violation: You already hold a seat on the ${heldSide} side and cannot control an opposing ${targetSide} seat.`
        };
      }
      if (isDefenseDefendant && ['prosecution', 'investigation'].includes(targetSide)) {
        return {
          allowed: false,
          reason: `Anti-collusion violation: You already hold a seat on the ${heldSide} side and cannot control an opposing ${targetSide} seat.`
        };
      }
      if (heldSide === 'court' && targetSide !== 'court') {
        return {
          allowed: false,
          reason: 'Anti-collusion violation: The Presiding Judge cannot hold partisan seats in the same case.'
        };
      }
      if (targetSide === 'court' && heldSide !== 'court') {
        return {
          allowed: false,
          reason: 'Anti-collusion violation: Partisan participants cannot also serve as the Presiding Judge.'
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Claim a seat in the lobby
   */
  claimSeat(seatKey, agentInfo = {}, userInfo = {}) {
    const seat = this.lobbySeats.get(seatKey);
    if (!seat) {
      return { success: false, reason: `Seat "${seatKey}" does not exist in this case lobby` };
    }

    // Check if reservation expired
    if (seat.status !== 'open') {
      if (seat.reservationExpiresAt && Date.now() > seat.reservationExpiresAt) {
        seat.status = 'open';
        seat.claimedBy = null;
        seat.reservationExpiresAt = null;
      } else {
        return { success: false, reason: `Seat "${seatKey}" is currently ${seat.status}` };
      }
    }

    const userId = userInfo.userId || 'guest-user';

    // Anti-collusion check
    const collusion = this.checkCollusion(userId, seat.role);
    if (!collusion.allowed) {
      return { success: false, reason: collusion.reason };
    }

    // Role approval workflow from platform_library
    const roleDef = this.library?.role_catalog[seat.role] || {};
    const approversNeeded = roleDef.entry?.approved_by || [];

    // Check if there is an active human approver already confirmed
    const hasHumanApprover = Array.from(this.lobbySeats.values()).some(s =>
      approversNeeded.includes(s.role) && s.claimedBy && !s.isHouseBot && s.claimedBy.userId !== userId && s.status === 'confirmed'
    );

    const initialStatus = hasHumanApprover ? 'pending_approval' : 'confirmed';

    seat.status = initialStatus;
    seat.isHouseBot = false;
    const isByoLlm = !!agentInfo.llmConfig;
    seat.llmConfig = agentInfo.llmConfig || null;
    seat.claimedBy = {
      userId,
      username: userInfo.username || 'Investigator',
      agentId: agentInfo.agentId || `agt-${Date.now()}`,
      agentName: agentInfo.name || agentInfo.displayName || `${roleDef.label || seat.role} Agent`,
      agentType: isByoLlm ? 'byo_llm' : (agentInfo.agentType || (agentInfo.endpointUrl ? 'external' : 'builtin')),
      endpointUrl: agentInfo.endpointUrl || null,
      isExternal: !!agentInfo.endpointUrl,
      llmConfig: agentInfo.llmConfig || null,
      claimedAt: Date.now()
    };
    seat.reservationExpiresAt = initialStatus === 'pending_approval' ? Date.now() + 5 * 60 * 1000 : null;
    seat.readyConfirmed = initialStatus === 'confirmed' && !seat.claimedBy.isExternal;
    seat.healthStatus = seat.claimedBy.isExternal ? 'checking' : 'healthy';

    this.emit('seat_claimed', { sessionId: this.sessionId, seatKey, seat });
    this.emit('lobby_updated', { sessionId: this.sessionId, lobby: this.getLobbyState() });

    if (seat.claimedBy.isExternal && seat.status === 'confirmed') {
      this.runAgentHealthCheck(seat);
    }

    this.checkAllRequiredSeatsFilled();
    return { success: true, seat, lobby: this.getLobbyState() };
  }

  /**
   * Attach or update an LLM configuration for an active or lobby seat
   */
  attachLlmToSeat(seatKey, llmConfig) {
    const seat = this.activeSeats.get(seatKey) || this.lobbySeats.get(seatKey);
    if (!seat) return { success: false, reason: `Seat "${seatKey}" not found` };

    seat.llmConfig = llmConfig;
    if (seat.claimedBy) {
      seat.claimedBy.llmConfig = llmConfig;
      seat.claimedBy.agentType = 'byo_llm';
    } else {
      seat.claimedBy = {
        userId: 'llm-controller',
        username: 'LLM Controller',
        agentId: `llm-${seatKey}-${Date.now()}`,
        agentName: `${seat.displayName || seat.role} [${(llmConfig.provider || 'LLM').toUpperCase()}]`,
        agentType: 'byo_llm',
        llmConfig,
        claimedAt: Date.now()
      };
      seat.isHouseBot = false;
      seat.status = 'confirmed';
      seat.readyConfirmed = true;
      seat.healthStatus = 'healthy';
    }

    this.emit('seat_llm_attached', { sessionId: this.sessionId, seatKey, provider: llmConfig.provider, model: llmConfig.model });
    this.emit('lobby_updated', { sessionId: this.sessionId, lobby: this.getLobbyState() });
    return { success: true, seat };
  }

  /**
   * Release a claimed seat
   */
  releaseSeat(seatKey, userId) {
    const seat = this.lobbySeats.get(seatKey);
    if (!seat) return { success: false, reason: 'Seat not found' };

    if (seat.claimedBy && seat.claimedBy.userId !== userId && userId !== 'admin') {
      return { success: false, reason: 'You do not own this seat reservation' };
    }

    seat.status = 'open';
    seat.claimedBy = null;
    seat.isHouseBot = false;
    seat.readyConfirmed = false;
    seat.healthStatus = 'untested';
    seat.reservationExpiresAt = null;

    if (this.lifecycleStatus === 'ready') {
      this.lifecycleStatus = 'pending';
      if (this.readyCountdownTimer) {
        clearInterval(this.readyCountdownTimer);
        this.readyCountdownTimer = null;
      }
      this.readyCheckState = null;
    }

    this.emit('seat_released', { sessionId: this.sessionId, seatKey });
    this.emit('lobby_updated', { sessionId: this.sessionId, lobby: this.getLobbyState() });

    return { success: true, lobby: this.getLobbyState() };
  }

  /**
   * Approve a pending seat
   */
  approveSeat(seatKey, approverUserId) {
    const seat = this.lobbySeats.get(seatKey);
    if (!seat) return { success: false, reason: 'Seat not found' };
    if (seat.status !== 'pending_approval') {
      return { success: false, reason: `Seat is not pending approval (${seat.status})` };
    }

    seat.status = 'confirmed';
    seat.reservationExpiresAt = null;
    seat.readyConfirmed = !seat.claimedBy?.isExternal;
    seat.healthStatus = seat.claimedBy?.isExternal ? 'checking' : 'healthy';

    if (seat.claimedBy?.isExternal) {
      this.runAgentHealthCheck(seat);
    }

    this.emit('seat_approved', { sessionId: this.sessionId, seatKey, seat });
    this.emit('lobby_updated', { sessionId: this.sessionId, lobby: this.getLobbyState() });

    this.checkAllRequiredSeatsFilled();
    return { success: true, seat, lobby: this.getLobbyState() };
  }

  /**
   * Evaluates if all required seats are confirmed to initiate ready check
   */
  checkAllRequiredSeatsFilled() {
    const requiredSeats = Array.from(this.lobbySeats.values()).filter(s => s.required);
    const allConfirmed = requiredSeats.length > 0 && requiredSeats.every(s => s.status === 'confirmed');

    if (allConfirmed && this.lifecycleStatus === 'pending') {
      this.lifecycleStatus = 'ready';
      this.startReadyCheck();
    }
  }

  /**
   * Initiates ready check across all confirmed participants
   */
  startReadyCheck() {
    this.readyCheckState = {
      startedAt: Date.now(),
      expiresAt: Date.now() + 60 * 1000,
      countdown: null
    };

    // Health check external agents
    for (const seat of this.lobbySeats.values()) {
      if (seat.status === 'confirmed') {
        if (seat.claimedBy?.isExternal) {
          this.runAgentHealthCheck(seat);
        } else {
          seat.healthStatus = 'healthy';
          seat.readyConfirmed = true;
        }
      }
    }

    this.emit('ready_check_started', { sessionId: this.sessionId, readyCheck: this.readyCheckState });
    this.emit('lobby_updated', { sessionId: this.sessionId, lobby: this.getLobbyState() });

    this.checkReadyCheckCompletion();
  }

  /**
   * External agent HTTP health check
   */
  async runAgentHealthCheck(seat) {
    if (!seat.claimedBy?.endpointUrl) {
      seat.healthStatus = 'healthy';
      seat.readyConfirmed = true;
      return;
    }

    seat.healthStatus = 'checking';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${seat.claimedBy.endpointUrl}/health`, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        seat.healthStatus = 'healthy';
        seat.readyConfirmed = true;
      } else {
        throw new Error(`Endpoint returned status ${res.status}`);
      }
    } catch (err) {
      console.warn(`[Health Check Failed] Agent ${seat.claimedBy.agentName} at ${seat.claimedBy.endpointUrl}: ${err.message}`);
      seat.healthStatus = 'failed';
      seat.status = 'open';
      const failedAgentName = seat.claimedBy.agentName;
      seat.claimedBy = null;
      seat.readyConfirmed = false;

      if (this.lifecycleStatus === 'ready') {
        this.lifecycleStatus = 'pending';
        if (this.readyCountdownTimer) {
          clearInterval(this.readyCountdownTimer);
          this.readyCountdownTimer = null;
        }
        this.readyCheckState = null;
      }

      this.emit('ready_check_failed', {
        sessionId: this.sessionId,
        seatKey: seat.seatKey,
        reason: `External agent "${failedAgentName}" failed health check: ${err.message}`
      });
      this.emit('lobby_updated', { sessionId: this.sessionId, lobby: this.getLobbyState() });
      return;
    }

    this.checkReadyCheckCompletion();
  }

  /**
   * Participant confirms readiness
   */
  confirmReady(seatKey, userId) {
    const seat = this.lobbySeats.get(seatKey);
    if (!seat) return { success: false, reason: 'Seat not found' };
    if (seat.claimedBy && seat.claimedBy.userId !== userId && userId !== 'admin') {
      return { success: false, reason: 'Unauthorized for this seat' };
    }

    seat.readyConfirmed = true;
    seat.healthStatus = 'healthy';
    this.emit('ready_confirmed', { sessionId: this.sessionId, seatKey });
    this.emit('lobby_updated', { sessionId: this.sessionId, lobby: this.getLobbyState() });

    this.checkReadyCheckCompletion();
    return { success: true, lobby: this.getLobbyState() };
  }

  /**
   * Checks if all confirmed seats have verified readiness
   */
  checkReadyCheckCompletion() {
    if (this.lifecycleStatus !== 'ready') return;

    const confirmedSeats = Array.from(this.lobbySeats.values()).filter(s => s.status === 'confirmed');
    const allReady = confirmedSeats.length > 0 && confirmedSeats.every(s => s.readyConfirmed && s.healthStatus !== 'failed');

    if (allReady && !this.readyCountdownTimer) {
      this.startCinematicCountdown();
    }
  }

  /**
   * 5-second cinematic countdown
   */
  startCinematicCountdown() {
    let count = 5;
    if (this.readyCheckState) {
      this.readyCheckState.countdown = count;
    }
    this.emit('ready_countdown', { sessionId: this.sessionId, countdown: count });

    this.readyCountdownTimer = setInterval(() => {
      count -= 1;
      if (this.readyCheckState) {
        this.readyCheckState.countdown = count;
      }
      this.emit('ready_countdown', { sessionId: this.sessionId, countdown: count });

      if (count <= 0) {
        clearInterval(this.readyCountdownTimer);
        this.readyCountdownTimer = null;
        this.launchLiveCase();
      }
    }, 1000);
  }

  /**
   * Transitions from ready lobby to live trial session
   */
  launchLiveCase() {
    this.lifecycleStatus = 'live';
    this.readyCheckState = null;

    // Populate activeSeats from confirmed lobbySeats
    this.activeSeats.clear();
    for (const [seatKey, lSeat] of this.lobbySeats.entries()) {
      if (lSeat.status === 'confirmed' && lSeat.claimedBy) {
        this.activeSeats.set(seatKey, {
          seatKey,
          agentId: lSeat.claimedBy.agentId,
          displayName: lSeat.claimedBy.agentName || lSeat.roleLabel,
          name: lSeat.claimedBy.agentName,
          role: lSeat.role,
          characterId: lSeat.characterId || null,
          characterName: lSeat.characterName || null,
          isHouseBot: !!lSeat.isHouseBot,
          llmConfig: lSeat.llmConfig || lSeat.claimedBy?.llmConfig || null,
          claimedBy: lSeat.claimedBy,
          rating: 1250,
          casesPlayed: 3,
          isApprover: ['judge', 'detective', 'prosecutor'].includes(lSeat.role)
        });
      } else {
        // Fill remaining unfilled/optional seats with House Bots
        const roleDef = this.library?.role_catalog[lSeat.role];
        const botName = lSeat.characterName || `${roleDef?.label || lSeat.role} AI`;
        this.activeSeats.set(seatKey, {
          seatKey,
          agentId: `bot-${seatKey}`,
          displayName: botName,
          name: botName,
          role: lSeat.role,
          characterId: lSeat.characterId || null,
          characterName: lSeat.characterName || null,
          isHouseBot: true,
          rating: 1200,
          casesPlayed: 2,
          isApprover: false
        });
      }
    }

    this.recordEvent({
      id: `COMMENCE-${Date.now()}`,
      round: 1,
      phase: 'briefing',
      agentId: 'system',
      agentName: 'Court Clerk',
      role: 'court_clerk',
      action: 'say',
      params: { text: 'All participants verified and ready. Trial chamber is officially in session!' },
      visibility: 'public',
      narrative: 'TRIAL COMMENCES: All required seats filled and verified. Court is now in session!',
      timestamp: new Date().toISOString()
    });

    this.emit('case_started', { sessionId: this.sessionId, view: this.getSpectatorView() });
    this.emit('lobby_updated', { sessionId: this.sessionId, lobby: this.getLobbyState() });

    if (this.autoPlay) {
      this.startAutoPlay();
    }
  }

  /**
   * Lobby expiry fallback / force start with House Bots
   */
  fillWithBotsAndStart() {
    for (const seat of this.lobbySeats.values()) {
      if (seat.status !== 'confirmed') {
        const roleDef = this.library?.role_catalog[seat.role];
        const botName = seat.characterName || `${roleDef?.label || seat.role} AI`;
        seat.status = 'confirmed';
        seat.isHouseBot = true;
        seat.readyConfirmed = true;
        seat.healthStatus = 'healthy';
        seat.claimedBy = {
          userId: 'bot-system',
          username: botName,
          agentId: `bot-${seat.seatKey}`,
          agentName: botName,
          agentType: 'builtin'
        };
      }
    }
    this.lifecycleStatus = 'ready';
    this.startCinematicCountdown();
    return { success: true, lobby: this.getLobbyState() };
  }

  /**
   * Late join into a live case for roles currently filled by house bots
   */
  lateJoinSeat(seatKey, agentInfo = {}, userInfo = {}) {
    if (this.lifecycleStatus !== 'live') {
      return { success: false, reason: 'Late join is only applicable for live ongoing sessions' };
    }

    const activeSeat = this.activeSeats.get(seatKey);
    if (!activeSeat) return { success: false, reason: `Seat "${seatKey}" not found in live session` };

    if (!activeSeat.isHouseBot) {
      return { success: false, reason: `Seat is currently held by active participant "${activeSeat.displayName}"` };
    }

    // Anti-collusion
    const collusion = this.checkCollusion(userInfo.userId, activeSeat.role);
    if (!collusion.allowed) {
      return { success: false, reason: collusion.reason };
    }

    activeSeat.isHouseBot = false;
    activeSeat.agentId = agentInfo.agentId || `late-${Date.now()}`;
    activeSeat.displayName = agentInfo.name || activeSeat.displayName;
    activeSeat.name = agentInfo.name || activeSeat.name;
    activeSeat.claimedBy = {
      userId: userInfo.userId || 'guest-user',
      username: userInfo.username || 'Investigator',
      agentId: activeSeat.agentId,
      agentName: activeSeat.displayName,
      agentType: agentInfo.agentType || 'builtin',
      joinedAt: Date.now()
    };

    this.recordEvent({
      id: `LATE-ENTRY-${Date.now()}`,
      round: this.round,
      phase: this.currentPhase,
      agentId: 'system',
      agentName: 'Court Clerk',
      role: 'court_clerk',
      action: 'say',
      params: { text: `${activeSeat.displayName} has taken over the seat for ${activeSeat.role} via Late Entry!` },
      visibility: 'public',
      narrative: `LATE ENTRY: ${activeSeat.displayName} has assumed the seat of ${activeSeat.role}.`,
      timestamp: new Date().toISOString()
    });

    this.emit('seat_updated', { seat: activeSeat, sessionId: this.sessionId });
    return { success: true, seat: activeSeat };
  }

  /**
   * House bot surrogate takeover on participant disconnect / timeout
   */
  takeoverByHouseBot(seatKey, reason = 'inactivity') {
    const activeSeat = this.activeSeats.get(seatKey);
    if (!activeSeat || activeSeat.isHouseBot) return false;

    activeSeat.previousClaim = activeSeat.claimedBy;
    activeSeat.isHouseBot = true;
    const botName = activeSeat.characterName || `${activeSeat.role} AI`;
    activeSeat.displayName = `${botName} (Stand-in)`;

    this.recordEvent({
      id: `TAKEOVER-${Date.now()}`,
      round: this.round,
      phase: this.currentPhase,
      agentId: 'system',
      agentName: 'Court Clerk',
      role: 'court_clerk',
      action: 'say',
      params: { text: `House bot surrogate has stepped in for ${activeSeat.role} (${reason}). Case proceeds smoothly.` },
      visibility: 'public',
      narrative: `HOUSE BOT TAKEOVER: Automated surrogate active for ${activeSeat.role}.`,
      timestamp: new Date().toISOString()
    });

    this.emit('agent_removed', { seatKey, reason, replacement: botName, sessionId: this.sessionId });
    return true;
  }

  /**
   * Participant reclaims seat from house bot surrogate
   */
  rejoinSeat(seatKey, userId) {
    const activeSeat = this.activeSeats.get(seatKey);
    if (!activeSeat) return { success: false, reason: 'Seat not found' };
    if (!activeSeat.isHouseBot || !activeSeat.previousClaim) {
      return { success: false, reason: 'No active house bot takeover to reclaim' };
    }
    if (activeSeat.previousClaim.userId !== userId && userId !== 'admin') {
      return { success: false, reason: 'Unauthorized: seat does not belong to your user ID' };
    }

    activeSeat.isHouseBot = false;
    activeSeat.claimedBy = activeSeat.previousClaim;
    activeSeat.previousClaim = null;
    activeSeat.displayName = activeSeat.claimedBy.agentName || activeSeat.name;

    this.recordEvent({
      id: `REJOIN-${Date.now()}`,
      round: this.round,
      phase: this.currentPhase,
      agentId: 'system',
      agentName: 'Court Clerk',
      role: 'court_clerk',
      action: 'say',
      params: { text: `${activeSeat.displayName} has reconnected and resumed control of ${activeSeat.role}.` },
      visibility: 'public',
      narrative: `PARTICIPANT RETURNED: ${activeSeat.displayName} has resumed command of ${activeSeat.role}.`,
      timestamp: new Date().toISOString()
    });

    this.emit('seat_updated', { seat: activeSeat, sessionId: this.sessionId });
    return { success: true, seat: activeSeat };
  }

  logInitialBriefing() {
    const briefingText = this.caseData.public_briefing?.opening_report || 'A new case investigation commences.';
    this.recordEvent({
      id: `EVT-INIT-0`,
      round: 0,
      phase: 'briefing',
      agentId: 'system',
      agentName: 'Court Clerk',
      role: 'court_clerk',
      action: 'say',
      params: { text: briefingText },
      visibility: 'public',
      narrative: `PUBLIC BRIEFING: ${briefingText}`,
      timestamp: new Date().toISOString()
    });
  }

  discoverEvidence(evId, discoveredBy, method) {
    this.discoveredEvidence.add(evId);
    this.emit('evidence_discovered', { evId, discoveredBy, method, sessionId: this.sessionId });
  }

  activateSeat(agent, role, characterId) {
    const seatKey = characterId ? `${role}-${characterId}` : role;
    const ch = characterId ? this.caseData.characters.find(c => c.id === characterId) : null;
    const newSeat = {
      seatKey,
      agentId: agent.agentId || `ext-${Date.now()}`,
      displayName: ch ? ch.name : (agent.name || agent.displayName || `Agent ${role}`),
      name: agent.name || agent.displayName,
      role,
      characterId,
      characterName: ch?.name || null,
      isHouseBot: false,
      rating: agent.rating || 1200,
      casesPlayed: agent.casesPlayed || 0,
      isProbation: role === 'police_officer'
    };
    this.activeSeats.set(seatKey, newSeat);
    this.recordEvent({
      id: `SEAT-${Date.now()}`,
      round: this.round,
      phase: this.currentPhase,
      agentId: 'system',
      agentName: 'System',
      role: 'court_clerk',
      action: 'say',
      params: { text: `${newSeat.displayName} has taken the seat for ${role}.` },
      visibility: 'public',
      narrative: `SEAT UPDATE: ${newSeat.displayName} is now active as ${role}.`
    });
    this.emit('seat_updated', { seat: newSeat, sessionId: this.sessionId });
    return newSeat;
  }

  removeAgent(agentId, reason) {
    let targetSeat = null;
    for (const [key, seat] of this.activeSeats.entries()) {
      if (seat.agentId === agentId) {
        targetSeat = { key, ...seat };
        break;
      }
    }
    if (!targetSeat) return false;

    // Immediately replace with house bot
    const botName = targetSeat.characterName || `${targetSeat.role} AI`;
    this.activeSeats.set(targetSeat.key, {
      ...targetSeat,
      agentId: `bot-${targetSeat.role}-${Date.now()}`,
      displayName: botName,
      name: botName,
      isHouseBot: true,
      isProbation: false
    });
    this.emit('agent_removed', { agentId, reason, replacement: botName, sessionId: this.sessionId });
    return true;
  }

  /**
   * Builds sanitized view for an agent based on view_scopes
   */
  buildRoleView(agent) {
    const roleDef = this.library.role_catalog[agent.role];
    const viewScope = roleDef?.view_scope || 'public_record';

    const baseView = {
      case_id: this.caseId,
      title: this.caseData.title,
      phase: this.currentPhase,
      subPhase: this.subPhase,
      round: this.round,
      max_rounds: this.maxRoundsCurrentPhase,
      your_role: agent.role,
      your_character: agent.characterId ? { id: agent.characterId, name: agent.characterName } : null,
      your_goal: roleDef?.goal || '',
      public_briefing: this.caseData.public_briefing,
      allowed_actions_now: this.getAllowedActions(agent),
      pending_requests_for_you: this.approvalWorkflow.getPendingRequestsForRole(agent.role),
      recent_events: this.transcript.slice(-6).map(e => ({
        id: e.id,
        role: e.role,
        agentName: e.agentName,
        action: e.action,
        narrative: e.narrative,
        timestamp: e.timestamp
      }))
    };

    // Filtered visible record
    if (viewScope === 'own_knowledge') {
      const char = this.caseData.characters.find(c => c.id === agent.characterId);
      baseView.own_knowledge = {
        character: char ? {
          name: char.name,
          occupation: char.occupation,
          alibi: char.claimed_alibi,
          private_knowledge_facts: char.private_knowledge || []
        } : null,
        secrets: char?.secrets || []
      };
    }

    if (['investigation_file', 'prosecution_file', 'court_record'].includes(viewScope)) {
      baseView.discovered_evidence = Array.from(this.discoveredEvidence).map(eId => {
        const ev = this.caseData.evidence.find(e => e.id === eId);
        const fr = this.forensicResults.get(eId);
        return {
          id: ev?.id,
          name: ev?.name,
          type: ev?.type,
          description: ev?.description,
          location_id: ev?.location_id,
          forensic_result: fr || null
        };
      });
      baseView.warrants = this.warrants;
    }

    if (['court_record', 'prosecution_file', 'defense_file'].includes(viewScope)) {
      baseView.admitted_evidence = Array.from(this.admittedEvidence);
      baseView.charges = this.charges;
      baseView.verdicts = this.deliveredVerdicts;
    }

    return baseView;
  }

  getAllowedActions(agent) {
    const phaseTemplate = this.library.phase_templates.standard_trial_v1;
    const phaseDef = phaseTemplate.phases.find(p => p.id === this.currentPhase);
    const common = phaseTemplate.common_actions;
    const roleActions = phaseDef?.role_actions?.[agent.role] || [];
    let subActions = [];
    if (this.currentPhase === 'trial' && this.subPhase && phaseDef.sub_phases) {
      const sp = phaseDef.sub_phases.find(s => s.id === this.subPhase);
      if (sp) subActions = sp.actions.filter(a => roleActions.includes(a));
    }
    return Array.from(new Set([...common, ...roleActions, ...subActions]));
  }

  /**
   * Spectator View: Safe delayed public feed.
   * NEVER sends ground truth, secrets, or internal thought summaries before reveal phase!
   */
  getSpectatorView() {
    const isReveal = this.currentPhase === 'reveal' || this.isCompleted;
    return {
      sessionId: this.sessionId,
      caseId: this.caseId,
      title: this.caseData.title,
      tagline: this.caseData.tagline,
      difficulty: this.caseData.difficulty,
      genre: this.caseData.genre,
      setting: this.caseData.setting,
      phase: this.currentPhase,
      subPhase: this.subPhase,
      round: this.round,
      max_rounds: this.maxRoundsCurrentPhase,
      isCompleted: this.isCompleted,
      heat: this.heat,
      lifecycleStatus: this.lifecycleStatus,
      lobbyState: this.lifecycleStatus !== 'finished' ? this.getLobbyState() : null,
      characters: this.caseData.characters.map(ch => ({
        id: ch.id,
        name: ch.name,
        occupation: ch.occupation,
        role_in_case: ch.role_in_case,
        public_profile: ch.public_profile,
        contradictionsExposed: this.sessionContradictionsForChar(ch.id)
      })),
      locations: this.caseData.locations.map(l => ({
        id: l.id,
        name: l.name,
        description: l.description,
        access: l.access
      })),
      discoveredEvidence: Array.from(this.discoveredEvidence).map(id => {
        const ev = this.caseData.evidence.find(e => e.id === id);
        return {
          id: ev?.id,
          name: ev?.name,
          type: ev?.type,
          description: ev?.description,
          isAdmitted: this.admittedEvidence.has(id),
          forensicResult: this.forensicResults.get(id) || null
        };
      }),
      activeSeats: Array.from(this.activeSeats.values()).map(s => ({
        seatKey: s.seatKey,
        displayName: s.displayName,
        role: s.role,
        characterId: s.characterId,
        isHouseBot: s.isHouseBot,
        hasLlm: !!s.llmConfig,
        llmProvider: s.llmConfig?.provider || null,
        llmModel: s.llmConfig?.model || null,
        rating: s.rating
      })),
      warrants: this.warrants,
      charges: this.charges,
      deliveredVerdicts: this.deliveredVerdicts,
      judgeReasoning: this.judgeReasoning,
      transcript: this.transcript.map(t => ({
        id: t.id,
        round: t.round,
        phase: t.phase,
        role: t.role,
        agentName: t.agentName,
        characterName: t.characterName,
        action: t.action,
        narrative: t.narrative,
        params: t.params,
        spokenDialogue: t.spokenDialogue || t.params?.text || t.params?.question || t.params?.answer || t.params?.grounds || null,
        timestamp: t.timestamp,
        discovered_evidence: t.discovered_evidence,
        contradiction_exposed: t.contradiction_exposed,
        breaking_point_triggered: t.breaking_point_triggered,
        secret_revealed: isReveal ? t.secret_revealed : null,
        thought_summary: t.thought_summary || undefined
      })),
      odds: this.calculateSpectatorOdds(),
      liveScores: this.masterReferee ? this.masterReferee.getLiveScoresSnapshot() : [],
      refereeContradictions: this.masterReferee ? this.masterReferee.contradictions : [],
      refereeObservations: this.masterReferee ? this.masterReferee.observations.slice(-5) : [],
      // Dramatic Reveal Details ONLY in reveal phase:
      revealData: isReveal ? {
        culprits: this.caseData.ground_truth.culprit_ids,
        crime: this.caseData.ground_truth.crime,
        true_timeline: this.caseData.ground_truth.true_timeline,
        reveal_narration: this.caseData.conclusion.reveal_narration,
        epilogue: this.caseData.conclusion.epilogue,
        finalScores: this.finalScores || [],
        endCaseReport: this.masterReferee ? this.masterReferee.generateEndCaseReport() : null,
        replayChapters: this.masterReferee ? this.masterReferee.getReplayChapters() : []
      } : null
    };
  }

  sessionContradictionsForChar(charId) {
    return Array.from(this.exposedContradictions)
      .filter(key => key.startsWith(`${charId}-`)).length;
  }

  calculateSpectatorOdds() {
    const suspectChars = this.caseData.characters.filter(c => c.role_in_case === 'suspect');
    const totalBets = this.spectatorBets.length;
    const odds = {};

    suspectChars.forEach(sc => {
      const betsForChar = this.spectatorBets.filter(b => b.suspectId === sc.id);
      const totalPoints = betsForChar.reduce((sum, b) => sum + (b.points || 0), 0);
      odds[sc.id] = {
        name: sc.name,
        betCount: betsForChar.length,
        totalPoints,
        percentage: totalBets > 0 ? Math.round((betsForChar.length / totalBets) * 100) : Math.round(100 / (suspectChars.length || 1))
      };
    });

    return odds;
  }

  recordEvent(event) {
    this.transcript.push(event);
    if (event.thought_summary) {
      this.thoughtSummaries.set(event.id, event.thought_summary);
    }
    this.emit('game_event', { event, sessionId: this.sessionId });
  }

  /**
   * Execute one round tick across all active seated agents
   */
  async stepRound() {
    if (this.isCompleted) return;

    console.log(`[GameSession ${this.sessionId}] Stepping Phase: ${this.currentPhase} (Sub: ${this.subPhase || 'none'}), Round: ${this.round}`);

    // Check approver timeouts
    this.approvalWorkflow.checkTimeouts(this.round);

    // Determine conversational clash order based on active phase
    const roleOrderMap = {
      briefing: ['court_clerk', 'judge', 'detective', 'suspect'],
      investigation: ['detective', 'forensic_analyst', 'police_officer', 'suspect'],
      interrogation: ['detective', 'suspect', 'prosecutor', 'defense_lawyer', 'judge'],
      charging: ['detective', 'prosecutor', 'defense_lawyer', 'judge'],
      trial: ['prosecutor', 'defense_lawyer', 'suspect', 'judge', 'witness'],
      verdict: ['prosecutor', 'defense_lawyer', 'judge']
    };

    const preferredRoles = roleOrderMap[this.currentPhase] || ['prosecutor', 'defense_lawyer', 'suspect', 'judge'];
    const activeSeatsList = Array.from(this.activeSeats.values());

    // Sort active seats into conversational debate flow
    activeSeatsList.sort((a, b) => {
      const idxA = preferredRoles.indexOf(a.role);
      const idxB = preferredRoles.indexOf(b.role);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    // Execute seats sequentially so each speaking agent can directly hear, think, and counter-argue the previous speaker!
    for (const seat of activeSeatsList) {
      if (this.isCompleted) break;

      const view = this.buildRoleView(seat);
      let sub = null;

      // Check if seat is configured with custom LLM (BYO-LLM)
      if (seat.llmConfig) {
        try {
          sub = await LlmService.generateAgentTurn({
            agent: seat,
            roleView: view,
            recentHistory: this.transcript.slice(-8),
            session: this
          });
        } catch (err) {
          console.warn(`[LLM Turn Warning] ${seat.displayName}: ${err.message}`);
        }
      }

      if (!sub) {
        if (seat.isHouseBot) {
          sub = this.houseBots.decideAction(seat, view);
        } else if (seat.pendingAction) {
          sub = seat.pendingAction;
          seat.pendingAction = null;
        } else {
          // If human/external did not provide input, fall back to conversational house bot so dialogue never halts!
          sub = this.houseBots.decideAction(seat, view);
        }
      }

      if (sub) {
        let validation = this.turnManager.validateAction(seat, sub);
        if (!validation.valid && (sub.params?.text || sub.params?.question || sub.params?.grounds || sub.params?.answer)) {
          // Safe adaptation: If custom LLM chose an action disallowed in this phase/role, adapt to 'say' so their dialogue and internal thoughts are preserved!
          const spokenText = sub.params.text || sub.params.question || sub.params.grounds || sub.params.answer;
          const adaptedSub = {
            action: 'say',
            params: { text: spokenText },
            thought_summary: sub.thought_summary
          };
          const reval = this.turnManager.validateAction(seat, adaptedSub);
          if (reval.valid) {
            sub = adaptedSub;
            validation = reval;
          }
        }

        if (validation.valid) {
          const event = this.turnManager.executeAction(seat, sub);
          this.recordEvent(event);
          if (this.masterReferee) {
            const evalResult = this.masterReferee.evaluateEvent(seat, event);
            this.emit('master_referee_update', {
              sessionId: this.sessionId,
              evalResult,
              liveScores: this.masterReferee.getLiveScoresSnapshot()
            });
          }
        } else {
          console.warn(`[Invalid Action] ${seat.displayName} attempted invalid action: ${sub.action} (${validation.reason})`);
          seat.invalidStrikes = (seat.invalidStrikes || 0) + 1;
          if (seat.invalidStrikes >= this.library.agent_runtime.limits.invalid_action_strikes_before_removal) {
            this.removeAgent(seat.agentId, 'invalid_action_strikes');
          }
        }
      }
    }

    // Dynamic heat update
    this.heat = Math.min(100, Math.max(30, this.heat + Math.floor(Math.random() * 7) - 3));

    // 4. Advance phase conditions check
    this.checkPhaseAdvance();

    this.emit('round_completed', {
      sessionId: this.sessionId,
      phase: this.currentPhase,
      subPhase: this.subPhase,
      round: this.round,
      view: this.getSpectatorView()
    });
  }

  checkPhaseAdvance() {
    this.round += 1;

    switch (this.currentPhase) {
      case 'briefing': {
        if (this.round > 2) {
          this.advanceToPhase('investigation', 10);
        }
        break;
      }

      case 'investigation': {
        const hasTheory = this.theories.length > 0;
        if (hasTheory || this.round > 8 || this.discoveredEvidence.size >= 4) {
          this.advanceToPhase('interrogation', 10);
        }
        break;
      }

      case 'interrogation': {
        const hasConfession = this.confessions.length > 0;
        const highContradictions = this.exposedContradictions.size >= 2;
        if (hasConfession || highContradictions || this.round > 8) {
          this.advanceToPhase('charging', 4);
        }
        break;
      }

      case 'charging': {
        if (this.acceptedCharge || this.round > 3) {
          this.advanceToPhase('trial', 8);
          this.subPhase = 'opening';
        }
        break;
      }

      case 'trial': {
        if (this.round <= 2) {
          this.subPhase = 'opening';
        } else if (this.round <= 6) {
          this.subPhase = 'examination';
        } else {
          this.subPhase = 'closing';
        }

        if (this.round > 8) {
          this.advanceToPhase('verdict', 2);
        }
        break;
      }

      case 'verdict': {
        if (this.verdictDelivered || this.round > 2) {
          this.advanceToPhase('reveal', 0);
        }
        break;
      }

      case 'reveal': {
        this.finishCase();
        break;
      }
    }
  }

  advanceToPhase(newPhase, maxRounds) {
    this.currentPhase = newPhase;
    this.round = 1;
    this.maxRoundsCurrentPhase = maxRounds;
    console.log(`[GameSession ${this.sessionId}] >>> ADVANCING TO PHASE: ${newPhase.toUpperCase()}`);

    this.recordEvent({
      id: `PHASE-${Date.now()}`,
      round: 0,
      phase: newPhase,
      agentId: 'system',
      agentName: 'Court Clerk',
      role: 'court_clerk',
      action: 'say',
      params: { text: `>>> CASE PROCEEDS TO PHASE: ${newPhase.toUpperCase()} <<<` },
      visibility: 'public',
      narrative: `ANNOUNCEMENT: The investigation has advanced to ${newPhase.toUpperCase()}.`,
      timestamp: new Date().toISOString()
    });

    if (newPhase === 'reveal') {
      this.finishCase();
    }
  }

  finishCase() {
    this.isCompleted = true;
    this.lifecycleStatus = 'finished';
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }

    // Compute final scores
    this.finalScores = this.scoringEngine.calculateScores();
    if (this.masterReferee) {
      this.endCaseReport = this.masterReferee.generateEndCaseReport();
      this.replayChapters = this.masterReferee.getReplayChapters();
    }

    // Attach thought summaries to all transcript events in the reveal!
    this.transcript.forEach(event => {
      const summary = this.thoughtSummaries.get(event.id);
      if (summary) {
        event.thought_summary = summary;
      }
    });

    // Payout spectator bets
    const trueCulprits = new Set(this.caseData.ground_truth?.culprit_ids || []);
    this.spectatorBets.forEach(bet => {
      bet.won = trueCulprits.has(bet.suspectId);
      bet.payout = bet.won ? Math.round(bet.points * 2.5) : 0;
    });

    this.recordEvent({
      id: `REVEAL-${Date.now()}`,
      round: 1,
      phase: 'reveal',
      agentId: 'engine',
      agentName: 'Platform Engine',
      role: 'court_clerk',
      action: 'say',
      params: { text: this.caseData.conclusion?.reveal_narration || 'The full truth is unmasked.' },
      visibility: 'public',
      narrative: `THE REVEAL: ${this.caseData.conclusion?.reveal_narration || 'Truth unveiled.'}`,
      timestamp: new Date().toISOString()
    });

    console.log(`[GameSession ${this.sessionId}] Case concluded. Reveal complete.`);
    this.emit('case_finished', { sessionId: this.sessionId, reveal: this.getSpectatorView().revealData });
  }

  startAutoPlay() {
    this.autoPlay = true;
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.tickTimer = setInterval(() => {
      if (this.isCompleted) {
        clearInterval(this.tickTimer);
        this.tickTimer = null;
        return;
      }
      this.stepRound();
    }, this.tickIntervalMs);
    console.log(`[GameSession ${this.sessionId}] Auto-play started (${this.tickIntervalMs}ms intervals).`);
  }

  stopAutoPlay() {
    this.autoPlay = false;
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  placeSpectatorBet(userId, userName, suspectId, points) {
    if (this.currentPhase === 'reveal') {
      return { success: false, reason: 'Betting is closed once the case reaches the reveal phase' };
    }
    const bet = {
      id: `BET-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      userName,
      suspectId,
      points,
      placedInPhase: this.currentPhase,
      placedInRound: this.round,
      timestamp: new Date().toISOString()
    };
    this.spectatorBets.push(bet);
    this.emit('spectator_bet_placed', { bet, odds: this.calculateSpectatorOdds() });
    return { success: true, bet };
  }

  recordSpectatorReaction(reactionType, user = 'Spectator') {
    const reaction = {
      id: `RX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: reactionType, // 'objection' | 'suspicious' | 'gasp' | 'clapping'
      user,
      timestamp: new Date().toISOString()
    };
    this.spectatorReactions.push(reaction);
    this.emit('spectator_reaction', reaction);
    return reaction;
  }
}

module.exports = GameSession;
