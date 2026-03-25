import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, MailX } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: anonKey },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.valid === false && d.reason === "already_unsubscribed") setStatus("already");
        else if (d.valid) setStatus("valid");
        else setStatus("invalid");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleUnsubscribe = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (error) throw error;
      setStatus(data?.success ? "success" : data?.reason === "already_unsubscribed" ? "already" : "error");
    } catch { setStatus("error"); }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          {status === "loading" && <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />}
          {status === "valid" && (
            <>
              <MailX className="mx-auto h-12 w-12 text-destructive" />
              <h1 className="text-xl font-semibold text-foreground">Cancelar inscrição</h1>
              <p className="text-muted-foreground text-sm">Deseja parar de receber nossos emails?</p>
              <Button onClick={handleUnsubscribe} disabled={processing} variant="destructive">
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirmar cancelamento
              </Button>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-success" />
              <h1 className="text-xl font-semibold text-foreground">Inscrição cancelada</h1>
              <p className="text-muted-foreground text-sm">Você não receberá mais nossos emails.</p>
            </>
          )}
          {status === "already" && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h1 className="text-xl font-semibold text-foreground">Já cancelado</h1>
              <p className="text-muted-foreground text-sm">Sua inscrição já foi cancelada anteriormente.</p>
            </>
          )}
          {status === "invalid" && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <h1 className="text-xl font-semibold text-foreground">Link inválido</h1>
              <p className="text-muted-foreground text-sm">Este link de cancelamento é inválido ou expirou.</p>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <h1 className="text-xl font-semibold text-foreground">Erro</h1>
              <p className="text-muted-foreground text-sm">Ocorreu um erro. Tente novamente mais tarde.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
