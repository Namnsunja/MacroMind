import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Loader2, BookOpen, ArrowLeft, Zap, ChevronDown, ChevronUp,
  Volume2, VolumeX, Pause, Play
} from 'lucide-react';
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
const DEPTHS = [
  { label: 'Brief', desc: '5 min', emoji: '⚡', value: 'brief' },
  { label: 'Standard', desc: '10 min', emoji: '📖', value: 'standard' },
  { label: 'Deep Dive', desc: '20 min', emoji: '🔬', value: 'comprehensive', ad: true },
];
const DIFF_COLORS: Record<string, string> = {
  easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25',
  hard: 'bg-red-500/10 text-red-400 border-red-500/25',
};

const Lectures = () => {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState('Standard');
  const [loading, setLoading] = useState(false);
  const [lecture, setLecture] = useState<string | null>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [modelUsed, setModelUsed] = useState('');
  const [openHint, setOpenHint] = useState<number | null>(null);
  const [openSol, setOpenSol] = useState<number | null>(null);
  const [showAd, setShowAd] = useState(false);
  const navigate = useNavigate();
  const { addXP, unlockAchievement } = useXP();
  const { speak, stop, pause, resume, speaking, paused } = useTTS();

  const doGenerate = async () => {
    setLoading(true);
    setLecture(null);
    setProblems([]);
    stop();
    try {
      const { data, error } = await supabase.functions.invoke('generate-lecture', {
        body: { topic, subject, depth: depth.toLowerCase() }
      });
      if (error) throw error;
      setLecture(data.lecture);
      setProblems(data.practiceProblems || []);
      setModelUsed(data.modelUsed || '');
      addXP(45, `${depth} lecture`);
      unlockAchievement('first_lecture');
      toast.success('Lecture ready! 🎓');
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate lecture');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (!subject || !topic) { toast.error('Pick subject and topic!'); return; }
    if (depth === 'Deep Dive') { setShowAd(true); return; }
    doGenerate();
  };

  const handleTTS = () => {
    if (!lecture) return;
    if (speaking) stop();
    else speak(`${subject}. ${topic}. ${lecture}`);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {showAd && (
        <AdGate
          reason="Deep Dive lectures are premium — watch a short ad to unlock!"
          onComplete={() => { setShowAd(false); doGenerate(); }}
          onClose={() => setShowAd(false)}
        />
      )}

      {/* Header */}
      <div className="glass-strong border-b border-border/20 sticky top-0 z-40">
        <div className="container mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-xl w-9 h-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm leading-none">Lecture Generator</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Textbook-quality AI lectures with audio</p>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-black text-yellow-500 bg-yellow-500/10 rounded-lg px-2 py-1">
            <Zap className="w-3 h-3" /> +45 XP
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-5 space-y-4">
        {/* Subject */}
        <div className="section-card p-5">
          <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">Subject</label>
          <div className="grid grid-cols-4 gap-2">
            {SUBJECTS.map(s => (
              <button key={s} onClick={() => setSubject(s)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                  subject === s
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent shadow-md shadow-indigo-500/25'
                    : 'bg-muted/40 border-border/50 text-muted-foreground hover:border-indigo-500/40 hover:text-foreground'
                }`}>
                <span className="text-base">{SUBJECT_EMOJIS[s]}</span>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Topic */}
        <div className="section-card p-5">
          <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">Topic</label>
          <Input
            placeholder="e.g., Newton's Laws, Binary Trees, French Revolution..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            className="h-11 bg-muted/40 border-border/50 rounded-xl text-sm"
          />
        </div>

        {/* Depth */}
        <div className="section-card p-5">
          <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">Lecture Depth</label>
          <div className="grid grid-cols-3 gap-2">
            {DEPTHS.map(d => (
              <button key={d.label} onClick={() => setDepth(d.label)}
                className={`py-4 rounded-xl text-sm font-bold border flex flex-col items-center gap-1.5 transition-all ${
                  depth === d.label
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent shadow-md shadow-indigo-500/25'
                    : 'bg-muted/40 border-border/50 text-muted-foreground hover:border-indigo-500/40'
                }`}>
                <span className="text-2xl">{d.emoji}</span>
                <span className="font-black">{d.label}</span>
                <span className="text-[10px] opacity-70">{d.desc}</span>
                {d.ad && <span className="text-[9px] bg-yellow-500/20 text-yellow-400 rounded px-1.5 py-0.5">📺 Ad</span>}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full h-12 btn-primary font-bold text-base gap-2">
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Lecture...</>
            : <><BookOpen className="w-4 h-4" />Generate Lecture</>
          }
        </Button>

        {/* Lecture Content */}
        {lecture && (
          <div className="section-card-glow rounded-2xl overflow-hidden slide-up">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/30"
              style={{ background: 'hsl(258 90% 68% / 0.06)' }}>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span className="text-sm font-black">{subject} — {topic}</span>
              </div>
              <div className="flex items-center gap-2">
                {modelUsed && (
                  <span className="text-[10px] text-muted-foreground font-mono">{modelUsed.split('/').pop()}</span>
                )}
                {/* TTS Controls */}
                <div className="flex items-center gap-1">
                  {speaking && (
                    <button onClick={() => paused ? resume() : pause()}
                      className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 rounded-lg px-2 py-1 hover:bg-primary/20 transition-colors">
                      {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    </button>
                  )}
                  <button onClick={handleTTS}
                    className={`flex items-center gap-1 text-[11px] font-bold rounded-lg px-2.5 py-1 transition-colors ${
                      speaking
                        ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                        : 'text-primary bg-primary/10 hover:bg-primary/20'
                    }`}>
                    {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    {speaking ? 'Stop' : 'Listen'}
                  </button>
                </div>
              </div>
            </div>

            {/* Audio wave indicator */}
            {speaking && !paused && (
              <div className="flex items-center gap-1.5 px-5 py-2 bg-primary/5 border-b border-border/20">
                <Volume2 className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span className="text-[11px] text-primary font-bold">Reading aloud...</span>
                <div className="flex gap-0.5 ml-1">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className="w-0.5 bg-primary rounded-full animate-bounce"
                      style={{ height: `${8 + Math.random() * 8}px`, animationDelay: `${i * 0.12}s` }} />
                  ))}
                </div>
              </div>
            )}

            <div className="p-6">
              <div className="textbook-prose">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {preprocessMath(lecture)}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Practice Problems */}
        {problems.length > 0 && (
          <div className="slide-up">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-black text-base text-foreground">📝 Practice Problems</h3>
              <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">{problems.length} questions</span>
            </div>
            <div className="space-y-3">
              {problems.map((p, i) => (
                <div key={i} className="section-card p-4 rounded-2xl">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="textbook-prose text-sm mb-2">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{preprocessMath(p.question)}</ReactMarkdown>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${DIFF_COLORS[p.difficulty] || DIFF_COLORS.medium}`}>
                          {p.difficulty}
                        </span>
                        {p.marks && <span className="text-[11px] text-muted-foreground">{p.marks} marks</span>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button onClick={() => setOpenHint(openHint === i ? null : i)}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                      💡 Hint {openHint === i ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {openHint === i && (
                      <div className="text-xs text-muted-foreground bg-muted/40 border border-border/40 rounded-xl p-3 leading-relaxed">
                        {p.hint}
                      </div>
                    )}

                    <button onClick={() => setOpenSol(openSol === i ? null : i)}
                      className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors">
                      ✅ Solution {openSol === i ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {openSol === i && (
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                        <div className="textbook-prose text-sm">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{preprocessMath(p.solution)}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lectures;
