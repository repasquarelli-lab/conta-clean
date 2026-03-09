import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, TrendingUp, Target, MessageCircle, RefreshCw, AlertCircle, Bot, User, X, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useCopilotData } from '@/hooks/useCopilotData';

type Tab = 'chat' | 'score' | 'trends' | 'tips';
type Msg = { role: 'user' | 'assistant'; content: string };

interface ScoreDetail { name: string; value: number; emoji: string }
interface ScoreData { score: number; label: string; details: ScoreDetail[] }
interface AiTip { emoji: string; title: string; tip: string }

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-copilot-chat`;

export default function AiTipsWidget() {
  const { buildFinancialData } = useCopilotData();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [tips, setTips] = useState<AiTip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const streamChat = useCallback(async (msgs: Msg[], type: Tab) => {
    setStreaming(true);
    setError(null);
    abortRef.current = new AbortController();

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: msgs,
          financialData: buildFinancialData(),
          type,
        }),
        signal: abortRef.current.signal,
      });

      if (resp.status === 429) { setError('Muitas requisições. Aguarde alguns segundos.'); return; }
      if (resp.status === 402) { setError('Créditos de IA insuficientes.'); return; }
      if (!resp.ok || !resp.body) throw new Error('Falha ao conectar com o Copilot');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantSoFar = '';

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '' || !line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch { buffer = line + '\n' + buffer; break; }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setError(e.message || 'Erro ao conectar com o Copilot');
      }
    } finally {
      setStreaming(false);
    }
  }, [buildFinancialData]);

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    const userMsg: Msg = { role: 'user', content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    await streamChat(newMsgs, 'chat');
  };

  const loadScore = async () => {
    if (scoreData || loading) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ financialData: buildFinancialData(), type: 'score', messages: [] }),
      });
      if (!resp.ok) throw new Error('Erro ao calcular score');
      const data = await resp.json();
      setScoreData(data.result);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const loadTips = async () => {
    if (tips.length > 0 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ financialData: buildFinancialData(), type: 'tips', messages: [] }),
      });
      if (!resp.ok) throw new Error('Erro ao gerar dicas');
      const data = await resp.json();
      setTips(data.result || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const loadTrends = async () => {
    if (messages.length > 0 && activeTab === 'trends') return;
    setMessages([]);
    await streamChat([], 'trends');
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'score') loadScore();
    if (tab === 'tips') loadTips();
    if (tab === 'trends') loadTrends();
  };

  const refreshCurrent = () => {
    setError(null);
    if (activeTab === 'score') { setScoreData(null); loadScore(); }
    if (activeTab === 'tips') { setTips([]); loadTips(); }
    if (activeTab === 'trends') { setMessages([]); loadTrends(); }
  };

  const tabs: { id: Tab; icon: typeof MessageCircle; label: string }[] = [
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'score', icon: Target, label: 'Score' },
    { id: 'trends', icon: TrendingUp, label: 'Tendências' },
    { id: 'tips', icon: Sparkles, label: 'Dicas' },
  ];

  const scoreColor = (s: number) => s >= 75 ? 'text-green-500' : s >= 50 ? 'text-yellow-500' : 'text-red-500';
  const scoreGradient = (s: number) => s >= 75 ? 'from-green-500 to-emerald-400' : s >= 50 ? 'from-yellow-500 to-amber-400' : 'from-red-500 to-orange-400';

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <Sparkles className="w-6 h-6" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping opacity-40" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-0 md:pointer-events-none"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Expandable Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 w-[calc(100vw-2rem)] lg:w-[calc(100vw-3rem)] max-w-md rounded-2xl border border-border bg-card shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 8rem)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-none">Copilot Financeiro</h3>
                  <p className="text-muted-foreground text-[11px] mt-0.5">IA personalizada</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {activeTab !== 'chat' && (
                  <button onClick={refreshCurrent} disabled={loading || streaming}
                    className="p-1.5 rounded-lg hover:bg-accent transition text-muted-foreground">
                    <RefreshCw className={`w-4 h-4 ${loading || streaming ? 'animate-spin' : ''}`} />
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-accent transition text-muted-foreground">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-3 py-2 border-b border-border/50 shrink-0">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}>
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mx-3 mt-2 flex items-center gap-2 p-2.5 rounded-xl bg-destructive/10 text-destructive text-xs shrink-0">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                  <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
                    {messages.length === 0 && !streaming && (
                      <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                        <Bot className="w-10 h-10 mb-3 opacity-40" />
                        <p className="text-sm font-medium">Olá! Sou seu Copilot 🤖</p>
                        <p className="text-xs mt-1">Pergunte qualquer coisa sobre suas finanças</p>
                        <div className="flex flex-wrap gap-2 mt-4 justify-center">
                          {['Como estão minhas finanças?', 'Onde posso economizar?', 'Posso gastar mais?'].map(q => (
                            <button key={q} onClick={() => { setInput(q); }}
                              className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent transition">
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {messages.map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'assistant' && (
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-3.5 h-3.5 text-primary" />
                          </div>
                        )}
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-accent border border-border rounded-bl-md'
                        }`}>
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : msg.content}
                          {streaming && msg.role === 'assistant' && i === messages.length - 1 && (
                            <span className="inline-block w-1.5 h-4 bg-primary/60 ml-0.5 animate-pulse rounded" />
                          )}
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 border-t border-border flex gap-2 shrink-0">
                    <input value={input} onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Pergunte sobre suas finanças..."
                      className="flex-1 bg-accent border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary transition placeholder:text-muted-foreground"
                      disabled={streaming} />
                    <button onClick={sendMessage} disabled={!input.trim() || streaming}
                      className="p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition hover:opacity-90">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Score Tab */}
              {activeTab === 'score' && (
                <div className="overflow-y-auto px-4 py-3 scrollbar-thin">
                  {loading && !scoreData && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-20 h-20 rounded-full border-4 border-muted animate-pulse mb-4" />
                      <div className="h-3 bg-muted rounded w-24 animate-pulse" />
                    </div>
                  )}
                  {scoreData && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <div className="flex flex-col items-center py-2">
                        <div className="relative w-24 h-24">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                            <circle cx="60" cy="60" r="52" fill="none"
                              className={`stroke-current ${scoreColor(scoreData.score)}`}
                              strokeWidth="8" strokeLinecap="round"
                              strokeDasharray={`${(scoreData.score / 100) * 327} 327`}
                              style={{ transition: 'stroke-dasharray 1s ease-out' }} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-2xl font-bold ${scoreColor(scoreData.score)}`}>{scoreData.score}</span>
                            <span className="text-[10px] text-muted-foreground">{scoreData.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 mt-3">
                        {scoreData.details?.map((d, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-sm">{d.emoji}</span>
                            <span className="text-xs flex-1">{d.name}</span>
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(d.value, 100)}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1 }}
                                className={`h-full rounded-full bg-gradient-to-r ${scoreGradient(d.value)}`} />
                            </div>
                            <span className={`text-xs font-semibold w-7 text-right ${scoreColor(d.value)}`}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Trends Tab */}
              {activeTab === 'trends' && (
                <div className="overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
                  {messages.length === 0 && streaming && (
                    <div className="space-y-2 py-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-3 bg-muted rounded animate-pulse" style={{ width: `${90 - i * 15}%` }} />
                      ))}
                    </div>
                  )}
                  {messages.filter(m => m.role === 'assistant').map((msg, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed [&>p]:my-1 [&>ul]:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {streaming && i === messages.filter(m => m.role === 'assistant').length - 1 && (
                        <span className="inline-block w-1.5 h-4 bg-primary/60 ml-0.5 animate-pulse rounded" />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Tips Tab */}
              {activeTab === 'tips' && (
                <div className="overflow-y-auto px-4 py-3 scrollbar-thin">
                  {loading && tips.length === 0 && (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="p-3 rounded-xl bg-accent border border-border animate-pulse">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                          <div className="h-3 bg-muted rounded w-full" />
                        </div>
                      ))}
                    </div>
                  )}
                  {tips.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
                      {tips.map((tip, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-3 rounded-xl bg-accent border border-border hover:border-primary/30 transition">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">{tip.emoji}</span>
                            <span className="font-semibold text-xs">{tip.title}</span>
                          </div>
                          <p className="text-muted-foreground text-xs leading-relaxed">{tip.tip}</p>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
