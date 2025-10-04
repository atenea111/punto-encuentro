import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Pin de ubicación */}
        <path
          d="M50 0C22.4 0 0 22.4 0 50C0 77.6 50 120 50 120C50 120 100 77.6 100 50C100 22.4 77.6 0 50 0Z"
          fill="#3B82F6"
          stroke="#1E40AF"
          strokeWidth="3"
        />
        
        {/* Círculo interior del pin */}
        <circle cx="50" cy="45" r="25" fill="#06B6D4" />
        
        {/* Apretón de manos */}
        <g fill="#FCD34D">
          {/* Mano izquierda */}
          <path
            d="M35 35C35 35 38 38 40 40C42 42 45 45 45 45L42 48C42 48 39 45 37 43C35 41 32 38 32 38L35 35Z"
          />
          {/* Mano derecha */}
          <path
            d="M65 35C65 35 62 38 60 40C58 42 55 45 55 45L58 48C58 48 61 45 63 43C65 41 68 38 68 38L65 35Z"
          />
          {/* Dedos entrelazados */}
          <path
            d="M45 45C45 45 47 47 50 47C53 47 55 45 55 45L52 42C52 42 50 44 50 44C50 44 48 42 48 42L45 45Z"
          />
        </g>
      </svg>
    </div>
  );
}

export function LogoText({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={`text-center ${className}`}>
      <div className="flex flex-col items-center">
        <Logo size={size} className="mb-4" />
        <div className="text-center">
          <h1 className={`${sizeClasses[size]} font-bold text-gray-900 mb-2`}>
            PUNTO
          </h1>
          <h1 className={`${sizeClasses[size]} font-bold text-gray-900`}>
            ENCUENTRO
          </h1>
        </div>
      </div>
    </div>
  );
}
