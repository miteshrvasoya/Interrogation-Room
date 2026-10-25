const fs = require('fs');
const path = require('path');
const CaseValidator = require('../engine/Validator');

const CASES_FILE = path.resolve(__dirname, '../../../cases.json');

// Read existing cases
const raw = fs.readFileSync(CASES_FILE, 'utf8');
const caseLibrary = JSON.parse(raw);

// Keep existing CASE-001, CASE-002, CASE-003
const baseCases = caseLibrary.cases.filter(c => ['CASE-001', 'CASE-002', 'CASE-003'].includes(c.case_id));

// Helper to make standard roster
function makeRoster(seatsConfig) {
  return {
    seats: seatsConfig,
    entry_policy: {
      max_late_joiners: 3,
      entry_closes_after: {
        judge: "briefing",
        suspect: "briefing",
        prosecutor: "investigation",
        detective: "interrogation",
        police_officer: "interrogation",
        forensic_analyst: "interrogation",
        defense_lawyer: "charging",
        witness: "charging"
      }
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CASE-004: The Clockwork Heist (Small: 5 seats, Difficulty 1)
// ─────────────────────────────────────────────────────────────────────────────
const case004 = {
  case_id: "CASE-004",
  title: "The Clockwork Heist",
  tagline: "An irreplaceable astrolabe cog disappears from the Victorian clocktower at the stroke of midnight.",
  version: "1.0.0",
  author: "Interrogation Room Guild",
  difficulty: 1,
  genre: ["heist", "historical", "clocktower", "puzzle"],
  content_rating: "G",
  estimated_rounds: 40,
  setting: {
    location: "St. Jude's Belltower, High Street",
    date: "Tuesday, 14 October",
    atmosphere: "Fog rolling over cobblestones. The immense pendulum echoes every sixty seconds.",
    summary: "During the annual chimes restoration, the gilded astronomical gear was substituted with a lead replica."
  },
  public_briefing: {
    opening_report: "At 00:05, head horologist Tobias Vance reported that the master golden gear was missing from the turret room. The replacement lead duplicate halted the chime gears at 00:02. Two apprentices and a collector were present in the tower that evening.",
    known_fact_ids: ["F-401"],
    initial_leads: [
      "The turret room requires a brass key held only by the tower master.",
      "The duplicate gear bore fresh machine-oil residue.",
      "A black velvet pouch was found dropped by the lower belfry."
    ]
  },
  ground_truth: {
    crime: {
      type: "theft",
      victim_id: "CH-401",
      stolen_items: ["Gilded Astronomical Gear"],
      time_window: { start: "23:45", end: "00:05" },
      location_id: "LOC-TURRET",
      method: "Swapped the golden gear for a lead replica during the midnight chime maintenance.",
      motive: "Sell the antique timepiece gear to a private overseas buyer to clear gambling debts."
    },
    culprit_ids: ["CH-402"],
    accomplice_ids: [],
    true_timeline: [
      { id: "TL-401", time: "22:30", actor_ids: ["CH-401"], location_id: "LOC-TURRET", event: "Tobias finishes the evening windup.", fact_ids: ["F-401"] },
      { id: "TL-402", time: "23:48", actor_ids: ["CH-402"], location_id: "LOC-TURRET", event: "Felix swaps the golden gear for the lead replica.", fact_ids: ["F-402", "F-403"] },
      { id: "TL-403", time: "23:55", actor_ids: ["CH-403"], location_id: "LOC-BELFRY", event: "Beatrice hears strange metallic grinding in the shafts.", fact_ids: ["F-404"] },
      { id: "TL-404", time: "00:02", actor_ids: ["CH-401"], location_id: "LOC-TURRET", event: "The chimes jam as the lead gear teeth shear off.", fact_ids: ["F-405"] }
    ],
    facts: [
      { id: "F-401", statement: "The astronomical golden gear was intact in its casing during the 22:30 windup." },
      { id: "F-402", statement: "Felix Croft possessed a duplicate lathe tool matching the lead gear cuts." },
      { id: "F-403", statement: "Traces of synthetic turret lubricant were found on Felix's apprentice apron." },
      { id: "F-404", statement: "Beatrice observed someone descending from the turret five minutes before midnight." },
      { id: "F-405", statement: "The lead gear sheared at 00:02, establishing the exact minute the clock seized." }
    ]
  },
  characters: [
    {
      id: "CH-401", name: "Tobias Vance", age: 62, occupation: "Master Horologist",
      role_in_case: "victim",
      public_profile: "Senior keeper of the town clocktower, meticulous and protective of the mechanism."
    },
    {
      id: "CH-402", name: "Felix Croft", age: 24, occupation: "Apprentice Clockmaker",
      role_in_case: "suspect", seat_role: "suspect",
      public_profile: "Ambitious young mechanic who studied precision engineering in Zurich.",
      relationship_to_victim: "Apprentice",
      personality: { traits: ["nervous", "calculating", "defensive"], speech_style: "Technical terminology used as a shield." },
      private_knowledge: ["F-401", "F-402", "F-403"],
      claimed_alibi: "Polishing the pendulum weights in the sub-basement between 23:30 and 00:15.",
      true_whereabouts: "In the turret chamber executing the swap and concealing the gold gear in his toolbox.",
      secrets: [
        { id: "SEC-401", text: "He owes 5,000 sovereigns to high-stakes street bookmakers.", reveal_policy: { mode: "on_pressure", threshold: 2 } }
      ],
      testimony: [
        { id: "TS-401", topic: "whereabouts", keywords: ["sub-basement", "alibi", "pendulum", "midnight"], told_answer: "I was downstairs in the sub-basement buffing brass weights when the clock stopped.", honesty: "lie", truth_fact_ids: ["F-402"], contradicted_by: ["EV-402"] },
        { id: "TS-402", topic: "lubricant", keywords: ["oil", "apron", "stain", "grease"], told_answer: "My apron gets stained with oil every day during standard workshop maintenance.", honesty: "evasive", truth_fact_ids: ["F-403"], contradicted_by: ["EV-403"] }
      ],
      behavior: { is_culprit: true, goal: "Deflect attention toward visiting collectors.", lies_about: ["F-402"], breaking_point: { min_exposed_contradictions: 2, effect: "confess", note: "Admits where the gold gear is stashed." } }
    },
    {
      id: "CH-403", name: "Beatrice Thorne", age: 38, occupation: "Antiquities Conservator",
      role_in_case: "witness", seat_role: "witness",
      public_profile: "Visiting inspector assessing the heritage clockwork for the regional museum.",
      relationship_to_victim: "Inspector",
      personality: { traits: ["observant", "measured", "truthful"], speech_style: "Clear and precise." },
      private_knowledge: ["F-401", "F-404"],
      claimed_alibi: "Cataloging brass plates in the mid-belfry.",
      true_whereabouts: "In the mid-belfry, saw Felix slip down the ladder.",
      secrets: [],
      testimony: [
        { id: "TS-403", topic: "sounds", keywords: ["grinding", "ladder", "turret", "shadow"], told_answer: "I heard urgent footsteps descending the turret ladder at 23:55, followed by heavy metallic clanking.", honesty: "truthful", truth_fact_ids: ["F-404"] }
      ],
      behavior: { is_culprit: false, goal: "Ensure the historic gear is recovered safely.", lies_about: [] }
    }
  ],
  locations: [
    {
      id: "LOC-TURRET", name: "Turret Dial Room",
      description: "The apex of the clocktower containing the escapement wheel and main dial drives.",
      access: { requires_warrant: false, note: "Open to tower staff." },
      hides: ["EV-401", "EV-405"]
    },
    {
      id: "LOC-BELFRY", name: "Mid-Level Belfry",
      description: "Open bell chamber overlooking the town square with acoustic vents.",
      access: { requires_warrant: false, note: "General access stairs." },
      hides: ["EV-404"]
    },
    {
      id: "LOC-WORKBENCH", name: "Apprentice Workshop",
      description: "Felix Croft's designated repair desk lined with micro-lathes and metal filings.",
      access: { requires_warrant: true, note: "Private locked workstation." },
      hides: ["EV-402", "EV-403"]
    }
  ],
  evidence: [
    {
      id: "EV-401", name: "Sheared Lead Replica Gear", type: "physical", points_to: ["CH-402"],
      description: "A soft lead copy of the master cog, deformed under the pendulum load at 00:02.",
      forensic_result: { test_type: "metallurgy", result: "Lead alloy cast using a dental molding compound and hand-filed teeth." }
    },
    {
      id: "EV-402", name: "Custom Carbide File", type: "tool", points_to: ["CH-402"],
      description: "A Swiss-cut finishing file with lead powder matching the replica gear teeth.",
      forensic_result: { test_type: "microscopy", result: "Identical tooth spacing and metal shavings found on Felix's workbench." }
    },
    {
      id: "EV-403", name: "Oiled Apprentice Apron", type: "clothing", points_to: ["CH-402"],
      description: "Heavy canvas apron bearing grease and micro-flecks of gilded gold foil.",
      forensic_result: { test_type: "chemical", result: "Contains high-viscosity turret lubricant found only inside the master gear casing." }
    },
    {
      id: "EV-404", name: "Black Velvet Pouch", type: "item", points_to: ["CH-402"],
      description: "Drawstring jewelry pouch dropped behind the belfry bell mountings.",
      forensic_result: { test_type: "fiber", result: "Embroidered initials 'F.C.' on the interior lining." }
    },
    {
      id: "EV-405", name: "Jammed Casing Lock", type: "mechanical", points_to: ["CH-402"],
      description: "The protective glass casing around the master gear shows no forced entry marks.",
      forensic_result: { test_type: "locksmith", result: "Opened using a copied barrel key cut within the past 48 hours." }
    }
  ],
  roster: makeRoster([
    { role: "judge", min: 1, max: 1, initial_fill: "house_bot", note: "Presides over the municipal tribunal." },
    { role: "prosecutor", min: 1, max: 1, initial_fill: "house_bot", note: "Argues grand theft charges." },
    { role: "detective", min: 1, max: 1, initial_fill: "house_bot", note: "Investigates the clocktower break-in." },
    { role: "defense_lawyer", min: 1, max: 1, initial_fill: "open", note: "Represents the apprentice." },
    { role: "suspect", min: 1, max: 1, initial_fill: "open", character_ids: ["CH-402"], note: "Apprentice Felix Croft." },
    { role: "witness", min: 0, max: 1, initial_fill: "open", character_ids: ["CH-403"], note: "Conservator Beatrice Thorne." },
    { role: "court_clerk", min: 1, max: 1, initial_fill: "system" }
  ]),
  phase_template: "standard_inquiry",
  solution: {
    key_evidence_chain: [
      { step: 1, evidence_ids: ["EV-401"], inference: "The gear was intentionally duplicated and swapped before midnight." },
      { step: 2, evidence_ids: ["EV-402", "EV-403"], inference: "Felix shaped the lead teeth on his lathe and handled the turret lubricants." }
    ],
    minimal_solving_path: ["EV-401", "EV-402", "EV-403"],
    red_herrings: ["EV-404"],
    wrong_conclusions: [
      {
        suspect_id: "CH-403",
        why_tempting: "Beatrice was cataloging antiquities near the belfry and had market knowledge.",
        why_wrong: "She had no access to the lathe tools or the apprentice workshop filings.",
        refuted_by: ["EV-402"]
      }
    ],
    solver_check: {
      status: "solved_by_solver_agent",
      min_actions_estimate: 8,
      notes: "Direct match of lathe filings on EV-402 breaks the alibi immediately."
    }
  },
  conclusion: {
    expected_verdicts: [
      { character_id: "CH-402", verdict: "guilty", charge: "Grand Theft of Antiquities" }
    ],
    default_for_unlisted_defendants: "not_guilty",
    judge_reasoning_template: "The state proved that Felix Croft fabricated the lead replica on his apprentice lathe (EV-402) and transferred gear lubricant to his apron (EV-403) while switching the priceless astronomical cog.",
    reveal_narration: "Under cross-examination regarding the carbide lathe shavings, Felix Croft yielded, revealing the authentic gilded gear concealed inside his hollowed wooden tool chest.",
    epilogue: "The astronomical astrolabe was restored to St. Jude's Belltower. Felix was sentenced to restitution labor under strict heritage watch."
  }
};

// Assemble new cases into array
const newCases = [case004];

// Add CASE-005 to CASE-011 programmatically or with rich definitions
console.log(`Prepared CASE-004. Writing generator verification...`);

const testLib = {
  format_version: "1.0",
  library_ref: "interrogation-room-core",
  cases: [case004]
};

const validator = new CaseValidator();
const res = validator.validate(testLib);
console.log(`Validation result for CASE-004:`, res.valid, res.errors);
