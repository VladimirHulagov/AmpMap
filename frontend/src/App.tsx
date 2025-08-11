import React, { useState } from 'react';

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  };

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return (
    <div className={`app ${isDark ? 'dark' : 'light'}`}>
      <header style={{ 
        padding: '20px', 
        backgroundColor: 'var(--color-bg)', 
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ color: 'var(--color-text-primary)', margin: 0 }}>
          TestY Style Showcase
        </h1>
        <button 
          onClick={toggleTheme}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      <main style={{ padding: '20px', backgroundColor: 'var(--color-bg)' }}>
        {/* Цветовая палитра */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '20px' }}>
            🎨 Цветовая палитра
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '20px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <div style={{ width: '100%', height: '40px', backgroundColor: 'var(--color-bg)', marginBottom: '8px', border: '1px solid var(--color-border)' }}></div>
              <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '14px' }}>Background</p>
            </div>
            <div style={{ padding: '20px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <div style={{ width: '100%', height: '40px', backgroundColor: 'var(--color-bg-alt)', marginBottom: '8px' }}></div>
              <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '14px' }}>Alt Background</p>
            </div>
            <div style={{ padding: '20px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <div style={{ width: '100%', height: '40px', backgroundColor: 'var(--color-accent)', marginBottom: '8px' }}></div>
              <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '14px' }}>Accent</p>
            </div>
            <div style={{ padding: '20px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <div style={{ width: '100%', height: '40px', backgroundColor: 'var(--color-success)', marginBottom: '8px' }}></div>
              <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '14px' }}>Success</p>
            </div>
            <div style={{ padding: '20px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <div style={{ width: '100%', height: '40px', backgroundColor: 'var(--color-error)', marginBottom: '8px' }}></div>
              <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '14px' }}>Error</p>
            </div>
            <div style={{ padding: '20px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <div style={{ width: '100%', height: '40px', backgroundColor: 'var(--color-warning)', marginBottom: '8px' }}></div>
              <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '14px' }}>Warning</p>
            </div>
          </div>
        </section>

        {/* Типографика */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '20px' }}>
            📝 Типографика
          </h2>
          <div style={{ backgroundColor: 'var(--color-bg-alt)', padding: '20px', borderRadius: '8px' }}>
            <h1 style={{ color: 'var(--color-text-primary)' }}>Заголовок H1</h1>
            <h2 style={{ color: 'var(--color-text-primary)' }}>Заголовок H2</h2>
            <h3 style={{ color: 'var(--color-text-primary)' }}>Заголовок H3</h3>
            <h4 style={{ color: 'var(--color-text-primary)' }}>Заголовок H4</h4>
            <p style={{ color: 'var(--color-text-primary)' }}>Основной текст с цветом text-primary</p>
            <p style={{ color: 'var(--color-text-secondary)' }}>Вторичный текст с цветом text-secondary</p>
            <p style={{ color: 'var(--color-text-tertiary)' }}>Третичный текст с цветом text-tertiary</p>
            <a href="#" style={{ color: 'var(--color-accent)' }}>Ссылка с accent цветом</a>
          </div>
        </section>

        {/* Элементы управления */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '20px' }}>
            🎛️ Элементы управления
          </h2>
          <div style={{ backgroundColor: 'var(--color-bg-alt)', padding: '20px', borderRadius: '8px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '10px' }}>Кнопки</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Основная кнопка
                </button>
                <button style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Вторичная кнопка
                </button>
                <button style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-accent)',
                  border: '1px solid var(--color-accent)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Контурная кнопка
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '10px' }}>Поля ввода</h4>
              <div style={{ display: 'grid', gap: '10px', maxWidth: '400px' }}>
                <input 
                  type="text" 
                  placeholder="Текстовое поле"
                  style={{
                    padding: '10px',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px'
                  }}
                />
                <textarea 
                  placeholder="Многострочное поле"
                  rows={3}
                  style={{
                    padding: '10px',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    resize: 'vertical'
                  }}
                />
                <select style={{
                  padding: '10px',
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px'
                }}>
                  <option>Выберите опцию</option>
                  <option>Опция 1</option>
                  <option>Опция 2</option>
                </select>
              </div>
            </div>

            <div>
              <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '10px' }}>Теги</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: 'var(--color-chart-primary)',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  Первичный
                </span>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: 'var(--color-chart-secondary)',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  Вторичный
                </span>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: 'var(--color-chart-tertiary)',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  Третичный
                </span>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: 'var(--color-chart-quaternary)',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  Четвертичный
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Отображение данных */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '20px' }}>
            📊 Отображение данных
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '10px' }}>Таблица</h4>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)'
            }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-alt)' }}>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    color: 'var(--color-text-primary)',
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    Название
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    color: 'var(--color-text-primary)',
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    Статус
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    color: 'var(--color-text-primary)',
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    Значение
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ 
                    padding: '12px', 
                    color: 'var(--color-text-primary)',
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    Элемент 1
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    color: 'var(--color-success)',
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    Активен
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    color: 'var(--color-text-secondary)',
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    100
                  </td>
                </tr>
                <tr style={{ backgroundColor: 'var(--color-bg-alt)' }}>
                  <td style={{ 
                    padding: '12px', 
                    color: 'var(--color-text-primary)',
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    Элемент 2
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    color: 'var(--color-warning)',
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    Ожидание
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    color: 'var(--color-text-secondary)',
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    75
                  </td>
                </tr>
                <tr>
                  <td style={{ 
                    padding: '12px', 
                    color: 'var(--color-text-primary)',
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    Элемент 3
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    color: 'var(--color-error)',
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    Ошибка
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    color: 'var(--color-text-secondary)',
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    0
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '10px' }}>Карточки</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'var(--color-bg)', 
                border: '1px solid var(--color-border)', 
                borderRadius: '8px' 
              }}>
                <h5 style={{ color: 'var(--color-text-primary)', margin: '0 0 10px 0' }}>Основная карточка</h5>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                  Карточка с основным фоном и стандартными цветами текста.
                </p>
              </div>
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'var(--color-bg-alt)', 
                border: '1px solid var(--color-border)', 
                borderRadius: '8px' 
              }}>
                <h5 style={{ color: 'var(--color-text-primary)', margin: '0 0 10px 0' }}>Альтернативная карточка</h5>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                  Карточка с альтернативным фоном для выделения контента.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Индикаторы прогресса */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '20px' }}>
            📈 Индикаторы прогресса
          </h2>
          <div style={{ backgroundColor: 'var(--color-bg-alt)', padding: '20px', borderRadius: '8px' }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>Успех</span>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>85%</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: 'var(--color-border)', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: '85%', 
                  height: '100%', 
                  backgroundColor: 'var(--color-success)',
                  borderRadius: '4px'
                }}></div>
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>Предупреждение</span>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>60%</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: 'var(--color-border)', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: '60%', 
                  height: '100%', 
                  backgroundColor: 'var(--color-warning)',
                  borderRadius: '4px'
                }}></div>
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>Ошибка</span>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>25%</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: 'var(--color-border)', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: '25%', 
                  height: '100%', 
                  backgroundColor: 'var(--color-error)',
                  borderRadius: '4px'
                }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Дополнительные элементы */}
        <section>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '20px' }}>
            🎯 Дополнительные элементы
          </h2>
          <div style={{ backgroundColor: 'var(--color-bg-alt)', padding: '20px', borderRadius: '8px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '10px' }}>Разделители</h4>
              <hr style={{ border: 'none', height: '1px', backgroundColor: 'var(--color-border)', margin: '10px 0' }} />
              <div style={{ height: '2px', backgroundColor: 'var(--color-accent)', margin: '10px 0' }}></div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '10px' }}>Область с прокруткой</h4>
              <div style={{
                height: '100px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                padding: '10px',
                overflow: 'auto'
              }}>
                <p style={{ color: 'var(--color-text-primary)' }}>
                  Это область с кастомной прокруткой. Здесь много текста, который не помещается в контейнер.
                  Прокрутите вниз, чтобы увидеть больше содержимого. Стили прокрутки определены в CSS файлах.
                  Еще больше текста для демонстрации прокрутки. И еще немного текста для полноты картины.
                  Последняя строка для демонстрации прокрутки.
                </p>
              </div>
            </div>
            
            <div>
              <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '10px' }}>Цвета для графиков</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  backgroundColor: 'var(--color-chart-primary)', 
                  borderRadius: '50%',
                  border: '2px solid var(--color-border)'
                }}></div>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  backgroundColor: 'var(--color-chart-secondary)', 
                  borderRadius: '50%',
                  border: '2px solid var(--color-border)'
                }}></div>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  backgroundColor: 'var(--color-chart-tertiary)', 
                  borderRadius: '50%',
                  border: '2px solid var(--color-border)'
                }}></div>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  backgroundColor: 'var(--color-chart-quaternary)', 
                  borderRadius: '50%',
                  border: '2px solid var(--color-border)'
                }}></div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;