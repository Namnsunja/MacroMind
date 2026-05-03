import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Trophy, Star, Code2, Brain, Rocket, Globe, Flame } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'Vision', value: 'Build & Dominate', icon: Rocket },
    { label: 'Known As', value: 'Naman', icon: Star },
    { label: 'Full Name', value: 'Lavish Suneja', icon: Trophy },
    { label: 'Status', value: 'Inevitable', icon: Flame },
  ];

  const traits = [
    { icon: Brain, text: 'Built MacroMind — an AI-powered education platform for every student' },
    { icon: Code2, text: 'Obsessed with turning bold ideas into real products' },
    { icon: Globe, text: 'Creating tools the world didn\'t know it needed yet' },
    { icon: Zap, text: 'The kind of name you don\'t forget once you\'ve seen the work' },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-secondary/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-accent/6 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-foreground">About</h1>
        </div>

        {/* Hero Card */}
        <div className="section-card-glow p-8 mb-6 text-center relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '32px 32px'
            }} />
          </div>

          {/* Avatar */}
          <div className="relative inline-block mb-6">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto shadow-2xl shadow-primary/30 pulse-glow">
              <span className="text-5xl font-black text-white select-none">N</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-lg">
              <Flame size={18} className="text-background streak-flame" />
            </div>
          </div>

          {/* Name & Title */}
          <h2 className="text-3xl font-black text-white mb-1 tracking-tight">
            Lavish Suneja
          </h2>
          <p className="text-lg font-semibold gradient-text mb-2">
            Call me Naman.
          </p>
          <p className="text-muted-foreground text-sm font-medium">
            Creator of MacroMind · Builder · Visionary
          </p>

          {/* Divider */}
          <div className="my-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Legendary Quote */}
          <blockquote className="relative">
            <div className="text-4xl text-primary/30 font-black absolute -top-2 -left-1 leading-none select-none">"</div>
            <p className="text-foreground text-base font-medium leading-relaxed px-6 italic">
              I'm going to become the one who didn't have to give an introduction — because you can't forget the name you come across every single day.
            </p>
            <div className="text-4xl text-primary/30 font-black absolute -bottom-4 -right-1 leading-none select-none rotate-180">"</div>
          </blockquote>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="feature-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className="text-sm font-bold text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* About the Person */}
        <div className="section-card p-6 mb-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
            The Story
          </h3>
          <div className="space-y-4">
            {traits.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-primary/10">
                  <Icon size={16} className="text-primary" />
                </div>
                <p className="text-foreground/85 text-sm leading-relaxed font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* MacroMind Section */}
        <div className="section-card-glow p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">MacroMind</h3>
              <p className="text-xs text-muted-foreground">Built by Naman</p>
            </div>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            MacroMind is an AI-powered learning companion designed for students from Grade 1 to Grade 12. 
            Doubts solved, quizzes generated, lectures built, battles fought — all powered by the best AI in the game. 
            Built to make learning feel less like a chore and more like leveling up.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['AI Tutoring', 'Gamified XP', 'Battle Mode', 'Live Quizzes', 'Smart Notes', 'Coding Challenges'].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/15">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Built with 🔥 by{' '}
            <span className="gradient-text font-bold">Lavish Suneja</span>
            {' '}· MacroMind © 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
