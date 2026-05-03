import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Flame, Zap, Star, ArrowLeft, Lock, Brain, Swords,
  Code2, BookOpen, Target, TrendingUp, Crown, Medal, Calendar,
  CheckCircle, BarChart3, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useXP, ACHIEVEMENTS, getLevelTitle, getXPForCurrentLevel, XP_PER_LEVEL } from '@/contexts/XPContext';
import { getUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const LEAGUE_COLOR = (level: number) => {
  if (level >= 20) return 'from-purple-500 to-violet-600';
  if (level >= 15) return 'from-cyan-400 to-blue-500';
  if (level >= 10) return 'from-yellow-400 to-amber-500';
  if (level >= 7)  return 'from-slate-300 to-gray-400';
  if (level >= 5)  return 'from-orange-500 to-amber-600';
  return 'from-emerald-500 to-green-600';
};

interface Stats {
  quizTotal: number;
  quizAvg: number;
  lecturesGen: number;
  notesGen: number;
  codingSolved: number;
  battlesPlayed: number;
  battlesWon: number;
  dailyStreak: number;
  doubtsAsked: number;
  tournamentBest: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const { xp, level, streakDays, streakFreezes, earnedAchievements } = useXP();
  const user = getUser();
  const xpForLevel = getXPForCurrentLevel(xp);
  const xpPercent = Math.min((xpForLevel / XP_PER_LEVEL) * 100, 100);
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements'>('stats');
  const [stats, setStats] = useState<Stats>({
    quizTotal: 0, quizAvg: 0, lecturesGen: 0, notesGen: 0,
    codingSolved: 0, battlesPlayed: 0, battlesWon: 0,
    dailyStreak: 0, doubtsAsked: 0, tournamentBest: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user?.id;
      if (!uid) { setLoading(false); return; }

      try {
        const [quizRes, lectureRes, codingRes, battleScoresRes, dailyChalRes, xpRes] = await Promise.all([
          supabase.from('quiz_history').select('score, total_questions').eq('user_id', uid),
          supabase.from('lectures').select('id').eq('user_id', uid),
          supabase.from('coding_history').select('passed').eq('user_id', uid),
          supabase.from('battle_scores').select('score').eq('user_id', uid),
          supabase.from('daily_challenge_scores').select('score').eq('user_id', uid),
          supabase.from('user_xp').select('daily_challenge_streak, battles_won, coding_solved').eq('user_id', uid).single(),
        ]);

        const quizData = quizRes.data || [];
        const avgScore = quizData.length > 0
          ? Math.round(quizData.reduce((acc, q) => acc + (q.score / q.total_questions) * 100, 0) / quizData.length)
          : 0;

        const codingData = codingRes.data || [];
        const passed = codingData.filter(c => c.passed).length;

        const battleData = battleScoresRes.data || [];

        setStats({
          quizTotal: quizData.length,
          quizAvg: avgScore,
          lecturesGen: lectureRes.data?.length || 0,
          notesGen: lectureRes.data?.length || 0,
          codingSolved: xpRes.data?.coding_solved || passed,
          battlesPlayed: battleData.length + (dailyChalRes.data?.length || 0),
          battlesWon: xpRes.data?.battles_won || 0,
          dailyStreak: xpRes.data?.daily_challenge_streak || 0,
          doubtsAsked: 0,
          tournamentBest: 0,
        });
      } catch (e) {
        console.error('Stats fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const leagueGradient = LEAGUE_COLOR(level);
  const leagueTitle = getLevelTitle(level);

  const STAT_CARDS = [
    {
      group: 'Learning',
      icon: Brain,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
      items: [
        { label: 'Quizzes Done', val: stats.quizTotal, icon: '🧠' },
        { label: 'Avg Score', val: `${stats.quizAvg}%`, icon: '🎯' },
        { label: 'Lectures', val: stats.lecturesGen, icon: '📚' },
        { label: 'Doubts Solved', val: `${earnedAchievements.includes('ten_doubts') ? '10+' : earnedAchievements.includes('first_doubt') ? '1+' : '0'}`, icon: '💬' },
      ],
    },
    {
      group: 'Battle',
      icon: Swords,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      items: [
        { label: 'Battles Played', val: stats.battlesPlayed, icon: '⚔️' },
        { label: 'Battles Won', val: stats.battlesWon, icon: '🏆' },
        { label: 'Daily Streak', val: `${stats.dailyStreak}d`, icon: '⚡' },
        { label: 'Win Rate', val: stats.battlesPlayed > 0 ? `${Math.round((stats.battlesWon / stats.battlesPlayed) * 100)}%` : '—', icon: '📊' },
      ],
    },
    {
      group: 'Coding',
      icon: Code2,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20',
      items: [
        { label: 'Challenges Solved', val: stats.codingSolved, icon: '✅' },
        { label: 'XP from Code', val: `${stats.codingSolved * 75}`, icon: '⚡' },
        { label: 'Status', val: stats.codingSolved >= 10 ? 'Code Ninja' : stats.codingSolved >= 3 ? 'Coder' : 'Newbie', icon: '🥷' },
        { label: 'Achievement', val: earnedAchievements.includes('first_code') ? '✅' : '🔒', icon: '🏅' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="glass-strong border-b border-border/20 sticky top-0 z-40">
        <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-xl w-9 h-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <p className="font-black text-sm">Profile & Stats</p>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => navigate('/about')}
              className="flex items-center gap-1.5 text-xs font-black text-violet-400 bg-violet-500/10 rounded-xl px-3 py-1.5 hover:bg-violet-500/20 transition-colors">
              <Info className="w-3.5 h-3.5" /> About
            </button>
            <button onClick={() => navigate('/leaderboard')}
              className="flex items-center gap-1.5 text-xs font-black text-yellow-500 bg-yellow-500/10 rounded-xl px-3 py-1.5 hover:bg-yellow-500/20 transition-colors">
              <Crown className="w-3.5 h-3.5" /> Leaderboard
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-5 space-y-4">
        {/* Profile Hero Card */}
        <div className={`relative overflow-hidden rounded-3xl p-6 text-white bg-gradient-to-br ${leagueGradient}`}
          style={{ boxShadow: '0 8px 40px hsl(258 90% 68% / 0.2)' }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-black/10 blur-xl" />

          <div className="relative">
            {/* Avatar + name */}
            <div className="flex items-start gap-4 mb-5">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl border border-white/30 shadow-inner shrink-0">
                🎓
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-black leading-tight">{user?.name || 'MacroMind Student'}</h2>
                <p className="text-white/70 text-sm">Class {user?.class || '?'} · {leagueTitle}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-white/15 border border-white/20 rounded-xl px-2.5 py-1 font-bold">
                    Level {level}
                  </span>
                  <span className="text-xs bg-white/15 border border-white/20 rounded-xl px-2.5 py-1 font-bold">
                    🔥 {streakDays}d streak
                  </span>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { label: 'Level', value: level, icon: '⭐' },
                { label: 'XP', value: xp >= 1000 ? `${(xp/1000).toFixed(1)}k` : xp, icon: '⚡' },
                { label: 'Badges', value: earnedAchievements.length, icon: '🏅' },
                { label: 'Freezes', value: streakFreezes, icon: '🧊' },
              ].map(s => (
                <div key={s.label} className="bg-black/20 backdrop-blur rounded-2xl p-3 text-center">
                  <p className="text-lg leading-none mb-1">{s.icon}</p>
                  <p className="font-black text-base leading-none">{s.value}</p>
                  <p className="text-white/50 text-[10px] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* XP progress */}
            <div>
              <div className="flex justify-between text-xs text-white/60 mb-1.5 font-semibold">
                <span>Level {level} → {level + 1}</span>
                <span>{xpForLevel} / {XP_PER_LEVEL} XP</span>
              </div>
              <div className="h-2.5 bg-black/25 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${xpPercent}%` }} />
              </div>
              <p className="text-white/50 text-[10px] mt-1">{XP_PER_LEVEL - xpForLevel} XP to next level</p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1 section-card rounded-2xl">
          {[
            { id: 'stats' as const, label: 'Stats', icon: '📊' },
            { id: 'achievements' as const, label: 'Achievements', icon: '🏆' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === t.id
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'stats' && (
          <div className="space-y-4 slide-up">
            {/* Battle Streak Banner */}
            {stats.dailyStreak > 0 && (
              <div className="relative overflow-hidden rounded-2xl p-4 text-white"
                style={{ background: 'linear-gradient(135deg, hsl(25 90% 30%) 0%, hsl(43 100% 30%) 100%)' }}>
                <div className="flex items-center gap-3">
                  <div className="text-4xl float">⚡</div>
                  <div>
                    <p className="font-black text-base">{stats.dailyStreak}-Day Challenge Streak!</p>
                    <p className="text-white/70 text-xs">Keep completing daily challenges to grow this!</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="font-black text-2xl">{stats.dailyStreak}</p>
                    <p className="text-white/60 text-[10px]">days</p>
                  </div>
                </div>
              </div>
            )}

            {/* XP Total card */}
            <div className="section-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/15 rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Total XP Earned</p>
                <p className="font-black text-2xl gradient-text-gold">{xp.toLocaleString()} XP</p>
              </div>
              <button onClick={() => navigate('/leaderboard')}
                className="text-xs text-primary font-bold hover:text-primary/80 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Rank
              </button>
            </div>

            {/* Subject stats */}
            {STAT_CARDS.map(group => (
              <div key={group.group} className="section-card rounded-2xl overflow-hidden">
                <div className={`px-4 py-3 border-b border-border/30 flex items-center gap-2 ${group.bg}`}>
                  <group.icon className={`w-4 h-4 ${group.color}`} />
                  <span className={`font-black text-sm ${group.color}`}>{group.group} Stats</span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-y divide-border/20">
                  {group.items.map((item, i) => (
                    <div key={i} className="p-4">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                        {item.icon} {item.label}
                      </p>
                      <p className="font-black text-xl text-foreground">{item.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Activity heatmap concept */}
            <div className="section-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-black text-sm">Weekly Activity</span>
              </div>
              <div className="flex gap-1.5">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
                  const isToday = new Date().getDay() === (i + 1) % 7;
                  const isActive = i < (new Date().getDay() || 7);
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className={`w-full aspect-square rounded-lg transition-all ${
                        isToday ? 'bg-primary shadow-md shadow-primary/30' :
                        isActive ? 'bg-primary/30' : 'bg-muted/30'
                      }`} />
                      <span className="text-[9px] text-muted-foreground font-bold">{day}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                🔥 {streakDays}-day learning streak • Keep it going!
              </p>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="slide-up">
            {/* Progress banner */}
            <div className="section-card p-4 rounded-2xl mb-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/15 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="font-black text-sm">{earnedAchievements.length} / {ACHIEVEMENTS.length} Achievements</p>
                <div className="h-1.5 bg-muted/50 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all"
                    style={{ width: `${(earnedAchievements.length / ACHIEVEMENTS.length) * 100}%` }} />
                </div>
              </div>
              <p className="font-black text-sm text-yellow-500">{Math.round((earnedAchievements.length / ACHIEVEMENTS.length) * 100)}%</p>
            </div>

            {/* Achievement grid */}
            <div className="space-y-2">
              {ACHIEVEMENTS.map(ach => {
                const earned = earnedAchievements.includes(ach.key);
                return (
                  <div key={ach.key}
                    className={`section-card rounded-2xl p-4 flex items-center gap-4 transition-all ${
                      earned ? 'border-primary/25 bg-primary/4' : 'opacity-40'
                    }`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                      earned ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30' : 'bg-muted'
                    }`}>
                      {earned ? ach.emoji : <Lock className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{ach.title}</p>
                      <p className="text-xs text-muted-foreground">{ach.description}</p>
                    </div>
                    <div className={`shrink-0 text-xs font-black px-2.5 py-1 rounded-xl ${
                      earned ? 'bg-yellow-500/15 text-yellow-500' : 'bg-muted text-muted-foreground'
                    }`}>
                      +{ach.xpReward} XP
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border/40 px-2 py-2 z-40">
        <div className="container mx-auto max-w-5xl flex justify-around">
          {[
            { icon: Brain, label: 'Learn', path: '/dashboard' },
            { icon: Zap, label: 'Quiz', path: '/quiz' },
            { icon: Swords, label: 'Battle', path: '/battle' },
            { icon: Code2, label: 'Code', path: '/coding' },
            { icon: Trophy, label: 'Profile', path: '/profile', active: true },
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
};

export default Profile;
