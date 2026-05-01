import { useState, useEffect, useRef, useCallback } from 'react';

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported('speechSynthesis' in window);
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // Strip markdown / LaTeX for clean TTS
  const cleanText = (text: string) =>
    text
      .replace(/\$\$[\s\S]*?\$\$/g, ' [math expression] ')
      .replace(/\$[^$]*?\$/g, ' [math] ')
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[>\-_~|]/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim();

  const speak = useCallback((text: string) => {
    if (!supported) return;
    window.speechSynthesis.cancel();

    const clean = cleanText(text);
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 0.92;
    utter.pitch = 1.05;
    utter.volume = 1;

    // Prefer a natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Enhanced'))
    ) || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utter.voice = preferred;

    utter.onstart = () => { setSpeaking(true); setPaused(false); };
    utter.onend = () => { setSpeaking(false); setPaused(false); };
    utter.onerror = () => { setSpeaking(false); setPaused(false); };

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [supported]);

  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setPaused(false);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, []);

  return { speak, pause, resume, stop, speaking, paused, supported };
}
