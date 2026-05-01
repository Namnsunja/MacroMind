import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Swords, Trophy, Zap, Users, ArrowLeft, Brain, Code2,
  Clock, Crown, Shield, Target, ChevronRight, RefreshCw,
  Flame, Star, Loader2, CheckCircle, XCircle, Bot, Medal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useXP, getLevelTitle } from '@/contexts/XPContext';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { preprocessMath } from '@/lib/mathPreprocess';

/* ─────────────────────────────────────────────── */
/*  Constants                                       */
/* ─────────────────────────────────────────────── */
const SUBJECTS = ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'CS'];
const SUBJECT_EMOJIS: Record<string, string> = {
  Math: '📐', Physics: '⚛️', Chemistry: '🧪', Biology: '🧬',
  English: '📝', History: '🏛️', CS: '💻',
};

const LEAGUES = [
  { id: 'bronze', label: 'Bronze', emoji: '🥉', color: 'from-orange-700 to-amber-600', textColor: 'text-amber-600', min: 0 },
  { id: 'silver', label: 'Silver', emoji: '🥈', color: 'from-slate-400 to-gray-400', textColor: 'text-slate-400', min: 5 },
  { id: 'gold', label: 'Gold', emoji: '🥇', color: 'from-yellow-500 to-amber-400', textColor: 'text-yellow-400', min: 10 },
  { id: 'diamond', label: 'Diamond', emoji: '💎', color: 'from-cyan-400 to-blue-500', textColor: 'text-cyan-400', min: 15 },
];

const OPT_LABELS = ['A', 'B', 'C', 'D'];
const QUESTION_TIME = 20; // seconds per question

type Mode = 'home' | 'daily' | 'tournament' | 'battle1v1';
type GameState = 'setup' | 'loading' | 'playing' | 'results';

/* ─────────────────────────────────────────────── */
/*  Utility: Generate quiz via edge fn             */
/* ─────────────────────────────────────────────── */
async function fetchQuestions(subject: string, count = 7, difficulty = 'medium') {
  const { data, error } = await supabase.functions.invoke('generate-quiz', {
    body: { subject, topic: `Mixed ${subject} questions`, difficulty, questionCount: count }
  });
  if (error) throw error;
  return data.quiz.questions as any[];
}

/* ─────────────────────────────────────────────── */
/*  Sub-components                                  */
/* ─────────────────────────────────────────────── */
function QuizPlayer({
  questions,
  onFinish,
  timePerQ = QUESTION_TIME,
  title,
  accentFrom = 'from-violet-600',
  accentTo = 'to-purple-600',
}: {
  questions: any[];
  onFinish: (score: number, timeTaken: number) => void;
  timePerQ?: number;
  title: string;
  accentFrom?: string;
  accentTo?: string;
}) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timePerQ);
  const [startTime] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback((sel: number | null) => {
    const correct = sel === questions[current].correctAnswer;
    const newScore = correct ? score + 1 : score;
    setScore(newScore);
    if (current + 1 >= questions.length) {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      onFinish(newScore, timeTaken);
    } else {
      setTimeout(() => {
        setCurrent(c => c + 1);
        setSelected(null);
        setAnswered(false);
        setTimeLeft(timePerQ);
      }, 900);
    }
  }, [current, questions, score, startTime, onFinish, timePerQ]);

  useEffect(() => {
    if (answered) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setAnswered(true);
          advance(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [current, answered, advance]);

  const handleSelect = (i: number) => {
    if (answered) return;
    clearInterval(timerRef.current!);
    setSelected(i);
    setAnswered(true);
    advance(i);
  };

  const q = questions[current];
  const progress = ((current) / questions.length) * 100;
  const timeRatio = timeLeft / timePerQ;

  return (
    <div className="slide-up">
      {/* Progress bar */}
      <div className="glass-strong border-b border-border/20 sticky top-0 z-40 px-4 py-3">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="font-black text-sm">{current + 1} / {questions.length}</span>
            <span className="font-black text-sm">{title}</span>
            <div className={`flex items-center gap-1.5 font-black text-sm ${timeLeft <= 5 ? 'text-red-400' : 'text-foreground'}`}>
              <Clock className="w-4 h-4" />{timeLeft}s
            </div>
          </div>
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${accentFrom} ${accentTo} rounded-full transition-all duration-300`}
              style={{ width: `${progress}%` }} />
          </div>
          {/* Timer bar */}
          <div className="h-1 bg-muted/30 rounded-full overflow-hidden mt-1">
            <div className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${timeRatio * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-5">
        {/* Question */}
        <div className="section-card-glow rounded-2xl p-5 mb-4">
          <div className="textbook-prose">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {preprocessMath(q.question)}
            </ReactMarkdown>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {q.options.map((opt: string, i: number) => {
            let cls = 'border-border/40 bg-card hover:border-primary/30 hover:bg-muted/30';
            let labelCls = 'bg-muted text-muted-foreground';
            if (answered) {
              if (i === q.correctAnswer) {
                cls = 'border-emerald-500/60 bg-emerald-500/8';
                labelCls = 'bg-emerald-500 text-white';
              } else if (i === selected) {
                cls = 'border-red-500/60 bg-red-500/8';
                labelCls = 'bg-red-500 text-white';
              }
            } else if (selected === i) {
              cls = 'border-primary bg-primary/10';
              labelCls = 'bg-primary text-white';
            }
            return (
              <button key={i} onClick={() => handleSelect(i)}
                className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-3 transition-all ${cls}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-all ${labelCls}`}>
                  {answered && i === q.correctAnswer ? '✓' : answered && i === selected ? '✗' : OPT_LABELS[i]}
                </div>
                <div className="textbook-prose text-sm flex-1">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{preprocessMath(opt)}</ReactMarkdown>
                </div>
              </button>
            );
          })}
        </div>

        {answered && q.explanation && (
          <div className="mt-3 text-xs text-muted-foreground bg-muted/40 border border-border/40 rounded-xl p-3 leading-relaxed slide-up">
            💡 {q.explanation}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Daily Challenge Mode                           */
/* ─────────────────────────────────────────────── */
function DailyChallenge({ onBack }: { onBack: () => void }) {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [questions, setQuestions] = useState<any[]>([]);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('');
  const [todaySubject, setTodaySubject] = useState('');
  const { addXP, unlockAchievement } = useXP();

  // Countdown to midnight
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setCountdown(`${h}:${m}:${s}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  // Pick today's subject deterministically from date
  useEffect(() => {
    const day = new Date().getDay();
    setTodaySubject(SUBJECTS[day % SUBJECTS.length]);
  }, []);

  const loadOrCreateChallenge = async () => {
    setGameState('loading');
    const today = new Date().toISOString().split('T')[0];

    // Check existing challenge
    const { data: existing } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('challenge_date', today)
      .single();

    let challenge = existing;
    if (!challenge) {
      // Generate new
      try {
        const qs = await fetchQuestions(todaySubject, 7, 'medium');
        const { data: inserted } = await supabase
          .from('daily_challenges')
          .insert({ challenge_date: today, subject: todaySubject, questions: qs })
          .select()
          .single();
        challenge = inserted;
      } catch (e) {
        toast.error('Failed to load daily challenge');
        setGameState('setup');
        return;
      }
    }

    setChallengeId(challenge.id);
    setTodaySubject(challenge.subject);

    // Check if already played
    const { data: session } = await supabase.auth.getSession();
    if (session.session) {
      const { data: myScore } = await supabase
        .from('daily_challenge_scores')
        .select('*')
        .eq('challenge_id', challenge.id)
        .eq('user_id', session.session.user.id)
        .single();
      if (myScore) {
        setAlreadyPlayed(true);
        setScore(myScore.score);
        setTimeTaken(myScore.time_taken);
      }
    }

    // Load leaderboard
    await loadLeaderboard(challenge.id, session.session?.user?.id);
    setQuestions(challenge.questions);
    setGameState(existing && alreadyPlayed ? 'results' : 'playing');
  };

  const loadLeaderboard = async (cId: string, myUid?: string) => {
    const { data: scores } = await supabase
      .from('daily_challenge_scores')
      .select('score, time_taken, user_id, user_profiles(username, email)')
      .eq('challenge_id', cId)
      .order('score', { ascending: false })
      .order('time_taken', { ascending: true })
      .limit(20);

    if (scores) {
      setLeaderboard(scores);
      if (myUid) {
        const rank = scores.findIndex((s: any) => s.user_id === myUid) + 1;
        setMyRank(rank > 0 ? rank : null);
      }
    }
  };

  const handleFinish = async (finalScore: number, time: number) => {
    setScore(finalScore);
    setTimeTaken(time);
    setGameState('results');

    const { data: session } = await supabase.auth.getSession();
    if (session.session && challengeId) {
      await supabase.from('daily_challenge_scores').upsert({
        challenge_id: challengeId,
        user_id: session.session.user.id,
        score: finalScore,
        time_taken: time,
      }, { onConflict: 'challenge_id,user_id' });

      await loadLeaderboard(challengeId, session.session.user.id);
    }

    const xpEarned = finalScore * 30;
    addXP(xpEarned, 'Daily Challenge');
    unlockAchievement('first_battle');
    toast.success(`Daily Challenge done! +${xpEarned} XP`);

    // Update daily_challenge_streak in DB
    const { data: sess } = await supabase.auth.getSession();
    if (sess.session) {
      const uid = sess.session.user.id;
      const today = new Date().toISOString().split('T')[0];
      const { data: xpRec } = await supabase.from('user_xp').select('daily_challenge_streak, last_challenge_date').eq('user_id', uid).single();
      if (xpRec) {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const ystStr = yesterday.toISOString().split('T')[0];
        const newStreak = xpRec.last_challenge_date === ystStr ? (xpRec.daily_challenge_streak || 0) + 1 : 1;
        await supabase.from('user_xp').update({ daily_challenge_streak: newStreak, last_challenge_date: today }).eq('user_id', uid);
        if (newStreak >= 3) unlockAchievement('daily_streak_3');
      }
    }
  };

  if (gameState === 'setup') return (
    <div className="container mx-auto max-w-2xl px-4 py-5 slide-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl p-6 mb-5 text-white"
        style={{ background: 'linear-gradient(135deg, hsl(43 100% 30%) 0%, hsl(25 90% 35%) 100%)' }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 blur-xl" />
        <div className="relative text-center">
          <div className="text-5xl mb-3 float">⚡</div>
          <h2 className="text-2xl font-black">Daily Challenge</h2>
          <p className="text-white/70 text-sm mt-1">One shot. All players. Same questions.</p>
          <div className="flex items-center justify-center gap-2 mt-4 bg-black/20 rounded-2xl px-4 py-2.5">
            <Clock className="w-4 h-4 text-yellow-300" />
            <span className="font-mono font-black text-yellow-300 text-lg">{countdown}</span>
            <span className="text-white/60 text-xs">until reset</span>
          </div>
        </div>
      </div>

      {/* Today's info */}
      <div className="section-card p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{SUBJECT_EMOJIS[todaySubject] || '📚'}</div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-black">Today's Subject</p>
            <p className="text-2xl font-black text-foreground">{todaySubject}</p>
            <p className="text-xs text-muted-foreground mt-0.5">7 questions • 20s each • +30 XP per correct</p>
          </div>
        </div>
      </div>

      <Button onClick={loadOrCreateChallenge} className="w-full h-12 btn-primary font-bold text-base gap-2 mb-3">
        <Zap className="w-4 h-4" /> Start Today's Challenge
      </Button>

      <button onClick={onBack} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
        ← Back to Battle Arena
      </button>
    </div>
  );

  if (gameState === 'loading') return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="font-bold text-muted-foreground">Loading today's challenge...</p>
    </div>
  );

  if (gameState === 'playing') return (
    <QuizPlayer
      questions={questions}
      onFinish={handleFinish}
      title={`Daily — ${todaySubject}`}
      accentFrom="from-yellow-500"
      accentTo="to-orange-500"
    />
  );

  if (gameState === 'results') return (
    <div className="container mx-auto max-w-2xl px-4 py-5 slide-up">
      {/* Score card */}
      <div className="relative overflow-hidden rounded-3xl p-6 mb-5 text-center text-white"
        style={{ background: 'linear-gradient(135deg, hsl(43 100% 28%) 0%, hsl(25 90% 32%) 100%)' }}>
        <div className="text-6xl mb-2 float">{score >= 6 ? '🏆' : score >= 4 ? '🥈' : '💪'}</div>
        <h2 className="text-2xl font-black">{score >= 6 ? 'Legendary!' : score >= 4 ? 'Great Job!' : 'Keep Going!'}</h2>
        <div className="text-6xl font-black my-3 gradient-text-gold">{score}/7</div>
        <p className="text-white/60 text-sm">Completed in {timeTaken}s</p>
        {myRank && (
          <div className="mt-3 inline-flex items-center gap-2 bg-black/25 rounded-xl px-4 py-1.5">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="font-black text-yellow-400">Rank #{myRank}</span>
            <span className="text-white/60 text-xs">among {leaderboard.length} players</span>
          </div>
        )}
        <div className="flex items-center justify-center gap-1.5 mt-3 text-yellow-300 font-black">
          <Zap className="w-4 h-4" /> +{score * 30} XP earned
        </div>
      </div>

      {/* Leaderboard */}
      <div className="section-card rounded-2xl overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-500" />
          <span className="font-black text-sm">Today's Leaderboard</span>
          <span className="text-xs text-muted-foreground ml-auto">{leaderboard.length} players</span>
        </div>
        <div className="divide-y divide-border/20">
          {leaderboard.slice(0, 10).map((entry: any, i: number) => {
            const name = entry.user_profiles?.username || entry.user_profiles?.email?.split('@')[0] || 'Anonymous';
            const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
            return (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i === (myRank ?? 0) - 1 ? 'bg-primary/5' : ''}`}>
                <span className="w-8 text-center font-black text-sm">{rankEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{name}</p>
                  <p className="text-[10px] text-muted-foreground">{entry.time_taken}s</p>
                </div>
                <div className="flex items-center gap-1 text-yellow-500 font-black text-sm">
                  <Zap className="w-3 h-3" />{entry.score}/7
                </div>
              </div>
            );
          })}
          {leaderboard.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-6">No scores yet. Be the first!</p>
          )}
        </div>
      </div>

      <button onClick={onBack} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
        ← Back to Battle Arena
      </button>
    </div>
  );

  return null;
}

/* ─────────────────────────────────────────────── */
/*  Subject Tournament Mode                        */
/* ─────────────────────────────────────────────── */
function SubjectTournament({ onBack }: { onBack: () => void }) {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [gameState, setGameState] = useState<GameState>('setup');
  const [questions, setQuestions] = useState<any[]>([]);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [userLeague, setUserLeague] = useState(LEAGUES[0]);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const { addXP, level } = useXP();

  useEffect(() => {
    // Set league based on level
    const league = [...LEAGUES].reverse().find(l => level >= l.min) || LEAGUES[0];
    setUserLeague(league);
  }, [level]);

  const startTournamentRound = async () => {
    if (!selectedSubject) { toast.error('Select a subject!'); return; }
    setGameState('loading');

    // Get or create this week's tournament
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const wsStr = weekStart.toISOString().split('T')[0];
    const weStr = weekEnd.toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('tournaments')
      .select('*')
      .eq('subject', selectedSubject)
      .eq('league', userLeague.id)
      .eq('week_start', wsStr)
      .single();

    let tid = existing?.id;
    if (!tid) {
      const { data: created } = await supabase
        .from('tournaments')
        .insert({ subject: selectedSubject, league: userLeague.id, week_start: wsStr, week_end: weStr })
        .select()
        .single();
      tid = created?.id;
    }

    if (!tid) { toast.error('Failed to create tournament'); setGameState('setup'); return; }
    setTournamentId(tid);

    try {
      const qs = await fetchQuestions(selectedSubject, 5, userLeague.id === 'diamond' ? 'hard' : userLeague.id === 'gold' ? 'medium' : 'easy');
      setQuestions(qs);
      setGameState('playing');
    } catch {
      toast.error('Failed to load questions');
      setGameState('setup');
    }
  };

  const handleFinish = async (finalScore: number, time: number) => {
    setScore(finalScore);
    setGameState('results');

    const { data: session } = await supabase.auth.getSession();
    if (session.session && tournamentId) {
      const uid = session.session.user.id;
      // Upsert tournament score
      const { data: existing } = await supabase
        .from('tournament_scores')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('user_id', uid)
        .single();

      if (existing) {
        await supabase.from('tournament_scores').update({
          total_score: existing.total_score + finalScore,
          rounds_played: existing.rounds_played + 1,
          updated_at: new Date().toISOString()
        }).eq('id', existing.id);
        setRoundsPlayed(existing.rounds_played + 1);
      } else {
        await supabase.from('tournament_scores').insert({
          tournament_id: tournamentId,
          user_id: uid,
          total_score: finalScore,
          rounds_played: 1
        });
        setRoundsPlayed(1);
      }

      // Load leaderboard
      const { data: scores } = await supabase
        .from('tournament_scores')
        .select('total_score, rounds_played, user_id, user_profiles(username, email)')
        .eq('tournament_id', tournamentId)
        .order('total_score', { ascending: false })
        .limit(20);

      if (scores) {
        setLeaderboard(scores);
        const rank = scores.findIndex((s: any) => s.user_id === uid) + 1;
        setMyRank(rank > 0 ? rank : null);
      }
    }

    const xp = finalScore * 20;
    addXP(xp, `${selectedSubject} Tournament`);
    toast.success(`Round done! +${xp} XP`);
  };

  if (gameState === 'setup') return (
    <div className="container mx-auto max-w-2xl px-4 py-5 slide-up">
      {/* League badge */}
      <div className={`relative overflow-hidden rounded-3xl p-5 mb-5 bg-gradient-to-br ${userLeague.color}`}>
        <div className="text-center text-white">
          <div className="text-4xl mb-1">{userLeague.emoji}</div>
          <p className="font-black text-lg">{userLeague.label} League</p>
          <p className="text-white/70 text-sm">Week-long tournament • Climb to {LEAGUES[Math.min(LEAGUES.indexOf(userLeague) + 1, LEAGUES.length - 1)].label}</p>
        </div>
        {/* League progression */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {LEAGUES.map((l, i) => (
            <div key={l.id} className={`flex items-center gap-1 ${l.id === userLeague.id ? 'opacity-100' : 'opacity-40'}`}>
              <span className="text-lg">{l.emoji}</span>
              {i < LEAGUES.length - 1 && <ChevronRight className="w-3 h-3 text-white/60" />}
            </div>
          ))}
        </div>
      </div>

      {/* Subject selector */}
      <div className="section-card p-5 mb-4">
        <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">Choose Battle Subject</label>
        <div className="grid grid-cols-4 gap-2">
          {SUBJECTS.map(s => (
            <button key={s} onClick={() => setSelectedSubject(s)}
              className={`py-2.5 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                selectedSubject === s
                  ? `bg-gradient-to-br ${userLeague.color} text-white border-transparent shadow-md`
                  : 'bg-muted/40 border-border/50 text-muted-foreground hover:border-border'
              }`}>
              <span className="text-base">{SUBJECT_EMOJIS[s]}</span>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Round info */}
      <div className="section-card p-4 mb-4 flex items-center gap-4">
        <Target className="w-8 h-8 text-primary shrink-0" />
        <div className="flex-1">
          <p className="font-black text-sm">5 questions per round</p>
          <p className="text-xs text-muted-foreground">Play multiple rounds to climb the leaderboard!</p>
        </div>
        <div className="flex items-center gap-1 text-yellow-500 font-black text-sm">
          <Zap className="w-3.5 h-3.5" />+20/Q
        </div>
      </div>

      <Button onClick={startTournamentRound} className="w-full h-12 btn-primary font-bold gap-2 mb-3">
        <Swords className="w-4 h-4" /> Enter Tournament
      </Button>
      <button onClick={onBack} className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors">
        ← Back to Battle Arena
      </button>
    </div>
  );

  if (gameState === 'loading') return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="font-bold text-muted-foreground">Entering {userLeague.label} League...</p>
    </div>
  );

  if (gameState === 'playing') return (
    <QuizPlayer
      questions={questions}
      onFinish={handleFinish}
      title={`${userLeague.emoji} ${selectedSubject}`}
      accentFrom={`from-${userLeague.id === 'bronze' ? 'orange' : userLeague.id === 'silver' ? 'slate' : userLeague.id === 'gold' ? 'yellow' : 'cyan'}-500`}
      accentTo={`to-${userLeague.id === 'bronze' ? 'amber' : userLeague.id === 'silver' ? 'gray' : userLeague.id === 'gold' ? 'amber' : 'blue'}-600`}
    />
  );

  if (gameState === 'results') return (
    <div className="container mx-auto max-w-2xl px-4 py-5 slide-up">
      <div className={`relative overflow-hidden rounded-3xl p-6 mb-5 text-center text-white bg-gradient-to-br ${userLeague.color}`}>
        <div className="text-5xl mb-2">{score >= 4 ? '🏆' : score >= 2 ? '⭐' : '💪'}</div>
        <h2 className="text-2xl font-black">Round Complete!</h2>
        <div className="text-5xl font-black my-2">{score}/5</div>
        {myRank && (
          <div className="inline-flex items-center gap-2 bg-black/25 rounded-xl px-4 py-1.5 mt-1">
            <Crown className="w-4 h-4" />
            <span className="font-black">#{myRank} in {userLeague.label} League</span>
          </div>
        )}
        <p className="text-white/70 text-xs mt-2">Rounds played: {roundsPlayed} · Play more to climb!</p>
        <div className="flex items-center justify-center gap-1.5 mt-3 font-black">
          <Zap className="w-4 h-4" /> +{score * 20} XP
        </div>
      </div>

      {/* Tournament Leaderboard */}
      <div className="section-card rounded-2xl overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
          <Medal className="w-4 h-4 text-yellow-500" />
          <span className="font-black text-sm">{userLeague.label} League — {selectedSubject}</span>
        </div>
        <div className="divide-y divide-border/20">
          {leaderboard.slice(0, 10).map((entry: any, i: number) => {
            const name = entry.user_profiles?.username || entry.user_profiles?.email?.split('@')[0] || 'Anonymous';
            const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
            return (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i === (myRank ?? 0) - 1 ? 'bg-primary/5' : ''}`}>
                <span className="w-8 text-center font-black text-sm">{rankEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{name}</p>
                  <p className="text-[10px] text-muted-foreground">{entry.rounds_played} round{entry.rounds_played !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-1 text-yellow-500 font-black text-sm">
                  <Star className="w-3 h-3" />{entry.total_score}pts
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button onClick={startTournamentRound} className="h-11 btn-primary font-bold gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Play Again
        </Button>
        <Button onClick={onBack} variant="outline" className="h-11 font-bold border-border/50">
          ← Arena
        </Button>
      </div>
    </div>
  );

  return null;
}

/* ─────────────────────────────────────────────── */
/*  1v1 Battle Mode                                */
/* ─────────────────────────────────────────────── */
function Battle1v1({ onBack }: { onBack: () => void }) {
  const [gameState, setGameState] = useState<'lobby' | 'waiting' | 'playing' | 'results'>('lobby');
  const [battleCode, setBattleCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Math');
  const [questions, setQuestions] = useState<any[]>([]);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState<number | null>(null);
  const [opponentName, setOpponentName] = useState('');
  const [timeTaken, setTimeTaken] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addXP } = useXP();

  // Generate random 6-char code
  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const createBattle = async () => {
    const code = generateCode();
    setBattleCode(code);
    setIsHost(true);
    setGameState('waiting');

    const now = new Date();
    const end = new Date(now.getTime() + 5 * 60 * 1000);
    try {
      const qs = await fetchQuestions(selectedSubject, 5, 'medium');
      const { data } = await supabase.from('battles').insert({
        battle_type: `1v1-${code}`,
        subject: selectedSubject,
        questions: qs,
        start_time: now.toISOString(),
        end_time: end.toISOString(),
      }).select().single();
      setBattleId(data.id);
      setQuestions(qs);
      toast.success(`Code: ${code} — Share with your opponent!`);
      // Poll for opponent
      pollRef.current = setInterval(() => pollOpponent(data.id), 3000);
    } catch {
      toast.error('Failed to create battle');
      setGameState('lobby');
    }
  };

  const joinBattle = async () => {
    if (inputCode.length < 6) { toast.error('Enter a 6-char battle code!'); return; }
    setGameState('waiting');
    const code = inputCode.toUpperCase();
    const { data } = await supabase
      .from('battles')
      .select('*')
      .eq('battle_type', `1v1-${code}`)
      .gt('end_time', new Date().toISOString())
      .single();

    if (!data) { toast.error('Battle not found or expired!'); setGameState('lobby'); return; }
    setBattleId(data.id);
    setSelectedSubject(data.subject);
    setQuestions(data.questions);
    setIsHost(false);
    toast.success('Joined! Starting battle...');
    setTimeout(() => setGameState('playing'), 1000);
  };

  const pollOpponent = async (bId: string) => {
    const { data: session } = await supabase.auth.getSession();
    const myUid = session.session?.user?.id;
    const { data: scores } = await supabase
      .from('battle_scores')
      .select('score, user_id, user_profiles(username, email)')
      .eq('battle_id', bId);

    if (scores && scores.length >= 2) {
      const opp = scores.find((s: any) => s.user_id !== myUid);
      if (opp) {
        clearInterval(pollRef.current!);
        setOpponentScore(opp.score);
        setOpponentName(opp.user_profiles?.username || opp.user_profiles?.email?.split('@')[0] || 'Opponent');
        setGameState('playing');
      }
    }
  };

  const pollResults = useCallback(async (bId: string) => {
    const { data: session } = await supabase.auth.getSession();
    const myUid = session.session?.user?.id;
    const { data: scores } = await supabase
      .from('battle_scores')
      .select('score, user_id, user_profiles(username, email)')
      .eq('battle_id', bId);

    if (scores && scores.length >= 2) {
      const opp = scores.find((s: any) => s.user_id !== myUid);
      if (opp) {
        clearInterval(pollRef.current!);
        setOpponentScore(opp.score);
        setOpponentName(opp.user_profiles?.username || opp.user_profiles?.email?.split('@')[0] || 'Opponent');
        setGameState('results');
      }
    }
  }, []);

  const handleFinish = async (finalScore: number, time: number) => {
    setMyScore(finalScore);
    setTimeTaken(time);

    const { data: session } = await supabase.auth.getSession();
    if (session.session && battleId) {
      await supabase.from('battle_scores').upsert({
        battle_id: battleId,
        user_id: session.session.user.id,
        score: finalScore,
        time_taken: time,
        answers: [],
      }, { onConflict: 'battle_id,user_id' });
    }

    addXP(finalScore * 25, '1v1 Battle');
    // Track total battles in DB
    const { data: bsess } = await supabase.auth.getSession();
    if (bsess.session) {
      const uid = bsess.session.user.id;
      const { data: xpRec } = await supabase.from('user_xp').select('total_battles').eq('user_id', uid).single();
      await supabase.from('user_xp').update({ total_battles: (xpRec?.total_battles || 0) + 1 }).eq('user_id', uid);
    }
    // Poll for opponent result
    if (battleId) {
      pollRef.current = setInterval(() => pollResults(battleId), 2000);
      // Timeout after 60s
      setTimeout(() => {
        clearInterval(pollRef.current!);
        if (opponentScore === null) {
          setOpponentScore(-1); // Opponent didn't finish
          setGameState('results');
        }
      }, 60000);
    }
    setGameState('results');
  };

  useEffect(() => () => clearInterval(pollRef.current!), []);

  if (gameState === 'lobby') return (
    <div className="container mx-auto max-w-2xl px-4 py-5 slide-up">
      <div className="relative overflow-hidden rounded-3xl p-6 mb-5 text-white"
        style={{ background: 'linear-gradient(135deg, hsl(0 80% 35%) 0%, hsl(25 90% 35%) 100%)' }}>
        <div className="text-center">
          <div className="text-5xl mb-2 float">⚔️</div>
          <h2 className="text-2xl font-black">1v1 Battle</h2>
          <p className="text-white/70 text-sm mt-1">Challenge a friend to a real-time quiz duel!</p>
        </div>
      </div>

      {/* Subject */}
      <div className="section-card p-4 mb-4">
        <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">Your Battle Subject</label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SUBJECTS.map(s => (
            <button key={s} onClick={() => setSelectedSubject(s)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                selectedSubject === s
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white border-transparent'
                  : 'bg-muted/40 border-border/50 text-muted-foreground hover:border-border'
              }`}>
              {SUBJECT_EMOJIS[s]} {s}
            </button>
          ))}
        </div>
      </div>

      {/* Create */}
      <div className="section-card p-5 mb-3">
        <h3 className="font-black text-sm mb-1">🎯 Host a Battle</h3>
        <p className="text-xs text-muted-foreground mb-4">Create a room — share the code with your friend</p>
        <Button onClick={createBattle} className="w-full h-11 font-bold gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white border-none hover:from-red-500 hover:to-orange-500">
          <Users className="w-4 h-4" /> Create Battle Room
        </Button>
      </div>

      {/* Join */}
      <div className="section-card p-5 mb-3">
        <h3 className="font-black text-sm mb-1">🔗 Join a Battle</h3>
        <p className="text-xs text-muted-foreground mb-3">Enter the 6-char code your friend shared</p>
        <div className="flex gap-2">
          <input
            value={inputCode}
            onChange={e => setInputCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="ENTER CODE"
            className="flex-1 h-11 bg-muted/40 border border-border/50 rounded-xl px-3 font-mono text-sm font-black tracking-widest text-center focus:outline-none focus:border-primary/50"
          />
          <Button onClick={joinBattle} className="h-11 px-5 font-bold bg-gradient-to-r from-orange-600 to-red-600 text-white border-none">
            Join!
          </Button>
        </div>
      </div>

      <button onClick={onBack} className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors">
        ← Back to Battle Arena
      </button>
    </div>
  );

  if (gameState === 'waiting') return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-6 px-4 slide-up">
      <div className="text-6xl float">⚔️</div>
      {isHost ? (
        <>
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-2">Share this code with your opponent:</p>
            <div className="font-mono text-4xl font-black tracking-[0.3em] text-primary bg-primary/10 border border-primary/30 rounded-2xl px-8 py-4">
              {battleCode}
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />Waiting for opponent...
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />Joining battle room...
        </div>
      )}
    </div>
  );

  if (gameState === 'playing') return (
    <QuizPlayer
      questions={questions}
      onFinish={handleFinish}
      title={`⚔️ ${selectedSubject} Duel`}
      accentFrom="from-red-600"
      accentTo="to-orange-600"
    />
  );

  if (gameState === 'results') {
    const iWon = opponentScore === null || opponentScore === -1 ? true : myScore > opponentScore || (myScore === opponentScore && timeTaken < 999);
    const tie = opponentScore !== null && opponentScore !== -1 && myScore === opponentScore;

    return (
      <div className="container mx-auto max-w-2xl px-4 py-5 slide-up">
        <div className="relative overflow-hidden rounded-3xl p-6 mb-5 text-center text-white"
          style={{ background: iWon && !tie ? 'linear-gradient(135deg, hsl(152 70% 28%) 0%, hsl(168 75% 24%) 100%)' : 'linear-gradient(135deg, hsl(0 70% 30%) 0%, hsl(25 90% 32%) 100%)' }}>
          <div className="text-6xl mb-2 float">{tie ? '🤝' : iWon ? '🏆' : '💀'}</div>
          <h2 className="text-2xl font-black">{tie ? "It's a Tie!" : iWon ? 'You Won!' : 'You Lost!'}</h2>

          <div className="grid grid-cols-2 gap-4 mt-5">
            <div className="bg-black/20 rounded-2xl p-4">
              <p className="text-white/60 text-xs mb-1">You</p>
              <p className="text-4xl font-black">{myScore}/5</p>
              <p className="text-white/60 text-xs">{timeTaken}s</p>
            </div>
            <div className="bg-black/20 rounded-2xl p-4">
              <p className="text-white/60 text-xs mb-1">{opponentName || 'Opponent'}</p>
              <p className="text-4xl font-black">
                {opponentScore === null ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : opponentScore === -1 ? '—' : `${opponentScore}/5`}
              </p>
              {opponentScore === null && <p className="text-white/60 text-xs">Still playing...</p>}
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-4 font-black">
            <Zap className="w-4 h-4 text-yellow-300" />
            <span className="text-yellow-300">+{myScore * 25} XP earned</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => { setBattleId(null); setGameState('lobby'); setMyScore(0); setOpponentScore(null); setOpponentName(''); setBattleCode(''); setInputCode(''); }}
            className="h-11 btn-primary font-bold">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Rematch
          </Button>
          <Button onClick={onBack} variant="outline" className="h-11 font-bold border-border/50">
            ← Arena
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

/* ─────────────────────────────────────────────── */
/*  Main Battle Component                          */
/* ─────────────────────────────────────────────── */
const Battle = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('home');
  const { level } = useXP();

  const userLeague = [...LEAGUES].reverse().find(l => level >= l.min) || LEAGUES[0];

  if (mode === 'daily') return (
    <div className="min-h-screen bg-background pb-24">
      <div className="glass-strong border-b border-border/20 sticky top-0 z-40">
        <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMode('home')} className="rounded-xl w-9 h-9 flex items-center justify-center hover:bg-muted/40 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-black text-sm">⚡ Daily Challenge</span>
        </div>
      </div>
      <DailyChallenge onBack={() => setMode('home')} />
      <BottomNav navigate={navigate} />
    </div>
  );

  if (mode === 'tournament') return (
    <div className="min-h-screen bg-background pb-24">
      <div className="glass-strong border-b border-border/20 sticky top-0 z-40">
        <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMode('home')} className="rounded-xl w-9 h-9 flex items-center justify-center hover:bg-muted/40 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-black text-sm">{userLeague.emoji} Subject Tournament</span>
        </div>
      </div>
      <SubjectTournament onBack={() => setMode('home')} />
      <BottomNav navigate={navigate} />
    </div>
  );

  if (mode === 'battle1v1') return (
    <div className="min-h-screen bg-background pb-24">
      <div className="glass-strong border-b border-border/20 sticky top-0 z-40">
        <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMode('home')} className="rounded-xl w-9 h-9 flex items-center justify-center hover:bg-muted/40 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-black text-sm">⚔️ 1v1 Battle</span>
        </div>
      </div>
      <Battle1v1 onBack={() => setMode('home')} />
      <BottomNav navigate={navigate} />
    </div>
  );

  // Home screen
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="glass-strong border-b border-border/20 sticky top-0 z-40">
        <div className="container mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-xl w-9 h-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm leading-none">Battle Arena</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Compete · Climb · Conquer</p>
          </div>
          <div className={`flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1.5 rounded-xl bg-gradient-to-r ${userLeague.color} text-white`}>
            {userLeague.emoji} {userLeague.label}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-5">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl mb-5 p-7 text-white"
          style={{
            background: 'linear-gradient(135deg, hsl(0 80% 22%) 0%, hsl(25 90% 22%) 50%, hsl(45 90% 20%) 100%)',
            border: '1px solid hsl(0 70% 40% / 0.3)',
            boxShadow: '0 8px 40px hsl(0 80% 40% / 0.2), inset 0 1px 0 hsl(0 70% 60% / 0.15)',
          }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-orange-500/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-red-500/10 blur-xl" />
          <div className="relative">
            <div className="text-5xl mb-3 float">⚔️</div>
            <h2 className="text-2xl font-black mb-1">Battle Arena</h2>
            <p className="text-white/70 text-sm mb-4">Test your knowledge. Crush the competition.</p>
            <div className="flex gap-2 flex-wrap">
              {[['⚡', 'Daily Resets'], ['🏆', 'Real Rankings'], ['⚔️', 'Live 1v1']].map(([e, t]) => (
                <div key={t} className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-1.5 text-xs font-bold">
                  {e} {t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mode Cards */}
        <div className="space-y-3 mb-6">
          {/* Daily Challenge */}
          <button onClick={() => setMode('daily')}
            className="w-full section-card rounded-2xl p-5 flex items-center gap-4 text-left hover:border-yellow-500/30 hover:bg-yellow-500/5 transition-all group">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-black text-base">Daily Challenge</h3>
                <span className="text-[10px] bg-yellow-500/20 text-yellow-500 font-black px-2 py-0.5 rounded-full">LIVE</span>
              </div>
              <p className="text-sm text-muted-foreground">Same questions for everyone. Compare your rank on the global leaderboard.</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />Resets daily
                </span>
                <span className="text-xs text-yellow-500 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" />+30 XP/Q
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
          </button>

          {/* Tournament */}
          <button onClick={() => setMode('tournament')}
            className="w-full section-card rounded-2xl p-5 flex items-center gap-4 text-left hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group">
            <div className={`w-14 h-14 bg-gradient-to-br ${userLeague.color} rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg group-hover:scale-105 transition-transform`}>
              {userLeague.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-black text-base">Subject Tournament</h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${userLeague.textColor} bg-current/10`}
                  style={{ backgroundColor: `${userLeague.textColor.replace('text-', '')} / 0.15` }}>
                  {userLeague.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Weekly brackets by subject. Climb from Bronze to Diamond league!</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Trophy className="w-3 h-3" />Weekly reset
                </span>
                <span className="text-xs text-yellow-500 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" />+20 XP/Q
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
          </button>

          {/* 1v1 */}
          <button onClick={() => setMode('battle1v1')}
            className="w-full section-card rounded-2xl p-5 flex items-center gap-4 text-left hover:border-red-500/30 hover:bg-red-500/5 transition-all group">
            <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-rose-600 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform">
              ⚔️
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-black text-base">1v1 Battle</h3>
                <span className="text-[10px] bg-red-500/20 text-red-400 font-black px-2 py-0.5 rounded-full">REAL-TIME</span>
              </div>
              <p className="text-sm text-muted-foreground">Challenge a friend with a code. Same questions, whoever scores higher wins!</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />Invite with code
                </span>
                <span className="text-xs text-yellow-500 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" />+25 XP/Q
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
          </button>
        </div>

        {/* League Ladder */}
        <div className="section-card rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="font-black text-sm">League Ladder</h3>
          </div>
          <div className="flex items-center gap-1">
            {LEAGUES.map((l, i) => (
              <div key={l.id} className="flex items-center flex-1">
                <div className={`flex-1 flex flex-col items-center p-3 rounded-xl transition-all ${l.id === userLeague.id ? `bg-gradient-to-br ${l.color}` : 'bg-muted/30'}`}>
                  <span className="text-2xl">{l.emoji}</span>
                  <span className={`text-xs font-black mt-1 ${l.id === userLeague.id ? 'text-white' : 'text-muted-foreground'}`}>{l.label}</span>
                  {l.id === userLeague.id && (
                    <span className="text-[9px] text-white/70 mt-0.5">You</span>
                  )}
                </div>
                {i < LEAGUES.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mx-0.5 shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/quiz')}
            className="section-card rounded-2xl p-4 flex items-center gap-3 text-left hover:border-border transition-colors group">
            <Brain className="w-8 h-8 text-primary" />
            <div>
              <p className="font-bold text-sm">Practice Quiz</p>
              <p className="text-xs text-muted-foreground">Prep for battle</p>
            </div>
          </button>
          <button onClick={() => navigate('/leaderboard')}
            className="section-card rounded-2xl p-4 flex items-center gap-3 text-left hover:border-yellow-500/30 hover:bg-yellow-500/5 transition-colors">
            <Crown className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="font-bold text-sm">Leaderboard</p>
              <p className="text-xs text-muted-foreground">Global rankings</p>
            </div>
          </button>
        </div>
      </div>

      <BottomNav navigate={navigate} />
    </div>
  );
};

function BottomNav({ navigate }: { navigate: (p: string) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border/40 px-2 py-2 z-40">
      <div className="container mx-auto max-w-5xl flex justify-around">
        {[
          { icon: Brain, label: 'Learn', path: '/dashboard' },
          { icon: Zap, label: 'Quiz', path: '/quiz' },
          { icon: Swords, label: 'Battle', path: '/battle', active: true },
          { icon: Code2, label: 'Code', path: '/coding' },
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
  );
}

export default Battle;
