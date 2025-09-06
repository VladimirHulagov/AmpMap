import React, { useState, useRef, useEffect } from 'react';
import { SVGMapConfig, OutletConfig, PowerLineConfig } from '../../types/admin';
import { adminService } from '../../services/adminService';

interface MapEditorProps {
  map: SVGMapConfig | null;
  onSave: (map: SVGMapConfig) => void;
  onCancel: () => void;
}

const MapEditor: React.FC<MapEditorProps> = ({ map, onSave, onCancel }) => {
  const [name, setName] = useState(map?.name || '');
  const [svgContent, setSvgContent] = useState(map?.svgContent || '');
  const [outlets, setOutlets] = useState<OutletConfig[]>(map?.outlets || []);
  const [powerLines, setPowerLines] = useState<PowerLineConfig[]>(map?.powerLines || []);
  const [selectedTool, setSelectedTool] = useState<'outlet' | 'line' | 'select'>('select');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 800, height: 600 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgContent) {
      const dimensions = adminService.parseSVGDimensions(svgContent);
      setSvgDimensions(dimensions);
    }
  }, [svgContent]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (adminService.validateSVG(content)) {
          setSvgContent(content);
        } else {
          alert('Некорректный SVG файл');
        }
      };
      reader.readAsText(file);
    } else {
      alert('Пожалуйста, выберите SVG файл');
    }
  };

  const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * svgDimensions.width;
    const y = ((event.clientY - rect.top) / rect.height) * svgDimensions.height;

    if (selectedTool === 'outlet') {
      const newOutlet: OutletConfig = {
        id: adminService.generateId(),
        number: (outlets.length + 1).toString(),
        x: Math.round(x),
        y: Math.round(y),
        influxTag: '',
        maxLoad: 3520,
        lineId: ''
      };
      setOutlets([...outlets, newOutlet]);
    } else if (selectedTool === 'line') {
      const newLine: PowerLineConfig = {
        id: adminService.generateId(),
        breakerNumber: `QF${powerLines.length + 1}`,
        maxCapacity: 3520,
        influxTag: '',
        startPoint: { x: Math.round(x), y: Math.round(y) }
      };
      setPowerLines([...powerLines, newLine]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Введите название карты');
      return;
    }
    if (!svgContent.trim()) {
      alert('Загрузите SVG файл');
      return;
    }

    const mapConfig: SVGMapConfig = {
      id: map?.id || adminService.generateId(),
      name: name.trim(),
      svgContent,
      width: svgDimensions.width,
      height: svgDimensions.height,
      outlets,
      powerLines,
      createdAt: map?.createdAt || new Date(),
      updatedAt: new Date()
    };

    onSave(mapConfig);
  };

  const removeOutlet = (id: string) => {
    setOutlets(outlets.filter(o => o.id !== id));
  };

  const removePowerLine = (id: string) => {
    setPowerLines(powerLines.filter(l => l.id !== id));
  };

  const updateOutlet = (id: string, updates: Partial<OutletConfig>) => {
    setOutlets(outlets.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const updatePowerLine = (id: string, updates: Partial<PowerLineConfig>) => {
    setPowerLines(powerLines.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'var(--y-color-background)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 2000
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--y-color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <h2 style={{
          margin: 0,
          color: 'var(--y-color-text-primary)',
          fontSize: '18px'
        }}>
          {map ? 'Редактирование карты' : 'Создание карты'}
        </h2>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--y-color-success)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Сохранить
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--y-color-secondary)',
              color: 'var(--y-color-text-primary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Отмена
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Left Panel */}
        <div style={{
          width: '300px',
          borderRight: '1px solid var(--y-color-border)',
          padding: '20px',
          overflow: 'auto',
          flexShrink: 0
        }}>
          {/* Basic Settings */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 12px 0',
              color: 'var(--y-color-text-primary)',
              fontSize: '16px'
            }}>
              Основные настройки
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '4px',
                color: 'var(--y-color-text-secondary)',
                fontSize: '12px'
              }}>
                Название карты
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--y-color-border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--y-color-control-background)',
                  color: 'var(--y-color-text-primary)',
                  fontSize: '14px'
                }}
                placeholder="Например: R15345 - Шумка 2.0"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '4px',
                color: 'var(--y-color-text-secondary)',
                fontSize: '12px'
              }}>
                SVG файл
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg"
                onChange={handleFileUpload}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--y-color-border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--y-color-control-background)',
                  color: 'var(--y-color-text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Tools */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 12px 0',
              color: 'var(--y-color-text-primary)',
              fontSize: '16px'
            }}>
              Инструменты
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { key: 'select', label: 'Выбор' },
                { key: 'outlet', label: 'Добавить розетку' },
                { key: 'line', label: 'Добавить линию' }
              ].map(tool => (
                <button
                  key={tool.key}
                  onClick={() => setSelectedTool(tool.key as any)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: selectedTool === tool.key ? 'var(--y-color-accent)' : 'var(--y-color-secondary)',
                    color: selectedTool === tool.key ? 'white' : 'var(--y-color-text-primary)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textAlign: 'left'
                  }}
                >
                  {tool.label}
                </button>
              ))}
            </div>
          </div>

          {/* Elements List */}
          <div>
            <h3 style={{
              margin: '0 0 12px 0',
              color: 'var(--y-color-text-primary)',
              fontSize: '16px'
            }}>
              Элементы
            </h3>
            
            {/* Outlets */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{
                margin: '0 0 8px 0',
                color: 'var(--y-color-text-secondary)',
                fontSize: '14px'
              }}>
                Розетки ({outlets.length})
              </h4>
              {outlets.map(outlet => (
                <div
                  key={outlet.id}
                  style={{
                    padding: '8px',
                    border: '1px solid var(--y-color-border)',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    backgroundColor: 'var(--y-color-background-alternative)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '500' }}>№{outlet.number}</span>
                    <button
                      onClick={() => removeOutlet(outlet.id)}
                      style={{
                        padding: '2px 6px',
                        backgroundColor: 'var(--y-color-error)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <input
                    type="text"
                    value={outlet.influxTag}
                    onChange={(e) => updateOutlet(outlet.id, { influxTag: e.target.value })}
                    placeholder="InfluxDB тег"
                    style={{
                      width: '100%',
                      padding: '4px',
                      border: '1px solid var(--y-color-border)',
                      borderRadius: '2px',
                      fontSize: '11px'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Power Lines */}
            <div>
              <h4 style={{
                margin: '0 0 8px 0',
                color: 'var(--y-color-text-secondary)',
                fontSize: '14px'
              }}>
                Линии ({powerLines.length})
              </h4>
              {powerLines.map(line => (
                <div
                  key={line.id}
                  style={{
                    padding: '8px',
                    border: '1px solid var(--y-color-border)',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    backgroundColor: 'var(--y-color-background-alternative)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '500' }}>{line.breakerNumber}</span>
                    <button
                      onClick={() => removePowerLine(line.id)}
                      style={{
                        padding: '2px 6px',
                        backgroundColor: 'var(--y-color-error)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <input
                    type="text"
                    value={line.influxTag}
                    onChange={(e) => updatePowerLine(line.id, { influxTag: e.target.value })}
                    placeholder="InfluxDB тег"
                    style={{
                      width: '100%',
                      padding: '4px',
                      border: '1px solid var(--y-color-border)',
                      borderRadius: '2px',
                      fontSize: '11px'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SVG Canvas */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflow: 'auto',
          backgroundColor: 'var(--y-color-background-alternative)'
        }}>
          {svgContent ? (
            <div style={{
              border: '1px solid var(--y-color-border)',
              borderRadius: '4px',
              backgroundColor: 'white',
              display: 'inline-block',
              position: 'relative'
            }}>
              <svg
                ref={svgRef}
                width="100%"
                height="auto"
                viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
                style={{ cursor: selectedTool !== 'select' ? 'crosshair' : 'default' }}
                onClick={handleSvgClick}
                dangerouslySetInnerHTML={{ __html: svgContent.replace(/<svg[^>]*>|<\/svg>/g, '') }}
              />
              
              {/* Overlay for outlets and lines */}
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none'
                }}
                viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
              >
                {/* Render outlets */}
                {outlets.map(outlet => (
                  <g key={outlet.id}>
                    <circle
                      cx={outlet.x}
                      cy={outlet.y}
                      r="12"
                      fill="var(--y-color-success)"
                      stroke="white"
                      strokeWidth="2"
                    />
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
                  </g>
                ))}
                
                {/* Render power lines */}
                {powerLines.map(line => (
                  <g key={line.id}>
                    <circle
                      cx={line.startPoint.x}
                      cy={line.startPoint.y}
                      r="8"
                      fill="var(--y-color-accent)"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <text
                      x={line.startPoint.x}
                      y={line.startPoint.y - 15}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill="var(--y-color-text-primary)"
                    >
                      {line.breakerNumber}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '400px',
              border: '2px dashed var(--y-color-border)',
              borderRadius: '8px',
              color: 'var(--y-color-text-secondary)'
            }}>
              Загрузите SVG файл для начала работы
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapEditor;