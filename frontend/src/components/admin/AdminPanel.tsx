import React, { useState, useEffect } from 'react';
import { SVGMapConfig } from '../../types/admin';
import { adminService } from '../../services/adminService';
import MapEditor from './MapEditor';
import MapList from './MapList';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [maps, setMaps] = useState<SVGMapConfig[]>([]);
  const [selectedMap, setSelectedMap] = useState<SVGMapConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadMaps();
  }, []);

  const loadMaps = () => {
    const allMaps = adminService.getAllMaps();
    setMaps(allMaps);
  };

  const handleCreateNew = () => {
    setSelectedMap(null);
    setIsCreating(true);
  };

  const handleEditMap = (map: SVGMapConfig) => {
    setSelectedMap(map);
    setIsCreating(true);
  };

  const handleDeleteMap = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту карту?')) {
      adminService.deleteMap(id);
      loadMaps();
    }
  };

  const handleSaveMap = (map: SVGMapConfig) => {
    adminService.saveMap(map);
    loadMaps();
    setIsCreating(false);
    setSelectedMap(null);
  };

  const handleCancelEdit = () => {
    setIsCreating(false);
    setSelectedMap(null);
  };

  if (isCreating) {
    return (
      <MapEditor
        map={selectedMap}
        onSave={handleSaveMap}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
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
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: 'var(--y-color-background)',
        border: '1px solid var(--y-color-border)',
        borderRadius: '8px',
        width: '90vw',
        height: '90vh',
        maxWidth: '1200px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--y-color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            margin: 0,
            color: 'var(--y-color-text-primary)',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            Администрирование карт
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleCreateNew}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--y-color-accent)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Создать карту
            </button>
            <button
              onClick={onClose}
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
              Закрыть
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <MapList
            maps={maps}
            onEdit={handleEditMap}
            onDelete={handleDeleteMap}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;