import { corsHeaders } from '../_shared/cors.ts';

const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

// 📸 DOUBT ANALYSIS (image): ChatGPT + Gemini — both excellent at multimodal
const ANALYSIS_MODELS = [
  'openai/gpt-5.1',
  'google/gemini-3-flash-preview',
  'openai/gpt-5-mini',
  'google/gemini-3-pro-preview',
  'openai/gpt-5-nano',
  'google/gemini-2.5-flash-lite',
];

let modelIndex = 0;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, question } = await req.json();
    if (!imageBase64) throw new Error('No image provided');

    let attempts = 0;
    while (attempts < ANALYSIS_MODELS.length) {
      const model = ANALYSIS_MODELS[modelIndex];
      try {
        const resp = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: `You are Prof MacroMind — brilliant, witty, structured like a textbook.

Analyze the image and respond in this EXACT textbook format:

### 📋 Question Identified
[What the question/problem is asking — 1 sentence]

### 🔍 Concept
[Subject area and key concept involved]

### 📐 Solution

**Given:** [List all given values/info]

**Formula/Method:** $$key formula$$

**Step-by-Step:**

**Step 1:** [action] → result

**Step 2:** [action] → result

[Continue as needed]

**∴ Final Answer: [bold, boxed in your mind]**

### 🧠 Key Takeaway
[One sentence — the golden rule to remember]

### 😄 MacroMind Says
[ONE funny/memorable line]

MATH RULES (CRITICAL — USE THESE EXACT DELIMITERS):
- Inline math: $expression$ — single dollar signs
- Display/block math: $$expression$$ — double dollar signs
- Example: $\\theta = 45°$, $$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$$
- NEVER use \\(...\\) or \\[...\\] delimiters — ONLY $ and $$
- NEVER write "theta//" or plain "x^2" as text`
              },
              {
                role: 'user',
                content: [
                  { type: 'image_url', image_url: { url: imageBase64 } },
                  { type: 'text', text: question || 'Please analyze and solve this problem completely.' }
                ]
              }
            ],
            max_tokens: 1500
          }),
        });

        if (!resp.ok) {
          const err = await resp.text();
          if (resp.status === 429 || err.includes('quota') || err.includes('rate limit')) {
            console.log(`[QUOTA] ${model} exhausted, next...`);
            modelIndex = (modelIndex + 1) % ANALYSIS_MODELS.length;
            attempts++; continue;
          }
          throw new Error(`API error: ${err.slice(0, 200)}`);
        }

        const data = await resp.json();
        const answer = data.choices?.[0]?.message?.content ?? 'Could not analyze image.';
        console.log(`[SUCCESS] Doubt analyzed by ${model}`);

        return new Response(JSON.stringify({ answer, modelUsed: model }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e: any) {
        console.error(`[ERR] ${model}: ${e.message}`);
        modelIndex = (modelIndex + 1) % ANALYSIS_MODELS.length;
        attempts++;
      }
    }
    throw new Error('All models exhausted.');
  } catch (e: any) {
    console.error('[FATAL] analyze-doubt:', e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
