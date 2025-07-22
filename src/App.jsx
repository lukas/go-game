import React, { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { 
  CssBaseline, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
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
    primary: {
      main: '#4f46e5',
    },
    secondary: {
      main: '#6b7280',
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
  const [showHelp, setShowHelp] = useState(false) // Show help modal
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
          gap: '0.5rem'
        }}>
          <h1 style={{ 
            color: '#333', 
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
      <Dialog
        open={showHelp}
        onClose={() => setShowHelp(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '85vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          position: 'relative'
        }}>
          <Typography variant="h4" component="h1">
            3D Go
          </Typography>
          <IconButton
            onClick={() => setShowHelp(false)}
            sx={{ 
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white'
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <div 
            dangerouslySetInnerHTML={{ 
              __html: markdownToHtml(helpContent) 
            }}
          />
          <Typography 
            variant="caption" 
            sx={{ 
              mt: 3, 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 1, 
              display: 'block',
              textAlign: 'center'
            }}
          >
            Click anywhere outside this window or press the × button to close
          </Typography>
        </DialogContent>
      </Dialog>
    </div>
    </ThemeProvider>
  )
}

export default App