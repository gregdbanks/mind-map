import type { MindMapState, Node, NodeNote } from '../types';

export const exportToJSON = (state: MindMapState, notes?: Map<string, NodeNote>): void => {
  try {
    // Process notes to ensure they're serializable
    const serializableNotes = notes ? Array.from(notes.values()).map(note => ({
      ...note,
      createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
      updatedAt: note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt,
    })) : [];

    const data = {
      nodes: Array.from(state.nodes.values()),
      links: state.links,
      selectedNodeId: state.selectedNodeId,
      editingNodeId: state.editingNodeId,
      notes: serializableNotes,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindmap-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export mind map:', error);
    alert('Failed to export mind map. Please check the console for details.');
  }
};


export interface ImportResult {
  state: MindMapState;
  notes: NodeNote[];
}

export const importFromJSON = async (file: File): Promise<ImportResult | null> => {
  try {
    const text = await file.text();
    return importFromJSONText(text);
  } catch (error) {
    console.error('Failed to import mind map:', error);
    return null;
  }
};

export const importFromJSONText = (text: string): ImportResult | null => {
  try {
    const data = JSON.parse(text);
    
    // Validate required structure
    if (!data.nodes || !Array.isArray(data.nodes) || !data.links || !Array.isArray(data.links)) {
      throw new Error('Invalid mind map file format - missing nodes or links array');
    }
    
    // Convert nodes array back to Map with proper typing
    const nodes = new Map<string, Node>(data.nodes.map((node: Node) => [node.id, node]));
    
    // If links array is empty but nodes have parent relationships, create links
    let links = data.links;
    if (links.length === 0) {
      links = [];
      data.nodes.forEach((node: Node) => {
        if (node.parent) {
          links.push({
            source: node.parent,
            target: node.id
          });
        }
      });
    }
    
    // Process notes, converting date strings back to Date objects
    const notes: NodeNote[] = (data.notes || []).map((note: any) => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt)
    }));
    
    return {
      state: {
        nodes,
        links,
        selectedNodeId: data.selectedNodeId || null,
        editingNodeId: data.editingNodeId || null,
        lastModified: new Date()
      },
      notes
    };
  } catch (error) {
    console.error('Failed to import mind map:', error);
    return null;
  }
};