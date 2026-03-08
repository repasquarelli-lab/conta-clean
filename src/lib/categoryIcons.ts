import {
  Home,
  ShoppingCart,
  HeartPulse,
  Car,
  Sparkles,
  Gamepad2,
  Baby,
  Repeat,
  MoreHorizontal,
  Wallet,
  Clock,
  Gift,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

export const categoryIconMap: Record<string, LucideIcon> = {
  Casa: Home,
  Mercado: ShoppingCart,
  Saúde: HeartPulse,
  Transporte: Car,
  Beleza: Sparkles,
  Lazer: Gamepad2,
  Filhos: Baby,
  Assinaturas: Repeat,
  Outros: MoreHorizontal,
  // income categories
  Salário: Wallet,
  Aposentadoria: Clock,
  Comissão: Briefcase,
  Extra: Gift,
};

export function getCategoryIcon(category: string): LucideIcon {
  return categoryIconMap[category] || MoreHorizontal;
}
