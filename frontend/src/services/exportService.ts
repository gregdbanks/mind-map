import type { MindMap, Node } from '../types'
import LZString from 'lz-string'

export class ExportService {
  /**
   * Export as interactive HTML5 - completely self-contained
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
            background: #f5f5f5;
        }
        #toolbar {
            position: absolute;
            top: 20px;
            right: 20px;
            background: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            display: flex;
            gap: 10px;
        }
        button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            background: #3b82f6;
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
            🖱️ Drag to pan • 🔍 Ctrl+Scroll to zoom • 🎯 Click nodes to focus
        </div>
    </div>
    
    <div id="toolbar">
        <button onclick="zoomIn()">Zoom In</button>
        <button onclick="zoomOut()">Zoom Out</button>
        <button onclick="resetView()">Reset View</button>
        <button onclick="exportAsPNG()">Save as Image</button>
    </div>
    
    <canvas id="canvas"></canvas>
    
    <script>
        // Embedded mind map data
        const mindMapData = ${JSON.stringify({ mindMap, nodes })};
        
        // Simple canvas-based viewer
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        // State
        let scale = 1;
        let offsetX = 0;
        let offsetY = 0;
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let hoveredNode = null;
        
        // Set canvas size
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            draw();
        }
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        
        // Node class for rendering
        class NodeRenderer {
            constructor(node) {
                this.id = node.id;
                this.text = node.text;
                this.x = node.positionX;
                this.y = node.positionY;
                this.width = node.width || 150;
                this.height = node.height || 60;
                this.backgroundColor = node.backgroundColor || '#3b82f6';
                this.textColor = node.textColor || '#ffffff';
                this.borderColor = node.borderColor || '#2563eb';
                this.borderWidth = node.borderWidth || 2;
                this.borderRadius = node.borderRadius || 8;
                this.parentId = node.parentId;
            }
            
            draw(ctx, scale, offsetX, offsetY) {
                const x = this.x * scale + offsetX;
                const y = this.y * scale + offsetY;
                const w = this.width * scale;
                const h = this.height * scale;
                
                // Draw rounded rectangle
                ctx.fillStyle = this.backgroundColor;
                ctx.strokeStyle = this.borderColor;
                ctx.lineWidth = this.borderWidth * scale;
                
                ctx.beginPath();
                ctx.roundRect(x - w/2, y - h/2, w, h, this.borderRadius * scale);
                ctx.fill();
                ctx.stroke();
                
                // Draw text
                ctx.fillStyle = this.textColor;
                ctx.font = \`\${14 * scale}px sans-serif\`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Word wrap
                const words = this.text.split(' ');
                const lineHeight = 20 * scale;
                const maxWidth = w - 20 * scale;
                let line = '';
                let lines = [];
                
                for (let word of words) {
                    const testLine = line + word + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxWidth && line) {
                        lines.push(line);
                        line = word + ' ';
                    } else {
                        line = testLine;
                    }
                }
                lines.push(line);
                
                const startY = y - ((lines.length - 1) * lineHeight) / 2;
                lines.forEach((line, i) => {
                    ctx.fillText(line.trim(), x, startY + i * lineHeight);
                });
            }
            
            contains(x, y, scale, offsetX, offsetY) {
                const nodeX = this.x * scale + offsetX;
                const nodeY = this.y * scale + offsetY;
                const w = this.width * scale;
                const h = this.height * scale;
                
                return x >= nodeX - w/2 && x <= nodeX + w/2 &&
                       y >= nodeY - h/2 && y <= nodeY + h/2;
            }
        }
        
        // Create node renderers
        const nodes = mindMapData.nodes.map(n => new NodeRenderer(n));
        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        
        // Drawing function
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw connections
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 2 * scale;
            
            nodes.forEach(node => {
                if (node.parentId) {
                    const parent = nodeMap.get(node.parentId);
                    if (parent) {
                        ctx.beginPath();
                        ctx.moveTo(parent.x * scale + offsetX, parent.y * scale + offsetY);
                        ctx.lineTo(node.x * scale + offsetX, node.y * scale + offsetY);
                        ctx.stroke();
                    }
                }
            });
            
            // Draw nodes
            nodes.forEach(node => {
                node.draw(ctx, scale, offsetX, offsetY);
            });
            
            // Highlight hovered node
            if (hoveredNode) {
                const node = hoveredNode;
                const x = node.x * scale + offsetX;
                const y = node.y * scale + offsetY;
                const w = node.width * scale;
                const h = node.height * scale;
                
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 4 * scale;
                ctx.beginPath();
                ctx.roundRect(x - w/2 - 4, y - h/2 - 4, w + 8, h + 8, node.borderRadius * scale);
                ctx.stroke();
            }
        }
        
        // Mouse events
        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragStartX = e.clientX - offsetX;
            dragStartY = e.clientY - offsetY;
            canvas.style.cursor = 'grabbing';
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                offsetX = e.clientX - dragStartX;
                offsetY = e.clientY - dragStartY;
                draw();
            } else {
                // Check hover
                const prevHovered = hoveredNode;
                hoveredNode = null;
                
                for (let node of nodes) {
                    if (node.contains(e.clientX, e.clientY, scale, offsetX, offsetY)) {
                        hoveredNode = node;
                        canvas.style.cursor = 'pointer';
                        break;
                    }
                }
                
                if (!hoveredNode) {
                    canvas.style.cursor = 'default';
                }
                
                if (prevHovered !== hoveredNode) {
                    draw();
                }
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            isDragging = false;
            canvas.style.cursor = 'default';
        });
        
        canvas.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                scale *= delta;
                scale = Math.max(0.1, Math.min(5, scale));
                draw();
            }
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
                if (touchStartDistance > 0) {
                    scale *= distance / touchStartDistance;
                    scale = Math.max(0.1, Math.min(5, scale));
                    touchStartDistance = distance;
                    draw();
                }
            }
        });
        
        canvas.addEventListener('touchend', () => {
            isDragging = false;
            touchStartDistance = 0;
        });
        
        // Toolbar functions
        function zoomIn() {
            scale *= 1.2;
            scale = Math.min(5, scale);
            draw();
        }
        
        function zoomOut() {
            scale *= 0.8;
            scale = Math.max(0.1, scale);
            draw();
        }
        
        function resetView() {
            scale = 1;
            offsetX = canvas.width / 2 - mindMapData.mindMap.rootNodeId ? nodeMap.get(mindMapData.mindMap.rootNodeId).x : 0;
            offsetY = canvas.height / 2 - mindMapData.mindMap.rootNodeId ? nodeMap.get(mindMapData.mindMap.rootNodeId).y : 0;
            draw();
        }
        
        function exportAsPNG() {
            const link = document.createElement('a');
            link.download = mindMapData.mindMap.title + '.png';
            link.href = canvas.toDataURL();
            link.click();
        }
        
        // Center on load
        resetView();
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
   * Generate QR code for quick sharing
   */
  static async generateQRCode(url: string): Promise<string> {
    // Using qrcode.js library (needs to be installed)
    const QRCode = (await import('qrcode')).default;
    return QRCode.toDataURL(url, { width: 300 });
  }
}