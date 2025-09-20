import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationProvider, useNotifications } from './NotificationProvider'

// Test component that uses notifications
function TestComponent() {
  const { addNotification } = useNotifications()
  
  return (
    <div>
      <button onClick={() => addNotification('success', 'Success message')}>
        Add Success
      </button>
      <button onClick={() => addNotification('error', 'Error message', 0)}>
        Add Persistent Error
      </button>
    </div>
  )
}

describe('NotificationProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('should display notifications', async () => {
    const user = userEvent.setup({ delay: null })
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    const successButton = screen.getByText('Add Success')
    await user.click(successButton)

    expect(screen.getByText('Success message')).toBeInTheDocument()
  })

  it('should auto-dismiss notifications after duration', async () => {
    const user = userEvent.setup({ delay: null })
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    const successButton = screen.getByText('Add Success')
    await user.click(successButton)

    expect(screen.getByText('Success message')).toBeInTheDocument()

    // Advance timers
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument()
    })
  })

  it('should handle persistent notifications', async () => {
    const user = userEvent.setup({ delay: null })
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    const errorButton = screen.getByText('Add Persistent Error')
    await user.click(errorButton)

    expect(screen.getByText('Error message')).toBeInTheDocument()

    // Advance timers - notification should still be there
    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('should allow manual dismissal', async () => {
    const user = userEvent.setup({ delay: null })
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    const successButton = screen.getByText('Add Success')
    await user.click(successButton)

    const closeButton = screen.getByLabelText('Close notification')
    await user.click(closeButton)

    expect(screen.queryByText('Success message')).not.toBeInTheDocument()
  })

  it('should display multiple notifications', async () => {
    const user = userEvent.setup({ delay: null })
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    const successButton = screen.getByText('Add Success')
    const errorButton = screen.getByText('Add Persistent Error')
    
    await user.click(successButton)
    await user.click(errorButton)

    expect(screen.getByText('Success message')).toBeInTheDocument()
    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('should apply correct CSS classes for notification types', async () => {
    const user = userEvent.setup({ delay: null })
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    const successButton = screen.getByText('Add Success')
    await user.click(successButton)

    const notification = screen.getByText('Success message').closest('.notification')
    expect(notification).toHaveClass('notification-success')
  })

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useNotifications must be used within a NotificationProvider')
    
    spy.mockRestore()
  })
})

describe('NotificationProvider accessibility', () => {
  it('should have proper ARIA attributes', async () => {
    const user = userEvent.setup()
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    const successButton = screen.getByText('Add Success')
    await user.click(successButton)

    const container = screen.getByRole('alert')
    expect(container).toHaveAttribute('aria-live', 'polite')
    
    const status = screen.getByRole('status')
    expect(status).toBeInTheDocument()
  })
})