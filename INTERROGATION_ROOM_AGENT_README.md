# Interrogation Room — Autonomous AI Investigation Platform
## Master Build Specification / README for Coding Agent

> **Project intent:** Turn the existing `Interrogation Room` prototype into a persistent, multiplayer, AI-agent-driven investigation world where humans own agents, agents occupy roles, cases wait for participants, proceedings happen autonomously, spectators watch the 3D simulation, and a hidden master referee continuously evaluates the case.

This document is the implementation brief for the coding agent. **Extend the existing project; do not throw away working architecture, schemas, 3D scenes, case engine, invocation/event system, or security model unless there is a concrete technical reason.**

The existing concept already defines autonomous mystery cases with briefing, investigation, interrogation, charging, trial, verdict and reveal phases; public spectators; role-based agent participation; structured agent actions; Three.js scenes; gamification; and external-agent support. fileciteturn0file0L55-L76

---

# 1. Product Vision

Interrogation Room should feel like:

- an AI-powered crime drama
- a multiplayer social game
- a live Twitch-style investigation
- an agent arena
- a courtroom / interrogation simulator
- a spectator prediction game

It must **not feel like a normal chatbot application**.

The user should be able to enter the platform and immediately see:

1. Cases waiting for players.
2. Live cases currently unfolding.
3. Finished cases and replays.
4. Agents and their career records.
5. A 3D investigation environment.
6. Evidence, accusations, contradictions and evolving scores.
7. Audience predictions and reactions.
8. Agent rankings and rewards.

The central loop is:

**Create/bring Agent → Choose Role → Join Case → Fill Seats → Ready Check → Case Starts → Agents Investigate/Argue → Master Referee Scores → Audience Predicts → Verdict → Reveal → Rewards → Replay**

---

# 2. Core Design Principles

## 2.1 Server owns the truth

The server/game engine is authoritative.

Never expose to agents or spectators before the reveal:

- culprit identity
- hidden evidence
- secret motives
- secret relationships
- unrevealed timeline events
- hidden role objectives
- master referee's private evaluation
- future scripted events

The source specification explicitly requires the server to own game state and keep ground truth hidden until reveal. fileciteturn0file0L89-L93

## 2.2 Agent output is untrusted

An agent must never be able to directly execute arbitrary commands.

Agent output should be parsed into a strict structured action format such as:

```json
{
  "action": "QUESTION",
  "target": "suspect_01",
  "speech": "Where were you at 21:30?",
  "claim": {
    "type": "LOCATION",
    "value": "At the restaurant"
  }
}
```

The engine validates:

- whether the role can perform the action
- whether the action is available in the current phase
- whether the target exists
- whether the agent has discovered the referenced information
- whether the action is legal
- rate limits
- turn limits
- case-specific rules

Only validated actions become game events.

---

# 3. Case Lifecycle

Implement a persistent lifecycle:

```text
DRAFT
  ↓
PENDING
  ↓
READY
  ↓
LIVE
  ↓
PAUSED (optional recovery state)
  ↓
FINISHED
  ↓
REVEAL
  ↓
ARCHIVED
```

## PENDING

Case is publicly visible.

Users can:

- inspect public case information
- inspect required roles
- select their agent
- reserve a seat
- release a seat
- wait for missing participants

The case does not start until all required real-player seats are filled.

## READY

All required seats are occupied.

Run:

- agent health checks
- external-agent handshake
- built-in-agent validation
- participant confirmation
- role conflict validation
- anti-collusion validation

Then start a countdown.

## LIVE

The autonomous game engine controls the proceeding.

Humans watch.

Agents act.

Audience predicts and reacts.

## FINISHED

The final verdict has been determined.

No hidden information should be shown until the reveal stage.

## REVEAL

Reveal:

- actual culprit
- true timeline
- hidden evidence
- contradictions
- decisive arguments
- master referee scoring
- final agent rankings
- rewards
- audience prediction results

---

# 4. Case Lobby

Create a high-quality `Case Lobby`.

Each case card should show:

- title
- cover image
- tagline
- genre
- difficulty
- estimated duration
- number of seats
- required seats
- filled seats
- roles remaining
- current viewers
- prediction pool
- heat
- status
- start condition
- creation time

Example:

```text
THE MIDNIGHT MURDER
★★★★★ Hard

A wealthy businessman is found dead inside a locked penthouse.

PLAYERS
Detective        1/1 ✓
Judge            0/1
Prosecutor       1/1 ✓
Defense Lawyer   0/1
Suspect          1/1 ✓
Forensic Expert  0/1

3 / 6 required players

[ JOIN AS AGENT ]
```

Add filters:

- Crime
- Mystery
- Political thriller
- Corporate
- Sci-fi
- Psychological
- Historical
- Comedy
- Horror
- Difficulty
- Duration
- Required role
- Player count
- Pending / Live / Finished

---

# 5. Agent System

Users should have an `Agent` entity.

An agent contains:

```text
id
ownerId
name
avatar
description
personality
systemPrompt
preferredRoles
providerType
providerConfig
externalEndpoint
capabilities
rating
xp
level
wins
losses
casesPlayed
casesSolved
casesLost
achievements
createdAt
updatedAt
```

## 5.1 Built-in agents

Allow users to select:

- OpenAI
- Anthropic
- Gemini
- OpenRouter
- other configured providers

The platform should abstract model selection behind a provider interface.

Example:

```ts
interface LLMProvider {
  generate(input: AgentContext): Promise<AgentAction>;
}
```

## 5.2 User-owned external agents

Preferred architecture:

**Do not require users to give the platform their LLM API keys.**

Instead:

```text
User Agent
    ↓
External Agent API
    ↓
Interrogation Room
```

The platform gives the user:

```text
AGENT_ID
AGENT_TOKEN
CASE API
EVENT API
```

The external agent receives only the context it is allowed to know.

This follows the safer architecture already identified for the project: users can run their own agents and connect through a platform-issued token instead of exposing LLM credentials. fileciteturn0file0L13-L17

If encrypted provider credentials are eventually supported, implement:

- encryption at rest
- KMS/secret-manager compatible abstraction
- never log credentials
- never return plaintext credentials
- key rotation
- provider spend-limit warning
- credential deletion

---

# 6. Agent Personality Builder

Make agent creation fun.

Users should configure:

### Identity

- name
- avatar
- age/style
- profession
- country/city
- catchphrase

### Personality sliders

```text
Logical       ████████░░
Aggressive    ██████░░░░
Sarcastic     █████████░
Empathetic    ███░░░░░░░
Risk-taking   ███████░░░
Deceptive     ████████░░
Confident     █████████░
```

### Behavioral traits

Examples:

- Sherlock
- Hot-headed detective
- Calm lawyer
- Manipulative suspect
- Overconfident prosecutor
- Conspiracy theorist
- Nervous witness
- Brutally honest forensic analyst
- Chaotic wildcard
- Passive-aggressive judge

The personality should influence decisions, not merely change wording.

---

# 7. Role System

Roles should be extensible.

Initial roles:

- Judge
- Detective
- Police Officer
- Lead Investigator
- Prosecutor
- Defense Lawyer
- Suspect
- Witness
- Forensic Expert
- Medical Examiner
- Crime Scene Investigator
- Journalist
- Jury Member
- Bailiff
- Interrogator
- Hacker
- Informant
- Private Investigator

Each role defines:

```text
permissions
availableActions
knowledgeScope
entryRules
approvalRules
objectives
winConditions
scoringWeights
```

---

# 8. Case Structure

Cases must be data-driven.

A case should contain:

```json
{
  "id": "case_midnight_murder",
  "title": "The Midnight Murder",
  "difficulty": "hard",
  "genre": "mystery",
  "estimatedDuration": 35,
  "requiredSeats": [],
  "optionalSeats": [],
  "locations": [],
  "characters": [],
  "evidence": [],
  "timeline": [],
  "hiddenTruth": {},
  "phases": [],
  "rules": {},
  "scoring": {}
}
```

Adding a new case should NOT require application code changes.

Build:

- schema validator
- seed loader
- case editor-friendly JSON format
- versioning
- migration compatibility

---

# 9. Case Types

The platform must grow beyond courtroom cases.

## 9.1 Investigation

Detectives gather evidence.

## 9.2 Interrogation

Agents question suspects/witnesses.

## 9.3 Crime Scene

Agents inspect a 3D environment.

Actions:

- inspect
- photograph
- collect evidence
- fingerprint
- search
- compare
- reconstruct
- follow trail

## 9.4 Courtroom

Formal proceeding:

```text
Opening
↓
Evidence
↓
Witness examination
↓
Cross examination
↓
Objections
↓
Closing arguments
↓
Verdict
```

## 9.5 Multi-location Mystery

Example:

```text
Crime Scene
    ↓
Police Station
    ↓
Interrogation Room
    ↓
Forensics Lab
    ↓
Courtroom
```

## 9.6 Social Deduction

Agents attempt to identify:

- murderer
- traitor
- spy
- impostor
- saboteur

## 9.7 Heist

Agents plan and execute a fictional heist scenario.

Keep gameplay fictional and simulation-only; do not provide real-world criminal instructions.

## 9.8 Political / Corporate Investigation

Examples:

- boardroom scandal
- leaked confidential document
- corporate fraud mystery
- whistleblower investigation

---

# 10. Master Referee / Scoring Bot

This is one of the most important systems.

Create an internal `Master Referee`.

The Master Referee:

- observes all legal game events
- has access to ground truth
- analyzes arguments
- tracks contradictions
- evaluates evidence usage
- scores role performance
- updates scores continuously
- determines final performance

It should NOT directly control the player's agent.

## 10.1 Live score

Each agent receives a continuously changing score.

Example:

```text
DETECTIVE — Agent Holmes

Logic                 +18
Evidence usage        +22
Correct deduction     +31
Question quality      +11
Contradiction found   +15
False accusation      -12
Ignored evidence      -5

LIVE SCORE: 85
```

Scores should update after meaningful events rather than every token.

## 10.2 Score dimensions

Possible universal metrics:

- reasoning
- evidence usage
- factual accuracy
- contradiction detection
- questioning quality
- persuasion
- consistency
- role performance
- creativity
- strategic decisions
- discovery efficiency
- successful deductions
- unnecessary accusations
- false claims
- rule violations

Role-specific weights should override generic weights.

---

# 11. Audience Prediction / Virtual Betting

Spectators should be able to participate.

**Use virtual points only. Do not implement real-money gambling.**

Users receive a virtual balance.

They can predict:

- culprit
- winner
- which agent will perform best
- whether suspect will confess
- whether evidence is genuine
- which argument will dominate

Example:

```text
WHO IS THE CULPRIT?

A. Dr. Mehta        42%
B. Rahul Shah       31%
C. Neha Patel       19%
D. Unknown          8%

Your prediction: [Dr. Mehta]

Confidence: 750 points
```

Use:

- virtual points
- XP
- badges
- prediction accuracy
- streaks

Do not allow:

- deposits
- withdrawals
- cash prizes
- real-money wagering

---

# 12. Audience Odds

Live odds should be calculated from:

- current audience predictions
- prediction volume
- agent performance
- revealed evidence
- confidence weighting

Do NOT allow audience odds to affect the hidden truth.

They are entertainment signals only.

Example:

```text
AUDIENCE BELIEF

Dr. Mehta       █████████████ 54%
Rahul Shah      ███████       29%
Neha Patel      ████          12%
Unknown         ██             5%
```

---

# 13. Spectator Experience

A spectator should feel like they are watching a live show.

Main screen:

```text
┌────────────────────────────────────────────┐
│ LIVE — THE MIDNIGHT MURDER                 │
├────────────────────────────────────────────┤
│                                            │
│          [ THREE.JS SCENE ]                │
│                                            │
│   Detective          Suspect               │
│                                            │
│           Evidence Board                   │
│                                            │
├───────────────┬────────────────────────────┤
│ LIVE EVENTS   │ CASE INTELLIGENCE          │
│               │                            │
│ Question      │ Score                      │
│ Evidence      │ Audience Odds              │
│ Objection     │ Evidence                    │
│ Contradiction │ Timeline                    │
└───────────────┴────────────────────────────┘
```

Secondary panels:

- transcript
- event timeline
- evidence
- participants
- scores
- predictions
- audience reactions

---

# 14. Three.js World

Three.js is the visual centerpiece.

Use:

- React Three Fiber
- drei
- GLTF/GLB models
- animation mixer
- camera transitions
- post-processing where practical

Existing requirements already call for interrogation rooms, crime scenes, evidence rooms, courtrooms and cinematic camera behavior. fileciteturn0file0L71-L76

## 14.1 Required environments

Build reusable scenes:

1. Interrogation Room
2. Police Station
3. Crime Scene
4. Evidence Room
5. Forensics Lab
6. Courtroom
7. Judge's Chamber
8. Office
9. Warehouse
10. Hotel/Penthouse

## 14.2 Character system

Use reusable stylized avatars.

Characters need:

- idle
- walk
- sit
- stand
- point
- talk
- argue
- react
- surprise
- angry
- nervous
- thinking
- accuse
- hand over evidence

Use free/open assets where licensing permits.

Track attribution/licenses for every external asset.

---

# 15. Event → Animation System

The backend should produce semantic events.

Example:

```json
{
  "type": "EVIDENCE_DISCOVERED",
  "actorId": "detective_01",
  "locationId": "penthouse",
  "evidenceId": "bloody_glove",
  "timestamp": 123456
}
```

Frontend maps event → animation.

Examples:

```text
AGENT_MOVES
→ character walks

QUESTION_STARTED
→ camera focuses on questioner + target

EVIDENCE_FOUND
→ evidence object appears

EVIDENCE_PRESENTED
→ evidence card floats into scene

OBJECTION
→ dramatic camera cut + visual effect

CONTRADICTION_FOUND
→ timeline/evidence board highlights contradiction

CONFESSION
→ lighting/camera change

VERDICT
→ judge animation + gavel sound

REVEAL
→ cinematic truth sequence
```

This keeps game logic independent of the 3D engine.

---

# 16. Evidence System

Evidence should be first-class objects.

Each evidence item:

```text
id
type
description
location
discoveredBy
discoverableAfter
visibility
reliability
relevance
linkedEvidence
linkedCharacters
revealedAt
```

Evidence types:

- photograph
- document
- fingerprint
- DNA result
- object
- message
- CCTV clip
- witness statement
- financial record
- timeline event
- physical clue

Some evidence can be misleading.

Important:

**Do not make every clue directly point to the culprit.**

Cases should contain:

- red herrings
- ambiguous evidence
- conflicting testimony
- incomplete evidence
- misleading but technically true statements

---

# 17. Contradiction Engine

Create a dedicated contradiction detector.

It compares:

- agent statements
- witness statements
- evidence
- known timeline
- previous claims

Example:

```text
SUSPECT:
"I left at 9:00 PM."

CCTV:
Door opened at 9:47 PM.

MASTER REFEREE:
CONTRADICTION DETECTED
Confidence: 96%
```

Contradictions should create game events.

---

# 18. Agent Memory

Each agent needs controlled memory.

Separate:

```text
shortTermMemory
knownFacts
observedEvents
personalNotes
roleObjectives
privateKnowledge
```

Never accidentally inject the entire database into an agent context.

Agent context must be constructed from:

- role permissions
- discovered information
- visible events
- allowed case state
- current phase
- conversation history
- personal memory

---

# 19. Agent-to-Agent Communication

Agents should communicate through the game world, not through unrestricted hidden channels.

Supported communication:

- public statement
- question
- answer
- objection
- accusation
- evidence presentation
- private authorized conversation
- official note
- testimony

Every communication becomes an immutable event.

Avoid arbitrary agent-to-agent direct messaging unless a case explicitly allows it.

---

# 20. Live Event Log

Everything important must be persisted.

Create an append-only event log.

Example:

```text
CaseStarted
SeatFilled
AgentConnected
AgentDisconnected
AgentMoved
QuestionAsked
AnswerGiven
EvidenceDiscovered
EvidencePresented
ObjectionRaised
ContradictionDetected
AccusationMade
VoteCast
ScoreUpdated
PhaseChanged
VerdictIssued
CaseRevealed
RewardGranted
```

Each event should contain:

```text
id
caseId
actorId
eventType
payload
visibility
phase
timestamp
sequenceNumber
```

Use sequence numbers for deterministic replay.

---

# 21. Full Database Persistence

Persist everything required to replay a case.

Minimum entities:

```text
User
Agent
AgentCredential/Connection
AgentSession
Case
CaseSeat
CaseParticipant
CasePhase
CaseEvent
CaseEvidence
CaseCharacter
CaseTimeline
AgentScore
ScoreEvent
Prediction
PredictionEvent
Reward
Achievement
Leaderboard
Notification
ExternalAgentConnection
AuditLog
```

Do not store only the final result.

The complete event history should allow a case to be reconstructed.

---

# 22. Replay System

After a case finishes:

`WATCH REPLAY`

Users should be able to:

- pause
- resume
- change playback speed
- jump to evidence discovery
- jump to contradiction
- jump to accusation
- jump to verdict
- inspect agent scores
- inspect event timeline

Add chapters:

```text
00:00 Briefing
03:20 Crime Scene
08:15 First Evidence
14:42 Interrogation
21:03 Contradiction
28:11 Court
34:40 Verdict
36:00 Truth Reveal
```

---

# 23. Rewards

Reward agents and users separately.

## Agent rewards

- XP
- rating
- role rating
- achievements
- titles
- cosmetic unlocks

Examples:

- Master Detective
- Cross Examination Beast
- Silver Tongue
- Cold Reader
- Evidence Hunter
- Objection Machine
- Perfect Liar
- Unbreakable Witness
- Case Closer
- Chaos Agent

## Viewer rewards

- XP
- prediction accuracy
- streaks
- badges

Examples:

- Sharp Eye
- Cold Case Closer
- Evidence Hunter
- Human Lie Detector
- Rookie Detective
- Courtroom Addict

---

# 24. Agent Rating

Implement Elo-like or Glicko-inspired ratings.

Possible dimensions:

```text
Overall
Detective
Lawyer
Prosecutor
Judge
Interrogator
Witness
Deception
Reasoning
```

Do not let a single lucky case permanently distort ratings.

Use:

- confidence
- number of games
- opponent strength
- case difficulty
- role difficulty

---

# 25. Leaderboards

Create:

### Global

- Best agents
- Best owners
- Best detectives
- Best lawyers
- Best predictors

### Weekly

Reset or decay weekly.

### Seasonal

Season lasts e.g. 30 days.

### Case-specific

- highest score
- fastest solve
- most evidence
- most contradictions
- best argument
- best performance

---

# 26. Fun / Chaos Mechanics

Add controlled randomness.

Examples:

### Breaking News

Mid-case:

> BREAKING: New CCTV footage has been recovered.

### Unexpected Witness

A new witness enters.

### Evidence Reclassification

A forensic result changes the reliability of evidence.

### Surprise Objection

A judge can introduce a procedural challenge.

### Anonymous Tip

An agent receives a suspicious tip.

### Media Pressure

Audience attention increases.

### Reputation System

A suspect who was publicly accused in previous cases may behave differently in future fictional cases.

### Rivalry

Agents who repeatedly face each other can develop rivalry statistics.

### Agent Catchphrases

Agents can generate recurring phrases.

### Hall of Fame

Display legendary cases.

All such mechanics must remain deterministic/replayable through stored events.

---

# 27. Case Difficulty

Define difficulty using:

```text
number of suspects
number of evidence items
red herrings
timeline complexity
number of locations
role count
hidden relationships
contradiction density
time pressure
```

Example:

```text
EASY
1 suspect
8 evidence items
1 location

MEDIUM
3 suspects
15 evidence items
3 locations

HARD
5 suspects
30 evidence items
5 locations
multiple false leads

INSANE
8 suspects
50+ evidence items
dynamic witnesses
multiple conflicting timelines
```

---

# 28. Case Generator

Eventually build an internal case-generation system.

Input:

```text
genre
difficulty
locations
roles
duration
numberOfSuspects
numberOfEvidence
```

Output must be validated against the case schema.

Generated cases should pass:

- schema validation
- logical consistency checks
- solvability checks
- role completeness
- timeline consistency
- evidence consistency

Do not allow an unsolvable case into production.

---

# 29. Case Solvability Validator

Before a case becomes `PENDING`, validate:

1. There is exactly one intended solution unless explicitly configured otherwise.
2. The solution is logically reachable.
3. Required evidence can be discovered.
4. No required role is impossible to perform.
5. Timeline has no impossible ordering.
6. Contradictions are intentional.
7. Red herrings do not make the case logically unsolvable.
8. All required seats exist.
9. Phase transitions are reachable.
10. Reveal contains the actual truth.

---

# 30. Anti-Collusion

One user must not control opposing critical roles in the same case.

Examples:

Do not allow:

```text
User A → Detective
User A → Culprit
```

or:

```text
User A → Prosecutor
User A → Defense Lawyer
```

unless a special game mode explicitly permits it.

Also detect:

- multiple accounts
- suspicious repeated coordination
- impossible response timing
- shared external agent identities

Do not over-engineer this initially; basic ownership constraints are enough for MVP.

---

# 31. Disconnect Handling

Agents can fail.

Implement:

```text
CONNECTED
↓
HEALTHY
↓
DEGRADED
↓
DISCONNECTED
↓
HOUSE_BOT_TAKEOVER
```

The case must continue.

When the agent reconnects:

- restore its context
- synchronize missed events
- allow re-entry if permitted

Never lose case state because an external API failed.

---

# 32. House Bots

House bots fill optional seats.

They should also be used as emergency replacements.

House bot personalities:

- Detective Holmes
- Judge Stone
- Prosecutor Fury
- Lawyer Blake
- Nervous Witness
- Silent Forensic Expert
- Chaos Agent

House bots should have distinct behavioral strategies.

---

# 33. External Agent API

Provide a simple API.

Example:

```http
POST /api/agent/connect
POST /api/agent/heartbeat
GET  /api/cases/:caseId/context
POST /api/cases/:caseId/action
GET  /api/cases/:caseId/events
POST /api/agent/disconnect
```

External agents receive:

- current phase
- allowed actions
- known evidence
- public events
- role objectives
- relevant history

They do NOT receive:

- hidden truth
- unauthorized evidence
- master referee private score
- other agents' private context

---

# 34. Authentication

Use:

- normal user authentication
- session/JWT as appropriate
- separate agent tokens
- token rotation
- token revocation
- per-agent permissions

Never use the user's normal login token as the external agent credential.

---

# 35. API Rate Limits

Apply limits to:

- signup
- agent creation
- case joins
- agent actions
- LLM calls
- external agent calls
- predictions
- spectator reactions

Token usage must have hard caps.

The original project design correctly identifies uncontrolled agent activity and token cost as major risks. fileciteturn0file0L19-L23

---

# 36. Security Requirements

Treat every agent output and every external agent as untrusted.

Defend against:

- prompt injection
- system prompt extraction
- secret extraction
- malicious tool invocation
- oversized payloads
- replay attacks
- token theft
- unauthorized case access
- hidden information leakage
- API abuse

Agents should have no access to arbitrary server tools.

---

# 37. Moderation

Because this is a public platform, add basic controls:

- report case
- report agent
- block user
- mute agent
- spectator moderation
- profanity filtering
- prompt abuse detection
- rate limiting

Cases and agents should be fictional.

---

# 38. Real-Time Architecture

Use WebSockets or Server-Sent Events.

Recommended flow:

```text
Game Engine
     ↓
Event Bus
     ↓
Persistence
     ↓
Realtime Gateway
     ↓
┌─────────────┬──────────────┬──────────────┐
│ 3D Client   │ Transcript   │ Score Panel  │
└─────────────┴──────────────┴──────────────┘
```

The frontend should never be responsible for game truth.

---

# 39. Background Workers

Use workers for:

- case progression
- agent execution
- LLM calls
- scoring
- notifications
- prediction settlement
- replay generation
- cleanup
- house-bot takeover

Do not block the main HTTP server on long LLM calls.

---

# 40. Observability

Add:

- structured logs
- case execution logs
- agent execution latency
- LLM token usage
- failed actions
- disconnected agents
- worker failures
- case duration
- scoring latency

Create an internal admin/debug view.

---

# 41. Admin Console

Admin should be able to:

- create cases
- validate cases
- start/stop cases
- inspect event logs
- inspect agent actions
- inspect scoring
- replace broken agents
- replay cases
- disable agents
- moderate content
- inspect API failures

---

# 42. UI Pages

Minimum pages:

```text
/
 /cases
 /cases/:id
 /cases/:id/watch
 /cases/:id/replay
 /agents
 /agents/create
 /agents/:id
 /leaderboard
 /profile
 /rewards
 /how-it-works
 /api-docs
 /admin
```

Landing page should immediately communicate:

> **AI Agents. Real Cases. One Verdict.**

Feature a live 3D case.

---

# 43. Visual Direction

Use a premium dark cinematic style.

References:

- detective noir
- modern streaming platform
- crime board
- courtroom drama
- game UI

Avoid:

- generic SaaS dashboard
- excessive cards
- plain chat interface
- spreadsheet-like screens

The source project explicitly calls for a game/streaming-show feeling rather than an admin dashboard. fileciteturn0file0L95-L98

---

# 44. Sound Design

Add subtle sound:

- room ambience
- footsteps
- gavel
- paper
- camera shutter
- evidence reveal
- suspense pulse
- notification
- objection
- verdict

Sound should be optional and muted by default on mobile.

---

# 45. Mobile Strategy

Desktop:

- full 3D experience

Tablet:

- simplified 3D

Mobile:

- simplified 3D / cinematic view
- event timeline
- transcript
- scores
- evidence
- predictions

Do not attempt to render the maximum-quality scene on low-end mobile devices.

---

# 46. Performance

Target:

- 60 FPS desktop where practical
- graceful degradation
- lazy-load assets
- compressed GLB files
- texture optimization
- instancing
- limited dynamic lights
- LOD
- asset caching

Do not load every case asset simultaneously.

---

# 47. Recommended Technical Architecture

Current project stack can remain:

```text
Frontend
React / Next.js
React Three Fiber
Three.js
drei

Backend
Node.js
Express

Database
MongoDB

Realtime
WebSocket / SSE

Workers
BullMQ or equivalent

Cache
Redis

Storage
Object storage for assets/replays

LLM
Provider abstraction

Auth
JWT/session based

Validation
Zod or equivalent
```

The exact architecture may change if the existing implementation already has working equivalents.

---

# 48. Suggested Repository Structure

```text
apps/
  web/
  api/
  worker/

packages/
  case-engine/
  agent-runtime/
  scoring-engine/
  case-schema/
  realtime/
  ui/
  shared/

data/
  cases/
  roles/
  personalities/

assets/
  characters/
  environments/
  evidence/
  audio/

docs/
  architecture/
  api/
  cases/
  agent-runtime/
```

Adapt to the existing repository rather than restructuring everything unnecessarily.

---

# 49. Important State Machine

Implement explicit state machines.

## Case

```text
PENDING
→ READY
→ LIVE
→ FINISHED
→ REVEAL
→ ARCHIVED
```

## Seat

```text
OPEN
→ RESERVED
→ PENDING_APPROVAL
→ CONFIRMED
→ ACTIVE
→ DISCONNECTED
→ HOUSE_BOT
→ RELEASED
```

## Agent

```text
CREATED
→ VERIFIED
→ CONNECTED
→ ACTIVE
→ DEGRADED
→ DISCONNECTED
```

Never rely on random booleans to represent lifecycle state.

---

# 50. Scoring Pipeline

Recommended:

```text
Agent Action
    ↓
Action Validator
    ↓
Game Event
    ↓
Event Store
    ↓
Scoring Engine
    ↓
Score Event
    ↓
Aggregate Agent Score
    ↓
Realtime Update
```

The Master Referee should consume the canonical event stream.

---

# 51. Prediction Pipeline

```text
Audience Prediction
       ↓
Validate
       ↓
Store Prediction
       ↓
Update Audience Odds
       ↓
Broadcast Odds
       ↓
Reveal
       ↓
Settle Prediction
       ↓
Award XP / Points
```

Never alter case truth based on predictions.

---

# 52. End-of-Case Report

Generate a cinematic report:

```text
THE MIDNIGHT MURDER
CASE CLOSED

CULPRIT
Dr. Mehta

CASE DIFFICULTY
★★★★★

BEST AGENT
Detective Holmes
Score: 91

BEST ARGUMENT
Defense Blake

MOST IMPORTANT CLUE
Broken Watch

BIGGEST MISTAKE
Prosecutor Fury ignored CCTV

AUDIENCE ACCURACY
63%

TOTAL VIEWERS
12,481
```

Then show the complete timeline.

---

# 53. Funny Statistics

Generate ridiculous but meaningful stats:

- Most dramatic objection
- Most suspicious pause
- Most confident wrong accusation
- Fastest accusation
- Longest interrogation
- Most questioned character
- Most trusted suspect
- Most hated suspect
- Biggest comeback
- Worst detective moment
- Best courtroom comeback
- Most chaotic agent
- Most unnecessary evidence
- Most suspicious sentence
- Most dramatic confession

These make cases shareable.

---

# 54. Social Sharing

Create shareable cards:

```text
I watched:
THE MIDNIGHT MURDER

My Agent:
Sherlock.exe

Role:
Detective

Score:
94/100

Result:
CASE SOLVED

Audience Rank:
#127

[WATCH REPLAY]
```

Also create:

- agent profile cards
- case result cards
- prediction result cards
- leaderboard cards

---

# 55. Notifications

Notify users when:

- their case gets enough players
- their seat is approved
- case starts
- agent disconnects
- their agent wins
- reward is earned
- a case they follow begins
- a new case matching their role appears

---

# 56. Seed Cases

Create at least 8 pending cases.

Suggested cases:

### 1. The Midnight Murder
Locked-room penthouse murder.

### 2. The Missing CEO
Corporate mystery with conflicting board members.

### 3. The Vanishing Witness
Witness disappears before trial.

### 4. The Poisoned Toast
Dinner party mystery.

### 5. The Museum Heist
Artifact disappears during a controlled event.

### 6. The Silent Apartment
No obvious murder weapon and conflicting neighbor statements.

### 7. The 2:17 Train
A crime occurs during a train journey with a limited suspect list.

### 8. The Last Message
A mysterious scheduled message arrives after the supposed victim's death.

Each case must have:

- 5–10 required roles
- optional roles
- multiple locations
- evidence
- hidden truth
- timeline
- red herrings
- contradictions
- phase definitions
- scoring rules

---

# 57. Important: Cases Must Be Fun, Not Merely Logical

Cases should generate moments people want to watch.

Design for:

- surprise
- betrayal
- reversals
- absurd arguments
- dramatic accusations
- unexpected alliances
- funny misunderstandings
- brilliant deductions
- spectacularly bad deductions

The AI should sometimes make mistakes.

Perfect agents are boring.

---

# 58. Agent Behavior Variety

Do not let every agent simply choose the statistically optimal answer.

Agents should have strategic personalities.

Example:

```text
Logical Detective:
asks precise questions

Aggressive Detective:
pressures suspects

Empathetic Detective:
builds rapport

Chaotic Detective:
takes risky actions

Paranoid Detective:
suspects everyone

Lawyer:
exploits procedural weaknesses

Manipulator:
redirects suspicion
```

This creates emergent stories.

---

# 59. Emergent Storytelling

Do not hard-code every dialogue line.

Hard-code:

- world truth
- evidence
- rules
- constraints
- phase objectives

Let agents generate:

- questions
- answers
- arguments
- accusations
- reactions
- strategies

This produces unique cases from the same underlying scenario.

---

# 60. Deterministic Replay

The case must be replayable.

Store:

- event sequence
- timestamps
- random seeds
- scoring results
- state transitions
- agent outputs or normalized action payloads

A replay should reproduce the same case history without calling external LLMs again.

---

# 61. Testing Requirements

Write tests for:

### Case

- cannot start with missing required seat
- starts when all required seats are ready
- optional seats can use house bots
- case cannot reveal hidden data
- phase transitions work

### Agent

- invalid action rejected
- unauthorized action rejected
- rate limits work
- disconnected agent replaced
- agent reconnects correctly

### Security

- hidden truth cannot reach agent
- hidden truth cannot reach spectator
- prompt injection cannot execute tools
- agent token cannot access another agent
- one user cannot occupy conflicting seats

### Scoring

- score updates after events
- role weights apply
- final score is deterministic

### Prediction

- invalid prediction rejected
- prediction locked at correct point
- settlement works

### Replay

- event stream reconstructs final state

---

# 62. Development Strategy

Do NOT build everything simultaneously.

Build in these stages.

## Phase 1 — Core Case Engine

First make:

```text
Case
→ Seats
→ Agents
→ Phases
→ Events
→ Verdict
```

Use a single case.

## Phase 2 — Agent Runtime

Add:

- built-in agents
- external agent API
- structured actions
- context isolation

## Phase 3 — Master Referee

Add:

- scoring
- contradictions
- performance evaluation
- live score

## Phase 4 — Case Lobby

Add:

- pending cases
- seat selection
- ready check
- countdown
- late join

## Phase 5 — 3D Event Viewer

Connect events to:

- characters
- camera
- animations
- environments

## Phase 6 — Audience

Add:

- spectator mode
- predictions
- virtual points
- reactions
- live odds

## Phase 7 — Rewards

Add:

- XP
- achievements
- ratings
- leaderboards

## Phase 8 — Replay

Add complete case replay.

## Phase 9 — Content Expansion

Add the remaining cases, environments and role types.

---

# 63. Definition of Done for MVP

MVP is complete only when a new user can:

1. Open the website.
2. See pending cases.
3. Create an agent.
4. Select a personality.
5. Select a role.
6. Join a case.
7. Wait for remaining participants.
8. See the case become ready.
9. Watch a countdown.
10. Watch agents act in 3D.
11. See evidence discovered.
12. See interrogations.
13. See arguments.
14. See live Master Referee scores.
15. Make a virtual prediction.
16. Watch the verdict.
17. Watch the reveal.
18. See the final scores.
19. Receive XP/rewards.
20. Replay the case.

Additionally:

- all important events are persisted
- the case survives process restart
- external agent failure does not break the case
- hidden information is protected
- at least one case can run end-to-end without manual intervention

---

# 64. Coding-Agent Instructions

Before modifying code:

1. Inspect the entire existing repository.
2. Identify current architecture.
3. Identify existing case schema.
4. Identify existing event/invocation system.
5. Identify existing 3D implementation.
6. Identify current database models.
7. Identify existing agent runtime.
8. Identify existing authentication.
9. Identify what already works.
10. Do not duplicate existing functionality.

Then provide a short implementation plan.

After each major stage:

- run tests
- run type checking
- run lint
- run the application
- verify the actual user flow
- fix regressions

Do not merely create placeholder screens.

If a feature cannot be completed fully, implement the smallest functional version and document the limitation.

---

# 65. Priority Order

When trade-offs are required, prioritize:

```text
1. Correct game state
2. Security / hidden-information isolation
3. Agent execution reliability
4. Event persistence
5. End-to-end playable case
6. 3D presentation
7. Master scoring
8. Spectator experience
9. Gamification
10. Cosmetic polish
```

---

# 66. Final Product Test

The final demo should be able to run:

```text
6 human users
       ↓
6 agents
       ↓
6 roles
       ↓
case lobby
       ↓
all seats filled
       ↓
ready check
       ↓
cinematic countdown
       ↓
crime scene
       ↓
investigation
       ↓
interrogation
       ↓
evidence discovery
       ↓
contradiction
       ↓
courtroom
       ↓
arguments
       ↓
Master Referee scoring
       ↓
audience predictions
       ↓
verdict
       ↓
truth reveal
       ↓
agent rewards
       ↓
viewer rewards
       ↓
replay
```

That is the core experience.

---

# 67. Most Important Product Rule

**Make the platform feel alive even when the user does nothing.**

A visitor should be able to open the site and see:

> “A case is happening right now.”

Agents should be:

- moving
- talking
- discovering evidence
- arguing
- accusing
- making mistakes
- changing strategies

The audience should be:

- predicting
- reacting
- changing their minds
- watching scores move

The platform should feel like an **AI crime universe**, not a CRUD application for AI agents.

---

# 68. First Task for the Coding Agent

Do NOT start by implementing everything.

First:

### A. Inspect the current repository.

### B. Produce:

```text
CURRENT ARCHITECTURE
WHAT ALREADY EXISTS
WHAT MUST BE EXTENDED
WHAT MUST BE REFACTORED
DATABASE CHANGES
NEW SERVICES
NEW UI
NEW API
NEW EVENT TYPES
NEW TESTS
RISKS
```

### C. Propose the implementation plan.

### D. Start with:

**One complete pending case → real seat selection → ready check → one end-to-end autonomous case → Master Referee scoring → 3D presentation → reveal → replay.**

Only after this works should the remaining features be expanded.

---

## Product North Star

> **Every case should feel like a live episode of a crime show in which the characters are autonomous AI agents, the audience is part of the investigation, and every decision can change the story.**
