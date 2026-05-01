import { corsHeaders } from '../_shared/cors.ts';

const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

// 🧪 QUIZ: ChatGPT + Gemini — great at structured MCQ generation
const QUIZ_MODELS = [
  'openai/gpt-5.1',
  'google/gemini-3-flash-preview',
  'openai/gpt-5-mini',
  'google/gemini-3-pro-preview',
  'openai/gpt-5-nano',
  'google/gemini-2.5-flash-lite',
];

let modelIndex = 0;

const tryAI = async (messages: any[], maxTokens = 2000) => {
  let attempts = 0;
  while (attempts < QUIZ_MODELS.length) {
    const model = QUIZ_MODELS[modelIndex];
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
          modelIndex = (modelIndex + 1) % QUIZ_MODELS.length;
          attempts++; continue;
        }
        throw new Error(`API error: ${err.slice(0, 200)}`);
      }
      const data = await resp.json();
      return { content: data.choices?.[0]?.message?.content ?? '', model };
    } catch (e: any) {
      console.error(`[ERR] ${model}: ${e.message}`);
      modelIndex = (modelIndex + 1) % QUIZ_MODELS.length;
      attempts++;
    }
  }
  throw new Error('All quiz models exhausted.');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { subject, topic, difficulty, questionCount } = await req.json();

    const prompt = `Create exactly ${questionCount} multiple-choice quiz questions about "${topic}" in ${subject} at ${difficulty} difficulty level.

Rules:
- Questions should be accurate, curriculum-aligned, and properly worded
- Use $...$ for inline math (e.g. $x^2 + y^2 = r^2$) and $$...$$ for display math
- NEVER use \\(...\\) or \\[...\\] delimiters
- Options must be distinct and plausible (no obviously wrong distractors)
- Explanations should be concise (1-2 sentences), technically accurate, and optionally funny

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "questions": [
    {
      "question": "Question text with $inline math$ where needed",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "1-2 sentence explanation. Concise, accurate, optionally with one funny observation."
    }
  ]
}`;

    const { content, model } = await tryAI([
      { role: 'system', content: 'You are an expert educator creating curriculum-aligned quiz questions. Return ONLY valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    console.log(`[SUCCESS] Quiz by ${model}`);
    return new Response(JSON.stringify({ quiz: parsed, modelUsed: model }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    console.error('[ERROR] generate-quiz:', e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
