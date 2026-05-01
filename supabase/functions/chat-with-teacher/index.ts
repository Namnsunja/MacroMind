import { corsHeaders } from '../_shared/cors.ts';

const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

// 💬 CHAT/DOUBTS: ChatGPT first, then Gemini — best at conversational teaching
const CHAT_MODELS = [
  'openai/gpt-5.1',
  'google/gemini-3-flash-preview',
  'openai/gpt-5-mini',
  'google/gemini-3-pro-preview',
  'openai/gpt-5-nano',
  'google/gemini-2.5-flash-lite',
];

let modelIndex = 0;

const tryAI = async (messages: any[], maxTokens = 2500) => {
  let attempts = 0;
  while (attempts < CHAT_MODELS.length) {
    const model = CHAT_MODELS[modelIndex];
    try {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
      });
      if (!resp.ok) {
        const err = await resp.text();
        if (resp.status === 429 || err.includes('quota') || err.includes('rate limit')) {
          console.log(`[QUOTA] ${model} exhausted, next...`);
          modelIndex = (modelIndex + 1) % CHAT_MODELS.length;
          attempts++; continue;
        }
        throw new Error(`API error (${resp.status}): ${err.slice(0, 200)}`);
      }
      const data = await resp.json();
      return { content: data.choices?.[0]?.message?.content ?? '', model };
    } catch (e: any) {
      console.error(`[ERR] ${model}: ${e.message}`);
      modelIndex = (modelIndex + 1) % CHAT_MODELS.length;
      attempts++;
    }
  }
  throw new Error('All chat models exhausted.');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages, imageBase64 } = await req.json();
    const lastMsg = messages[messages.length - 1];

    const userContent: any[] = [{ type: 'text', text: lastMsg.content }];
    if (imageBase64) {
      userContent.push({ type: 'image_url', image_url: { url: imageBase64 } });
    }

    const systemPrompt = `You are Professor MacroMind — a genius teacher who's also the most entertaining human alive.

PERSONALITY:
- Warm, encouraging, and genuinely excited about the topic
- ONE clever joke or analogy per response (not more)
- React naturally: "Oh nice one!", "Classic confusion — let me fix that!" 
- End with a punchy motivational one-liner

TEXTBOOK FORMAT (NON-NEGOTIABLE):
Use proper structured format like a real textbook answer:

**For concept questions:**
### 📌 Definition
[Clear 1-2 line definition]

### 🔍 Explanation
[Core idea, step by step]

### 💡 Example
[Worked example with proper math]

### 🧠 Remember
[Key point + 1 funny line]

**For problem-solving:**
### 🎯 Given
[List what's given]

### 📐 Method
[Formula or approach]

### 🔢 Solution
Step 1: ...
Step 2: ...
**Answer: [bold the answer]**

### 😄 Fun Fact
[One-liner joke or memory trick]

MATH RULES (CRITICAL — USE THESE EXACT DELIMITERS):
- Inline math: $expression$ — ALWAYS use single dollar signs
- Display math (block): $$expression$$ — for important standalone formulas
- Example inline: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$
- Example display: $$\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}$$
- NEVER use \\(...\\) or \\[...\\] — only $ and $$ delimiters
- NEVER write "theta//" or plain "x^2" as text
- Symbols when not in math: θ π α β γ δ λ μ σ Σ ∫ √ ² ³ ± ≥ ≤ ≠ ∞ → ∴

RESPONSE LENGTH:
- Simple question: max 150 words
- Complex derivation: max 300 words
- If image: describe what you see first, then solve`;

    const { content: reply, model } = await tryAI([
      { role: 'system', content: systemPrompt },
      ...messages.slice(0, -1),
      { role: 'user', content: userContent }
    ]);

    console.log(`[SUCCESS] Teacher replied with ${model}`);
    return new Response(JSON.stringify({ reply, modelUsed: model }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    console.error('[FATAL] Teacher chat:', e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
