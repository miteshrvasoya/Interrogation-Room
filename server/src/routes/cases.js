const express = require('express');
const router = express.Router();

module.exports = function (caseLoader, sessionManager) {
  // Built-in battle templates for instant creation
  const CASE_TEMPLATES = [
    {
      id: 'tpl-cyber-heist',
      title: 'The Cyber-Vault Poisoning',
      tagline: 'A biotech billionaire killed in his biometric vault with scrambled access logs.',
      genre: ['cyberpunk', 'locked-room', 'poisoning'],
      difficulty: 3,
      victim_name: 'Darius Thorne',
      victim_occupation: 'Quantum Biotech Founder',
      scene_name: 'The Sub-Level Biometric Vault',
      primary_weapon: 'Tampered Neural Filter & Liquid Cyanide',
      method: 'Cyanide delivered through a modified neuro-inhaler during the automated biometric lockout.',
      suspects: [
        {
          name: 'Dr. Valery Kim',
          occupation: 'Head of Neural Architecture',
          relationship: 'Co-Founder & Chief Scientist',
          claimed_alibi: 'I was in the server cold room running diagnostic regressions on node cluster 4.',
          secret: 'Dr. Kim was covertly transferring proprietary genomic patents to an overseas conglomerate.',
          motive: 'Darius discovered the IP breach and scheduled a tribunal revocation for the following morning.',
          is_culprit: true
        },
        {
          name: 'Cassian Cruz',
          occupation: 'Chief Security Officer',
          relationship: 'Former military contractor & bodyguard',
          claimed_alibi: 'I was verifying perimeter sensors after a brief power dip at 22:10.',
          secret: 'Cassian disabled CCTV sector 3 to conceal an unauthorized meeting with an extortionist.',
          motive: 'Feared being fired and prosecuted for security protocol negligence.',
          is_culprit: false
        },
        {
          name: 'Lyra Vance',
          occupation: 'Venture Capital Partner',
          relationship: 'Lead Investor & Board Member',
          claimed_alibi: 'I was on a private encrypted conference call with the Singapore investment syndicate.',
          secret: 'Lyra’s hedge fund was on the verge of liquidation if Thorne Biotics delayed its public offering.',
          motive: 'Desperate to trigger the posthumous executive takeover clause.',
          is_culprit: false
        }
      ]
    },
    {
      id: 'tpl-blackwood-manor',
      title: 'The Blackwood Masquerade Mystery',
      tagline: 'An eccentric antiquarian poisoned during an autumn masquerade gala behind closed doors.',
      genre: ['vintage-noir', 'locked-room', 'conspiracy'],
      difficulty: 2,
      victim_name: 'Lord Arthur Blackwood',
      victim_occupation: 'Antiquarian & Collector',
      scene_name: 'The East Wing Gallery',
      primary_weapon: 'Venom-Laced Champagne Flute',
      method: 'Rare belladonna extract dropped into the private toast flute.',
      suspects: [
        {
          name: 'Lady Genevieve Sterling',
          occupation: 'Society Hostess & Beneficiary',
          relationship: 'Estranged half-sister',
          claimed_alibi: 'I was dancing in the main ballroom in plain sight of fifty guests.',
          secret: 'Genevieve was deeply in debt to high-stakes gaming houses and forged Arthur’s signature.',
          motive: 'Arthur informed her she was removed from the hereditary trust.',
          is_culprit: false
        },
        {
          name: 'Mortimer Graves',
          occupation: 'Private Curator',
          relationship: 'Estate archivist',
          claimed_alibi: 'I was in the basement vaults cataloging rare Mesopotamian artifacts.',
          secret: 'Mortimer had been systematically replacing authentic Renaissance relics with master forgeries.',
          motive: 'Arthur ordered an independent British Museum audit that would reveal the fraudulent copies.',
          is_culprit: true
        },
        {
          name: 'Dr. Sebastian Drake',
          occupation: 'Personal Physician',
          relationship: 'Family doctor',
          claimed_alibi: 'I was resting in the smoking parlor after attending to an earlier guest fainting spell.',
          secret: 'Prescribed experimental digitalis compounds beyond regulated dosages.',
          motive: 'Threatened with loss of medical license if malpractice came to light.',
          is_culprit: false
        }
      ]
    },
    {
      id: 'tpl-diplomatic-express',
      title: 'The Midnight Express Assassination',
      tagline: 'A peace envoy found dead in a sealed luxury sleeper carriage speeding through the Alps.',
      genre: ['espionage', 'train-mystery', 'thriller'],
      difficulty: 4,
      victim_name: 'Ambassador Jean-Paul Moreau',
      victim_occupation: 'Senior Diplomatic Envoy',
      scene_name: 'Compartment 7, First Class Carriage',
      primary_weapon: 'Pressurized Micro-Needle Dart',
      method: 'Synthetic paralytic venom discharged through an altered fountain pen.',
      suspects: [
        {
          name: 'Countess Sophia Volkova',
          occupation: 'Cultural Attaché',
          relationship: 'Diplomatic counterpart',
          claimed_alibi: 'I was in the dining car enjoying caviar and speaking with the train conductor.',
          secret: 'Sophia was operating as a covert intelligence courier carrying unredacted border treaties.',
          motive: 'Jean-Paul had threatened to expose her dual loyalties to the supreme council.',
          is_culprit: false
        },
        {
          name: 'Baron Heinrich Von Brandt',
          occupation: 'Arms Consortium Lobbyist',
          relationship: 'Industrial competitor',
          claimed_alibi: 'I was sleeping in Compartment 9 with earplugs and sleeping draught.',
          secret: 'Heinrich had paid massive kickbacks to derail the regional peace accord.',
          motive: 'The peace treaty Moreau was carrying would cancel multi-billion dollar defense contracts.',
          is_culprit: true
        },
        {
          name: 'Yvette Laurent',
          occupation: 'Personal Secretary',
          relationship: 'Chief of Staff',
          claimed_alibi: 'I was transcribing cipher cables in the observation car until 23:00.',
          secret: 'Yvette had sold encrypted copies of the summit itinerary to international journalists.',
          motive: 'Panicked that Jean-Paul discovered the leaked drafts on her typewriter.',
          is_culprit: false
        }
      ]
    }
  ];

  // List all available cases (safe public summaries)
  router.get('/', (req, res) => {
    try {
      const summaries = caseLoader.getPublicCaseSummaries();
      res.json({ success: true, cases: summaries });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get available pre-built templates for fast custom case battles
  router.get('/templates', (req, res) => {
    res.json({ success: true, templates: CASE_TEMPLATES });
  });

  // Create custom case AND immediately launch autonomous agent battle!
  router.post('/create-and-launch', async (req, res) => {
    try {
      const payload = req.body;
      let caseObj = null;

      // 1. If payload specifies a templateId, merge template with custom inputs
      if (payload.templateId) {
        const tpl = CASE_TEMPLATES.find(t => t.id === payload.templateId);
        if (tpl) {
          const merged = { ...tpl, ...payload };
          caseObj = caseLoader.createCaseFromInput(merged);
        }
      }

      // 2. If payload is raw case JSON (has title, roster, ground_truth, etc.)
      if (!caseObj && payload.caseData) {
        caseObj = payload.caseData;
      }

      // 3. If payload has custom fields from custom builder form
      if (!caseObj) {
        caseObj = caseLoader.createCaseFromInput(payload);
      }

      // 4. Validate and ingest case
      const addResult = caseLoader.addCase(caseObj);
      if (!addResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Case validation failed',
          details: addResult.errors
        });
      }

      const caseId = addResult.case_id;

      // 5. Create active GameSession with autoPlay enabled so agents fight autonomously!
      if (!sessionManager) {
        return res.json({ success: true, caseId, message: 'Case created successfully' });
      }

      const session = sessionManager.createSession(caseId, {
        autoPlay: true,
        tickIntervalMs: 3800,
        lifecycleStatus: 'live'
      });

      // Auto-equip agent seats with dual OpenRouter keys & chosen reasoning model
      const key1 = payload.key1 || payload.openRouterKey1 || process.env.KEY_1;
      const key2 = payload.key2 || payload.openRouterKey2 || process.env.KEY_2;
      const chosenModel = payload.model || payload.llmModel || 'recursive/flint-v1.0:free';

      for (const [seatKey, seat] of session.activeSeats.entries()) {
        const isProsecutionOrCourt = ['prosecutor', 'detective', 'judge', 'forensic_examiner'].includes(seat.role);
        const assignedKey = isProsecutionOrCourt ? key1 : key2;
        session.attachLlmToSeat(seatKey, {
          provider: 'openrouter',
          apiKey: assignedKey,
          model: chosenModel,
          temperature: 0.75
        });
      }

      // Step first round and start autoPlay
      await session.stepRound();
      session.startAutoPlay();

      res.json({
        success: true,
        caseId,
        sessionId: session.sessionId,
        title: caseObj.title,
        message: 'Case created and autonomous agent battle launched!'
      });
    } catch (err) {
      console.error('[Cases Route Error] create-and-launch failed:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get specific case public details
  router.get('/:id', (req, res) => {
    try {
      const summaries = caseLoader.getPublicCaseSummaries();
      const c = summaries.find(item => item.case_id === req.params.id);
      if (!c) {
        return res.status(404).json({ success: false, error: 'Case not found' });
      }
      res.json({ success: true, case: c });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Validate a new case file JSON
  router.post('/validate', (req, res) => {
    try {
      const validation = caseLoader.validator.validate(req.body);
      res.json({
        success: true,
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
        summary: validation.summary
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Upload and ingest a new case file
  router.post('/upload', (req, res) => {
    try {
      const result = caseLoader.addCase(req.body);
      if (result.success) {
        res.json({ success: true, message: `Case ${result.case_id} loaded successfully`, case_id: result.case_id });
      } else {
        res.status(400).json({ success: false, errors: result.errors });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};
