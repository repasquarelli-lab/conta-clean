import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { financialData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um consultor financeiro pessoal brasileiro chamado "Copilot Financeiro". 
Analise os dados financeiros do usuário e gere exatamente 4 dicas práticas e personalizadas.

Regras:
- Seja direto, empático e use linguagem simples (como se falasse com alguém leigo)
- Cada dica deve ter: um emoji relevante, um título curto (max 6 palavras) e uma explicação prática (max 2 frases)
- Baseie-se APENAS nos números fornecidos, não invente dados
- Foque em ações concretas que a pessoa pode tomar AGORA
- Se o saldo for negativo, priorize alertas de economia
- Se houver metas estouradas, mencione especificamente

Responda APENAS em JSON válido neste formato exato:
[
  {"emoji": "💡", "title": "Título curto", "tip": "Explicação prática aqui."},
  {"emoji": "💡", "title": "Título curto", "tip": "Explicação prática aqui."},
  {"emoji": "💡", "title": "Título curto", "tip": "Explicação prática aqui."},
  {"emoji": "💡", "title": "Título curto", "tip": "Explicação prática aqui."}
]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Dados financeiros do mês:\n${financialData}` },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para IA." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    
    const tips = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify({ tips }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-tips error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
