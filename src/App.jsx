import React, { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { 
  CssBaseline, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton, 
  Typography,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Divider,
  Box,
  Container,
  Alert
} from '@mui/material'
import { 
  Info as InfoIcon, 
  Close as CloseIcon
} from '@mui/icons-material'
import TetrahedralLattice from './components/TetrahedralLattice'
import SizeSlider from './components/SizeSlider'
import ColorPicker from './components/ColorPicker'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#60a5fa',
    },
    secondary: {
      main: '#9ca3af',
    },
    background: {
      default: '#111827',
      paper: '#1f2937',
    },
    text: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
    },
  },
})

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
  const [showHelp, setShowHelp] = useState(true) // Show help modal
  const [helpContent, setHelpContent] = useState('') // Store help content from markdown file
  const [showNodeNumbers, setShowNodeNumbers] = useState(false)
  const [showEdgeNumbers, setShowEdgeNumbers] = useState(false)

  // Load help content from markdown file
  useEffect(() => {
    fetch('/help.md')
      .then(response => response.text())
      .then(text => setHelpContent(text))
      .catch(error => console.error('Error loading help content:', error))
  }, [])

  // Simple markdown to HTML converter
  const markdownToHtml = (markdown) => {
    let html = markdown
      .replace(/^# (.*$)/gm, '<h1 style="font-size: 1.8rem; font-weight: bold; color: #f9fafb; margin: 0 0 1.5rem 0;">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 style="font-size: 1.3rem; font-weight: 600; margin: 1.5rem 0 0.8rem 0; color: #e5e7eb;">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 style="font-size: 1.1rem; font-weight: 600; margin: 1.2rem 0 0.6rem 0; color: #d1d5db;">$1</h3>')
      .replace(/^\*\*(.+)\*\*$/gm, '<strong style="color: #f9fafb;">$1</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f9fafb;">$1</strong>')
      .replace(/^- (.*$)/gm, '<li style="margin-bottom: 0.4rem; color: #d1d5db;">$1</li>')
      .replace(/^💡 \*\*Tip:\*\* (.*)$/gm, '<div style="background-color: #374151; padding: 1rem; border-radius: 8px; border-left: 4px solid #60a5fa; margin: 1rem 0;"><p style="font-size: 0.9rem; color: #e5e7eb; margin: 0;"><span style="color: #60a5fa;">💡 <strong>Tip:</strong></span> $1</p></div>')
      .replace(/^---$/gm, '<hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #4b5563;">')
      .replace(/\n\n/g, '</p><p style="margin-bottom: 1rem; color: #d1d5db; line-height: 1.6;">')
      .replace(/^(?!<[hlu]|<div|<hr)(.+)$/gm, '<p style="margin-bottom: 1rem; color: #d1d5db; line-height: 1.6;">$1</p>')
      .replace(/<li[^>]*>([^<]*)<\/li>/g, (match, content) => {
        if (content.includes('</p>')) {
          return `<li style="margin-bottom: 0.4rem; color: #d1d5db;">${content.replace(/<\/?p[^>]*>/g, '')}</li>`
        }
        return match
      })
      // Wrap consecutive <li> elements in <ul>
      .replace(/(<li[^>]*>.*?<\/li>\s*)+/g, (match) => {
        return `<ul style="margin-bottom: 1.5rem; padding-left: 1.5rem; list-style-type: disc;">${match}</ul>`
      })
    
    // Insert screenshot before the Rules section
    const imageHtml = '<div style="text-align: center; margin: 1.5rem 0;"><img src="/3dgo-screenshot.png" alt="3D Go Game Interface" style="max-width: 60%; height: auto; border-radius: 6px; border: 1px solid #374151; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);" /></div>'
    html = html.replace(/(<h2[^>]*>Rules<\/h2>)/, `${imageHtml}$1`)
    
    return html
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#111827',
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
          gap: '0.5rem'
        }}>
          <h1 style={{ 
            color: '#f9fafb', 
            textAlign: 'center',
            margin: 0
          }}>
            3D Go
          </h1>
          <IconButton
            onClick={() => setShowHelp(true)}
            sx={{ 
              color: 'grey.600',
              '&:hover': {
                backgroundColor: 'grey.100',
                color: 'grey.800'
              }
            }}
          >
            <InfoIcon />
          </IconButton>
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
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Game Mode</FormLabel>
                  <RadioGroup
                    value={gameMode}
                    onChange={(e) => {
                      setGameMode(e.target.value)
                      if (e.target.value === 'vs-computer' || e.target.value === 'challenge') {
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('restartGame'))
                        }, 50)
                      }
                    }}
                    row
                  >
                    <FormControlLabel value="explore" control={<Radio />} label="Explore" />
                    <FormControlLabel value="vs-computer" control={<Radio />} label="Custom vs Computer" />
                    <FormControlLabel value="challenge" control={<Radio />} label="Challenge" />
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
            
            {gameMode !== 'challenge' && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography gutterBottom>Size: {latticeSize}</Typography>
                  <Slider
                    value={latticeSize}
                    onChange={(e, value) => setLatticeSize(value)}
                    min={1}
                    max={8}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                  />
                </CardContent>
              </Card>
            )}
            
            {gameMode === 'challenge' && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Challenge Level
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {[1, 2, 3, 4].map((level) => (
                      <Button
                        key={level}
                        variant={challengeLevel === level ? "contained" : "outlined"}
                        onClick={() => {
                          if (level === 1 || completedLevels.has(level - 1)) {
                            setChallengeLevel(level)
                          }
                        }}
                        disabled={level > 1 && !completedLevels.has(level - 1)}
                        sx={{ 
                          justifyContent: 'space-between',
                          textTransform: 'none'
                        }}
                        endIcon={
                          <span>
                            {completedLevels.has(level) && '✓'}
                            {level > 1 && !completedLevels.has(level - 1) && '🔒'}
                          </span>
                        }
                      >
                        Level {level}
                      </Button>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
            
            {gameMode === 'vs-computer' && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Win Criteria</FormLabel>
                    <RadioGroup
                      value={winCriteria}
                      onChange={(e) => setWinCriteria(e.target.value)}
                    >
                      <FormControlLabel value="capture1" control={<Radio />} label="Capture 1 Stone" />
                      <FormControlLabel value="capture3" control={<Radio />} label="Capture 3 Stones" />
                      <FormControlLabel value="territory" control={<Radio />} label="Territory + Captures" />
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>
            )}
            
            {gameMode === 'explore' && (
              <ColorPicker 
                selectedColor={selectedColor}
                onColorSelect={setSelectedColor}
              />
            )}
            
            {gameMode === 'vs-computer' && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom align="center">
                    You are Blue
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                    Computer plays Red
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <FormControl component="fieldset">
                    <FormLabel component="legend">AI Mode</FormLabel>
                    <RadioGroup
                      value={aiMode}
                      onChange={(e) => setAiMode(e.target.value)}
                      row
                    >
                      <FormControlLabel value="random" control={<Radio />} label="Random" />
                      <FormControlLabel value="attack" control={<Radio />} label="Attack" />
                      <FormControlLabel value="greedy" control={<Radio />} label="Greedy" />
                      <FormControlLabel value="advanced" control={<Radio />} label="Advanced" />
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>
            )}
            
            

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => setShowTerritoryScore(!showTerritoryScore)}
                  sx={{ mb: showTerritoryScore ? 2 : 0 }}
                >
                  {showTerritoryScore ? 'Hide Territory Score' : 'Calculate Territory Score'}
                </Button>
                
                {showTerritoryScore && (
                  <Box>
                    <Typography align="center" color="primary" sx={{ fontWeight: 500, mb: 1 }}>
                      Blue Territory: {territoryScore.blue}
                    </Typography>
                    <Typography align="center" color="error" sx={{ fontWeight: 500, mb: 1 }}>
                      Red Territory: {territoryScore.red}
                    </Typography>
                    <Typography align="center" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                      Neutral: {territoryScore.neutral}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography align="center" sx={{ fontWeight: 600 }}>
                      Final Score: Blue {territoryScore.blue + captureCount.blue} - Red {territoryScore.red + captureCount.red}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
            
          </div>
          
          <div style={{
            flex: 1,
            backgroundColor: 'black',
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
              padding: '1rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  textAlign: 'center',
                  color: '#93c5fd',
                  fontWeight: '500',
                  fontSize: '0.875rem'
                }}>
                  Blue Captures: {captureCount.blue}
                </div>
                <div style={{
                  textAlign: 'center',
                  color: '#fca5a5',
                  fontWeight: '500',
                  fontSize: '0.875rem'
                }}>
                  Red Captures: {captureCount.red}
                </div>
              </div>
              {(gameMode === 'vs-computer' || gameMode === 'challenge') && (
                <div style={{
                  textAlign: 'center',
                  color: '#d1d5db',
                  fontWeight: '500',
                  fontSize: '0.75rem',
                  marginBottom: '1rem',
                  padding: '0.5rem',
                  backgroundColor: '#374151',
                  borderRadius: '4px',
                  border: '1px solid #4b5563'
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
                  color: '#d1d5db',
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
                      backgroundColor: '#4b5563',
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
                      e.target.style.backgroundColor = '#374151'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#4b5563'
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
      <Dialog
        open={showHelp}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            bgcolor: '#111827',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            border: '1px solid #374151'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          py: 4,
          borderRadius: '12px 12px 0 0'
        }}>
          <Typography variant="h3" component="h1" sx={{ 
            fontWeight: 700,
            letterSpacing: '0.02em',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            3D Go
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ 
          pt: 4, 
          px: 4, 
          pb: 2,
          bgcolor: '#111827', 
          color: '#f9fafb',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: '#374151',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#60a5fa',
            borderRadius: '4px',
            '&:hover': {
              bgcolor: '#3b82f6',
            },
          },
        }}>
          <div 
            dangerouslySetInnerHTML={{ 
              __html: markdownToHtml(helpContent) 
            }}
          />
        </DialogContent>
        <DialogActions sx={{ 
          bgcolor: '#111827', 
          p: 4,
          justifyContent: 'center',
          borderTop: '1px solid #374151'
        }}>
          <Button 
            onClick={() => setShowHelp(false)}
            variant="contained"
            size="large"
            sx={{
              bgcolor: '#667eea',
              color: 'white',
              fontWeight: 600,
              fontSize: '1.1rem',
              px: 6,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.4)',
              '&:hover': {
                bgcolor: '#5a67d8',
                boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.6)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </div>
    </ThemeProvider>
  )
}

export default App