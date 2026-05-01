import { useNavigate } from 'react-router-dom';
import { LogOut, User, Flame, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TeacherLogo from '@/components/layout/TeacherLogo';
import { useXP } from '@/contexts/XPContext';

interface HeaderProps {
  user: { name?: string; phone: string; class?: string };
  onLogout: () => void;
}

const Header = ({ user, onLogout }: HeaderProps) => {
  const navigate = useNavigate();
  const { xp, level, streakDays } = useXP();

  return (
    <header className="glass-strong sticky top-0 z-50">
      <div className="container mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
        {/* Brand */}
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-pink-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-600/30">
            <TeacherLogo className="w-5 h-5" />
          </div>
          <span className="font-black text-base gradient-text hidden sm:block">MacroMind</span>
        </button>

        <div className="flex-1" />

        {/* Stats pills */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-xl px-2.5 py-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400 streak-flame" />
            <span className="text-xs font-black text-orange-400">{streakDays}d</span>
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-2.5 py-1.5">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-black text-yellow-400">{xp.toLocaleString()} XP</span>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-xl px-2.5 py-1.5">
            <span className="text-xs font-black text-primary">Lv.{level}</span>
          </div>
        </div>

        {/* Profile / Logout */}
        <button
          onClick={() => navigate('/profile')}
          className="w-8 h-8 bg-gradient-to-br from-violet-600 to-pink-600 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-md shadow-violet-600/20"
        >
          {user.name ? user.name[0].toUpperCase() : <User className="w-4 h-4" />}
        </button>

        <Button
          onClick={onLogout}
          variant="ghost"
          size="icon"
          className="rounded-xl w-8 h-8 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
