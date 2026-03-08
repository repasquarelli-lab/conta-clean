const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch indices from Yahoo Finance via a public proxy
    const symbols = ['^BVSP', '^IXIC'];
    const results: Record<string, any> = {};

    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
          );
          if (!res.ok) return;
          const json = await res.json();
          const meta = json?.chart?.result?.[0]?.meta;
          if (meta) {
            results[symbol] = {
              price: meta.regularMarketPrice,
              previousClose: meta.chartPreviousClose || meta.previousClose,
              high: meta.regularMarketDayHigh,
              low: meta.regularMarketDayLow,
              change: meta.regularMarketPrice && meta.chartPreviousClose
                ? ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100)
                : 0,
            };
          }
        } catch {}
      })
    );

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
