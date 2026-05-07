import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { imageBase64, mimeType, categories } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "imageBase64 obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedCategories: string[] = Array.isArray(categories) && categories.length
      ? categories
      : ["Alimentação", "Transporte", "Saúde", "Moradia", "Educação", "Lazer", "Outros"];

    const systemPrompt =
      "Você é um assistente que extrai dados de recibos, notas fiscais e cupons brasileiros. " +
      "Sempre responda em PT-BR usando a ferramenta extract_receipt. " +
      "Para 'description', use o nome do estabelecimento ou principal item (curto, máx 60 chars). " +
      "Para 'value', use o VALOR TOTAL pago (número decimal, sem 'R$'). " +
      "Para 'date', use a data da compra no formato YYYY-MM-DD; se não houver, use a data de hoje. " +
      "Para 'category', escolha exatamente UMA das categorias permitidas que melhor descreva a despesa. " +
      "Se algum campo não puder ser identificado com confiança, retorne null.";

    const body = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extraia os dados deste recibo. Categorias permitidas: ${allowedCategories.join(", ")}.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` },
            },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_receipt",
            description: "Retorna os campos extraídos do recibo.",
            parameters: {
              type: "object",
              properties: {
                description: { type: ["string", "null"] },
                value: { type: ["number", "null"] },
                date: { type: ["string", "null"], description: "YYYY-MM-DD" },
                category: { type: ["string", "null"], enum: [...allowedCategories, null] },
                confidence: { type: "number", description: "0 a 1" },
              },
              required: ["description", "value", "date", "category"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_receipt" } },
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde alguns segundos e tente novamente." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos da IA esgotados. Adicione créditos no workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Falha ao analisar a imagem." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: any = null;
    if (call?.function?.arguments) {
      try { parsed = JSON.parse(call.function.arguments); } catch { /* ignore */ }
    }
    if (!parsed) {
      return new Response(JSON.stringify({ error: "Não consegui ler o recibo. Tente uma foto mais nítida." }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ocr-receipt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
