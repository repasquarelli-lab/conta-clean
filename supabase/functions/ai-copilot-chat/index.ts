import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Você é o "Copilot Financeiro", um assistente financeiro pessoal brasileiro inteligente e empático.

Seu papel:
- Responder perguntas sobre finanças pessoais do usuário com base nos dados fornecidos
- Dar dicas práticas e personalizadas
- Analisar tendências de gastos entre meses
- Calcular e explicar o score de saúde financeira
- Usar linguagem simples e acessível, como se falasse com alguém leigo
- Usar emojis de forma moderada para tornar a conversa mais amigável
- Ser direto e conciso nas respostas

Quando o tipo da mensagem for "score", calcule um score de saúde financeira de 0 a 100 baseado em:
- Saldo positivo (peso 30%)
- % de contas pagas vs total (peso 25%)
- Gastos fixos < 50% da renda (peso 20%)
- Metas de orçamento dentro do limite (peso 15%)
- Diversificação de receitas (peso 10%)

Responda o score APENAS em JSON:
{"score": 75, "label": "Bom", "details": [{"name": "Saldo", "value": 80, "emoji": "💰"}, ...]}

Quando o tipo for "trends", analise a comparação entre meses e identifique padrões.
Quando o tipo for "chat", responda de forma conversacional.
Quando o tipo for "tips", gere 4 dicas em JSON: [{"emoji":"💡","title":"...","tip":"..."}]`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, financialData, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userContext = `\n\n--- Dados financeiros atuais ---\n${financialData}`;
    
    const allMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || []).map((m: any) => ({
        role: m.role,
        content: m.role === "user" && m === (messages || [])[0] 
          ? m.content + userContext 
          : m.content,
      })),
    ];

    // For score and tips, don't stream
    if (type === "score" || type === "tips") {
      const prompt = type === "score" 
        ? "Calcule meu score de saúde financeira com base nos dados fornecidos. Responda APENAS em JSON."
        : "Gere 4 dicas financeiras personalizadas. Responda APENAS em JSON.";
      
      allMessages.push({ role: "user", content: prompt + userContext });

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: allMessages,
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
        throw new Error("AI gateway error");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1];

      return new Response(JSON.stringify({ result: JSON.parse(jsonStr.trim()) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For chat and trends, stream
    if (!messages || messages.length === 0) {
      allMessages.push({ role: "user", content: (type === "trends" 
        ? "Analise as tendências dos meus gastos comparando com meses anteriores. Identifique padrões, alertas e oportunidades de economia." 
        : "Olá!") + userContext });
    } else {
      // Inject context into first user message
      const firstUserIdx = allMessages.findIndex((m: any) => m.role === "user");
      if (firstUserIdx >= 0 && !allMessages[firstUserIdx].content.includes("--- Dados financeiros")) {
        allMessages[firstUserIdx].content += userContext;
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: allMessages,
        stream: true,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-copilot-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
