export interface MindMap {
  id: string
  title: string
  description?: string
  version: number
  createdAt: string
  updatedAt: string
  nodes?: Node[]
  canvasState?: CanvasState
}

export interface Node {
  id: string
  mindMapId: string
  text: string
  positionX: number
  positionY: number
  width?: number
  height?: number
  backgroundColor: string
  textColor: string
  fontSize?: number
  fontFamily?: string
  borderColor?: string
  borderWidth?: number
  borderStyle?: string
  parentId?: string
  collapsed?: boolean
  createdAt: string
  updatedAt: string
  children?: Node[]
}

export interface CanvasState {
  id: string
  mindMapId: string
  zoom: number
  panX: number
  panY: number
  createdAt: string
  updatedAt: string
}

export interface CreateMindMapDto {
  title: string
  description?: string
}

export interface UpdateMindMapDto {
  title?: string
  description?: string
  version?: number
}

export interface CreateNodeDto {
  text: string
  positionX: number
  positionY: number
  parentId?: string
  backgroundColor?: string
  textColor?: string
  fontSize?: number
  width?: number
  height?: number
}

export interface UpdateNodeDto {
  text?: string
  positionX?: number
  positionY?: number
  parentId?: string
  backgroundColor?: string
  textColor?: string
  fontSize?: number
  width?: number
  height?: number
  collapsed?: boolean
}

export interface UpdateCanvasDto {
  zoom?: number
  panX?: number
  panY?: number
}

export interface BatchUpdateNode {
  id: string
  positionX?: number
  positionY?: number
}