import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowLeft, Zap, Loader2, Bot } from 'lucide-react';
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

const SUBJECTS = ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'CS'];
const SUBJECT_EMOJIS: Record<string, string> = {
  Math: '📐', Physics: '⚛️', Chemistry: '🧪', Biology: '🧬',
  English: '📝', History: '🏛️', Geography: '🌍', CS: '💻',
};
const DIFFICULTIES = [
  { label: 'Easy', emoji: '🟢', xp: 30, desc: 'Fundamentals' },
  { label: 'Medium', emoji: '🟡', xp: 50, desc: 'Application' },
  { label: 'Hard', emoji: '🔴', xp: 80, desc: 'Advanced', ad: true },
];
const OPT_LABELS = ['A', 'B', 'C', 'D'];

const Quiz = () => {
  const [step, setStep] = useState<'setup' | 'quiz' | 'results'>('setup');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);
  const [modelUsed, setModelUsed] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [adAction, setAdAction] = useState<'hard' | null>(null);
  const navigate = useNavigate();
  const { addXP, unlockAchievement } = useXP();

  const xpPerQ = DIFFICULTIES.find(d => d.label === difficulty)?.xp || 50;

  const generateQuiz = async () => {
    if (!subject || !topic) { toast.error('Pick a subject and enter a topic!'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { subject, topic, difficulty, questionCount }
      });
      if (error) throw error;
      setQuiz(data.quiz);
      setModelUsed(data.modelUsed || '');
      setStep('quiz');
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (selected === null) { toast.error('Select an answer first!'); return; }
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    if (selected === quiz.questions[currentQ].correctAnswer) setScore(s => s + 1);
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ(q => q + 1);
      setSelected(null);
    } else {
      setStep('results');
      const finalScore = newAnswers.filter((a, i) => a === quiz.questions[i].correctAnswer).length;
      const earned = Math.round((finalScore / quiz.questions.length) * xpPerQ * questionCount);
      addXP(earned, `${difficulty} ${subject} quiz`);
      unlockAchievement('first_quiz');
      if (finalScore === quiz.questions.length) unlockAchievement('quiz_perfect');
    }
  };

  const restart = () => {
    setStep('setup'); setQuiz(null); setCurrentQ(0); setSelected(null);
    setAnswers([]); setScore(0); setTopic(''); setModelUsed('');
  };

  if (step === 'setup') return (
    <div className="min-h-screen bg-background pb-8">
      {showAd && (
        <AdGate
          reason="Hard mode quizzes require a short ad — worth it for +80 XP/question!"
          onComplete={() => { setShowAd(false); if (adAction === 'hard') setDifficulty('Hard'); setAdAction(null); }}
          onClose={() => { setShowAd(false); setAdAction(null); }}
        />
      )}

      <div className="glass-strong border-b border-border/20 sticky top-0 z-40">
        <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-xl w-9 h-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm leading-none">Quiz Mode</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">AI-generated • Instant feedback</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-5 space-y-4">
        {/* Subject */}
        <div className="section-card p-5">
          <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">Subject</label>
          <div className="grid grid-cols-4 gap-2">
            {SUBJECTS.map(s => (
              <button key={s} onClick={() => setSubject(s)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                  subject === s
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-transparent shadow-md shadow-blue-500/25'
                    : 'bg-muted/40 border-border/50 text-muted-foreground hover:border-blue-500/40 hover:text-foreground'
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
            placeholder="e.g., Quadratic Equations, Photosynthesis, WW2..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generateQuiz()}
            className="h-11 bg-muted/40 border-border/50 rounded-xl text-sm"
          />
        </div>

        {/* Difficulty */}
        <div className="section-card p-5">
          <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">Difficulty</label>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map(d => (
              <button key={d.label}
                onClick={() => {
                  if (d.label === 'Hard' && difficulty !== 'Hard') { setAdAction('hard'); setShowAd(true); }
                  else setDifficulty(d.label);
                }}
                className={`py-4 rounded-xl font-bold border flex flex-col items-center gap-1.5 transition-all ${
                  difficulty === d.label
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-transparent shadow-md shadow-blue-500/25'
                    : 'bg-muted/40 border-border/50 text-muted-foreground hover:border-blue-500/40'
                }`}>
                <span className="text-2xl">{d.emoji}</span>
                <span className="text-sm font-black">{d.label}</span>
                <span className="text-[10px] opacity-70">{d.desc}</span>
                <span className={`text-[10px] font-bold ${difficulty === d.label ? 'text-yellow-300' : 'text-yellow-500'}`}>
                  +{d.xp} XP/Q
                </span>
                {d.ad && <span className="text-[9px] bg-yellow-500/20 text-yellow-400 rounded px-1 py-0.5">📺 Ad</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Question count */}
        <div className="section-card p-5">
          <div className="flex justify-between items-center mb-3">
            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Questions</label>
            <span className="font-black text-primary text-lg">{questionCount}</span>
          </div>
          <input type="range" min="3" max="10" value={questionCount}
            onChange={e => setQuestionCount(parseInt(e.target.value))}
            className="w-full accent-violet-600 h-2 rounded-full"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground mt-2">
            <span>3 min</span><span>10 max</span>
          </div>
        </div>

        {/* XP Preview */}
        <div className="section-card p-4 flex justify-between items-center"
          style={{ background: 'hsl(258 90% 68% / 0.06)', border: '1px solid hsl(258 90% 68% / 0.15)' }}>
          <div>
            <p className="font-black text-sm text-foreground">Max XP Reward</p>
            <p className="text-[11px] text-muted-foreground">{questionCount} questions × {xpPerQ} XP each</p>
          </div>
          <div className="flex items-center gap-1.5 text-yellow-400 font-black text-2xl">
            <Zap className="w-5 h-5" /> {questionCount * xpPerQ}
          </div>
        </div>

        <Button onClick={generateQuiz} disabled={loading} className="w-full h-12 btn-primary font-bold text-base gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Quiz...</> : '🚀 Start Quiz!'}
        </Button>
      </div>
    </div>
  );

  if (step === 'quiz' && quiz) {
    const q = quiz.questions[currentQ];
    const progress = ((currentQ) / quiz.questions.length) * 100;

    return (
      <div className="min-h-screen bg-background">
        <div className="glass-strong border-b border-border/20 sticky top-0 z-40">
          <div className="container mx-auto max-w-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm">{currentQ + 1} / {quiz.questions.length}</span>
                <span className="text-xs text-muted-foreground">{subject} · {difficulty}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-black text-yellow-400">
                <Zap className="w-4 h-4" /> {score * xpPerQ} XP
              </div>
            </div>
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-2xl px-4 py-5 slide-up">
          {/* Question */}
          <div className="section-card-glow rounded-2xl p-5 mb-4">
            <div className="textbook-prose">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {preprocessMath(q.question)}
              </ReactMarkdown>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2.5 mb-5">
            {q.options.map((opt: string, i: number) => (
              <button key={i} onClick={() => setSelected(i)}
                className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-3 transition-all ${
                  selected === i
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/15'
                    : 'border-border/40 bg-card hover:border-primary/30 hover:bg-muted/30'
                }`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-all ${
                  selected === i
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>{OPT_LABELS[i]}</div>
                <div className="textbook-prose text-sm flex-1">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{preprocessMath(opt)}</ReactMarkdown>
                </div>
              </button>
            ))}
          </div>

          <Button onClick={nextQuestion} disabled={selected === null}
            className="w-full h-12 btn-primary font-bold text-base">
            {currentQ < quiz.questions.length - 1 ? 'Next Question →' : '🏁 Finish Quiz!'}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'results' && quiz) {
    const pct = Math.round((score / quiz.questions.length) * 100);
    const earned = Math.round((score / quiz.questions.length) * xpPerQ * questionCount);
    const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '👏' : '💪';
    const msg = pct >= 80 ? 'Outstanding!' : pct >= 60 ? 'Good Work!' : 'Keep Going!';

    return (
      <div className="min-h-screen bg-background pb-10">
        <div className="container mx-auto max-w-2xl px-4 pt-8">
          {/* Score banner */}
          <div className="section-card-glow rounded-3xl p-8 text-center mb-6">
            <div className="text-6xl mb-3 float">{emoji}</div>
            <h2 className="text-2xl font-black mb-1">{msg}</h2>
            <div className="text-6xl font-black gradient-text my-3">{score}/{quiz.questions.length}</div>
            <p className="text-muted-foreground text-sm">{pct}% correct</p>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-yellow-400 font-black text-lg">
              <Zap className="w-5 h-5" /> +{earned} XP earned
            </div>
            {modelUsed && (
              <div className="flex items-center justify-center gap-1 mt-3 text-[11px] text-muted-foreground">
                <Bot className="w-3 h-3" /> Generated by {modelUsed.split('/').pop()}
              </div>
            )}
          </div>

          {/* Answer review */}
          <h3 className="font-black text-sm mb-3 text-muted-foreground uppercase tracking-widest">Answer Review</h3>
          <div className="space-y-3 mb-6">
            {quiz.questions.map((q: any, i: number) => {
              const correct = answers[i] === q.correctAnswer;
              return (
                <div key={i} className={`section-card rounded-2xl p-4 border ${
                  correct ? 'border-emerald-500/25' : 'border-red-500/25'
                }`} style={{ background: correct ? 'hsl(152 70% 48% / 0.04)' : 'hsl(0 70% 52% / 0.04)' }}>
                  <div className="flex gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 text-white ${correct ? 'bg-emerald-500' : 'bg-red-500'}`}>
                      {correct ? '✓' : '✗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="textbook-prose text-sm mb-1.5">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{preprocessMath(q.question)}</ReactMarkdown>
                      </div>
                      {!correct && (
                        <div className="text-xs mb-1.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-red-400 font-medium">Your: {q.options[answers[i]]}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-emerald-400 font-medium">Correct: {q.options[q.correctAnswer]}</span>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground bg-muted/40 border border-border/40 rounded-xl p-2.5 leading-relaxed">
                        {q.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={restart} variant="outline" className="h-12 font-bold border-border/50">🔄 New Quiz</Button>
            <Button onClick={() => navigate('/dashboard')} className="h-12 btn-primary font-bold">🏠 Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Quiz;
