import React from 'react'

function SizeSlider({ value, onChange, min = 1, max = 10 }) {
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
        marginRight: '1rem'
      }}>
        Size:
      </label>
      
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{
          flex: 1,
          height: '6px',
          borderRadius: '3px',
          background: '#e5e7eb',
          outline: 'none',
          cursor: 'pointer'
        }}
      />
    </div>
  )
}

export default SizeSlider