import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Text } from '@react-three/drei'
import * as THREE from 'three'

function TetrahedralLatticePoints({ size, selectedColor, captureCount, setCaptureCount, territoryScore, setTerritoryScore, showTerritoryScore, setShowTerritoryScore, gameMode, aiMode, winCriteria, showNodeNumbers, showEdgeNumbers, challengeLevel, completedLevels, setCompletedLevels, gameStateRef }) {
  const groupRef = useRef()
  const [nodeColors, setNodeColors] = useState({})
  const [hoveredNode, setHoveredNode] = useState(null)
  const [territoryOwnership, setTerritoryOwnership] = useState({})
  const [hoveredGroup, setHoveredGroup] = useState(new Set())
  const [hoveredGroupEdges, setHoveredGroupEdges] = useState(new Set())
  const [hoveredInternalGroupEdges, setHoveredInternalGroupEdges] = useState(new Set())
  const [lastMoveWasPass, setLastMoveWasPass] = useState(false)
  const [gameEnded, setGameEnded] = useState(false)
  const [gameResult, setGameResult] = useState(null) // 'win', 'lose', or null
  const [lastComputerMove, setLastComputerMove] = useState(null) // Track computer's last move
  const [aiThinking, setAiThinking] = useState(false) // Track AI thinking state
  
  // Helper function to mark level as completed
  const markLevelCompleted = (result) => {
    if (gameMode === 'challenge' && result === 'win' && setCompletedLevels) {
      setCompletedLevels(prev => new Set([...prev, challengeLevel]))
    }
  }
  
  // Go game logic functions
  const getNeighbors = (nodeIndex, totalNodes) => {
    const neighbors = []
    
    // Find all edges that connect to this node using edge indices
    edgeIndices.forEach(([startIndex, endIndex]) => {
      if (startIndex === nodeIndex && endIndex < totalNodes) {
        neighbors.push(endIndex)
      } else if (endIndex === nodeIndex && startIndex < totalNodes) {
        neighbors.push(startIndex)
      }
    })
    
    return neighbors
  }
  
  const getGroup = (nodeIndex, color, nodeColors) => {
    const group = new Set()
    const toVisit = [nodeIndex]
    
    while (toVisit.length > 0) {
      const current = toVisit.pop()
      if (group.has(current)) continue
      
      const currentColor = nodeColors[current] || 'gray'
      if (currentColor !== color) continue
      
      group.add(current)
      
      const neighbors = getNeighbors(current, points.length)
      neighbors.forEach(neighbor => {
        if (!group.has(neighbor)) {
          toVisit.push(neighbor)
        }
      })
    }
    
    return group
  }
  
  const hasLiberties = (group, nodeColors) => {
    for (const nodeIndex of group) {
      const neighbors = getNeighbors(nodeIndex, points.length)
      for (const neighbor of neighbors) {
        const neighborColor = nodeColors[neighbor] || 'gray'
        if (neighborColor === 'gray') {
          return true // Found an empty liberty
        }
      }
    }
    return false
  }
  
  const captureGroups = (nodeColors, playedColor) => {
    const newNodeColors = { ...nodeColors }
    let totalCaptured = { blue: 0, red: 0 }
    
    const opponentColor = playedColor === 'blue' ? 'red' : 'blue'
    
    // Check all nodes for opponent groups without liberties
    const visited = new Set()
    
    for (let i = 0; i < points.length; i++) {
      if (visited.has(i)) continue
      
      const nodeColor = newNodeColors[i] || 'gray'
      if (nodeColor === opponentColor) {
        const group = getGroup(i, opponentColor, newNodeColors)
        
        // Mark all nodes in this group as visited
        group.forEach(node => visited.add(node))
        
        // Check if this group has liberties
        if (!hasLiberties(group, newNodeColors)) {
          // Capture the group
          group.forEach(node => {
            delete newNodeColors[node]
          })
          totalCaptured[playedColor] += group.size
        }
      }
    }
    
    return { newNodeColors, totalCaptured }
  }
  
  // Territory calculation function using flood-fill algorithm
  const calculateTerritory = (nodeColors) => {
    const territoryScores = { blue: 0, red: 0, neutral: 0 }
    const visited = new Set()
    const territoryOwnership = {} // Track which territory each empty node belongs to
    
    // Find all empty territory regions using flood-fill
    for (let i = 0; i < points.length; i++) {
      const nodeColor = nodeColors[i] || 'gray'
      
      // Only process empty nodes that haven't been visited
      if (nodeColor === 'gray' && !visited.has(i)) {
        const territory = new Set()
        const borderColors = new Set()
        
        // Flood-fill to find all connected empty nodes
        const stack = [i]
        while (stack.length > 0) {
          const current = stack.pop()
          if (visited.has(current)) continue
          
          const currentColor = nodeColors[current] || 'gray'
          if (currentColor !== 'gray') continue
          
          visited.add(current)
          territory.add(current)
          
          // Check neighbors
          const neighbors = getNeighbors(current, points.length)
          neighbors.forEach(neighbor => {
            const neighborColor = nodeColors[neighbor] || 'gray'
            
            if (neighborColor === 'gray' && !visited.has(neighbor)) {
              stack.push(neighbor)
            } else if (neighborColor !== 'gray') {
              borderColors.add(neighborColor)
            }
          })
        }
        
        // Determine territory ownership
        let territoryOwner = 'neutral'
        if (borderColors.size === 1) {
          territoryOwner = borderColors.values().next().value
        }
        
        // Record ownership for each node in this territory
        territory.forEach(nodeIndex => {
          territoryOwnership[nodeIndex] = territoryOwner
        })
        
        // Add to scores
        territoryScores[territoryOwner] += territory.size
      }
    }
    
    return { territoryScores, territoryOwnership }
  }
  
  // Check win conditions based on selected criteria
  const checkWinCondition = (currentCaptureCount) => {
    if (gameMode !== 'vs-computer' && gameMode !== 'challenge') return null
    
    // In challenge mode, use different win criteria based on level
    let effectiveWinCriteria = winCriteria
    if (gameMode === 'challenge') {
      if (challengeLevel === 1) {
        effectiveWinCriteria = 'capture1'
      } else if (challengeLevel === 2 || challengeLevel === 3) {
        effectiveWinCriteria = 'capture3'
      }
    }
    
    
    switch (effectiveWinCriteria) {
      case 'capture1':
        if (currentCaptureCount.blue >= 1) return 'win'
        if (currentCaptureCount.red >= 1) return 'lose'
        break
      case 'capture3':
        if (currentCaptureCount.blue >= 3) return 'win'
        if (currentCaptureCount.red >= 3) return 'lose'
        break
      case 'territory':
        // Territory mode uses double pass ending (handled elsewhere)
        break
      default:
        break
    }
    return null
  }
  
  // Game end detection and scoring
  const checkGameEnd = (nodeColors) => {
    // Calculate final territory and determine winner
    const { territoryScores, territoryOwnership: newTerritoryOwnership } = calculateTerritory(nodeColors)
    
    // Calculate final scores (territory + captures)
    const finalScores = {
      blue: territoryScores.blue + captureCount.blue,
      red: territoryScores.red + captureCount.red
    }
    
    // Update territory score and ownership for display
    setTerritoryScore(territoryScores)
    setTerritoryOwnership(newTerritoryOwnership)
    
    // Determine winner
    let result = null
    if (finalScores.blue > finalScores.red) {
      result = 'win' // Player (blue) wins
    } else if (finalScores.red > finalScores.blue) {
      result = 'lose' // Computer (red) wins
    } else {
      result = 'tie' // Tie game
    }
    
    setGameResult(result)
    setGameEnded(true)
    
    // Mark level as completed if player wins in challenge mode
    markLevelCompleted(result)
    
    // Show territory score automatically when game ends
    if (typeof setShowTerritoryScore === 'function') {
      setShowTerritoryScore(true)
    }
  }
  
  // Restart game function
  const restartGame = () => {
    setNodeColors({})
    setHoveredNode(null)
    setTerritoryOwnership({})
    setHoveredGroup(new Set())
    setHoveredGroupEdges(new Set())
    setHoveredInternalGroupEdges(new Set())
    setLastMoveWasPass(false)
    setGameEnded(false)
    setGameResult(null)
    setLastComputerMove(null)
    setCaptureCount({ blue: 0, red: 0 })
    setTerritoryScore({ blue: 0, red: 0, neutral: 0 })
  }
  
  // AI functions
  const getEmptyNodes = (nodeColors) => {
    const emptyNodes = []
    for (let i = 0; i < points.length; i++) {
      const nodeColor = nodeColors[i] || 'gray'
      if (nodeColor === 'gray') {
        emptyNodes.push(i)
      }
    }
    return emptyNodes
  }
  
  // Advanced AI evaluation function
  const evaluatePosition = (nodeColors, color) => {
    let score = 0
    const opponentColor = color === 'red' ? 'blue' : 'red'
    
    // Factor 1: Captures (most important)
    const { totalCaptured: captures } = captureGroups(nodeColors, color)
    const { totalCaptured: opponentCaptures } = captureGroups(nodeColors, opponentColor)
    score += (captures[color] || 0) * 1000 // High weight for captures
    score -= (opponentCaptures[opponentColor] || 0) * 1000 // Penalty for opponent captures
    
    // Factor 2: Liberty analysis (groups with few liberties)
    const visited = new Set()
    let minLiberties = Infinity
    let minLibertiesCount = 0
    
    // Analyze all groups
    for (let i = 0; i < points.length; i++) {
      if (visited.has(i)) continue
      
      const nodeColor = nodeColors[i] || 'gray'
      if (nodeColor === color) {
        const group = getGroup(i, color, nodeColors)
        group.forEach(node => visited.add(node))
        
        const liberties = getLiberties(group, nodeColors)
        const libertyCount = liberties.size
        
        if (libertyCount < minLiberties) {
          minLiberties = libertyCount
          minLibertiesCount = libertyCount
        }
        
        // Bonus for having liberties, penalty for few liberties
        if (libertyCount === 1) {
          score -= 50 // Danger penalty
        } else if (libertyCount === 2) {
          score -= 20 // Slight penalty
        } else {
          score += libertyCount * 5 // Bonus for safety
        }
      }
    }
    
    // Factor 3: Opponent group analysis (attacking opportunities)
    const opponentVisited = new Set()
    for (let i = 0; i < points.length; i++) {
      if (opponentVisited.has(i)) continue
      
      const nodeColor = nodeColors[i] || 'gray'
      if (nodeColor === opponentColor) {
        const group = getGroup(i, opponentColor, nodeColors)
        group.forEach(node => opponentVisited.add(node))
        
        const liberties = getLiberties(group, nodeColors)
        const libertyCount = liberties.size
        
        // Bonus for attacking groups with few liberties
        if (libertyCount === 1) {
          score += 100 // High bonus for attacking groups in atari
        } else if (libertyCount === 2) {
          score += 30 // Moderate bonus
        } else if (libertyCount === 3) {
          score += 10 // Small bonus
        }
      }
    }
    
    return score
  }
  
  // Advanced AI with optimized 2-move lookahead
  const makeAdvancedMove = (nodeColors) => {
    const myColor = 'red'
    const opponentColor = 'blue'
    
    // Get all valid moves
    const emptyNodes = getEmptyNodes(nodeColors)
    const validMoves = emptyNodes.filter(nodeIndex => 
      !wouldCreateZeroLibertyGroup(nodeIndex, myColor, nodeColors)
    )
    
    if (validMoves.length === 0) return null
    
    // Step 1: Use greedy algorithm to get top 5 candidate moves (reduced from 10)
    const candidateMoves = []
    
    for (const nodeIndex of validMoves) {
      // Simulate the move
      const testNodeColors = { ...nodeColors, [nodeIndex]: myColor }
      const { newNodeColors: afterCapture } = captureGroups(testNodeColors, myColor)
      
      // Quick evaluation for initial filtering
      const score = evaluatePosition(afterCapture, myColor)
      candidateMoves.push({ nodeIndex, score })
    }
    
    // Sort and take top 5 (reduced from 10)
    candidateMoves.sort((a, b) => b.score - a.score)
    const top5Moves = candidateMoves.slice(0, Math.min(5, candidateMoves.length))
    
    // Step 2: 2-move lookahead for each candidate (reduced from 3)
    const lookaheadResults = []
    
    for (const candidate of top5Moves) {
      const score = minimax(nodeColors, candidate.nodeIndex, 2, true, myColor, opponentColor)
      lookaheadResults.push({ nodeIndex: candidate.nodeIndex, score })
    }
    
    // Sort by lookahead score and pick the best
    lookaheadResults.sort((a, b) => b.score - a.score)
    return lookaheadResults[0].nodeIndex
  }
  
  // Optimized minimax algorithm with alpha-beta pruning
  const minimax = (nodeColors, moveIndex, depth, isMaximizing, myColor, opponentColor, alpha = -Infinity, beta = Infinity) => {
    // Base case: depth 0 or no valid moves
    if (depth === 0) {
      return evaluatePosition(nodeColors, myColor)
    }
    
    const currentColor = isMaximizing ? myColor : opponentColor
    const emptyNodes = getEmptyNodes(nodeColors)
    let validMoves = emptyNodes.filter(nodeIndex => 
      !wouldCreateZeroLibertyGroup(nodeIndex, currentColor, nodeColors)
    )
    
    if (validMoves.length === 0) {
      return evaluatePosition(nodeColors, myColor)
    }
    
    // Limit search to fewer moves for speed (max 8 moves per level)
    if (validMoves.length > 8) {
      // Quick evaluation to prioritize moves
      const moveScores = validMoves.map(nodeIndex => {
        const testNodeColors = { ...nodeColors, [nodeIndex]: currentColor }
        const { newNodeColors: afterCapture } = captureGroups(testNodeColors, currentColor)
        return {
          nodeIndex,
          score: evaluatePosition(afterCapture, isMaximizing ? myColor : opponentColor)
        }
      })
      
      moveScores.sort((a, b) => isMaximizing ? b.score - a.score : a.score - b.score)
      validMoves = moveScores.slice(0, 8).map(item => item.nodeIndex)
    }
    
    if (isMaximizing) {
      let maxScore = -Infinity
      
      for (const nodeIndex of validMoves) {
        // Simulate the move
        const testNodeColors = { ...nodeColors, [nodeIndex]: currentColor }
        const { newNodeColors: afterCapture } = captureGroups(testNodeColors, currentColor)
        
        const score = minimax(afterCapture, nodeIndex, depth - 1, false, myColor, opponentColor, alpha, beta)
        maxScore = Math.max(maxScore, score)
        alpha = Math.max(alpha, score)
        
        if (beta <= alpha) break // Alpha-beta pruning
      }
      
      return maxScore
    } else {
      let minScore = Infinity
      
      for (const nodeIndex of validMoves) {
        // Simulate the move
        const testNodeColors = { ...nodeColors, [nodeIndex]: currentColor }
        const { newNodeColors: afterCapture } = captureGroups(testNodeColors, currentColor)
        
        const score = minimax(afterCapture, nodeIndex, depth - 1, true, myColor, opponentColor, alpha, beta)
        minScore = Math.min(minScore, score)
        beta = Math.min(beta, score)
        
        if (beta <= alpha) break // Alpha-beta pruning
      }
      
      return minScore
    }
  }
  
  // Helper function to check if a move would create a zero liberty group (suicide)
  const wouldCreateZeroLibertyGroup = (nodeIndex, color, currentNodeColors) => {
    // Simulate placing the stone
    const testNodeColors = { ...currentNodeColors, [nodeIndex]: color }
    
    // Get the group this stone would be part of
    const newGroup = getGroup(nodeIndex, color, testNodeColors)
    const newGroupLiberties = getLiberties(newGroup, testNodeColors)
    
    // Check if this would create a group with zero liberties (suicide)
    return newGroupLiberties.size === 0
  }
  
  const makeRandomMove = (nodeColors) => {
    const emptyNodes = getEmptyNodes(nodeColors)
    if (emptyNodes.length === 0) return null
    
    // Filter out moves that would create zero liberty groups
    const validMoves = emptyNodes.filter(nodeIndex => 
      !wouldCreateZeroLibertyGroup(nodeIndex, 'red', nodeColors)
    )
    
    // If no valid moves, pass (return null)
    if (validMoves.length === 0) return null
    
    const randomIndex = Math.floor(Math.random() * validMoves.length)
    return validMoves[randomIndex]
  }
  
  const getLiberties = (group, nodeColors) => {
    const liberties = new Set()
    
    group.forEach(nodeIndex => {
      const neighbors = getNeighbors(nodeIndex, points.length)
      neighbors.forEach(neighbor => {
        const neighborColor = nodeColors[neighbor] || 'gray'
        if (neighborColor === 'gray') {
          liberties.add(neighbor)
        }
      })
    })
    
    return liberties
  }
  
  const makeAttackMove = (nodeColors) => {
    const opponentColor = 'blue' // Computer is red, so opponent is blue
    const visited = new Set()
    let targetGroup = null
    let minLiberties = Infinity
    let targetLiberties = null
    
    // Find all blue groups and their liberty counts
    for (let i = 0; i < points.length; i++) {
      if (visited.has(i)) continue
      
      const nodeColor = nodeColors[i] || 'gray'
      if (nodeColor === opponentColor) {
        const group = getGroup(i, opponentColor, nodeColors)
        
        // Mark all nodes in this group as visited
        group.forEach(node => visited.add(node))
        
        // Get liberties for this group
        const liberties = getLiberties(group, nodeColors)
        
        // Check if this group has fewer liberties than our current target
        if (liberties.size < minLiberties && liberties.size > 0) {
          minLiberties = liberties.size
          targetGroup = group
          targetLiberties = liberties
        }
      }
    }
    
    // If we found a target group, play in one of its liberties (but avoid suicide)
    if (targetGroup && targetLiberties && targetLiberties.size > 0) {
      const libertiesArray = Array.from(targetLiberties)
      
      // Filter out moves that would create zero liberty groups
      const validAttackMoves = libertiesArray.filter(nodeIndex => 
        !wouldCreateZeroLibertyGroup(nodeIndex, 'red', nodeColors)
      )
      
      if (validAttackMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * validAttackMoves.length)
        return validAttackMoves[randomIndex]
      }
    }
    
    // Fallback to random move if no valid attack moves found
    return makeRandomMove(nodeColors)
  }
  
  const makeGreedyMove = (nodeColors) => {
    const myColor = 'red' // Computer is red
    const opponentColor = 'blue' // Player is blue
    
    // Helper function to simulate placing a stone and check if it would create a group with only one liberty
    const wouldCreateGroupWithOneLibertyOrSuicide = (nodeIndex, color, currentNodeColors) => {
      // Simulate placing the stone
      const testNodeColors = { ...currentNodeColors, [nodeIndex]: color }
      
      // Get the group this stone would be part of
      const newGroup = getGroup(nodeIndex, color, testNodeColors)
      const newGroupLiberties = getLiberties(newGroup, testNodeColors)
      
      // Check if this would create a group with only one liberty (or suicide with zero liberties)
      return newGroupLiberties.size <= 1
    }
    
    // Helper function to check if a move would capture stones
    const wouldCaptureStones = (nodeIndex, color, currentNodeColors) => {
      // Simulate placing the stone
      const testNodeColors = { ...currentNodeColors, [nodeIndex]: color }
      
      // Use the existing captureGroups function to see if this move would capture anything
      const { totalCaptured } = captureGroups(testNodeColors, color)
      
      // Return the number of stones that would be captured
      return totalCaptured[color] || 0
    }
    
    // Priority 0: HIGHEST PRIORITY - Moves that capture stones
    const emptyNodes = getEmptyNodes(nodeColors)
    const capturingMoves = []
    
    for (const nodeIndex of emptyNodes) {
      // Check if this move would capture stones and is not suicide
      if (!wouldCreateZeroLibertyGroup(nodeIndex, myColor, nodeColors)) {
        const captureCount = wouldCaptureStones(nodeIndex, myColor, nodeColors)
        if (captureCount > 0) {
          capturingMoves.push({
            nodeIndex,
            captureCount,
            priority: 0 // Highest priority
          })
        }
      }
    }
    
    // If we have capturing moves, prioritize by capture count (most captures first)
    if (capturingMoves.length > 0) {
      capturingMoves.sort((a, b) => b.captureCount - a.captureCount)
      const maxCaptures = capturingMoves[0].captureCount
      const bestCapturingMoves = capturingMoves.filter(move => move.captureCount === maxCaptures)
      const randomCapturingMove = bestCapturingMoves[Math.floor(Math.random() * bestCapturingMoves.length)]
      return randomCapturingMove.nodeIndex
    }
    
    // Priority 1: Defensive moves - save our own groups with only one liberty
    const visited = new Set()
    const defensiveMoves = []
    
    for (let i = 0; i < points.length; i++) {
      if (visited.has(i)) continue
      
      const nodeColor = nodeColors[i] || 'gray'
      if (nodeColor === myColor) {
        const group = getGroup(i, myColor, nodeColors)
        
        // Mark all nodes in this group as visited
        group.forEach(node => visited.add(node))
        
        // Get liberties for this group
        const liberties = getLiberties(group, nodeColors)
        
        // If this group has only one liberty, it's in danger
        if (liberties.size === 1) {
          const libertyNode = liberties.values().next().value
          
          // Check if playing in this liberty would give the group more than one liberty
          const testNodeColors = { ...nodeColors, [libertyNode]: myColor }
          const expandedGroup = getGroup(i, myColor, testNodeColors)
          const expandedLiberties = getLiberties(expandedGroup, testNodeColors)
          
          if (expandedLiberties.size > 1) {
            defensiveMoves.push({
              nodeIndex: libertyNode,
              priority: 1,
              reason: 'save_own_group'
            })
          }
        }
      }
    }
    
    // If we have defensive moves, prioritize them
    if (defensiveMoves.length > 0) {
      const randomDefensiveMove = defensiveMoves[Math.floor(Math.random() * defensiveMoves.length)]
      return randomDefensiveMove.nodeIndex
    }
    
    // Priority 2: Aggressive moves - attack opponent groups with few liberties
    const aggressiveMoves = []
    const visitedOpponent = new Set()
    
    for (let i = 0; i < points.length; i++) {
      if (visitedOpponent.has(i)) continue
      
      const nodeColor = nodeColors[i] || 'gray'
      if (nodeColor === opponentColor) {
        const group = getGroup(i, opponentColor, nodeColors)
        
        // Mark all nodes in this group as visited
        group.forEach(node => visitedOpponent.add(node))
        
        // Get liberties for this group
        const liberties = getLiberties(group, nodeColors)
        
        // Only consider groups with few liberties (1-3)
        if (liberties.size >= 1 && liberties.size <= 3) {
          liberties.forEach(libertyNode => {
            // Check if playing here would NOT create a group with only one liberty for us
            if (!wouldCreateGroupWithOneLibertyOrSuicide(libertyNode, myColor, nodeColors)) {
              aggressiveMoves.push({
                nodeIndex: libertyNode,
                priority: 4 - liberties.size, // Lower liberty count = higher priority
                libertyCount: liberties.size,
                reason: 'attack_opponent'
              })
            }
          })
        }
      }
    }
    
    // Sort aggressive moves by priority (higher priority first)
    aggressiveMoves.sort((a, b) => b.priority - a.priority)
    
    // If we have aggressive moves, pick the highest priority one
    if (aggressiveMoves.length > 0) {
      // Among moves with the same priority, pick randomly
      const highestPriority = aggressiveMoves[0].priority
      const topPriorityMoves = aggressiveMoves.filter(move => move.priority === highestPriority)
      const randomAggressiveMove = topPriorityMoves[Math.floor(Math.random() * topPriorityMoves.length)]
      return randomAggressiveMove.nodeIndex
    }
    
    // Priority 3: Expansion moves - find safe moves that don't create vulnerable groups
    const safeMoves = []
    
    for (const nodeIndex of emptyNodes) {
      if (!wouldCreateGroupWithOneLibertyOrSuicide(nodeIndex, myColor, nodeColors)) {
        safeMoves.push(nodeIndex)
      }
    }
    
    // If we have safe moves, pick one randomly
    if (safeMoves.length > 0) {
      const randomIndex = Math.floor(Math.random() * safeMoves.length)
      return safeMoves[randomIndex]
    }
    
    // Priority 4: Fallback - if no safe moves, try random (this should rarely happen)
    return makeRandomMove(nodeColors)
  }
  
  // Group highlighting functions
  const getGroupAndEdges = (nodeIndex, nodeColors) => {
    const nodeColor = nodeColors[nodeIndex] || 'gray'
    if (nodeColor === 'gray') return { group: new Set(), groupEdges: new Set(), internalGroupEdges: new Set() }
    
    const group = getGroup(nodeIndex, nodeColor, nodeColors)
    const groupEdges = new Set()
    const internalGroupEdges = new Set()
    
    // Find all edges that connect group nodes to empty nodes (liberty edges)
    // and edges between group nodes (internal edges)
    group.forEach(groupNodeIndex => {
      const neighbors = getNeighbors(groupNodeIndex, points.length)
      neighbors.forEach(neighborIndex => {
        const neighborColor = nodeColors[neighborIndex] || 'gray'
        if (neighborColor === 'gray') {
          // Store liberty edges for thick highlighting
          groupEdges.add({ from: groupNodeIndex, to: neighborIndex })
        } else if (neighborColor === nodeColor && group.has(neighborIndex)) {
          // Store internal group edges for thin highlighting
          // Only add each edge once by ensuring from < to
          const edgeKey = groupNodeIndex < neighborIndex 
            ? { from: groupNodeIndex, to: neighborIndex }
            : { from: neighborIndex, to: groupNodeIndex }
          internalGroupEdges.add(edgeKey)
        }
      })
    })
    
    return { group, groupEdges, internalGroupEdges }
  }
  
  const handleNodeHover = (nodeIndex, isEntering) => {
    if (isEntering) {
      const nodeColor = nodeColors[nodeIndex] || 'gray'
      if (nodeColor !== 'gray') {
        const { group, groupEdges, internalGroupEdges } = getGroupAndEdges(nodeIndex, nodeColors)
        setHoveredGroup(group)
        setHoveredGroupEdges(groupEdges)
        setHoveredInternalGroupEdges(internalGroupEdges)
      }
      setHoveredNode(nodeIndex)
    } else {
      setHoveredNode(null)
      setHoveredGroup(new Set())
      setHoveredGroupEdges(new Set())
      setHoveredInternalGroupEdges(new Set())
    }
  }
  
  const { points, edges, edgeIndices, center } = useMemo(() => {
    const points = []
    const edges = []
    const edgeIndices = []
    
    // Generate diamond lattice points
    // Diamond lattice consists of two interpenetrating FCC lattices
    // We'll create a cubic diamond structure
    
    const spacing = 2
    const gridSize = size
    
    // Generate points in diamond lattice pattern
    // Diamond lattice has two sublattices offset by (1/4, 1/4, 1/4) of the unit cell
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          // First sublattice (A sites)
          points.push(new THREE.Vector3(
            x * spacing,
            y * spacing,
            z * spacing
          ))
          
          // Second sublattice (B sites) - offset by (1/4, 1/4, 1/4)
          points.push(new THREE.Vector3(
            (x + 0.25) * spacing,
            (y + 0.25) * spacing,
            (z + 0.25) * spacing
          ))
        }
      }
    }
    
    // Calculate center point for proper rotation
    const center = new THREE.Vector3()
    if (points.length > 0) {
      points.forEach(point => center.add(point))
      center.divideScalar(points.length)
    }
    
    // Center all points around origin
    points.forEach(point => point.sub(center))
    
    // Generate edges by using the same logic as getNeighbors will use
    // This ensures consistency between drawn edges and neighbor detection
    
    // First, generate a temporary edgeIndices array to bootstrap getNeighbors
    const tempEdgeIndices = []
    
    // Create tetrahedral connections using the same pattern as before
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          const cellIndex = x * gridSize * gridSize + y * gridSize + z
          const aIndex = cellIndex * 2 // A site (first sublattice)
          
          if (aIndex >= points.length) continue
          
          // A-site tetrahedral neighbors
          const tetrahedralNeighbors = [
            [x, y, z],      // Current cell B-site
            [x-1, y, z],    // Left neighbor
            [x, y-1, z],    // Front neighbor  
            [x, y, z-1]     // Bottom neighbor
          ]
          
          tetrahedralNeighbors.forEach(([nx, ny, nz]) => {
            if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && nz >= 0 && nz < gridSize) {
              const neighborCellIndex = nx * gridSize * gridSize + ny * gridSize + nz
              const bIndex = neighborCellIndex * 2 + 1 // B site in neighbor cell
              
              if (bIndex < points.length) {
                tempEdgeIndices.push([aIndex, bIndex])
              }
            }
          })
        }
      }
    }
    
    // Now generate the actual edges and edgeIndices arrays
    const edgeSet = new Set()
    
    tempEdgeIndices.forEach(([startIndex, endIndex]) => {
      const edgeKey = startIndex < endIndex ? `${startIndex}-${endIndex}` : `${endIndex}-${startIndex}`
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey)
        edges.push([points[startIndex], points[endIndex]])
        edgeIndices.push([startIndex, endIndex])
      }
    })
    
    // Validate that edges and edgeIndices are consistent
    if (edges.length !== edgeIndices.length) {
      console.warn('Edges and edgeIndices arrays are inconsistent', edges.length, edgeIndices.length)
    }
    
    // Debug: Log edge information for debugging
    if (size === 3) {
      console.log('Grid size:', size, 'Total points:', points.length, 'Total edges:', edges.length)
      
      // Check specifically for edge 13-16
      const hasEdge13to16 = edgeIndices.some(([a, b]) => 
        (a === 13 && b === 16) || (a === 16 && b === 13)
      )
      console.log('Edge 13-16 exists in component:', hasEdge13to16)
      
      // Log all edges containing node 13 or 16
      const relevantEdges = edgeIndices.filter(([a, b]) => a === 13 || b === 13 || a === 16 || b === 16)
      console.log('Edges involving nodes 13 or 16:', relevantEdges)
      
      // Show the actual positions of nodes 13 and 16
      console.log('Node 13 position:', points[13])
      console.log('Node 16 position:', points[16])
      
      // Calculate distance between nodes 13 and 16
      const node13 = points[13]
      const node16 = points[16]
      const distance = Math.sqrt(
        Math.pow(node16.x - node13.x, 2) + 
        Math.pow(node16.y - node13.y, 2) + 
        Math.pow(node16.z - node13.z, 2)
      )
      console.log(`Distance between nodes 13 and 16: ${distance.toFixed(2)}`)
      
      // Check if any other edge might visually appear to connect these nodes
      console.log('Looking for edges that might visually appear to connect 13 and 16...')
      edgeIndices.forEach(([a, b], i) => {
        if (i < 20) { // Check first 20 edges
          const pointA = points[a]
          const pointB = points[b]
          console.log(`Edge ${i}: ${a}-${b} | (${pointA.x.toFixed(1)}, ${pointA.y.toFixed(1)}, ${pointA.z.toFixed(1)}) to (${pointB.x.toFixed(1)}, ${pointB.y.toFixed(1)}, ${pointB.z.toFixed(1)})`)
        }
      })
      
      // Validate that edges and edgeIndices are perfectly synchronized
      console.log('Validating edge/edgeIndices synchronization...')
      for (let i = 0; i < Math.min(edges.length, edgeIndices.length); i++) {
        const [startIndex, endIndex] = edgeIndices[i]
        const [startPoint, endPoint] = edges[i]
        
        if (startPoint !== points[startIndex] || endPoint !== points[endIndex]) {
          console.error(`MISMATCH at edge ${i}: edgeIndices says ${startIndex}-${endIndex} but edge points don't match`)
        }
        
        // Check if this creates a visual line that looks like 13-16
        if (i < 10) {
          console.log(`Edge ${i}: ${startIndex}-${endIndex} (${startPoint.x.toFixed(1)},${startPoint.y.toFixed(1)},${startPoint.z.toFixed(1)}) -> (${endPoint.x.toFixed(1)},${endPoint.y.toFixed(1)},${endPoint.z.toFixed(1)})`)
        }
      }
    }
    
    return { points, edges, edgeIndices, center }
  }, [size])
  
  
  // Reset game state when grid size changes
  useEffect(() => {
    restartGame()
  }, [size, setCaptureCount, setTerritoryScore])
  
  // Calculate territory when showTerritoryScore changes
  useEffect(() => {
    if (showTerritoryScore) {
      const { territoryScores, territoryOwnership: newTerritoryOwnership } = calculateTerritory(nodeColors)
      setTerritoryScore(territoryScores)
      setTerritoryOwnership(newTerritoryOwnership)
    }
  }, [showTerritoryScore, nodeColors])
  
  // Initialize line geometry
  useEffect(() => {
    const initialGeometry = getLineGeometry(cameraPosition)
    setLineGeometry(initialGeometry)
  }, [points, edgeIndices, hoveredGroupEdges, hoveredInternalGroupEdges, hoveredGroup, nodeColors])
  
  // Add event listener for pass button
  useEffect(() => {
    const handlePlayerPass = () => {
      if ((gameMode === 'vs-computer' || gameMode === 'challenge') && !gameEnded) {
        // Player passed
        if (lastMoveWasPass) {
          // Both player and computer passed in succession - end game (only for territory mode)
          if (winCriteria === 'territory') {
            checkGameEnd(nodeColors)
          }
        } else {
          setLastMoveWasPass(true)
          
          // Trigger computer move immediately
          setTimeout(() => {
            setAiThinking(true)
            
            // Use setTimeout to allow UI to update with thinking indicator
            setTimeout(() => {
              let computerMove = null
              
              // Choose AI strategy based on aiMode
              if (aiMode === 'attack') {
                computerMove = makeAttackMove(nodeColors)
              } else if (aiMode === 'greedy') {
                computerMove = makeGreedyMove(nodeColors)
              } else if (aiMode === 'advanced') {
                computerMove = makeAdvancedMove(nodeColors)
              } else {
                computerMove = makeRandomMove(nodeColors)
              }
              
              setAiThinking(false)
              
              if (computerMove !== null) {
                const computerNodeColors = {
                  ...nodeColors,
                  [computerMove]: 'red'
                }
                
                // Track computer's last move for highlighting
                setLastComputerMove(computerMove)
                
                // Check for captures from computer move
                const { newNodeColors: afterComputerCapture, totalCaptured: computerCaptured } = captureGroups(computerNodeColors, 'red')
                
                // Update node colors with computer move
                setNodeColors(afterComputerCapture)
                
                // Update capture count for computer and check for win
                let updatedPassCaptureCount = captureCount
                if (computerCaptured.red > 0) {
                  updatedPassCaptureCount = {
                    ...captureCount,
                    red: captureCount.red + computerCaptured.red
                  }
                  setCaptureCount(updatedPassCaptureCount)
                }
                
                // Check for win condition after computer move
                const passComputerWinResult = checkWinCondition(updatedPassCaptureCount)
                if (passComputerWinResult) {
                  setGameResult(passComputerWinResult)
                  setGameEnded(true)
                  // Mark level as completed if player wins in challenge mode
                  markLevelCompleted(passComputerWinResult)
                  if (typeof setShowTerritoryScore === 'function') {
                    setShowTerritoryScore(true)
                  }
                  return // End game
                }
                
                // Computer made a move (not a pass)
                setLastMoveWasPass(false)
              } else {
                // Computer also passed - clear last move highlight
                setLastComputerMove(null)
                // Computer also passed - end game (only for territory mode)
                if (winCriteria === 'territory') {
                  checkGameEnd(nodeColors)
                }
              }
            }, 100) // Small delay to show thinking indicator
          }, 300) // Slight delay to feel natural
        }
      }
    }
    
    window.addEventListener('playerPass', handlePlayerPass)
    
    return () => {
      window.removeEventListener('playerPass', handlePlayerPass)
    }
  }, [gameMode, aiMode, nodeColors, setCaptureCount])
  
  // Add event listener for restart game
  useEffect(() => {
    const handleRestartGame = () => {
      restartGame()
    }
    
    window.addEventListener('restartGame', handleRestartGame)
    
    return () => {
      window.removeEventListener('restartGame', handleRestartGame)
    }
  }, [])
  
  // Update gameStateRef when game state changes
  useEffect(() => {
    if (gameStateRef) {
      gameStateRef.current = { gameEnded, gameResult, aiThinking }
    }
  }, [gameEnded, gameResult, aiThinking, gameStateRef])
  
  const getLineGeometry = (cameraPosition) => {
    const regularGeometry = new THREE.BufferGeometry()
    const highlightedGeometry = new THREE.BufferGeometry()
    
    const regularPositions = []
    const regularColors = []
    const highlightedPositions = []
    const highlightedColors = []
    
    
    // Get the hovered group's color for highlighting
    let hoveredGroupColor = null
    if (hoveredGroup.size > 0) {
      const firstNodeIndex = hoveredGroup.values().next().value
      const groupColorName = nodeColors[firstNodeIndex] || 'gray'
      if (groupColorName === 'blue') {
        hoveredGroupColor = [0.373, 0.647, 0.98] // #60a5fa
      } else if (groupColorName === 'red') {
        hoveredGroupColor = [0.882, 0.114, 0.282] // #e11d48
      }
    }
    
    // Generate line geometry directly from edgeIndices to avoid any mismatch
    edgeIndices.forEach(([startIndex, endIndex], index) => {
      
      const startPoint = points[startIndex]
      const endPoint = points[endIndex]
      
      if (!startPoint || !endPoint) {
        console.error('Invalid edge indices:', startIndex, endIndex)
        return
      }
      
      
      // Check if this edge is in the hovered group's liberty edges
      let isHighlighted = false
      for (const edge of hoveredGroupEdges) {
        if ((edge.from === startIndex && edge.to === endIndex) ||
            (edge.from === endIndex && edge.to === startIndex)) {
          isHighlighted = true
          break
        }
      }
      
      if (isHighlighted && hoveredGroupColor) {
        // Add to highlighted geometry
        highlightedPositions.push(startPoint.x, startPoint.y, startPoint.z)
        highlightedPositions.push(endPoint.x, endPoint.y, endPoint.z)
        highlightedColors.push(...hoveredGroupColor, 1.0) // Start point
        highlightedColors.push(...hoveredGroupColor, 1.0) // End point
      } else {
        // Add to regular geometry
        regularPositions.push(startPoint.x, startPoint.y, startPoint.z)
        regularPositions.push(endPoint.x, endPoint.y, endPoint.z)
        
        // Calculate opacity for line based on distance from camera for fog effect
        if (!cameraPosition) {
          regularColors.push(0.4, 0.45, 0.55, 1.0) // Start point
          regularColors.push(0.4, 0.45, 0.55, 1.0) // End point
          return
        }
        
        // Calculate average distance from camera to midpoint of edge
        const midPoint = {
          x: (startPoint.x + endPoint.x) / 2,
          y: (startPoint.y + endPoint.y) / 2,
          z: (startPoint.z + endPoint.z) / 2
        }
        
        const distance = Math.sqrt(
          Math.pow(midPoint.x - cameraPosition.x, 2) +
          Math.pow(midPoint.y - cameraPosition.y, 2) +
          Math.pow(midPoint.z - cameraPosition.z, 2)
        )
        
        // Calculate distances for all points to get min/max
        const distances = points.map(p => Math.sqrt(
          Math.pow(p.x - cameraPosition.x, 2) +
          Math.pow(p.y - cameraPosition.y, 2) +
          Math.pow(p.z - cameraPosition.z, 2)
        ))
        
        const minDistance = Math.min(...distances)
        const maxDistance = Math.max(...distances)
        const distanceRange = maxDistance - minDistance
        
        let alpha = 1.0
        if (distanceRange > 0) {
          const normalizedDistance = (distance - minDistance) / distanceRange
          alpha = 1.0 - (normalizedDistance * 0.8) // Fog effect: 0.2-1.0 opacity range
        }
        
        regularColors.push(0.4, 0.45, 0.55, alpha) // Start point
        regularColors.push(0.4, 0.45, 0.55, alpha) // End point
      }
    })
    
    
    regularGeometry.setAttribute('position', new THREE.Float32BufferAttribute(regularPositions, 3))
    regularGeometry.setAttribute('color', new THREE.Float32BufferAttribute(regularColors, 4))
    
    highlightedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(highlightedPositions, 3))
    highlightedGeometry.setAttribute('color', new THREE.Float32BufferAttribute(highlightedColors, 4))
    
    
    
    return { regularLineGeometry: regularGeometry, highlightedLineGeometry: highlightedGeometry }
  }
  
  // State for camera position and line geometry
  const [cameraPosition, setCameraPosition] = useState({ x: 10, y: 10, z: 10 })
  const [lineGeometry, setLineGeometry] = useState(null)
  
  // Update camera position and line geometry on each frame
  useFrame((state) => {
    const newCameraPosition = state.camera.position
    setCameraPosition({ x: newCameraPosition.x, y: newCameraPosition.y, z: newCameraPosition.z })
    
    // Update line geometry with new camera position
    const newGeometry = getLineGeometry(newCameraPosition)
    setLineGeometry(newGeometry)
  })
  
  // Handle node click to apply selected color and check for captures
  const handleNodeClick = (nodeIndex, event) => {
    event.stopPropagation() // Prevent orbit controls from interfering
    
    // Don't allow moves if game has ended
    if (gameEnded) {
      restartGame()
      return
    }
    
    // Only allow placing stones on empty intersections
    const currentColor = nodeColors[nodeIndex] || 'gray'
    if (currentColor !== 'gray') {
      return
    }
    
    // Determine the color to place based on game mode
    let colorToPlace = selectedColor
    if (gameMode === 'vs-computer' || gameMode === 'challenge') {
      colorToPlace = 'blue' // Player is always blue in vs-computer and challenge modes
    }
    
    // Clear computer's last move highlight when player makes a move
    setLastComputerMove(null)
    
    // Place the stone
    const newNodeColors = {
      ...nodeColors,
      [nodeIndex]: colorToPlace
    }
    
    // Check for captures
    const { newNodeColors: afterCapture, totalCaptured } = captureGroups(newNodeColors, colorToPlace)
    
    // Update node colors
    setNodeColors(afterCapture)
    
    // Update capture count and check for win
    let updatedCaptureCount = captureCount
    if (totalCaptured[colorToPlace] > 0) {
      updatedCaptureCount = {
        ...captureCount,
        [colorToPlace]: captureCount[colorToPlace] + totalCaptured[colorToPlace]
      }
      setCaptureCount(updatedCaptureCount)
    }
    
    // Check for win condition after player move (always check, not just when captures occur)
    const winResult = checkWinCondition(updatedCaptureCount)
    if (winResult) {
      setGameResult(winResult)
      setGameEnded(true)
      // Mark level as completed if player wins in challenge mode
      markLevelCompleted(winResult)
      if (typeof setShowTerritoryScore === 'function') {
        setShowTerritoryScore(true)
      }
      return // End game, don't continue to computer move
    }
    
    // Player made a move (not a pass)
    setLastMoveWasPass(false)
    
    // In vs-computer or challenge mode, make computer move after a short delay
    if (gameMode === 'vs-computer' || gameMode === 'challenge') {
      setTimeout(() => {
        setAiThinking(true)
        
        // Use setTimeout to allow UI to update with thinking indicator
        setTimeout(() => {
          let computerMove = null
          
          // Choose AI strategy based on aiMode
          if (aiMode === 'attack') {
            computerMove = makeAttackMove(afterCapture)
          } else if (aiMode === 'greedy') {
            computerMove = makeGreedyMove(afterCapture)
          } else if (aiMode === 'advanced') {
            computerMove = makeAdvancedMove(afterCapture)
          } else {
            computerMove = makeRandomMove(afterCapture)
          }
          
          setAiThinking(false)
          
          if (computerMove !== null) {
            const computerNodeColors = {
              ...afterCapture,
              [computerMove]: 'red'
            }
            
            // Track computer's last move for highlighting
            setLastComputerMove(computerMove)
            
            // Check for captures from computer move
            const { newNodeColors: afterComputerCapture, totalCaptured: computerCaptured } = captureGroups(computerNodeColors, 'red')
            
            // Update node colors with computer move
            setNodeColors(afterComputerCapture)
            
            // Update capture count for computer and check for win
            let updatedComputerCaptureCount = updatedCaptureCount
            if (computerCaptured.red > 0) {
              updatedComputerCaptureCount = {
                ...updatedCaptureCount,
                red: updatedCaptureCount.red + computerCaptured.red
              }
              setCaptureCount(updatedComputerCaptureCount)
            }
            
            // Check for win condition after computer move
            const computerWinResult = checkWinCondition(updatedComputerCaptureCount)
            if (computerWinResult) {
              setGameResult(computerWinResult)
              setGameEnded(true)
              // Mark level as completed if player wins in challenge mode
              markLevelCompleted(computerWinResult)
              if (typeof setShowTerritoryScore === 'function') {
                setShowTerritoryScore(true)
              }
              return // End game
            }
            
            // Computer made a move (not a pass)
            setLastMoveWasPass(false)
          } else {
            // Computer passed - clear last move highlight
            setLastComputerMove(null)
            if (lastMoveWasPass) {
              // Both player and computer passed - end game (only for territory mode)
              if (winCriteria === 'territory') {
                checkGameEnd(afterCapture)
              }
            } else {
              setLastMoveWasPass(true)
            }
          }
        }, 100) // Small delay to show thinking indicator
      }, 500) // Half second delay for computer move
    }
  }
  
  // Get color for a specific node
  const getNodeColor = (nodeIndex) => {
    const savedColor = nodeColors[nodeIndex] || 'gray'
    
    if (savedColor === 'blue') {
      return "#60a5fa" // Lighter blue for better contrast
    } else if (savedColor === 'red') {
      return "#e11d48"
    } else if (savedColor === 'gray' && showTerritoryScore) {
      // Show territory ownership when scoring is enabled
      const territoryOwner = territoryOwnership[nodeIndex] || 'neutral'
      
      if (territoryOwner === 'blue') {
        return "#bfdbfe" // Light blue for blue territory
      } else if (territoryOwner === 'red') {
        return "#fecaca" // Light red for red territory
      } else {
        return "#f3f4f6" // Neutral territory color
      }
    } else {
      return "#d1d5db" // Much lighter gray color
    }
  }
  
  // Get scale for hover effect
  const getNodeScale = (nodeIndex) => {
    if (hoveredNode === nodeIndex) return 1.3
    if (hoveredGroup.has(nodeIndex)) return 1.2
    return 1.0
  }
  
  // Get opacity based on distance from camera for fog effect
  const getNodeOpacity = (nodeIndex, cameraPosition) => {
    const point = points[nodeIndex]
    if (!point || !cameraPosition) return 1.0
    
    // Calculate distance from camera to point
    const distance = Math.sqrt(
      Math.pow(point.x - cameraPosition.x, 2) +
      Math.pow(point.y - cameraPosition.y, 2) +
      Math.pow(point.z - cameraPosition.z, 2)
    )
    
    // Calculate distances for all points to get min/max
    const distances = points.map(p => Math.sqrt(
      Math.pow(p.x - cameraPosition.x, 2) +
      Math.pow(p.y - cameraPosition.y, 2) +
      Math.pow(p.z - cameraPosition.z, 2)
    ))
    
    const minDistance = Math.min(...distances)
    const maxDistance = Math.max(...distances)
    const distanceRange = maxDistance - minDistance
    
    if (distanceRange === 0) return 1.0
    
    // Normalize distance to 0-1 range, then map to opacity 0.3-1.0 for fog effect
    // Closer points (smaller distance) = higher opacity
    const normalizedDistance = (distance - minDistance) / distanceRange
    return 1.0 - (normalizedDistance * 0.7)
  }
  
  return (
    <group ref={groupRef}>
      {/* Render points as clickable spheres */}
      {points.map((point, index) => (
        <Sphere
          key={index}
          position={[point.x, point.y, point.z]}
          args={[0.15, 8, 8]}
          scale={getNodeScale(index)}
          onClick={(event) => handleNodeClick(index, event)}
          onPointerOver={(event) => {
            event.stopPropagation()
            handleNodeHover(index, true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={(event) => {
            event.stopPropagation()
            handleNodeHover(index, false)
            document.body.style.cursor = 'default'
          }}
        >
          <meshStandardMaterial 
            color={getNodeColor(index)}
            emissive={getNodeColor(index)}
            emissiveIntensity={lastComputerMove === index ? 0.4 : 0.2}
            roughness={0.3}
            metalness={0.1}
            opacity={getNodeOpacity(index, cameraPosition)}
            transparent={true}
          />
        </Sphere>
      ))}
      
      {/* Render node numbers when debugging */}
      {showNodeNumbers && points.map((point, index) => (
        <Text
          key={`number-${index}`}
          position={[point.x, point.y + 0.3, point.z]}
          fontSize={0.15}
          color="#333333"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#ffffff"
        >
          {index}
        </Text>
      ))}
      
      {/* Render edge numbers when debugging */}
      {showEdgeNumbers && edgeIndices.map(([startIndex, endIndex], edgeIndex) => {
        const startPoint = points[startIndex]
        const endPoint = points[endIndex]
        
        if (!startPoint || !endPoint) return null
        
        // Calculate midpoint of the edge
        const midPoint = {
          x: (startPoint.x + endPoint.x) / 2,
          y: (startPoint.y + endPoint.y) / 2,
          z: (startPoint.z + endPoint.z) / 2
        }
        
        return (
          <Text
            key={`edge-${edgeIndex}`}
            position={[midPoint.x, midPoint.y, midPoint.z]}
            fontSize={0.12}
            color="#ff6600"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#ffffff"
          >
            {edgeIndex}
          </Text>
        )
      })}
      
      {/* Render regular edges as lines */}
      {lineGeometry && (
        <lineSegments geometry={lineGeometry.regularLineGeometry}>
          <lineBasicMaterial 
            vertexColors={true}
            transparent={true}
            linewidth={1}
          />
        </lineSegments>
      )}
      
      {/* Render highlighted edges as thick cylinders */}
      {Array.from(hoveredGroupEdges).map((edge, index) => {
        const startPoint = points[edge.from]
        const endPoint = points[edge.to]
        if (!startPoint || !endPoint) return null
        
        const direction = new THREE.Vector3().subVectors(endPoint, startPoint)
        const length = direction.length()
        const center = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5)
        
        // Get the hovered group's color
        let highlightColor = "#ffcc33" // Default yellow
        if (hoveredGroup.size > 0) {
          const firstNodeIndex = hoveredGroup.values().next().value
          const groupColorName = nodeColors[firstNodeIndex] || 'gray'
          if (groupColorName === 'blue') {
            highlightColor = "#60a5fa"
          } else if (groupColorName === 'red') {
            highlightColor = "#e11d48"
          }
        }
        
        // Calculate rotation to align cylinder with edge direction
        const up = new THREE.Vector3(0, 1, 0)
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction.normalize())
        
        return (
          <mesh 
            key={`highlight-${index}`} 
            position={[center.x, center.y, center.z]}
            quaternion={quaternion}
          >
            <cylinderGeometry args={[0.04, 0.04, length, 8]} />
            <meshBasicMaterial color={highlightColor} />
          </mesh>
        )
      }).filter(Boolean)}
      
      {/* Render internal group edges as thin cylinders */}
      {Array.from(hoveredInternalGroupEdges).map((edge, index) => {
        const startPoint = points[edge.from]
        const endPoint = points[edge.to]
        if (!startPoint || !endPoint) return null
        
        const direction = new THREE.Vector3().subVectors(endPoint, startPoint)
        const length = direction.length()
        const center = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5)
        
        // Get the hovered group's color
        let highlightColor = "#ffcc33" // Default yellow
        if (hoveredGroup.size > 0) {
          const firstNodeIndex = hoveredGroup.values().next().value
          const groupColorName = nodeColors[firstNodeIndex] || 'gray'
          if (groupColorName === 'blue') {
            highlightColor = "#60a5fa"
          } else if (groupColorName === 'red') {
            highlightColor = "#e11d48"
          }
        }
        
        // Calculate rotation to align cylinder with edge direction
        const up = new THREE.Vector3(0, 1, 0)
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction.normalize())
        
        return (
          <mesh 
            key={`internal-highlight-${index}`} 
            position={[center.x, center.y, center.z]}
            quaternion={quaternion}
          >
            <cylinderGeometry args={[0.02, 0.02, length, 8]} />
            <meshBasicMaterial color={highlightColor} />
          </mesh>
        )
      }).filter(Boolean)}
    </group>
  )
}

function TetrahedralLattice({ size, selectedColor, captureCount, setCaptureCount, territoryScore, setTerritoryScore, showTerritoryScore, setShowTerritoryScore, gameMode, aiMode, winCriteria, showNodeNumbers, showEdgeNumbers, challengeLevel, completedLevels, setCompletedLevels }) {
  // Create a ref to access the game state from the inner component
  const gameStateRef = useRef({ gameEnded: false, gameResult: null })
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <Canvas
        camera={{ position: [10, 10, 10], fov: 75 }}
        style={{ width: '100%', height: '500px' }}
      >
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.0} />
        <pointLight position={[-10, 10, -10]} intensity={0.8} />
        <pointLight position={[10, -10, 10]} intensity={0.6} />
        <directionalLight position={[0, 20, 0]} intensity={0.5} />
        
        
        <TetrahedralLatticePoints 
          size={size} 
          selectedColor={selectedColor} 
          captureCount={captureCount}
          setCaptureCount={setCaptureCount}
          territoryScore={territoryScore}
          setTerritoryScore={setTerritoryScore}
          showTerritoryScore={showTerritoryScore}
          setShowTerritoryScore={setShowTerritoryScore}
          gameMode={gameMode}
          aiMode={aiMode}
          winCriteria={winCriteria}
          showNodeNumbers={showNodeNumbers}
          showEdgeNumbers={showEdgeNumbers}
          challengeLevel={challengeLevel}
          completedLevels={completedLevels}
          setCompletedLevels={setCompletedLevels}
          gameStateRef={gameStateRef}
        />
        
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={1}
          enableZoom={true}
          enablePan={true}
        />
      </Canvas>
      
      <GameOverlay gameStateRef={gameStateRef} />
      <AIThinkingOverlay gameStateRef={gameStateRef} />
    </div>
  )
}

// Game Over Overlay Component
function GameOverlay({ gameStateRef }) {
  const [gameEnded, setGameEnded] = useState(false)
  const [gameResult, setGameResult] = useState(null)
  
  // Check game state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameStateRef.current) {
        setGameEnded(gameStateRef.current.gameEnded)
        setGameResult(gameStateRef.current.gameResult)
      }
    }, 100)
    
    return () => clearInterval(interval)
  }, [gameStateRef])
  
  if (!gameEnded) return null
  
  const getResultMessage = () => {
    switch (gameResult) {
      case 'win':
        return 'You Win!'
      case 'lose':
        return 'You Lose!'
      case 'tie':
        return 'Tie Game!'
      default:
        return 'Game Over'
    }
  }
  
  const getResultColor = () => {
    switch (gameResult) {
      case 'win':
        return '#10b981' // Green
      case 'lose':
        return '#ef4444' // Red
      case 'tie':
        return '#6b7280' // Gray
      default:
        return '#6b7280'
    }
  }
  
  return (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        cursor: 'pointer'
      }}
      onClick={() => {
        // Trigger restart by dispatching a custom event
        window.dispatchEvent(new CustomEvent('restartGame'))
      }}
    >
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        maxWidth: '300px'
      }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: getResultColor(),
          marginBottom: '1rem',
          margin: 0
        }}>
          {getResultMessage()}
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '0.875rem',
          marginBottom: '1rem',
          margin: '0.5rem 0'
        }}>
          Click anywhere to restart
        </p>
      </div>
    </div>
  )
}

// AI Thinking Overlay Component
function AIThinkingOverlay({ gameStateRef }) {
  const [aiThinking, setAiThinking] = useState(false)
  
  // Check AI thinking state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameStateRef.current) {
        setAiThinking(gameStateRef.current.aiThinking || false)
      }
    }, 50) // Check more frequently for responsive UI
    
    return () => clearInterval(interval)
  }, [gameStateRef])
  
  if (!aiThinking) return null
  
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: '8px',
      fontSize: '1.2rem',
      fontWeight: '500',
      zIndex: 5,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{
        width: '20px',
        height: '20px',
        border: '2px solid #ffffff',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      AI Thinking...
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  )
}

export default TetrahedralLattice