const fs = require('fs');
const path = require('path');
const { CASES_PATH, LIBRARY_PATH } = require('../config/constants');
const CaseValidator = require('./Validator');

class CaseLoader {
  constructor(casesPath = CASES_PATH, libraryPath = LIBRARY_PATH) {
    this.casesPath = casesPath;
    this.libraryPath = libraryPath;
    this.validator = new CaseValidator();
    this.library = null;
    this.cases = new Map();
    this.customCasesPath = path.join(path.dirname(this.casesPath), 'custom_cases.json');
    this.loadLibrary();
    this.loadCases();
    this.loadCustomCases();
  }

  loadLibrary() {
    try {
      const raw = fs.readFileSync(this.libraryPath, 'utf8');
      this.library = JSON.parse(raw);
      console.log(`[CaseLoader] Loaded platform library: ${this.library.library_id} v${this.library.format_version}`);
    } catch (err) {
      console.error(`[CaseLoader] Error reading library: ${err.message}`);
      throw err;
    }
  }

  loadCases(filePath = this.casesPath) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      const validation = this.validator.validate(data);
      if (!validation.valid) {
        throw new Error(`Case file validation failed: ${validation.errors.join('; ')}`);
      }

      data.cases.forEach(c => {
        this.cases.set(c.case_id, c);
      });
      console.log(`[CaseLoader] Loaded ${data.cases.length} cases from ${filePath}`);
    } catch (err) {
      console.error(`[CaseLoader] Error loading cases: ${err.message}`);
      throw err;
    }
  }

  loadCustomCases() {
    try {
      if (fs.existsSync(this.customCasesPath)) {
        const raw = fs.readFileSync(this.customCasesPath, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.cases)) {
          data.cases.forEach(c => {
            this.cases.set(c.case_id, c);
          });
          console.log(`[CaseLoader] Loaded ${data.cases.length} custom user cases from ${this.customCasesPath}`);
        }
      }
    } catch (err) {
      console.warn(`[CaseLoader] Could not load custom cases: ${err.message}`);
    }
  }

  saveCustomCases() {
    try {
      const customList = Array.from(this.cases.values()).filter(c => c.case_id.startsWith('CASE-USR-') || c.is_custom);
      const payload = {
        format_version: '1.0',
        library_ref: 'interrogation-room-core',
        cases: customList
      };
      fs.writeFileSync(this.customCasesPath, JSON.stringify(payload, null, 2), 'utf8');
    } catch (err) {
      console.error(`[CaseLoader] Error saving custom cases: ${err.message}`);
    }
  }

  /**
   * Dynamically add/update a case and persist it.
   */
  addCase(caseData) {
    const validation = this.validator.validate(caseData);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }
    const c = caseData.case_id ? caseData : caseData.cases[0];
    c.is_custom = true;
    this.cases.set(c.case_id, c);
    this.saveCustomCases();
    return { success: true, case_id: c.case_id, case: c };
  }

  getNextCaseId() {
    let maxNum = 0;
    for (const key of this.cases.keys()) {
      const match = key.match(/^CASE-(\d{3})$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextNum = Math.min(999, maxNum + 1);
    return `CASE-${String(nextNum).padStart(3, '0')}`;
  }

  /**
   * Helper to construct a 100% schema-valid case from friendly form inputs
   */
  createCaseFromInput(input = {}) {
    const caseId = (input.case_id && /^CASE-\d{3}$/.test(input.case_id)) ? input.case_id : this.getNextCaseId();
    const victimName = input.victim_name || 'Lord Roderick Vance';
    const victimId = 'CH-101';
    const locIdMain = 'LOC-STUDY';
    const locIdSecond = 'LOC-ARCHIVE';

    const rawSuspects = input.suspects && input.suspects.length > 0 ? input.suspects : [
      {
        name: 'Elena Rostova',
        occupation: 'Chief Biochemist',
        relationship: 'Former research partner',
        claimed_alibi: 'I was in the greenhouse cataloging botanical samples all evening.',
        secret: 'Elena had illegally patented Marcus’s synthetic reagent under her own shell company.',
        motive: 'Marcus discovered the intellectual property theft and threatened criminal prosecution.',
        is_culprit: true
      },
      {
        name: 'Julian Hayes',
        occupation: 'Antiquarian & Estate Trustee',
        relationship: 'Financial advisor',
        claimed_alibi: 'I was in the library reviewing the estate trusts and balance sheets until midnight.',
        secret: 'Julian had embezzled $450,000 from the family endowment fund.',
        motive: 'Marcus scheduled an independent audit for the following morning.',
        is_culprit: false
      },
      {
        name: 'Sarah Chen',
        occupation: 'Head of Security',
        relationship: 'Private investigator & security contractor',
        claimed_alibi: 'I was patrolling the southern perimeter wall and monitoring the CCTV feeds.',
        secret: 'Sarah accepted a bribe to disable the courtyard motion sensors between 22:00 and 22:30.',
        motive: 'Feared being implicated in security negligence or blackmail.',
        is_culprit: false
      }
    ];

    const culprit = rawSuspects.find(s => s.is_culprit) || rawSuspects[0];
    culprit.is_culprit = true;

    // Characters list
    const characters = [
      {
        id: victimId,
        name: victimName,
        age: input.victim_age || 54,
        occupation: input.victim_occupation || 'Venture Philanthropist',
        role_in_case: 'victim',
        public_profile: `${victimName} was found deceased under deeply suspicious circumstances.`
      }
    ];

    const rosterSeats = [
      { role: 'judge', min: 1, max: 1, initial_fill: 'house_bot' },
      { role: 'prosecutor', min: 1, max: 1, initial_fill: 'house_bot' },
      { role: 'defense_lawyer', min: 1, max: 4, initial_fill: 'house_bot' },
      { role: 'detective', min: 1, max: 1, initial_fill: 'house_bot' },
      { role: 'police_officer', min: 0, max: 1, initial_fill: 'house_bot' },
      { role: 'forensic_analyst', min: 0, max: 1, initial_fill: 'house_bot' },
      { role: 'court_clerk', min: 1, max: 1, initial_fill: 'house_bot' }
    ];

    const culpritIds = [];

    rawSuspects.forEach((s, idx) => {
      const charNum = 102 + idx;
      const sId = `CH-${charNum}`;
      if (s.is_culprit) culpritIds.push(sId);

      const secId = `SEC-${101 + idx}`;
      const tsId = `TS-${101 + idx}`;
      const fAlibiId = `F-${103 + idx}`;
      const fSecId = `F-${106 + idx}`;

      characters.push({
        id: sId,
        name: s.name,
        age: s.age || (32 + idx * 7),
        occupation: s.occupation || 'Associate',
        role_in_case: 'suspect',
        seat_role: 'suspect',
        public_profile: `${s.name} is a key figure connected to ${victimName}.`,
        relationship_to_victim: s.relationship || 'Associate',
        claimed_alibi: s.claimed_alibi || 'I was elsewhere and had no involvement in this tragedy.',
        secrets: [
          {
            id: secId,
            text: s.secret || `${s.name} concealed vital financial transactions.`,
            reveal_policy: {
              mode: 'on_evidence',
              requires_evidence: ['EV-102']
            }
          }
        ],
        testimony: [
          {
            id: tsId,
            topic: 'whereabouts_evening',
            keywords: ['whereabouts', 'alibi', 'evening', 'timeline', 'door'],
            told_answer: s.claimed_alibi || 'I was entirely elsewhere during the critical hours.',
            honesty: s.is_culprit ? 'lie' : 'truthful',
            truth_fact_ids: [fAlibiId],
            contradicted_by: s.is_culprit ? ['EV-101'] : []
          }
        ],
        private_knowledge: ['F-101', fAlibiId, fSecId],
        behavior: {
          is_culprit: !!s.is_culprit,
          goal: s.is_culprit ? 'Evade prosecution and protect secrets.' : 'Prove innocence under oath.',
          breaking_point: {
            min_exposed_contradictions: 2,
            or_all_evidence: s.is_culprit ? ['EV-101', 'EV-102'] : [],
            effect: s.is_culprit ? 'confess' : 'break_down',
            note: s.is_culprit ? 'Confesses when confronted with forensic proof.' : 'Breaks down in tears.'
          }
        }
      });

      rosterSeats.push({
        role: 'suspect',
        character_id: sId,
        min: 1,
        max: 1,
        initial_fill: 'house_bot'
      });
    });

    // Locations
    const locations = [
      {
        id: locIdMain,
        name: input.scene_name || 'The Private Study',
        description: 'The primary scene of the crime where the victim was discovered.',
        access: { requires_warrant: false },
        hides: ['EV-101', 'EV-102']
      },
      {
        id: locIdSecond,
        name: input.second_location || 'The Conservatory Archive',
        description: 'Adjoining chamber containing research records, digital access panels, and lockboxes.',
        access: { requires_warrant: true },
        hides: ['EV-103', 'EV-104']
      }
    ];

    // Evidence
    const evidence = [
      {
        id: 'EV-101',
        name: input.primary_weapon || 'Altered Digital Keycard & Toxic Residue',
        type: 'physical',
        description: 'Forensic evidence recovered from the primary scene directly refuting the perpetrator’s timeline.',
        location_id: locIdMain,
        points_to: culpritIds,
        supports_fact_ids: ['F-101', 'F-102'],
        reliability: 1.0,
        is_red_herring: false,
        significance: 'Direct physical link placing the accused at the crime scene during the lethal window.',
        discovery: {
          method: 'search_location',
          requires_evidence: [],
          requires_warrant: false,
          actor_roles: ['detective', 'police_officer']
        },
        forensic_result: {
          test_type: 'spectrometry_and_fingerprint',
          finding: `Conclusive fingerprints and chemical reagents matching ${culprit.name}.`,
          result: `Fingerprints and toxic residue match ${culprit.name}.`,
          reveals_fact_ids: ['F-102']
        }
      },
      {
        id: 'EV-102',
        name: 'Fragmented Security Access Log',
        type: 'digital',
        description: 'Electronic reader timestamps recording access cards used between 21:50 and 22:30.',
        location_id: locIdMain,
        points_to: culpritIds,
        supports_fact_ids: ['F-101'],
        reliability: 0.95,
        is_red_herring: false,
        significance: 'Records electronic door unlock event at 22:04.',
        discovery: {
          method: 'search_location',
          requires_evidence: [],
          requires_warrant: false,
          actor_roles: ['detective', 'police_officer']
        }
      },
      {
        id: 'EV-103',
        name: 'Handwritten Ledger with Altered Figures',
        type: 'document',
        description: 'Financial documents recording irregular fund transfers and unfulfilled contracts.',
        location_id: locIdSecond,
        points_to: [rawSuspects[1] ? 'CH-103' : 'CH-102'],
        supports_fact_ids: ['F-107'],
        reliability: 0.8,
        is_red_herring: true,
        significance: 'Exposes financial embezzlement, though not the cause of death.',
        discovery: {
          method: 'search_location',
          requires_evidence: [],
          requires_warrant: true,
          actor_roles: ['detective', 'police_officer']
        }
      },
      {
        id: 'EV-104',
        name: 'Disabled Motion Sensor Override Wire',
        type: 'physical',
        description: 'A bypassed surveillance relay matching specialized security equipment.',
        location_id: locIdSecond,
        points_to: [rawSuspects[2] ? 'CH-104' : 'CH-102'],
        supports_fact_ids: ['F-108'],
        reliability: 0.85,
        is_red_herring: true,
        significance: 'Shows security negligence during the night.',
        discovery: {
          method: 'search_location',
          requires_evidence: [],
          requires_warrant: true,
          actor_roles: ['detective', 'police_officer']
        }
      }
    ];

    // Facts
    const facts = [
      {
        id: 'F-101',
        statement: `${victimName} died of premeditated foul play between 22:00 and 22:30.`
      },
      {
        id: 'F-102',
        statement: `The lethal act was executed using ${input.method || 'a customized toxic reagent delivered through tampering with the victim’s environment'}.`
      },
      {
        id: 'F-103',
        statement: `${rawSuspects[0].name} claimed presence in the greenhouse, but electronic locks contradict this.`
      },
      {
        id: 'F-104',
        statement: `${rawSuspects[1]?.name || 'Suspect 2'} was reviewing trust ledger documents.`
      },
      {
        id: 'F-105',
        statement: `${rawSuspects[2]?.name || 'Suspect 3'} was conducting perimeter security checks.`
      },
      {
        id: 'F-106',
        statement: rawSuspects[0].secret || 'Secret transactions uncovered.'
      },
      {
        id: 'F-107',
        statement: rawSuspects[1]?.secret || 'Financial irregularities uncovered in accounts.'
      },
      {
        id: 'F-108',
        statement: rawSuspects[2]?.secret || 'Security sensor bypass protocol discovered.'
      }
    ];

    const trueTimeline = [
      {
        id: 'TL-101',
        time: '21:30-22:00',
        actor_ids: culpritIds,
        location_id: locIdMain,
        event: `${culprit.name} entered the premises and deployed the lethal mechanism.`,
        fact_ids: ['F-101', 'F-102']
      },
      {
        id: 'TL-102',
        time: '22:15',
        actor_ids: [characters[1]?.id || 'CH-102'],
        location_id: locIdSecond,
        event: 'Perimeter security check noticed irregular flickering in the security hub.',
        fact_ids: ['F-108']
      },
      {
        id: 'TL-103',
        time: '22:30',
        actor_ids: [victimId],
        location_id: locIdMain,
        event: `${victimName} was discovered unresponsive at the crime scene.`,
        fact_ids: ['F-101']
      }
    ];

    return {
      case_id: caseId,
      title: input.title || 'The Midnight Syndicate Murder',
      tagline: input.tagline || 'A web of corporate betrayal, falsified alibis, and high-stakes courtroom cross-examination.',
      version: '1.0.0',
      author: input.author || 'Autonomous Battle Creator',
      difficulty: input.difficulty || 3,
      genre: input.genre || ['murder', 'conspiracy', 'forensics'],
      content_rating: 'PG-13',
      estimated_rounds: 40,
      phase_template: 'standard_trial_v1',
      setting: {
        location: input.setting_location || 'Vance Manor, Highgate Estate',
        date: input.setting_date || 'Midnight, Autumn Equinox',
        atmosphere: input.setting_atmosphere || 'Rain lashing against stained glass windows. Power fluctuating.',
        summary: input.setting_summary || `${victimName} was discovered dead under locked-room circumstances. Every associate had a motive and a secret.`
      },
      public_briefing: {
        opening_report: `At 23:15, ${victimName} was found unresponsive at ${locations[0].name}. Emergency responders confirmed foul play. Court and investigation teams have convened to interrogate suspects and reach a verdict.`,
        known_fact_ids: ['F-101'],
        initial_leads: [
          'The victim was threatened over contract disputes and financial irregularities.',
          'Multiple associates claim ironclad alibis that clash with digital timestamps.',
          'Forensic evidence suggests deliberate premeditation.'
        ]
      },
      ground_truth: {
        crime: {
          type: 'murder',
          victim_id: victimId,
          time_window: { start: '22:00', end: '22:30' },
          location_id: locIdMain,
          method: input.method || culprit.motive || 'Premeditated poisoning via altered environmental controls.',
          motive: culprit.motive || 'Preventing exposure of fraudulent transactions and contract termination.',
          cause_of_death: 'Acute circulatory failure from toxic chemical exposure.'
        },
        culprit_ids: culpritIds,
        accomplice_ids: [],
        true_timeline: trueTimeline,
        facts
      },
      characters,
      locations,
      evidence,
      roster: {
        seats: rosterSeats
      },
      solution: {
        key_evidence_chain: [
          { step: 1, evidence_ids: ['EV-102'], inference: 'Places the accused at the crime scene during the lethal window.' },
          { step: 2, evidence_ids: ['EV-101'], inference: 'Conclusively ties the lethal mechanism to the accused.' }
        ],
        minimal_solving_path: ['EV-102', 'EV-101'],
        red_herrings: ['EV-103', 'EV-104'],
        wrong_conclusions: [
          {
            suspect_id: characters[2]?.id || 'CH-103',
            why_tempting: 'Had an argument over corporate trusts and financial ledger irregularities.',
            why_wrong: 'Access logs and timestamps confirm they were outside the perimeter during the lethal window.',
            refuted_by: ['EV-101']
          }
        ],
        solver_check: {
          status: 'unverified',
          min_actions_estimate: 8,
          notes: 'Direct forensic timeline resolution path.'
        }
      },
      conclusion: {
        expected_verdicts: [
          {
            character_id: culpritIds[0],
            verdict: 'guilty',
            charge: 'First-Degree Premeditated Murder'
          }
        ],
        default_for_unlisted_defendants: 'not_guilty',
        judge_reasoning_template: `Based on the unrefuted forensic chain of custody for Exhibit [Altered Digital Keycard & Toxic Residue] and shattered timeline alibis, this court finds ${culprit.name} GUILTY as charged.`,
        reveal_narration: `The puzzle unravels: ${culprit.name} planned the crime to avoid financial ruin, planting misdirection across the estate. But the forensic spectrometer and digital access logs left an unbroken path straight to the truth.`,
        epilogue: `With the verdict delivered, ${victimName}’s estate begins recovery, and justice is served in the Autonomous Courtroom.`
      }
    };
  }


  getCase(caseId) {
    return this.cases.get(caseId) || null;
  }

  getAllCases() {
    return Array.from(this.cases.values());
  }

  /**
   * Safe public case summary for lobby / browsing:
   * Ground truth, solution, and conclusion MUST NEVER be sent.
   */
  getPublicCaseSummaries() {
    return this.getAllCases().map(c => ({
      case_id: c.case_id,
      title: c.title,
      tagline: c.tagline,
      version: c.version,
      difficulty: c.difficulty,
      genre: c.genre,
      content_rating: c.content_rating,
      estimated_rounds: c.estimated_rounds,
      role_labels: c.role_labels || {},
      setting: c.setting,
      public_briefing: c.public_briefing,
      characters: (c.characters || []).map(ch => ({
        id: ch.id,
        name: ch.name,
        age: ch.age,
        occupation: ch.occupation,
        role_in_case: ch.role_in_case,
        seat_role: ch.seat_role,
        public_profile: ch.public_profile,
        relationship_to_victim: ch.relationship_to_victim
      })),
      locations: (c.locations || []).map(loc => ({
        id: loc.id,
        name: loc.name,
        description: loc.description,
        access: loc.access
      })),
      roster: c.roster
    }));
  }

  getLibrary() {
    return this.library;
  }
}

module.exports = CaseLoader;
