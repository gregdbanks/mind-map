import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from './App'

// Mock Konva and React-Konva
vi.mock('konva', () => ({}))
vi.mock('react-konva', () => ({
  Stage: ({ children }: any) => <div>{children}</div>,
  Layer: ({ children }: any) => <div>{children}</div>,
  Group: ({ children }: any) => <div>{children}</div>,
  Rect: () => <div />,
  Text: () => <div />,
  Line: () => <div />,
}))

// Mock React Router DOM
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: any) => <div>{children}</div>,
  Routes: ({ children }: any) => <div>{children}</div>,
  Route: ({ element }: any) => <div>{element}</div>,
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: 'test-id' }),
}))

// Mock the cached API to prevent real API calls
vi.mock('./services/robustCachedApi', () => ({
  robustCachedMindMapApi: {
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  robustCachedNodeApi: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    batchUpdate: vi.fn(),
  },
  robustCachedCanvasApi: {
    get: vi.fn(),
    update: vi.fn(),
    reset: vi.fn(),
  },
  apiNotifications: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  wrapWithNotifications: vi.fn((fn) => fn),
}))

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />)
    expect(container).toBeInTheDocument()
  })
})