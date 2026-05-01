import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Camera, Loader2, Sparkles, ArrowLeft, Zap, Bot,
  Volume2, VolumeX, Pause, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useXP } from '@/contexts/XPContext';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import AdGate from '@/components/features/AdGate';
import { useRef, useEffect } from 'react';
import { preprocessMath } from '@/lib/mathPreprocess';
import { useTTS } from '@/hooks/useTTS';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  model?: string;
}

const DoubtsChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `### 👋 Prof MacroMind Reporting for Duty!

I'm your AI teacher — think Einstein, but with better jokes and no E=mc² typos.

**What I can do:**
- 🎯 Answer any doubt — **on point, no fluff**
- 📐 Solve math with **proper notation** (never "theta//")  
- 😂 Make you laugh while you learn  
- 📸 Analyze photos of your textbook questions
- 🔊 Click the speaker button to hear me read answers aloud!

*Drop your doubt below — text or photo. Let's go!* 🚀`,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<{ text: string; img: string | null } | null>(null);
  const [msgCount, setMsgCount] = useState(0);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { addXP, unlockAchievement } = useXP();
  const { speak, stop, pause, resume, speaking, paused } = useTTS();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const sendMessage = async (text: string, img: string | null) => {
    const userMessage: Message = {
      role: 'user',
      content: text || '🖼️ Analyze this image please',
      imageUrl: img || undefined,
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-teacher', {
        body: { messages: [...messages, userMessage], imageBase64: img }
      });

      if (error) throw error;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        model: data.modelUsed,
      }]);

      const newCount = msgCount + 1;
      setMsgCount(newCount);
      addXP(25, 'Got a doubt answered!');
      if (newCount === 1) unlockAchievement('first_doubt');
      if (newCount === 10) unlockAchievement('ten_doubts');
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "My brain.exe crashed! 💥 Try again — even I need a reboot sometimes! 🔄",
      }]);
      toast.error('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() && !imagePreview) return;
    const text = input;
    const img = imagePreview;
    setInput('');
    setImagePreview(null);

    if (msgCount > 0 && msgCount % 5 === 0) {
      setPendingMessage({ text, img });
      setShowAd(true);
      return;
    }
    sendMessage(text, img);
  };

  const handleTTS = (content: string, idx: number) => {
    if (speakingIdx === idx && speaking) {
      stop();
      setSpeakingIdx(null);
    } else {
      stop();
      setSpeakingIdx(idx);
      speak(content);
    }
  };

  const handlePauseResume = () => {
    if (paused) resume();
    else pause();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showAd && (
        <AdGate
          reason="Watch a short ad to keep chatting with Prof MacroMind!"
          onComplete={() => {
            setShowAd(false);
            if (pendingMessage) { sendMessage(pendingMessage.text, pendingMessage.img); setPendingMessage(null); }
          }}
          onClose={() => { setShowAd(false); setPendingMessage(null); }}
        />
      )}

      {/* Header */}
      <div className="glass-strong border-b border-border/20 sticky top-0 z-40">
        <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-xl w-9 h-9 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-pink-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-violet-600/30">
            <span className="text-lg">🎓</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm leading-none">Prof MacroMind</p>
            <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">● Online — Ready to enlighten you</p>
          </div>

          {/* TTS global controls */}
          {speaking && (
            <button onClick={handlePauseResume}
              className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-xl px-2.5 py-1.5">
              {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              {paused ? 'Resume' : 'Pause'}
            </button>
          )}
          <div className="flex items-center gap-1 text-[11px] font-black text-yellow-500 bg-yellow-500/10 rounded-lg px-2 py-1 shrink-0">
            <Zap className="w-3 h-3" /> +25 XP
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-5 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} slide-up`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-pink-600 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-md shadow-violet-600/20">
                  <span className="text-sm">🎓</span>
                </div>
              )}

              <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-br-sm shadow-lg shadow-violet-600/20'
                    : 'section-card rounded-bl-sm'
                }`}>
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Uploaded" className="rounded-xl mb-2 max-h-52 object-contain border border-border/40" />
                  )}
                  <div className={`textbook-prose ${msg.role === 'user' ? 'text-white/95' : ''}`}>
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {preprocessMath(msg.content)}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* TTS + Model row for AI messages */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 px-1">
                    <button
                      onClick={() => handleTTS(msg.content, i)}
                      className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${
                        speakingIdx === i && speaking
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Listen to this message">
                      {speakingIdx === i && speaking
                        ? <VolumeX className="w-3.5 h-3.5" />
                        : <Volume2 className="w-3.5 h-3.5" />}
                      {speakingIdx === i && speaking ? 'Stop' : 'Listen'}
                    </button>
                    {msg.model && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Bot className="w-2.5 h-2.5" />
                        {msg.model.split('/').pop()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-pink-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-violet-600/20">
                <span className="text-sm">🎓</span>
              </div>
              <div className="section-card rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  Consulting my vast brain... 🧠
                  <span className="flex gap-0.5">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="glass-strong border-t border-border/20 p-3 sticky bottom-0">
        <div className="container mx-auto max-w-4xl">
          {imagePreview && (
            <div className="mb-2 relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-14 rounded-xl border-2 border-primary/60 object-cover" />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-black shadow-md"
              >×</button>
            </div>
          )}
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="icon"
              className="rounded-xl w-11 h-11 shrink-0 border-border/50 bg-muted/40 hover:bg-muted"
              disabled={loading}
            >
              <Camera className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
              placeholder="Ask any doubt... or snap a photo 📸"
              className="flex-1 h-11 bg-muted/40 border-border/50 rounded-xl text-sm"
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={loading || (!input.trim() && !imagePreview)}
              className="rounded-xl w-11 h-11 shrink-0 btn-primary"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoubtsChat;
