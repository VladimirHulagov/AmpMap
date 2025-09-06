import React from 'react';
import { PowerLine } from '../types/power';
import { formatPower, calculateLoadPercentage } from '../utils/powerUtils';
import PowerOutletComponent from './PowerOutletComponent';

interface PowerLineComponentProps {
  powerLine: PowerLine;
  onOutletClick?: (outlet: any) => void;
}

const PowerLineComponent: React.FC<PowerLineComponentProps> = ({ powerLine, onOutletClick }) => {
  const loadPercentage = calculateLoadPercentage(powerLine.currentLoad, powerLine.maxCapacity);
  
  // Определяем позицию для отображения информации об автомате
  const firstOutlet = powerLine.outlets[0];
  const breakerX = firstOutlet ? firstOutlet.x - 80 : 100;
  const breakerY = firstOutlet ? firstOutlet.y - 20 : 100;

  return (
    <g>
      {/* Линия электропитания */}
      <path
        d={powerLine.path}
        stroke={powerLine.color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Информация об автомате */}
      <g>
        <rect
          x={breakerX - 25}
          y={breakerY - 15}
          width="50"
          height="30"
          fill="var(--y-color-background)"
          stroke="var(--y-color-border)"
          strokeWidth="1"
          rx="3"
        />
        <text
          x={breakerX}
          y={breakerY - 5}
          textAnchor="middle"
          fontSize="10"
          fontWeight="bold"
          fill="var(--y-color-text-primary)"
        >
          {powerLine.breakerNumber}
        </text>
        <text
          x={breakerX}
          y={breakerY + 8}
          textAnchor="middle"
          fontSize="8"
          fill="var(--y-color-text-secondary)"
        >
          {loadPercentage}%
        </text>
      </g>
      
      {/* Общая нагрузка линии */}
      <g>
        <rect
          x={breakerX - 35}
          y={breakerY + 20}
          width="70"
          height="15"
          fill="var(--y-color-background-alternative)"
          stroke="var(--y-color-border)"
          strokeWidth="1"
          rx="2"
        />
        <text
          x={breakerX}
          y={breakerY + 31}
          textAnchor="middle"
          fontSize="9"
          fill="var(--y-color-text-primary)"
        >
          {formatPower(powerLine.currentLoad)}
        </text>
      </g>
      
      {/* Розетки */}
      {powerLine.outlets.map((outlet) => (
        <PowerOutletComponent
          key={outlet.id}
          outlet={outlet}
          onClick={onOutletClick}
        />
      ))}
    </g>
  );
};

export default PowerLineComponent;