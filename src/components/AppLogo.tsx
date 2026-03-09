import { motion } from 'framer-motion';
import appIcon from '@/assets/app-icon.png';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
}

const sizes = {
  sm: { icon: 'w-9 h-9', ring: 'w-10 h-10', text: 'text-sm', sub: 'text-[10px]' },
  md: { icon: 'w-11 h-11', ring: 'w-12 h-12', text: 'text-base', sub: 'text-[11px]' },
  lg: { icon: 'w-14 h-14', ring: 'w-16 h-16', text: 'text-lg', sub: 'text-sm' },
  xl: { icon: 'w-20 h-20', ring: 'w-24 h-24', text: 'text-2xl', sub: 'text-base' },
};

export default function AppLogo({ size = 'md', showText = true, subtitle }: AppLogoProps) {
  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <motion.div
        className={`relative ${s.ring} shrink-0 flex items-center justify-center`}
        whileHover={{ scale: 1.08, rotate: 3 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-2xl bg-primary/25 blur-lg scale-110" />
        {/* Icon container */}
        <div className={`relative ${s.icon} rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center overflow-hidden`}>
          <img
            src={appIcon}
            alt="Conta Clara"
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>
      </motion.div>
      {showText && (
        <div className="min-w-0">
          <h1 className={`${s.text} font-black leading-tight tracking-tight`}>Conta Clara</h1>
          {subtitle && (
            <p className={`${s.sub} text-muted-foreground mt-0.5 truncate`}>{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
