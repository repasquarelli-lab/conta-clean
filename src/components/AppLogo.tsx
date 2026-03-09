import { motion } from 'framer-motion';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  subtitle?: string;
}

const sizes = {
  sm: { icon: 'w-8 h-8', ring: 'w-9 h-9', text: 'text-sm', sub: 'text-[10px]' },
  md: { icon: 'w-10 h-10', ring: 'w-11 h-11', text: 'text-sm', sub: 'text-[11px]' },
  lg: { icon: 'w-12 h-12', ring: 'w-14 h-14', text: 'text-base', sub: 'text-sm' },
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
        <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-md" />
        {/* Icon container */}
        <div className={`relative ${s.icon} rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25 flex items-center justify-center overflow-hidden border border-primary/30`}>
          <img
            src="/favicon.png"
            alt="Conta Clara"
            className="w-full h-full object-contain p-1 brightness-0 invert drop-shadow-sm"
          />
        </div>
      </motion.div>
      {showText && (
        <div className="min-w-0">
          <h1 className={`${s.text} font-bold leading-tight tracking-tight`}>Conta Clara</h1>
          {subtitle && (
            <p className={`${s.sub} text-muted-foreground mt-0.5 truncate`}>{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
