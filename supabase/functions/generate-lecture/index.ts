import { corsHeaders } from '../_shared/cors.ts';

const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

// 📚 LECTURES: Best research/reasoning AI — Gemini Pro + GPT flagship
const LECTURE_MODELS = [
  'google/gemini-3-pro-preview',
  'openai/gpt-5.1',
  'google/gemini-3-flash-preview',
  'openai/gpt-5-mini',
  'google/gemini-2.5-flash-lite',
];

let modelIndex = 0;

const tryAI = async (messages: any[], maxTokens = 4000) => {
  let attempts = 0;
  while (attempts < LECTURE_MODELS.length) {
    const model = LECTURE_MODELS[modelIndex];
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
          modelIndex = (modelIndex + 1) % LECTURE_MODELS.length;
          attempts++; continue;
        }
        throw new Error(`API error: ${err.slice(0, 200)}`);
      }
      const data = await resp.json();
      return { content: data.choices?.[0]?.message?.content ?? '', model };
    } catch (e: any) {
      console.error(`[ERR] ${model}: ${e.message}`);
      modelIndex = (modelIndex + 1) % LECTURE_MODELS.length;
      attempts++;
    }
  }
  throw new Error('All lecture models exhausted.');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { topic, subject, depth } = await req.json();

    const lecturePrompt = `You are a master educator writing a ${depth || 'standard'} textbook chapter on **"${topic}"** for ${subject}.

Write a complete, textbook-quality lecture using this EXACT structure:

---

# ${topic}
### ${subject} | Chapter Notes

---

## 1. 🎯 Introduction
[2-3 sentences: Why does this topic matter? Real-world hook.]

---

## 2. 📖 Prerequisites
> Before reading this, you should know: [list 2-3 concepts as bullet points]

---

## 3. 🔑 Core Concepts

### 3.1 [First Key Concept]
[Definition + explanation. Use $inline math$ for formulas.]

> 💡 **Key Point:** [One-line golden rule]

### 3.2 [Second Key Concept]
[Definition + explanation]

> 💡 **Key Point:** [One-line golden rule]

[Add more sub-sections as needed]

---

## 4. 📐 Formulas & Laws

| Formula | What it means |
|---------|--------------|
| $$formula_1$$ | [Explanation] |
| $$formula_2$$ | [Explanation] |

---

## 5. 🔍 Worked Examples

### Example 1 — [Name]
**Problem:** [State the problem]

**Solution:**
**Given:** [list givens]
**Find:** [what to find]

Step 1: [action → result]
Step 2: [action → result]

**∴ Answer: [bold the answer]**

### Example 2 — [Name]
[Same format]

---

## 6. ⚡ Common Mistakes
1. ❌ **Mistake:** [what students do wrong] → ✅ **Fix:** [correct approach]
2. ❌ **Mistake:** [another mistake] → ✅ **Fix:** [correct approach]

---

## 7. 😄 MacroMind Memory Tricks
> *[One funny, memorable analogy or mnemonic for the whole topic]*

---

## 8. ✅ Chapter Summary
- [Key point 1]
- [Key point 2]
- [Key point 3]
- [Key point 4 if needed]

---

CRITICAL MATH RULES (MUST FOLLOW EXACTLY):
- Inline math: $expression$ — single dollar signs, e.g. $E = mc^2$ or $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$
- Display/block math: $$expression$$ — double dollar signs on their own line
- Example display: $$\\int_a^b f(x)\\,dx = F(b) - F(a)$$
- NEVER use \\(...\\) or \\[...\\] delimiters — ONLY $ and $$ work here
- NEVER write "theta//" or plain "x^2" as text — always use LaTeX in $ delimiters
- Unicode symbols outside math: θ π α β γ λ ω Σ ∫ √ ² ³ ± ≥ ≤ ≠ ∞ ∴

Keep it comprehensive but digestible. Max 600 words for the lecture content.`;

    const practicePrompt = `Create 5 practice problems for "${topic}" (${subject}). Include a mix of easy, medium, and hard.

Use $...$ for inline math and $$...$$ for display math in questions and solutions.

Return ONLY valid JSON (no markdown):
{
  "problems": [
    {
      "question": "Full problem statement. Use $inline math$ where needed.",
      "difficulty": "easy|medium|hard",
      "marks": 2,
      "hint": "Specific algorithmic hint",
      "solution": "Step 1: action with $math$ if needed\\nStep 2: ...\\n∴ Answer: **result**"
    }
  ]
}`;

    const [lectureRes, practiceRes] = await Promise.all([
      tryAI([
        { role: 'system', content: 'You are an expert textbook author. Write in proper academic format. Use $...$ for inline math and $$...$$ for display math. NEVER use \\(...\\) or \\[...\\] delimiters.' },
        { role: 'user', content: lecturePrompt }
      ], 4000),
      tryAI([
        { role: 'system', content: 'Return ONLY valid JSON. No markdown fences. Use $...$ for inline math.' },
        { role: 'user', content: practicePrompt }
      ], 1500)
    ]);

    let practiceProblems = [];
    try {
      const cleaned = practiceRes.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      practiceProblems = JSON.parse(cleaned).problems;
    } catch {
      practiceProblems = [];
    }

    console.log(`[SUCCESS] Lecture by ${lectureRes.model}`);
    return new Response(JSON.stringify({
      lecture: lectureRes.content,
      practiceProblems,
      modelUsed: lectureRes.model
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e: any) {
    console.error('[ERROR] generate-lecture:', e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
