export interface PowerOutlet {
  id: string;
  number: string;
  x: number;
  y: number;
  currentLoad: number; // в ваттах
  maxLoad: number; // в ваттах
  voltage: number; // в вольтах
  isActive: boolean;
}

export interface PowerLine {
  id: string;
  breakerNumber: string; // номер автомата (QF1, QF2, etc.)
  outlets: PowerOutlet[];
  maxCapacity: number; // максимальная мощность линии в ваттах
  currentLoad: number; // текущая нагрузка в ваттах
  color: string; // цвет линии на основе нагрузки
  path: string; // SVG path для отображения линии
}

export interface Room {
  id: string;
  name: string;
  svgLayout: string; // SVG разметка помещения
  powerLines: PowerLine[];
  width: number;
  height: number;
}

export interface PowerData {
  rooms: Room[];
  lastUpdated: Date;
}