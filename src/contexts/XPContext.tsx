import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { getUser } from '@/lib/auth';
import { toast } from 'sonner';

export interface Achievement {
  key: string;
  title: string;
  description: string;
  emoji: string;
  xpReward: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { key: 'first_doubt', title: 'Curious Mind', description: 'Asked your first doubt!', emoji: '🤔', xpReward: 50 },
  { key: 'first_quiz', title: 'Quiz Rookie', description: 'Completed first quiz!', emoji: '🎯', xpReward: 50 },
  { key: 'first_lecture', title: 'Knowledge Seeker', description: 'Generated first lecture!', emoji: '📚', xpReward: 50 },
  { key: 'first_note', title: 'Note Taker', description: 'Created first note!', emoji: '📝', xpReward: 30 },
  { key: 'first_visual', title: 'Visual Artist', description: 'Made first visual!', emoji: '🎨', xpReward: 30 },
  { key: 'first_code', title: 'Code Newbie', description: 'Completed first coding challenge!', emoji: '💻', xpReward: 75 },
  { key: 'quiz_perfect', title: 'Perfectionist', description: 'Got 100% on a quiz!', emoji: '⭐', xpReward: 100 },
  { key: 'streak_3', title: 'On a Roll', description: '3-day learning streak!', emoji: '🔥', xpReward: 100 },
  { key: 'streak_7', title: 'Week Warrior', description: '7-day learning streak!', emoji: '🔥🔥', xpReward: 250 },
  { key: 'streak_30', title: 'Unstoppable', description: '30-day learning streak!', emoji: '⚡', xpReward: 1000 },
  { key: 'level_5', title: 'Rising Star', description: 'Reached Level 5!', emoji: '🌟', xpReward: 200 },
  { key: 'level_10', title: 'Scholar', description: 'Reached Level 10!', emoji: '🎓', xpReward: 500 },
  { key: 'ten_doubts', title: 'Doubt Machine', description: 'Asked 10 doubts!', emoji: '🧠', xpReward: 150 },
  { key: 'ad_watcher', title: 'Team Player', description: 'Watched first ad to support!', emoji: '📺', xpReward: 20 },
  { key: 'first_battle', title: 'Battle Initiate', description: 'Completed first battle!', emoji: '⚔️', xpReward: 75 },
  { key: 'daily_streak_3', title: 'Daily Warrior', description: 'Completed 3 daily challenges!', emoji: '⚡', xpReward: 150 },
  { key: 'tournament_winner', title: 'Tournament Champion', description: 'Ranked #1 in a tournament!', emoji: '🏆', xpReward: 300 },
];

export const XP_PER_LEVEL = 500;

export const getLevel = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;
export const getXPForCurrentLevel = (xp: number) => xp % XP_PER_LEVEL;
export const getLevelTitle = (level: number) => {
  if (level >= 20) return '🔱 Grandmaster';
  if (level >= 15) return '💎 Diamond Scholar';
  if (level >= 10) return '🥇 Gold Scholar';
  if (level >= 7) return '🥈 Silver Scholar';
  if (level >= 5) return '🥉 Bronze Scholar';
  if (level >= 3) return '⭐ Rising Star';
  return '🌱 Seedling';
};

interface XPContextType {
  xp: number;
  level: number;
  streakDays: number;
  streakFreezes: number;
  earnedAchievements: string[];
  addXP: (amount: number, reason: string) => void;
  unlockAchievement: (key: string) => void;
  hasAchievement: (key: string) => boolean;
  refreshXP: () => void;
  useStreakFreeze: () => Promise<boolean>;
  earnStreakFreeze: () => Promise<void>;
}

const XPContext = createContext<XPContextType | null>(null);

export const XPProvider = ({ children }: { children: ReactNode }) => {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streakDays, setStreakDays] = useState(0);
  const [streakFreezes, setStreakFreezes] = useState(0);
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([]);

  const user = getUser();

  const loadXP = async () => {
    if (!user) return;
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data: xpData } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', session.session.user.id)
        .single();

      if (xpData) {
        setXp(xpData.total_xp);
        setLevel(getLevel(xpData.total_xp));
        setStreakDays(xpData.streak_days || 0);
        setStreakFreezes(xpData.streak_freezes || 0);

        // Update streak with freeze protection
        const today = new Date().toISOString().split('T')[0];
        const lastActive = xpData.last_active_date;
        if (lastActive !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          let newStreak: number;
          if (lastActive === yesterdayStr) {
            // Consecutive day → increment streak
            newStreak = (xpData.streak_days || 0) + 1;
          } else if (xpData.streak_freezes > 0 && xpData.freeze_used_date !== today) {
            // Missed a day but has freeze → protect streak
            newStreak = xpData.streak_days || 0;
            await supabase.from('user_xp').update({
              streak_freezes: xpData.streak_freezes - 1,
              freeze_used_date: today,
            }).eq('user_id', session.session.user.id);
            setStreakFreezes(xpData.streak_freezes - 1);
            toast('🧊 Streak Freeze used! Your streak is protected.', {
              duration: 3000,
              style: { background: 'hsl(200 90% 25%)', color: 'white', border: '1px solid hsl(200 90% 50%)' }
            });
          } else {
            // Streak broken
            newStreak = 1;
            if (xpData.streak_days > 2) {
              toast(`😢 ${xpData.streak_days}-day streak lost! Earn a Streak Freeze to protect future streaks.`, {
                duration: 5000,
                style: { background: 'hsl(0 70% 22%)', color: 'white', border: '1px solid hsl(0 70% 44%)' }
              });
            }
          }

          await supabase.from('user_xp').update({
            last_active_date: today,
            streak_days: newStreak,
            updated_at: new Date().toISOString()
          }).eq('user_id', session.session.user.id);
          setStreakDays(newStreak);

          // Auto-earn streak freeze every 7 days
          if (newStreak > 0 && newStreak % 7 === 0) {
            const newFreezes = (xpData.streak_freezes || 0) + 1;
            await supabase.from('user_xp').update({ streak_freezes: newFreezes }).eq('user_id', session.session.user.id);
            setStreakFreezes(newFreezes);
            toast(`🧊 Streak Freeze earned! You now have ${newFreezes} freeze(s).`, {
              duration: 4000,
              style: { background: 'hsl(200 90% 22%)', color: 'white', border: '1px solid hsl(200 90% 50%)' }
            });
          }
        }
      } else {
        // Create XP record
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('user_xp').insert({
          user_id: session.session.user.id,
          total_xp: 0, level: 1, streak_days: 1, last_active_date: today
        });
      }

      // Load achievements
      const { data: achData } = await supabase
        .from('achievements')
        .select('achievement_key')
        .eq('user_id', session.session.user.id);
      if (achData) setEarnedAchievements(achData.map(a => a.achievement_key));
    } catch (e) {
      console.error('XP load error:', e);
    }
  };

  useEffect(() => { loadXP(); }, [user?.phone]);

  const addXP = async (amount: number, reason: string) => {
    if (!user) return;
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const newXP = xp + amount;
      const newLevel = getLevel(newXP);
      const oldLevel = getLevel(xp);

      await supabase.from('user_xp').upsert({
        user_id: session.session.user.id,
        total_xp: newXP,
        level: newLevel,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      setXp(newXP);
      setLevel(newLevel);

      toast.success(`+${amount} XP — ${reason}`, {
        icon: '⚡',
        duration: 2000,
        style: { background: 'hsl(258 90% 20%)', color: 'white', border: '1px solid hsl(258 90% 50%)' }
      });

      if (newLevel > oldLevel) {
        toast(`🎉 Level Up! You're now Level ${newLevel} — ${getLevelTitle(newLevel)}`, {
          duration: 4000,
          style: { background: 'hsl(43 100% 20%)', color: 'white', border: '1px solid hsl(43 100% 52%)' }
        });
        if (newLevel === 5) unlockAchievement('level_5');
        if (newLevel === 10) unlockAchievement('level_10');
      }
    } catch (e) {
      console.error('XP add error:', e);
    }
  };

  const unlockAchievement = async (key: string) => {
    if (earnedAchievements.includes(key)) return;
    const achievement = ACHIEVEMENTS.find(a => a.key === key);
    if (!achievement) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      await supabase.from('achievements').insert({
        user_id: session.session.user.id,
        achievement_key: key
      });

      setEarnedAchievements(prev => [...prev, key]);
      toast(`${achievement.emoji} Achievement Unlocked: ${achievement.title}! +${achievement.xpReward} XP`, {
        duration: 4000,
        style: { background: 'hsl(172 80% 15%)', color: 'white', border: '1px solid hsl(172 80% 44%)' }
      });
      addXP(achievement.xpReward, `Achievement: ${achievement.title}`);
    } catch (e) {
      console.error('Achievement error:', e);
    }
  };

  const useStreakFreeze = async (): Promise<boolean> => {
    if (streakFreezes <= 0) {
      toast.error('No streak freezes! Earn one by maintaining a 7-day streak.');
      return false;
    }
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return false;
    const newFreezes = streakFreezes - 1;
    await supabase.from('user_xp').update({
      streak_freezes: newFreezes,
      freeze_used_date: new Date().toISOString().split('T')[0],
    }).eq('user_id', session.session.user.id);
    setStreakFreezes(newFreezes);
    toast('🧊 Streak Freeze activated! Your streak is safe for today.', {
      duration: 3000,
      style: { background: 'hsl(200 90% 22%)', color: 'white', border: '1px solid hsl(200 90% 50%)' }
    });
    return true;
  };

  const earnStreakFreeze = async (): Promise<void> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;
    const newFreezes = streakFreezes + 1;
    await supabase.from('user_xp').update({ streak_freezes: newFreezes }).eq('user_id', session.session.user.id);
    setStreakFreezes(newFreezes);
    toast(`🧊 Streak Freeze earned! You now have ${newFreezes} freeze(s).`, {
      duration: 3000,
      style: { background: 'hsl(200 90% 22%)', color: 'white', border: '1px solid hsl(200 90% 50%)' }
    });
  };

  const hasAchievement = (key: string) => earnedAchievements.includes(key);

  return (
    <XPContext.Provider value={{ xp, level, streakDays, streakFreezes, earnedAchievements, addXP, unlockAchievement, hasAchievement, refreshXP: loadXP, useStreakFreeze, earnStreakFreeze }}>
      {children}
    </XPContext.Provider>
  );
};

export const useXP = () => {
  const ctx = useContext(XPContext);
  if (!ctx) throw new Error('useXP must be used within XPProvider');
  return ctx;
};
