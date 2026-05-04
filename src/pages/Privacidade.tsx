import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AppLogo from '@/components/AppLogo';

export default function Privacidade() {
  return (
    <main className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <AppLogo size="md" />
          <Link to="/" className="glass-panel rounded-2xl px-4 py-2 text-sm font-bold flex items-center gap-1.5 hover:bg-accent transition-colors">
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </div>

        <article className="glass-panel p-6 md:p-10 rounded-3xl max-w-none text-foreground">
          <h1 className="text-2xl md:text-3xl font-black mb-2">Política de Privacidade</h1>
          <p className="text-muted-foreground text-sm">Última atualização: 04 de maio de 2026</p>

          <section className="mt-6 space-y-4 text-sm md:text-base leading-relaxed">
            <p>
              Esta Política descreve como o <strong>Conta Clara Lite</strong>, operado pela
              <strong> DynamiSmart Apps</strong> (CNPJ [a informar]), coleta, usa, armazena
              e protege seus dados pessoais, em conformidade com a <strong>Lei Geral de Proteção
              de Dados (Lei nº 13.709/2018 — LGPD)</strong>.
            </p>

            <h2 className="text-lg md:text-xl font-bold mt-6">1. Controlador de dados</h2>
            <p>
              <strong>DynamiSmart Apps</strong><br />
              E-mail do encarregado (DPO): <a href="mailto:suporte.tech@dynamismartapps.com" className="text-primary underline">suporte.tech@dynamismartapps.com</a>
            </p>

            <h2 className="text-lg md:text-xl font-bold mt-6">2. Dados que coletamos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Cadastro:</strong> nome, e-mail e senha (criptografada).</li>
              <li><strong>Financeiros do usuário:</strong> receitas, despesas, contas fixas, categorias e metas que <em>você</em> insere voluntariamente.</li>
              <li><strong>Pagamento:</strong> processado pela Stripe (não armazenamos número de cartão). Recebemos apenas o status da assinatura e identificador do cliente.</li>
              <li><strong>Técnicos:</strong> IP, navegador, tipo de dispositivo, logs de acesso (para segurança).</li>
              <li><strong>Indicações (referral):</strong> código de quem indicou e status da conversão.</li>
            </ul>
            <p><strong>Não coletamos</strong> dados de contas bancárias, extratos ou cartões de crédito reais.</p>

            <h2 className="text-lg md:text-xl font-bold mt-6">3. Bases legais (LGPD art. 7º)</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Execução de contrato:</strong> para prestar o serviço contratado.</li>
              <li><strong>Consentimento:</strong> para envio de e-mails opcionais e cookies não essenciais.</li>
              <li><strong>Obrigação legal:</strong> guarda de logs de acesso (Marco Civil — 6 meses).</li>
              <li><strong>Legítimo interesse:</strong> segurança, prevenção de fraude e melhoria do serviço.</li>
            </ul>

            <h2 className="text-lg md:text-xl font-bold mt-6">4. Como usamos seus dados</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Operar o app, sincronizar entre dispositivos e gerar seus relatórios pessoais;</li>
              <li>Processar a assinatura e enviar comunicações transacionais (recuperação de senha, vencimentos, exclusão de conta);</li>
              <li>Gerar dicas personalizadas com IA (os dados são enviados de forma temporária ao provedor de IA; não são usados para treinar modelos);</li>
              <li>Cumprir obrigações legais e responder a autoridades quando exigido.</li>
            </ul>

            <h2 className="text-lg md:text-xl font-bold mt-6">5. Compartilhamento</h2>
            <p>Compartilhamos dados <strong>somente</strong> com os operadores necessários:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Lovable Cloud / Supabase</strong> — hospedagem e banco de dados.</li>
              <li><strong>Stripe</strong> — processamento de pagamentos.</li>
              <li><strong>Provedores de IA (Google Gemini / OpenAI via Lovable AI Gateway)</strong> — geração de dicas, sem retenção.</li>
              <li><strong>Provedor de e-mail transacional</strong> — envio de mensagens do sistema.</li>
            </ul>
            <p>Não vendemos, alugamos ou cedemos seus dados a terceiros para fins de marketing.</p>

            <h2 className="text-lg md:text-xl font-bold mt-6">6. Cookies</h2>
            <p>
              Usamos cookies <strong>essenciais</strong> para manter sua sessão autenticada.
              Não usamos cookies de publicidade ou rastreamento de terceiros.
            </p>

            <h2 className="text-lg md:text-xl font-bold mt-6">7. Segurança</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Criptografia em trânsito (HTTPS/TLS) e em repouso;</li>
              <li>Senhas armazenadas com hash unidirecional (bcrypt);</li>
              <li>Row-Level Security (RLS) garante que cada usuário só acessa seus próprios dados;</li>
              <li>Verificação de senhas vazadas (HIBP) recomendada na criação de conta.</li>
            </ul>

            <h2 className="text-lg md:text-xl font-bold mt-6">8. Retenção</h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Após cancelamento da
              assinatura, há um período de <strong>15 dias</strong> de retenção para retomada,
              e depois os dados são <strong>excluídos automaticamente</strong>. Logs de acesso
              são guardados por 6 meses (Marco Civil da Internet).
            </p>

            <h2 className="text-lg md:text-xl font-bold mt-6">9. Seus direitos (LGPD art. 18)</h2>
            <p>Você pode, a qualquer momento, solicitar:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>confirmação da existência de tratamento;</li>
              <li>acesso e cópia dos seus dados (exportar CSV/PDF no app);</li>
              <li>correção de dados incompletos ou desatualizados;</li>
              <li>anonimização, bloqueio ou eliminação de dados desnecessários;</li>
              <li>portabilidade a outro fornecedor;</li>
              <li><strong>exclusão completa da conta</strong> (Configurações → Excluir minha conta);</li>
              <li>revogação do consentimento.</li>
            </ul>
            <p>
              Para exercer qualquer direito: <a href="mailto:suporte.tech@dynamismartapps.com" className="text-primary underline">suporte.tech@dynamismartapps.com</a>.
              Respondemos em até 15 dias.
            </p>

            <h2 className="text-lg md:text-xl font-bold mt-6">10. Crianças e adolescentes</h2>
            <p>
              O serviço é destinado a maiores de 18 anos. Não coletamos intencionalmente
              dados de menores.
            </p>

            <h2 className="text-lg md:text-xl font-bold mt-6">11. Transferência internacional</h2>
            <p>
              Alguns operadores (Stripe, provedores de IA) podem processar dados fora do
              Brasil, sempre em países com nível adequado de proteção ou mediante cláusulas
              contratuais padrão.
            </p>

            <h2 className="text-lg md:text-xl font-bold mt-6">12. Alterações</h2>
            <p>
              Esta Política pode ser atualizada. Notificaremos mudanças relevantes por
              e-mail ou aviso no app.
            </p>
          </section>

          <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground">
            Veja também os <Link to="/termos" className="text-primary underline">Termos de Uso</Link>.
          </div>
        </article>
      </div>
    </main>
  );
}
