import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AppLogo from '@/components/AppLogo';

export default function Termos() {
  return (
    <main className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <AppLogo size="md" />
          <Link to="/" className="glass-panel rounded-2xl px-4 py-2 text-sm font-bold flex items-center gap-1.5 hover:bg-accent transition-colors">
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </div>

        <article className="glass-panel p-6 md:p-10 rounded-3xl prose prose-sm md:prose-base max-w-none text-foreground">
          <h1 className="text-2xl md:text-3xl font-black mb-2">Termos de Uso</h1>
          <p className="text-muted-foreground text-sm">Última atualização: 04 de maio de 2026</p>

          <section className="mt-6 space-y-4 text-sm md:text-base leading-relaxed">
            <p>
              Bem-vindo(a) ao <strong>Conta Clara Lite</strong> ("aplicativo", "serviço" ou "plataforma"),
              operado por <strong>DynamiSmart Apps</strong>, inscrita no CNPJ sob o nº [a informar].
              Ao criar uma conta ou utilizar o serviço, você concorda com estes Termos de Uso.
            </p>

            <h2 className="text-lg md:text-xl font-bold mt-6">1. Objeto</h2>
            <p>
              O Conta Clara Lite é um aplicativo de organização financeira pessoal que permite
              ao usuário registrar receitas, despesas, contas fixas, parcelamentos e visualizar
              relatórios sobre seus próprios dados financeiros. <strong>Não somos uma instituição
              financeira</strong> e não realizamos transações, transferências ou aconselhamento
              de investimento.
            </p>

            <h2 className="text-lg md:text-xl font-bold mt-6">2. Cadastro e Conta</h2>
            <p>
              Para utilizar o serviço, é necessário criar uma conta com e-mail válido e senha.
              Você é responsável por manter a confidencialidade das credenciais e por todas as
              atividades realizadas na sua conta. É proibido criar contas com dados falsos ou
              de terceiros sem autorização.
            </p>

            <h2 className="text-lg md:text-xl font-bold mt-6">3. Período de teste e Assinatura</h2>
            <p>
              Oferecemos um período de teste gratuito de <strong>3 dias</strong>. Após esse período,
              o uso continuado requer assinatura paga (mensal ou anual), processada via Stripe.
              Os preços vigentes são exibidos na tela de assinatura. Você pode cancelar a renovação
              a qualquer momento pelo portal de assinatura.
            </p>
            <p>
              <strong>Direito de arrependimento (CDC art. 49):</strong> assinaturas contratadas
              à distância podem ser canceladas em até 7 (sete) dias com reembolso integral,
              mediante solicitação para <a href="mailto:suporte.tech@dynamismartapps.com" className="text-primary underline">suporte.tech@dynamismartapps.com</a>.
            </p>

            <h2 className="text-lg md:text-xl font-bold mt-6">4. Uso aceitável</h2>
            <p>Você concorda em <strong>não</strong>:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>usar o serviço para finalidades ilícitas ou que violem direitos de terceiros;</li>
              <li>tentar acessar dados de outros usuários, contornar autenticação ou explorar vulnerabilidades;</li>
              <li>realizar engenharia reversa, copiar ou redistribuir o código do aplicativo;</li>
              <li>inserir conteúdo ofensivo, difamatório ou que viole a legislação brasileira.</li>
            </ul>

            <h2 className="text-lg md:text-xl font-bold mt-6">5. Inteligência Artificial (Copilot)</h2>
            <p>
              O Copilot e as Dicas geradas por IA são <strong>orientações educativas</strong>,
              baseadas em modelos estatísticos. Não constituem aconselhamento financeiro,
              jurídico ou tributário. Decisões financeiras são de responsabilidade exclusiva
              do usuário.
            </p>

            <h2 className="text-lg md:text-xl font-bold mt-6">6. Disponibilidade e Limitação de Responsabilidade</h2>
            <p>
              Empenhamo-nos em manter o serviço disponível, porém não garantimos operação
              ininterrupta ou livre de erros. Na máxima extensão permitida por lei,
              não nos responsabilizamos por:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>decisões financeiras tomadas pelo usuário com base em informações do app;</li>
              <li>perdas indiretas, lucros cessantes ou danos morais;</li>
              <li>indisponibilidade decorrente de caso fortuito, força maior ou falhas de terceiros (provedores de hospedagem, pagamento, etc.).</li>
            </ul>

            <h2 className="text-lg md:text-xl font-bold mt-6">7. Retenção e Exclusão de Dados</h2>
            <p>
              Após o término de uma assinatura, seus dados ficam disponíveis por <strong>15 dias</strong>
              para retomada. Após esse prazo, os dados são <strong>excluídos automaticamente</strong>.
              Você pode também solicitar a exclusão imediata da conta nas Configurações do app
              ou pelo e-mail de contato.
            </p>

            <h2 className="text-lg md:text-xl font-bold mt-6">8. Propriedade Intelectual</h2>
            <p>
              Todo o código, design, marca, logotipo e conteúdo do aplicativo são de propriedade
              da DynamiSmart Apps. Os <strong>dados financeiros inseridos</strong> são de
              propriedade do usuário, que concede licença limitada para que possamos processá-los
              com a finalidade de prestar o serviço.
            </p>

            <h2 className="text-lg md:text-xl font-bold mt-6">9. Alterações destes Termos</h2>
            <p>
              Podemos atualizar estes Termos a qualquer momento. Mudanças relevantes serão
              comunicadas por e-mail ou aviso no app com pelo menos 15 dias de antecedência.
            </p>

            <h2 className="text-lg md:text-xl font-bold mt-6">10. Lei aplicável e foro</h2>
            <p>
              Estes Termos são regidos pela legislação brasileira. Fica eleito o foro do
              domicílio do usuário, conforme art. 101, I do Código de Defesa do Consumidor.
            </p>

            <h2 className="text-lg md:text-xl font-bold mt-6">11. Contato</h2>
            <p>
              Dúvidas, sugestões ou solicitações: <a href="mailto:suporte.tech@dynamismartapps.com" className="text-primary underline">suporte.tech@dynamismartapps.com</a>
            </p>
          </section>

          <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground">
            Veja também a <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link>.
          </div>
        </article>
      </div>
    </main>
  );
}
