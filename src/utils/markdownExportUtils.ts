import type { Node } from '../types';

function walkNode(
  nodeId: string,
  nodes: Map<string, Node>,
  childrenMap: Map<string, Node[]>,
  depth: number,
  lines: string[]
): void {
  const node = nodes.get(nodeId);
  if (!node) return;

  if (depth === 0) {
    lines.push(`# ${node.text}`);
  } else {
    const indent = '  '.repeat(depth - 1);
    lines.push(`${indent}- ${node.text}`);
  }

  const children = childrenMap.get(nodeId) || [];
  for (const child of children) {
    walkNode(child.id, nodes, childrenMap, depth + 1, lines);
  }
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToMarkdown(
  nodes: Map<string, Node>,
  onSuccess?: () => void
): void {
  const nodeArray = Array.from(nodes.values());

  // Build children lookup for O(n) walk instead of O(n^2)
  const childrenMap = new Map<string, Node[]>();
  for (const node of nodeArray) {
    if (node.parent) {
      const siblings = childrenMap.get(node.parent) || [];
      siblings.push(node);
      childrenMap.set(node.parent, siblings);
    }
  }

  const roots = nodeArray
    .filter((n) => n.parent === null)
    .sort((a, b) => a.text.localeCompare(b.text));

  const lines: string[] = [];
  roots.forEach((root) => {
    walkNode(root.id, nodes, childrenMap, 0, lines);
    lines.push('');
  });

  const markdown = lines.join('\n').trimEnd() + '\n';
  triggerDownload(markdown, `mindmap-${Date.now()}.md`, 'text/markdown');
  onSuccess?.();
}
