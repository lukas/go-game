import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Text } from '@react-three/drei'
import * as THREE from 'three'

function TetrahedralLatticePoints({ size, selectedColor, cloudiness, captureCount, setCaptureCount, territoryScore, setTerritoryScore, showTerritoryScore, gameMode, aiMode, showNodeNumbers, showEdgeNumbers }) {
  const groupRef = useRef()
  const [nodeColors, setNodeColors] = useState({})
  const [hoveredNode, setHoveredNode] = useState(null)
  const [territoryOwnership, setTerritoryOwnership] = useState({})
  const [hoveredGroup, setHoveredGroup] = useState(new Set())
  const [hoveredGroupEdges, setHoveredGroupEdges] = useState(new Set())
  
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
  
  const makeRandomMove = (nodeColors) => {
    const emptyNodes = getEmptyNodes(nodeColors)
    if (emptyNodes.length === 0) return null
    
    const randomIndex = Math.floor(Math.random() * emptyNodes.length)
    return emptyNodes[randomIndex]
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
    
    // If we found a target group, play in one of its liberties
    if (targetGroup && targetLiberties && targetLiberties.size > 0) {
      const libertiesArray = Array.from(targetLiberties)
      const randomIndex = Math.floor(Math.random() * libertiesArray.length)
      return libertiesArray[randomIndex]
    }
    
    // Fallback to random move if no opponent groups found
    return makeRandomMove(nodeColors)
  }
  
  // Group highlighting functions
  const getGroupAndEdges = (nodeIndex, nodeColors) => {
    const nodeColor = nodeColors[nodeIndex] || 'gray'
    if (nodeColor === 'gray') return { group: new Set(), groupEdges: new Set() }
    
    const group = getGroup(nodeIndex, nodeColor, nodeColors)
    const groupEdges = new Set()
    
    // Find all edges that connect group nodes to empty nodes
    group.forEach(groupNodeIndex => {
      const neighbors = getNeighbors(groupNodeIndex, points.length)
      neighbors.forEach(neighborIndex => {
        const neighborColor = nodeColors[neighborIndex] || 'gray'
        if (neighborColor === 'gray') {
          // Store the actual edge indices for highlighting
          groupEdges.add({ from: groupNodeIndex, to: neighborIndex })
        }
      })
    })
    
    return { group, groupEdges }
  }
  
  const handleNodeHover = (nodeIndex, isEntering) => {
    if (isEntering) {
      const nodeColor = nodeColors[nodeIndex] || 'gray'
      if (nodeColor !== 'gray') {
        const { group, groupEdges } = getGroupAndEdges(nodeIndex, nodeColors)
        setHoveredGroup(group)
        setHoveredGroupEdges(groupEdges)
      }
      setHoveredNode(nodeIndex)
    } else {
      setHoveredNode(null)
      setHoveredGroup(new Set())
      setHoveredGroupEdges(new Set())
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
    setNodeColors({})
    setHoveredNode(null)
    setTerritoryOwnership({})
    setHoveredGroup(new Set())
    setHoveredGroupEdges(new Set())
    // Reset capture count in parent component
    setCaptureCount({ blue: 0, red: 0 })
    setTerritoryScore({ blue: 0, red: 0, neutral: 0 })
  }, [size, setCaptureCount, setTerritoryScore])
  
  // Calculate territory when showTerritoryScore changes
  useEffect(() => {
    if (showTerritoryScore) {
      const { territoryScores, territoryOwnership: newTerritoryOwnership } = calculateTerritory(nodeColors)
      setTerritoryScore(territoryScores)
      setTerritoryOwnership(newTerritoryOwnership)
    }
  }, [showTerritoryScore, nodeColors])
  
  const { regularLineGeometry, highlightedLineGeometry } = useMemo(() => {
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
        
        if (cloudiness) {
          // Calculate opacity for line based on average z-depth of endpoints
          const avgZ = (startPoint.z + endPoint.z) / 2
          const maxZ = Math.max(...points.map(p => p.z))
          const minZ = Math.min(...points.map(p => p.z))
          const zRange = maxZ - minZ
          
          let alpha = 1.0
          if (zRange > 0) {
            const normalizedZ = (avgZ - minZ) / zRange
            alpha = 0.2 + (normalizedZ * 0.8)
          }
          
          regularColors.push(0.4, 0.45, 0.55, alpha) // Start point
          regularColors.push(0.4, 0.45, 0.55, alpha) // End point
        } else {
          // Default gray color
          regularColors.push(0.4, 0.45, 0.55, 1.0) // Start point
          regularColors.push(0.4, 0.45, 0.55, 1.0) // End point
        }
      }
    })
    
    
    regularGeometry.setAttribute('position', new THREE.Float32BufferAttribute(regularPositions, 3))
    regularGeometry.setAttribute('color', new THREE.Float32BufferAttribute(regularColors, 4))
    
    highlightedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(highlightedPositions, 3))
    highlightedGeometry.setAttribute('color', new THREE.Float32BufferAttribute(highlightedColors, 4))
    
    
    
    return { regularLineGeometry: regularGeometry, highlightedLineGeometry: highlightedGeometry }
  }, [edgeIndices, cloudiness, points, hoveredGroupEdges, hoveredGroup, nodeColors])
  
  // Animation loop for rotation - disabled by default
  // useFrame((state, delta) => {
  //   if (groupRef.current) {
  //     groupRef.current.rotation.y += delta * 0.5 // Rotate around Y axis
  //     groupRef.current.rotation.x += delta * 0.2 // Slight rotation around X axis
  //   }
  // })
  
  // Handle node click to apply selected color and check for captures
  const handleNodeClick = (nodeIndex, event) => {
    event.stopPropagation() // Prevent orbit controls from interfering
    
    // Only allow placing stones on empty intersections
    const currentColor = nodeColors[nodeIndex] || 'gray'
    if (currentColor !== 'gray') {
      return
    }
    
    // Determine the color to place based on game mode
    let colorToPlace = selectedColor
    if (gameMode === 'vs-computer') {
      colorToPlace = 'blue' // Player is always blue in vs-computer mode
    }
    
    // Place the stone
    const newNodeColors = {
      ...nodeColors,
      [nodeIndex]: colorToPlace
    }
    
    // Check for captures
    const { newNodeColors: afterCapture, totalCaptured } = captureGroups(newNodeColors, colorToPlace)
    
    // Update node colors
    setNodeColors(afterCapture)
    
    // Update capture count
    if (totalCaptured[colorToPlace] > 0) {
      setCaptureCount(prev => ({
        ...prev,
        [colorToPlace]: prev[colorToPlace] + totalCaptured[colorToPlace]
      }))
    }
    
    // In vs-computer mode, make computer move after a short delay
    if (gameMode === 'vs-computer') {
      setTimeout(() => {
        let computerMove = null
        
        // Choose AI strategy based on aiMode
        if (aiMode === 'attack') {
          computerMove = makeAttackMove(afterCapture)
        } else {
          computerMove = makeRandomMove(afterCapture)
        }
        
        if (computerMove !== null) {
          const computerNodeColors = {
            ...afterCapture,
            [computerMove]: 'red'
          }
          
          // Check for captures from computer move
          const { newNodeColors: afterComputerCapture, totalCaptured: computerCaptured } = captureGroups(computerNodeColors, 'red')
          
          // Update node colors with computer move
          setNodeColors(afterComputerCapture)
          
          // Update capture count for computer
          if (computerCaptured.red > 0) {
            setCaptureCount(prev => ({
              ...prev,
              red: prev.red + computerCaptured.red
            }))
          }
        }
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
  
  // Get opacity based on depth (z-coordinate) for cloudiness effect
  const getNodeOpacity = (nodeIndex) => {
    if (!cloudiness) return 1.0
    
    const point = points[nodeIndex]
    if (!point) return 1.0
    
    // Calculate opacity based on z-depth
    // Points further from camera (more negative z) become more transparent
    const maxZ = Math.max(...points.map(p => p.z))
    const minZ = Math.min(...points.map(p => p.z))
    const zRange = maxZ - minZ
    
    if (zRange === 0) return 1.0
    
    // Normalize z to 0-1 range, then map to opacity 0.3-1.0
    const normalizedZ = (point.z - minZ) / zRange
    return 0.3 + (normalizedZ * 0.7)
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
            emissiveIntensity={0.2}
            roughness={0.3}
            metalness={0.1}
            opacity={getNodeOpacity(index)}
            transparent={cloudiness}
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
      <lineSegments geometry={regularLineGeometry}>
        <lineBasicMaterial 
          vertexColors={true}
          transparent={cloudiness}
          linewidth={1}
        />
      </lineSegments>
      
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
    </group>
  )
}

function TetrahedralLattice({ size, selectedColor, cloudiness, captureCount, setCaptureCount, territoryScore, setTerritoryScore, showTerritoryScore, gameMode, aiMode, showNodeNumbers, showEdgeNumbers }) {
  return (
    <Canvas
      camera={{ position: [10, 10, 10], fov: 75 }}
      style={{ width: '100%', height: '500px' }}
      fog={cloudiness ? { color: '#f0f0f0', near: 5, far: 25 } : undefined}
    >
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1.0} />
      <pointLight position={[-10, 10, -10]} intensity={0.8} />
      <pointLight position={[10, -10, 10]} intensity={0.6} />
      <directionalLight position={[0, 20, 0]} intensity={0.5} />
      
      {cloudiness && (
        <fog attach="fog" color="#f0f0f0" near={5} far={25} />
      )}
      
      <TetrahedralLatticePoints 
        size={size} 
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
      
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={1}
        enableZoom={true}
        enablePan={true}
      />
    </Canvas>
  )
}

export default TetrahedralLattice