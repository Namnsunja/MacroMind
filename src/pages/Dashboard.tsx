import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Brain, MessageSquare, BookOpen, Image, Swords,
  GraduationCap, Code2, Trophy, Flame, Zap, ChevronRight,
  Star, Sparkles, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUser, clearUser } from '@/lib/auth';
import { useXP, ACHIEVEMENTS, getXPForCurrentLevel, getLevelTitle, XP_PER_LEVEL } from '@/contexts/XPContext';
import AdGate from '@/components/features/AdGate';
import Header from '@/components/layout/Header';
import DoubtUpload from '@/components/features/DoubtUpload';
import { getDoubts } from '@/lib/doubts';
import { Doubt } from '@/types';
import { useEffect } from 'react';

const FEATURES = [
  {
    icon: Camera,
    title: 'Snap a Doubt',
    description: 'Photo → instant AI solution',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'hsl(265 80% 60%)',
    badge: '🔥 Popular',
    badgeCls: 'bg-pink-500/90',
    path: null,
    xp: '+30 XP',
    emoji: '📸',
  },
  {
    icon: Brain,
    title: 'Quiz Mode',
    description: 'AI-generated quizzes instantly',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'hsl(200 80% 55%)',
    badge: null,
    badgeCls: '',
    path: '/quiz',
    xp: '+50 XP',
    emoji: '🧠',
  },
  {
    icon: MessageSquare,
    title: 'Ask Prof',
    description: 'Humorous AI teacher, 24/7',
    gradient: 'from-emerald-500 to-green-500',
    glow: 'hsl(152 70% 48%)',
    badge: '⭐ Fan Fav',
    badgeCls: 'bg-emerald-500/90',
    path: '/doubts-chat',
    xp: '+25 XP',
    emoji: '💬',
  },
  {
    icon: BookOpen,
    title: 'Smart Notes',
    description: 'AI creates study notes',
    gradient: 'from-orange-500 to-amber-500',
    glow: 'hsl(32 90% 52%)',
    badge: null,
    badgeCls: '',
    path: '/notes',
    xp: '+40 XP',
    emoji: '📖',
  },
  {
    icon: Image,
    title: 'Visual Maker',
    description: 'Diagrams & illustrations',
    gradient: 'from-pink-500 to-rose-500',
    glow: 'hsl(340 80% 58%)',
    badge: '🎨 AI Art',
    badgeCls: 'bg-pink-500/90',
    path: '/visual-maker',
    xp: '+35 XP',
    emoji: '🎨',
  },
  {
    icon: Code2,
    title: 'Coding Dojo',
    description: 'Daily coding challenges',
    gradient: 'from-teal-500 to-emerald-500',
    glow: 'hsl(168 75% 44%)',
    badge: '⚡ New',
    badgeCls: 'bg-teal-500/90',
    path: '/coding',
    xp: '+75 XP',
    emoji: '💻',
  },
  {
    icon: Swords,
    title: 'Battle Mode',
    description: 'Live quiz battles & ranks',
    gradient: 'from-red-500 to-orange-500',
    glow: 'hsl(10 80% 52%)',
    badge: null,
    badgeCls: '',
    path: '/battle',
    xp: '+60 XP',
    emoji: '⚔️',
  },
  {
    icon: GraduationCap,
    title: 'Lectures',
    description: 'Full lectures + practice',
    gradient: 'from-indigo-500 to-purple-500',
    glow: 'hsl(240 70% 58%)',
    badge: null,
    badgeCls: '',
    path: '/lectures',
    xp: '+45 XP',
    emoji: '🎓',
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const user = getUser();
  const { xp, level, streakDays, streakFreezes, earnedAchievements, earnStreakFreeze, useStreakFreeze } = useXP();
  const [showFreezeAd, setShowFreezeAd] = useState(false);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [showDoubts, setShowDoubts] = useState(false);
  const xpForLevel = getXPForCurrentLevel(xp);
  const xpPercent = Math.min((xpForLevel / XP_PER_LEVEL) * 100, 100);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    setDoubts(getDoubts());
  }, [user, navigate]);

  const handleLogout = () => { clearUser(); navigate('/'); };

  if (!user) return null;

  const recentAchievements = ACHIEVEMENTS.filter(a => earnedAchievements.includes(a.key)).slice(-3);

  // AdGate for freeze
  if (showFreezeAd) return (
    <AdGate
      reason="Watch a short ad to earn a Streak Freeze!"
      onComplete={async () => { await earnStreakFreeze(); setShowFreezeAd(false); }}
      onClose={() => setShowFreezeAd(false)}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={handleLogout} />

      <main className="container mx-auto px-4 py-5 max-w-5xl pb-28">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl mb-5 p-6"
          style={{
            background: 'linear-gradient(135deg, hsl(258 90% 22%) 0%, hsl(280 80% 18%) 50%, hsl(338 70% 20%) 100%)',
            border: '1px solid hsl(258 90% 68% / 0.25)',
            boxShadow: '0 8px 40px hsl(258 90% 68% / 0.15), inset 0 1px 0 hsl(258 90% 68% / 0.2)',
          }}>
          {/* Decorative */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-tr from-cyan-500/10 to-transparent blur-xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-violet-300/70 text-xs font-semibold uppercase tracking-widest mb-1">Welcome back</p>
                <h2 className="text-2xl font-black text-white leading-tight">
                  {user.name || `Class ${user.class} Explorer`} 👋
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-violet-300/60 uppercase tracking-wider">Level</p>
                <p className="text-3xl font-black text-white">{level}</p>
                <p className="text-[11px] text-violet-300/70 font-medium">{getLevelTitle(level)}</p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              {[
                { icon: '🔥', val: `${streakDays}d`, label: 'Streak', cls: 'bg-orange-500/15 border-orange-500/25 text-orange-300' },
                { icon: '⚡', val: xp.toLocaleString(), label: 'Total XP', cls: 'bg-yellow-500/15 border-yellow-500/25 text-yellow-300' },
                { icon: '🏆', val: `${earnedAchievements.length}`, label: 'Badges', cls: 'bg-amber-500/15 border-amber-500/25 text-amber-300' },
                { icon: '🧊', val: `${streakFreezes}`, label: 'Freezes', cls: 'bg-cyan-500/15 border-cyan-500/25 text-cyan-300' },
              ].map(s => (
                <div key={s.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${s.cls}`}>
                  <span>{s.icon}</span>
                  <span className="text-white font-black">{s.val}</span>
                  <span className="opacity-70">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Streak Freeze Banner */}
            {streakDays > 0 && (
              <div className="flex items-center gap-3 bg-black/20 rounded-xl px-3 py-2.5 mb-4">
                <span className="text-xl">🧊</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white/90 text-xs font-bold leading-none">
                    {streakFreezes > 0 ? `${streakFreezes} Streak Freeze${streakFreezes > 1 ? 's' : ''} ready` : 'No Streak Freezes'}
                  </p>
                  <p className="text-white/50 text-[10px] mt-0.5">
                    {streakFreezes > 0 ? 'Protects your streak if you miss a day' : 'Watch an ad to earn one!'}
                  </p>
                </div>
                {streakFreezes === 0 && (
                  <button onClick={() => setShowFreezeAd(true)}
                    className="text-[10px] font-black text-cyan-300 bg-cyan-500/20 border border-cyan-500/30 rounded-lg px-2.5 py-1.5 hover:bg-cyan-500/30 transition-colors shrink-0">
                    +1 Freeze
                  </button>
                )}
              </div>
            )}

            {/* XP Bar */}
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-violet-300/60 font-semibold">XP Progress</span>
                <span className="text-violet-300/60 font-semibold">{xpForLevel} / {XP_PER_LEVEL}</span>
              </div>
              <div className="h-2.5 bg-black/30 rounded-full overflow-hidden">
                <div className="xp-bar h-full" style={{ width: `${xpPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Snap CTA */}
        {!showDoubts && (
          <button
            onClick={() => setShowDoubts(true)}
            className="w-full mb-5 p-4 rounded-2xl flex items-center gap-4 transition-all group"
            style={{
              background: 'hsl(258 90% 68% / 0.08)',
              border: '1px dashed hsl(258 90% 68% / 0.35)',
            }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-violet-600/30">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="font-black text-sm text-foreground">Snap a Doubt</p>
              <p className="text-xs text-muted-foreground">Upload any question photo → Get AI solution instantly</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-primary shrink-0">
              <Zap className="w-3.5 h-3.5" /> +30 XP
            </div>
          </button>
        )}

        {showDoubts && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" /> Snap a Doubt
              </h3>
              <button onClick={() => setShowDoubts(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Close ×
              </button>
            </div>
            <DoubtUpload onDoubtUploaded={() => setDoubts(getDoubts())} />
          </div>
        )}

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
                <Star className="w-4 h-4 text-yellow-500" /> Achievements
              </h3>
              <button onClick={() => navigate('/profile')} className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors">
                View all →
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {recentAchievements.map(a => (
                <div key={a.key} className="achievement-pop shrink-0 section-card px-4 py-3 flex items-center gap-2.5">
                  <span className="text-2xl">{a.emoji}</span>
                  <div>
                    <p className="font-bold text-xs whitespace-nowrap text-foreground">{a.title}</p>
                    <p className="text-[10px] text-yellow-500 font-bold">+{a.xpReward} XP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-black text-sm text-foreground">Learning Arsenal</h3>
          <span className="text-xs text-muted-foreground ml-auto">{FEATURES.length} modules</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURES.map((f, i) => (
            <button
              key={i}
              onClick={() => f.path ? navigate(f.path) : setShowDoubts(true)}
              className="feature-card p-4 text-left"
            >
              {f.badge && (
                <span className={`absolute top-2.5 right-2.5 ${f.badgeCls} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full`}>
                  {f.badge}
                </span>
              )}

              {/* Icon */}
              <div className={`inline-flex w-11 h-11 items-center justify-center bg-gradient-to-br ${f.gradient} rounded-2xl mb-3`}
                style={{ boxShadow: `0 4px 16px ${f.glow}40` }}>
                <f.icon className="w-5 h-5 text-white" />
              </div>

              <h4 className="font-black text-sm mb-0.5 leading-tight text-foreground">{f.title}</h4>
              <p className="text-[11px] text-muted-foreground leading-tight mb-3">{f.description}</p>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-primary">{f.xp}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-strong z-50">
        <div className="container mx-auto max-w-5xl flex justify-around px-2 py-2 safe-area-bottom">
          {[
            { icon: Brain, label: 'Learn', path: '/dashboard', active: true },
            { icon: Zap, label: 'Quiz', path: '/quiz', active: false },
            { icon: Swords, label: 'Battle', path: '/battle', active: false },
            { icon: Code2, label: 'Code', path: '/coding', active: false },
            { icon: Trophy, label: 'Profile', path: '/profile', active: false },
          ].map((item) => (
            <button key={item.label}
              onClick={() => navigate(item.path)}
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

export default Dashboard;
