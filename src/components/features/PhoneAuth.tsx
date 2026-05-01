import { useState } from 'react';
import { Send, Shield, Sparkles, Mail } from 'lucide-react';
import TeacherLogo from '@/components/layout/TeacherLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { saveUser } from '@/lib/auth';
import { toast } from 'sonner';

interface PhoneAuthProps {
  onVerified: (phone: string) => void;
}

const PhoneAuth = ({ onVerified }: PhoneAuthProps) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setOtpSent(true);
      toast.success(`OTP sent to ${email}! Check your inbox 📬`, { duration: 6000 });
    } catch (e: any) {
      toast.error(e.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 4) {
      toast.error('Enter the full OTP from your email');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      if (error) throw error;

      const user = data.user;
      const username = email.split('@')[0];

      // Save user session locally
      saveUser({
        name: user?.user_metadata?.username || username,
        email,
        class: user?.user_metadata?.class || '10',
        phone: email, // use email as identifier
      });

      toast.success('Welcome to MacroMind! 🧠🎉');
      onVerified(email);
    } catch (e: any) {
      toast.error(e.message || 'Invalid OTP — check your email again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm px-4 slide-up">
      {/* Logo + Brand */}
      <div className="text-center mb-8">
        <div className="inline-block mb-5 float">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-violet-600/40 pulse-glow">
            <TeacherLogo className="w-14 h-14" />
          </div>
        </div>
        <h1 className="text-4xl font-black gradient-text tracking-tight mb-2">MacroMind</h1>
        <p className="text-muted-foreground font-medium text-sm">Where Brains Get Bigger 🧠</p>
      </div>

      {/* Auth Card */}
      <div className="section-card-glow p-6">
        {!otpSent ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-black mb-1 text-foreground">Enter Your Email</h2>
              <p className="text-xs text-muted-foreground mb-4">We'll send a real OTP to your inbox</p>
              <div className="flex gap-2 items-center">
                <div className="w-10 h-11 flex items-center justify-center bg-muted/50 border border-border/60 rounded-xl shrink-0">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  className="flex-1 h-11 bg-muted/40 border-border/60 rounded-xl text-base font-medium"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  autoComplete="email"
                />
              </div>
            </div>

            <Button
              onClick={handleSendOTP}
              disabled={!email || loading}
              className="w-full h-12 text-base font-bold btn-primary gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Sending OTP...' : 'Send OTP to Email'}
            </Button>

            <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
              We send a real one-time password to your email — no password needed!
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-black">Check Your Email</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-5">
                OTP sent to <span className="text-primary font-bold">{email}</span><br />
                Check inbox (and spam folder) 📬
              </p>

              {/* OTP boxes */}
              <div className="flex gap-1.5 justify-center mb-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}
                    className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-black transition-all ${
                      otp[i]
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 bg-muted/40 text-muted-foreground'
                    }`}>
                    {otp[i] || '·'}
                  </div>
                ))}
              </div>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Enter OTP from email"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && otp.length >= 4 && handleVerifyOTP()}
                className="h-11 bg-muted/40 border-border/60 rounded-xl text-center text-base font-mono tracking-[0.4em]"
                maxLength={6}
                autoFocus
              />
            </div>

            <Button
              onClick={handleVerifyOTP}
              disabled={otp.length < 4 || loading}
              className="w-full h-12 text-base font-bold btn-primary gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Verifying...' : 'Verify & Enter MacroMind!'}
            </Button>

            <button
              onClick={() => { setOtpSent(false); setOtp(''); }}
              className="text-xs text-primary/80 hover:text-primary w-full text-center font-medium transition-colors"
            >
              ← Change email
            </button>
          </div>
        )}
      </div>

      {/* Social proof */}
      <div className="flex items-center justify-center gap-6 mt-6">
        {[['🔥', '50K+', 'Students'], ['⭐', '4.9', 'Rating'], ['🧠', '1M+', 'Doubts Solved']].map(([emoji, val, label]) => (
          <div key={label} className="text-center">
            <p className="text-xs font-black text-foreground">{emoji} {val}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhoneAuth;
