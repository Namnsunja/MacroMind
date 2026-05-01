import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Crown, Zap, ArrowLeft, Flame, Medal,
  Star, Brain, Swords, Code2, RefreshCw, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useXP, getLevelTitle } from '@/contexts/XPContext';

type Tab = 'global' | 'weekly' | 'battle';

interface LeaderEntry {
  user_id: string;
  total_xp: number;
  level: number;
  streak_days: number;
  daily_challenge_streak: number;
  battles_won: number;
  username: string;
  email: string;
}

const LEAGUE_BADGE = (level: number) => {
  if (level >= 20) return { emoji: '🔱', label: 'Grandmaster', cls: 'from-purple-500 to-violet-600' };
  if (level >= 15) return { emoji: '💎', label: 'Diamond', cls: 'from-cyan-400 to-blue-500' };
  if (level >= 10) return { emoji: '🥇', label: 'Gold', cls: 'from-yellow-400 to-amber-500' };
  if (level >= 7)  return { emoji: '🥈', label: 'Silver', cls: 'from-slate-300 to-gray-400' };
  if (level >= 5)  return { emoji: '🥉', label: 'Bronze', cls: 'from-orange-600 to-amber-700' };
  return { emoji: '🌱', label: 'Seedling', cls: 'from-green-500 to-emerald-600' };
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const { xp, level } = useXP();
  const [tab, setTab] = useState<Tab>('global');
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: session } = await supabase.auth.getSession();
      setMyId(session.session?.user?.id || null);
    };
    load();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_xp')
        .select('user_id, total_xp, level, streak_days, daily_challenge_streak, battles_won, user_profiles(username, email)')
        .order('total_xp', { ascending: false })
        .limit(50);

      if (tab === 'weekly') {
        // Weekly: order by streak days (activity this week)
        query = supabase
          .from('user_xp')
          .select('user_id, total_xp, level, streak_days, daily_challenge_streak, battles_won, user_profiles(username, email)')
          .order('streak_days', { ascending: false })
          .limit(50);
      } else if (tab === 'battle') {
        query = supabase
          .from('user_xp')
          .select('user_id, total_xp, level, streak_days, daily_challenge_streak, battles_won, user_profiles(username, email)')
          .order('battles_won', { ascending: false })
          .limit(50);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: LeaderEntry[] = (data || []).map((d: any) => ({
        user_id: d.user_id,
        total_xp: d.total_xp || 0,
        level: d.level || 1,
        streak_days: d.streak_days || 0,
        daily_challenge_streak: d.daily_challenge_streak || 0,
        battles_won: d.battles_won || 0,
        username: d.user_profiles?.username || d.user_profiles?.email?.split('@')[0] || 'Anon',
        email: d.user_profiles?.email || '',
      }));

      setEntries(mapped);

      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user?.id;
      if (uid) {
        const rank = mapped.findIndex(e => e.user_id === uid) + 1;
        setMyRank(rank > 0 ? rank : null);
      }
    } catch (e) {
      console.error('Leaderboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaderboard(); }, [tab]);

  const TABS = [
    { id: 'global' as Tab, label: 'Global XP', icon: Trophy, emoji: '🏆' },
    { id: 'weekly' as Tab, label: 'Streak', icon: Flame, emoji: '🔥' },
    { id: 'battle' as Tab, label: 'Battle', icon: Swords, emoji: '⚔️' },
  ];

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { text: '🥇', cls: 'text-yellow-400 text-xl' };
    if (rank === 2) return { text: '🥈', cls: 'text-slate-300 text-xl' };
    if (rank === 3) return { text: '🥉', cls: 'text-amber-600 text-xl' };
    return { text: `#${rank}`, cls: 'text-muted-foreground font-black text-sm' };
  };

  const getStatDisplay = (entry: LeaderEntry) => {
    if (tab === 'global') return { val: `${entry.total_xp.toLocaleString()} XP`, icon: '⚡' };
    if (tab === 'weekly') return { val: `${entry.streak_days}d streak`, icon: '🔥' };
    return { val: `${entry.battles_won} wins`, icon: '⚔️' };
  };

  const myLeague = LEAGUE_BADGE(level);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="glass-strong border-b border-border/20 sticky top-0 z-40">
        <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/battle')} className="rounded-xl w-9 h-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm leading-none">Global Leaderboard</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Top 50 MacroMind Champions</p>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchLeaderboard} className="rounded-xl w-9 h-9">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-5">
        {/* My rank hero */}
        {myRank && (
          <div className="relative overflow-hidden rounded-3xl p-5 mb-5 text-white"
            style={{
              background: `linear-gradient(135deg, hsl(43 100% 25%) 0%, hsl(32 90% 28%) 100%)`,
              border: '1px solid hsl(43 100% 40% / 0.3)',
              boxShadow: '0 8px 32px hsl(43 100% 40% / 0.15)',
            }}>
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5 blur-xl" />
            <div className="relative flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${myLeague.cls} flex items-center justify-center text-2xl shadow-lg`}>
                {myLeague.emoji}
              </div>
              <div className="flex-1">
                <p className="text-white/60 text-xs font-semibold">Your Ranking</p>
                <p className="text-3xl font-black text-white">#{myRank}</p>
                <p className="text-white/70 text-xs">{myLeague.label} · Level {level} · {xp.toLocaleString()} XP</p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1">League</p>
                <p className="font-black text-sm">{getLevelTitle(level)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex gap-2 mb-5 p-1 section-card rounded-2xl">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all ${
                tab === t.id
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {!loading && entries.length >= 3 && (
          <div className="mb-5">
            <div className="flex items-end justify-center gap-2 mb-1">
              {/* 2nd */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-gray-500 rounded-2xl flex items-center justify-center text-xl mb-1.5 shadow-lg">
                  {LEAGUE_BADGE(entries[1]?.level || 1).emoji}
                </div>
                <p className="font-black text-xs text-center truncate w-full text-center">{entries[1]?.username}</p>
                <p className="text-[10px] text-muted-foreground">{getStatDisplay(entries[1]).val}</p>
                <div className="w-full h-16 bg-gradient-to-t from-slate-500/30 to-slate-500/10 border border-slate-500/20 rounded-t-xl mt-2 flex items-start justify-center pt-1.5">
                  <span className="text-slate-300 font-black text-sm">🥈</span>
                </div>
              </div>

              {/* 1st */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center text-2xl mb-1.5 shadow-xl shadow-yellow-500/30 float">
                  {LEAGUE_BADGE(entries[0]?.level || 1).emoji}
                </div>
                <p className="font-black text-sm text-center truncate w-full text-center text-yellow-400">{entries[0]?.username}</p>
                <p className="text-[11px] text-yellow-400/70">{getStatDisplay(entries[0]).val}</p>
                <div className="w-full h-24 bg-gradient-to-t from-yellow-500/30 to-yellow-500/10 border border-yellow-500/20 rounded-t-xl mt-2 flex items-start justify-center pt-1.5">
                  <span className="text-yellow-400 font-black">👑</span>
                </div>
              </div>

              {/* 3rd */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-amber-700 rounded-2xl flex items-center justify-center text-xl mb-1.5 shadow-lg">
                  {LEAGUE_BADGE(entries[2]?.level || 1).emoji}
                </div>
                <p className="font-black text-xs text-center truncate w-full text-center">{entries[2]?.username}</p>
                <p className="text-[10px] text-muted-foreground">{getStatDisplay(entries[2]).val}</p>
                <div className="w-full h-10 bg-gradient-to-t from-amber-700/30 to-amber-700/10 border border-amber-700/20 rounded-t-xl mt-2 flex items-start justify-center pt-1.5">
                  <span className="text-amber-600 font-black text-sm">🥉</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full list */}
        <div className="section-card rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
            <Medal className="w-4 h-4 text-yellow-500" />
            <span className="font-black text-sm">Rankings</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {tab === 'global' ? 'By Total XP' : tab === 'weekly' ? 'By Streak' : 'By Battle Wins'}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🏆</p>
              <p className="font-bold text-sm text-muted-foreground">No players yet! Be the first.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {entries.slice(3).map((entry, i) => {
                const rank = i + 4;
                const rankDisplay = getRankDisplay(rank);
                const isMe = entry.user_id === myId;
                const badge = LEAGUE_BADGE(entry.level);
                const stat = getStatDisplay(entry);
                return (
                  <div key={entry.user_id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${isMe ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-muted/20'}`}>
                    <span className={`w-8 text-center ${rankDisplay.cls}`}>{rankDisplay.text}</span>
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${badge.cls} flex items-center justify-center text-sm shrink-0`}>
                      {badge.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
                        {entry.username} {isMe && <span className="text-[10px] text-primary/70">(you)</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Level {entry.level} · {getLevelTitle(entry.level)}</p>
                    </div>
                    <div className="flex items-center gap-1 font-black text-sm text-yellow-500">
                      <span className="text-xs">{stat.icon}</span>
                      <span className="text-xs">{stat.val}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border/40 px-2 py-2 z-40">
        <div className="container mx-auto max-w-5xl flex justify-around">
          {[
            { icon: Brain, label: 'Learn', path: '/dashboard' },
            { icon: Zap, label: 'Quiz', path: '/quiz' },
            { icon: Swords, label: 'Battle', path: '/battle' },
            { icon: Code2, label: 'Code', path: '/coding' },
            { icon: Trophy, label: 'Profile', path: '/profile' },
          ].map(item => (
            <button key={item.label} onClick={() => navigate(item.path)}
              className="nav-item">
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Leaderboard;
