import React, { useState, useEffect } from 'react';
import { Room, PowerOutlet } from '../types/power';
import PowerLineComponent from './PowerLineComponent';
import { influxService } from '../services/influxService';
import { calculateLineColor } from '../utils/powerUtils';

interface RoomPowerDiagramProps {
  room: Room;
}

const RoomPowerDiagram: React.FC<RoomPowerDiagramProps> = ({ room: initialRoom }) => {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [selectedOutlet, setSelectedOutlet] = useState<PowerOutlet | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const updatePowerData = async () => {
      try {
        const powerData = await influxService.getPowerData(room.id);
        
        // Обновляем данные о нагрузке
        const updatedPowerLines = room.powerLines.map(line => {
          const lineData = powerData.lines[line.breakerNumber];
          if (lineData) {
            const updatedOutlets = line.outlets.map(outlet => {
              const outletData = powerData.outlets[outlet.id];
              if (outletData) {
                return {
                  ...outlet,
                  currentLoad: outletData.power,
                  voltage: outletData.voltage,
                  isActive: outletData.power > 0
                };
              }
              return outlet;
            });

            return {
              ...line,
              outlets: updatedOutlets,
              currentLoad: lineData.totalPower,
              color: calculateLineColor(lineData.totalPower, line.maxCapacity)
            };
          }
          return line;
        });

        setRoom(prev => ({
          ...prev,
          powerLines: updatedPowerLines
        }));
        
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error updating power data:', error);
      }
    };

    // Обновляем данные каждые 5 секунд
    const interval = setInterval(updatePowerData, 5000);
    updatePowerData(); // Первоначальное обновление

    return () => clearInterval(interval);
  }, [room.id]);

  const handleOutletClick = (outlet: PowerOutlet) => {
    setSelectedOutlet(outlet);
  };

  const closeOutletDetails = () => {
    setSelectedOutlet(null);
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'var(--y-color-background)'
    }}>
      {/* Заголовок с информацией об обновлении */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--y-color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{
          margin: 0,
          color: 'var(--y-color-text-primary)',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          {room.name}
        </h2>
        <span style={{
          color: 'var(--y-color-text-secondary)',
          fontSize: '12px'
        }}>
          Обновлено: {lastUpdated.toLocaleTimeString()}
        </span>
      </div>

      {/* SVG диаграмма */}
      <div style={{ 
        flex: 1, 
        padding: '24px',
        overflow: 'auto'
      }}>
        <svg
          width={room.width}
          height={room.height}
          viewBox={`0 0 ${room.width} ${room.height}`}
          style={{
            border: '1px solid var(--y-color-border)',
            borderRadius: '4px',
            backgroundColor: 'var(--y-color-background)'
          }}
        >
          {/* Базовая разметка помещения */}
          <g dangerouslySetInnerHTML={{ __html: room.svgLayout }} />
          
          {/* Линии электропитания и розетки */}
          {room.powerLines.map((powerLine) => (
            <PowerLineComponent
              key={powerLine.id}
              powerLine={powerLine}
              onOutletClick={handleOutletClick}
            />
          ))}
        </svg>
      </div>

      {/* Модальное окно с деталями розетки */}
      {selectedOutlet && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--y-color-background)',
            border: '1px solid var(--y-color-border)',
            borderRadius: '8px',
            padding: '24px',
            minWidth: '300px',
            maxWidth: '400px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                margin: 0,
                color: 'var(--y-color-text-primary)',
                fontSize: '16px'
              }}>
                Розетка №{selectedOutlet.number}
              </h3>
              <button
                onClick={closeOutletDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: 'var(--y-color-text-secondary)'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--y-color-text-secondary)' }}>Текущая нагрузка:</span>
                <span style={{ color: 'var(--y-color-text-primary)', fontWeight: '500' }}>
                  {selectedOutlet.currentLoad} Вт
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--y-color-text-secondary)' }}>Напряжение:</span>
                <span style={{ color: 'var(--y-color-text-primary)', fontWeight: '500' }}>
                  {selectedOutlet.voltage} В
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--y-color-text-secondary)' }}>Ток:</span>
                <span style={{ color: 'var(--y-color-text-primary)', fontWeight: '500' }}>
                  {(selectedOutlet.currentLoad / selectedOutlet.voltage).toFixed(2)} А
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--y-color-text-secondary)' }}>Статус:</span>
                <span style={{ 
                  color: selectedOutlet.isActive ? 'var(--y-color-success)' : 'var(--y-color-text-tertiary)',
                  fontWeight: '500'
                }}>
                  {selectedOutlet.isActive ? 'Активна' : 'Неактивна'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPowerDiagram;