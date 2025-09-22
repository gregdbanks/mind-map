import type { MindMap, Node } from '../types'
import LZString from 'lz-string'

export class ExportService {
  /**
   * Export as interactive HTML file
   */
  static async exportAsInteractiveHTML(mindMap: MindMap, nodes: Node[]): Promise<Blob> {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${mindMap.title} - Interactive Mind Map</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
            background: #f0f0f0;
        }
        .controls {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            gap: 10px;
            background: rgba(255, 255, 255, 0.9);
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            background: #0066cc;
            color: white;
            cursor: pointer;
            font-size: 14px;
        }
        button:hover {
            background: #2563eb;
        }
        #canvas {
            width: 100vw;
            height: 100vh;
        }
        #info {
            position: absolute;
            top: 20px;
            left: 20px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            margin: 0 0 10px 0;
            font-size: 20px;
        }
        .instructions {
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div id="info">
        <h1>${mindMap.title}</h1>
        ${mindMap.description ? `<p>${mindMap.description}</p>` : ''}
        <div class="instructions">
            <strong>Controls:</strong><br>
            • Drag to pan<br>
            • Scroll to zoom<br>
            • Click nodes to select
        </div>
    </div>
    <div class="controls">
        <button onclick="zoomIn()">Zoom In</button>
        <button onclick="zoomOut()">Zoom Out</button>
        <button onclick="resetView()">Reset View</button>
    </div>
    <canvas id="canvas"></canvas>
    
    <script>
        // Embedded mind map data
        const mindMapData = ${JSON.stringify({ mindMap, nodes })};
        
        // Canvas setup
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        let scale = 1;
        let offsetX = 0;
        let offsetY = 0;
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        
        // Node rendering constants
        const NODE_WIDTH = 200;
        const NODE_HEIGHT = 50;
        const NODE_PADDING = 10;
        const CONNECTION_COLOR = '#666';
        const NODE_COLOR = '#0066cc';
        const NODE_TEXT_COLOR = '#fff';
        const SELECTED_COLOR = '#f59e0b';
        
        let selectedNodeId = null;
        
        // Convert mind map coordinates to canvas coordinates
        function toCanvasCoords(x, y) {
            return {
                x: x * scale + offsetX,
                y: y * scale + offsetY
            };
        }
        
        // Convert canvas coordinates to mind map coordinates
        function toMindMapCoords(x, y) {
            return {
                x: (x - offsetX) / scale,
                y: (y - offsetY) / scale
            };
        }
        
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw connections
            mindMapData.nodes.forEach(node => {
                if (node.parentId) {
                    const parent = mindMapData.nodes.find(n => n.id === node.parentId);
                    if (parent) {
                        const parentPos = toCanvasCoords(parent.positionX + NODE_WIDTH / 2, parent.positionY + NODE_HEIGHT / 2);
                        const childPos = toCanvasCoords(node.positionX + NODE_WIDTH / 2, node.positionY + NODE_HEIGHT / 2);
                        
                        ctx.beginPath();
                        ctx.strokeStyle = CONNECTION_COLOR;
                        ctx.lineWidth = 2 * scale;
                        ctx.moveTo(parentPos.x, parentPos.y);
                        ctx.lineTo(childPos.x, childPos.y);
                        ctx.stroke();
                    }
                }
            });
            
            // Draw nodes
            mindMapData.nodes.forEach(node => {
                const pos = toCanvasCoords(node.positionX, node.positionY);
                const width = NODE_WIDTH * scale;
                const height = NODE_HEIGHT * scale;
                
                // Draw node rectangle
                ctx.fillStyle = node.id === selectedNodeId ? SELECTED_COLOR : NODE_COLOR;
                ctx.fillRect(pos.x, pos.y, width, height);
                
                // Draw node text
                ctx.fillStyle = NODE_TEXT_COLOR;
                ctx.font = \`\${14 * scale}px Arial\`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Wrap text if needed
                const maxWidth = width - NODE_PADDING * 2 * scale;
                const words = node.text.split(' ');
                let line = '';
                let y = pos.y + height / 2;
                
                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxWidth && n > 0) {
                        ctx.fillText(line, pos.x + width / 2, y);
                        line = words[n] + ' ';
                        y += 20 * scale;
                    } else {
                        line = testLine;
                    }
                }
                ctx.fillText(line, pos.x + width / 2, y);
            });
        }
        
        // Event handlers
        canvas.addEventListener('mousedown', (e) => {
            const mousePos = toMindMapCoords(e.clientX, e.clientY);
            
            // Check if clicking on a node
            const clickedNode = mindMapData.nodes.find(node => {
                return mousePos.x >= node.positionX && 
                       mousePos.x <= node.positionX + NODE_WIDTH &&
                       mousePos.y >= node.positionY && 
                       mousePos.y <= node.positionY + NODE_HEIGHT;
            });
            
            if (clickedNode) {
                selectedNodeId = clickedNode.id;
                draw();
            } else {
                selectedNodeId = null;
                isDragging = true;
                dragStartX = e.clientX - offsetX;
                dragStartY = e.clientY - offsetY;
                canvas.style.cursor = 'grabbing';
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                offsetX = e.clientX - dragStartX;
                offsetY = e.clientY - dragStartY;
                draw();
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            isDragging = false;
            canvas.style.cursor = 'grab';
        });
        
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const mousePos = { x: e.clientX, y: e.clientY };
            
            // Scale around mouse position
            offsetX = mousePos.x - (mousePos.x - offsetX) * delta;
            offsetY = mousePos.y - (mousePos.y - offsetY) * delta;
            scale *= delta;
            scale = Math.max(0.1, Math.min(5, scale));
            draw();
        });
        
        // Touch events for mobile
        let touchStartDistance = 0;
        
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isDragging = true;
                dragStartX = e.touches[0].clientX - offsetX;
                dragStartY = e.touches[0].clientY - offsetY;
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                touchStartDistance = Math.sqrt(dx * dx + dy * dy);
            }
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1 && isDragging) {
                offsetX = e.touches[0].clientX - dragStartX;
                offsetY = e.touches[0].clientY - dragStartY;
                draw();
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const delta = distance / touchStartDistance;
                scale *= delta;
                scale = Math.max(0.1, Math.min(5, scale));
                touchStartDistance = distance;
                draw();
            }
        });
        
        canvas.addEventListener('touchend', () => {
            isDragging = false;
        });
        
        // Button functions
        window.zoomIn = () => {
            scale *= 1.2;
            scale = Math.min(5, scale);
            draw();
        };
        
        window.zoomOut = () => {
            scale /= 1.2;
            scale = Math.max(0.1, scale);
            draw();
        };
        
        window.resetView = () => {
            scale = 1;
            offsetX = 0;
            offsetY = 0;
            draw();
        };
        
        // Handle window resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            draw();
        });
        
        // Initial draw
        draw();
    </script>
</body>
</html>`;
    return new Blob([html], { type: 'text/html' });
  }

  /**
   * Export as shareable URL (compressed in hash)
   */
  static createShareableURL(mindMap: MindMap, nodes: Node[]): string {
    const data = { v: 1, m: mindMap, n: nodes, t: Date.now() };
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data));
    return `${window.location.origin}/#/view/${compressed}`;
  }

  /**
   * Create a preview URL using a service
   */
  static async createOnlinePreviewURL(blob: Blob): Promise<string | null> {
    // Option 1: Use htmlpreview.github.io service
    // This service can preview HTML files from GitHub gists or repos
    
    // Option 2: Create a temporary preview using a service like JSBin
    // Would require API integration
    
    // Option 3: Use data URI (limited by size)
    if (blob.size < 100000) { // 100KB limit for data URIs
      const text = await blob.text();
      return `data:text/html;charset=utf-8,${encodeURIComponent(text)}`;
    }
    
    return null;
  }

  /**
   * Export as JSON file
   */
  static exportAsJSON(mindMap: MindMap, nodes: Node[]): Blob {
    const data = {
      version: '1.0',
      exported: new Date().toISOString(),
      mindMap,
      nodes,
    };
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }

  /**
   * Export as shareable email
   */
  static createEmailShare(mindMap: MindMap, shareUrl: string): string {
    const subject = encodeURIComponent(`Check out this mind map: ${mindMap.title}`);
    const body = encodeURIComponent(
      `I'd like to share this mind map with you:\n\n` +
      `Title: ${mindMap.title}\n` +
      `${mindMap.description ? `Description: ${mindMap.description}\n` : ''}` +
      `\nView it here: ${shareUrl}\n\n` +
      `This link contains the entire mind map - no login required!`
    );
    return `mailto:?subject=${subject}&body=${body}`;
  }

  /**
   * Generate QR code for URL
   */
  static async generateQRCode(url: string): Promise<string> {
    // Using qr-server.com API (free, no key required)
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    return qrApiUrl;
  }
}