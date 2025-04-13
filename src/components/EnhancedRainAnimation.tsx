import React, { memo } from 'react';

interface EnhancedRainAnimationProps {
  className?: string;
  count?: number;
}

// Use memo to prevent unnecessary re-renders
const EnhancedRainAnimation: React.FC<EnhancedRainAnimationProps> = memo(({ 
  className = '',
  count = 25 // Reduce default count for better performance
}) => {
  // Precompute raindrops at render time instead of using animations
  // This creates a static pattern that's more CPU-friendly
  const raindrops = Array.from({ length: count }).map((_, index) => {
    const left = Math.random() * 100; // Random position (0-100%)
    const top = Math.random() * 100; // Random vertical position
    const size = 2 + Math.random() * 2; // Smaller size for better performance (2-4px)
    const opacity = 0.3 + Math.random() * 0.2; // Lower opacity (0.3-0.5)
    
    return { left, top, size, opacity, index };
  });

  return (
    <div 
      className={`enhanced-rain-animation ${className}`}
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden',
        pointerEvents: 'none',
        // Lower z-index to make sure it's behind all content
        zIndex: 0,
      }}
    >
      {/* Render static raindrops instead of animated ones */}
      {raindrops.map(({ left, top, size, opacity, index }) => (
        <div 
          key={index}
          className="raindrop"
          style={{
            position: 'absolute',
            left: `${left}%`,
            top: `${top}%`,
            width: `${size * 0.5}px`,
            height: `${size * 2.5}px`,
            background: `rgba(100, ${200 + Math.floor(Math.random() * 55)}, 255, ${opacity})`,
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            transform: 'rotate(5deg)',
            boxShadow: `0 0 2px rgba(100, ${200 + Math.floor(Math.random() * 55)}, 255, ${opacity * 0.3})`,
            // Use static filter instead of animation for blur/glow effect
            filter: 'blur(0.5px)',
          }}
        />
      ))}
      
      {/* Add a few animated raindrops for minimal movement effect */}
      {Array.from({ length: 10 }).map((_, index) => (
        <div 
          key={`animated-${index}`}
          className="animated-raindrop"
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: '-20px',
            width: `${2 + Math.random() * 1}px`,
            height: `${5 + Math.random() * 5}px`,
            background: `rgba(100, ${200 + Math.floor(Math.random() * 55)}, 255, 0.4)`,
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            transform: 'rotate(5deg)',
            animation: `slow-rain-fall ${3 + Math.random() * 2}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
      
      {/* Minimal CSS animations */}
      <style>
        {`
          @keyframes slow-rain-fall {
            0% {
              top: -40px;
              opacity: 0;
            }
            20% {
              opacity: 0.3;
            }
            80% {
              opacity: 0.3;
            }
            100% {
              top: calc(100% + 20px);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
});

EnhancedRainAnimation.displayName = 'EnhancedRainAnimation';

export default EnhancedRainAnimation; 