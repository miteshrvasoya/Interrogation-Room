/**
 * LlmService.js
 * Multi-Provider LLM integration for BYO-LLM ("Bring Your Own LLM") autonomous agents.
 * Supports OpenAI, Anthropic Claude, Google Gemini, Groq, OpenRouter, and Local OpenAI-compatible
 * endpoints (Ollama, LM Studio, vLLM, LocalAI).
 * 
 * Generates autonomous, human-like arguments and cross-examinations in 1st Person POV ('I', 'me', 'my').
 */

class LlmService {
  constructor() {
    this.defaultTimeoutMs = 12000;
  }

  /**
   * Test an LLM configuration by sending a short test prompt
   */
  async testConnection(config = {}) {
    const { provider = 'openai', apiKey = '', baseUrl = '', model = '' } = config;

    const testPrompt = "You are a defense attorney in a courtroom murder trial. In one punchy sentence in 1st Person POV ('I'), object to the prosecutor badgering your client.";

    try {
      const callRes = await this.callProvider({
        provider,
        apiKey,
        baseUrl,
        model: model || this.getDefaultModel(provider),
        messages: [
          { role: 'system', content: 'You are a trial lawyer. Respond in 1st Person POV.' },
          { role: 'user', content: testPrompt }
        ],
        temperature: 0.7,
        maxTokens: 300
      });

      const responseText = (typeof callRes === 'object' ? (callRes.content || callRes.reasoning || callRes.text) : callRes) || '';

      return {
        success: true,
        provider,
        model: model || this.getDefaultModel(provider),
        sampleResponse: responseText.trim()
      };
    } catch (err) {
      return {
        success: false,
        provider,
        error: err.message
      };
    }
  }

  /**
   * Return default model for a given provider
   */
  getDefaultModel(provider = 'openai') {
    switch (provider.toLowerCase()) {
      case 'anthropic':
        return 'claude-3-5-sonnet-20241022';
      case 'gemini':
        return 'gemini-1.5-flash';
      case 'groq':
        return 'llama-3.3-70b-versatile';
      case 'openrouter':
        return 'recursive/flint-v1.0:free';
      case 'local':
      case 'ollama':
        return 'llama3';
      case 'openai':
      default:
        return 'gpt-4o-mini';
    }
  }

  /**
   * Core provider HTTP dispatcher
   */
  async callProvider({ provider, apiKey, baseUrl, model, messages, temperature = 0.7, maxTokens = 350 }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.defaultTimeoutMs);

    try {
      const prov = (provider || 'openai').toLowerCase();

      if (prov === 'anthropic') {
        const url = (baseUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, '') + '/messages';
        const systemMsg = messages.find(m => m.role === 'system')?.content || '';
        const userMsgs = messages.filter(m => m.role !== 'system');

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: model || 'claude-3-5-sonnet-20241022',
            system: systemMsg,
            messages: userMsgs.map(m => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content
            })),
            temperature,
            max_tokens: maxTokens
          }),
          signal: controller.signal
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Anthropic error (${res.status}): ${errBody.slice(0, 200)}`);
        }

        const data = await res.json();
        const text = data.content?.[0]?.text || '';
        return { text, content: text, reasoning: null, raw: data };
      }

      if (prov === 'gemini') {
        // If apiKey provided, use Gemini REST generateContent or OpenAI-compatible endpoint
        const cleanModel = model || 'gemini-1.5-flash';
        const url = baseUrl 
          ? `${baseUrl.replace(/\/+$/, '')}/chat/completions`
          : `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;

        if (!baseUrl) {
          // Standard Gemini REST API
          const systemMsg = messages.find(m => m.role === 'system')?.content || '';
          const contents = messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }));

          const body = {
            contents,
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens
            }
          };
          if (systemMsg) {
            body.systemInstruction = { parts: [{ text: systemMsg }] };
          }

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal
          });

          if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Gemini error (${res.status}): ${errBody.slice(0, 200)}`);
          }

          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return { text, content: text, reasoning: null, raw: data };
        }
      }

      // OpenAI-compatible format (OpenAI, Groq, OpenRouter, Local Ollama/LM Studio)
      let endpoint = '';
      if (baseUrl) {
        endpoint = baseUrl.replace(/\/+$/, '');
        if (!endpoint.endsWith('/chat/completions')) {
          endpoint += '/chat/completions';
        }
      } else if (prov === 'groq') {
        endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      } else if (prov === 'openrouter') {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      } else if (prov === 'local' || prov === 'ollama') {
        endpoint = 'http://localhost:11434/v1/chat/completions';
      } else {
        endpoint = 'https://api.openai.com/v1/chat/completions';
      }

      const headers = {
        'Content-Type': 'application/json'
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      if (prov === 'openrouter') {
        headers['HTTP-Referer'] = 'http://localhost:3000';
        headers['X-Title'] = 'Interrogation Room';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model || this.getDefaultModel(prov),
          messages,
          temperature,
          max_tokens: maxTokens
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${prov.toUpperCase()} error (${res.status}): ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      const choiceMsg = data.choices?.[0]?.message || {};
      const content = choiceMsg.content || '';
      const reasoning = choiceMsg.reasoning || (choiceMsg.reasoning_details?.[0]?.text) || null;
      return {
        text: content,
        content,
        reasoning,
        raw: data
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Generate an autonomous turn for an agent using their configured LLM
   */
  async generateAgentTurn({ agent, roleView, recentHistory = [], session }) {
    const llmConfig = agent.llmConfig;
    if (!llmConfig || !llmConfig.provider) {
      return null;
    }

    const { role } = agent;
    const { phase, round } = roleView;
    const caseData = session.caseData || {};
    const char = caseData.characters?.find(c => c.id === agent.characterId);

    // Format recent conversation history so LLM knows what previous agents argued
    const dialogueLines = recentHistory
      .slice(-6)
      .map(ev => {
        const speaker = ev.characterName || ev.agentName || ev.role;
        const text = ev.params?.text || ev.params?.question || ev.params?.answer || ev.params?.grounds || ev.narrative || '';
        return `${speaker} (${ev.role}): "${text}"`;
      })
      .filter(line => line.length > 5);

    const historyPrompt = dialogueLines.length > 0
      ? `RECENT COURTROOM & INTERROGATION DIALOGUE:\n${dialogueLines.join('\n')}`
      : 'Proceedings are just commencing.';

    const systemPrompt = `You are ${agent.displayName || agent.name}, acting as the ${role.toUpperCase()}${char ? ` (Character: ${char.name})` : ''} in a high-stakes murder case: "${caseData.title}".
Case Summary: ${caseData.summary || caseData.premise || 'A murder mystery under judicial investigation.'}
Current Phase: ${phase.toUpperCase()} (Round ${round}).
Your Archetype/Persona: ${agent.persona || agent.archetype || 'Sharp and articulate'}.
Your Catchphrase: "${agent.catchphrase || 'The truth will surface.'}".

CRITICAL INSTRUCTIONS:
1. Speak STRICTLY in FIRST PERSON POV ('I', 'me', 'my', 'Your Honor', 'Detective', 'Counsel').
2. DIRECTLY address, challenge, reply to, or build upon what the previous speakers just argued.
3. Keep your spoken argument/statement punchy, authentic, and human (1 to 3 dramatic sentences).
4. Do NOT speak as an AI or narrator. Speak as the living character in the room.
5. Choose one valid action from:
   - 'give_argument': present legal arguments or closing/opening statements
   - 'ask_question': cross-examine or question another participant
   - 'answer_question': answer a direct question or challenge
   - 'object': raise an objection to the previous speaker's claims
   - 'rule_on_objection': (if Judge) rule sustained or overruled
   - 'confess': (if Suspect under overwhelming evidence)
   - 'say': deliver a statement or observation

Return your output as a clean JSON object ONLY:
{
  "action": "give_argument" | "ask_question" | "answer_question" | "object" | "rule_on_objection" | "say",
  "text": "Your 1st Person POV spoken dialogue here.",
  "thought_summary": "Your internal tactical thought."
}`;

    const userPrompt = `${historyPrompt}\n\nIt is now your turn to speak. Deliver your next argument or statement in 1st Person POV. Respond with valid JSON only.`;

    try {
      const callRes = await this.callProvider({
        provider: llmConfig.provider,
        apiKey: llmConfig.apiKey || '',
        baseUrl: llmConfig.baseUrl || '',
        model: llmConfig.model || this.getDefaultModel(llmConfig.provider),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: llmConfig.temperature || 0.75,
        maxTokens: 500
      });

      const rawText = (typeof callRes === 'object' ? (callRes.content || callRes.text || '') : callRes) || '';
      const modelReasoning = typeof callRes === 'object' ? callRes.reasoning : null;

      // Parse JSON from output
      let parsed = null;
      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (parseErr) {
        // Fallback if not pure JSON
      }

      // If rawText didn't contain clean JSON but modelReasoning has JSON or direct text
      if (!parsed && !rawText && modelReasoning) {
        try {
          const jsonMatch = modelReasoning.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          }
        } catch (_) {}
      }

      const getTacticalThought = (given) => {
        if (given && given.trim().length > 5) return given.trim();
        if (modelReasoning && modelReasoning.trim().length > 5) {
          return modelReasoning.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 320);
        }
        return `Tactical reasoning by ${agent.displayName} (${llmConfig.model || 'Autonomous LLM'})`;
      };

      if (parsed && (parsed.text || parsed.question || parsed.grounds || parsed.answer)) {
        const action = parsed.action || (role === 'judge' ? 'rule_on_objection' : 'give_argument');
        const cleanText = (parsed.text || parsed.question || parsed.grounds || parsed.answer || '').replace(/^["']|["']$/g, '').trim();

        const params = { text: cleanText };
        if (action === 'ask_question') {
          params.question = cleanText;
          const targets = caseData.characters?.filter(c => c.id !== agent.characterId) || [];
          params.target_id = targets[0]?.id || 'suspect';
        } else if (action === 'answer_question') {
          params.answer = cleanText;
        } else if (action === 'object') {
          params.grounds = cleanText;
        } else if (action === 'rule_on_objection') {
          params.ruling = cleanText.toLowerCase().includes('sustain') ? 'sustained' : 'overruled';
          params.reason = cleanText;
        }

        return {
          action,
          params,
          thought_summary: getTacticalThought(parsed.thought_summary)
        };
      }

      // If raw text returned without JSON
      const cleanRaw = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      if (cleanRaw.length > 5) {
        return {
          action: role === 'judge' ? 'say' : 'give_argument',
          params: { text: cleanRaw },
          thought_summary: getTacticalThought(null)
        };
      }
    } catch (err) {
      console.warn(`[LlmService] Error generating turn for ${agent.displayName}: ${err.message}. Falling back to conversational engine.`);
    }

    return null;
  }
}

module.exports = new LlmService();
