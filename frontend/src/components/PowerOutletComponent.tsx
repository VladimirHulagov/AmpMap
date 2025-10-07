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
        r="60"
        fill={outletColor}
        stroke="var(--y-color-border)"
        strokeWidth="10"
      />

      {/* Номер розетки */}
      <text
        x={outlet.x}
        y={outlet.y + 20}
        textAnchor="middle"
        fontSize="50"
        fontWeight="bold"
        fill="white"
      >
        {outlet.number}
      </text>

      {/* Информация о нагрузке */}
      <g>
        <rect
          x={outlet.x - 175}
          y={outlet.y - 175}
          width="350"
          height="75"
          fill="var(--y-color-background)"
          stroke="var(--y-color-border)"
          strokeWidth="5"
          rx="10"
        />
        <text
          x={outlet.x}
          y={outlet.y - 125}
          textAnchor="middle"
          fontSize="45"
          fill={textColor}
        >
          {formatPower(outlet.currentLoad)}
        </text>
      </g>

      {/* Индикатор активности */}
      {outlet.isActive && (
        <circle
          cx={outlet.x + 75}
          cy={outlet.y - 75}
          r="15"
          fill="var(--y-color-success)"
        />
      )}
    </g>
  );
};

export default PowerOutletComponent;