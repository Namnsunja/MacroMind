import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, Loader2, Sparkles, ArrowLeft, Zap, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getUser } from '@/lib/auth';
import { useXP } from '@/contexts/XPContext';
import AdGate from '@/components/features/AdGate';

const VISUAL_TYPES = [
  { value: 'diagram', label: 'Diagram', emoji: '📊', desc: 'Labeled educational diagrams' },
  { value: 'flowchart', label: 'Flowchart', emoji: '🔄', desc: 'Process flows & logic' },
  { value: 'illustration', label: 'Illustration', emoji: '🎨', desc: 'Visual explanations' }
];

const VisualMaker = () => {
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState('diagram');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showAd, setShowAd] = useState(false);
  const navigate = useNavigate();
  const user = getUser();
  const { addXP, unlockAchievement } = useXP();

  const doGenerate = async () => {
    if (!prompt) { toast.error('Describe what you want!'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-visual', {
        body: { prompt, type }
      });
      if (error) throw error;
      setGeneratedImage(data.imageUrl);
      addXP(35, `Generated ${type} visual`);
      unlockAchievement('first_visual');
      toast.success(`🎨 Visual by ${data.modelUsed.split('/')[0]}!`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate visual');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (!prompt) { toast.error('Describe what you want to visualize!'); return; }
    setShowAd(true);
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {showAd && (
        <AdGate
          reason="Watch a short ad to generate AI-powered educational visuals!"
          onComplete={() => { setShowAd(false); doGenerate(); }}
          onClose={() => setShowAd(false)}
        />
      )}

      <div className="glass-strong border-b border-border/40 sticky top-0 z-40">
        <div className="container mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-xl w-9 h-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-pink-600 to-rose-600 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-base leading-none">Visual Maker</p>
              <p className="text-xs text-muted-foreground">AI diagrams, flowcharts & more</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs text-primary bg-primary/10 rounded-lg px-2 py-1 font-bold">
            <Zap className="w-3 h-3" /> +35 XP
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-5 space-y-4">
        <div className="section-card border border-border/60 rounded-2xl p-5">
          <label className="block font-bold text-sm text-muted-foreground mb-2">VISUAL TYPE</label>
          <div className="grid grid-cols-3 gap-2">
            {VISUAL_TYPES.map(vt => (
              <button key={vt.value} onClick={() => setType(vt.value)}
                className={`py-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${type === vt.value ? 'bg-primary text-primary-foreground border-transparent' : 'bg-muted/40 border-border/40 hover:border-primary/40'}`}>
                <span className="text-2xl">{vt.emoji}</span>
                <span className="font-bold text-sm">{vt.label}</span>
                <span className="text-[10px] opacity-70 text-center">{vt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="section-card border border-border/60 rounded-2xl p-5">
          <label className="block font-bold text-sm text-muted-foreground mb-2">DESCRIBE YOUR VISUAL</label>
          <Input
            placeholder="e.g., Water cycle with labels, Cell structure, Binary tree..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            className="h-11 bg-muted/40 border-border/40 rounded-xl"
          />
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full h-12 btn-primary font-bold text-base gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating Visual...</> :
            <><Lock className="w-4 h-4" />Generate Visual (Watch 10s Ad)</>}
        </Button>

        {generatedImage && (
          <div className="section-card border border-border/60 rounded-2xl overflow-hidden">
            <img src={generatedImage} alt="Generated visual" className="w-full" />
            <div className="p-3">
              <Button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = generatedImage;
                  a.download = 'macromind-visual.png';
                  a.click();
                }}
                variant="outline"
                className="w-full h-10 text-sm border-border/60"
              >
                📥 Download
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualMaker;
