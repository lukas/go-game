import React from 'react'

function CloudinessToggle({ enabled, onToggle }) {
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
        Depth Effect:
      </label>
      
      <button
        onClick={onToggle}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          border: '2px solid #e5e7eb',
          backgroundColor: enabled ? '#4f46e5' : '#f9fafb',
          color: enabled ? 'white' : '#374151',
          fontSize: '0.875rem',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minWidth: '80px'
        }}
        onMouseEnter={(e) => {
          if (!enabled) {
            e.target.style.backgroundColor = '#f3f4f6'
          }
        }}
        onMouseLeave={(e) => {
          if (!enabled) {
            e.target.style.backgroundColor = '#f9fafb'
          }
        }}
      >
        {enabled ? 'ON' : 'OFF'}
      </button>
      
      <div style={{
        fontSize: '0.875rem',
        color: '#6b7280',
        flex: 1
      }}>
        {enabled ? 'Atmospheric depth enabled' : 'Adds fog and depth-based opacity'}
      </div>
    </div>
  )
}

export default CloudinessToggle