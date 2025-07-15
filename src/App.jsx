import React, { useState } from 'react'
import TetrahedralLattice from './components/TetrahedralLattice'
import SizeSlider from './components/SizeSlider'
import ColorPicker from './components/ColorPicker'
import CloudinessToggle from './components/CloudinessToggle'

function App() {
  const [latticeSize, setLatticeSize] = useState(4)
  const [selectedColor, setSelectedColor] = useState('blue')
  const [cloudiness, setCloudiness] = useState(false)
  const [captureCount, setCaptureCount] = useState({ blue: 0, red: 0 })
  const [territoryScore, setTerritoryScore] = useState({ blue: 0, red: 0, neutral: 0 })
  const [showTerritoryScore, setShowTerritoryScore] = useState(false)
  const [gameMode, setGameMode] = useState('explore')
  const [aiMode, setAiMode] = useState('random')
  const [showNodeNumbers, setShowNodeNumbers] = useState(false)
  const [showEdgeNumbers, setShowEdgeNumbers] = useState(false)
  const [debugDrawerOpen, setDebugDrawerOpen] = useState(false)

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{ 
          color: '#333', 
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          3D Go
        </h1>
        
        <div style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'flex-start'
        }}>
          <div style={{
            width: '300px',
            flexShrink: 0
          }}>
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              margin: '1rem 0'
            }}>
              <label style={{
                fontSize: '1rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                Game Mode:
              </label>
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                <button
                  onClick={() => setGameMode('explore')}
                  style={{
                    flex: 1,
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: '2px solid #e5e7eb',
                    backgroundColor: gameMode === 'explore' ? '#4f46e5' : '#f9fafb',
                    color: gameMode === 'explore' ? 'white' : '#374151',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Explore
                </button>
                <button
                  onClick={() => setGameMode('vs-computer')}
                  style={{
                    flex: 1,
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: '2px solid #e5e7eb',
                    backgroundColor: gameMode === 'vs-computer' ? '#4f46e5' : '#f9fafb',
                    color: gameMode === 'vs-computer' ? 'white' : '#374151',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  VS Computer
                </button>
              </div>
            </div>
            
            <SizeSlider 
              value={latticeSize}
              onChange={setLatticeSize}
              min={1}
              max={8}
            />
            
            {gameMode === 'explore' && (
              <ColorPicker 
                selectedColor={selectedColor}
                onColorSelect={setSelectedColor}
              />
            )}
            
            {gameMode === 'vs-computer' && (
              <div style={{
                padding: '1rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                margin: '1rem 0'
              }}>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem',
                  textAlign: 'center'
                }}>
                  You are Blue
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  textAlign: 'center',
                  marginBottom: '1rem'
                }}>
                  Computer plays Red
                </div>
                
                <div style={{
                  marginBottom: '0.5rem'
                }}>
                  <label style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    AI Mode:
                  </label>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    <button
                      onClick={() => setAiMode('random')}
                      style={{
                        flex: 1,
                        padding: '0.4rem 0.8rem',
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: aiMode === 'random' ? '#3b82f6' : '#f9fafb',
                        color: aiMode === 'random' ? 'white' : '#374151',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Random
                    </button>
                    <button
                      onClick={() => setAiMode('attack')}
                      style={{
                        flex: 1,
                        padding: '0.4rem 0.8rem',
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: aiMode === 'attack' ? '#3b82f6' : '#f9fafb',
                        color: aiMode === 'attack' ? 'white' : '#374151',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Attack
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <CloudinessToggle 
              enabled={cloudiness}
              onToggle={() => setCloudiness(!cloudiness)}
            />
            
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              margin: '1rem 0'
            }}>
              <button
                onClick={() => setDebugDrawerOpen(!debugDrawerOpen)}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '2px solid #e5e7eb',
                  backgroundColor: debugDrawerOpen ? '#6b7280' : '#f9fafb',
                  color: debugDrawerOpen ? 'white' : '#374151',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => {
                  if (!debugDrawerOpen) {
                    e.target.style.backgroundColor = '#f3f4f6'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!debugDrawerOpen) {
                    e.target.style.backgroundColor = '#f9fafb'
                  }
                }}
              >
                <span>Debug Mode</span>
                <span style={{
                  transform: debugDrawerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}>
                  ▼
                </span>
              </button>
              
              {debugDrawerOpen && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <button
                    onClick={() => setShowNodeNumbers(!showNodeNumbers)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '2px solid #e5e7eb',
                      backgroundColor: showNodeNumbers ? '#4f46e5' : '#ffffff',
                      color: showNodeNumbers ? 'white' : '#374151',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!showNodeNumbers) {
                        e.target.style.backgroundColor = '#f3f4f6'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!showNodeNumbers) {
                        e.target.style.backgroundColor = '#ffffff'
                      }
                    }}
                  >
                    {showNodeNumbers ? 'Hide Node Numbers' : 'Show Node Numbers'}
                  </button>
                  
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginTop: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    {showNodeNumbers ? 'Node indices visible' : 'Shows node indices for debugging'}
                  </div>
                  
                  <button
                    onClick={() => setShowEdgeNumbers(!showEdgeNumbers)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '2px solid #e5e7eb',
                      backgroundColor: showEdgeNumbers ? '#4f46e5' : '#ffffff',
                      color: showEdgeNumbers ? 'white' : '#374151',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!showEdgeNumbers) {
                        e.target.style.backgroundColor = '#f3f4f6'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!showEdgeNumbers) {
                        e.target.style.backgroundColor = '#ffffff'
                      }
                    }}
                  >
                    {showEdgeNumbers ? 'Hide Edge Numbers' : 'Show Edge Numbers'}
                  </button>
                  
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginTop: '0.5rem'
                  }}>
                    {showEdgeNumbers ? 'Edge indices visible' : 'Shows edge indices for debugging'}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              margin: '1rem 0'
            }}>
              <div style={{
                textAlign: 'center',
                color: '#60a5fa',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                Blue Captures: {captureCount.blue}
              </div>
              <div style={{
                textAlign: 'center',
                color: '#e11d48',
                fontWeight: '500'
              }}>
                Red Captures: {captureCount.red}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              margin: '1rem 0'
            }}>
              <button
                onClick={() => setShowTerritoryScore(!showTerritoryScore)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginBottom: showTerritoryScore ? '1rem' : '0',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#3730a3'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#4f46e5'
                }}
              >
                {showTerritoryScore ? 'Hide Territory Score' : 'Calculate Territory Score'}
              </button>
              
              {showTerritoryScore && (
                <div>
                  <div style={{
                    textAlign: 'center',
                    color: '#60a5fa',
                    fontWeight: '500',
                    marginBottom: '0.5rem'
                  }}>
                    Blue Territory: {territoryScore.blue}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    color: '#e11d48',
                    fontWeight: '500',
                    marginBottom: '0.5rem'
                  }}>
                    Red Territory: {territoryScore.red}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    color: '#6b7280',
                    fontWeight: '500',
                    marginBottom: '0.5rem'
                  }}>
                    Neutral: {territoryScore.neutral}
                  </div>
                  <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                  <div style={{
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Final Score: Blue {territoryScore.blue + captureCount.blue} - Red {territoryScore.red + captureCount.red}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <TetrahedralLattice 
              size={latticeSize} 
              selectedColor={selectedColor} 
              cloudiness={cloudiness} 
              captureCount={captureCount}
              setCaptureCount={setCaptureCount}
              territoryScore={territoryScore}
              setTerritoryScore={setTerritoryScore}
              showTerritoryScore={showTerritoryScore}
              gameMode={gameMode}
              aiMode={aiMode}
              showNodeNumbers={showNodeNumbers}
              showEdgeNumbers={showEdgeNumbers}
            />
          </div>
        </div>
        
        <div style={{
          textAlign: 'center',
          marginTop: '1rem',
          color: '#666',
          fontSize: '0.875rem'
        }}>
          Use mouse to rotate, zoom, and pan the lattice • Select a color above, then click nodes to paint them
        </div>
      </div>
    </div>
  )
}

export default App