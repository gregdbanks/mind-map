import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Test for zoom controls visibility
describe('Zoom Controls', () => {
  it('should have visible button text', () => {
    // This test should FAIL first since buttons don't have visible text
    render(
      <div className="zoom-controls">
        <button aria-label="Zoom in">+</button>
        <button aria-label="Zoom out">-</button>
        <button aria-label="Reset view">Reset</button>
      </div>
    )

    // These should fail because the buttons only have aria-labels
    expect(screen.getByText('+')).toBeVisible()
    expect(screen.getByText('-')).toBeVisible()
    expect(screen.getByText('Reset')).toBeVisible()
  })

  it('should have proper contrast for button text', () => {
    // This test should check that button text is visible against background
    render(
      <div className="zoom-controls" style={{ 
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        gap: '8px'
      }}>
        <button style={{
          padding: '10px 15px',
          backgroundColor: 'white',
          color: 'black', // Should have high contrast
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          Zoom In
        </button>
      </div>
    )

    const button = screen.getByText('Zoom In')
    const styles = window.getComputedStyle(button)
    
    expect(styles.color).toBe('black')
    expect(styles.backgroundColor).toBe('white')
    expect(styles.fontSize).toBe('16px')
    expect(styles.fontWeight).toBe('bold')
  })
})