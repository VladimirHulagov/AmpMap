import React from 'react';
import { SVGMapConfig } from '../../types/admin';

interface MapListProps {
  maps: SVGMapConfig[];
  onEdit: (map: SVGMapConfig) => void;
  onDelete: (id: string) => void;
}

const MapList: React.FC<MapListProps> = ({ maps, onEdit, onDelete }) => {
  if (maps.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: 'var(--y-color-text-secondary)'
      }}>
        <p>Карты не найдены. Создайте первую карту.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {maps.map((map) => (
          <div
            key={map.id}
            style={{
              border: '1px solid var(--y-color-border)',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: 'var(--y-color-background-alternative)'
            }}
          >
            <h3 style={{
              margin: '0 0 12px 0',
              color: 'var(--y-color-text-primary)',
              fontSize: '16px'
            }}>
              {map.name}
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: 'var(--y-color-text-secondary)'
              }}>
                <span>Размер:</span>
                <span>{map.width} × {map.height}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: 'var(--y-color-text-secondary)'
              }}>
                <span>Розетки:</span>
                <span>{map.outlets?.length || 0}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: 'var(--y-color-text-secondary)'
              }}>
                <span>Линии:</span>
                <span>{map.powerLines?.length || 0}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: 'var(--y-color-text-secondary)'
              }}>
                <span>Обновлено:</span>
                <span>{new Date(map.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => onEdit(map)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: 'var(--y-color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Редактировать
              </button>
              
              <button
                onClick={() => onDelete(map.id)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--y-color-error)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapList;