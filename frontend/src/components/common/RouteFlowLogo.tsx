import React from 'react';

interface RouteFlowLogoProps {
  className?: string;
  size?: number | string;
}

export const RouteFlowLogo: React.FC<RouteFlowLogoProps> = ({ 
  className = "w-7 h-7", 
  size 
}) => {
  return (
    <img 
      src="/logo.svg" 
      alt="RouteFlow" 
      className={`object-contain flex-shrink-0 select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
      onError={(e) => {
        // Fallback to PNG if SVG loader fails in any environment
        const target = e.currentTarget;
        if (!target.src.endsWith('/logo.png')) {
          target.src = '/logo.png';
        }
      }}
    />
  );
};

