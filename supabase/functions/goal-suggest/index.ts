import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { goalName, targetValue, currentValue, deadline, monthlySurplus } = await req.json();
    const remaining = Math.max(0, Number(targetValue || 0) - Number(currentValue || 0));
    const monthsLeft = deadline
      ? Math.max(1, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
      : 12;
    const suggestedRaw = remaining / monthsLeft;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const sys = `Você é um copiloto financeiro brasileiro. Recebe dados de uma meta e responde em JSON com { "monthly": number, "message": string } onde monthly é o valor mensal sugerido em reais (arredondado a múltiplos de 10) e message é uma frase curta motivacional em PT-BR (máx 140 chars). Considere a sobra mensal informada — se a sugestão exceder a sobra, ajuste para o que cabe e avise no message.`;

    const user = `Meta: ${goalName}\nFalta: R$ ${remaining.toFixed(2)}\nMeses até o prazo: ${monthsLeft}\nValor matemático: R$ ${suggestedRaw.toFixed(2)}\nSobra mensal do usuário: R$ ${Number(monthlySurplus || 0).toFixed(2)}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        tools: [{
          type: "function",
          function: {
            name: "suggest",
            parameters: {
              type: "object",
              properties: { monthly: { type: "number" }, message: { type: "string" } },
              required: ["monthly", "message"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest" } },
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições. Tente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) throw new Error(`AI error ${r.status}`);

    const data = await r.json();
    const args = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || "{}");
    return new Response(JSON.stringify({
      monthly: args.monthly ?? Math.round(suggestedRaw / 10) * 10,
      message: args.message ?? `Reserve cerca de R$ ${suggestedRaw.toFixed(0)}/mês para alcançar a meta.`,
      remaining,
      monthsLeft,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("goal-suggest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
