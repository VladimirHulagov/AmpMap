export interface SVGMapConfig {
  id: string;
  name: string;
  svgContent: string;
  width: number;
  height: number;
  outlets: OutletConfig[];
  powerLines: PowerLineConfig[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OutletConfig {
  id: string;
  number: string;
  x: number;
  y: number;
  influxTag: string; // тег для поиска в InfluxDB
  maxLoad: number;
  lineId: string;
}

export interface PowerLineConfig {
  id: string;
  breakerNumber: string;
  maxCapacity: number;
  influxTag: string; // тег для поиска в InfluxDB
  startPoint: { x: number; y: number };
  color?: string;
}

export interface InfluxMapping {
  measurement: string;
  tags: {
    room_id?: string;
    outlet_id?: string;
    line_id?: string;
    [key: string]: string | undefined;
  };
  fields: {
    power?: string;
    voltage?: string;
    current?: string;
    [key: string]: string | undefined;
  };
}