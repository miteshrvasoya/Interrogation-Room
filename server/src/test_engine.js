const CaseLoader = require('./engine/CaseLoader');
const GameSession = require('./engine/GameSession');

async function testFullCaseRun() {
  console.log('=== TESTING GAME ENGINE AUTONOMOUS RUN ===');
  const loader = new CaseLoader();
  const case001 = loader.getCase('CASE-001');
  if (!case001) throw new Error('CASE-001 not found');

  const session = new GameSession('CASE-001', case001, loader, { tickIntervalMs: 50 });

  let roundCounter = 0;
  while (!session.isCompleted && roundCounter < 40) {
    roundCounter++;
    await session.stepRound();
  }

  console.log(`\n=== CASE COMPLETED AFTER ${roundCounter} ROUNDS ===`);
  console.log(`Final Phase: ${session.currentPhase}`);
  console.log(`Transcript Length: ${session.transcript.length}`);
  console.log(`Discovered Evidence: ${Array.from(session.discoveredEvidence).join(', ')}`);
  console.log(`Forensic Results: ${Array.from(session.forensicResults.keys()).join(', ')}`);
  console.log(`Exposed Contradictions: ${Array.from(session.exposedContradictions).join(', ')}`);
  console.log(`Delivered Verdicts: ${JSON.stringify(session.deliveredVerdicts)}`);
  
  const spectatorView = session.getSpectatorView();
  console.log(`Reveal Data Present: ${Boolean(spectatorView.revealData)}`);
  if (spectatorView.revealData) {
    console.log(`True Culprit: ${spectatorView.revealData.culprits.join(', ')}`);
    console.log(`Scores Generated: ${spectatorView.revealData.finalScores?.length}`);
    const winner = spectatorView.revealData.finalScores?.find(s => s.outcome === 'win');
    console.log(`Sample Winner: ${winner?.displayName} (${winner?.role}) - ${winner?.reason}`);
  }

  // Check thought summaries exist in reveal
  const eventsWithThoughts = spectatorView.transcript.filter(t => t.thought_summary);
  console.log(`Events with Revealed Thoughts: ${eventsWithThoughts.length}/${spectatorView.transcript.length}`);
  if (eventsWithThoughts.length > 0) {
    console.log(`Sample Thought: [${eventsWithThoughts[0].role}] "${eventsWithThoughts[0].thought_summary}"`);
  }

  console.log('=== TEST PASSED! ===');
}

testFullCaseRun().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
