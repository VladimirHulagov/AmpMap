import { PowerLine, PowerOutlet } from '../types/power';

// Функция для расчета цвета линии на основе нагрузки
export function calculateLineColor(currentLoad: number, maxCapacity: number): string {
  const loadPercentage = (currentLoad / maxCapacity) * 100;
  
  if (loadPercentage <= 30) {
    return '#3bb073'; // зеленый
  } else if (loadPercentage <= 60) {
    return '#f5b40a'; // желтый
  } else if (loadPercentage <= 80) {
    return '#f4cc64'; // оранжевый
  } else {
    return '#c9454f'; // красный
  }
}

// Функция для форматирования мощности
export function formatPower(watts: number): string {
  if (watts >= 1000) {
    return `${(watts / 1000).toFixed(1)} кВт`;
  }
  return `${watts} Вт`;
}

// Функция для расчета процента нагрузки
export function calculateLoadPercentage(current: number, max: number): number {
  return Math.round((current / max) * 100);
}

// Функция для генерации SVG path для линии электропитания
export function generatePowerLinePath(outlets: PowerOutlet[], startPoint: { x: number, y: number }): string {
  if (outlets.length === 0) return '';
  
  let path = `M ${startPoint.x} ${startPoint.y}`;
  
  outlets.forEach((outlet, index) => {
    if (index === 0) {
      path += ` L ${outlet.x} ${outlet.y}`;
    } else {
      // Создаем ломаную линию через промежуточные точки
      path += ` L ${outlet.x} ${outlet.y}`;
    }
  });
  
  return path;
}

// Функция для создания моковых данных комнат
export function createMockRooms() {
  return [
    {
      id: 'room1',
      name: 'R15345 - Шумка 2.0',
      width: 800,
      height: 600,
      svgLayout: `
        <rect x="50" y="50" width="700" height="500" fill="none" stroke="#dfdfdf" stroke-width="2"/>
        <text x="400" y="30" text-anchor="middle" font-size="16" fill="var(--y-color-text-primary)">R15345 - Шумка 2.0</text>
        
        <!-- Электрощит -->
        <rect x="70" y="70" width="60" height="80" fill="var(--y-color-background-alternative)" stroke="var(--y-color-border)" stroke-width="1"/>
        <text x="100" y="95" text-anchor="middle" font-size="12" fill="var(--y-color-text-primary)">Щит</text>
        <text x="100" y="110" text-anchor="middle" font-size="10" fill="var(--y-color-text-secondary)">QF1</text>
        <text x="100" y="125" text-anchor="middle" font-size="10" fill="var(--y-color-text-secondary)">QF2</text>
      `,
      powerLines: [
        {
          id: 'line1',
          breakerNumber: 'QF1',
          maxCapacity: 3520, // 16A * 220V
          currentLoad: 850,
          color: calculateLineColor(850, 3520),
          path: generatePowerLinePath([
            { id: 'outlet_1', number: '1', x: 200, y: 150, currentLoad: 150, maxLoad: 3520, voltage: 220, isActive: true },
            { id: 'outlet_2', number: '2', x: 350, y: 150, currentLoad: 300, maxLoad: 3520, voltage: 220, isActive: true },
            { id: 'outlet_3', number: '3', x: 500, y: 150, currentLoad: 0, maxLoad: 3520, voltage: 220, isActive: false },
            { id: 'outlet_4', number: '4', x: 650, y: 150, currentLoad: 400, maxLoad: 3520, voltage: 220, isActive: true }
          ], { x: 130, y: 110 }),
          outlets: [
            { id: 'outlet_1', number: '1', x: 200, y: 150, currentLoad: 150, maxLoad: 3520, voltage: 220, isActive: true },
            { id: 'outlet_2', number: '2', x: 350, y: 150, currentLoad: 300, maxLoad: 3520, voltage: 220, isActive: true },
            { id: 'outlet_3', number: '3', x: 500, y: 150, currentLoad: 0, maxLoad: 3520, voltage: 220, isActive: false },
            { id: 'outlet_4', number: '4', x: 650, y: 150, currentLoad: 400, maxLoad: 3520, voltage: 220, isActive: true }
          ]
        },
        {
          id: 'line2',
          breakerNumber: 'QF2',
          maxCapacity: 3520,
          currentLoad: 300,
          color: calculateLineColor(300, 3520),
          path: generatePowerLinePath([
            { id: 'outlet_5', number: '5', x: 200, y: 350, currentLoad: 200, maxLoad: 3520, voltage: 220, isActive: true },
            { id: 'outlet_6', number: '6', x: 500, y: 350, currentLoad: 100, maxLoad: 3520, voltage: 220, isActive: true }
          ], { x: 130, y: 125 }),
          outlets: [
            { id: 'outlet_5', number: '5', x: 200, y: 350, currentLoad: 200, maxLoad: 3520, voltage: 220, isActive: true },
            { id: 'outlet_6', number: '6', x: 500, y: 350, currentLoad: 100, maxLoad: 3520, voltage: 220, isActive: true }
          ]
        }
      ]
    },
    {
      id: 'room2',
      name: 'R15346 - Лаборатория',
      width: 800,
      height: 600,
      svgLayout: `
        <rect x="50" y="50" width="700" height="500" fill="none" stroke="#dfdfdf" stroke-width="2"/>
        <text x="400" y="30" text-anchor="middle" font-size="16" fill="var(--y-color-text-primary)">R15346 - Лаборатория</text>
        
        <!-- Электрощит -->
        <rect x="70" y="70" width="60" height="80" fill="var(--y-color-background-alternative)" stroke="var(--y-color-border)" stroke-width="1"/>
        <text x="100" y="95" text-anchor="middle" font-size="12" fill="var(--y-color-text-primary)">Щит</text>
        <text x="100" y="110" text-anchor="middle" font-size="10" fill="var(--y-color-text-secondary)">QF1</text>
        <text x="100" y="125" text-anchor="middle" font-size="10" fill="var(--y-color-text-secondary)">QF2</text>
        <text x="100" y="140" text-anchor="middle" font-size="10" fill="var(--y-color-text-secondary)">QF3</text>
      `,
      powerLines: [
        {
          id: 'line3',
          breakerNumber: 'QF1',
          maxCapacity: 3520,
          currentLoad: 1200,
          color: calculateLineColor(1200, 3520),
          path: generatePowerLinePath([
            { id: 'outlet_7', number: '7', x: 200, y: 200, currentLoad: 600, maxLoad: 3520, voltage: 220, isActive: true },
            { id: 'outlet_8', number: '8', x: 400, y: 200, currentLoad: 600, maxLoad: 3520, voltage: 220, isActive: true }
          ], { x: 130, y: 110 }),
          outlets: [
            { id: 'outlet_7', number: '7', x: 200, y: 200, currentLoad: 600, maxLoad: 3520, voltage: 220, isActive: true },
            { id: 'outlet_8', number: '8', x: 400, y: 200, currentLoad: 600, maxLoad: 3520, voltage: 220, isActive: true }
          ]
        }
      ]
    }
  ];
}