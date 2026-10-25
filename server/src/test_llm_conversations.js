/**
 * test_llm_conversations.js
 * Validates BYO-LLM integration and ensures agents talk to each other in 1st Person POV.
 */

const assert = require('assert');
const CaseLoader = require('./engine/CaseLoader');
const GameSession = require('./engine/GameSession');
const LlmService = require('./engine/LlmService');

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TESTING 1ST PERSON POV MULTI-AGENT CONVERSATIONS & BYO-LLM');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const loader = new CaseLoader();
  const case001 = loader.getCase('CASE-001');

  // TEST 1: Test LlmService Provider Connection Tester
  console.log('▶ TEST 1: LlmService Connection Testing');
  const dummyResult = await LlmService.testConnection({
    provider: 'local',
    baseUrl: 'http://localhost:59999/v1',
    model: 'dummy-model'
  });
  // Since 59999 is not running, it should return success: false gracefully without crashing
  assert.strictEqual(dummyResult.success, false, 'Unreachable local LLM should fail gracefully');
  console.log('  ✔ LlmService handled unreachable endpoint gracefully:', dummyResult.error);

  // TEST 2: Create a live session with BYO-LLM agent
  console.log('\n▶ TEST 2: Attaching BYO-LLM to a Seated Agent');
  const session = new GameSession('CASE-001', case001, loader, { sessionId: 'LIVE-CASE-TEST', tickIntervalMs: 50 });
  
  // Attach BYO-LLM config to prosecutor seat
  const attachRes = session.attachLlmToSeat('prosecutor', {
    provider: 'openai',
    apiKey: 'sk-mock-test-key',
    model: 'gpt-4o-mini',
    temperature: 0.7
  });
  assert.strictEqual(attachRes.success, true);
  const prosecutorSeat = session.activeSeats.get('prosecutor');
  assert.ok(prosecutorSeat.llmConfig, 'Prosecutor seat should have llmConfig');
  assert.strictEqual(prosecutorSeat.llmConfig.provider, 'openai');
  console.log('  ✔ Successfully attached BYO-LLM to "prosecutor" seat.');

  // TEST 3: Step through multiple rounds and inspect 1st Person POV dialogue
  console.log('\n▶ TEST 3: Stepping Autonomous Rounds and Checking 1st Person POV Spoken Dialogue');
  
  // Step 4 rounds (Briefing -> Investigation)
  await session.stepRound();
  await session.stepRound();
  await session.stepRound();
  await session.stepRound();

  const spectatorView = session.getSpectatorView();
  assert.ok(spectatorView.transcript.length > 0, 'Transcript should contain events');

  console.log(`  Spoken events generated: ${spectatorView.transcript.length}`);

  let spokenCount = 0;
  let firstPersonHits = 0;
  for (const event of spectatorView.transcript) {
    if (event.agentId !== 'system' && event.agentId !== 'engine' && ['say', 'ask_question', 'answer_question', 'give_argument', 'object', 'rule_on_objection', 'confess', 'deliver_verdict'].includes(event.action)) {
      spokenCount++;
      const text = event.spokenDialogue || event.params?.text || event.params?.question || event.params?.answer || '';
      
      // Check for first-person markers ('I ', "I'", 'my ', 'me ', 'we ', 'I hereby', 'I am', 'Your Honor')
      const is1stPov = /\b(I|my|me|myself|we|our|Your Honor|Counsel)\b/i.test(text);
      if (is1stPov) {
        firstPersonHits++;
      }
      console.log(`    [${event.role.toUpperCase()}] (${event.agentName}): "${text.slice(0, 90)}..." (1st POV: ${is1stPov})`);
    }
  }

  assert.ok(spokenCount > 0, 'Should have spoken events');
  assert.ok(firstPersonHits >= spokenCount * 0.7, 'At least 70% of spoken dialogue must explicitly contain 1st person markers');
  console.log(`  ✔ ${firstPersonHits}/${spokenCount} spoken lines strictly verified in 1st Person POV!`);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🎉 ALL 1ST PERSON POV & BYO-LLM TESTS PASSED SUCCESSFULLY');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
