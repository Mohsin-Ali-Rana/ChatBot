import React from 'react';
import { motion } from 'framer-motion';

interface NexusLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  animated?: boolean;
}

export const NexusLogo: React.FC<NexusLogoProps> = ({ 
  size = 'md', 
  showText = true,
  animated = true 
}) => {
  const dimensions = {
    sm: { box: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-sm', rounded: 'rounded-xl' },
    md: { box: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-base sm:text-lg', rounded: 'rounded-2xl' },
    lg: { box: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-2xl sm:text-3xl', rounded: 'rounded-3xl' },
  }[size];

  return (
    <div className="flex items-center gap-2.5 select-none group cursor-pointer">
      <motion.div 
        className="relative flex items-center justify-center"
        whileHover={{ scale: 1.08, rotate: 3 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        {/* Outer Pulsing Ambient Glowing Halo */}
        <div className={`absolute -inset-1.5 ${dimensions.rounded} bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-65 blur-lg group-hover:opacity-100 transition-opacity duration-500 ${animated ? 'animate-pulse' : ''}`} />
        
        {/* Rotating Gradient Border Ring */}
        <motion.div 
          animate={animated ? { rotate: 360 } : {}}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className={`absolute -inset-0.5 ${dimensions.rounded} bg-gradient-to-r from-indigo-500 via-purple-500 via-pink-500 to-indigo-500 p-[1.5px] opacity-90`}
        />

        {/* Core Glass Canvas Container */}
        <div className={`relative ${dimensions.box} ${dimensions.rounded} bg-[#0b0f19]/90 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl overflow-hidden`}>
          {/* Inner Shimmer Radial Light */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/40 via-purple-600/25 to-pink-500/20 opacity-80" />
          
          {/* Futuristic Sparkle Crystal SVG Icon */}
          <div className="relative z-10 flex items-center justify-center">
            <svg 
              className={`${dimensions.icon} filter drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]`}
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="nexusLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="50%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
              </defs>

              {/* Central Glowing Sparkle Diamond Core */}
              <path 
                d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z" 
                fill="url(#nexusLogoGrad)"
              />
              {/* Secondary Accent Nodes */}
              <circle cx="18" cy="6" r="1.5" fill="#e0e7ff" className="animate-pulse" />
              <circle cx="6" cy="18" r="1.5" fill="#f472b6" className="animate-pulse" />
            </svg>
          </div>

          {/* Micro Orbiting Light Particle Dots */}
          {animated && (
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-1 h-1 rounded-full bg-cyan-300 shadow-[0_0_6px_#67e8f9] absolute top-1" />
              <div className="w-1 h-1 rounded-full bg-pink-400 shadow-[0_0_6px_#f472b6] absolute bottom-1" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Brand Text Branding */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-tight ${dimensions.text} bg-gradient-to-r from-white via-slate-100 to-indigo-100 bg-clip-text text-transparent drop-shadow-sm`}>
            Nexus<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-extrabold">AI</span>
          </span>
        </div>
      )}
    </div>
  );
};
