// Simple test to verify edge generation
class MockVector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x
    this.y = y
    this.z = z
  }
  
  add(v) {
    this.x += v.x
    this.y += v.y
    this.z += v.z
    return this
  }
  
  divideScalar(s) {
    this.x /= s
    this.y /= s
    this.z /= s
    return this
  }
  
  sub(v) {
    this.x -= v.x
    this.y -= v.y
    this.z -= v.z
    return this
  }
}

function generateTetrahedralLattice(gridSize) {
  const points = []
  const edgeIndices = []
  
  const spacing = 2
  
  // Generate points in diamond lattice pattern
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        // First sublattice (A sites)
        points.push(new MockVector3(
          x * spacing,
          y * spacing,
          z * spacing
        ))
        
        // Second sublattice (B sites)
        points.push(new MockVector3(
          (x + 0.25) * spacing,
          (y + 0.25) * spacing,
          (z + 0.25) * spacing
        ))
      }
    }
  }
  
  // Calculate center and recenter points
  const center = new MockVector3()
  if (points.length > 0) {
    points.forEach(point => center.add(point))
    center.divideScalar(points.length)
  }
  points.forEach(point => point.sub(center))
  
  // Generate edges using current logic
  const tempEdgeIndices = []
  
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        const cellIndex = x * gridSize * gridSize + y * gridSize + z
        const aIndex = cellIndex * 2
        
        if (aIndex >= points.length) continue
        
        const tetrahedralNeighbors = [
          [x, y, z],      // Current cell B-site
          [x-1, y, z],    // Left neighbor
          [x, y-1, z],    // Front neighbor  
          [x, y, z-1]     // Bottom neighbor
        ]
        
        tetrahedralNeighbors.forEach(([nx, ny, nz]) => {
          if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && nz >= 0 && nz < gridSize) {
            const neighborCellIndex = nx * gridSize * gridSize + ny * gridSize + nz
            const bIndex = neighborCellIndex * 2 + 1
            
            if (bIndex < points.length) {
              tempEdgeIndices.push([aIndex, bIndex])
            }
          }
        })
      }
    }
  }
  
  // Remove duplicates
  const edgeSet = new Set()
  tempEdgeIndices.forEach(([startIndex, endIndex]) => {
    const edgeKey = startIndex < endIndex ? `${startIndex}-${endIndex}` : `${endIndex}-${startIndex}`
    if (!edgeSet.has(edgeKey)) {
      edgeSet.add(edgeKey)
      edgeIndices.push([startIndex, endIndex])
    }
  })
  
  return { points, edgeIndices }
}

function getGridPosition(nodeIndex, gridSize) {
  const isASite = nodeIndex % 2 === 0
  const cellIndex = Math.floor(nodeIndex / 2)
  
  const z = cellIndex % gridSize
  const y = Math.floor(cellIndex / gridSize) % gridSize
  const x = Math.floor(cellIndex / (gridSize * gridSize))
  
  return { x, y, z, isASite }
}

// Test with grid size 3
console.log('Testing 3x3x3 grid...')
const { points, edgeIndices } = generateTetrahedralLattice(3)

console.log(`Total points: ${points.length}`)
console.log(`Total edges: ${edgeIndices.length}`)

// Check for edge 13-16
const hasEdge13to16 = edgeIndices.some(([a, b]) => 
  (a === 13 && b === 16) || (a === 16 && b === 13)
)

console.log(`Edge 13-16 exists: ${hasEdge13to16}`)

if (hasEdge13to16) {
  const pos13 = getGridPosition(13, 3)
  const pos16 = getGridPosition(16, 3)
  console.log(`Node 13: ${JSON.stringify(pos13)}`)
  console.log(`Node 16: ${JSON.stringify(pos16)}`)
  console.log('This edge should NOT exist!')
}

// Show all edges for debugging
console.log('\nAll edges:')
edgeIndices.forEach(([a, b]) => {
  const posA = getGridPosition(a, 3)
  const posB = getGridPosition(b, 3)
  console.log(`${a} -> ${b}: ${JSON.stringify(posA)} -> ${JSON.stringify(posB)}`)
})