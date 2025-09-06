import React, { useState, useEffect } from 'react';
import { Room } from './types/power';
import RoomPowerDiagram from './components/RoomPowerDiagram';
import { createMockRooms } from './utils/powerUtils';

const App: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>('');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Инициализация данных
    const mockRooms = createMockRooms();
    setRooms(mockRooms);
    if (mockRooms.length > 0) {
      setActiveRoomId(mockRooms[0].id);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const activeRoom = rooms.find(room => room.id === activeRoomId);

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: 'var(--y-color-background)',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        backgroundColor: 'var(--y-color-background)',
        borderBottom: '1px solid var(--y-color-border)'
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
      <nav style={{
        display: 'flex',
        backgroundColor: 'var(--y-color-background-alternative)',
        borderBottom: '1px solid var(--y-color-border)',
        padding: '0 24px',
        overflowX: 'auto'
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

      {/* Main Content */}
      <main style={{ 
        height: 'calc(100vh - 120px)',
        overflow: 'hidden'
      }}>
        {activeRoom ? (
          <RoomPowerDiagram room={activeRoom} />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--y-color-text-secondary)'
          }}>
            Выберите помещение для просмотра
          </div>
        )}
      </main>
    </div>
  );
};

export default App;