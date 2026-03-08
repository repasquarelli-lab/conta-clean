import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: Route not found:", window.location.pathname);
  }, []);

  return (
    <section className="min-h-screen grid place-items-center p-4">
      <div className="glass-panel p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-2xl grid place-items-center brand-gradient font-black tracking-wide text-primary-foreground text-lg mx-auto mb-5 shadow-lg">CC</div>
        <h1 className="text-5xl font-black mb-2 bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-brand)' }}>404</h1>
        <p className="text-muted-foreground mb-6">Página não encontrada. Vamos voltar ao início?</p>
        <button
          onClick={() => navigate('/')}
          className="brand-gradient border-none rounded-2xl px-5 py-3 font-bold cursor-pointer text-primary-foreground text-sm flex items-center gap-2 mx-auto"
        >
          <Home className="w-4 h-4" /> Voltar ao início
        </button>
      </div>
    </section>
  );
};

export default NotFound;
