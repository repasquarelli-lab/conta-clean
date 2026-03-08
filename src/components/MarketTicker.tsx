import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, Bitcoin, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface MarketItem {
  name: string;
  value: string;
  change: number;
  icon?: React.ReactNode;
  extra?: { high?: string; low?: string; open?: string };
}

const REFRESH_INTERVAL = 60_000;

export default function MarketTicker() {
  const [data, setData] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [expanded, setExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [currRes, cryptoRes, ibovRes, nasdaqRes] = await Promise.all([
        fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL'),
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl&include_24hr_change=true'),
        fetch('https://economia.awesomeapi.com.br/json/last/IBOV').catch(() => null),
        fetch('https://economia.awesomeapi.com.br/json/last/NASD').catch(() => null),
      ]);

      const curr = await currRes.json();
      const crypto = await cryptoRes.json();
      let ibov: any = null;
      let nasdaq: any = null;
      try { if (ibovRes) ibov = await ibovRes.json(); } catch {}
      try { if (nasdaqRes) nasdaq = await nasdaqRes.json(); } catch {}

      const items: MarketItem[] = [];

      if (curr.USDBRL) {
        const c = curr.USDBRL;
        items.push({
          name: 'Dólar',
          value: `R$ ${Number(c.bid).toFixed(2)}`,
          change: Number(c.pctChange),
          icon: <DollarSign className="w-4 h-4" />,
          extra: { high: `R$ ${Number(c.high).toFixed(2)}`, low: `R$ ${Number(c.low).toFixed(2)}` },
        });
      }
      if (curr.EURBRL) {
        const c = curr.EURBRL;
        items.push({
          name: 'Euro',
          value: `R$ ${Number(c.bid).toFixed(2)}`,
          change: Number(c.pctChange),
          icon: <span className="text-sm font-bold">€</span>,
          extra: { high: `R$ ${Number(c.high).toFixed(2)}`, low: `R$ ${Number(c.low).toFixed(2)}` },
        });
      }
      if (curr.GBPBRL) {
        const c = curr.GBPBRL;
        items.push({
          name: 'Libra',
          value: `R$ ${Number(c.bid).toFixed(2)}`,
          change: Number(c.pctChange),
          icon: <span className="text-sm font-bold">£</span>,
          extra: { high: `R$ ${Number(c.high).toFixed(2)}`, low: `R$ ${Number(c.low).toFixed(2)}` },
        });
      }

      // Indices
      const ibovKey = ibov ? Object.keys(ibov)[0] : null;
      if (ibovKey && ibov[ibovKey]) {
        const d = ibov[ibovKey];
        items.push({
          name: 'IBOVESPA',
          value: Number(d.bid).toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
          change: Number(d.pctChange || 0),
          icon: <BarChart3 className="w-4 h-4" />,
          extra: { high: Number(d.high).toLocaleString('pt-BR', { maximumFractionDigits: 0 }), low: Number(d.low).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) },
        });
      }
      const nasdKey = nasdaq ? Object.keys(nasdaq)[0] : null;
      if (nasdKey && nasdaq[nasdKey]) {
        const d = nasdaq[nasdKey];
        items.push({
          name: 'NASDAQ',
          value: Number(d.bid).toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
          change: Number(d.pctChange || 0),
          icon: <BarChart3 className="w-4 h-4" />,
          extra: { high: Number(d.high).toLocaleString('pt-BR', { maximumFractionDigits: 0 }), low: Number(d.low).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) },
        });
      }

      // Crypto
      if (crypto.bitcoin) {
        items.push({
          name: 'Bitcoin',
          value: `R$ ${Number(crypto.bitcoin.brl).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
          change: Number((crypto.bitcoin.brl_24h_change ?? 0).toFixed(2)),
          icon: <Bitcoin className="w-4 h-4" />,
        });
      }
      if (crypto.ethereum) {
        items.push({
          name: 'Ethereum',
          value: `R$ ${Number(crypto.ethereum.brl).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
          change: Number((crypto.ethereum.brl_24h_change ?? 0).toFixed(2)),
          icon: <span className="text-sm font-bold">Ξ</span>,
        });
      }

      setData(items);
      setLastUpdate(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Market fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  return (
    <div
      className="glass-panel p-3 cursor-pointer transition-all hover:border-primary/20"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Compact header - always visible */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold text-sm">Mercado</span>
        </div>

        {/* Compact ticker strip */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide flex-1 mx-3">
          {loading && data.length === 0
            ? <div className="h-4 w-40 bg-accent rounded animate-pulse" />
            : data.slice(0, expanded ? 0 : 7).map((item) => {
                const positive = item.change >= 0;
                return (
                  <div key={item.name} className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-muted-foreground font-medium">{item.name}</span>
                    <span className="text-xs font-bold">{item.value}</span>
                    <span className={`text-[10px] font-semibold ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {positive ? '+' : ''}{item.change}%
                    </span>
                  </div>
                );
              })}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {lastUpdate && <span className="text-[10px] text-muted-foreground hidden sm:inline">{lastUpdate}</span>}
          <button
            onClick={(e) => { e.stopPropagation(); fetchData(); }}
            disabled={loading}
            className="p-1 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
            title="Atualizar"
          >
            <RefreshCw className={`w-3 h-3 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded grid */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-border">
              {data.map((item) => {
                const positive = item.change >= 0;
                return (
                  <div
                    key={item.name}
                    className="p-3 rounded-2xl bg-accent border border-border flex flex-col gap-1 transition-all hover:border-primary/30"
                  >
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      {item.icon}
                      <span className="text-xs font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold">{item.value}</span>
                    <div className={`flex items-center gap-0.5 text-[11px] font-semibold ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {positive ? '+' : ''}{item.change}%
                    </div>
                    {item.extra && (
                      <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                        {item.extra.high && <span>Máx: <span className="font-semibold text-foreground">{item.extra.high}</span></span>}
                        {item.extra.low && <span>Mín: <span className="font-semibold text-foreground">{item.extra.low}</span></span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Atualizado às {lastUpdate} · Dados com atraso de mercado
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
