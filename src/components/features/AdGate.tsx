/**
 * AdGate — Rewarded Ad Gate (AdMob)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ADMOB INTEGRATION (Android Studio / Capacitor)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Replace the TEST_REWARDED_AD_UNIT_ID below with your real AdMob Rewarded
 * Ad Unit ID when you publish to Google Play.
 *
 * TEST ID  →  ca-app-pub-3940256099942544/5224354917  ← REMOVE & REPLACE
 * YOUR ID  →  ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX  ← PUT YOUR ID HERE
 *
 * In Android Studio (Capacitor / Cordova), call:
 *   AdMob.showRewardedVideo({ adId: REWARDED_AD_UNIT_ID })
 * Then listen for the `onRewardedVideoAdRewarded` event to call onComplete().
 *
 * This component currently simulates the rewarded ad experience on web
 * (5-second countdown) so the UX flow is correct before native wrapping.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── MARK: AdMob Ad Unit IDs ────────────────────────────────────────────────
// TODO: Replace test IDs with your real AdMob IDs before publishing
const ADMOB_APP_ID            = 'ca-app-pub-3940256099942544~3347511713'; // TEST APP ID — REPLACE
const REWARDED_AD_UNIT_ID     = 'ca-app-pub-3940256099942544/5224354917'; // TEST REWARDED — REPLACE
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Gift, Loader2, Play } from 'lucide-react';
import { useXP } from '@/contexts/XPContext';
import { toast } from 'sonner';

interface AdGateProps {
  onComplete: () => void;
  onClose?: () => void;
  reason?: string;
}

const AdGate = ({ onComplete, onClose, reason = 'Watch a short ad to unlock' }: AdGateProps) => {
  const [adState, setAdState] = useState<'idle' | 'loading' | 'playing' | 'done'>('idle');
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addXP, unlockAchievement } = useXP();

  // Simulate AdMob rewarded ad loading + playback on web
  // In Android Studio: replace this block with AdMob SDK call
  const handleWatchAd = () => {
    setAdState('loading');

    // Simulate ad network fetch (1.5s)
    // TODO (Android Studio): call AdMob.loadRewardedVideo({ adId: REWARDED_AD_UNIT_ID })
    setTimeout(() => {
      setAdState('playing');

      // Simulate 5-second rewarded ad
      // TODO (Android Studio): listen for onRewardedVideoAdRewarded event instead
      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timerRef.current!);
            setAdState('done');
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }, 1500);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleClaim = () => {
    addXP(20, 'Watched a rewarded ad!');
    unlockAchievement('ad_watcher');
    toast.success('🎉 Unlocked! +20 XP earned!');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <Card className="w-full max-w-sm bg-card border border-border/60 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between"
          style={{ background: 'hsl(258 90% 68% / 0.06)' }}>
          <div>
            <p className="font-black text-sm text-foreground">Watch Ad to Unlock</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{reason}</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Ad placeholder / state display */}
          <div className="w-full rounded-2xl overflow-hidden min-h-[160px] bg-muted/20 border border-border/30 flex items-center justify-center">
            {adState === 'idle' && (
              <div className="flex flex-col items-center gap-3 text-center p-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Play className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-black text-sm text-foreground">Rewarded Ad</p>
                  <p className="text-xs text-muted-foreground mt-0.5">~5 seconds · Earn +20 XP</p>
                </div>
                {/* NOTE: AdMob rewarded ad unit used here */}
                {/* Ad Unit ID: {REWARDED_AD_UNIT_ID} */}
              </div>
            )}

            {adState === 'loading' && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Loading ad...</p>
              </div>
            )}

            {adState === 'playing' && (
              <div className="flex flex-col items-center gap-3 text-center p-4">
                {/* Web simulation of rewarded ad */}
                {/* In Android Studio: AdMob full-screen rewarded video plays here */}
                <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                <p className="font-black text-2xl text-foreground">{countdown}s</p>
                <p className="text-xs text-muted-foreground">Ad playing... almost done!</p>
              </div>
            )}

            {adState === 'done' && (
              <div className="flex flex-col items-center gap-2 text-center p-4">
                <div className="text-5xl">🎉</div>
                <p className="font-black text-sm text-foreground">Ad complete!</p>
                <p className="text-xs text-muted-foreground">+20 XP ready to claim</p>
              </div>
            )}
          </div>

          {/* Progress bar (only during playback) */}
          {adState === 'playing' && (
            <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-1000"
                style={{ width: `${((5 - countdown) / 5) * 100}%` }}
              />
            </div>
          )}

          {/* Action button */}
          {adState === 'idle' && (
            <Button onClick={handleWatchAd}
              className="w-full h-12 btn-primary font-bold text-sm gap-2">
              <Play className="w-4 h-4" />
              Watch Ad (+20 XP)
            </Button>
          )}

          {(adState === 'loading' || adState === 'playing') && (
            <Button disabled
              className="w-full h-12 btn-primary font-bold text-sm gap-2 opacity-60 cursor-not-allowed">
              <Loader2 className="w-4 h-4 animate-spin" />
              {adState === 'loading' ? 'Loading ad...' : `Please wait ${countdown}s...`}
            </Button>
          )}

          {adState === 'done' && (
            <Button onClick={handleClaim}
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-sm gap-2 border-none rounded-xl">
              <Gift className="w-4 h-4" />
              Claim +20 XP & Unlock!
            </Button>
          )}

          {/* Skip option (only if onClose provided and ad not started) */}
          {onClose && adState === 'idle' && (
            <button onClick={onClose}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1">
              Skip for now
            </button>
          )}

          <p className="text-[10px] text-muted-foreground/60 text-center">
            Ads keep MacroMind free for all students 💜
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdGate;
