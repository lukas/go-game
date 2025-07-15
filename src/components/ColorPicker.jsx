import React from 'react'

const colors = [
  { name: 'Gray', value: 'gray', hex: '#d1d5db' },
  { name: 'Blue', value: 'blue', hex: '#60a5fa' },
  { name: 'Red', value: 'red', hex: '#e11d48' }
]

function ColorPicker({ selectedColor, onColorSelect }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
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
        minWidth: '100px'
      }}>
        Stone Color:
      </label>
      
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flex: 1
      }}>
        {colors.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorSelect(color.value)}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: color.hex,
              border: selectedColor === color.value ? '3px solid #333' : '2px solid #ddd',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selectedColor === color.value ? '0 0 10px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
              transform: selectedColor === color.value ? 'scale(1.1)' : 'scale(1)',
              outline: 'none'
            }}
            title={`Select ${color.name}`}
            onMouseEnter={(e) => {
              if (selectedColor !== color.value) {
                e.target.style.transform = 'scale(1.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedColor !== color.value) {
                e.target.style.transform = 'scale(1)'
              }
            }}
          />
        ))}
      </div>
      
      <div style={{
        fontSize: '0.875rem',
        color: '#6b7280',
        minWidth: '120px',
        textAlign: 'right'
      }}>
        Selected: {colors.find(c => c.value === selectedColor)?.name}
      </div>
    </div>
  )
}

export default ColorPicker