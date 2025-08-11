import React, { useState } from 'react'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      {/* Theme Toggle */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
        <button 
          onClick={toggleTheme}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--y-color-accent)',
            color: 'var(--y-color-on-accent)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Switch to {theme === 'light' ? 'Dark' : 'Light'} Theme
        </button>
      </div>

      <h1 style={{ 
        color: 'var(--y-color-text-primary)', 
        textAlign: 'center',
        marginBottom: '40px',
        fontSize: '32px'
      }}>
        TestY Style Showcase
      </h1>

      {/* Color Palette */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: 'var(--y-color-text-primary)', marginBottom: '20px' }}>Color Palette</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {/* Primary Colors */}
          <div>
            <h3 style={{ color: 'var(--y-color-text-secondary)', marginBottom: '10px' }}>Primary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ 
                backgroundColor: 'var(--y-color-background)', 
                padding: '10px', 
                border: '1px solid var(--y-color-border)',
                color: 'var(--y-color-text-primary)'
              }}>
                Background
              </div>
              <div style={{ 
                backgroundColor: 'var(--y-color-background-alternative)', 
                padding: '10px',
                color: 'var(--y-color-text-primary)'
              }}>
                Background Alt
              </div>
            </div>
          </div>

          {/* Accent Colors */}
          <div>
            <h3 style={{ color: 'var(--y-color-text-secondary)', marginBottom: '10px' }}>Accent</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ 
                backgroundColor: 'var(--y-color-accent)', 
                padding: '10px',
                color: 'var(--y-color-on-accent)'
              }}>
                Accent
              </div>
              <div style={{ 
                backgroundColor: 'var(--y-color-accent-hover)', 
                padding: '10px',
                color: 'var(--y-color-on-accent)'
              }}>
                Accent Hover
              </div>
            </div>
          </div>

          {/* Status Colors */}
          <div>
            <h3 style={{ color: 'var(--y-color-text-secondary)', marginBottom: '10px' }}>Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ 
                backgroundColor: 'var(--y-color-success)', 
                padding: '10px',
                color: 'var(--y-color-on-success)'
              }}>
                Success
              </div>
              <div style={{ 
                backgroundColor: 'var(--y-color-error)', 
                padding: '10px',
                color: 'var(--y-color-on-error)'
              }}>
                Error
              </div>
              <div style={{ 
                backgroundColor: 'var(--y-color-warning)', 
                padding: '10px',
                color: 'var(--y-color-on-warning)'
              }}>
                Warning
              </div>
            </div>
          </div>

          {/* Graph Colors */}
          <div>
            <h3 style={{ color: 'var(--y-color-text-secondary)', marginBottom: '10px' }}>Graph</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ backgroundColor: 'var(--y-graph-primary)', padding: '10px', color: 'white' }}>
                Primary
              </div>
              <div style={{ backgroundColor: 'var(--y-graph-secondary)', padding: '10px', color: 'white' }}>
                Secondary
              </div>
              <div style={{ backgroundColor: 'var(--y-graph-tertiary)', padding: '10px', color: 'white' }}>
                Tertiary
              </div>
              <div style={{ backgroundColor: 'var(--y-graph-fourth)', padding: '10px', color: 'white' }}>
                Fourth
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: 'var(--y-color-text-primary)', marginBottom: '20px' }}>Typography</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h1 style={{ color: 'var(--y-color-text-primary)', margin: 0 }}>Heading 1 - Primary Text</h1>
          <h2 style={{ color: 'var(--y-color-text-primary)', margin: 0 }}>Heading 2 - Primary Text</h2>
          <h3 style={{ color: 'var(--y-color-text-primary)', margin: 0 }}>Heading 3 - Primary Text</h3>
          <h4 style={{ color: 'var(--y-color-text-primary)', margin: 0 }}>Heading 4 - Primary Text</h4>
          <p style={{ color: 'var(--y-color-text-primary)', margin: 0 }}>Body text - Primary</p>
          <p style={{ color: 'var(--y-color-text-secondary)', margin: 0 }}>Body text - Secondary</p>
          <p style={{ color: 'var(--y-color-text-tertiary)', margin: 0 }}>Body text - Tertiary</p>
          <a href="#" style={{ color: 'var(--y-color-link)' }}>Link text</a>
        </div>
      </section>

      {/* Controls */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: 'var(--y-color-text-primary)', marginBottom: '20px' }}>Controls</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          
          {/* Buttons */}
          <div>
            <h3 style={{ color: 'var(--y-color-text-secondary)', marginBottom: '10px' }}>Buttons</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button style={{
                backgroundColor: 'var(--y-color-accent)',
                color: 'var(--y-color-on-accent)',
                border: '1px solid var(--y-сolor-accent-border)',
                padding: '8px 16px',
                borderRadius: '2px',
                cursor: 'pointer'
              }}>
                Primary Button
              </button>
              <button style={{
                backgroundColor: 'var(--y-color-secondary)',
                color: 'var(--y-color-on-secondary)',
                border: '1px solid var(--y-сolor-secondary-border)',
                padding: '8px 16px',
                borderRadius: '2px',
                cursor: 'pointer'
              }}>
                Secondary Button
              </button>
              <button style={{
                backgroundColor: 'transparent',
                color: 'var(--y-color-accent)',
                border: '1px solid var(--y-color-accent)',
                padding: '8px 16px',
                borderRadius: '2px',
                cursor: 'pointer'
              }}>
                Outline Button
              </button>
            </div>
          </div>

          {/* Form Controls */}
          <div>
            <h3 style={{ color: 'var(--y-color-text-secondary)', marginBottom: '10px' }}>Form Controls</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Input field"
                style={{
                  backgroundColor: 'var(--y-color-control-background)',
                  border: '1px solid var(--y-color-control-border)',
                  padding: '8px 12px',
                  borderRadius: '2px',
                  color: 'var(--y-color-control-text)'
                }}
              />
              <textarea 
                placeholder="Textarea"
                rows={3}
                style={{
                  backgroundColor: 'var(--y-color-control-background)',
                  border: '1px solid var(--y-color-control-border)',
                  padding: '8px 12px',
                  borderRadius: '2px',
                  color: 'var(--y-color-control-text)',
                  resize: 'vertical'
                }}
              />
              <select style={{
                backgroundColor: 'var(--y-color-control-background)',
                border: '1px solid var(--y-color-control-border)',
                padding: '8px 12px',
                borderRadius: '2px',
                color: 'var(--y-color-control-text)'
              }}>
                <option>Select option</option>
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 style={{ color: 'var(--y-color-text-secondary)', marginBottom: '10px' }}>Tags</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{
                backgroundColor: 'var(--y-color-tag-pink-background)',
                color: 'var(--y-color-tag-colored-text)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                Pink Tag
              </span>
              <span style={{
                backgroundColor: 'var(--y-color-tag-yellow-background)',
                color: 'var(--y-color-tag-colored-text)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                Yellow Tag
              </span>
              <span style={{
                backgroundColor: 'var(--y-color-tag-green-background)',
                color: 'var(--y-color-tag-colored-text)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                Green Tag
              </span>
              <span style={{
                backgroundColor: 'var(--y-color-tag-light-blue-background)',
                color: 'var(--y-color-tag-colored-text)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                Blue Tag
              </span>
              <span style={{
                backgroundColor: 'var(--y-color-tag-purple-background)',
                color: 'var(--y-color-tag-colored-text)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                Purple Tag
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Data Display */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: 'var(--y-color-text-primary)', marginBottom: '20px' }}>Data Display</h2>
        
        {/* Table */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--y-color-text-secondary)', marginBottom: '10px' }}>Table</h3>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            border: '1px solid var(--y-color-border)'
          }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--y-color-datatable-header-background)' }}>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left',
                  borderBottom: '1px solid var(--y-color-border)',
                  color: 'var(--y-color-text-primary)'
                }}>
                  Name
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left',
                  borderBottom: '1px solid var(--y-color-border)',
                  color: 'var(--y-color-text-primary)'
                }}>
                  Status
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left',
                  borderBottom: '1px solid var(--y-color-border)',
                  color: 'var(--y-color-text-primary)'
                }}>
                  Progress
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: 'var(--y-color-background)' }}>
                <td style={{ 
                  padding: '12px',
                  borderBottom: '1px solid var(--y-color-border)',
                  color: 'var(--y-color-text-primary)'
                }}>
                  Test Case 1
                </td>
                <td style={{ 
                  padding: '12px',
                  borderBottom: '1px solid var(--y-color-border)'
                }}>
                  <span style={{
                    backgroundColor: 'var(--y-color-success)',
                    color: 'var(--y-color-on-success)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    PASSED
                  </span>
                </td>
                <td style={{ 
                  padding: '12px',
                  borderBottom: '1px solid var(--y-color-border)',
                  color: 'var(--y-color-text-primary)'
                }}>
                  100%
                </td>
              </tr>
              <tr style={{ backgroundColor: 'var(--y-color-background-alternative)' }}>
                <td style={{ 
                  padding: '12px',
                  borderBottom: '1px solid var(--y-color-border)',
                  color: 'var(--y-color-text-primary)'
                }}>
                  Test Case 2
                </td>
                <td style={{ 
                  padding: '12px',
                  borderBottom: '1px solid var(--y-color-border)'
                }}>
                  <span style={{
                    backgroundColor: 'var(--y-color-error)',
                    color: 'var(--y-color-on-error)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    FAILED
                  </span>
                </td>
                <td style={{ 
                  padding: '12px',
                  borderBottom: '1px solid var(--y-color-border)',
                  color: 'var(--y-color-text-primary)'
                }}>
                  75%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cards */}
        <div>
          <h3 style={{ color: 'var(--y-color-text-secondary)', marginBottom: '10px' }}>Cards</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div style={{
              backgroundColor: 'var(--y-color-background)',
              border: '1px solid var(--y-color-border)',
              borderRadius: '4px',
              padding: '16px'
            }}>
              <h4 style={{ color: 'var(--y-color-text-primary)', margin: '0 0 8px 0' }}>Card Title</h4>
              <p style={{ color: 'var(--y-color-text-secondary)', margin: '0 0 12px 0' }}>
                This is a sample card with some content to demonstrate the styling.
              </p>
              <button style={{
                backgroundColor: 'var(--y-color-accent)',
                color: 'var(--y-color-on-accent)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '2px',
                cursor: 'pointer'
              }}>
                Action
              </button>
            </div>
            
            <div style={{
              backgroundColor: 'var(--y-color-background-alternative)',
              border: '1px solid var(--y-color-border)',
              borderRadius: '4px',
              padding: '16px'
            }}>
              <h4 style={{ color: 'var(--y-color-text-primary)', margin: '0 0 8px 0' }}>Alternative Card</h4>
              <p style={{ color: 'var(--y-color-text-secondary)', margin: '0 0 12px 0' }}>
                This card uses the alternative background color.
              </p>
              <button style={{
                backgroundColor: 'var(--y-color-secondary)',
                color: 'var(--y-color-on-secondary)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '2px',
                cursor: 'pointer'
              }}>
                Secondary
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Bars */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: 'var(--y-color-text-primary)', marginBottom: '20px' }}>Progress Indicators</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '4px',
              color: 'var(--y-color-text-primary)'
            }}>
              <span>Success Progress</span>
              <span>75%</span>
            </div>
            <div style={{
              backgroundColor: 'var(--y-color-background-alternative)',
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                backgroundColor: 'var(--y-color-success)',
                height: '100%',
                width: '75%',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '4px',
              color: 'var(--y-color-text-primary)'
            }}>
              <span>Warning Progress</span>
              <span>45%</span>
            </div>
            <div style={{
              backgroundColor: 'var(--y-color-background-alternative)',
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                backgroundColor: 'var(--y-color-warning)',
                height: '100%',
                width: '45%',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '4px',
              color: 'var(--y-color-text-primary)'
            }}>
              <span>Error Progress</span>
              <span>25%</span>
            </div>
            <div style={{
              backgroundColor: 'var(--y-color-background-alternative)',
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                backgroundColor: 'var(--y-color-error)',
                height: '100%',
                width: '25%',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* Borders and Dividers */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: 'var(--y-color-text-primary)', marginBottom: '20px' }}>Borders & Dividers</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            padding: '16px',
            border: '1px solid var(--y-color-border)',
            borderRadius: '4px'
          }}>
            <p style={{ color: 'var(--y-color-text-primary)', margin: 0 }}>
              Content with standard border
            </p>
          </div>
          
          <hr style={{
            border: 'none',
            height: '1px',
            backgroundColor: 'var(--y-color-divider)',
            margin: '16px 0'
          }} />
          
          <div style={{
            padding: '16px',
            border: '2px dashed var(--y-color-border)',
            borderRadius: '4px'
          }}>
            <p style={{ color: 'var(--y-color-text-primary)', margin: 0 }}>
              Content with dashed border
            </p>
          </div>
        </div>
      </section>

      {/* Scrollbar Demo */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: 'var(--y-color-text-primary)', marginBottom: '20px' }}>Scrollbar</h2>
        <div style={{
          height: '150px',
          overflowY: 'auto',
          backgroundColor: 'var(--y-color-background)',
          border: '1px solid var(--y-color-border)',
          padding: '16px',
          borderRadius: '4px'
        }}>
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i} style={{ color: 'var(--y-color-text-primary)', margin: '8px 0' }}>
              Scrollable content line {i + 1}. This demonstrates the custom scrollbar styling.
            </p>
          ))}
        </div>
      </section>

      <footer style={{ 
        textAlign: 'center', 
        padding: '20px',
        color: 'var(--y-color-text-secondary)',
        borderTop: '1px solid var(--y-color-divider)',
        marginTop: '40px'
      }}>
        <p>TestY Style System Showcase - All CSS Variables and Styles</p>
      </footer>
    </div>
  )
}

export default App