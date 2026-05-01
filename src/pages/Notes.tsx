import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Loader2, ArrowLeft, Zap, Lock, Sparkles, Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useXP } from '@/contexts/XPContext';
import AdGate from '@/components/features/AdGate';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { preprocessMath } from '@/lib/mathPreprocess';
import { useTTS } from '@/hooks/useTTS';

const SUBJECTS = ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'CS'];
const SUBJECT_EMOJIS: Record<string, string> = {
  Math: '📐', Physics: '⚛️', Chemistry: '🧪', Biology: '🧬',
  English: '📝', History: '🏛️', Geography: '🌍', CS: '💻',
};

const Notes = () => {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState('');
  const [showAd, setShowAd] = useState(false);
  const [adUnlocked, setAdUnlocked] = useState(false);
  const [pendingGenerate, setPendingGenerate] = useState(false);
  const navigate = useNavigate();
  const { addXP, unlockAchievement } = useXP();
  const { speak, stop, pause, resume, speaking, paused } = useTTS();

  const doGenerate = async () => {
    setLoading(true);
    setNote(null);
    stop();
    try {
      const { data, error } = await supabase.functions.invoke('generate-lecture', {
        body: { topic, subject, depth: 'concise' }
      });
      if (error) throw error;
      setNote(data.lecture);
      setModelUsed(data.modelUsed || '');
      addXP(40, `${subject} notes`);
      unlockAchievement('first_note');
      toast.success('Notes ready! 📖');
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate notes');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (!subject || !topic) { toast.error('Pick a subject and enter a topic!'); return; }
    if (!adUnlocked) { setPendingGenerate(true); setShowAd(true); return; }
    doGenerate();
  };

  const handleTTS = () => {
    if (!note) return;
    if (speaking) stop();
    else speak(`${subject} notes on ${topic}. ${note}`);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {showAd && (
        <AdGate
          reason="Watch a short ad to generate AI notes!"
          onComplete={() => {
            setShowAd(false); setAdUnlocked(true);
            if (pendingGenerate) { setPendingGenerate(false); doGenerate(); }
          }}
          onClose={() => { setShowAd(false); setPendingGenerate(false); }}
        />
      )}

      {/* Header */}
      <div className="glass-strong border-b border-border/20 sticky top-0 z-40">
        <div className="container mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-xl w-9 h-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm leading-none">Smart Notes</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">AI-crafted notes + listen aloud</p>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-black text-yellow-500 bg-yellow-500/10 rounded-lg px-2 py-1">
            <Zap className="w-3 h-3" /> +40 XP
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-5 space-y-4">
        {/* Subject selector */}
        <div className="section-card p-5">
          <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">Select Subject</label>
          <div className="grid grid-cols-4 gap-2">
            {SUBJECTS.map(s => (
              <button key={s} onClick={() => setSubject(s)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                  subject === s
                    ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white border-transparent shadow-md shadow-orange-500/25'
                    : 'bg-muted/40 border-border/50 text-muted-foreground hover:border-orange-500/40 hover:text-foreground'
                }`}>
                <span className="text-base">{SUBJECT_EMOJIS[s]}</span>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Input */}
        <div className="section-card p-5">
          <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">Topic</label>
          <Input
            placeholder="e.g., Photosynthesis, Derivatives, World War 2..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            className="h-11 bg-muted/40 border-border/50 rounded-xl text-sm"
          />
        </div>

        <Button onClick={handleGenerate} disabled={loading}
          className="w-full h-12 font-bold text-base gap-2 btn-primary">
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Textbook Notes...</>
            : adUnlocked
              ? <><Sparkles className="w-4 h-4" />Generate Notes</>
              : <><Lock className="w-4 h-4" />Generate Notes (watch short ad)</>
          }
        </Button>

        {/* Notes Output */}
        {note && (
          <div className="section-card-glow rounded-2xl overflow-hidden slide-up">
            {/* Note header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/30"
              style={{ background: 'hsl(258 90% 68% / 0.06)' }}>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-black text-foreground">{subject} — {topic}</span>
              </div>
              <div className="flex items-center gap-2">
                {modelUsed && (
                  <span className="text-[10px] text-muted-foreground font-mono">{modelUsed.split('/').pop()}</span>
                )}
                {/* TTS controls */}
                <div className="flex items-center gap-1">
                  {speaking && (
                    <button onClick={() => paused ? resume() : pause()}
                      className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 rounded-lg px-2 py-1 hover:bg-primary/20 transition-colors">
                      {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    </button>
                  )}
                  <button onClick={handleTTS}
                    className={`flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-2.5 py-1 transition-colors ${
                      speaking
                        ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                        : 'text-primary bg-primary/10 hover:bg-primary/20'
                    }`}>
                    {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    {speaking ? 'Stop' : '🔊 Listen'}
                  </button>
                </div>
              </div>
            </div>

            {/* Audio indicator */}
            {speaking && !paused && (
              <div className="flex items-center gap-2 px-5 py-2 bg-primary/5 border-b border-border/20">
                <Volume2 className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span className="text-[11px] text-primary font-bold">Reading notes aloud...</span>
                <div className="flex gap-0.5 ml-1">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="w-0.5 bg-primary rounded-full animate-bounce"
                      style={{ height: `${8 + i * 3}px`, animationDelay: `${i * 0.12}s` }} />
                  ))}
                </div>
              </div>
            )}

            <div className="p-6">
              <div className="textbook-prose">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {preprocessMath(note)}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
