import { createContext, useContext, useReducer, useEffect } from 'react'
import type { ReactNode } from 'react'
import { 
  robustCachedMindMapApi, 
  robustCachedNodeApi, 
  robustCachedCanvasApi,
  apiNotifications,
  wrapWithNotifications
} from '../services/robustCachedApi'
import { useNotifications } from '../components/NotificationProvider'
import type {
  MindMap,
  Node,
  CanvasState,
  CreateMindMapDto,
  UpdateMindMapDto,
  CreateNodeDto,
  UpdateNodeDto,
  UpdateCanvasDto,
} from '../types'

interface MindMapState {
  mindMaps: MindMap[]
  selectedMindMap: MindMap | null
  nodes: Node[]
  canvasState: CanvasState | null
  loading: boolean
  error: string | null
}

type MindMapAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MINDMAPS'; payload: MindMap[] }
  | { type: 'SET_SELECTED_MINDMAP'; payload: MindMap | null }
  | { type: 'ADD_MINDMAP'; payload: MindMap }
  | { type: 'UPDATE_MINDMAP'; payload: MindMap }
  | { type: 'DELETE_MINDMAP'; payload: string }
  | { type: 'SET_NODES'; payload: Node[] }
  | { type: 'ADD_NODE'; payload: Node }
  | { type: 'UPDATE_NODE'; payload: Node }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'SET_CANVAS'; payload: CanvasState | null }

const initialState: MindMapState = {
  mindMaps: [],
  selectedMindMap: null,
  nodes: [],
  canvasState: null,
  loading: false,
  error: null,
}

function mindMapReducer(state: MindMapState, action: MindMapAction): MindMapState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_MINDMAPS':
      return { ...state, mindMaps: action.payload }
    case 'SET_SELECTED_MINDMAP':
      return { ...state, selectedMindMap: action.payload }
    case 'ADD_MINDMAP':
      return { ...state, mindMaps: [...state.mindMaps, action.payload] }
    case 'UPDATE_MINDMAP':
      return {
        ...state,
        mindMaps: state.mindMaps.map(m => 
          m.id === action.payload.id ? action.payload : m
        ),
        selectedMindMap: state.selectedMindMap?.id === action.payload.id 
          ? action.payload 
          : state.selectedMindMap,
      }
    case 'DELETE_MINDMAP':
      return {
        ...state,
        mindMaps: state.mindMaps.filter(m => m.id !== action.payload),
        selectedMindMap: state.selectedMindMap?.id === action.payload 
          ? null 
          : state.selectedMindMap,
      }
    case 'SET_NODES':
      return { ...state, nodes: action.payload }
    case 'ADD_NODE':
      return { ...state, nodes: [...state.nodes, action.payload] }
    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map(n => 
          n.id === action.payload?.id ? action.payload : n
        ),
      }
    case 'DELETE_NODE':
      // Remove node and its children
      const nodeIdsToRemove = new Set<string>()
      const findChildren = (nodeId: string) => {
        nodeIdsToRemove.add(nodeId)
        state.nodes
          .filter(n => n.parentId === nodeId)
          .forEach(child => findChildren(child.id))
      }
      findChildren(action.payload)
      return {
        ...state,
        nodes: state.nodes.filter(n => !nodeIdsToRemove.has(n.id)),
      }
    case 'SET_CANVAS':
      return { ...state, canvasState: action.payload }
    default:
      return state
  }
}

interface MindMapContextType {
  state: MindMapState
  actions: {
    // MindMap actions
    fetchMindMaps: () => Promise<void>
    selectMindMap: (id: string) => Promise<void>
    createMindMap: (data: CreateMindMapDto) => Promise<MindMap>
    updateMindMap: (id: string, data: UpdateMindMapDto) => Promise<void>
    deleteMindMap: (id: string) => Promise<void>

    // Node actions
    fetchNodes: (mindMapId: string, hierarchical?: boolean) => Promise<void>
    createNode: (data: CreateNodeDto) => Promise<Node>
    updateNode: (id: string, data: UpdateNodeDto) => Promise<void>
    deleteNode: (id: string) => Promise<void>
    batchUpdateNodes: (updates: { id: string; positionX?: number; positionY?: number }[]) => Promise<void>
    importNodes: (mindMapId: string, nodes: any[]) => Promise<void>

    // Canvas actions
    fetchCanvas: (mindMapId: string) => Promise<void>
    updateCanvas: (data: UpdateCanvasDto) => Promise<void>
    resetCanvas: (centerOnNodes?: boolean) => Promise<void>

    // Utility actions
    setError: (error: string | null) => void
    clearError: () => void
  }
}

const MindMapContext = createContext<MindMapContextType | undefined>(undefined)

export function MindMapProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mindMapReducer, initialState)
  const { addNotification } = useNotifications()

  // Listen to API notifications
  useEffect(() => {
    const handleNotification = (event: Event) => {
      const { detail } = event as CustomEvent
      addNotification(detail.type, detail.message)
    }

    apiNotifications.addEventListener('notification', handleNotification)
    return () => {
      apiNotifications.removeEventListener('notification', handleNotification)
    }
  }, [addNotification])

  const actions: MindMapContextType['actions'] = {
    // MindMap actions
    fetchMindMaps: async () => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        const mindMaps = await robustCachedMindMapApi.getAll()
        dispatch({ type: 'SET_MINDMAPS', payload: mindMaps })
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },

    selectMindMap: async (id: string) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        const mindMap = await robustCachedMindMapApi.getById(id, ['nodes', 'canvas'])
        dispatch({ type: 'SET_SELECTED_MINDMAP', payload: mindMap })
        
        // Fetch nodes and canvas state
        await actions.fetchNodes(id)
        await actions.fetchCanvas(id)
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },

    createMindMap: async (data: CreateMindMapDto) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        const mindMap = await wrapWithNotifications(
          () => robustCachedMindMapApi.create(data),
          'Mind map created successfully',
          'Failed to create mind map'
        )()
        dispatch({ type: 'ADD_MINDMAP', payload: mindMap })
        return mindMap
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
        throw error
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },

    updateMindMap: async (id: string, data: UpdateMindMapDto) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        const mindMap = await wrapWithNotifications(
          () => robustCachedMindMapApi.update(id, data),
          'Mind map updated successfully',
          'Failed to update mind map'
        )()
        dispatch({ type: 'UPDATE_MINDMAP', payload: mindMap })
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },

    deleteMindMap: async (id: string) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        await wrapWithNotifications(
          () => robustCachedMindMapApi.delete(id),
          'Mind map deleted successfully',
          'Failed to delete mind map'
        )()
        dispatch({ type: 'DELETE_MINDMAP', payload: id })
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },

    // Node actions
    fetchNodes: async (mindMapId: string, hierarchical = false) => {
      try {
        const response = await robustCachedNodeApi.getAll(mindMapId, hierarchical)
        
        // If hierarchical, we need to flatten the tree structure
        let nodes: Node[] = []
        if (hierarchical && Array.isArray(response)) {
          const flattenNodes = (nodeList: any[]): void => {
            nodeList.forEach(node => {
              const { children, ...nodeData } = node
              nodes.push(nodeData)
              if (children && Array.isArray(children)) {
                flattenNodes(children)
              }
            })
          }
          flattenNodes(response)
        } else {
          nodes = response as Node[]
        }
        
        dispatch({ type: 'SET_NODES', payload: nodes })
      } catch (error: any) {
        console.error('Error fetching nodes:', error)
        dispatch({ type: 'SET_ERROR', payload: error.message })
      }
    },

    createNode: async (data: CreateNodeDto) => {
      // Get mindMapId from state or from the current route
      let mindMapId = state.selectedMindMap?.id
      
      // If no selectedMindMap yet, try to get from the current URL
      if (!mindMapId) {
        const path = window.location.pathname
        const match = path.match(/\/mindmap\/([^\/]+)/)
        if (match && match[1]) {
          mindMapId = match[1]
        }
      }
      
      if (!mindMapId) {
        throw new Error('No mind map selected')
      }
      
      try {
        const node = await wrapWithNotifications(
          () => robustCachedNodeApi.create(mindMapId, data),
          'Node created successfully',
          'Failed to create node'
        )()
        dispatch({ type: 'ADD_NODE', payload: node })
        return node
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
        throw error
      }
    },

    updateNode: async (id: string, data: UpdateNodeDto) => {
      try {
        const node = await robustCachedNodeApi.update(id, data)
        dispatch({ type: 'UPDATE_NODE', payload: node })
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      }
    },

    deleteNode: async (id: string) => {
      try {
        await wrapWithNotifications(
          () => robustCachedNodeApi.delete(id),
          'Node deleted successfully',
          'Failed to delete node'
        )()
        dispatch({ type: 'DELETE_NODE', payload: id })
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      }
    },

    batchUpdateNodes: async (updates) => {
      if (!state.selectedMindMap) {
        throw new Error('No mind map selected')
      }
      try {
        const updatedNodes = await robustCachedNodeApi.batchUpdate(state.selectedMindMap.id, updates)
        // Update all nodes at once
        const updatedNodesMap = new Map(updatedNodes.map(n => [n.id, n]))
        dispatch({
          type: 'SET_NODES',
          payload: state.nodes.map(n => updatedNodesMap.get(n.id) || n),
        })
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      }
    },

    importNodes: async (mindMapId: string, nodes: any[]) => {
      try {
        // Create nodes in the correct order (parents before children)
        const nodeMap = new Map<string, string>() // Map old IDs to new IDs
        const sortedNodes = [...nodes].sort((a, b) => {
          // Root nodes first
          if (!a.parentId && b.parentId) return -1
          if (a.parentId && !b.parentId) return 1
          return 0
        })

        for (const node of sortedNodes) {
          const parentId = node.parentId ? nodeMap.get(node.parentId) : null
          
          const createdNode = await robustCachedNodeApi.create(mindMapId, {
            text: node.text,
            parentId: parentId || undefined,
            positionX: node.positionX,
            positionY: node.positionY,
            backgroundColor: node.backgroundColor || node.color || '#0066cc',
            textColor: node.textColor || '#ffffff',
          })
          
          // Map old ID to new ID for children
          nodeMap.set(node.id, createdNode.id)
        }

        // Refresh nodes after import
        await actions.fetchNodes(mindMapId)
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
        throw error
      }
    },

    // Canvas actions
    fetchCanvas: async (mindMapId: string) => {
      try {
        const canvas = await robustCachedCanvasApi.get(mindMapId)
        dispatch({ type: 'SET_CANVAS', payload: canvas })
      } catch (error: any) {
        // If canvas doesn't exist, use defaults
        dispatch({
          type: 'SET_CANVAS',
          payload: {
            id: '',
            mindMapId,
            zoom: 1,
            panX: 0,
            panY: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })
      }
    },

    updateCanvas: async (data: UpdateCanvasDto) => {
      if (!state.selectedMindMap) {
        throw new Error('No mind map selected')
      }
      try {
        const canvas = await robustCachedCanvasApi.update(state.selectedMindMap.id, data)
        dispatch({ type: 'SET_CANVAS', payload: canvas })
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      }
    },

    resetCanvas: async (centerOnNodes = false) => {
      if (!state.selectedMindMap) {
        throw new Error('No mind map selected')
      }
      try {
        const canvas = await robustCachedCanvasApi.reset(state.selectedMindMap.id, centerOnNodes)
        dispatch({ type: 'SET_CANVAS', payload: canvas })
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      }
    },

    // Utility actions
    setError: (error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error })
    },

    clearError: () => {
      dispatch({ type: 'SET_ERROR', payload: null })
    },
  }

  return (
    <MindMapContext.Provider value={{ state, actions }}>
      {children}
    </MindMapContext.Provider>
  )
}

export function useMindMap() {
  const context = useContext(MindMapContext)
  if (!context) {
    throw new Error('useMindMap must be used within a MindMapProvider')
  }
  return context
}