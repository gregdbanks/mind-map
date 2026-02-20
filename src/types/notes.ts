export interface NodeNote {
  id: string;
  nodeId: string;
  mapId?: string;
  content: string; // HTML content
  contentJson?: any; // TipTap JSON format
  contentType: 'html' | 'tiptap' | 'markdown' | 'plain';
  plainText?: string; // Plain text version for search
  tags?: string[];
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNodeNoteDto {
  nodeId: string;
  content: string;
  contentJson?: any;
  contentType?: 'html' | 'tiptap' | 'markdown' | 'plain';
  plainText?: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface UpdateNodeNoteDto {
  content?: string;
  contentJson?: any;
  contentType?: 'html' | 'tiptap' | 'markdown' | 'plain';
  plainText?: string;
  tags?: string[];
  isPinned?: boolean;
}