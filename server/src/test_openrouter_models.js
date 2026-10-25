const key1 = process.env.KEY_1;
const key2 = process.env.KEY_2;

async function testPrompt(model, key, role) {
  const systemPrompt = `You are a trial lawyer (${role}) in a high-stakes murder trial.
CRITICAL: Speak in FIRST PERSON POV ('I', 'me', 'my', 'Your Honor').
Keep your argument punchy (1 to 2 sentences).
Return a JSON object ONLY:
{"action": "give_argument", "text": "spoken statement", "thought_summary": "internal tactical thoughts"}`;

  const userPrompt = `The opposing counsel claims their alibi is completely bulletproof. Counter their argument right now in 1st Person!`;

  const start = Date.now();
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Interrogation Room'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });
  const dur = Date.now() - start;
  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  console.log(`\n=== [${role}] Model: ${model} (${dur}ms) ===`);
  if (msg?.reasoning) {
    console.log(`Thinking/Reasoning: "${msg.reasoning.trim().slice(0, 150)}..."`);
  }
  console.log(`Spoken Content: ${msg?.content}`);
}

async function run() {
  await testPrompt('recursive/flint-v1.0:free', key1, 'Prosecutor');
  await testPrompt('recursive/flint-v1.0:free', key2, 'Defense Attorney');
  await testPrompt('nvidia/nemotron-3.5-lightning:free', key1, 'Detective');
}

run();
