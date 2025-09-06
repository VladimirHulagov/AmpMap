import React from 'react';
import { PowerOutlet } from '../types/power';
import { formatPower } from '../utils/powerUtils';

interface PowerOutletComponentProps {
  outlet: PowerOutlet;
  onClick?: (outlet: PowerOutlet) => void;
}

const PowerOutletComponent: React.FC<PowerOutletComponentProps> = ({ outlet, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(outlet);
    }
  };

  const outletColor = outlet.isActive ? 'var(--y-color-success)' : 'var(--y-color-text-tertiary)';
  const textColor = outlet.isActive ? 'var(--y-color-text-primary)' : 'var(--y-color-text-tertiary)';

  return (
    <g onClick={handleClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {/* Розетка */}
      <circle
        cx={outlet.x}
        cy={outlet.y}
        r="12"
        fill={outletColor}
        stroke="var(--y-color-border)"
        strokeWidth="2"
      />
      
      {/* Номер розетки */}
      <text
        x={outlet.x}
        y={outlet.y + 4}
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="white"
      >
        {outlet.number}
      </text>
      
      {/* Информация о нагрузке */}
      <g>
        <rect
          x={outlet.x - 35}
          y={outlet.y - 35}
          width="70"
          height="15"
          fill="var(--y-color-background)"
          stroke="var(--y-color-border)"
          strokeWidth="1"
          rx="2"
        />
        <text
          x={outlet.x}
          y={outlet.y - 25}
          textAnchor="middle"
          fontSize="9"
          fill={textColor}
        >
          {formatPower(outlet.currentLoad)}
        </text>
      </g>
      
      {/* Индикатор активности */}
      {outlet.isActive && (
        <circle
          cx={outlet.x + 15}
          cy={outlet.y - 15}
          r="3"
          fill="var(--y-color-success)"
        />
      )}
    </g>
  );
};

export default PowerOutletComponent;