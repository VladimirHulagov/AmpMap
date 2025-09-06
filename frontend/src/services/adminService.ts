import { SVGMapConfig, OutletConfig, PowerLineConfig } from '../types/admin';

export class AdminService {
  private storageKey = 'power_monitoring_maps';

  // Получить все карты
  getAllMaps(): SVGMapConfig[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  // Получить карту по ID
  getMapById(id: string): SVGMapConfig | null {
    const maps = this.getAllMaps();
    return maps.find(map => map.id === id) || null;
  }

  // Сохранить карту
  saveMap(map: SVGMapConfig): void {
    const maps = this.getAllMaps();
    const existingIndex = maps.findIndex(m => m.id === map.id);
    
    if (existingIndex >= 0) {
      maps[existingIndex] = { ...map, updatedAt: new Date() };
    } else {
      maps.push({ ...map, createdAt: new Date(), updatedAt: new Date() });
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(maps));
  }

  // Удалить карту
  deleteMap(id: string): void {
    const maps = this.getAllMaps();
    const filtered = maps.filter(map => map.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  // Парсинг SVG для извлечения размеров
  parseSVGDimensions(svgContent: string): { width: number; height: number } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    
    if (svg) {
      const width = parseInt(svg.getAttribute('width') || '800');
      const height = parseInt(svg.getAttribute('height') || '600');
      return { width, height };
    }
    
    return { width: 800, height: 600 };
  }

  // Валидация SVG
  validateSVG(svgContent: string): boolean {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');
      return !parserError;
    } catch {
      return false;
    }
  }

  // Генерация уникального ID
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const adminService = new AdminService();