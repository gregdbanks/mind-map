import type { MindMapState, Node } from '../types/mindMap';

export const exportToJSON = (state: MindMapState): void => {
  const data = {
    nodes: Array.from(state.nodes.values()),
    links: state.links,
    selectedNodeId: state.selectedNodeId,
    editingNodeId: state.editingNodeId,
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
};


export const importFromJSON = async (file: File): Promise<MindMapState | null> => {
  try {
    const text = await file.text();
    return importFromJSONText(text);
  } catch (error) {
    console.error('Failed to import mind map:', error);
    return null;
  }
};

export const importFromJSONText = (text: string): MindMapState | null => {
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
    
    return {
      nodes,
      links,
      selectedNodeId: data.selectedNodeId || null,
      editingNodeId: data.editingNodeId || null,
      lastModified: new Date()
    };
  } catch (error) {
    console.error('Failed to import mind map:', error);
    return null;
  }
};