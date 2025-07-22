import React, { useState, useEffect } from 'react'
import TetrahedralLattice from './components/TetrahedralLattice'
import SizeSlider from './components/SizeSlider'
import ColorPicker from './components/ColorPicker'

function App() {
  const [latticeSize, setLatticeSize] = useState(4)
  const [selectedColor, setSelectedColor] = useState('blue')
  const [captureCount, setCaptureCount] = useState({ blue: 0, red: 0 })
  const [territoryScore, setTerritoryScore] = useState({ blue: 0, red: 0, neutral: 0 })
  const [showTerritoryScore, setShowTerritoryScore] = useState(false)
  const [gameMode, setGameMode] = useState('challenge')
  const [aiMode, setAiMode] = useState('random')
  const [winCriteria, setWinCriteria] = useState('territory') // 'capture1', 'capture3', 'territory'
  const [challengeLevel, setChallengeLevel] = useState(1) // 1, 2, or 3
  const [completedLevels, setCompletedLevels] = useState(new Set()) // Track completed levels
  const [showHelp, setShowHelp] = useState(false) // Show help modal
  const [helpContent, setHelpContent] = useState('') // Store help content from markdown file
  const [showNodeNumbers, setShowNodeNumbers] = useState(false)
  const [showEdgeNumbers, setShowEdgeNumbers] = useState(false)
  const [debugDrawerOpen, setDebugDrawerOpen] = useState(false)

  // Load help content from markdown file
  useEffect(() => {
    fetch('/help.md')
      .then(response => response.text())
      .then(text => setHelpContent(text))
      .catch(error => console.error('Error loading help content:', error))
  }, [])

  // Simple markdown to HTML converter
  const markdownToHtml = (markdown) => {
    return markdown
      .replace(/^# (.*$)/gm, '<h1 style="font-size: 1.5rem; font-weight: bold; color: #374151; margin: 0 0 1.5rem 0;">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 style="font-size: 1.1rem; font-weight: 600; margin: 1rem 0 0.5rem 0; color: #1f2937;">$1</h2>')
      .replace(/^\*\*(.+)\*\*$/gm, '<strong>$1</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*$)/gm, '<li style="margin-bottom: 0.25rem;">$1</li>')
      .replace(/^💡 \*\*Tip:\*\* (.*)$/gm, '<div style="background-color: #f9fafb; padding: 1rem; border-radius: 6px; border: 1px solid #e5e7eb; margin-top: 1rem;"><p style="font-size: 0.85rem; color: #6b7280; margin: 0; font-style: italic;">💡 <strong>Tip:</strong> $1</p></div>')
      .replace(/^---$/gm, '<hr style="margin: 1rem 0; border: none; border-top: 1px solid #e5e7eb;">')
      .replace(/\n\n/g, '</p><p style="margin-bottom: 1rem;">')
      .replace(/^(?!<[hlu]|<div|<hr)(.+)$/gm, '<p style="margin-bottom: 1rem;">$1</p>')
      .replace(/<li[^>]*>([^<]*)<\/li>/g, (match, content) => {
        if (content.includes('</p>')) {
          return `<li style="margin-bottom: 0.25rem;">${content.replace(/<\/?p[^>]*>/g, '')}</li>`
        }
        return match
      })
      // Wrap consecutive <li> elements in <ul>
      .replace(/(<li[^>]*>.*?<\/li>\s*)+/g, (match) => {
        return `<ul style="margin-bottom: 1rem; padding-left: 1.5rem;">${match}</ul>`
      })
  }

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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem',
          position: 'relative'
        }}>
          <h1 style={{ 
            color: '#333', 
            textAlign: 'center',
            margin: 0
          }}>
            3D Go
          </h1>
          <button
            onClick={() => setShowHelp(true)}
            style={{
              position: 'absolute',
              right: 0,
              padding: '0.5rem 1rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#4b5563'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#6b7280'
            }}
          >
            Info
          </button>
        </div>
        
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
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => setGameMode('explore')}
                  style={{
                    flex: '1 1 30%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '2px solid #e5e7eb',
                    backgroundColor: gameMode === 'explore' ? '#4f46e5' : '#f9fafb',
                    color: gameMode === 'explore' ? 'white' : '#374151',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Explore
                </button>
                <button
                  onClick={() => {
                    setGameMode('vs-computer')
                    // Reset the board when switching to Custom vs Computer mode (with small delay)
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('restartGame'))
                    }, 50)
                  }}
                  style={{
                    flex: '1 1 30%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '2px solid #e5e7eb',
                    backgroundColor: gameMode === 'vs-computer' ? '#4f46e5' : '#f9fafb',
                    color: gameMode === 'vs-computer' ? 'white' : '#374151',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Custom vs Computer
                </button>
                <button
                  onClick={() => {
                    setGameMode('challenge')
                    // Reset the board when switching to Challenge mode (with small delay)
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('restartGame'))
                    }, 50)
                  }}
                  style={{
                    flex: '1 1 30%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '2px solid #e5e7eb',
                    backgroundColor: gameMode === 'challenge' ? '#4f46e5' : '#f9fafb',
                    color: gameMode === 'challenge' ? 'white' : '#374151',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Challenge
                </button>
              </div>
            </div>
            
            {gameMode !== 'challenge' && (
              <SizeSlider 
                value={latticeSize}
                onChange={setLatticeSize}
                min={1}
                max={8}
              />
            )}
            
            {gameMode === 'challenge' && (
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
                  Challenge Level:
                </label>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={() => setChallengeLevel(1)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '2px solid #e5e7eb',
                      backgroundColor: challengeLevel === 1 ? '#4f46e5' : '#f9fafb',
                      color: challengeLevel === 1 ? 'white' : '#374151',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>Level 1</span>
                    {completedLevels.has(1) && <span style={{ color: '#10b981' }}>✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      if (completedLevels.has(1)) {
                        setChallengeLevel(2)
                      }
                    }}
                    disabled={!completedLevels.has(1)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '2px solid #e5e7eb',
                      backgroundColor: challengeLevel === 2 ? '#4f46e5' : (!completedLevels.has(1) ? '#f3f4f6' : '#f9fafb'),
                      color: challengeLevel === 2 ? 'white' : (!completedLevels.has(1) ? '#9ca3af' : '#374151'),
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: !completedLevels.has(1) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>Level 2</span>
                    {completedLevels.has(2) && <span style={{ color: '#10b981' }}>✓</span>}
                    {!completedLevels.has(1) && <span style={{ color: '#6b7280' }}>🔒</span>}
                  </button>
                  <button
                    onClick={() => {
                      if (completedLevels.has(2)) {
                        setChallengeLevel(3)
                      }
                    }}
                    disabled={!completedLevels.has(2)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '2px solid #e5e7eb',
                      backgroundColor: challengeLevel === 3 ? '#4f46e5' : (!completedLevels.has(2) ? '#f3f4f6' : '#f9fafb'),
                      color: challengeLevel === 3 ? 'white' : (!completedLevels.has(2) ? '#9ca3af' : '#374151'),
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: !completedLevels.has(2) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>Level 3</span>
                    {completedLevels.has(3) && <span style={{ color: '#10b981' }}>✓</span>}
                    {!completedLevels.has(2) && <span style={{ color: '#6b7280' }}>🔒</span>}
                  </button>
                  <button
                    onClick={() => {
                      if (completedLevels.has(3)) {
                        setChallengeLevel(4)
                      }
                    }}
                    disabled={!completedLevels.has(3)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '2px solid #e5e7eb',
                      backgroundColor: challengeLevel === 4 ? '#4f46e5' : (!completedLevels.has(3) ? '#f3f4f6' : '#f9fafb'),
                      color: challengeLevel === 4 ? 'white' : (!completedLevels.has(3) ? '#9ca3af' : '#374151'),
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: !completedLevels.has(3) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>Level 4</span>
                    {completedLevels.has(4) && <span style={{ color: '#10b981' }}>✓</span>}
                    {!completedLevels.has(3) && <span style={{ color: '#6b7280' }}>🔒</span>}
                  </button>
                </div>
              </div>
            )}
            
            {gameMode === 'vs-computer' && (
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
                  Win Criteria:
                </label>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={() => setWinCriteria('capture1')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '2px solid #e5e7eb',
                      backgroundColor: winCriteria === 'capture1' ? '#4f46e5' : '#f9fafb',
                      color: winCriteria === 'capture1' ? 'white' : '#374151',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                  >
                    Capture 1 Stone
                  </button>
                  <button
                    onClick={() => setWinCriteria('capture3')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '2px solid #e5e7eb',
                      backgroundColor: winCriteria === 'capture3' ? '#4f46e5' : '#f9fafb',
                      color: winCriteria === 'capture3' ? 'white' : '#374151',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                  >
                    Capture 3 Stones
                  </button>
                  <button
                    onClick={() => setWinCriteria('territory')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '2px solid #e5e7eb',
                      backgroundColor: winCriteria === 'territory' ? '#4f46e5' : '#f9fafb',
                      color: winCriteria === 'territory' ? 'white' : '#374151',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                  >
                    Territory + Captures
                  </button>
                </div>
              </div>
            )}
            
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
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => setAiMode('random')}
                      style={{
                        flex: '1 1 45%',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: aiMode === 'random' ? '#3b82f6' : '#f9fafb',
                        color: aiMode === 'random' ? 'white' : '#374151',
                        fontSize: '0.7rem',
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
                        flex: '1 1 45%',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: aiMode === 'attack' ? '#3b82f6' : '#f9fafb',
                        color: aiMode === 'attack' ? 'white' : '#374151',
                        fontSize: '0.7rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Attack
                    </button>
                    <button
                      onClick={() => setAiMode('greedy')}
                      style={{
                        flex: '1 1 45%',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: aiMode === 'greedy' ? '#3b82f6' : '#f9fafb',
                        color: aiMode === 'greedy' ? 'white' : '#374151',
                        fontSize: '0.7rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Greedy
                    </button>
                    <button
                      onClick={() => setAiMode('advanced')}
                      style={{
                        flex: '1 1 45%',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: aiMode === 'advanced' ? '#3b82f6' : '#f9fafb',
                        color: aiMode === 'advanced' ? 'white' : '#374151',
                        fontSize: '0.7rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Advanced
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            

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
          </div>
          
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <TetrahedralLattice 
              size={gameMode === 'challenge' ? (challengeLevel === 1 ? 3 : challengeLevel === 4 ? 5 : 4) : latticeSize} 
              selectedColor={selectedColor} 
              captureCount={captureCount}
              setCaptureCount={setCaptureCount}
              territoryScore={territoryScore}
              setTerritoryScore={setTerritoryScore}
              showTerritoryScore={showTerritoryScore}
              setShowTerritoryScore={setShowTerritoryScore}
              gameMode={gameMode}
              aiMode={gameMode === 'challenge' ? (challengeLevel === 1 ? 'random' : challengeLevel === 2 ? 'attack' : challengeLevel === 3 ? 'greedy' : 'advanced') : aiMode}
              winCriteria={winCriteria}
              showNodeNumbers={showNodeNumbers}
              showEdgeNumbers={showEdgeNumbers}
              challengeLevel={challengeLevel}
              setChallengeLevel={setChallengeLevel}
              completedLevels={completedLevels}
              setCompletedLevels={setCompletedLevels}
            />
            <div style={{
              padding: '1rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  textAlign: 'center',
                  color: '#60a5fa',
                  fontWeight: '500',
                  fontSize: '0.875rem'
                }}>
                  Blue Captures: {captureCount.blue}
                </div>
                <div style={{
                  textAlign: 'center',
                  color: '#e11d48',
                  fontWeight: '500',
                  fontSize: '0.875rem'
                }}>
                  Red Captures: {captureCount.red}
                </div>
              </div>
              {(gameMode === 'vs-computer' || gameMode === 'challenge') && (
                <div style={{
                  textAlign: 'center',
                  color: '#6b7280',
                  fontWeight: '500',
                  fontSize: '0.75rem',
                  marginBottom: '1rem',
                  padding: '0.5rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb'
                }}>
                  Win Condition: {
                    gameMode === 'challenge' 
                      ? (challengeLevel === 1 ? 'Capture 1 Stone' : 'Capture 3 Stones')
                      : (winCriteria === 'capture1' ? 'Capture 1 Stone' : 
                         winCriteria === 'capture3' ? 'Capture 3 Stones' : 
                         'Territory + Captures')
                  }
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  flex: 1,
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '0.875rem'
                }}>
                  {gameMode === 'explore' 
                    ? 'Use mouse to rotate, zoom, and pan the lattice • Select a color above, then click nodes to paint them'
                    : 'Use mouse to rotate, zoom, and pan the lattice • Click nodes to place blue stones (computer plays red)'
                  }
                </div>
                {(gameMode === 'vs-computer' || gameMode === 'challenge') && (
                  <button
                    onClick={() => {
                      // Trigger computer move by dispatching a custom event
                      window.dispatchEvent(new CustomEvent('playerPass'))
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginLeft: '1rem'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#4b5563'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#6b7280'
                    }}
                  >
                    Pass
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Info Modal */}
      {showHelp && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowHelp(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '2.5rem',
              borderRadius: '16px',
              maxWidth: '600px',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              border: '1px solid #e5e7eb',
              position: 'relative',
              margin: '1rem',
              transform: 'scale(1)',
              transition: 'all 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHelp(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '2rem',
                height: '2rem',
                backgroundColor: '#f9fafb',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f3f4f6'
                e.target.style.borderColor = '#d1d5db'
                e.target.style.color = '#374151'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f9fafb'
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.color = '#6b7280'
              }}
            >
              ×
            </button>
            
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
              color: 'white',
              textAlign: 'center'
            }}>
              <h1 style={{
                fontSize: '1.75rem',
                fontWeight: 'bold',
                margin: 0
              }}>
                3D Go
              </h1>
            </div>
            
            <div 
              style={{
                color: '#374151',
                lineHeight: '1.7',
                fontSize: '0.95rem'
              }}
              dangerouslySetInnerHTML={{ 
                __html: markdownToHtml(helpContent) 
              }}
            />
            
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#64748b',
                margin: 0
              }}>
                Click anywhere outside this window or press the × button to close
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App