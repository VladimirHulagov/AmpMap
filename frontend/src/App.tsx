import React, { useState, useEffect } from 'react';
import { Room } from './types/power';
import RoomPowerDiagram from './components/RoomPowerDiagram';
import AdminPanel from './components/admin/AdminPanel';
import { createMockRooms } from './utils/powerUtils';
import { adminService } from './services/adminService';

const App: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>('');
  const [isDark, setIsDark] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = () => {
    // Загружаем карты из админки
    const adminMaps = adminService.getAllMaps();
    
    if (adminMaps.length > 0) {
      // Конвертируем карты из админки в формат Room
      const convertedRooms: Room[] = adminMaps.map(map => ({
        id: map.id,
        name: map.name,
        width: map.width,
        height: map.height,
        svgLayout: map.svgContent,
        powerLines: map.powerLines.map(line => ({
          id: line.id,
          breakerNumber: line.breakerNumber,
          maxCapacity: line.maxCapacity,
          currentLoad: 0,
          color: '#3bb073',
          path: `M ${line.startPoint.x} ${line.startPoint.y}`,
          outlets: map.outlets
            .filter(outlet => outlet.lineId === line.id)
            .map(outlet => ({
              id: outlet.id,
              number: outlet.number,
              x: outlet.x,
              y: outlet.y,
              currentLoad: 0,
              maxLoad: outlet.maxLoad,
              voltage: 220,
              isActive: false
            }))
        }))
      }));
      
      setRooms(convertedRooms);
      if (convertedRooms.length > 0) {
        setActiveRoomId(convertedRooms[0].id);
      }
    } else {
      // Если нет карт в админке, используем моковые данные
      const mockRooms = createMockRooms();
      setRooms(mockRooms);
      if (mockRooms.length > 0) {
        setActiveRoomId(mockRooms[0].id);
      }
    }
  };
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleAdminClose = () => {
    setShowAdmin(false);
    loadRooms(); // Перезагружаем комнаты после закрытия админки
  };
  const activeRoom = rooms.find(room => room.id === activeRoomId);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--y-color-background)',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        backgroundColor: 'var(--y-color-background)',
        borderBottom: '1px solid var(--y-color-border)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ 
            color: 'var(--y-color-text-primary)', 
            fontSize: '20px',
            fontWeight: '600',
            margin: 0
          }}>
            Мониторинг питающих линий
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            padding: '6px 12px',
            backgroundColor: 'var(--y-color-success-container)',
            color: 'var(--y-color-success-primary-text)',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            ONLINE
          </div>

          <button 
            onClick={() => setShowAdmin(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--y-color-secondary)',
              color: 'var(--y-color-text-primary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ⚙️ Админка
          </button>

          <button 
            onClick={toggleTheme}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--y-color-accent)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Tabs */}
      {rooms.length > 0 && (
        <nav style={{
          display: 'flex',
          backgroundColor: 'var(--y-color-background-alternative)',
          borderBottom: '1px solid var(--y-color-border)',
          padding: '0 24px',
          overflowX: 'auto',
          flexShrink: 0
        }}>
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setActiveRoomId(room.id)}
              style={{
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeRoomId === room.id ? '2px solid var(--y-color-accent)' : '2px solid transparent',
                color: activeRoomId === room.id ? 'var(--y-color-accent)' : 'var(--y-color-text-secondary)',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {room.name}
            </button>
          ))}
        </nav>
      )}

      {/* Main Content */}
      <main style={{ 
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {activeRoom ? (
          <RoomPowerDiagram room={activeRoom} />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--y-color-text-secondary)',
            gap: '16px'
          }}>
            <p>Карты не найдены</p>
            <button
              onClick={() => setShowAdmin(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: 'var(--y-color-accent)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Создать первую карту
            </button>
          </div>
        )}
      </main>

      {/* Admin Panel */}
      {showAdmin && (
        <AdminPanel onClose={handleAdminClose} />
      )}
    </div>
  );
};

export default App;