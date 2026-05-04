import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'cc_cookie_consent_v1';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, at: Date.now() }));
    setVisible(false);
  }
  function dismiss() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: false, at: Date.now() }));
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[100]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="glass-panel p-4 rounded-2xl shadow-2xl border border-border">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Cookie className="size-4 text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold mb-1">Sua privacidade importa</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Usamos apenas cookies essenciais para manter você conectado(a). Não rastreamos para publicidade.
                  Veja a <Link to="/privacidade" className="text-primary underline font-medium">Política de Privacidade</Link>.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={accept}
                    className="brand-gradient border-none rounded-xl px-3.5 py-2 font-bold text-xs text-primary-foreground cursor-pointer"
                  >
                    Entendi
                  </button>
                  <button
                    onClick={dismiss}
                    className="glass-panel rounded-xl px-3.5 py-2 font-bold text-xs cursor-pointer hover:bg-accent transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
              <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors p-1 -mt-1 -mr-1">
                <X className="size-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
