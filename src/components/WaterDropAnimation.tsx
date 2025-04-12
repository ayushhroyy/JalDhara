
import React from 'react';

interface WaterDropAnimationProps {
  count?: number;
}

const WaterDropAnimation: React.FC<WaterDropAnimationProps> = ({ count = 5 }) => {
  return (
    <div className="relative h-40 w-full overflow-hidden">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index}
          className="absolute water-droplet animate-water-drop" 
          style={{ 
            left: `${(index + 1) * (100 / (count + 1))}%`,
            animationDelay: `${index * 0.3}s`,
            backgroundColor: index % 2 === 0 ? '#219ebc' : '#8ecae6'
          }}
        />
      ))}
    </div>
  );
};

export default WaterDropAnimation;
