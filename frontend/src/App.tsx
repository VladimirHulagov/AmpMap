import React, { useState } from 'react';
import {
  SearchOutlined,
  UserOutlined,
  WarningOutlined,
  LockOutlined,
  FileTextOutlined,
  ToolOutlined,
  BulbOutlined,
  BellOutlined,
  MessageOutlined,
  PoweroffOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  DownOutlined,
  SaveOutlined,
  RocketOutlined
} from '@ant-design/icons';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('INFO');
  const [isDark, setIsDark] = useState(false);
  const [noteValue, setNoteValue] = useState('');
  const [isNoteEditing, setIsNoteEditing] = useState(false);
  const [savedNote, setSavedNote] = useState('');
  const [noteEditedBy, setNoteEditedBy] = useState('');
  const [iconStates, setIconStates] = useState({
    warning: false,
    lock: false,
    document: false,
    tool: false,
    bulb: false,
    chart: true,
    thunder: true
  });
  
  const username = 'DEMO'; // Получаем из контекста пользователя

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  };

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNoteValue(value);
    
    if (value.length > 0 && !isNoteEditing) {
      setIsNoteEditing(true);
      setNoteEditedBy(`edited by ${username}`);
    } else if (value.length === 0) {
      setIsNoteEditing(false);
      setNoteEditedBy('');
    }
  };

  const handleNoteKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSavedNote(noteValue);
      setIsNoteEditing(false);
      setNoteEditedBy('');
      e.currentTarget.blur();
    }
  };

  const handleNoteFocus = () => {
    if (noteValue.length > 0) {
      setIsNoteEditing(true);
      setNoteEditedBy(`edited by ${username}`);
    }
  };

  const handleNoteBlur = () => {
    if (noteValue.length === 0) {
      setIsNoteEditing(false);
      setNoteEditedBy('');
    }
  };

  const toggleIconState = (iconKey: string) => {
    setIconStates(prev => ({
      ...prev,
      [iconKey]: !prev[iconKey]
    }));
  };

  const getIconColor = (iconKey: string, isHealthOrPower = false) => {
    const isActive = iconStates[iconKey as keyof typeof iconStates];
    if (isActive) {
      return isHealthOrPower ? 'var(--y-color-success)' : 'var(--y-color-accent)';
    }
    return 'var(--y-color-icon)';
  };

  const tabs = [
    'INFO',
    'BOOKING',
    'SW CONFIGURATION', 
    'HW AUTOMATION',
    'INVENTORY',
    'USER ACTION HISTORY'
  ];

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
          <span style={{ 
            color: 'var(--y-color-accent)', 
            fontSize: '14px',
            textDecoration: 'none'
          }}>
            Devices
          </span>
          <span style={{ color: 'var(--y-color-text-secondary)' }}>›</span>
          <span style={{ 
            color: 'var(--y-color-text-primary)', 
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Q123456789
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search device"
              style={{
                padding: '6px 12px 6px 32px',
                backgroundColor: 'var(--y-color-control-background)',
                border: '1px solid var(--y-color-control-border)',
                borderRadius: '4px',
                color: 'var(--y-color-control-text)',
                fontSize: '14px',
                width: '200px'
              }}
            />
            <span style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--y-color-control-placeholder)',
              fontSize: '14px'
            }}>
              <SearchOutlined />
            </span>
          </div>
          
          <button style={{
            padding: '6px 12px',
            backgroundColor: 'var(--y-color-control-background)',
            border: '1px solid var(--y-color-control-border)',
            borderRadius: '4px',
            color: 'var(--y-color-control-text)',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            CTRL
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <UserOutlined style={{ fontSize: '16px', color: 'var(--y-color-icon)' }} />
            <span style={{ 
              color: 'var(--y-color-text-primary)', 
              fontSize: '14px',
              fontWeight: '500'
            }}>
              DEMO
            </span>
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
        padding: '0 24px'
      }}>
        {tabs.map((tab, index) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--y-color-accent)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--y-color-accent)' : 'var(--y-color-text-secondary)',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              textTransform: 'uppercase',
              position: 'relative'
            }}
          >
            {tab}
            {index === 1 && (
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '6px',
                height: '6px',
                backgroundColor: 'var(--y-color-error)',
                borderRadius: '50%'
              }}></span>
            )}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main style={{ padding: '24px' }}>
        <div style={{ maxWidth: '800px' }}>
          {/* Device Header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '600',
              color: 'var(--y-color-text-primary)',
              margin: '0 0 8px 0'
            }}>
              Q123456789
            </h1>
            <p style={{
              color: 'var(--y-color-text-secondary)',
              margin: '0 0 16px 0',
              fontSize: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <input
                type="text"
                placeholder="Add a note..."
                value={noteValue}
                onChange={handleNoteChange}
                onKeyPress={handleNoteKeyPress}
                onFocus={handleNoteFocus}
                onBlur={handleNoteBlur}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--y-color-text-primary)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  padding: '0',
                  width: '100%'
                }}
              />
              {isNoteEditing && (
                <span style={{
                  color: 'var(--y-color-text-tertiary)',
                  fontSize: '12px',
                  fontStyle: 'italic'
                }}>
                  {noteEditedBy}
                </span>
              )}
              {savedNote && !isNoteEditing && (
                <span style={{
                  color: 'var(--y-color-success)',
                  fontSize: '12px',
                  fontStyle: 'italic'
                }}>
                  Note saved
                </span>
              )}
            </p>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {[
                { icon: <WarningOutlined />, key: 'warning', isHealthOrPower: false },
                { icon: <LockOutlined />, key: 'lock', isHealthOrPower: false },
                { icon: <FileTextOutlined />, key: 'document', isHealthOrPower: false },
                { icon: <ToolOutlined />, key: 'tool', isHealthOrPower: false },
                { icon: <BulbOutlined />, key: 'bulb', isHealthOrPower: false },
                { icon: <BarChartOutlined />, key: 'chart', isHealthOrPower: true },
                { icon: <ThunderboltOutlined />, key: 'thunder', isHealthOrPower: true }
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => toggleIconState(item.key)}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: iconStates[item.key as keyof typeof iconStates] 
                      ? (item.isHealthOrPower ? 'var(--y-color-success)' : 'var(--y-color-accent)')
                      : 'var(--y-color-control-background)',
                    border: '1px solid var(--y-color-control-border)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: iconStates[item.key as keyof typeof iconStates] 
                      ? 'white' 
                      : 'var(--y-color-icon)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  {item.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Device Information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Basic Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>Device Type</span>
              <span style={{ color: 'var(--y-color-text-primary)', fontSize: '14px', fontWeight: '500' }}>
                SUPERSERVER_Q2220_G10
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>Parent</span>
              <span style={{ color: 'var(--y-color-text-tertiary)', fontSize: '14px' }}>null</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>Location</span>
              <span style={{ color: 'var(--y-color-accent)', fontSize: '14px' }}>R1234.5 / U01F</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>WMS cell</span>
              <span style={{ color: 'var(--y-color-text-primary)', fontSize: '14px' }}>S-SEL-1-234</span>
            </div>

            {/* Version Info with Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>BMC version</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--y-color-text-primary)', fontSize: '14px' }}>bmc-1.0.0</span>
                <button style={{
                  padding: '4px 12px',
                  backgroundColor: 'var(--y-color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <SaveOutlined style={{ fontSize: '10px' }} />
                  CHANGE
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>BIOS version</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--y-color-text-primary)', fontSize: '14px' }}>uefi-1.0.0</span>
                <button style={{
                  padding: '4px 12px',
                  backgroundColor: 'var(--y-color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <SaveOutlined style={{ fontSize: '10px' }} />
                  CHANGE
                </button>
              </div>
            </div>

            {/* Network Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>BMC dedicated</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--y-color-text-tertiary)', fontSize: '12px' }}>AA:BB:CC:DD:EE:01</span>
                <span style={{ color: 'var(--y-color-accent)', fontSize: '14px' }}>192.168.0.1</span>
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: 'var(--y-color-success)',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: '500'
                }}>
                  T-SW-R0123-01: 1/1/1
                </span>
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: 'var(--y-color-control-background)',
                  color: 'var(--y-color-text-secondary)',
                  borderRadius: '12px',
                  fontSize: '10px',
                  border: '1px solid var(--y-color-control-border)'
                }}>
                  VLAN_1010
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>BMC shared</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--y-color-text-tertiary)', fontSize: '12px' }}>AA:BB:CC:DD:EE:02</span>
                <span style={{ color: 'var(--y-color-accent)', fontSize: '14px' }}>192.168.0.2</span>
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: 'var(--y-color-text-secondary)',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: '500'
                }}>
                  T-SW-R0123-01: 1/1/2
                </span>
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: 'var(--y-color-control-background)',
                  color: 'var(--y-color-text-secondary)',
                  borderRadius: '12px',
                  fontSize: '10px',
                  border: '1px solid var(--y-color-control-border)'
                }}>
                  VLAN_1010
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>Host dedicated</span>
              <span style={{ color: 'var(--y-color-text-tertiary)', fontSize: '14px' }}>None</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>Host shared</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--y-color-text-tertiary)', fontSize: '12px' }}>AA:BB:CC:DD:EE:03</span>
                <span style={{ color: 'var(--y-color-accent)', fontSize: '14px' }}>192.168.0.3</span>
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: 'var(--y-color-text-secondary)',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: '500'
                }}>
                  T-SW-R0123-01: 1/1/3
                </span>
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: 'var(--y-color-control-background)',
                  color: 'var(--y-color-text-secondary)',
                  borderRadius: '12px',
                  fontSize: '10px',
                  border: '1px solid var(--y-color-control-border)'
                }}>
                  VLAN_1010
                </span>
              </div>
            </div>

            {/* PSU Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>PSU0</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: 'var(--y-color-success)',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  ONLINE
                </span>
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: 'var(--y-color-control-background)',
                  color: 'var(--y-color-text-secondary)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  border: '1px solid var(--y-color-control-border)'
                }}>
                  PDU2 OUTLET2
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>PSU1</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: 'var(--y-color-success)',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  ONLINE
                </span>
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: 'var(--y-color-control-background)',
                  color: 'var(--y-color-text-secondary)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  border: '1px solid var(--y-color-control-border)'
                }}>
                  PDU2 OUTLET3
                </span>
              </div>
            </div>

            {/* Automation Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center', marginTop: '24px' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>Automation</span>
              <span></span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>Status</span>
              <span style={{ color: 'var(--y-color-accent)', fontSize: '14px' }}>
                Kiwi Test Run 123 [ lavajob-123 ]
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>Autotests</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--y-color-control-background)',
                  color: 'var(--y-color-text-secondary)',
                  border: '1px solid var(--y-color-control-border)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}>
                  ANY
                </button>
                <button style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--y-color-control-background)',
                  color: 'var(--y-color-text-secondary)',
                  border: '1px solid var(--y-color-control-border)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}>
                  NIGHTLY
                </button>
                <button style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--y-color-control-background)',
                  color: 'var(--y-color-text-secondary)',
                  border: '1px solid var(--y-color-control-border)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}>
                  TARGETED
                </button>
                <button style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--y-color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  OFF
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>Health Check</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button style={{
                  padding: '6px 16px',
                  backgroundColor: 'var(--y-color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  RUN
                </button>
                <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>
                  successfully finished 4h ago
                </span>
              </div>
            </div>

            {/* Device Control Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center', marginTop: '24px' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>Device Control</span>
              <span></span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>Boot From</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--y-color-text-tertiary)', fontSize: '14px' }}>
                  SELECT BOOT DEVICE
                </span>
                <button style={{
                  padding: '6px 16px',
                  backgroundColor: 'var(--y-color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <PoweroffOutlined style={{ fontSize: '12px' }} />
                  BOOT
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--y-color-text-secondary)', fontSize: '14px' }}>Deploy OS</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--y-color-control-background)',
                  border: '1px solid var(--y-color-control-border)',
                  borderRadius: '4px',
                  color: 'var(--y-color-text-secondary)',
                  fontSize: '14px',
                  minWidth: '150px',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '16px'
                }}>
                  <option>CHOOSE AVAILABLE OS</option>
                </select>
                <select style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--y-color-control-background)',
                  border: '1px solid var(--y-color-control-border)',
                  borderRadius: '4px',
                  color: 'var(--y-color-text-secondary)',
                  fontSize: '14px',
                  minWidth: '150px',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '16px'
                }}>
                  <option>SELECT TARGET DEVICE</option>
                </select>
                <button style={{
                  padding: '6px 16px',
                  backgroundColor: 'var(--y-color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <RocketOutlined style={{ fontSize: '12px' }} />
                  DEPLOY
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;