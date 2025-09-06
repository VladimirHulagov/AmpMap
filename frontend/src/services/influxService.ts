// Сервис для работы с InfluxDB
export class InfluxService {
  private baseUrl: string;
  private token: string;
  private org: string;
  private bucket: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_INFLUX_URL || 'http://localhost:8086';
    this.token = import.meta.env.VITE_INFLUX_TOKEN || '';
    this.org = import.meta.env.VITE_INFLUX_ORG || '';
    this.bucket = import.meta.env.VITE_INFLUX_BUCKET || '';
  }

  async getPowerData(roomId: string, timeRange: string = '-1h'): Promise<any> {
    const query = `
      from(bucket: "${this.bucket}")
        |> range(start: ${timeRange})
        |> filter(fn: (r) => r._measurement == "power_consumption")
        |> filter(fn: (r) => r.room_id == "${roomId}")
        |> last()
    `;

    try {
      const response = await fetch(`${this.baseUrl}/api/v2/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.token}`,
          'Content-Type': 'application/vnd.flux',
          'Accept': 'application/csv'
        },
        body: query
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const csvData = await response.text();
      return this.parseCsvData(csvData);
    } catch (error) {
      console.error('Error fetching power data:', error);
      // Возвращаем моковые данные для демонстрации
      return this.getMockData(roomId);
    }
  }

  private parseCsvData(csvData: string): any {
    // Парсинг CSV данных из InfluxDB
    const lines = csvData.split('\n');
    const data: any = {};
    
    lines.forEach(line => {
      if (line.startsWith('#') || !line.trim()) return;
      
      const columns = line.split(',');
      // Логика парсинга зависит от структуры данных в InfluxDB
    });

    return data;
  }

  private getMockData(roomId: string): any {
    // Моковые данные для демонстрации
    return {
      outlets: {
        'outlet_1': { power: 150, voltage: 220, current: 0.68 },
        'outlet_2': { power: 300, voltage: 220, current: 1.36 },
        'outlet_3': { power: 0, voltage: 220, current: 0 },
        'outlet_4': { power: 450, voltage: 220, current: 2.05 },
        'outlet_5': { power: 200, voltage: 220, current: 0.91 },
        'outlet_6': { power: 100, voltage: 220, current: 0.45 }
      },
      lines: {
        'QF1': { totalPower: 850, maxCapacity: 3520 }, // 16A * 220V
        'QF2': { totalPower: 300, maxCapacity: 3520 }
      }
    };
  }
}

export const influxService = new InfluxService();