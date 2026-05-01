import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Gift, Loader2 } from 'lucide-react';
import { useXP } from '@/contexts/XPContext';
import { toast } from 'sonner';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdGateProps {
  onComplete: () => void;
  onClose?: () => void;
  reason?: string;
}

const AdGate = ({ onComplete, onClose, reason = 'Unlock premium content' }: AdGateProps) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [canClose, setCanClose] = useState(false);
  const [adError, setAdError] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addXP, unlockAchievement } = useXP();

  // Push AdSense ad
  useEffect(() => {
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      // Give the ad 2s to load
      const t = setTimeout(() => setAdLoaded(true), 2000);
      return () => clearTimeout(t);
    } catch (e) {
      console.log('AdSense push error:', e);
      setAdLoaded(true);
      setAdError(true);
    }
  }, []);

  // Start countdown once ad is shown
  useEffect(() => {
    if (!adLoaded) return;
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          setCanClose(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current!); };
  }, [adLoaded]);

  const handleClaim = () => {
    addXP(20, 'Watched an ad!');
    unlockAchievement('ad_watcher');
    toast.success('🎉 Unlocked! Enjoy your content!');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <Card className="w-full max-w-sm bg-card border border-border/60 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between"
          style={{ background: 'hsl(258 90% 68% / 0.06)' }}>
          <div>
            <p className="font-black text-sm text-foreground">Unlock Access</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{reason}</p>
          </div>
          {onClose && canClose && (
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-5">
          {/* AdSense Ad Unit */}
          <div className="w-full mb-4 rounded-2xl overflow-hidden min-h-[160px] bg-muted/20 border border-border/30 flex items-center justify-center relative">
            {!adLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Loading ad...</p>
              </div>
            )}

            {/* Real Google AdSense Ad */}
            <ins
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', minHeight: '160px' }}
              data-ad-client="ca-pub-2618407303259100"
              data-ad-slot="auto"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />

            {/* Fallback if ad doesn't load */}
            {adError && (
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-pink-600/20 flex flex-col items-center justify-center text-center p-4">
                <div className="text-4xl mb-2">📚</div>
                <p className="font-black text-sm text-foreground">MacroMind Premium</p>
                <p className="text-xs text-muted-foreground mt-1">AI-powered learning for every student</p>
                <p className="text-[10px] text-muted-foreground/60 mt-2">Advertisement</p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-muted/50 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-1000"
              style={{ width: adLoaded ? `${((8 - countdown) / 8) * 100}%` : '0%' }}
            />
          </div>

          {canClose ? (
            <Button onClick={handleClaim}
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-sm gap-2 border-none rounded-xl">
              <Gift className="w-4 h-4" />
              Claim +20 XP & Unlock!
            </Button>
          ) : (
            <Button disabled
              className="w-full h-12 btn-primary font-bold text-sm gap-2 opacity-70 cursor-not-allowed">
              <Loader2 className="w-4 h-4 animate-spin" />
              {adLoaded ? `Wait ${countdown}s to unlock...` : 'Loading ad...'}
            </Button>
          )}

          <p className="text-[10px] text-muted-foreground/60 text-center mt-3">
            Ads keep MacroMind free for all students 💜
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdGate;
