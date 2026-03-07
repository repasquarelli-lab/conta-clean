import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, Bitcoin } from 'lucide-react';

interface MarketItem {
  name: string;
  value: string;
  change: number;
  icon?: React.ReactNode;
}

const REFRESH_INTERVAL = 60_000; // 1 min

export default function MarketTicker() {
  const [data, setData] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [currRes, cryptoRes] = await Promise.all([
        fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL'),
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl&include_24hr_change=true'),
      ]);

      const curr = await currRes.json();
      const crypto = await cryptoRes.json();

      const items: MarketItem[] = [];

      // Currencies
      if (curr.USDBRL) {
        items.push({
          name: 'Dólar',
          value: `R$ ${Number(curr.USDBRL.bid).toFixed(2)}`,
          change: Number(curr.USDBRL.pctChange),
          icon: <DollarSign className="w-4 h-4" />,
        });
      }
      if (curr.EURBRL) {
        items.push({
          name: 'Euro',
          value: `R$ ${Number(curr.EURBRL.bid).toFixed(2)}`,
          change: Number(curr.EURBRL.pctChange),
          icon: <span className="text-sm font-bold">€</span>,
        });
      }
      if (curr.GBPBRL) {
        items.push({
          name: 'Libra',
          value: `R$ ${Number(curr.GBPBRL.bid).toFixed(2)}`,
          change: Number(curr.GBPBRL.pctChange),
          icon: <span className="text-sm font-bold">£</span>,
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
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Mercado ao vivo
          </h3>
          <p className="text-muted-foreground text-xs">Câmbio e cripto em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && <span className="text-[10px] text-muted-foreground">{lastUpdate}</span>}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
            title="Atualizar"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {loading && data.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 rounded-2xl bg-accent border border-border animate-pulse h-[72px]" />
            ))
          : data.map((item) => {
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
                  <div className={`flex items-center gap-0.5 text-[11px] font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {positive ? '+' : ''}{item.change}%
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
