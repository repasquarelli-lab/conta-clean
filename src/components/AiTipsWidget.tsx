import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, TrendingUp, Target, MessageCircle, RefreshCw, AlertCircle, Bot, User, X } from 'lucide-react';
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="glass-panel mt-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Copilot Financeiro</h3>
            <p className="text-muted-foreground text-xs">IA personalizada</p>
          </div>
        </div>
        {activeTab !== 'chat' && (
          <button onClick={refreshCurrent} disabled={loading || streaming}
            className="p-1.5 rounded-lg hover:bg-accent transition text-muted-foreground">
            <RefreshCw className={`w-4 h-4 ${loading || streaming ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pb-3">
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
            className="mx-4 mb-3 flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="flex flex-col">
          <div className="h-64 overflow-y-auto px-4 space-y-3 scrollbar-thin">
            {messages.length === 0 && !streaming && (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                <Bot className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">Olá! Sou seu Copilot 🤖</p>
                <p className="text-xs mt-1">Pergunte qualquer coisa sobre suas finanças</p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {['Como estão minhas finanças?', 'Onde posso economizar?', 'Posso gastar mais esse mês?'].map(q => (
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
          <div className="p-3 border-t border-border flex gap-2">
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
        <div className="px-4 pb-4">
          {loading && !scoreData && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-20 h-20 rounded-full border-4 border-muted animate-pulse mb-4" />
              <div className="h-3 bg-muted rounded w-24 animate-pulse" />
            </div>
          )}
          {scoreData && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              {/* Gauge */}
              <div className="flex flex-col items-center py-4">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                    <circle cx="60" cy="60" r="52" fill="none"
                      className={`stroke-current ${scoreColor(scoreData.score)}`}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${(scoreData.score / 100) * 327} 327`}
                      style={{ transition: 'stroke-dasharray 1s ease-out' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${scoreColor(scoreData.score)}`}>{scoreData.score}</span>
                    <span className="text-xs text-muted-foreground">{scoreData.label}</span>
                  </div>
                </div>
              </div>
              {/* Details */}
              <div className="space-y-2 mt-2">
                {scoreData.details?.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm">{d.emoji}</span>
                    <span className="text-xs flex-1">{d.name}</span>
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(d.value, 100)}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className={`h-full rounded-full bg-gradient-to-r ${scoreGradient(d.value)}`} />
                    </div>
                    <span className={`text-xs font-semibold w-8 text-right ${scoreColor(d.value)}`}>{d.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="h-64 overflow-y-auto px-4 pb-4 space-y-3 scrollbar-thin">
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
        <div className="px-4 pb-4">
          {loading && tips.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-4 rounded-2xl bg-accent border border-border animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-5/6 mt-1" />
                </div>
              ))}
            </div>
          )}
          {tips.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tips.map((tip, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-2xl bg-accent border border-border hover:border-primary/30 transition">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{tip.emoji}</span>
                    <span className="font-semibold text-sm">{tip.title}</span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{tip.tip}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
