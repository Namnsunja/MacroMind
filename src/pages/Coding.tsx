import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2, Play, ArrowLeft, Zap, CheckCircle, XCircle, Loader2,
  RefreshCw, Lock, Bot, Heart, Star, Trophy, Lightbulb,
  ChevronRight, Target, Flame, Brain, Swords
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useXP } from '@/contexts/XPContext';
import ReactMarkdown from 'react-markdown';
import { preprocessMath } from '@/lib/mathPreprocess';
import AdGate from '@/components/features/AdGate';

const LANGUAGES = [
  { id: 'python', label: 'Python', emoji: '🐍', color: 'from-blue-500 to-cyan-500', desc: 'Easiest to learn' },
  { id: 'javascript', label: 'JS', emoji: '⚡', color: 'from-yellow-500 to-amber-500', desc: 'Web magic' },
  { id: 'java', label: 'Java', emoji: '☕', color: 'from-orange-500 to-red-500', desc: 'Industry standard' },
  { id: 'cpp', label: 'C++', emoji: '🔧', color: 'from-indigo-500 to-blue-500', desc: 'Fast & powerful' },
];

// Duolingo-style levels with real curriculum
const SKILL_TREE = [
  {
    id: 'basics',
    label: 'Basics',
    emoji: '🌱',
    locked: false,
    color: 'from-emerald-500 to-green-600',
    glow: 'shadow-emerald-500/30',
    lessons: ['Variables & Types', 'Print & Input', 'Basic Math'],
    topics: ['Variables', 'Print statements', 'Arithmetic operators'],
  },
  {
    id: 'conditions',
    label: 'Conditions',
    emoji: '🔀',
    locked: false,
    color: 'from-blue-500 to-cyan-600',
    glow: 'shadow-blue-500/30',
    lessons: ['If-Else Logic', 'Comparisons', 'Nested Conditions'],
    topics: ['if/else', 'Comparison operators', 'Logical operators'],
  },
  {
    id: 'loops',
    label: 'Loops',
    emoji: '🔄',
    locked: false,
    color: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/30',
    lessons: ['For Loops', 'While Loops', 'Loop Patterns'],
    topics: ['for loop', 'while loop', 'range and iteration'],
  },
  {
    id: 'functions',
    label: 'Functions',
    emoji: '⚙️',
    locked: false,
    color: 'from-orange-500 to-red-500',
    glow: 'shadow-orange-500/30',
    lessons: ['Define Functions', 'Parameters', 'Return Values'],
    topics: ['def/function', 'Parameters and arguments', 'Return statements'],
  },
  {
    id: 'data_structures',
    label: 'Data Structures',
    emoji: '📦',
    locked: false,
    color: 'from-pink-500 to-rose-600',
    glow: 'shadow-pink-500/30',
    lessons: ['Lists/Arrays', 'Dictionaries', 'String Methods'],
    topics: ['lists and arrays', 'dictionaries/objects', 'string manipulation'],
  },
  {
    id: 'algorithms',
    label: 'Algorithms',
    emoji: '🧠',
    locked: false,
    color: 'from-teal-500 to-emerald-600',
    glow: 'shadow-teal-500/30',
    lessons: ['Sorting', 'Searching', 'Recursion Basics'],
    topics: ['sorting algorithms', 'binary search', 'recursion'],
  },
];

const HEARTS_MAX = 5;

const Coding = () => {
  const [lang, setLang] = useState('python');
  const [challenge, setChallenge] = useState<any>(null);
  const [userCode, setUserCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [modelUsed, setModelUsed] = useState('');
  const [showAd, setShowAd] = useState(false);
  const [adCallback, setAdCallback] = useState<() => void>(() => () => {});
  const [adReason, setAdReason] = useState('');
  const [hearts, setHearts] = useState(HEARTS_MAX);
  const [showSolution, setShowSolution] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [hintsUsed, setHintsUsed] = useState<number[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<typeof SKILL_TREE[0] | null>(null);
  const [selectedLesson, setSelectedLesson] = useState('');
  const [view, setView] = useState<'tree' | 'challenge'>('tree');
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const navigate = useNavigate();
  const { addXP, unlockAchievement } = useXP();

  useEffect(() => {
    const saved = localStorage.getItem('coding_completed') || '[]';
    setCompletedLessons(JSON.parse(saved));
  }, []);

  const requireAd = (reason: string, cb: () => void) => {
    setAdReason(reason);
    setAdCallback(() => cb);
    setShowAd(true);
  };

  const generateChallenge = async (skill?: typeof SKILL_TREE[0], lesson?: string) => {
    setLoading(true);
    setResult(null);
    setUserCode('');
    setChallenge(null);
    setShowSolution(false);
    setHintsUsed([]);

    const topic = lesson || selectedLesson || 'basic programming';
    const difficulty = skill?.id === 'basics' ? 'easy' :
      skill?.id === 'conditions' || skill?.id === 'loops' ? 'easy' :
      skill?.id === 'functions' ? 'medium' : 'medium';

    try {
      const { data, error } = await supabase.functions.invoke('solve-coding', {
        body: {
          action: 'generate',
          language: lang,
          topic,
          difficulty,
        }
      });
      if (error) throw error;
      setChallenge(data.challenge);
      setModelUsed(data.modelUsed || '');
      setUserCode(data.challenge.starterCode || `# Write your ${lang} solution here\n`);
      setHearts(HEARTS_MAX);
      setXpEarned(0);
      setView('challenge');
    } catch (e: any) {
      // Smart fallback based on topic
      const fallbacks: Record<string, any> = {
        'Variables': {
          title: 'Temperature Converter 🌡️',
          difficulty: 'easy',
          description: `### 🌡️ Convert Celsius to Fahrenheit\n\nWrite a function that converts Celsius to Fahrenheit.\n\n**Formula:** $F = \\frac{9}{5} \\times C + 32$\n\n| Input (°C) | Output (°F) |\n|-----------|------------|\n| 0 | 32.0 |\n| 100 | 212.0 |\n| -40 | -40.0 |`,
          starterCode: lang === 'python' ? 'def celsius_to_fahrenheit(c):\n    # Convert celsius to fahrenheit\n    # F = (9/5) * C + 32\n    pass\n\nprint(celsius_to_fahrenheit(0))   # Should print 32.0\nprint(celsius_to_fahrenheit(100)) # Should print 212.0' : 'function celsiusToFahrenheit(c) {\n  // Convert celsius to fahrenheit\n  // F = (9/5) * C + 32\n}\n\nconsole.log(celsiusToFahrenheit(0));   // 32\nconsole.log(celsiusToFahrenheit(100)); // 212',
          hints: ['Use the formula F = (9/5) × C + 32', 'Multiply first, then add 32'],
          solution: lang === 'python' ? 'def celsius_to_fahrenheit(c):\n    return (9/5) * c + 32\n\nprint(celsius_to_fahrenheit(0))\nprint(celsius_to_fahrenheit(100))' : 'function celsiusToFahrenheit(c) {\n  return (9/5) * c + 32;\n}\nconsole.log(celsiusToFahrenheit(0));\nconsole.log(celsiusToFahrenheit(100));',
        },
        default: {
          title: 'FizzBuzz Classic 🎯',
          difficulty: 'easy',
          description: `### 🎯 FizzBuzz\n\nFor numbers 1 to n:\n- If divisible by **3** → print **"Fizz"**\n- If divisible by **5** → print **"Buzz"**  \n- If divisible by **both** → print **"FizzBuzz"**\n- Otherwise → print the **number**\n\n| Input | Expected Last |\n|-------|---------------|\n| 15 | FizzBuzz |`,
          starterCode: lang === 'python' ? '# FizzBuzz\ndef fizzbuzz(n):\n    for i in range(1, n + 1):\n        # Check divisibility\n        # Hint: Check 15 FIRST (divisible by both)\n        pass\n\nfizzbuzz(15)' : 'function fizzbuzz(n) {\n  for (let i = 1; i <= n; i++) {\n    // Check divisibility\n    // Hint: Check 15 first!\n  }\n}\nfizzbuzz(15);',
          hints: ['Check if i % 15 === 0 FIRST (catches both 3 and 5)', 'Use elif/else if for the remaining cases'],
          solution: lang === 'python' ? 'def fizzbuzz(n):\n    for i in range(1, n+1):\n        if i % 15 == 0: print("FizzBuzz")\n        elif i % 3 == 0: print("Fizz")\n        elif i % 5 == 0: print("Buzz")\n        else: print(i)\nfizzbuzz(15)' : 'function fizzbuzz(n){for(let i=1;i<=n;i++){if(i%15===0)console.log("FizzBuzz");else if(i%3===0)console.log("Fizz");else if(i%5===0)console.log("Buzz");else console.log(i);}}\nfizzbuzz(15);',
        },
      };
      const fb = fallbacks[topic] || fallbacks.default;
      setChallenge(fb);
      setUserCode(fb.starterCode);
      setHearts(HEARTS_MAX);
      setView('challenge');
      toast.info('Using offline challenge — AI will be back soon!', { duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const checkCode = async () => {
    if (!userCode.trim() || userCode === challenge?.starterCode) {
      toast.error('Write your solution first! 😄');
      return;
    }
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('solve-coding', {
        body: { action: 'evaluate', language: lang, challenge, userCode }
      });
      if (error) throw error;
      const parsed = data.result;
      setResult(parsed);
      setModelUsed(data.modelUsed || '');

      if (parsed.passed) {
        const xp = Math.max(75 - (hintsUsed.length * 10), 25);
        setXpEarned(xp);
        addXP(xp, 'Coding challenge solved!');
        unlockAchievement('first_code');

        // Mark lesson as complete
        const lessonKey = `${lang}_${selectedLesson}`;
        if (!completedLessons.includes(lessonKey)) {
          const updated = [...completedLessons, lessonKey];
          setCompletedLessons(updated);
          localStorage.setItem('coding_completed', JSON.stringify(updated));
        }

        // Update coding_solved in DB
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          await supabase.from('user_xp').upsert({
            user_id: session.session.user.id,
            coding_solved: 1,
          }, { onConflict: 'user_id' });
        }

        toast.success(`🎉 Solved! +${xp} XP!`, {
          style: { background: 'hsl(152 70% 20%)', color: 'white', border: '1px solid hsl(152 70% 44%)' }
        });
      } else {
        const newHearts = Math.max(hearts - 1, 0);
        setHearts(newHearts);
        addXP(10, 'Tried a coding challenge');
        if (newHearts === 0) {
          toast.error("Out of hearts! 💔 Watch an ad to refill!", { duration: 3000 });
        } else {
          toast.error(`Not quite! 💔 ${newHearts} hearts left`);
        }
      }
    } catch (e: any) {
      toast.error('Evaluation failed. Try again!');
    } finally {
      setChecking(false);
    }
  };

  const ext = lang === 'python' ? 'py' : lang === 'javascript' ? 'js' : lang === 'java' ? 'java' : 'cpp';

  // ── SKILL TREE VIEW ──
  if (view === 'tree') return (
    <div className="min-h-screen bg-background pb-24">
      {showAd && (
        <AdGate reason={adReason} onComplete={() => { setShowAd(false); adCallback(); }} onClose={() => setShowAd(false)} />
      )}

      {/* Header */}
      <div className="glass-strong border-b border-border/20 sticky top-0 z-40">
        <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-xl w-9 h-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm leading-none">Coding Dojo</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Duolingo-style coding lessons 🐉</p>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-black text-red-400">
            {Array.from({ length: hearts }).map((_, i) => <Heart key={i} className="w-3.5 h-3.5 fill-current" />)}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-5">
        {/* Language selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {LANGUAGES.map(l => (
            <button key={l.id} onClick={() => setLang(l.id)}
              className={`shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl font-bold text-xs transition-all border ${
                lang === l.id
                  ? `bg-gradient-to-br ${l.color} text-white border-transparent shadow-lg`
                  : 'bg-card border-border/50 text-muted-foreground hover:text-foreground'
              }`}>
              <span className="text-2xl">{l.emoji}</span>
              {l.label}
              <span className="text-[9px] opacity-70">{l.desc}</span>
            </button>
          ))}
        </div>

        {/* Hero streak/stats bar */}
        <div className="section-card p-4 mb-5 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: HEARTS_MAX }).map((_, i) => (
              <Heart key={i} className={`w-5 h-5 ${i < hearts ? 'text-red-400 fill-current' : 'text-muted/40'}`} />
            ))}
          </div>
          <div className="flex-1 h-px bg-border/30" />
          <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
            <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-400" />{completedLessons.filter(l => l.startsWith(lang)).length} done</span>
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-yellow-500" />+75 XP/lesson</span>
          </div>
        </div>

        {/* Skill tree */}
        <h3 className="font-black text-sm text-muted-foreground uppercase tracking-widest mb-4 px-1">📍 Choose Your Lesson</h3>

        <div className="space-y-3">
          {SKILL_TREE.map((skill, skillIdx) => {
            const isExpanded = selectedSkill?.id === skill.id;
            const skillCompleted = skill.lessons.filter(l =>
              completedLessons.includes(`${lang}_${l}`)
            ).length;

            return (
              <div key={skill.id}>
                {/* Connector line */}
                {skillIdx > 0 && (
                  <div className="flex justify-center -mt-1 mb-1">
                    <div className="w-0.5 h-3 bg-border/40 rounded-full" />
                  </div>
                )}

                <button
                  onClick={() => setSelectedSkill(isExpanded ? null : skill)}
                  className={`w-full section-card rounded-2xl p-4 flex items-center gap-4 transition-all text-left ${
                    isExpanded ? `border-2 bg-gradient-to-r ${skill.color} text-white` : 'hover:border-border'
                  }`}>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${skill.color} flex items-center justify-center text-2xl shrink-0 shadow-lg ${skill.glow}`}>
                    {skill.emoji}
                  </div>
                  <div className="flex-1">
                    <p className={`font-black text-base ${isExpanded ? 'text-white' : 'text-foreground'}`}>{skill.label}</p>
                    <p className={`text-xs ${isExpanded ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {skill.topics[0]} · {skill.topics[1]}
                    </p>
                    {/* Progress dots */}
                    <div className="flex gap-1.5 mt-2">
                      {skill.lessons.map((l, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${
                          completedLessons.includes(`${lang}_${l}`)
                            ? 'bg-yellow-400'
                            : isExpanded ? 'bg-white/40' : 'bg-muted/50'
                        }`} />
                      ))}
                      {skillCompleted > 0 && (
                        <span className={`text-[10px] font-bold ml-1 ${isExpanded ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {skillCompleted}/{skill.lessons.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 shrink-0 transition-transform ${isExpanded ? 'rotate-90 text-white' : 'text-muted-foreground'}`} />
                </button>

                {/* Expanded lessons */}
                {isExpanded && (
                  <div className="mt-2 ml-4 space-y-2 slide-up">
                    {skill.lessons.map((lesson, i) => {
                      const lessonKey = `${lang}_${lesson}`;
                      const done = completedLessons.includes(lessonKey);
                      return (
                        <button key={lesson}
                          onClick={() => {
                            setSelectedLesson(lesson);
                            generateChallenge(skill, skill.topics[i] || lesson);
                          }}
                          disabled={loading}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all group ${
                            done
                              ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15'
                              : 'bg-card border-border/50 hover:border-primary/30 hover:bg-primary/5'
                          }`}>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            done ? 'bg-emerald-500 text-white' : `bg-gradient-to-br ${skill.color} text-white opacity-90`
                          }`}>
                            {done ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-black">{i + 1}</span>}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm">{lesson}</p>
                            <p className="text-xs text-muted-foreground">{skill.topics[i]}</p>
                          </div>
                          {done ? (
                            <Star className="w-4 h-4 text-yellow-500 fill-current shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                          )}
                          {loading && selectedLesson === lesson && (
                            <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                          )}
                        </button>
                      );
                    })}
                    {/* Free play */}
                    <button
                      onClick={() => { setSelectedLesson('any topic'); generateChallenge(skill, skill.id); }}
                      disabled={loading}
                      className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-dashed border-primary/30 text-left hover:bg-primary/5 transition-all">
                      <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                        <RefreshCw className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-primary">Random {skill.label} Challenge</p>
                        <p className="text-xs text-muted-foreground">Surprise me!</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Free practice */}
        <div className="mt-5 section-card p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-black text-sm">Free Practice Mode</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Generate a random challenge of your choice — no lesson path!</p>
          <Button onClick={() => generateChallenge()} disabled={loading}
            className="w-full h-11 btn-primary font-bold gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : '🎲 Random Challenge'}
          </Button>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border/40 px-2 py-2 z-40">
        <div className="container mx-auto max-w-5xl flex justify-around">
          {[
            { icon: Brain, label: 'Learn', path: '/dashboard' },
            { icon: Zap, label: 'Quiz', path: '/quiz' },
            { icon: Swords, label: 'Battle', path: '/battle' },
            { icon: Code2, label: 'Code', path: '/coding', active: true },
            { icon: Trophy, label: 'Profile', path: '/profile' },
          ].map(item => (
            <button key={item.label} onClick={() => navigate(item.path)}
              className={`nav-item ${item.active ? 'active' : ''}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );

  // ── CHALLENGE VIEW ──
  return (
    <div className="min-h-screen bg-background pb-6">
      {showAd && (
        <AdGate reason={adReason} onComplete={() => { setShowAd(false); adCallback(); }} onClose={() => setShowAd(false)} />
      )}

      {/* Header with hearts */}
      <div className="glass-strong border-b border-border/20 sticky top-0 z-40">
        <div className="container mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setView('tree'); setChallenge(null); setResult(null); }}
            className="rounded-xl w-9 h-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{selectedLesson || 'Practice'}</span>
              {challenge && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  challenge.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' :
                  challenge.difficulty === 'hard' ? 'text-red-400 bg-red-500/10 border-red-500/25' :
                  'text-yellow-400 bg-yellow-500/10 border-yellow-500/25'
                }`}>{challenge.difficulty}</span>
              )}
            </div>
            {challenge && <p className="font-black text-sm leading-none mt-0.5">{challenge.title}</p>}
          </div>

          {/* Hearts display */}
          <div className="flex items-center gap-1 shrink-0">
            {Array.from({ length: HEARTS_MAX }).map((_, i) => (
              <Heart key={i} className={`w-4 h-4 transition-all ${
                i < hearts ? 'text-red-400 fill-current' : 'text-muted/30'
              }`} />
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-64 gap-4 mt-12">
          <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
          <p className="font-bold text-muted-foreground">Cooking up your challenge... 🍳</p>
        </div>
      ) : challenge && (
        <div className="container mx-auto max-w-5xl px-4 py-5">
          {/* SUCCESS Banner */}
          {result?.passed && (
            <div className="relative overflow-hidden rounded-2xl p-5 mb-4 text-center text-white slide-up"
              style={{ background: 'linear-gradient(135deg, hsl(152 70% 22%) 0%, hsl(168 75% 20%) 100%)' }}>
              <div className="text-5xl mb-2 float">🏆</div>
              <p className="font-black text-xl">Challenge Crushed!</p>
              <p className="text-white/70 text-sm mt-1">+{xpEarned} XP earned · Prof is proud 🎓</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button onClick={() => { setView('tree'); setChallenge(null); setResult(null); }}
                  className="h-10 px-6 font-bold bg-white text-emerald-700 hover:bg-white/90">
                  Back to Tree
                </Button>
                <Button onClick={() => generateChallenge(selectedSkill || undefined, selectedLesson)}
                  className="h-10 px-6 font-bold bg-emerald-500/20 text-white border border-white/30 hover:bg-emerald-500/30">
                  Next Challenge
                </Button>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Left: Challenge */}
            <div className="space-y-3">
              {/* Problem */}
              <div className="section-card rounded-2xl p-5">
                <div className="textbook-prose">
                  <ReactMarkdown>{preprocessMath(challenge.description)}</ReactMarkdown>
                </div>
              </div>

              {/* Step-by-step hints (Duolingo-style reveal) */}
              {challenge.hints && (
                <div className="section-card rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <p className="font-black text-sm">Hints ({hintsUsed.length}/{challenge.hints.length} used)</p>
                  </div>
                  <div className="space-y-2">
                    {challenge.hints.map((h: string, i: number) => {
                      const revealed = hintsUsed.includes(i);
                      return (
                        <div key={i}>
                          {revealed ? (
                            <div className="text-sm flex items-start gap-2 bg-yellow-500/8 border border-yellow-500/20 rounded-xl px-3 py-2.5 slide-up">
                              <span className="text-yellow-500 font-black shrink-0 text-xs mt-0.5">{i + 1}.</span>
                              <span className="text-muted-foreground">{h}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => setHintsUsed(prev => [...prev, i])}
                              className="w-full flex items-center gap-2 text-sm text-yellow-500/70 hover:text-yellow-500 border border-yellow-500/20 hover:border-yellow-500/40 rounded-xl px-3 py-2 transition-all text-left">
                              <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-bold">Reveal Hint {i + 1}</span>
                              <span className="text-[10px] text-muted-foreground ml-auto">-10 XP</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Failure result */}
              {result && !result.passed && (
                <div className="section-card border-2 border-red-500/30 rounded-2xl p-4 slide-up"
                  style={{ background: 'hsl(0 70% 52% / 0.04)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="font-black text-sm text-red-400">Score: {result.score}/100</span>
                    {modelUsed && (
                      <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Bot className="w-2.5 h-2.5" />{modelUsed.split('/').pop()}
                      </span>
                    )}
                  </div>
                  <div className="textbook-prose text-sm">
                    <ReactMarkdown>{preprocessMath(result.feedback)}</ReactMarkdown>
                  </div>
                  {result.improvements && (
                    <p className="mt-2 text-xs text-muted-foreground bg-muted/40 rounded-xl p-2.5 border border-border/40">
                      💡 {result.improvements}
                    </p>
                  )}
                  {hearts === 0 && (
                    <Button onClick={() => requireAd('Watch an ad to get 5 hearts back!', () => setHearts(HEARTS_MAX))}
                      className="w-full mt-3 h-10 font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 gap-2">
                      💔 Watch Ad for 5 Hearts
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Right: Code editor */}
            <div className="space-y-3">
              {/* Editor */}
              <div className="rounded-2xl overflow-hidden border border-border/50"
                style={{ background: 'hsl(224 30% 4%)' }}>
                {/* Chrome */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30"
                  style={{ background: 'hsl(224 28% 7%)' }}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      {['bg-red-500', 'bg-yellow-500', 'bg-emerald-500'].map(c => (
                        <div key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                      ))}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono ml-1">solution.{ext}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {modelUsed && result && (
                      <span className="text-[10px] text-muted-foreground font-mono">{modelUsed.split('/').pop()}</span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {LANGUAGES.find(l => l.id === lang)?.emoji} {lang}
                    </span>
                  </div>
                </div>

                <textarea
                  value={userCode}
                  onChange={e => setUserCode(e.target.value)}
                  className="w-full h-80 p-4 text-emerald-300 font-mono text-sm resize-none focus:outline-none leading-relaxed"
                  style={{ background: 'hsl(224 30% 4%)', caretColor: 'hsl(172 80% 60%)' }}
                  spellCheck={false}
                  disabled={result?.passed}
                />
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={checkCode}
                  disabled={checking || hearts === 0 || result?.passed}
                  className="btn-primary h-11 font-bold gap-2">
                  {checking
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Checking...</>
                    : <><Play className="w-4 h-4" />Run & Check</>
                  }
                </Button>
                {showSolution ? (
                  <Button onClick={() => setUserCode(challenge?.solution || '')}
                    className="h-11 font-bold gap-2 border-border/50 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle className="w-3.5 h-3.5" /> Load Solution
                  </Button>
                ) : (
                  <Button
                    onClick={() => requireAd('Watch a short ad to see the solution!', () => setShowSolution(true))}
                    variant="outline"
                    className="h-11 font-bold gap-2 border-border/50 bg-muted/30 hover:bg-muted">
                    <Lock className="w-3.5 h-3.5" /> Solution
                  </Button>
                )}
              </div>

              {/* Next challenge */}
              {!result?.passed && (
                <Button onClick={() => generateChallenge(selectedSkill || undefined, selectedLesson)} disabled={loading}
                  variant="ghost" className="w-full h-10 text-sm gap-2 text-muted-foreground hover:text-foreground">
                  <RefreshCw className="w-3.5 h-3.5" />
                  {loading ? 'Loading...' : 'Skip — Next Challenge'}
                </Button>
              )}

              {/* Test cases preview */}
              {challenge.testCases && (
                <div className="section-card rounded-2xl p-4">
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-2">🧪 Test Cases</p>
                  <div className="space-y-1.5">
                    {challenge.testCases.slice(0, 3).map((tc: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-mono bg-muted/30 rounded-xl px-3 py-2">
                        <span className="text-muted-foreground">In:</span>
                        <code className="text-cyan-400">{String(tc.input).slice(0, 20)}</code>
                        <span className="text-muted-foreground ml-auto">→</span>
                        <code className="text-emerald-400">{String(tc.expectedOutput).slice(0, 20)}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coding;
