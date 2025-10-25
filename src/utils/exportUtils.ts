import type { MindMapState, Node, Link } from '../types/mindMap';

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

export const exportToPNG = (svgElement: SVGSVGElement): void => {
  // Clone the SVG to modify it without affecting the original
  const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
  
  // Add necessary namespaces and styles
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  
  // Get computed styles and embed them
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .link { stroke: #999; stroke-width: 2; stroke-opacity: 0.6; fill: none; }
    text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    rect { fill: white; stroke: #333; stroke-width: 2; rx: 5; }
  `;
  svgClone.insertBefore(styleElement, svgClone.firstChild);

  const svgData = new XMLSerializer().serializeToString(svgClone);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('Failed to get canvas context');
    return;
  }

  const img = new Image();
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    // Set canvas size to SVG size
    const bbox = svgElement.getBBox();
    const padding = 50;
    canvas.width = bbox.width + padding * 2;
    canvas.height = bbox.height + padding * 2;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the image
    ctx.drawImage(img, padding - bbox.x, padding - bbox.y);
    
    // Convert to PNG and download
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create blob');
        return;
      }
      
      const pngUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `mindmap-${new Date().getTime()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(pngUrl);
    }, 'image/png');
    
    URL.revokeObjectURL(url);
  };

  img.onerror = () => {
    console.error('Failed to load SVG image');
    URL.revokeObjectURL(url);
  };

  img.src = url;
};

export const importFromJSON = async (file: File): Promise<MindMapState | null> => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Check if it's the AWS security JSON format
    if (data.version && data.mindMap && data.nodes) {
      // Convert AWS format to standard format
      const nodes = new Map<string, Node>();
      const links: Link[] = [];
      
      // Convert nodes
      data.nodes.forEach((node: any) => {
        const convertedNode: Node = {
          id: node.id,
          text: node.text,
          x: node.positionX || node.x || 0,
          y: node.positionY || node.y || 0,
          collapsed: false,
          parent: node.parentId || null
        };
        nodes.set(node.id, convertedNode);
        
        // Create links from parent-child relationships
        if (node.parentId) {
          links.push({
            source: node.parentId,
            target: node.id
          });
        }
      });
      
      return {
        nodes,
        links,
        selectedNodeId: null,
        editingNodeId: null,
        lastModified: new Date()
      };
    }
    
    // Validate standard format
    if (!data.nodes || !Array.isArray(data.nodes) || !data.links || !Array.isArray(data.links)) {
      throw new Error('Invalid mind map file format');
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