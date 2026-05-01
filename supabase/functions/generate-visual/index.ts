import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

// 🎨 VISUALS: Nano Banana models — purpose-built for image generation
const IMAGE_MODELS = [
  'google/gemini-3.1-flash-image-preview',  // Nano Banana 2 — best quality+speed
  'google/gemini-3-pro-image-preview',       // Nano Banana Pro — highest fidelity
  'google/gemini-2.5-flash-image',           // Nano Banana — fast, reliable
  'openai/gpt-image-1.5',                    // GPT Image fallback
];

let modelIndex = 0;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { prompt, type } = await req.json();
    console.log('Generating visual:', { prompt, type });

    // Craft a detailed educational-focused prompt for each type
    const enhancedPrompt =
      type === 'flowchart'
        ? `Ultra-clean educational flowchart: ${prompt}. Style: white background, rounded rectangle boxes with light blue fill, arrows with labels, hierarchical layout top-to-bottom, clean sans-serif font, color-coded by step type (start=green, process=blue, decision=yellow, end=red), professional infographic quality, 16:9 aspect ratio.`
        : type === 'illustration'
        ? `Detailed educational illustration: ${prompt}. Style: bright colors, student-friendly, labeled diagram, textbook quality, white background, clear annotations with arrows pointing to parts, scientific accuracy, vibrant but not cartoonish, 16:9 aspect ratio.`
        : type === 'mindmap'
        ? `Educational mind map: ${prompt}. Style: central concept in circle, branches radiating outward, each branch a different color, clear text labels, white background, organized and easy to read, professional infographic style, 16:9 aspect ratio.`
        : `High-quality educational diagram: ${prompt}. Style: clean white background, clearly labeled with arrows and callouts, color-coded sections, textbook-quality illustration, easy to understand for students, professional infographic design, 16:9 aspect ratio.`;

    let attempts = 0;
    while (attempts < IMAGE_MODELS.length) {
      const model = IMAGE_MODELS[modelIndex];
      try {
        console.log(`[TRYING] ${model}`);
        const resp = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: enhancedPrompt }],
            modalities: ['image', 'text'],
            image_config: { aspect_ratio: '16:9', image_size: '2K' }
          }),
        });

        if (!resp.ok) {
          const err = await resp.text();
          if (resp.status === 429 || err.includes('quota') || err.includes('rate limit')) {
            console.log(`[QUOTA] ${model} exhausted, next...`);
            modelIndex = (modelIndex + 1) % IMAGE_MODELS.length;
            attempts++; continue;
          }
          throw new Error(`API error: ${err.slice(0, 200)}`);
        }

        const data = await resp.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (!imageUrl) throw new Error('No image in response');

        // base64 → blob → Supabase Storage
        const base64Data = imageUrl.split(',')[1];
        const byteChars = atob(base64Data);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArr], { type: 'image/png' });

        const fileName = `public/${crypto.randomUUID()}.png`;
        const { error: uploadErr } = await supabaseAdmin.storage.from('visuals').upload(fileName, blob, {
          contentType: 'image/png', cacheControl: '3600', upsert: false
        });
        if (uploadErr) throw uploadErr;

        const { data: { publicUrl } } = supabaseAdmin.storage.from('visuals').getPublicUrl(fileName);
        console.log(`[SUCCESS] Visual by ${model}: ${fileName}`);

        return new Response(JSON.stringify({ imageUrl: publicUrl, modelUsed: model }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e: any) {
        console.error(`[ERR] ${model}: ${e.message}`);
        modelIndex = (modelIndex + 1) % IMAGE_MODELS.length;
        attempts++;
      }
    }
    throw new Error('All image models exhausted.');
  } catch (e: any) {
    console.error('[FATAL] Visual gen:', e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
