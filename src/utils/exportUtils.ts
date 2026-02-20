import type { MindMapState, Node, NodeNote } from '../types';
import { prepareSVGForExport } from './svgExportUtils';
import type { CanvasBackground } from '../components/BackgroundSelector';

export const exportToJSON = (state: MindMapState, notes?: Map<string, NodeNote>, onSuccess?: () => void): void => {
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
    
    // Call success callback if provided
    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    console.error('Failed to export mind map:', error);
    alert('Failed to export mind map. Please check the console for details.');
  }
};


type BBox = { x: number; y: number; width: number; height: number };

export function exportToSVG(
  svgEl: SVGSVGElement,
  bbox: BBox,
  canvasBackground: CanvasBackground,
  onSuccess?: () => void
): void {
  const { svgString } = prepareSVGForExport(svgEl, bbox, canvasBackground);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mindmap-${Date.now()}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  onSuccess?.();
}

export async function exportToPNG(
  svgEl: SVGSVGElement,
  bbox: BBox,
  canvasBackground: CanvasBackground,
  onSuccess?: () => void
): Promise<void> {
  const scale = 2;
  const { svgString, width, height } = prepareSVGForExport(svgEl, bbox, canvasBackground);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);

      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Canvas toBlob returned null')); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mindmap-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onSuccess?.();
        resolve();
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Failed to load SVG for PNG rasterization'));
    };
    img.src = svgUrl;
  });
}

export async function exportToPDF(
  svgEl: SVGSVGElement,
  bbox: BBox,
  canvasBackground: CanvasBackground,
  onSuccess?: () => void
): Promise<void> {
  const scale = 2;
  const { svgString, width, height } = prepareSVGForExport(svgEl, bbox, canvasBackground);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  const pngDataUrl = await new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Failed to load SVG for PDF rasterization'));
    };
    img.src = svgUrl;
  });

  const { jsPDF } = await import('jspdf');
  const orientation = width > height ? 'landscape' : 'portrait';
  const pxToMm = (px: number) => (px * 25.4) / 96;
  const docW = pxToMm(width);
  const docH = pxToMm(height);

  const doc = new jsPDF({ orientation, unit: 'mm', format: [docW, docH] });
  doc.addImage(pngDataUrl, 'PNG', 0, 0, docW, docH);
  doc.save(`mindmap-${Date.now()}.pdf`);
  onSuccess?.();
}

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
        lastModified: new Date(),
        isDirty: false // Import starts with clean state
      },
      notes
    };
  } catch (error) {
    console.error('Failed to import mind map:', error);
    return null;
  }
};