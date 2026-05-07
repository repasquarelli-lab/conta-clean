import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

type Result = {
  description: string | null;
  value: number | null;
  date: string | null;
  category: string | null;
};

interface Props {
  categories: string[];
  onExtracted: (r: Result) => void;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = reader.result as string;
      resolve(s.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function compress(file: File, maxSide = 1280, quality = 0.78): Promise<{ blob: Blob; mime: string }> {
  if (!file.type.startsWith('image/')) return { blob: file, mime: file.type || 'image/jpeg' };
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return { blob: file, mime: file.type };
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0, w, h);
  const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/jpeg', quality)!);
  return { blob, mime: 'image/jpeg' };
}

export default function ReceiptScanner({ categories, onExtracted }: Props) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > 12 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx 12MB).');
      return;
    }
    setLoading(true);
    const tid = toast.loading('Analisando recibo com IA…');
    try {
      const { blob, mime } = await compress(file);
      const base64 = await fileToBase64(new File([blob], 'receipt.jpg', { type: mime }));
      const { data, error } = await supabase.functions.invoke('ocr-receipt', {
        body: { imageBase64: base64, mimeType: mime, categories },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      const result = (data as any)?.result as Result;
      if (!result) throw new Error('Resposta inválida');
      onExtracted(result);
      toast.success('Campos preenchidos! Revise antes de salvar.', { id: tid });
    } catch (e: any) {
      toast.error(e.message || 'Falha ao analisar', { id: tid });
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="glass-panel rounded-2xl px-3 py-2 font-bold cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 hover:bg-accent/40"
        title="Escanear recibo com IA"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" strokeWidth={1.5} />}
        <Sparkles className="size-3 text-primary" />
        {loading ? 'Lendo…' : 'Escanear recibo'}
      </button>
    </>
  );
}
